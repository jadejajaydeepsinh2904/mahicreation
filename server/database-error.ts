// Only fixed labels and numeric status codes may leave the server. Never expose
// upstream bodies, SQL, parameters, tokens, owner details or exception stacks.
export type DatabaseErrorCode = 'D1_ACCOUNT_FORMAT' | 'D1_DATABASE_FORMAT' |
  'D1_TOKEN_FORMAT' | 'D1_AUTH' | 'D1_NOT_FOUND' | 'D1_RATE_LIMIT' |
  'D1_REQUEST' | 'D1_SQL' | 'D1_TIMEOUT' | 'D1_NETWORK' |
  'D1_UPSTREAM' | 'D1_RESPONSE' | 'DATABASE_ERROR';

const messages: Record<DatabaseErrorCode, string> = {
  D1_ACCOUNT_FORMAT: 'Vercelમાં CLOUDFLARE_ACCOUNT_IDનું format ખોટું છે. Cloudflareનો 32 અક્ષરનો Account ID મૂકો અને Redeploy કરો.',
  D1_DATABASE_FORMAT: 'Vercelમાં CLOUDFLARE_DATABASE_IDનું format ખોટું છે. D1માંથી આખો Database ID copy કરો અને Redeploy કરો.',
  D1_TOKEN_FORMAT: 'Vercelમાં CLOUDFLARE_D1_TOKENની Valueમાં ફક્ત API token મૂકો અને Redeploy કરો.',
  D1_AUTH: 'Cloudflareએ databaseનો access નકાર્યો છે. આ deploymentમાં CLOUDFLARE_D1_TOKENની સાચી value અને તેના Account → D1 → Edit access ચકાસો.',
  D1_NOT_FOUND: 'આ Account ID અને Database ID માટે database મળતો નથી અથવા tokenને તેનો access નથી.',
  D1_RATE_LIMIT: 'Cloudflareએ થોડા સમય માટે request મર્યાદિત કરી છે. થોડી વાર પછી ફરી પ્રયત્ન કરો.',
  D1_REQUEST: 'Cloudflareએ database request સ્વીકારી નથી. નીચેનો error code મોકલો જેથી request સુધારી શકાય.',
  D1_SQL: 'Databaseની query ચલાવવામાં ભૂલ આવી છે. નીચેનો error code મોકલો જેથી query સુધારી શકાય.',
  D1_TIMEOUT: 'Cloudflare databaseનો જવાબ સમયસર મળ્યો નથી. ફરી પ્રયત્ન કરો.',
  D1_NETWORK: 'આ hosting serverથી Cloudflare API સુધી request પહોંચી શકી નથી. નીચેનો error code મોકલો.',
  D1_UPSTREAM: 'Cloudflare database serviceએ error આપ્યો છે. થોડી વાર પછી ફરી પ્રયત્ન કરો.',
  D1_RESPONSE: 'Cloudflareના database જવાબનું format અપેક્ષા મુજબ નથી. નીચેનો error code મોકલો.',
  DATABASE_ERROR: 'દુકાનનું database કામ પૂર્ણ થયું નથી. નીચેનો error code મોકલો.',
};

export class DatabaseError extends Error {
  readonly httpStatus?: number;
  readonly upstreamCode?: number;
  constructor(readonly code: DatabaseErrorCode, httpStatus?: number, upstreamCode?: number) {
    super(code);
    this.name = 'DatabaseError';
    this.httpStatus = Number.isInteger(httpStatus) && httpStatus! >= 100 && httpStatus! <= 599 ? httpStatus : undefined;
    this.upstreamCode = Number.isSafeInteger(upstreamCode) && upstreamCode! >= 0 ? upstreamCode : undefined;
  }
}

export function databaseFailure(error: unknown, stage: string) {
  const e = error instanceof DatabaseError ? error : new DatabaseError('DATABASE_ERROR');
  const safeStage = ['configuration', 'schema', 'admin', 'catalog', 'media', 'write', 'request'].includes(stage) ? stage : 'request';
  const detail = {stage: safeStage, code: e.code, httpStatus: e.httpStatus, upstreamCode: e.upstreamCode};
  const reference = [safeStage.toUpperCase(), e.code, e.httpStatus ? `HTTP ${e.httpStatus}` : '',
    e.upstreamCode !== undefined ? `CF ${e.upstreamCode}` : ''].filter(Boolean).join(' | ');
  return {detail, error: `${messages[e.code]} [${reference}]`};
}
