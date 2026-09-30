interface Env {DB:D1Database;ASSETS:Fetcher;ADMIN_EMAIL:string;ADMIN_PASSWORD?:string}
const categories=['Sarees','Clothing','Jewellery','Accessories','Bags','Other'];
const json=(data:unknown,status=200,headers:Record<string,string>={})=>Response.json(data,{status,headers:{'Cache-Control':'no-store',...headers}});
async function digest(text:string){const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)));return Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('');}
function tokenFrom(r:Request){const value=(r.headers.get('Cookie')??'').split(';').map(x=>x.trim()).find(x=>x.startsWith('mahi_admin='));if(!value)return '';try{return decodeURIComponent(value.slice(11));}catch{return '';}}
function originOK(r:Request){const origin=r.headers.get('Origin');return !origin||origin===new URL(r.url).origin;}
async function admin(r:Request,env:Env){const token=tokenFrom(r);if(!/^[a-f0-9]{64}$/.test(token)||!env.ADMIN_PASSWORD)return false;const row=await env.DB.prepare('SELECT expires_at FROM sessions WHERE token_hash=?').bind(await digest(token)).first<{expires_at:number}>();return !!row&&row.expires_at>Date.now();}
async function guard(r:Request,env:Env){if(!originOK(r))return json({error:'Invalid request origin'},403);if(!await admin(r,env))return json({error:'દુકાનનું લોગિન ફરી કરો. Please sign in at /admin.'},403);return null;}
const sessionCookie=(token:string,secure:boolean,age=28800)=>`mahi_admin=${token}; HttpOnly; Path=/; SameSite=Strict; Max-Age=${age}${secure?'; Secure':''}`;
async function removeUnusedImage(image:string,env:Env){if(!image.startsWith('/api/media/'))return;const ref=await env.DB.prepare('SELECT id FROM products WHERE image=? LIMIT 1').bind(image).first();if(!ref)await env.DB.prepare('DELETE FROM images WHERE id=?').bind(image.slice(11)).run();}
export default {
 async fetch(r:Request,env:Env,ctx:ExecutionContext):Promise<Response>{
 const url=new URL(r.url),path=url.pathname;
 if(!path.startsWith('/api/'))return env.ASSETS.fetch(r);
 try{
 if(!env.DB)return json({error:'Add the Cloudflare D1 binding as explained in README.md.'},503);
 if(path==='/api/catalog'&&r.method==='GET'){
 const [rows,settings,isAdmin]=await Promise.all([env.DB.prepare('SELECT * FROM products ORDER BY created_at DESC').all(),env.DB.prepare('SELECT * FROM settings WHERE id=?').bind('shop').first(),admin(r,env)]);
 return json({products:rows.results,settings:settings??{phone:'',address:''},admin:isAdmin});
 }
 if(path==='/api/admin'&&r.method==='POST'){
 if(!originOK(r))return json({error:'Invalid request origin'},403);
 if(!env.ADMIN_PASSWORD||!env.ADMIN_EMAIL||env.ADMIN_EMAIL==='CHANGE_TO_YOUR_EMAIL')return json({error:'First set ADMIN_EMAIL and the ADMIN_PASSWORD secret in Cloudflare.'},503);
 const p=await r.json() as {email?:unknown,password?:unknown};
 if(typeof p.email!=='string'||typeof p.password!=='string'||p.password.length>500)return json({error:'Incorrect email or password.'},401);
 const now=Date.now(),ip=r.headers.get('CF-Connecting-IP')??'local',bucket=Math.floor(now/900000),attemptID=await digest(ip+':'+bucket);
 const result=await env.DB.prepare('INSERT INTO login_attempts (id,attempts,expires_at) VALUES (?,1,?) ON CONFLICT(id) DO UPDATE SET attempts=attempts+1 RETURNING attempts').bind(attemptID,now+900000).first<{attempts:number}>();
 if((result?.attempts??99)>10)return json({error:'Too many attempts. Try again after 15 minutes.'},429);
 const [a,b]=await Promise.all([digest(p.password),digest(env.ADMIN_PASSWORD)]);let different=0;for(let i=0;i<a.length;i++)different|=a.charCodeAt(i)^b.charCodeAt(i);
 if(different||p.email.toLowerCase()!==env.ADMIN_EMAIL.toLowerCase())return json({error:'Incorrect email or password.'},401);
 const token=Array.from(crypto.getRandomValues(new Uint8Array(32)),v=>v.toString(16).padStart(2,'0')).join('');
 await env.DB.batch([env.DB.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(now),env.DB.prepare('DELETE FROM login_attempts WHERE expires_at < ?').bind(now),env.DB.prepare('INSERT INTO sessions(token_hash,expires_at) VALUES (?,?)').bind(await digest(token),now+28800000)]);
 return json({ok:true},200,{'Set-Cookie':sessionCookie(token,url.protocol==='https:')});
 }
 if(path==='/api/admin'&&r.method==='DELETE'){
 if(!originOK(r))return json({error:'Invalid request origin'},403);const token=tokenFrom(r);if(token)await env.DB.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await digest(token)).run();return json({ok:true},200,{'Set-Cookie':sessionCookie('',url.protocol==='https:',0)});
 }
 if(path.startsWith('/api/media/')&&r.method==='GET'){
 const key=path.slice(11);if(!/^[a-zA-Z0-9.-]+$/.test(key))return new Response('Not found',{status:404});
 const cache=(caches as unknown as {default:Cache}).default;
 const cacheKey=new Request(url.toString(),{method:'GET'});const cached=await cache.match(cacheKey);if(cached)return cached;
 const image=await env.DB.prepare('SELECT bytes,mime FROM images WHERE id=?').bind(key).first<{bytes:number[],mime:string}>();if(!image)return new Response('Not found',{status:404});
 const response=new Response(new Uint8Array(image.bytes),{headers:{'Content-Type':image.mime,'Cache-Control':'public,max-age=31536000,immutable','X-Content-Type-Options':'nosniff'}});ctx.waitUntil(cache.put(cacheKey,response.clone()));return response;
 }
 if(['/api/products','/api/settings','/api/upload'].includes(path)){
 const allowed=path==='/api/products'?['POST','DELETE']:['POST'];if(!allowed.includes(r.method))return json({error:'Method not allowed'},405);
 const blocked=await guard(r,env);if(blocked)return blocked;
 if(path==='/api/products'&&r.method==='POST'){
 const p=await r.json() as Record<string,unknown>;
 if(!p||typeof p.name!=='string'||!p.name.trim()||p.name.length>150||typeof p.category!=='string'||!categories.includes(p.category)||typeof p.price!=='number'||!Number.isFinite(p.price)||p.price<0||p.price>1e8)return json({error:'Enter a product name, category and valid price.'},400);
 const image=typeof p.image==='string'?p.image:'';if(image&&!/^\/api\/media\/[a-zA-Z0-9.-]+$/.test(image))return json({error:'Upload a product photo first.'},400);
 if(image&&!await env.DB.prepare('SELECT id FROM images WHERE id=?').bind(image.slice(11)).first())return json({error:'Photo is missing. Upload it again.'},400);
 const id=typeof p.id==='string'?p.id:crypto.randomUUID();const gu=String(p.nameGu??'').slice(0,150),description=String(p.description??'').slice(0,2000);
 if(p.id){const old=await env.DB.prepare('SELECT id,image FROM products WHERE id=?').bind(id).first<{id:string,image:string}>();if(!old)return json({error:'Product no longer exists'},404);await env.DB.prepare('UPDATE products SET name=?,name_gu=?,category=?,price=?,description=?,image=?,in_stock=? WHERE id=?').bind(p.name.trim(),gu,p.category,p.price,description,image,p.inStock?1:0,id).run();if(old.image!==image)await removeUnusedImage(old.image,env);
 }else await env.DB.prepare('INSERT INTO products(id,name,name_gu,category,price,description,image,in_stock,created_at) VALUES (?,?,?,?,?,?,?,?,?)').bind(id,p.name.trim(),gu,p.category,p.price,description,image,p.inStock?1:0,Date.now()).run();return json({id});
 }
 if(path==='/api/products'&&r.method==='DELETE'){
 const p=await r.json() as {id?:unknown};if(typeof p.id!=='string')return json({error:'Invalid product'},400);const old=await env.DB.prepare('SELECT image FROM products WHERE id=?').bind(p.id).first<{image:string}>();await env.DB.prepare('DELETE FROM products WHERE id=?').bind(p.id).run();if(old?.image)await removeUnusedImage(old.image,env);return json({ok:true});
 }
 if(path==='/api/settings'){
 const p=await r.json() as {phone?:unknown,address?:unknown};const phone=String(p.phone??'').replace(/[\s()+-]/g,'');if(phone&&!/^\d{10,15}$/.test(phone))return json({error:'Enter a valid WhatsApp number.'},400);await env.DB.prepare('INSERT INTO settings(id,phone,address) VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET phone=excluded.phone,address=excluded.address').bind('shop',phone.length===10?'91'+phone:phone,String(p.address??'').slice(0,500)).run();return json({ok:true});
 }
 if(path==='/api/upload'){
 const f=(await r.formData()).get('file');if(!(f instanceof File)||f.type!=='image/jpeg'||f.size>180*1024||f.size<4)return json({error:'Choose a photo. The website automatically optimizes it for free storage.'},400);
 const bytes=await f.arrayBuffer(),head=new Uint8Array(bytes);if(head[0]!==255||head[1]!==216)return json({error:'Invalid photo.'},400);
 const key=crypto.randomUUID()+'.jpg';await env.DB.prepare('INSERT INTO images(id,bytes,mime,created_at) VALUES(?,?,?,?)').bind(key,bytes,'image/jpeg',Date.now()).run();
 await env.DB.prepare("DELETE FROM images WHERE created_at < ? AND NOT EXISTS (SELECT 1 FROM products WHERE products.image = '/api/media/' || images.id)").bind(Date.now()-86400000).run();return json({image:'/api/media/'+key});
 }
 }
 return json({error:'Not found'},404);
 }catch(e){console.error('MAHI API error',e);return json({error:'Could not connect or save. Please try again. Check D1 setup if this is your first deploy.'},503);}
 }
} satisfies ExportedHandler<Env>;
