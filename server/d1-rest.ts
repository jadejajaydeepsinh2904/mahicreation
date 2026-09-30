import type {Database, QueryResult, Statement} from './database.js';
import {DatabaseError} from './database-error.js';

interface Query { sql: string; params: string[] }
interface D1Response {
  success: boolean;
  result?: (Partial<QueryResult> & {error?: unknown; errors?: {code?: number}[]})[];
  errors?: {code?: number; message?: string}[];
}

// D1's REST transport uses scalar JSON parameters. BLOB parameters are encoded
// as hex and bound through SQLite unhex(?), never interpolated into SQL text.
// Quoted strings/identifiers and SQL comments are left untouched.
export function encodeQuery(sql: string, values: unknown[]): Query {
  const params: string[] = [];
  let output = '', index = 0;
  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    if (ch === "'" || ch === '"' || ch === '`' || ch === '[') {
      const close = ch === '[' ? ']' : ch;
      output += ch;
      while (++i < sql.length) {
        output += sql[i];
        if (sql[i] === close) {
          if (close !== ']' && sql[i + 1] === close) output += sql[++i];
          else break;
        }
      }
    } else if (ch === '-' && sql[i + 1] === '-') {
      while (i < sql.length && sql[i] !== '\n') output += sql[i++];
      if (i < sql.length) output += '\n';
    } else if (ch === '/' && sql[i + 1] === '*') {
      const end = sql.indexOf('*/', i + 2);
      if (end < 0) throw new Error('Unterminated SQL comment');
      output += sql.slice(i, end + 2); i = end + 1;
    } else if (ch === '?') {
      if (/\d/.test(sql[i + 1] ?? '') || index >= values.length) throw new Error('Invalid SQL parameters');
      const value = values[index++];
      if (value instanceof ArrayBuffer || ArrayBuffer.isView(value)) {
        const bytes = value instanceof ArrayBuffer
          ? Buffer.from(value)
          : Buffer.from(value.buffer, value.byteOffset, value.byteLength);
        params.push(bytes.toString('hex')); output += 'unhex(?)';
      } else if (typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value))) {
        params.push(String(value)); output += '?';
      } else {
        throw new Error('Unsupported SQL parameter');
      }
    } else output += ch;
  }
  if (index !== values.length) throw new Error('Invalid SQL parameter count');
  return {sql: output, params};
}

export class D1RestDatabase implements Database {
  private readonly endpoint: string;
  private readonly token: string;
  constructor(accountID: string, databaseID: string, token: string) {
    if (!/^[a-f0-9]{32}$/i.test(accountID)) throw new DatabaseError('D1_ACCOUNT_FORMAT');
    if (!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(databaseID)) throw new DatabaseError('D1_DATABASE_FORMAT');
    // Accept a copied Authorization value or a quoted token without including
    // that formatting in the actual Bearer credential. Never accept a command.
    const unquote = (value: string) => ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))) ? value.slice(1, -1).trim() : value;
    this.token = unquote(unquote(token.trim()).replace(/^Bearer\s+/i, '').trim());
    if (!/^[A-Za-z0-9_-]+$/.test(this.token)) throw new DatabaseError('D1_TOKEN_FORMAT');
    this.endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountID}/d1/database/${databaseID}/query`;
  }
  prepare(sql: string): Statement { return new RestStatement(this, sql); }
  async batch(statements: Statement[]): Promise<QueryResult[]> {
    if (!statements.length) return [];
    const queries = statements.map(statement => {
      if (!(statement instanceof RestStatement) || statement.database !== this) throw new Error('Invalid D1 batch');
      return statement.query();
    });
    return this.execute(queries);
  }
  async execute(queries: Query[]): Promise<QueryResult[]> {
    // Do not retry writes automatically: the database may have committed before
    // an HTTP timeout. Expose a failure so the owner can check the saved data.
    let response: Response;
    try {
      response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {'Authorization': `Bearer ${this.token}`, 'Content-Type': 'application/json'},
        body: JSON.stringify(queries.length === 1 ? queries[0] : {batch: queries}),
        signal: AbortSignal.timeout(12000),
      });
    } catch (error) {
      throw new DatabaseError(error instanceof Error && ['AbortError', 'TimeoutError'].includes(error.name) ? 'D1_TIMEOUT' : 'D1_NETWORK');
    }
    let data: D1Response | undefined;
    try { data = await response.json() as D1Response; } catch (error) {
      if (error instanceof Error && ['AbortError', 'TimeoutError'].includes(error.name)) throw new DatabaseError('D1_TIMEOUT', response.status);
    }
    const code = Array.isArray(data?.errors) ? data.errors.find(e => e && Number.isSafeInteger(e.code))?.code : undefined;
    if (response.status === 401 || response.status === 403) throw new DatabaseError('D1_AUTH', response.status, code);
    if (response.status === 404) throw new DatabaseError('D1_NOT_FOUND', response.status, code);
    if (response.status === 429) throw new DatabaseError('D1_RATE_LIMIT', response.status, code);
    if (response.status >= 500) throw new DatabaseError('D1_UPSTREAM', response.status, code);
    if (!response.ok || data?.success === false) throw new DatabaseError('D1_REQUEST', response.status, code);
    if (data?.success !== true || !Array.isArray(data.result) ||
        data.result.some(row => !row || typeof row !== 'object' || Array.isArray(row))) throw new DatabaseError('D1_RESPONSE', response.status, code);
    const failed = data.result.find(row => row.success === false || row.error || (Array.isArray(row.errors) && row.errors.length));
    if (failed) throw new DatabaseError('D1_SQL', response.status, Array.isArray(failed.errors) ? failed.errors.find(e => e && Number.isSafeInteger(e.code))?.code ?? code : code);
    if (data.result.length !== queries.length || data.result.some(row => (row.success !== undefined && row.success !== true) ||
        (row.results !== undefined && !Array.isArray(row.results)))) throw new DatabaseError('D1_RESPONSE', response.status, code);
    // The documented per-query success and results fields are optional. The
    // envelope must still explicitly succeed, and explicit query errors fail.
    return data.result.map(row => ({success: true, meta: row.meta, results: row.results ?? []}));
  }
}

class RestStatement implements Statement {
  constructor(readonly database: D1RestDatabase, private readonly sql: string, private readonly values: unknown[] = []) {}
  bind(...values: unknown[]): Statement { return new RestStatement(this.database, this.sql, values); }
  query(): Query { return encodeQuery(this.sql, this.values); }
  async all<T = Record<string, unknown>>(): Promise<QueryResult<T>> {
    const [result] = await this.database.execute([this.query()]);
    return result as QueryResult<T>;
  }
  async first<T = Record<string, unknown>>(): Promise<T | null> { return (await this.all<T>()).results[0] ?? null; }
  async run(): Promise<QueryResult> { return this.all(); }
}
