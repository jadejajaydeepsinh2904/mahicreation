import type {Database} from '../server/database.js';
import {ensureSchema} from '../server/schema.js';
import {handleAdmin,isAdmin,originOK,shopConfigured,normalizePhone,validPhone} from '../server/auth.js';
import {databaseFailure} from '../server/database-error.js';
import {MAX_PRODUCT_PHOTOS,productImages} from '../shared/product-images.js';
interface Env {DB:Database;ASSETS:{fetch(request:Request):Promise<Response>};ADMIN_EMAIL:string;ADMIN_PASSWORD?:string;D1_REST?:boolean}
interface Context {waitUntil(promise:Promise<unknown>):void}
const categories=['Sarees','Clothing','Jewellery','Accessories','Bags','Other'];
const json=(data:unknown,status=200,headers:Record<string,string>={})=>Response.json(data,{status,headers:{'Cache-Control':'no-store',...headers}});
async function guard(r:Request,env:Env){if(!originOK(r))return json({error:'Invalid request origin'},403);if(!await isAdmin(r,env))return json({error:'દુકાનનું લોગિન ફરી કરો. Please sign in at /admin.'},401);return null;}
async function savedImages(id:string,image:string,env:Env){const rows=await env.DB.prepare('SELECT image FROM product_images WHERE product_id=? ORDER BY position').bind(id).all<{image:string}>();return productImages({image,images:rows.results.map(row=>row.image)});}
async function removeUnusedImages(images:string[],env:Env){const statements=[...new Set(images)].filter(image=>image.startsWith('/api/media/')).map(image=>env.DB.prepare('DELETE FROM images WHERE id=? AND NOT EXISTS (SELECT 1 FROM products WHERE image=?) AND NOT EXISTS (SELECT 1 FROM product_images WHERE image=?)').bind(image.slice(11),image,image));if(statements.length)await env.DB.batch(statements);}
export default {
 async fetch(r:Request,env:Env,ctx:Context):Promise<Response>{
 const url=new URL(r.url),path=url.pathname;
 if(!path.startsWith('/api/'))return env.ASSETS.fetch(r);
 let stage='schema';
 try{
 if(!env.DB)return json({error:path==='/api/admin'?'Cloudflareમાં DB નામનું D1 binding જોડવાનું બાકી છે.':'દુકાન અત્યારે લોડ થઈ શકતી નથી. થોડી વાર પછી પ્રયત્ન કરો.',code:'DATABASE_NOT_READY'},503);
 await ensureSchema(env.DB);
 stage=path==='/api/admin'?'admin':path==='/api/catalog'?'catalog':path.startsWith('/api/media/')?'media':'write';
 if(path==='/api/admin')return await handleAdmin(r,env);
 if(path==='/api/catalog'&&r.method==='GET'){
 const [rows,photos,settings,authenticated,configured]=await Promise.all([env.DB.prepare('SELECT * FROM products ORDER BY created_at DESC').all<{id:string,image:string}>(),env.DB.prepare('SELECT product_id,image FROM product_images ORDER BY product_id,position').all<{product_id:string,image:string}>(),env.DB.prepare('SELECT * FROM settings WHERE id=?').bind('shop').first<{phone:string,address:string}>(),isAdmin(r,env),shopConfigured(env)]);
 const galleries=new Map<string,string[]>();for(const photo of photos.results){const gallery=galleries.get(photo.product_id)??[];gallery.push(photo.image);galleries.set(photo.product_id,gallery);}
 return json({products:rows.results.map(p=>({...p,images:productImages({image:p.image,images:galleries.get(p.id)})})),settings:settings??{phone:'',address:''},admin:authenticated,demo:!configured&&!rows.results.length&&!settings?.phone});
 }
 if(path.startsWith('/api/media/')&&r.method==='GET'){
 const key=path.slice(11);if(!/^[a-zA-Z0-9.-]+$/.test(key))return new Response('Not found',{status:404});
 const cache=typeof caches==='undefined'?undefined:(caches as unknown as {default?:Cache}).default;
 const cacheKey=new Request(url.toString(),{method:'GET'});const cached=await cache?.match(cacheKey);if(cached)return cached;
 const image=await env.DB.prepare(env.D1_REST?'SELECT hex(bytes) AS bytes_hex,mime FROM images WHERE id=?':'SELECT bytes,mime FROM images WHERE id=?').bind(key).first<{bytes?:number[],bytes_hex?:string,mime:string}>();if(!image)return new Response('Not found',{status:404});
 const bytes=env.D1_REST?Uint8Array.from(image.bytes_hex?.match(/.{2}/g)??[],pair=>parseInt(pair,16)):new Uint8Array(image.bytes??[]);
 const response=new Response(bytes,{headers:{'Content-Type':image.mime,'Cache-Control':'public,max-age=31536000,immutable','X-Content-Type-Options':'nosniff'}});if(cache)ctx.waitUntil(cache.put(cacheKey,response.clone()));return response;
 }
 if(['/api/products','/api/settings','/api/upload'].includes(path)){
 const allowed=path==='/api/products'?['POST','DELETE']:['POST'];if(!allowed.includes(r.method))return json({error:'Method not allowed'},405);
 const blocked=await guard(r,env);if(blocked)return blocked;
 if(path!=='/api/upload'&&!r.headers.get('Content-Type')?.includes('application/json'))return json({error:'Invalid request'},415);
 if(Number(r.headers.get('Content-Length')??0)>(path==='/api/upload'?220000:16000))return json({error:'Request too large'},413);
 if(path==='/api/products'&&r.method==='POST'){
 const p=await r.json() as Record<string,unknown>;
 if(!p||typeof p.name!=='string'||!p.name.trim()||p.name.length>150||typeof p.category!=='string'||!categories.includes(p.category)||typeof p.price!=='number'||!Number.isFinite(p.price)||p.price<0||p.price>1e8)return json({error:'Enter a product name, category and valid price.'},400);
 const id=typeof p.id==='string'?p.id:crypto.randomUUID();const gu=String(p.nameGu??'').slice(0,150),description=String(p.description??'').slice(0,2000);
 const old=p.id?await env.DB.prepare('SELECT id,image FROM products WHERE id=?').bind(id).first<{id:string,image:string}>():null;if(p.id&&!old)return json({error:'Product no longer exists'},404);
 const previous=old?await savedImages(id,old.image,env):[];
 // Older clients that only edit text must not silently remove the gallery.
 const requested=p.images!==undefined?p.images:old&&(p.image===undefined||p.image===old.image)?previous:typeof p.image==='string'&&p.image?[p.image]:[];
 if(!Array.isArray(requested)||requested.length>MAX_PRODUCT_PHOTOS||requested.some(image=>typeof image!=='string'||!/^\/api\/media\/[a-zA-Z0-9.-]+$/.test(image))||new Set(requested).size!==requested.length)return json({error:'વધુમાં વધુ 8 અલગ ફોટા પસંદ કરો. Choose up to 8 different uploaded photos.'},400);
 const images=requested as string[],image=images[0]??'';
 if(images.length){const found=await env.DB.prepare(`SELECT id FROM images WHERE id IN (${images.map(()=>'?').join(',')})`).bind(...images.map(image=>image.slice(11))).all();if(found.results.length!==images.length)return json({error:'ફોટો મળ્યો નથી. ફરી અપલોડ કરો. A photo is missing; upload it again.'},400);}
 const write=old?env.DB.prepare('UPDATE products SET name=?,name_gu=?,category=?,price=?,description=?,image=?,in_stock=? WHERE id=?').bind(p.name.trim(),gu,p.category,p.price,description,image,p.inStock?1:0,id):env.DB.prepare('INSERT INTO products(id,name,name_gu,category,price,description,image,in_stock,created_at) VALUES (?,?,?,?,?,?,?,?,?)').bind(id,p.name.trim(),gu,p.category,p.price,description,image,p.inStock?1:0,Date.now());
 await env.DB.batch([write,env.DB.prepare('DELETE FROM product_images WHERE product_id=?').bind(id),...images.map((photo,position)=>env.DB.prepare('INSERT INTO product_images(product_id,image,position) VALUES(?,?,?)').bind(id,photo,position))]);
 await removeUnusedImages(previous.filter(photo=>!images.includes(photo)),env);return json({id});
 }
 if(path==='/api/products'&&r.method==='DELETE'){
 const p=await r.json() as {id?:unknown};if(typeof p.id!=='string')return json({error:'Invalid product'},400);const old=await env.DB.prepare('SELECT image FROM products WHERE id=?').bind(p.id).first<{image:string}>();const images=old?await savedImages(p.id,old.image,env):[];await env.DB.batch([env.DB.prepare('DELETE FROM product_images WHERE product_id=?').bind(p.id),env.DB.prepare('DELETE FROM products WHERE id=?').bind(p.id)]);await removeUnusedImages(images,env);return json({ok:true});
 }
 if(path==='/api/settings'){
 const p=await r.json() as {phone?:unknown,address?:unknown};const phone=normalizePhone(p.phone);if(!validPhone(phone))return json({error:'Enter a valid WhatsApp number.'},400);await env.DB.prepare('INSERT INTO settings(id,phone,address) VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET phone=excluded.phone,address=excluded.address').bind('shop',phone,String(p.address??'').slice(0,500)).run();return json({ok:true});
 }
 if(path==='/api/upload'){
 const f=(await r.formData()).get('file');if(!(f instanceof File)||f.type!=='image/jpeg'||f.size>180*1024||f.size<4)return json({error:'Choose a photo. The website automatically optimizes it for free storage.'},400);
 const bytes=await f.arrayBuffer(),head=new Uint8Array(bytes);if(head[0]!==255||head[1]!==216)return json({error:'Invalid photo.'},400);
 const key=crypto.randomUUID()+'.jpg';await env.DB.prepare('INSERT INTO images(id,bytes,mime,created_at) VALUES(?,?,?,?)').bind(key,bytes,'image/jpeg',Date.now()).run();
 await env.DB.prepare("DELETE FROM images WHERE created_at < ? AND NOT EXISTS (SELECT 1 FROM products WHERE products.image = '/api/media/' || images.id) AND NOT EXISTS (SELECT 1 FROM product_images WHERE product_images.image = '/api/media/' || images.id)").bind(Date.now()-86400000).run();return json({image:'/api/media/'+key});
 }
 }
 return json({error:'Not found'},404);
 }catch(e){const failure=databaseFailure(e,stage);console.error('MAHI database error',failure.detail);return json(path==='/api/admin'?{error:failure.error,code:'DATABASE_UNAVAILABLE',diagnostic:failure.detail}:{error:'અત્યારે વિગતો લોડ અથવા સાચવી શકાઈ નથી. ફરી પ્રયત્ન કરો.',code:'DATABASE_UNAVAILABLE'},503);}
 }
};
