import {MASK_SIZE} from './photo-mask';
interface Tensor {data:Float32Array;dispose():void}
interface Session {inputNames:string[];outputNames:string[];run(inputs:Record<string,Tensor>):Promise<Record<string,Tensor>>}
interface Runtime {
  env:{logLevel:string;wasm:{numThreads:number;wasmPaths:string;proxy:boolean}};
  Tensor:new(type:string,data:Float32Array,dims:number[])=>Tensor;
  InferenceSession:{create(bytes:Uint8Array,options:{executionProviders:string[];graphOptimizationLevel:string}):Promise<Session>};
}
const scope=self as unknown as {location:Location;onmessage:((event:MessageEvent<{id:number;pixels:ArrayBuffer}>)=>void)|null;postMessage:(data:unknown,transfer?:Transferable[])=>void};
const assetRoot=new URL('/photo-tools/v1/',scope.location.origin).href;
let ready:Promise<{ort:Runtime;session:Session}>|undefined;
function load(){
  if(!ready)ready=(async()=>{
    const runtimeUrl=assetRoot+'ort.wasm.min.mjs';const ort=await import(/* @vite-ignore */runtimeUrl) as Runtime;
    ort.env.logLevel='error';ort.env.wasm.numThreads=1;ort.env.wasm.proxy=false;ort.env.wasm.wasmPaths=assetRoot;
    const response=await fetch(assetRoot+'u2netp.onnx',{cache:'force-cache'});if(!response.ok)throw Error('Model unavailable');
    const bytes=await response.arrayBuffer();const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');
    if(hash!=='309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8')throw Error('Model verification failed');
    return {ort,session:await ort.InferenceSession.create(new Uint8Array(bytes),{executionProviders:['wasm'],graphOptimizationLevel:'all'})};
  })().catch(error=>{ready=undefined;throw error;});return ready;
}
scope.onmessage=async event=>{
  const {id,pixels}=event.data;let tensor:Tensor|undefined,outputs:Record<string,Tensor>|undefined;
  try{
    scope.postMessage({id,stage:'loading'});const {ort,session}=await load();scope.postMessage({id,stage:'cleaning'});
    tensor=new ort.Tensor('float32',new Float32Array(pixels),[1,3,MASK_SIZE,MASK_SIZE]);outputs=await session.run({[session.inputNames[0]]:tensor});
    const mask=new Float32Array(outputs[session.outputNames[0]].data);scope.postMessage({id,mask:mask.buffer},[mask.buffer]);
  }catch{scope.postMessage({id,error:true});}
  finally{tensor?.dispose();if(outputs)for(const output of Object.values(outputs))output.dispose();}
};
