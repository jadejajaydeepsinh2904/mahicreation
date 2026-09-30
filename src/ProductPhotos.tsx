import {useEffect,useRef,useState} from 'react';
import {Check,ImagePlus,LoaderCircle,Trash2} from 'lucide-react';
import {MAX_PRODUCT_PHOTOS} from '../shared/product-images';
import type {PhotoStage} from './photo-mask';

type Props={images:string[];lang:'gu'|'en';disabled:boolean;onChange:(images:string[])=>void;onUploadingChange:(uploading:boolean)=>void};
type Review={original:string;cleaned:string|null;choose:(cleaned:boolean|null)=>void};

export default function ProductPhotos({images,lang,disabled,onChange,onUploadingChange}:Props){
  const input=useRef<HTMLInputElement>(null),locked=useRef(false);
  const processor=useRef<typeof import('./photo-processing')|null>(null),mounted=useRef(true);
  const [progress,setProgress]=useState<{current:number;total:number;stage:PhotoStage}|null>(null),[error,setError]=useState('');
  const [cleanBackground,setCleanBackground]=useState(true);
  const [review,setReview]=useState<Review|null>(null),reviewPanel=useRef<HTMLDivElement>(null),cancelReview=useRef<(()=>void)|null>(null);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;cancelReview.current?.();processor.current?.stopPhotoProcessing();};},[]);
  useEffect(()=>{if(review){reviewPanel.current?.scrollIntoView({behavior:'smooth',block:'nearest'});reviewPanel.current?.focus();}},[review]);
  const t=(gu:string,en:string)=>lang==='gu'?gu:en;
  const blocked=disabled||!!progress;
  const stageText=(stage:PhotoStage)=>({loading:t('સફાઈનું સાધન લોડ થાય છે…','Loading photo tools…'),cleaning:t('Background સાફ થાય છે…','Cleaning the background…'),framing:t('ફોટો ગોઠવાય છે…','Framing the photo…'),review:t('નીચે ફોટો જોઈને પસંદ કરો.','Review and choose a photo below.'),uploading:t('ફોટો અપલોડ થાય છે…','Uploading the photo…')}[stage]);
  function choosePhoto(original:Blob,cleaned:Blob|null){
    return new Promise<Blob|null>(resolve=>{
      const originalURL=URL.createObjectURL(original),cleanedURL=cleaned?URL.createObjectURL(cleaned):null;let settled=false;
      const choose=(useCleaned:boolean|null)=>{if(settled)return;settled=true;URL.revokeObjectURL(originalURL);if(cleanedURL)URL.revokeObjectURL(cleanedURL);cancelReview.current=null;if(mounted.current)setReview(null);resolve(useCleaned===null?null:useCleaned?cleaned:original);};
      cancelReview.current=()=>choose(null);setReview({original:originalURL,cleaned:cleanedURL,choose});
    });
  }
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
      setProgress({current:1,total:files.length,stage:cleanBackground?'loading':'framing'});
      processor.current=await import('./photo-processing');
      for(let i=0;i<files.length;i++){
        if(!mounted.current)return;
        const updateStage=(stage:PhotoStage)=>{if(mounted.current)setProgress({current:i+1,total:files.length,stage});};
        let blob:Blob|null;
        if(cleanBackground){
          const original=await processor.current.prepareProductPhoto(files[i],false,updateStage);let cleaned:Blob|null=null;
          try{cleaned=await processor.current.prepareProductPhoto(files[i],true,updateStage);}catch{if(!mounted.current)return;}
          if(!mounted.current)return;updateStage('review');blob=await choosePhoto(original,cleaned);
        }else blob=await processor.current.prepareProductPhoto(files[i],false,updateStage);
        if(!mounted.current)return;
        if(!blob)continue;
        updateStage('uploading');const data=new FormData();data.append('file',blob,'product.jpg');
        const response=await fetch('/api/upload',{method:'POST',body:data});
        const result=await response.json() as {image?:string;error?:string};
        if(!response.ok||!result.image)throw Error(result.error||t('ફોટો અપલોડ થયો નથી. ફરી પ્રયત્ન કરો.','Photo upload failed. Try again.'));
        if(!mounted.current)return;
        next.push(result.image);onChange([...next]);
      }
    }catch(e){
      const message=e instanceof Error?e.message:t('ફોટો અપલોડ થયો નથી.','Photo upload failed.');
      if(mounted.current)setError(message+(next.length>images.length?t(' ઉમેરાયેલા ફોટા રાખ્યા છે. બાકી ફોટા ફરી પસંદ કરો.',' Uploaded photos were kept. Select the remaining photos again.'):''));
    }finally{locked.current=false;if(mounted.current){setProgress(null);onUploadingChange(false);}}
  }
  return <><fieldset className="photo-editor" disabled={blocked}>
    <legend>{t('પ્રોડક્ટના ફોટા','Product photos')} <span>{images.length} / {MAX_PRODUCT_PHOTOS}</span></legend>
    <p className="photo-help">{t('એકસાથે ઘણા ફોટા પસંદ કરો. પહેલો ફોટો મુખ્ય રહેશે.','Select several photos together. The first photo is the cover.')}</p>
    <div className="photo-cleanup"><label className="check"><input type="checkbox" checked={cleanBackground} onChange={e=>{setCleanBackground(e.target.checked);setError('');}}/><span>{t('Background સાફ કરો (મફત)','Clean background (free)')}</span></label><p className="photo-help">{t('આછો ક્રીમ background અને આખી વસ્તુ દેખાય એવી ફ્રેમ. મૂળ background રાખવા આ વિકલ્પ બંધ કરો.','Light cream background with the whole product fitted in the frame. Turn this off to keep the original background.')}</p><p className="photo-help">{t('અલગ AI/API ચાર્જ નથી. પહેલી વાર થોડો વધુ સમય લાગશે. વસ્તુ પરનો watermark રહી શકે.','No extra AI/API fee. The first use takes longer. A watermark on the product may remain.')}</p></div>
    {images.length>0&&<ol className="photo-editor-grid">{images.map((image,index)=><li key={image}>
      <div className="photo-editor-preview"><img src={image} alt={t(`પ્રોડક્ટનો ફોટો ${index+1}`,`Product photo ${index+1}`)}/>{index===0&&<span className="photo-cover"><Check size={12}/>{t('મુખ્ય ફોટો','Cover')}</span>}</div>
      <div className="photo-editor-actions"><button type="button" disabled={blocked||index===0} onClick={()=>onChange([image,...images.filter(photo=>photo!==image)])}>{index===0?t('મુખ્ય છે','Cover photo'):t('મુખ્ય બનાવો','Make cover')}</button><button type="button" className="photo-delete" aria-label={t(`ફોટો ${index+1} કાઢો`,`Delete photo ${index+1}`)} onClick={()=>{onChange(images.filter(photo=>photo!==image));setError('');}}><Trash2 size={15}/>{t('કાઢો','Delete')}</button></div>
    </li>)}</ol>}
    <input ref={input} className="photo-file-input" type="file" multiple disabled={blocked||images.length>=MAX_PRODUCT_PHOTOS} accept="image/jpeg,image/png,image/webp" aria-label={t('પ્રોડક્ટના ફોટા પસંદ કરો','Choose product photos')} onChange={e=>{const files=Array.from(e.target.files??[]);e.target.value='';void upload(files);}}/>
    <button type="button" className="photo-add" disabled={blocked||images.length>=MAX_PRODUCT_PHOTOS} onClick={()=>input.current?.click()}>{progress?<LoaderCircle size={18} className="spin"/>:<ImagePlus size={18}/>}<span>{progress?t(`ફોટો ${progress.current} / ${progress.total}`,`Photo ${progress.current} of ${progress.total}`):images.length>=MAX_PRODUCT_PHOTOS?t('8 ફોટા ઉમેરાઈ ગયા','8 photos added'):t('ફોટા ઉમેરો','Add photos')}</span></button>
    <p className="photo-help" aria-live="polite">{progress?stageText(progress.stage):t('JPG, PNG, WebP · દરેક ફોટો 8 MB સુધી','JPG, PNG, WebP · up to 8 MB each')}</p>
    <p className="photo-help">{t('Background સફાઈ પછી મૂળ અને નવો ફોટો જોઈને પસંદ કરી શકશો. પછી નીચે “સાચવો” દબાવો.','Compare the original and cleaned photo before upload, then press Save below.')}</p>
    {error&&<p className="photo-error" role="alert">{error}</p>}
  </fieldset>{review&&<div className="photo-review" ref={reviewPanel} tabIndex={-1} role="region" aria-label={t('ફોટો તપાસીને પસંદ કરો','Review and choose a photo')}>
    <h3>{t('કયો ફોટો રાખવો છે?','Which photo should we keep?')}</h3>
    <p className="photo-help">{t('ધાર, રંગ અને ડિઝાઇન તપાસો. સફાઈમાં વસ્તુનો ભાગ ગાયબ હોય તો મૂળ background રાખો.','Check the edges, colours and design. Keep the original background if cleanup removes part of the product.')}</p>
    <div className="photo-review-grid"><div><img src={review.original} alt={t('મૂળ background સાથેનો ફોટો','Photo with original background')}/><button type="button" onClick={()=>review.choose(false)}>{t('મૂળ ફોટો રાખો','Keep original photo')}</button></div><div>{review.cleaned?<><img src={review.cleaned} alt={t('સાફ કરેલા background સાથેનો ફોટો','Photo with cleaned background')}/><button type="button" onClick={()=>review.choose(true)}>{t('સાફ ફોટો રાખો','Use cleaned photo')}</button></>:<p className="photo-help">{t('આ ફોટાની સફાઈ થઈ શકી નથી. મૂળ background રાખી શકો.','Cleanup was unavailable for this photo. You can keep its original background.')}</p>}</div></div>
    <button type="button" className="photo-skip" onClick={()=>review.choose(null)}>{t('આ ફોટો છોડો','Skip this photo')}</button>
  </div>}</>;
}
