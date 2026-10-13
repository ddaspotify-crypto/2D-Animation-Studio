import { evaluateSceneAtTime,localAnimationTime } from '../../shared/animationEngine.js';
import type { Camera,CameraTrack,CameraKey,Scene } from '../../shared/model.js';
export function upsertCameraKey(scene:Scene,property:CameraTrack['property'],time:number,values?:Partial<CameraKey>):Scene{
  const at=Math.max(0,Math.min(scene.duration,time)),current=evaluateSceneAtTime(scene,at).camera;
  const old=scene.camera.animations.find(a=>a.property===property);
  const track:CameraTrack=old??{id:crypto.randomUUID(),property,startTime:0,duration:scene.duration,easing:'linear',loop:'none',keyframes:[]};
  // Absolute scene-time insertion, preserving existing global key times even with a shifted start.
  const start=Math.min(track.startTime,at),delta=track.startTime-start,local=old&&old.loop!=='none'&&at>=old.startTime?localAnimationTime(old,at)!:at-start;
  const keys=track.keyframes.map(k=>({...k,time:k.time+delta})),found=keys.find(k=>Math.abs(k.time-local)<1e-6);
  if(!old&&at>0)keys.push({id:crypto.randomUUID(),time:0,...(property==='position'?{x:scene.camera.x,y:scene.camera.y}:{[property]:scene.camera[property]})});
  const key:CameraKey={...found,id:found?.id??crypto.randomUUID(),time:local,...(values&&Object.hasOwn(values,'easing')?{easing:values.easing}:{}),...(property==='position'?{x:values?.x??current.x,y:values?.y??current.y}:{[property]:values?.[property]??current[property]})};
  const next={...track,startTime:start,duration:Math.max(track.duration+delta,local,.001),keyframes:[...keys.filter(k=>k.id!==found?.id),key].sort((a,b)=>a.time-b.time)};
  return {...scene,camera:{...scene.camera,animations:[...scene.camera.animations.filter(a=>a.property!==property),next]}};
}
export function editCamera(scene:Scene,patch:Partial<Pick<Camera,'x'|'y'|'zoom'|'rotation'>>,time:number,autoKey:boolean):Scene{
  if(!autoKey)return {...scene,camera:{...scene.camera,...patch}};
  let next=scene;if(patch.x!==undefined||patch.y!==undefined)next=upsertCameraKey(next,'position',time,patch);if(patch.zoom!==undefined)next=upsertCameraKey(next,'zoom',time,patch);if(patch.rotation!==undefined)next=upsertCameraKey(next,'rotation',time,patch);return next;
}
