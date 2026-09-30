import type {Database, QueryResult, Statement} from './database.js';

interface Query { sql: string; params: string[] }
interface D1Response {
  success: boolean;
  result?: QueryResult[];
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
  constructor(accountID: string, databaseID: string, private readonly token: string) {
    if (!/^[a-f0-9]{32}$/i.test(accountID) || !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(databaseID) || !token.trim()) {
      throw new Error('Invalid Cloudflare D1 configuration');
    }
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
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {'Authorization': `Bearer ${this.token}`, 'Content-Type': 'application/json'},
      body: JSON.stringify(queries.length === 1 ? queries[0] : {batch: queries}),
      signal: AbortSignal.timeout(12000),
    });
    const data = await response.json() as D1Response;
    if (!response.ok || !data.success || !Array.isArray(data.result) || data.result.length !== queries.length || data.result.some(row => !row.success)) {
      // Never log the token, request headers, query values or upstream response.
      throw new Error(`D1 query failed (HTTP ${response.status}, code ${data.errors?.[0]?.code ?? 'unknown'})`);
    }
    return data.result.map(row => ({...row, results: row.results ?? []}));
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
