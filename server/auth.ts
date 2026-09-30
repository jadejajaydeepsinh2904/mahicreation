import type {Database} from './database.js';

export interface AuthEnv {DB: Database; ADMIN_EMAIL?: string; ADMIN_PASSWORD?: string}
interface Owner {email:string; password_hash:string; salt:string; iterations:number}
const json = (data:unknown,status=200,headers:Record<string,string>={}) => Response.json(data,{status,headers:{'Cache-Control':'no-store',...headers}});
const hex = (bytes:Uint8Array) => Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('');
export async function digest(value:string) {return hex(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))));}
async function equal(a:string,b:string) {
  const [left,right]=await Promise.all([digest(a),digest(b)]);
  let diff=0; for(let i=0;i<left.length;i++) diff|=left.charCodeAt(i)^right.charCodeAt(i);
  return diff===0;
}
async function hashPassword(password:string,salt:string,iterations=100000) {
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
  const bytes=await crypto.subtle.deriveBits({name:'PBKDF2',salt:new TextEncoder().encode(salt),iterations,hash:'SHA-256'},key,256);
  return hex(new Uint8Array(bytes));
}
export function originOK(r:Request) {
  const origin=r.headers.get('Origin');
  return r.headers.get('Sec-Fetch-Site')!=='cross-site' && (!origin||origin===new URL(r.url).origin);
}
function tokenFrom(r:Request) {
  return (r.headers.get('Cookie')??'').split(';').map(x=>x.trim()).find(x=>x.startsWith('mahi_admin='))?.slice(11)??'';
}
const cookie=(token:string,secure:boolean,age=28800)=>`mahi_admin=${token}; HttpOnly; Path=/; SameSite=Strict; Max-Age=${age}${secure?'; Secure':''}`;
async function owner(env:AuthEnv) {return env.DB.prepare("SELECT email,password_hash,salt,iterations FROM owner_credentials WHERE id='owner'").first<Owner>();}
function legacy(env:AuthEnv) {return !!env.ADMIN_PASSWORD&&!!env.ADMIN_EMAIL&&env.ADMIN_EMAIL!=='CHANGE_TO_YOUR_EMAIL';}
async function sessionHash(token:string,account:Owner|null) {
  // Password changes invalidate sessions immediately, including concurrent sessions.
  return digest(account?token+':'+account.password_hash:token);
}
export async function isAdmin(r:Request,env:AuthEnv) {
  const token=tokenFrom(r); if(!/^[a-f0-9]{64}$/.test(token))return false;
  const account=await owner(env); if(!account&&!legacy(env))return false;
  const row=await env.DB.prepare('SELECT expires_at FROM sessions WHERE token_hash=?').bind(await sessionHash(token,account)).first<{expires_at:number}>();
  return !!row&&row.expires_at>Date.now();
}
export async function shopConfigured(env:AuthEnv) {return !!await owner(env)||legacy(env);}
async function issueSession(r:Request,env:AuthEnv,account:Owner|null) {
  const token=hex(crypto.getRandomValues(new Uint8Array(32))),now=Date.now();
  await env.DB.batch([
    env.DB.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(now),
    env.DB.prepare('DELETE FROM login_attempts WHERE expires_at < ?').bind(now),
    env.DB.prepare('INSERT INTO sessions(token_hash,expires_at) VALUES (?,?)').bind(await sessionHash(token,account),now+28800000),
  ]);
  return json({ok:true},200,{'Set-Cookie':cookie(token,new URL(r.url).protocol==='https:')});
}
async function rateLimit(r:Request,env:AuthEnv) {
  const now=Date.now(),ip=r.headers.get('CF-Connecting-IP')??'local',bucket=Math.floor(now/900000);
  const row=await env.DB.prepare('INSERT INTO login_attempts(id,attempts,expires_at) VALUES (?,1,?) ON CONFLICT(id) DO UPDATE SET attempts=attempts+1 RETURNING attempts')
    .bind(await digest(ip+':'+bucket),now+900000).first<{attempts:number}>();
  return (row?.attempts??99)>10;
}
export function normalizePhone(value:unknown) {
  if(typeof value!=='string')return '';
  let phone=value.replace(/[૦-૯]/g,d=>String(d.charCodeAt(0)-0xAE6)).replace(/[०-९]/g,d=>String(d.charCodeAt(0)-0x966)).replace(/[\s()+-]/g,'');
  if(phone.length===10&&/^[6-9]\d{9}$/.test(phone))phone='91'+phone;
  return phone;
}
export const validPhone=(value:string)=>/^[1-9]\d{9,14}$/.test(value);
const validEmail=(value:unknown):value is string=>typeof value==='string'&&value.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const validPassword=(value:unknown):value is string=>typeof value==='string'&&value.length>=12&&value.length<=200;

export async function handleAdmin(r:Request,env:AuthEnv):Promise<Response> {
  const account=await owner(env);
  if(r.method==='GET') {
    const authenticated=await isAdmin(r,env);
    return json({authenticated,needsSetup:!account&&!legacy(env),setupAvailable:!account&&!!env.ADMIN_PASSWORD,recoveryAvailable:!!env.ADMIN_PASSWORD,email:authenticated?(account?.email??env.ADMIN_EMAIL):undefined});
  }
  if(!originOK(r))return json({error:'આ વિનંતી માન્ય નથી. સાઇટ ફરી ખોલો.'},403);
  if(r.method==='DELETE') {
    const token=tokenFrom(r);
    if(token)await env.DB.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await sessionHash(token,account)).run();
    return json({ok:true},200,{'Set-Cookie':cookie('',new URL(r.url).protocol==='https:',0)});
  }
  if(r.method!=='POST')return json({error:'Method not allowed'},405);
  if(!r.headers.get('Content-Type')?.includes('application/json'))return json({error:'Invalid request'},415);
  if(Number(r.headers.get('Content-Length')??0)>12000)return json({error:'Request too large'},413);
  let p:Record<string,unknown>;
  try{p=await r.json() as Record<string,unknown>;if(!p||Array.isArray(p))throw Error();}catch{return json({error:'ફોર્મની વિગતો ફરી ભરો.'},400);}
  if(await rateLimit(r,env))return json({error:'ઘણા પ્રયત્ન થયા છે. 15 મિનિટ પછી ફરી પ્રયત્ન કરો.'},429);
  const action=p.action??'login';
  if(action==='setup'||action==='recover') {
    if(action==='setup'&&account)return json({error:'દુકાનનું setup થઈ ગયું છે. હવે લોગિન કરો.'},409);
    if(!env.ADMIN_PASSWORD)return json({error:'પહેલાં hostingમાં ADMIN_PASSWORD નામનો Secret સેટ કરો.'},503);
    if(typeof p.setupKey!=='string'||p.setupKey.length>500||!await equal(p.setupKey,env.ADMIN_PASSWORD))return json({error:'Setup / recovery code સાચો નથી.'},401);
    if(!validEmail(p.email)||!validPassword(p.password))return json({error:'સાચો email અને ઓછામાં ઓછા 12 અક્ષરનો password આપો.'},400);
    if(action==='recover'&&!account&&!legacy(env))return json({error:'પહેલાં દુકાનનું setup કરો.'},409);
    const phone=normalizePhone(p.phone);
    if(action==='setup'&&!validPhone(phone))return json({error:'દુકાનનો સાચો WhatsApp નંબર આપો.'},400);
    const salt=hex(crypto.getRandomValues(new Uint8Array(16))),password_hash=await hashPassword(p.password,salt);
    const newOwner={email:p.email.trim().toLowerCase(),password_hash,salt,iterations:100000};
    if(action==='setup') {
      await env.DB.batch([
        env.DB.prepare("INSERT OR IGNORE INTO owner_credentials(id,email,password_hash,salt,iterations,updated_at) VALUES ('owner',?,?,?,?,?)").bind(newOwner.email,password_hash,salt,100000,Date.now()),
        env.DB.prepare("INSERT INTO settings(id,phone,address) SELECT 'shop',?,? WHERE EXISTS (SELECT 1 FROM owner_credentials WHERE id='owner' AND salt=?) ON CONFLICT(id) DO UPDATE SET phone=excluded.phone,address=excluded.address").bind(phone,String(p.address??'').slice(0,500),salt),
      ]);
      const saved=await owner(env);
      if(saved?.salt!==salt)return json({error:'Setup બીજી વિનંતીમાં થઈ ગયું છે. હવે લોગિન કરો.'},409);
    } else {
      await env.DB.batch([
        env.DB.prepare("INSERT INTO owner_credentials(id,email,password_hash,salt,iterations,updated_at) VALUES ('owner',?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET email=excluded.email,password_hash=excluded.password_hash,salt=excluded.salt,iterations=excluded.iterations,updated_at=excluded.updated_at").bind(newOwner.email,password_hash,salt,100000,Date.now()),
        env.DB.prepare('DELETE FROM sessions'),
      ]);
    }
    return issueSession(r,env,newOwner);
  }
  if(action==='password') {
    if(!await isAdmin(r,env))return json({error:'ફરી લોગિન કરો.'},401);
    if(typeof p.currentPassword!=='string'||p.currentPassword.length>500||!validEmail(p.email)||!validPassword(p.password))return json({error:'સાચો email, હાલનો password અને 12 અક્ષરનો નવો password આપો.'},400);
    const correct=account?await equal(await hashPassword(p.currentPassword,account.salt,account.iterations),account.password_hash):await equal(p.currentPassword,env.ADMIN_PASSWORD??'');
    if(!correct)return json({error:'હાલનો password સાચો નથી.'},401);
    const salt=hex(crypto.getRandomValues(new Uint8Array(16))),password_hash=await hashPassword(p.password,salt);
    const changed={email:p.email.trim().toLowerCase(),password_hash,salt,iterations:100000};
    await env.DB.batch([
      env.DB.prepare("INSERT INTO owner_credentials(id,email,password_hash,salt,iterations,updated_at) VALUES ('owner',?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET email=excluded.email,password_hash=excluded.password_hash,salt=excluded.salt,iterations=excluded.iterations,updated_at=excluded.updated_at").bind(changed.email,password_hash,salt,100000,Date.now()),
      env.DB.prepare('DELETE FROM sessions'),
    ]);
    return issueSession(r,env,changed);
  }
  if(action!=='login')return json({error:'Invalid action'},400);
  if(!account&&!legacy(env))return json({error:'પહેલી વાર દુકાનનું setup કરો.'},409);
  if(typeof p.email!=='string'||typeof p.password!=='string'||p.password.length>500)return json({error:'Email અથવા password સાચો નથી.'},401);
  const correct=account?await equal(await hashPassword(p.password,account.salt,account.iterations),account.password_hash):await equal(p.password,env.ADMIN_PASSWORD??'');
  if(!correct||p.email.trim().toLowerCase()!==(account?.email??env.ADMIN_EMAIL??'').trim().toLowerCase())return json({error:'Email અથવા password સાચો નથી.'},401);
  return issueSession(r,env,account);
}
