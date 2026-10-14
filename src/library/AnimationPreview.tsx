import { vectorSceneFunc } from '../render/drawingRenderer';
import { useEffect,useMemo,useState } from 'react';
import { Stage,Layer,Shape,Image as KonvaImage,Rect } from 'react-konva';
import type { Project } from '../../shared/model.js';
import { getScene } from '../../shared/model.js';
import { evaluateSceneAtTime } from '../../shared/animationEngine.js';
import { matrixFromTransform,transformPoint } from '../../shared/transforms.js';
import { loadImage } from '../assets/assetManager';
export default function AnimationPreview({project,ids,start,duration}:{project:Project;ids:string[];start:number;duration:number}){
  const [time,setTime]=useState(0),[playing,setPlaying]=useState(false),[images,setImages]=useState<Map<string,HTMLImageElement>>(new Map()),[error,setError]=useState('');
  const scene=getScene(project);
  const visibleIds=useMemo(()=>{const set=new Set(ids);for(let i=0;i<scene.layers.length;i++)for(const l of scene.layers)if(l.binding&&set.has(l.binding.parentId))set.add(l.id);return set;},[ids,scene.layers]);
  useEffect(()=>{let active=true;setError('');Promise.all(project.assets.filter(a=>scene.layers.some(l=>visibleIds.has(l.id)&&l.assetId===a.id)||scene.poseSets.some(s=>s.poses.some(p=>p.assetId===a.id))).map(async a=>[a.id,await loadImage(a.path)] as const)).then(list=>{if(active)setImages(new Map(list));}).catch(e=>{if(active)setError(e instanceof Error?e.message:'Không tải được ảnh preview.');});return()=>{active=false;};},[project.assets,scene,visibleIds]);
  useEffect(()=>{setTime(0);setPlaying(false);},[project,start,duration]);
  useEffect(()=>{if(!playing)return;let handle=0,last=performance.now();const frame=(now:number)=>{setTime(t=>(t+(now-last)/1000)%duration);last=now;handle=requestAnimationFrame(frame);};handle=requestAnimationFrame(frame);return()=>cancelAnimationFrame(handle);},[playing,duration]);
  const bounds=useMemo(()=>{const points:{x:number;y:number}[]=[];for(let i=0;i<=24;i++)for(const l of evaluateSceneAtTime(scene,start+duration*i/24).layers.filter(l=>visibleIds.has(l.id))){const t=l.transform,m=matrixFromTransform(t);for(const x of [0,t.width])for(const y of [0,t.height])points.push(transformPoint(m,{x:x-t.anchorX*t.width,y:y-t.anchorY*t.height}));}if(!points.length)return {x:0,y:0,w:scene.width,h:scene.height};const x=Math.min(...points.map(p=>p.x)),y=Math.min(...points.map(p=>p.y));return {x,y,w:Math.max(1,Math.max(...points.map(p=>p.x))-x),h:Math.max(1,Math.max(...points.map(p=>p.y))-y)};},[scene,visibleIds,start,duration]);
  const zoom=Math.min(2,360/(bounds.w+40),240/(bounds.h+40)),at=evaluateSceneAtTime(scene,start+time);
  return <div className="library-preview">
    <Stage width={400} height={280} listening={false}><Layer><Rect width={400} height={280} fill="#151923"/>{at.layers.filter(l=>visibleIds.has(l.id)&&l.visible).map(l=>{const t=l.transform;const Node=l.drawing?Shape:KonvaImage;return <Node {...(l.drawing?{drawingData:l.drawing,sceneFunc:vectorSceneFunc}:{})} key={l.id} image={images.get(l.assetId)} x={200+(t.x-bounds.x-bounds.w/2)*zoom} y={140+(t.y-bounds.y-bounds.h/2)*zoom} width={t.width} height={t.height} offsetX={t.anchorX*t.width} offsetY={t.anchorY*t.height} rotation={t.rotation} skewX={t.skewX??0} scaleX={t.scaleX*(t.flipX?-1:1)*zoom} scaleY={t.scaleY*(t.flipY?-1:1)*zoom} opacity={l.opacity}/>;})}</Layer></Stage>
    <div className="advanced-actions"><button aria-label="Play Preview" onClick={()=>setPlaying(v=>!v)}>{playing?'Dừng':'▶ Preview'}</button><span>{time.toFixed(2)} / {duration.toFixed(2)}s</span></div>
    <input aria-label="Preview Time" type="range" min={0} max={duration} step={.01} value={time} onChange={e=>{setPlaying(false);setTime(Number(e.target.value));}}/>
    {error&&<p role="alert">{error}</p>}<p className="property-note">Preview riêng, tự căn khung theo layer/nhóm; chưa sửa project. Child theo binding hiện có.</p>
  </div>;
}
