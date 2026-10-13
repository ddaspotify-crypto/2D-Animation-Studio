import { evaluateSceneAtTime } from '../../shared/animationEngine.js';
import type { Binding, MotionPath, Scene, Transform } from '../../shared/model.js';
import { bindingSpace, decompose, identity, inverse, matrixFromTransform, multiply } from '../../shared/transforms.js';

export function createMotionPath(scene:Scene,layerId:string,type:MotionPath['type'],time:number):MotionPath {
  const layer=evaluateSceneAtTime(scene,time).layers.find(l=>l.id===layerId);if(!layer)throw new Error('Layer không tồn tại.');
  if(time>=scene.duration)throw new Error('Đưa playhead về trước cuối scene để tạo đường đi.');
  const t=layer.localTransform??layer.transform,a={x:t.x,y:t.y},b={x:t.x+400,y:t.y};
  let points:MotionPath['points']=[a,b];
  if(type==='polyline'||type==='freehand')points=[a,{x:t.x+180,y:t.y-120},b];
  if(type==='bezier')points=[{...a,out:{x:a.x+100,y:a.y-180}},{...b,in:{x:b.x-100,y:b.y-180}}];
  if(type==='circle')points=[{x:a.x-200,y:a.y},{x:a.x,y:a.y}];
  if(type==='ellipse')points=[{x:a.x-220,y:a.y},{x:a.x,y:a.y+120}];
  return {id:crypto.randomUUID(),layerId,type,points,startTime:time,duration:Math.min(4,scene.duration-time),easing:'linear',loop:'none',reverse:false,orientToPath:false,show:true};
}
/** Preserve the child's world pose at the current playhead when changing its parent. */
export function changeBinding(scene:Scene,childId:string,binding:Binding|null,time:number):Scene {
  const evaluated=evaluateSceneAtTime(scene,time),child=evaluated.layers.find(l=>l.id===childId),base=scene.layers.find(l=>l.id===childId);
  if(!child||!base||base.locked)return scene;
  const parent=binding&&evaluated.layers.find(l=>l.id===binding.parentId);
  const space=parent&&binding?bindingSpace(parent,binding):identity;
  const local=decompose(multiply(inverse(space),matrixFromTransform(child.transform)),child.transform);
  const oldLocal=child.localTransform??child.transform;
  const delta={x:local.x-oldLocal.x,y:local.y-oldLocal.y,rotation:local.rotation-oldLocal.rotation,scaleX:local.scaleX/oldLocal.scaleX,scaleY:local.scaleY/oldLocal.scaleY};
  const transform:Transform={...base.transform,x:base.transform.x+delta.x,y:base.transform.y+delta.y,rotation:base.transform.rotation+delta.rotation,scaleX:base.transform.scaleX*delta.scaleX,scaleY:base.transform.scaleY*delta.scaleY,skewX:local.skewX,flipX:local.flipX,flipY:local.flipY};
  return {...scene,layers:scene.layers.map(l=>l.id===childId?{...l,binding,transform}:l),animations:scene.animations.map(a=>a.layerId!==childId?a:{...a,keyframes:a.keyframes.map(k=>({...k,...(a.property==='position'?{x:k.x!+delta.x,y:k.y!+delta.y}:a.property==='rotation'?{rotation:k.rotation!+delta.rotation}:a.property==='scale'?{scaleX:k.scaleX!*delta.scaleX,scaleY:k.scaleY!*delta.scaleY}: {})}))}),
    motionPaths:scene.motionPaths.map(p=>p.layerId!==childId?p:{...p,points:p.points.map(q=>({...q,x:q.x+delta.x,y:q.y+delta.y,...(q.in?{in:{x:q.in.x+delta.x,y:q.in.y+delta.y}}:{}),...(q.out?{out:{x:q.out.x+delta.x,y:q.out.y+delta.y}}:{})}))})};
}
