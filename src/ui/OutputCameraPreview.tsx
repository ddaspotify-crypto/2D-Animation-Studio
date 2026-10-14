import { useEffect,useRef } from 'react';
import Konva from 'konva';
import { Stage,Layer,Rect,Group,Image as KonvaImage } from 'react-konva';
import { getScene } from '../../shared/model.js';
import { drawOutputFrame } from '../render/outputRenderer';
import { useEditor } from '../store/editorStore';
import { usePlayback } from '../store/playbackStore';
import { loadImage } from '../assets/assetManager';
export default function OutputCameraPreview({width,height}:{width:number;height:number}){
 const project=useEditor(s=>s.project),scene=getScene(project),stage=useRef<Konva.Stage>(null),world=useRef<Konva.Group>(null),zoom=Math.max(.001,Math.min((width-40)/scene.width,(height-40)/scene.height)),w=scene.width*zoom,h=scene.height*zoom;
 useEffect(()=>{let active=true;const images=new Map<string,HTMLImageElement>();const render=()=>{if(stage.current&&world.current)drawOutputFrame(stage.current,world.current,scene,usePlayback.getState().time,images,zoom);};render();Promise.all(project.assets.map(async a=>{try{const image=await loadImage(a.path);if(active)images.set(a.id,image);}catch{}})).then(()=>{if(active)render();});const unsubscribe=usePlayback.subscribe(render);return()=>{active=false;unsubscribe();};},[scene,project.assets,zoom]);
 return <div className="output-camera-preview" aria-label="Output Camera Preview"><Stage ref={stage} width={w} height={h} listening={false}><Layer><Rect width={w} height={h} fill={scene.background}/><Group><Group ref={world}>{scene.layers.map(l=><KonvaImage key={l.id} id={l.id} image={undefined}/>)}</Group></Group></Layer></Stage></div>;
}
