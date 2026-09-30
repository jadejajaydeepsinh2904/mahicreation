import {fitPhoto,MASK_SIZE,normalizePhotoPixels,preparePhotoMask,type PhotoStage} from './photo-mask';
import {MAX_PRODUCT_PHOTO_BYTES} from '../shared/product-images';
let worker:Worker|undefined,sequence=0;
const pending=new Map<number,{resolve:(mask:Float32Array)=>void;reject:(error:Error)=>void;stage:(stage:PhotoStage)=>void;timer:ReturnType<typeof setTimeout>}>();
const failure=()=>Error('ફોટાનું background સાફ થઈ શક્યું નથી. “Background સાફ કરો” બંધ કરીને મૂળ ફોટો અપલોડ કરી શકો. Background cleanup failed; turn it off to keep the original.');
export function stopPhotoProcessing(){worker?.terminate();worker=undefined;for(const job of pending.values()){clearTimeout(job.timer);job.reject(failure());}pending.clear();}
function predict(pixels:Float32Array,stage:(stage:PhotoStage)=>void){
  if(!worker){
    worker=new Worker(new URL('./photo-background.worker.ts',import.meta.url),{type:'module'});
    worker.onmessage=(event:MessageEvent<{id:number;stage?:PhotoStage;mask?:ArrayBuffer;error?:boolean}>)=>{
      const job=pending.get(event.data.id);if(!job)return;if(event.data.stage){job.stage(event.data.stage);return;}
      clearTimeout(job.timer);pending.delete(event.data.id);if(event.data.mask)job.resolve(new Float32Array(event.data.mask));else job.reject(failure());
    };worker.onerror=()=>stopPhotoProcessing();
  }
  const id=++sequence;return new Promise<Float32Array>((resolve,reject)=>{
    const timer=setTimeout(()=>stopPhotoProcessing(),120000);pending.set(id,{resolve,reject,stage,timer});worker!.postMessage({id,pixels:pixels.buffer},[pixels.buffer]);
  });
}
function canvas(width:number,height:number){const c=document.createElement('canvas');c.width=width;c.height=height;return c;}
function context(c:HTMLCanvasElement){const ctx=c.getContext('2d');if(!ctx)throw Error('Photo processing unavailable');return ctx;}
async function encodePhoto(c:HTMLCanvasElement){
  for(const quality of [.94,.90,.86,.80,.74,.66,.56,.46]){const blob=await new Promise<Blob|null>(resolve=>c.toBlob(resolve,'image/jpeg',quality));if(blob&&blob.size<=MAX_PRODUCT_PHOTO_BYTES)return blob;}
  throw Error('ફોટો નાનો કરીને ફરી પસંદ કરો. Please choose a smaller photo.');
}
export async function prepareProductPhoto(file:File,removeBackground:boolean,onStage:(stage:PhotoStage)=>void):Promise<Blob>{
  const bitmap=await createImageBitmap(file),scale=Math.min(1,1400/Math.max(bitmap.width,bitmap.height));
  const source=canvas(Math.max(1,Math.round(bitmap.width*scale)),Math.max(1,Math.round(bitmap.height*scale))),sourceContext=context(source);
  sourceContext.fillStyle='white';sourceContext.fillRect(0,0,source.width,source.height);sourceContext.drawImage(bitmap,0,0,source.width,source.height);bitmap.close();
  const frame=canvas(1000,1250),ctx=context(frame);let crop={left:0,top:0,width:source.width,height:source.height};
  try{
    if(!removeBackground){onStage('framing');return await encodePhoto(source);}
    if(removeBackground){
      onStage('loading');const small=canvas(MASK_SIZE,MASK_SIZE),smallContext=context(small);
      smallContext.fillStyle='white';smallContext.fillRect(0,0,MASK_SIZE,MASK_SIZE);smallContext.drawImage(source,0,0,MASK_SIZE,MASK_SIZE);
      const input=normalizePhotoPixels(smallContext.getImageData(0,0,MASK_SIZE,MASK_SIZE).data);let mask:ReturnType<typeof preparePhotoMask>;
      try{mask=preparePhotoMask(await predict(input,onStage));}catch{throw failure();}
      const maskCanvas=canvas(MASK_SIZE,MASK_SIZE);context(maskCanvas).putImageData(new ImageData(new Uint8ClampedArray(mask.rgba),MASK_SIZE,MASK_SIZE),0,0);
      sourceContext.globalCompositeOperation='destination-in';sourceContext.imageSmoothingEnabled=true;sourceContext.imageSmoothingQuality='high';sourceContext.drawImage(maskCanvas,0,0,source.width,source.height);sourceContext.globalCompositeOperation='source-over';
      crop={left:mask.bounds.left/MASK_SIZE*source.width,top:mask.bounds.top/MASK_SIZE*source.height,width:mask.bounds.width/MASK_SIZE*source.width,height:mask.bounds.height/MASK_SIZE*source.height};
      small.width=1;small.height=1;maskCanvas.width=1;maskCanvas.height=1;
    }
    onStage('framing');const background=ctx.createLinearGradient(0,0,frame.width,frame.height);background.addColorStop(0,'#f6f0e7');background.addColorStop(1,'#eae0d1');ctx.fillStyle=background;ctx.fillRect(0,0,frame.width,frame.height);
    const fitted=fitPhoto(crop.width,crop.height,frame.width,frame.height);if(removeBackground){ctx.shadowColor='rgba(66,45,21,.12)';ctx.shadowBlur=14;ctx.shadowOffsetY=10;}
    ctx.drawImage(source,crop.left,crop.top,crop.width,crop.height,fitted.x,fitted.y,fitted.width,fitted.height);
    return await encodePhoto(frame);
  }finally{source.width=1;source.height=1;frame.width=1;frame.height=1;}
}
