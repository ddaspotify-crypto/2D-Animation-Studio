import { useEffect,useRef } from 'react';
import Konva from 'konva';
import { Stage,Layer,Rect,Group,Image as KonvaImage } from 'react-konva';
import { getScene } from '../../shared/model.js';
import { evaluateSceneAtTime } from '../../shared/animationEngine.js';
import { cameraProjection } from '../../shared/cameraEngine.js';
import { useEditor } from '../store/editorStore';
import { usePlayback } from '../store/playbackStore';
import { loadImage } from '../assets/assetManager';
export default function OutputCameraPreview({width,height}:{width:number;height:number}){
 const project=useEditor(s=>s.project),scene=getScene(project),stage=useRef<Konva.Stage>(null),world=useRef<Konva.Group>(null),zoom=Math.max(.001,Math.min((width-40)/scene.width,(height-40)/scene.height)),w=scene.width*zoom,h=scene.height*zoom;
 useEffect(()=>{let active=true;const images=new Map<string,HTMLImageElement>();const render=()=>{const evaluated=evaluateSceneAtTime(scene,usePlayback.getState().time),camera=cameraProjection(scene,evaluated.camera);world.current?.setAttrs({x:camera.x*zoom,y:camera.y*zoom,scaleX:camera.zoom*zoom,scaleY:camera.zoom*zoom,rotation:camera.rotation});for(const l of evaluated.layers){const node=stage.current?.findOne('#'+l.id),t=l.transform;node?.setAttrs({x:t.x,y:t.y,width:t.width,height:t.height,scaleX:t.scaleX*(t.flipX?-1:1),scaleY:t.scaleY*(t.flipY?-1:1),rotation:t.rotation,skewX:t.skewX??0,offsetX:t.anchorX*t.width,offsetY:t.anchorY*t.height,opacity:l.opacity,visible:l.visible,image:images.get(l.assetId)});node?.moveToTop();}stage.current?.batchDraw();};render();Promise.all(project.assets.map(async a=>{try{const image=await loadImage(a.path);if(active)images.set(a.id,image);}catch{}})).then(()=>{if(active)render();});const unsubscribe=usePlayback.subscribe(render);return()=>{active=false;unsubscribe();};},[scene,project.assets,zoom]);
 return <div className="output-camera-preview" aria-label="Output Camera Preview"><Stage ref={stage} width={w} height={h} listening={false}><Layer><Rect width={w} height={h} fill={scene.background}/><Group ref={world}>{scene.layers.map(l=><KonvaImage key={l.id} id={l.id} image={undefined}/>)}</Group></Layer></Stage></div>;
}
