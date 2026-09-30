import worker from '../worker/index.js';
import {D1RestDatabase} from './d1-rest.js';
let cachedDatabase: {configuration:string; db:D1RestDatabase}|undefined;

export async function handle(request: Request, path?: string): Promise<Response> {
  const required = ['CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_DATABASE_ID', 'CLOUDFLARE_D1_TOKEN'] as const;
  if (required.some(name => !process.env[name]?.trim())) {
    return Response.json({error: (path??new URL(request.url).pathname)==='/api/admin'?'Vercelમાં databaseનું જોડાણ બાકી છે. VERCEL_SETUP.md મુજબ 3 D1 Environment Variables સેટ કરો.':'દુકાન અત્યારે લોડ થઈ શકતી નથી. થોડા સમય પછી પ્રયત્ન કરો.'}, {status: 503, headers: {'Cache-Control': 'no-store'}});
  }
  try {
    const configuration=JSON.stringify(required.map(name=>process.env[name]!.trim()));
    if(cachedDatabase?.configuration!==configuration)cachedDatabase={configuration,db:new D1RestDatabase(process.env.CLOUDFLARE_ACCOUNT_ID!.trim(), process.env.CLOUDFLARE_DATABASE_ID!.trim(), process.env.CLOUDFLARE_D1_TOKEN!.trim())};
    const DB=cachedDatabase.db;
    const url = new URL(request.url);
    if (path) url.pathname = path;
    const headers = new Headers(request.headers);
    // Vercel supplies the forwarded client IP. Never trust a client-supplied
    // CF-Connecting-IP header on a Node/Vercel deployment.
    headers.set('CF-Connecting-IP', process.env.VERCEL === '1'
      ? (headers.get('x-vercel-forwarded-for') ?? headers.get('x-forwarded-for') ?? 'unknown').split(',')[0].trim()
      : 'local');
    const forwarded = new Request(new Request(url, request), {headers});
    return await worker.fetch(forwarded, {
      DB,
      D1_REST: true,
      ASSETS: {fetch: async () => new Response('Not found', {status: 404})},
      ADMIN_EMAIL: process.env.ADMIN_EMAIL?.trim()??'',
      ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    }, {waitUntil: () => {}});
  } catch {
    console.error('MAHI: check the server-side D1 environment settings.');
    return Response.json({error: 'દુકાન સાથે જોડાઈ શકાતું નથી. Database settings તપાસો અને ફરી પ્રયત્ન કરો.'}, {status: 503, headers: {'Cache-Control': 'no-store'}});
  }
}
