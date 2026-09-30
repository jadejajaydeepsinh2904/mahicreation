import {useId} from 'react';
import {sampleViewBox} from './sample-catalog';

export default function SamplePhoto({sheet,index,label,className=''}:{sheet:string;index:number;label:string;className?:string}){
  const clipId=useId(),viewBox=sampleViewBox(sheet,index);
  const [x,y,width,height]=viewBox.split(' ').map(Number);
  return <svg className={'photo sample-catalog-photo '+className} viewBox={viewBox} preserveAspectRatio="xMidYMid meet" role="img" aria-label={label}>
    <defs><clipPath id={clipId}><rect x={x} y={y} width={width} height={height}/></clipPath></defs>
    <image href={`/samples/${sheet}.webp`} x="0" y="0" width="1000" height="500" preserveAspectRatio="none" clipPath={`url(#${clipId})`}/>
  </svg>;
}
