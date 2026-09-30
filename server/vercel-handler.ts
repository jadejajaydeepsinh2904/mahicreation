import worker from '../worker/index.js';
import {D1RestDatabase} from './d1-rest.js';

export async function handle(request: Request, path?: string): Promise<Response> {
  const required = ['CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_DATABASE_ID', 'CLOUDFLARE_D1_TOKEN', 'ADMIN_EMAIL', 'ADMIN_PASSWORD'] as const;
  if (required.some(name => !process.env[name]?.trim())) {
    return Response.json({error: 'દુકાનનું setup બાકી છે. VERCEL_SETUP.md મુજબ database અને loginની 5 Environment Variables ઉમેરો, પછી Redeploy કરો.'}, {status: 503, headers: {'Cache-Control': 'no-store'}});
  }
  try {
    const DB = new D1RestDatabase(process.env.CLOUDFLARE_ACCOUNT_ID!.trim(), process.env.CLOUDFLARE_DATABASE_ID!.trim(), process.env.CLOUDFLARE_D1_TOKEN!.trim());
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
      ADMIN_EMAIL: process.env.ADMIN_EMAIL!.trim(),
      ADMIN_PASSWORD: process.env.ADMIN_PASSWORD!,
    }, {waitUntil: () => {}});
  } catch {
    console.error('MAHI: check the server-side D1 environment settings.');
    return Response.json({error: 'દુકાન સાથે જોડાઈ શકાતું નથી. Database settings તપાસો અને ફરી પ્રયત્ન કરો.'}, {status: 503, headers: {'Cache-Control': 'no-store'}});
  }
}
