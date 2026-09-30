import type {Database} from './database.js';
import {MAX_VIDEO_BYTES,VIDEO_CHUNK_BYTES,videoPathPattern} from '../shared/product-videos.js';
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function savedVideos(id:string,db:Database){return (await db.prepare('SELECT video FROM product_videos WHERE product_id=? ORDER BY position').bind(id).all<{video:string}>()).results.map(row=>row.video);}
export async function removeUnusedVideos(videos:string[],db:Database){
  const queries=[...new Set(videos)].filter(video=>videoPathPattern.test(video)).map(video=>db.prepare('DELETE FROM videos WHERE id=? AND NOT EXISTS (SELECT 1 FROM product_videos WHERE video=?)').bind(video.slice(11),video));
  if(queries.length)await db.batch(queries);
}
export async function uploadVideo(request:Request,db:Database){
  if(!request.headers.get('Content-Type')?.includes('multipart/form-data'))return json({error:'Choose an MP4 or WebM video.'},415);
  const limit=MAX_VIDEO_BYTES+16384;
  if(Number(request.headers.get('Content-Length')??0)>limit)return json({error:'દરેક વીડિયો 4 MB સુધીનો રાખો. Each video must be up to 4 MB.'},413);
  // Bound the actual body too, including requests without Content-Length.
  const reader=request.body?.getReader();if(!reader)return json({error:'Choose a video.'},400);
  const parts:Uint8Array[]=[];let length=0;
  for(;;){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>limit){await reader.cancel();return json({error:'દરેક વીડિયો 4 MB સુધીનો રાખો. Each video must be up to 4 MB.'},413);}parts.push(value);}
  const body=new Uint8Array(length);let offset=0;for(const part of parts){body.set(part,offset);offset+=part.length;}
  let file:FormDataEntryValue|null;
  try{file=(await new Response(body,{headers:{'Content-Type':request.headers.get('Content-Type')!}}).formData()).get('file');}catch{return json({error:'Invalid video upload.'},400);}
  if(!(file instanceof File)||!['video/mp4','video/webm'].includes(file.type)||file.size>MAX_VIDEO_BYTES||file.size<16)return json({error:'MP4 અથવા WebM વીડિયો પસંદ કરો, વધુમાં વધુ 4 MB. Choose an MP4 or WebM video up to 4 MB.'},400);
  const bytes=new Uint8Array(await file.arrayBuffer()),text=new TextDecoder('latin1');
  const valid=file.type==='video/mp4'?text.decode(bytes.subarray(4,8))==='ftyp'&&/^(isom|iso[2-9]|mp4[12]|avc1|M4V |MSNV|dash)/.test(text.decode(bytes.subarray(8,12))):bytes[0]===0x1a&&bytes[1]===0x45&&bytes[2]===0xdf&&bytes[3]===0xa3&&text.decode(bytes.subarray(0,4096)).includes('webm');
  if(!valid)return json({error:'માન્ય MP4 અથવા WebM વીડિયો પસંદ કરો. This is not a supported video file.'},400);
  const id=crypto.randomUUID()+(file.type==='video/mp4'?'.mp4':'.webm');
  const queries=[db.prepare('INSERT INTO videos(id,mime,size,created_at) VALUES(?,?,?,?)').bind(id,file.type,file.size,Date.now())];
  for(let start=0;start<bytes.length;start+=VIDEO_CHUNK_BYTES)queries.push(db.prepare('INSERT INTO video_chunks(video_id,position,bytes) VALUES(?,?,?)').bind(id,start/VIDEO_CHUNK_BYTES,bytes.slice(start,start+VIDEO_CHUNK_BYTES).buffer));
  // The video and all chunks commit together; a failed upload leaves no partial file.
  await db.batch(queries);
  await db.prepare("DELETE FROM videos WHERE id IN (SELECT id FROM videos WHERE created_at < ? AND NOT EXISTS (SELECT 1 FROM product_videos WHERE video = '/api/video/' || videos.id) ORDER BY created_at LIMIT 20)").bind(Date.now()-86400000).run();
  return json({video:'/api/video/'+id});
}
export function videoRange(header:string|null,size:number):{start:number;end:number}|null{
  if(!header)return {start:0,end:size-1};
  const match=/^bytes=(\d*)-(\d*)$/.exec(header.trim());if(!match||(!match[1]&&!match[2]))return null;
  let start=match[1]?Number(match[1]):Math.max(0,size-Number(match[2])),end=match[1]?(match[2]?Number(match[2]):size-1):size-1;
  if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>=size||end<start)return null;
  return {start,end:Math.min(end,size-1)};
}
export async function serveVideo(request:Request,db:Database,rest:boolean){
  const path=new URL(request.url).pathname;if(!videoPathPattern.test(path))return new Response('Not found',{status:404});
  if(!['GET','HEAD'].includes(request.method))return json({error:'Method not allowed'},405);
  const id=path.slice(11),video=await db.prepare('SELECT mime,size FROM videos WHERE id=?').bind(id).first<{mime:string;size:number}>();
  if(!video)return new Response('Not found',{status:404});
  const etag='"'+id+'"',headers=new Headers({'Content-Type':video.mime,'Accept-Ranges':'bytes','Cache-Control':'public,max-age=3600','X-Content-Type-Options':'nosniff','ETag':etag});
  if(request.headers.get('If-None-Match')===etag)return new Response(null,{status:304,headers});
  const rangeHeader=request.method==='HEAD'?null:request.headers.get('If-Range')&&request.headers.get('If-Range')!==etag?null:request.headers.get('Range');
  const range=videoRange(rangeHeader,video.size);if(!range){headers.set('Content-Range',`bytes */${video.size}`);return new Response(null,{status:416,headers});}
  const {start,end}=range;headers.set('Content-Length',String(end-start+1));if(rangeHeader)headers.set('Content-Range',`bytes ${start}-${end}/${video.size}`);
  if(request.method==='HEAD')return new Response(null,{headers});
  const first=Math.floor(start/VIDEO_CHUNK_BYTES),last=Math.floor(end/VIDEO_CHUNK_BYTES);
  const rows=await db.prepare(rest?'SELECT position,hex(bytes) AS bytes_hex FROM video_chunks WHERE video_id=? AND position BETWEEN ? AND ? ORDER BY position':'SELECT position,bytes FROM video_chunks WHERE video_id=? AND position BETWEEN ? AND ? ORDER BY position').bind(id,first,last).all<{position:number;bytes?:number[]|ArrayBuffer;bytes_hex?:string}>();
  if(rows.results.length!==last-first+1)throw Error('Incomplete video');
  const result=new Uint8Array(end-start+1);let written=0;
  for(const row of rows.results){
    let bytes:Uint8Array;if(rest){const hex=row.bytes_hex??'';bytes=new Uint8Array(hex.length/2);for(let i=0;i<bytes.length;i++)bytes[i]=parseInt(hex.slice(i*2,i*2+2),16);}else bytes=new Uint8Array(row.bytes??[]);
    const chunkStart=row.position*VIDEO_CHUNK_BYTES,part=bytes.subarray(Math.max(0,start-chunkStart),Math.min(bytes.length,end-chunkStart+1));result.set(part,written);written+=part.length;
  }
  if(written!==result.length)throw Error('Incomplete video');
  return new Response(result,{status:rangeHeader?206:200,headers});
}
