import type { Animation, AnimationProperty, Easing, Keyframe, Layer, Scene, Transform,PoseTrack } from './model.js';
import { bindingSpace, decompose, matrixFromTransform, multiply, transformPoint } from './transforms.js';
import { samplePath } from './motionPaths.js';
import { activeCodeFrame,sampleCodeFrames,deformDrawing } from './frameCode.js';

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
  const poseTracks=new Map(scene.poseTracks.map(p=>[p.layerId,p])),paths=new Map(scene.motionPaths.map(p=>[p.layerId,p])),poseSets=new Map(scene.poseSets.map(p=>[p.id,new Map(p.poses.map(pose=>[pose.id,pose]))]));
  const localLayers = scene.layers.map((layer,index) => {
    const result:EvaluatedLayer = {...layer,zOrder:index, transform: {...layer.transform}};
    const poseTrack=poseTracks.get(layer.id),keys=poseTrack?.keyframes;
    let poseKey:PoseTrack['keyframes'][number]|undefined;
    if(keys?.length&&keys[0].time<=t){let low=0,high=keys.length;while(high-low>1){const mid=(low+high)>>>1;if(keys[mid].time<=t)low=mid;else high=mid;}poseKey=keys[low];}
    const pose=poseKey&&poseSets.get(poseTrack!.poseSetId)?.get(poseKey.poseId);
    if(pose){result.assetId=pose.assetId;result.transform={...result.transform,width:pose.width,height:pose.height,anchorX:pose.anchorX,anchorY:pose.anchorY};}
    for (const track of tracks.get(layer.id) ?? []) {
      const values = sampleAnimation(track, t); if (!values) continue;
      for (const key of propertyKeys[track.property]) {
        if (key === 'opacity') result.opacity = values.opacity!;
        else if(key==='zOrder')result.zOrder=values.zOrder!;
        else result.transform[key] = values[key]!;
      }
    }
    const path=paths.get(layer.id),local=path&&localAnimationTime(path,t);
    if(path && local!==undefined && local!==null){
      const u=ease(path.easing,local/path.duration),sample=samplePath(path,path.reverse?1-u:u);
      result.transform.x=sample.point.x;result.transform.y=sample.point.y;
      if(path.orientToPath){const backwards=path.loop==='pingPong' && (t-path.startTime)%(path.duration*2)>path.duration;result.transform.rotation+=sample.angle+(path.reverse!==backwards?180:0);}
      if(path.followPoint){const tr=result.transform,offset=transformPoint(matrixFromTransform({...tr,x:0,y:0}),{x:(path.followPoint.x-tr.anchorX)*tr.width,y:(path.followPoint.y-tr.anchorY)*tr.height});tr.x-=offset.x;tr.y-=offset.y;}
    }
    if(layer.codeFrames?.length){const active=activeCodeFrame(layer.codeFrames,t,scene.fps);if(active?.visual){result.transform={...active.visual.transform};result.opacity=active.visual.opacity;result.visible=active.visual.visible;const next=layer.codeFrames[layer.codeFrames.indexOf(active)+1];if(active.transition==='interpolate'&&next?.visual&&next.startFrame===active.startFrame+active.holdFrames){const u=Math.min(1,(t*scene.fps-active.startFrame)/active.holdFrames);for(const key of ['x','y','width','height','scaleX','scaleY','rotation','anchorX','anchorY'] as const)result.transform[key]+= (next.visual.transform[key]-result.transform[key])*u;result.opacity+=(next.visual.opacity-result.opacity)*u;}}const frame=sampleCodeFrames(layer.codeFrames,t,scene.fps);result.transform.x+=frame.offset.x;result.transform.y+=frame.offset.y;result.transform.rotation+=frame.rotation;result.transform.scaleX*=frame.scale.x;result.transform.scaleY*=frame.scale.y;result.opacity*=frame.opacity;if(layer.drawing)result.drawing=deformDrawing(layer.drawing,frame);}
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
