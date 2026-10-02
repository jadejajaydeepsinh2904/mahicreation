import {useEffect,useRef,useState} from 'react';
import {ArrowDown,ArrowRight,ArrowUpRight,ChevronLeft,ChevronRight,ImagePlus,Pause,Play,ShoppingBag} from 'lucide-react';
import SamplePhoto from './SamplePhoto';
import './storefront-flow.css';

export type FlowProduct={id:string,name:string,name_gu:string,category:string,price:number,description:string,image:string,images?:string[],videos?:string[],in_stock:number,sample?:boolean,sampleSheet?:string,sampleIndex?:number,description_gu?:string};
type Props={products:FlowProduct[],lang:'gu'|'en',onCategory:(category:string)=>void,onDetail:(product:FlowProduct)=>void,onAdd:(product:FlowProduct)=>void};
const categories=[['Sarees','સાડીઓ','The art of the drape'],['Clothing','કપડાં','Everyday, beautifully'],['Jewellery','જ્વેલરી','A little more sparkle'],['Accessories','એક્સેસરીઝ','The finishing touch'],['Bags','બેગ','Carry your style'],['Other','અન્ય','Little things to love']];
const money=(n:number)=>'₹'+n.toLocaleString('en-IN');
const productName=(p:FlowProduct,lang:string)=>lang==='gu'&&p.name_gu?p.name_gu:p.name;

function useReducedMotion(){
 const [reduced,setReduced]=useState(true);
 useEffect(()=>{const media=window.matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setReduced(media.matches);update();media.addEventListener('change',update);return()=>media.removeEventListener('change',update);},[]);
 return reduced;
}

export function FlowPhoto({product,lang,className=''}:{product:FlowProduct,lang:string,className?:string}){
 const label=productName(product,lang);
 if(product.sampleSheet)return <SamplePhoto sheet={product.sampleSheet} index={product.sampleIndex??0} label={label} className={className}/>;
 const src=product.image||product.images?.[0];
 if(src)return <img className={'photo '+className} src={src} alt={label} loading="lazy" decoding="async"/>;
 return <div className={'flow-placeholder '+className}>{product.videos?.length?<Play size={30}/>:<ImagePlus size={30}/>}<span>{product.videos?.length?(lang==='gu'?'વીડિયો જુઓ':'Watch video'):(lang==='gu'?'ફોટો ટૂંક સમયમાં':'Photo coming soon')}</span></div>;
}

function Wave({bottom=false}:{bottom?:boolean}){
 return <svg className={'flow-wave '+(bottom?'flow-wave-bottom':'flow-wave-top')} viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden="true"><path d="M0 0H1440V30C1130 130 1030 10 720 54S260 130 0 40Z"/></svg>;
}

function MovingCollection({products,lang,onDetail}:Pick<Props,'products'|'lang'|'onDetail'>){
 const reduced=useReducedMotion();
 const [paused,setPaused]=useState(false),[inView,setInView]=useState(false);
 const ref=useRef<HTMLElement>(null);
 useEffect(()=>{if(!ref.current||!('IntersectionObserver' in window))return;const observer=new IntersectionObserver(([entry])=>setInView(entry.isIntersecting));observer.observe(ref.current);return()=>observer.disconnect();},[]);
 const picks=products.slice(0,8);
 if(!picks.length)return null;
 return <section ref={ref} className="flow-moving" aria-label={lang==='gu'?'સરકતું કલેક્શન':'Moving collection'}>
  <div className="flow-heading flow-reveal"><p className="eyebrow">A LITTLE MOVEMENT. A LOT OF MAHI.</p><h2>{lang==='gu'?'તમારી સાથે વહેતી સ્ટાઇલ.':'Style that moves with you.'}</h2><p>{lang==='gu'?'નજર અટકે ત્યાં, તમારી પસંદગીની શરૂઆત.':'Follow your eye. Find your next favourite.'}</p></div>
  <div className="flow-marquee"><div className="flow-track" style={{animationPlayState:paused||reduced||!inView?'paused':'running'}}>
   {[0,1].map(copy=><div className={'flow-track-group '+(copy?'flow-track-copy':'')} key={copy} aria-hidden={copy?true:undefined}>{picks.map((p,i)=><button className={'flow-floating-card flow-tilt-'+i%4} key={p.id} tabIndex={copy?-1:0} onClick={()=>onDetail(p)} aria-label={productName(p,lang)}><FlowPhoto product={p} lang={lang}/><span>{productName(p,lang)}<ArrowUpRight size={16}/></span></button>)}</div>)}
  </div></div>
  <div className="flow-moving-foot"><span>{lang==='gu'?'ગમતી પ્રોડક્ટ પર ટૅપ કરો':'Tap a piece to take a closer look'}</span><button className="flow-pause" aria-pressed={paused} onClick={()=>setPaused(!paused)}>{paused?<Play size={15}/>:<Pause size={15}/>} {paused?(lang==='gu'?'ચાલુ કરો':'Play'):(lang==='gu'?'થોભાવો':'Pause')}</button><span className="flow-swipe">{lang==='gu'?'બાજુમાં સરકાવો →':'Swipe to explore →'}</span></div>
 </section>;
}

function FeaturedSelection({products,lang,onDetail,onAdd}:Pick<Props,'products'|'lang'|'onDetail'|'onAdd'>){
 const picks=products.slice(0,6),[activeId,setActiveId]=useState('');
 const active=picks.find(p=>p.id===activeId)??picks[0];
 if(!active)return null;
 const index=picks.indexOf(active),name=productName(active,lang);
 const step=(offset:number)=>setActiveId(picks[(index+offset+picks.length)%picks.length].id);
 return <section className="flow-feature flow-section flow-reveal" aria-labelledby="flow-feature-title">
  <div className="flow-heading"><p className="eyebrow">THE SPOTLIGHT</p><h2 id="flow-feature-title">{lang==='gu'?'નજીકથી જુઓ. મનથી પસંદ કરો.':'A closer look. A little love.'}</h2></div>
  <div className="flow-feature-layout">
   <div className="flow-feature-thumbs" aria-label={lang==='gu'?'પ્રોડક્ટ પસંદ કરો':'Choose a product'}>{picks.map((p,i)=><button key={p.id} className={p.id===active.id?'selected':''} aria-pressed={p.id===active.id} onClick={()=>setActiveId(p.id)} aria-label={productName(p,lang)}><FlowPhoto product={p} lang={lang}/><span>{String(i+1).padStart(2,'0')}</span></button>)}</div>
   <div className="flow-feature-stage"><button className="flow-feature-image" key={active.id} onClick={()=>onDetail(active)} aria-label={(lang==='gu'?'વિગતો જુઓ: ':'View details: ')+name}><FlowPhoto product={active} lang={lang}/><span><ArrowUpRight size={22}/></span></button><div className="flow-feature-controls"><button onClick={()=>step(-1)} aria-label={lang==='gu'?'પાછલી પ્રોડક્ટ':'Previous product'} disabled={picks.length<2}><ChevronLeft size={21}/></button><span>{String(index+1).padStart(2,'0')} / {String(picks.length).padStart(2,'0')}</span><button onClick={()=>step(1)} aria-label={lang==='gu'?'આગલી પ્રોડક્ટ':'Next product'} disabled={picks.length<2}><ChevronRight size={21}/></button></div></div>
   <div className="flow-feature-info" aria-live="polite" aria-atomic="true"><div className="flow-feature-copy" key={active.id}><p className="eyebrow">{categories.find(c=>c[0]===active.category)?.[lang==='gu'?1:0]??active.category}</p><h3>{name}</h3><p className="flow-feature-price">{money(active.price)}</p><p className="flow-feature-description">{lang==='gu'&&active.description_gu?active.description_gu:active.description}</p><p className="flow-stock">{active.sample?(lang==='gu'?'સેમ્પલ ફોટો અને ભાવ':'Sample image and price'):active.in_stock?(lang==='gu'?'સ્ટોકમાં ઉપલબ્ધ':'Available in stock'):(lang==='gu'?'હાલ સ્ટોકમાં નથી':'Currently out of stock')}</p></div><button className="primary" disabled={!active.in_stock} onClick={()=>onAdd(active)}><ShoppingBag size={17}/>{lang==='gu'?'બેગમાં ઉમેરો':'Add to bag'}</button><button className="flow-text-link" onClick={()=>onDetail(active)}>{lang==='gu'?'બધા ફોટા અને વિગતો જુઓ':'Explore photos & details'}<ArrowUpRight size={17}/></button><div className="flow-feature-note">MAHI CREATION<br/><span>{lang==='gu'?'દરેક અદામાં, તમારી ઓળખ.':'For every version of you.'}</span></div></div>
  </div>
 </section>;
}

export default function StorefrontFlow(props:Props){
 const {products,lang,onCategory,onDetail}=props;
 const t=(gu:string,en:string)=>lang==='gu'?gu:en;
 const root=useRef<HTMLDivElement>(null),hero=useRef<HTMLElement>(null);
 const reduced=useReducedMotion(),[intro,setIntro]=useState(false);
 const categoriesWithProducts=categories.map(c=>({category:c,product:products.find(p=>p.category===c[0])}));
 const occasion=products.filter(p=>['Sarees','Clothing','Jewellery'].includes(p.category)).slice(0,3);
 useEffect(()=>{
  if(reduced||location.search||location.hash)return;
  try{if(sessionStorage.getItem('mahi-flow-intro'))return;sessionStorage.setItem('mahi-flow-intro','1');}catch{}
  setIntro(true);const timer=setTimeout(()=>setIntro(false),1500);return()=>{clearTimeout(timer);setIntro(false);};
 },[reduced]);
 useEffect(()=>{
  const element=root.current;if(!element||reduced||!('IntersectionObserver' in window))return;
  const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.remove('flow-waiting');observer.unobserve(entry.target);}});},{threshold:0.08,rootMargin:'0px 0px -24px 0px'});
  element.querySelectorAll<HTMLElement>('.flow-reveal').forEach(node=>{if(node.getBoundingClientRect().top>window.innerHeight){node.classList.add('flow-waiting');observer.observe(node);}});
  return()=>{observer.disconnect();element.querySelectorAll('.flow-waiting').forEach(node=>node.classList.remove('flow-waiting'));};
 },[reduced,products]);
 useEffect(()=>{
  const element=hero.current;if(!element||reduced)return;
  let frame=0;
  const update=()=>{frame=0;const rect=element.getBoundingClientRect();const progress=Math.max(0,Math.min(1,-rect.top/rect.height));element.style.setProperty('--hero-scale',String(1+progress*.12));element.style.setProperty('--hero-shift',`${progress*36}px`);};
  const scroll=()=>{if(!frame)frame=requestAnimationFrame(update);};update();window.addEventListener('scroll',scroll,{passive:true});window.addEventListener('resize',scroll);
  return()=>{cancelAnimationFrame(frame);window.removeEventListener('scroll',scroll);window.removeEventListener('resize',scroll);element.style.removeProperty('--hero-scale');element.style.removeProperty('--hero-shift');};
 },[reduced]);
 return <div className="storefront-flow" ref={root}>
  <section className="flow-hero" ref={hero} aria-labelledby="flow-hero-title"><img className="flow-hero-photo" src="/hero-flow.webp" alt={t('સોનેરી કિનારીવાળી સાડીમાં માહી કલેક્શનનો દેખાવ','The Mahi edit: an ivory saree with gold detailing')} width="1536" height="1024" fetchPriority="high"/><div className="flow-hero-shade"/><div className="flow-hero-copy"><p className="eyebrow">THE MAHI EDIT / INDIAN AT HEART</p><h1 id="flow-hero-title">{t('દરેક અદામાં,','Every drape,')}<br/><em>{t('તમારી ઓળખ.','a little magic.')}</em></h1><p>{t('સુંદર સાડીઓ, મનગમતાં કપડાં અને જ્વેલરી. તમારા દરેક દિવસને ખાસ બનાવતી પસંદગી.','Beautiful sarees, thoughtful details and a touch of sparkle. Find something that feels like you.')}</p><button className="primary" onClick={()=>onCategory('All')}>{t('કલેક્શન જુઓ','Discover the collection')}<ArrowUpRight size={18}/></button><span className="flow-hero-footnote">SAREES · CLOTHING · JEWELLERY</span></div><div className="flow-hero-bottom"><span>MAHI CREATION</span><a href="#mahi-moods">{t('આગળ જુઓ','Scroll to discover')}<ArrowDown size={17}/></a><span>ROOTED IN INDIA</span></div>{intro&&!reduced&&<div className="flow-curtain" aria-hidden="true"><i/><i/><span>MAHI CREATION</span></div>}</section>
  <section className="flow-moods flow-section" id="mahi-moods" aria-labelledby="flow-moods-title"><div className="flow-heading flow-reveal"><p className="eyebrow">SIX MOODS. ONE MAHI.</p><h2 id="flow-moods-title">{t('આજે તમારો અંદાજ કયો?','What’s your mood today?')}</h2><p>{t('દરેક પસંદગીમાં કંઈક તમારું.','A little something for every side of you.')}</p></div><div className="flow-mood-grid">{categoriesWithProducts.map(({category:c,product},i)=><button className="flow-mood flow-reveal" key={c[0]} onClick={()=>onCategory(c[0])}><span className="flow-mood-image">{product?<FlowPhoto product={product} lang={lang}/>:<span className="flow-category-empty"><span>0{i+1}</span>{c[0]}</span>}<span className="flow-mood-arrow"><ArrowUpRight size={20}/></span></span><span className="flow-mood-label">{t(c[1],c[0])}</span><span className="flow-mood-subtitle">{c[2]}</span></button>)}</div></section>
  <MovingCollection products={products} lang={lang} onDetail={onDetail}/>
  {occasion.length>0&&<section className="flow-occasion" aria-labelledby="flow-occasion-title"><Wave/><div className="flow-occasion-inner"><div className="flow-occasion-copy flow-reveal"><p className="eyebrow">FOR YOUR SPECIAL MOMENTS</p><span className="flow-sparkle" aria-hidden="true">✳</span><h2 id="flow-occasion-title">{t('પ્રસંગ તમારો.','Your moment.')}<br/><em>{t('અંદાજ માહીનો.','The Mahi touch.')}</em></h2><p>{t('સાડીથી શણગાર સુધી, તમારા ખાસ દિવસ માટે મનગમતી પસંદગી શોધો.','From the first drape to the final detail, find a piece for the moments you’ll remember.')}</p><button className="flow-text-link" onClick={()=>onCategory('All')}>{t('તમારી પસંદગી શોધો','Find your occasion edit')}<ArrowRight size={18}/></button></div><div className="flow-occasion-products">{occasion.map((p,i)=><button className={'flow-occasion-card flow-reveal flow-occasion-card-'+i} onClick={()=>onDetail(p)} key={p.id}><span className="flow-occasion-image"><FlowPhoto product={p} lang={lang}/><ArrowUpRight size={19}/></span><span>{productName(p,lang)}</span><small>{money(p.price)}{p.sample?' · SAMPLE':''}</small></button>)}</div></div><Wave bottom/></section>}
  <FeaturedSelection {...props}/>
  <div className="flow-collection-invitation"><span>YOUR NEXT FAVOURITE IS HERE</span><ArrowDown size={22}/></div>
 </div>;
}

export function StyleStories({products,lang,onCategory}:Pick<Props,'products'|'lang'|'onCategory'>){
 const [active,setActive]=useState('Sarees');
 const cards=categories.filter(c=>products.some(p=>p.category===c[0])).slice(0,4);
 if(!cards.length)return null;
 const selected=cards.some(c=>c[0]===active)?active:cards[0][0];
 return <section className="flow-stories flow-section" aria-labelledby="flow-stories-title"><div className="flow-heading"><p className="eyebrow">MANY WAYS TO BE YOU</p><h2 id="flow-stories-title">{lang==='gu'?'એક નવી પસંદગી. એક નવો અંદાજ.':'Your style has more than one story.'}</h2></div><div className="flow-story-list">{cards.map((c,i)=>{const product=products.find(p=>p.category===c[0])!;const expanded=c[0]===selected;return <article className={'flow-story '+(expanded?'is-active':'')} key={c[0]}><button className="flow-story-select" onClick={()=>setActive(c[0])} aria-expanded={expanded} aria-controls={'story-'+c[0]}><FlowPhoto product={product} lang={lang}/><span className="flow-story-shade"/><span className="flow-story-number">0{i+1}</span><span className="flow-story-label">{lang==='gu'?c[1]:c[0]}</span></button><div className="flow-story-detail" id={'story-'+c[0]} hidden={!expanded}><p>{c[2]}</p><button onClick={()=>onCategory(c[0])}>{lang==='gu'?'કલેક્શન જુઓ':'Explore collection'}<ArrowUpRight size={17}/></button></div></article>;})}</div></section>;
}
