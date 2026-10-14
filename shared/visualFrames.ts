import { evaluateSceneAtTime } from './animationEngine.js';
import { activeCodeFrame,sampleCodeFrames } from './frameCode.js';
import type { Layer,Scene } from './model.js';
import type { CodeFrame } from './drawingModel.js';
import { bindingSpace,decompose,inverse,matrixFromTransform,multiply } from './transforms.js';

/** A frame stores local poses; parent bindings are evaluated afterwards as usual. */
export function captureVisualPose(scene:Scene,layerId:string,time:number){
 const layer=scene.layers.find(l=>l.id===layerId)!,world=evaluateSceneAtTime(scene,time).layers.find(l=>l.id===layerId)!,pose=sampleCodeFrames(layer.codeFrames,time,scene.fps),transform={...(world.localTransform??world.transform)};
 transform.x-=pose.offset.x;transform.y-=pose.offset.y;transform.rotation-=pose.rotation;transform.scaleX/=pose.scale.x;transform.scaleY/=pose.scale.y;
 return {transform,opacity:pose.opacity>0?world.opacity/pose.opacity:activeCodeFrame(layer.codeFrames,time,scene.fps)?.visual?.opacity??layer.opacity,visible:world.visible};
}

export function createVisualFrames(scene:Scene,ids:string[],start:number,batchId:string,makeId:()=>string){
 if(!Number.isInteger(start)||start<0||start>=Math.ceil(scene.duration*scene.fps-1e-9))throw Error('Đưa playhead trước cuối Scene.');
 const targets=scene.layers.filter(l=>ids.includes(l.id));if(!targets.length)throw Error('Chọn Layer hoặc Group trước khi tạo frame.');
 if(targets.some(l=>l.locked))throw Error('Mở khóa các Layer đã chọn trước khi tạo frame.');
 if(targets.every(l=>l.codeFrames?.some(f=>f.startFrame===start&&f.visual)))return scene;
 return {...scene,layers:scene.layers.map(layer=>{
  if(!ids.includes(layer.id))return layer;
  const frames=layer.codeFrames??[],exact=frames.find(f=>f.startFrame===start);
  if(exact)return {...layer,codeFrames:frames.map(f=>f===exact?{...f,batchId,visual:f.visual??captureVisualPose(scene,layer.id,start/scene.fps)}:f)};
  const previous=frames.filter(f=>f.startFrame<start).at(-1),sourceTime=previous?Math.min(start-1,previous.startFrame+previous.holdFrames-1)/scene.fps:start/scene.fps;
  const frame:CodeFrame={id:makeId(),batchId,startFrame:start,holdFrames:1,transition:'interpolate',code:previous?.code??'frame.offset({ x: 0, y: 0 });',visual:previous?.visual?structuredClone(previous.visual):captureVisualPose(scene,layer.id,sourceTime)};
  return {...layer,codeFrames:[...frames.map(f=>f.startFrame<start&&f.startFrame+f.holdFrames>start?{...f,holdFrames:start-f.startFrame}:f),frame].sort((a,b)=>a.startFrame-b.startFrame)};
 })};
}

export function editVisualFrame(scene:Scene,ownerId:string,frameId:string,edits:{id:string;patch:Partial<Layer>}[],time:number):Scene|null {
 const owner=scene.layers.find(l=>l.id===ownerId),selected=owner?.codeFrames?.find(f=>f.id===frameId);
 if(!selected?.visual)return null;
 if(activeCodeFrame(owner!.codeFrames,time,scene.fps)?.id!==selected.id)throw Error('Click ô Code Frame tại vị trí muốn sửa trước khi chỉnh Canvas.');
 const evaluated=evaluateSceneAtTime(scene,time),updated=new Map<string,CodeFrame>();
 for(const {id,patch} of edits){
  if(!patch.transform&&patch.opacity===undefined&&patch.visible===undefined)continue;
  const layer=scene.layers.find(l=>l.id===id);if(!layer||layer.locked)continue;
  const frame=layer.codeFrames?.find(f=>selected.batchId?f.batchId===selected.batchId:f.id===selected.id);
  if(!frame?.visual)throw Error('Layer này chưa thuộc frame đang sửa. Chọn Layer/Group và tạo Code Frame tại playhead trước.');
  const current=evaluated.layers.find(l=>l.id===id)!,parent=layer.binding&&evaluated.layers.find(l=>l.id===layer.binding!.parentId),parentTransform=parent&&(edits.find(e=>e.id===parent.id)?.patch.transform??parent.transform);
  let transform=patch.transform?{...patch.transform}:{...(current.localTransform??current.transform)};
  if(patch.transform&&parent&&parentTransform&&layer.binding)transform=decompose(multiply(inverse(bindingSpace({...parent,transform:parentTransform},layer.binding)),matrixFromTransform(transform)),transform);
  const pose=sampleCodeFrames(layer.codeFrames,time,scene.fps);transform.x-=pose.offset.x;transform.y-=pose.offset.y;transform.rotation-=pose.rotation;transform.scaleX/=pose.scale.x;transform.scaleY/=pose.scale.y;
  const opacity=patch.opacity??current.opacity;
  updated.set(id,{...frame,visual:{transform,opacity:pose.opacity>0?opacity/pose.opacity:frame.visual.opacity,visible:patch.visible??current.visible}});
 }
 return {...scene,layers:scene.layers.map(l=>updated.has(l.id)?{...l,codeFrames:l.codeFrames!.map(f=>f.id===updated.get(l.id)!.id?updated.get(l.id)!:f)}:l)};
}
