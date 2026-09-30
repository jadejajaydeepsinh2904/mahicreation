export const MASK_SIZE=320;
export type PhotoStage='loading'|'cleaning'|'framing'|'review'|'uploading';
export function normalizePhotoPixels(rgba:Uint8ClampedArray):Float32Array{
  const pixels=MASK_SIZE*MASK_SIZE;if(rgba.length!==pixels*4)throw Error('Invalid photo pixels');
  let maximum=1;for(let i=0;i<rgba.length;i+=4)maximum=Math.max(maximum,rgba[i],rgba[i+1],rgba[i+2]);
  const data=new Float32Array(pixels*3),mean=[.485,.456,.406],std=[.229,.224,.225];
  for(let i=0;i<pixels;i++)for(let c=0;c<3;c++)data[c*pixels+i]=(rgba[i*4+c]/maximum-mean[c])/std[c];
  return data;
}
export function preparePhotoMask(values:Float32Array){
  if(values.length!==MASK_SIZE*MASK_SIZE)throw Error('Invalid photo mask');
  let low=Infinity,high=-Infinity;for(const value of values){if(!Number.isFinite(value))throw Error('Invalid photo mask');low=Math.min(low,value);high=Math.max(high,value);}
  if(high-low<1e-6)throw Error('No clear subject found');
  const rgba=new Uint8ClampedArray(values.length*4);let left=MASK_SIZE,top=MASK_SIZE,right=-1,bottom=-1,strong=0;
  for(let i=0;i<values.length;i++){
    const normalized=(values[i]-low)/(high-low),alpha=Math.max(0,Math.min(1,(normalized-.04)/.92));
    rgba[i*4]=255;rgba[i*4+1]=255;rgba[i*4+2]=255;rgba[i*4+3]=Math.round(alpha*255);
    if(alpha>.5)strong++;
    if(alpha>.03){const x=i%MASK_SIZE,y=Math.floor(i/MASK_SIZE);left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  }
  if(right<left||strong<values.length*.002||strong>values.length*.995)throw Error('No clear subject found');
  left=Math.max(0,left-3);top=Math.max(0,top-3);right=Math.min(MASK_SIZE-1,right+3);bottom=Math.min(MASK_SIZE-1,bottom+3);
  return {rgba,bounds:{left,top,width:right-left+1,height:bottom-top+1}};
}
export function fitPhoto(width:number,height:number,frameWidth=800,frameHeight=1000){
  if(width<=0||height<=0)throw Error('Invalid photo dimensions');
  const scale=Math.min(frameWidth*.9/width,frameHeight*.9/height),w=width*scale,h=height*scale;
  return {x:(frameWidth-w)/2,y:(frameHeight-h)/2,width:w,height:h};
}
