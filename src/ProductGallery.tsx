import {useEffect,useRef,useState} from 'react';
import {ChevronLeft,ChevronRight,Play} from 'lucide-react';

export default function ProductGallery({images,videos=[],name,lang}:{images:string[];videos?:string[];name:string;lang:'gu'|'en'}){
  const [selected,setSelected]=useState(0),[failed,setFailed]=useState(false),start=useRef<{x:number;y:number}|null>(null),player=useRef<HTMLVideoElement>(null);
  const items=[...images.map(src=>({src,video:false})),...videos.map(src=>({src,video:true}))];
  const active=Math.min(selected,Math.max(0,items.length-1)),item=items[active];
  const t=(gu:string,en:string)=>lang==='gu'?gu:en;
  useEffect(()=>{setFailed(false);const video=player.current;return()=>video?.pause();},[active,item?.src]);
  function move(delta:number){setSelected((active+delta+items.length)%items.length);}
  if(!item)return null;
  return <div className="product-gallery" role="region" aria-label={t('પ્રોડક્ટના ફોટા અને વીડિયો','Product photos and videos')} onKeyDown={e=>{if((e.target as HTMLElement).tagName==='VIDEO')return;if(items.length>1&&(e.key==='ArrowLeft'||e.key==='ArrowRight')){e.preventDefault();move(e.key==='ArrowLeft'?-1:1);}}}>
    <div className={'gallery-stage'+(item.video?' gallery-video':'')} onTouchStart={e=>{const point=e.touches[0];start.current=!item.video&&e.touches.length===1?{x:point.clientX,y:point.clientY}:null;}} onTouchCancel={()=>{start.current=null;}} onTouchEnd={e=>{const point=e.changedTouches[0],first=start.current;start.current=null;if(!first||!point||items.length<2)return;const dx=point.clientX-first.x,dy=point.clientY-first.y;if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy))move(dx<0?1:-1);}}>
      {item.video?<video key={item.src} ref={player} src={item.src} poster={images[0]} controls playsInline preload="metadata" aria-label={t(`${name} — વીડિયો ${active-images.length+1}`,`${name} — video ${active-images.length+1}`)} onError={()=>setFailed(true)}/>:<img src={item.src} alt={t(`${name} — ફોટો ${active+1}`,`${name} — photo ${active+1}`)}/>}
      {failed&&<p className="gallery-video-error" role="alert">{t('વીડિયો ચાલતો નથી. બીજા browserમાં પ્રયત્ન કરો.','This video could not play. Try another browser.')}</p>}
      {items.length>1&&<><button type="button" className="gallery-arrow gallery-prev" aria-label={t('પાછળ જુઓ','Previous item')} onClick={()=>move(-1)}><ChevronLeft size={22}/></button><button type="button" className="gallery-arrow gallery-next" aria-label={t('આગળ જુઓ','Next item')} onClick={()=>move(1)}><ChevronRight size={22}/></button><span className="gallery-counter" aria-live="polite" aria-atomic="true">{active+1} / {items.length}</span></>}
    </div>
    {items.length>1&&<div className="gallery-thumbnails">{items.map((media,index)=><button type="button" key={media.src} className={index===active?'selected':''} aria-pressed={index===active} aria-label={media.video?t(`વીડિયો ${index-images.length+1} જુઓ`,`View video ${index-images.length+1}`):t(`ફોટો ${index+1} જુઓ`,`View photo ${index+1}`)} onClick={()=>setSelected(index)}>{media.video?<span className="gallery-video-thumb"><Play size={20}/><span>{t('વીડિયો','Video')} {index-images.length+1}</span></span>:<img src={media.src} alt="" loading="lazy"/>}</button>)}</div>}
  </div>;
}
