import type { Animation, AnimationProperty, Easing, Keyframe, Layer, Scene, Transform } from './model.js';
import { bindingSpace, decompose, matrixFromTransform, multiply, transformPoint } from './transforms.js';
import { samplePath } from './motionPaths.js';

export const propertyKeys: Record<AnimationProperty, ('x'|'y'|'scaleX'|'scaleY'|'rotation'|'opacity'|'zOrder')[]> = {
  position: ['x','y'], scale: ['scaleX','scaleY'], rotation: ['rotation'], opacity: ['opacity'],zOrder:['zOrder'],
};
export const easingFunctions: Record<Easing, (t: number) => number> = {
  linear: t => t, easeIn: t => t*t, easeOut: t => 1-(1-t)*(1-t), easeInOut: t => t < .5 ? 2*t*t : 1-((-2*t+2)**2)/2,
};
export function ease(easing: Easing, progress: number): number {return easingFunctions[easing](Math.max(0, Math.min(1, progress)));}
export function localAnimationTime(animation: Pick<Animation,'startTime'|'duration'|'loop'>, sceneTime: number): number | null {
  const elapsed = sceneTime - animation.startTime;
  if (elapsed < 0) return null;
  if (animation.loop === 'none') return Math.min(animation.duration, elapsed);
  if (animation.loop === 'repeat') return elapsed % animation.duration;
  const phase = elapsed % (animation.duration*2);
  return phase <= animation.duration ? phase : animation.duration*2 - phase;
}
export function sampleAnimation(animation: Animation, sceneTime: number): Partial<Keyframe> | null {
  const local = localAnimationTime(animation, sceneTime);
  if (local === null) return null;
  const frames = animation.keyframes;
  if (local <= frames[0].time) return frames[0];
  if (local >= frames[frames.length-1].time) return frames[frames.length-1];
  // Binary search: independent of previous frame/playback direction.
  let low = 0, high = frames.length-1;
  while (high-low > 1) {const middle = (low+high) >>> 1; if (frames[middle].time <= local) low = middle; else high = middle;}
  const from = frames[low], to = frames[high];
  if(animation.property==='zOrder')return from;
  const progress = ease(from.easing ?? animation.easing, (local-from.time)/(to.time-from.time));
  const result: Partial<Keyframe> = {};
  for (const key of propertyKeys[animation.property]) result[key] = from[key]! + (to[key]! - from[key]!) * progress;
  return result;
}
export function layerValues(layer: Layer & {zOrder?:number}, property: AnimationProperty): Partial<Keyframe> {
  const values: Partial<Keyframe> = {};
  for (const key of propertyKeys[property]) values[key] = key === 'opacity' ? layer.opacity : key==='zOrder' ? layer.zOrder??0 : layer.transform[key];
  return values;
}
/** Pure timestamp evaluator; the same output is intended for preview and future export. */
export type EvaluatedLayer=Layer & {zOrder:number;localTransform?:Transform};
export function evaluateSceneAtTime(scene: Scene, time: number): {layers: EvaluatedLayer[]; camera: {x: number; y: number; zoom: number;rotation:number}; time: number} {
  const t = Math.max(0, Math.min(scene.duration, Number.isFinite(time) ? time : 0));
  const tracks = new Map<string, Animation[]>();
  for (const animation of scene.animations) {const existing = tracks.get(animation.layerId) ?? []; existing.push(animation); tracks.set(animation.layerId, existing);}
  const localLayers = scene.layers.map((layer,index) => {
    const result:EvaluatedLayer = {...layer,zOrder:index, transform: {...layer.transform}};
    const poseTrack=scene.poseTracks.find(p=>p.layerId===layer.id);
    const poseKey=poseTrack?.keyframes.filter(k=>k.time<=t).at(-1);
    const pose=poseKey&&scene.poseSets.find(p=>p.id===poseTrack!.poseSetId)?.poses.find(p=>p.id===poseKey.poseId);
    if(pose){result.assetId=pose.assetId;result.transform={...result.transform,width:pose.width,height:pose.height,anchorX:pose.anchorX,anchorY:pose.anchorY};}
    for (const track of tracks.get(layer.id) ?? []) {
      const values = sampleAnimation(track, t); if (!values) continue;
      for (const key of propertyKeys[track.property]) {
        if (key === 'opacity') result.opacity = values.opacity!;
        else if(key==='zOrder')result.zOrder=values.zOrder!;
        else result.transform[key] = values[key]!;
      }
    }
    const path=scene.motionPaths.find(p=>p.layerId===layer.id),local=path&&localAnimationTime(path,t);
    if(path && local!==undefined && local!==null){
      const u=ease(path.easing,local/path.duration),sample=samplePath(path,path.reverse?1-u:u);
      result.transform.x=sample.point.x;result.transform.y=sample.point.y;
      if(path.orientToPath){const backwards=path.loop==='pingPong' && (t-path.startTime)%(path.duration*2)>path.duration;result.transform.rotation+=sample.angle+(path.reverse!==backwards?180:0);}
      if(path.followPoint){const tr=result.transform,offset=transformPoint(matrixFromTransform({...tr,x:0,y:0}),{x:(path.followPoint.x-tr.anchorX)*tr.width,y:(path.followPoint.y-tr.anchorY)*tr.height});tr.x-=offset.x;tr.y-=offset.y;}
    }
    return result;
  });
  const byId=new Map(localLayers.map(l=>[l.id,l])),resolved=new Map<string,EvaluatedLayer>();
  function world(layer:EvaluatedLayer):EvaluatedLayer {
    if(resolved.has(layer.id))return resolved.get(layer.id)!;
    const binding=layer.binding,parent=binding&&byId.get(binding.parentId);
    const space=parent&&binding?bindingSpace(world(parent),binding):undefined;
    const result=space&&binding ? {...layer,localTransform:layer.transform,transform:binding.mode==='position'?{...layer.transform,x:space[4]+layer.transform.x,y:space[5]+layer.transform.y}:decompose(multiply(space,matrixFromTransform(layer.transform)),layer.transform)} : layer;
    resolved.set(layer.id,result);return result;
  }
  const layers=localLayers.map(world).sort((a,b)=>a.zOrder-b.zOrder);
  const camera={x:scene.camera.x,y:scene.camera.y,zoom:scene.camera.zoom,rotation:scene.camera.rotation};
  for(const a of scene.camera.animations){const local=localAnimationTime(a,t);if(local===null)continue;const keys=a.keyframes,first=keys[0],last=keys.at(-1)!;let values=first;
    if(local>=last.time)values=last;else if(local>first.time){let i=0;while(i<keys.length-2&&keys[i+1].time<=local)i++;const from=keys[i],to=keys[i+1],u=ease(from.easing??a.easing,(local-from.time)/(to.time-from.time));values={id:'evaluated',time:local,...(a.property==='position'?{x:from.x!+(to.x!-from.x!)*u,y:from.y!+(to.y!-from.y!)*u}:{[a.property]:from[a.property]!+(to[a.property]!-from[a.property]!)*u})};}
    if(a.property==='position'){camera.x=values.x!;camera.y=values.y!;}else camera[a.property]=values[a.property]!;
  }
  return {layers, camera, time: t};
}
