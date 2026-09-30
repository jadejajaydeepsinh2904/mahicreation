import {useRef,useState} from 'react';
import {Check,ImagePlus,LoaderCircle,Trash2} from 'lucide-react';
import {MAX_PRODUCT_PHOTOS} from '../shared/product-images';

type Props={images:string[];lang:'gu'|'en';disabled:boolean;onChange:(images:string[])=>void;onUploadingChange:(uploading:boolean)=>void};

async function optimize(file:File):Promise<Blob>{
  const bitmap=await createImageBitmap(file);
  try{
    const canvas=document.createElement('canvas');
    const ratio=Math.min(1,900/Math.max(bitmap.width,bitmap.height));
    canvas.width=Math.max(1,Math.round(bitmap.width*ratio));
    canvas.height=Math.max(1,Math.round(bitmap.height*ratio));
    const context=canvas.getContext('2d');
    if(!context)throw Error('Photo processing unavailable. Try another browser.');
    context.fillStyle='white';context.fillRect(0,0,canvas.width,canvas.height);
    context.drawImage(bitmap,0,0,canvas.width,canvas.height);
    for(const quality of [.85,.75,.65,.55,.45,.35,.25]){
      const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/jpeg',quality));
      if(blob&&blob.size<=180*1024)return blob;
    }
    throw Error('ફોટો નાનો કરીને ફરી પસંદ કરો. Please choose a smaller photo.');
  }finally{bitmap.close();}
}

export default function ProductPhotos({images,lang,disabled,onChange,onUploadingChange}:Props){
  const input=useRef<HTMLInputElement>(null),locked=useRef(false);
  const [progress,setProgress]=useState<{current:number;total:number}|null>(null),[error,setError]=useState('');
  const t=(gu:string,en:string)=>lang==='gu'?gu:en;
  const blocked=disabled||!!progress;
  async function upload(files:File[]){
    if(!files.length||disabled||locked.current)return;
    setError('');
    if(files.length+images.length>MAX_PRODUCT_PHOTOS){setError(t(`કુલ 8 ફોટા રાખી શકો. હજી ${MAX_PRODUCT_PHOTOS-images.length} ફોટા પસંદ કરો.`,`Choose up to ${MAX_PRODUCT_PHOTOS-images.length} more photos (8 total).`));return;}
    if(files.some(file=>!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>8*1024*1024)){
      setError(t('દરેક ફોટો JPG, PNG કે WebP અને 8 MB સુધીનો હોવો જોઈએ.','Each photo must be JPG, PNG or WebP, up to 8 MB.'));return;
    }
    locked.current=true;onUploadingChange(true);
    const next=[...images];
    try{
      for(let i=0;i<files.length;i++){
        setProgress({current:i+1,total:files.length});
        const blob=await optimize(files[i]),data=new FormData();data.append('file',blob,'product.jpg');
        const response=await fetch('/api/upload',{method:'POST',body:data});
        const result=await response.json() as {image?:string;error?:string};
        if(!response.ok||!result.image)throw Error(result.error||t('ફોટો અપલોડ થયો નથી. ફરી પ્રયત્ન કરો.','Photo upload failed. Try again.'));
        next.push(result.image);onChange([...next]);
      }
    }catch(e){
      const message=e instanceof Error?e.message:t('ફોટો અપલોડ થયો નથી.','Photo upload failed.');
      setError(message+(next.length>images.length?t(' ઉમેરાયેલા ફોટા રાખ્યા છે. બાકી ફોટા ફરી પસંદ કરો.',' Uploaded photos were kept. Select the remaining photos again.'):''));
    }finally{locked.current=false;setProgress(null);onUploadingChange(false);}
  }
  return <fieldset className="photo-editor" disabled={blocked}>
    <legend>{t('પ્રોડક્ટના ફોટા','Product photos')} <span>{images.length} / {MAX_PRODUCT_PHOTOS}</span></legend>
    <p className="photo-help">{t('એકસાથે ઘણા ફોટા પસંદ કરો. પહેલો ફોટો મુખ્ય રહેશે.','Select several photos together. The first photo is the cover.')}</p>
    {images.length>0&&<ol className="photo-editor-grid">{images.map((image,index)=><li key={image}>
      <div className="photo-editor-preview"><img src={image} alt={t(`પ્રોડક્ટનો ફોટો ${index+1}`,`Product photo ${index+1}`)}/>{index===0&&<span className="photo-cover"><Check size={12}/>{t('મુખ્ય ફોટો','Cover')}</span>}</div>
      <div className="photo-editor-actions"><button type="button" disabled={blocked||index===0} onClick={()=>onChange([image,...images.filter(photo=>photo!==image)])}>{index===0?t('મુખ્ય છે','Cover photo'):t('મુખ્ય બનાવો','Make cover')}</button><button type="button" className="photo-delete" aria-label={t(`ફોટો ${index+1} કાઢો`,`Delete photo ${index+1}`)} onClick={()=>{onChange(images.filter(photo=>photo!==image));setError('');}}><Trash2 size={15}/>{t('કાઢો','Delete')}</button></div>
    </li>)}</ol>}
    <input ref={input} className="photo-file-input" type="file" multiple disabled={blocked||images.length>=MAX_PRODUCT_PHOTOS} accept="image/jpeg,image/png,image/webp" aria-label={t('પ્રોડક્ટના ફોટા પસંદ કરો','Choose product photos')} onChange={e=>{const files=Array.from(e.target.files??[]);e.target.value='';void upload(files);}}/>
    <button type="button" className="photo-add" disabled={blocked||images.length>=MAX_PRODUCT_PHOTOS} onClick={()=>input.current?.click()}>{progress?<LoaderCircle size={18} className="spin"/>:<ImagePlus size={18}/>}<span>{progress?t(`ફોટો ${progress.current} / ${progress.total} અપલોડ થાય છે…`,`Uploading photo ${progress.current} of ${progress.total}…`):images.length>=MAX_PRODUCT_PHOTOS?t('8 ફોટા ઉમેરાઈ ગયા','8 photos added'):t('ફોટા ઉમેરો','Add photos')}</span></button>
    <p className="photo-help" aria-live="polite">{progress?t(`ફોટો ${progress.current} / ${progress.total} અપલોડ થાય છે.` ,`Uploading photo ${progress.current} of ${progress.total}.`):t('JPG, PNG, WebP · દરેક ફોટો 8 MB સુધી','JPG, PNG, WebP · up to 8 MB each')}</p>
    <p className="photo-help">{t('ફોટા ઉમેર્યા કે કાઢ્યા પછી નીચે “સાચવો” દબાવો.','Press Save below after adding or deleting photos.')}</p>
    {error&&<p className="photo-error" role="alert">{error}</p>}
  </fieldset>;
}
