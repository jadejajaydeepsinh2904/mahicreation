import {useRef,useState} from 'react';
import {ChevronLeft,ChevronRight} from 'lucide-react';

export default function ProductGallery({images,name,lang}:{images:string[];name:string;lang:'gu'|'en'}){
  const [selected,setSelected]=useState(0),start=useRef<{x:number;y:number}|null>(null);
  const active=Math.min(selected,Math.max(0,images.length-1));
  const t=(gu:string,en:string)=>lang==='gu'?gu:en;
  function move(delta:number){setSelected((active+delta+images.length)%images.length);}
  return <div className="product-gallery" role="region" aria-label={t('પ્રોડક્ટના ફોટા','Product photos')} onKeyDown={e=>{if(images.length>1&&(e.key==='ArrowLeft'||e.key==='ArrowRight')){e.preventDefault();move(e.key==='ArrowLeft'?-1:1);}}}>
    <div className="gallery-stage" onTouchStart={e=>{const point=e.touches[0];start.current=e.touches.length===1?{x:point.clientX,y:point.clientY}:null;}} onTouchCancel={()=>{start.current=null;}} onTouchEnd={e=>{const point=e.changedTouches[0],first=start.current;start.current=null;if(!first||!point||images.length<2)return;const dx=point.clientX-first.x,dy=point.clientY-first.y;if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy))move(dx<0?1:-1);}}>
      <img src={images[active]} alt={t(`${name} — ફોટો ${active+1}`,`${name} — photo ${active+1}`)}/>
      {images.length>1&&<><button type="button" className="gallery-arrow gallery-prev" aria-label={t('પાછલો ફોટો','Previous photo')} onClick={()=>move(-1)}><ChevronLeft size={22}/></button><button type="button" className="gallery-arrow gallery-next" aria-label={t('આગળનો ફોટો','Next photo')} onClick={()=>move(1)}><ChevronRight size={22}/></button><span className="gallery-counter" aria-live="polite" aria-atomic="true">{active+1} / {images.length}</span></>}
    </div>
    {images.length>1&&<div className="gallery-thumbnails">{images.map((image,index)=><button type="button" key={image} className={index===active?'selected':''} aria-pressed={index===active} aria-label={t(`ફોટો ${index+1} જુઓ`,`View photo ${index+1}`)} onClick={()=>setSelected(index)}><img src={image} alt="" loading="lazy"/></button>)}</div>}
  </div>;
}
