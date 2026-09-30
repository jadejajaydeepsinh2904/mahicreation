import {useEffect,useRef,useState} from 'react';
import {LoaderCircle,Trash2,Video} from 'lucide-react';
import {MAX_PRODUCT_VIDEOS,MAX_VIDEO_BYTES} from '../shared/product-videos';
type Props={videos:string[];lang:'gu'|'en';disabled:boolean;onChange:(videos:string[])=>void;onUploadingChange:(busy:boolean)=>void};
function checkVideo(file:File):Promise<void>{
  return new Promise((resolve,reject)=>{
    const video=document.createElement('video'),url=URL.createObjectURL(file);
    const timer=setTimeout(()=>finish(false),10000);
    function finish(ok:boolean){clearTimeout(timer);video.onloadedmetadata=null;video.onerror=null;video.removeAttribute('src');video.load();URL.revokeObjectURL(url);ok?resolve():reject(Error('આ વીડિયો browserમાં ચાલતો નથી. MP4 (H.264) અથવા WebM વીડિયો પસંદ કરો. Choose a playable MP4 (H.264) or WebM video.'));}
    video.preload='metadata';video.onloadedmetadata=()=>finish(video.videoWidth>0&&video.videoHeight>0);video.onerror=()=>finish(false);video.src=url;
  });
}
export default function ProductVideos({videos,lang,disabled,onChange,onUploadingChange}:Props){
  const input=useRef<HTMLInputElement>(null),locked=useRef(false),mounted=useRef(true),controller=useRef<AbortController|null>(null);
  const [progress,setProgress]=useState<{current:number;total:number}|null>(null),[error,setError]=useState('');
  const t=(gu:string,en:string)=>lang==='gu'?gu:en,blocked=disabled||!!progress;
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;controller.current?.abort();};},[]);
  async function upload(files:File[]){
    if(!files.length||disabled||locked.current)return;setError('');
    if(files.length+videos.length>MAX_PRODUCT_VIDEOS){setError(t(`હજી ${MAX_PRODUCT_VIDEOS-videos.length} વીડિયો ઉમેરો (કુલ 5).`,`Choose up to ${MAX_PRODUCT_VIDEOS-videos.length} more videos (5 total).`));return;}
    if(files.some(file=>!['video/mp4','video/webm'].includes(file.type)||file.size>MAX_VIDEO_BYTES||file.size<16)){setError(t('દરેક વીડિયો MP4 અથવા WebM અને 4 MB સુધીનો હોવો જોઈએ. મોટો વીડિયો ટૂંકો કરીને અથવા ઓછા કદમાં export કરીને ઉમેરો.','Each video must be MP4 or WebM, up to 4 MB. Trim or export larger videos at a smaller size.'));return;}
    locked.current=true;onUploadingChange(true);const next=[...videos];controller.current=new AbortController();
    try{
      for(let i=0;i<files.length;i++){
        if(!mounted.current)return;setProgress({current:i+1,total:files.length});await checkVideo(files[i]);if(!mounted.current)return;
        const data=new FormData();data.append('file',files[i]);
        const response=await fetch('/api/videos',{method:'POST',body:data,signal:controller.current.signal});
        const result=await response.json() as {video?:string;error?:string};
        if(!response.ok||!result.video)throw Error(result.error||t('વીડિયો અપલોડ થયો નથી. ફરી પ્રયત્ન કરો.','Video upload failed. Try again.'));
        if(!mounted.current)return;next.push(result.video);onChange([...next]);
      }
    }catch(e){if(mounted.current)setError((e instanceof Error?e.message:t('વીડિયો અપલોડ થયો નથી.','Video upload failed.'))+(next.length>videos.length?t(' ઉમેરાયેલા વીડિયો રાખ્યા છે. બાકીના ફરી પસંદ કરો.',' Uploaded videos were kept. Select the remaining videos again.'):''));}
    finally{locked.current=false;controller.current=null;if(mounted.current){setProgress(null);onUploadingChange(false);}}
  }
  return <fieldset className="photo-editor video-editor" disabled={blocked}>
    <legend>{t('પ્રોડક્ટના વીડિયો','Product videos')} <span>{videos.length} / {MAX_PRODUCT_VIDEOS}</span></legend>
    <p className="photo-help">{t('એકસાથે ઘણા વીડિયો પસંદ કરો. MP4 / WebM · દરેક વીડિયો 4 MB સુધી.','Select several videos together. MP4 / WebM · up to 4 MB each.')}</p>
    {!!videos.length&&<ol className="video-editor-grid">{videos.map((video,index)=><li key={video}><video src={video} controls playsInline preload="metadata" aria-label={t(`વીડિયો ${index+1}`,`Video ${index+1}`)}/><div className="video-editor-actions"><span>{t(`વીડિયો ${index+1}`,`Video ${index+1}`)}</span><button type="button" aria-label={t(`વીડિયો ${index+1} કાઢો`,`Delete video ${index+1}`)} onClick={()=>{onChange(videos.filter(item=>item!==video));setError('');}}><Trash2 size={15}/>{t('કાઢો','Delete')}</button></div></li>)}</ol>}
    <input ref={input} className="photo-file-input" type="file" multiple accept="video/mp4,video/webm" disabled={blocked||videos.length>=MAX_PRODUCT_VIDEOS} aria-label={t('વીડિયો પસંદ કરો','Choose videos')} onChange={e=>{const files=Array.from(e.target.files??[]);e.target.value='';void upload(files);}}/>
    <button type="button" className="photo-add" disabled={blocked||videos.length>=MAX_PRODUCT_VIDEOS} onClick={()=>input.current?.click()}>{progress?<LoaderCircle size={18} className="spin"/>:<Video size={18}/>}<span>{progress?t(`વીડિયો ${progress.current} / ${progress.total} અપલોડ થાય છે…`,`Uploading video ${progress.current} of ${progress.total}…`):videos.length>=MAX_PRODUCT_VIDEOS?t('5 વીડિયો ઉમેરાઈ ગયા','5 videos added'):t('વીડિયો ઉમેરો','Add videos')}</span></button>
    <p className="photo-help" aria-live="polite">{progress?t('અપલોડ પૂરું થાય ત્યાં સુધી પેજ ખુલ્લું રાખો.','Keep this page open until the upload finishes.'):t('વીડિયો ઉમેર્યા કે કાઢ્યા પછી નીચે “સાચવો” દબાવો.','Press Save below after adding or deleting videos.')}</p>
    {error&&<p className="photo-error" role="alert">{error}</p>}
  </fieldset>;
}
