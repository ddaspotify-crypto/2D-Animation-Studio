import { evaluateSceneAtTime, layerValues, localAnimationTime, propertyKeys } from '../../shared/animationEngine.js';
import { sampleCodeFrames } from '../../shared/frameCode.js';
import type { Animation, AnimationProperty, Keyframe, Layer, Scene } from '../../shared/model.js';
import { bindingSpace, decompose, inverse, matrixFromTransform, multiply } from '../../shared/transforms.js';
function underlyingValues(values:Partial<Keyframe>,layer:Layer,property:AnimationProperty,time:number,fps:number){const pose=sampleCodeFrames(layer.codeFrames,time,fps),v={...values};if(property==='position'){v.x!-=pose.offset.x;v.y!-=pose.offset.y;}if(property==='rotation')v.rotation!-=pose.rotation;if(property==='scale'){v.scaleX!/=pose.scale.x;v.scaleY!/=pose.scale.y;}if(property==='opacity'&&pose.opacity>0)v.opacity!/=pose.opacity;return v;}

/** Data-only starter presets; React only dispatches the selected preset. */
export function createAnimationPreset(scene: Scene, layerId: string, property: AnimationProperty, startTime: number): Animation {
  if (startTime >= scene.duration) throw new Error('Đưa playhead về trước cuối scene để thêm animation.');
  const layer = evaluateSceneAtTime(scene, startTime).layers.find(l => l.id === layerId);
  if (!layer) throw new Error('Layer không tồn tại.');
  const duration = Math.min(2, scene.duration-startTime);
  const values = underlyingValues(layerValues({...layer,transform:layer.localTransform??layer.transform}, property),layer,property,startTime,scene.fps), end = {...values};
  if (property === 'position') end.x = Math.min(1e7, values.x!+300);
  if (property === 'scale') {end.scaleX = Math.min(100, values.scaleX!*1.5); end.scaleY = Math.min(100, values.scaleY!*1.5);}
  if (property === 'rotation') end.rotation = Math.min(1e7, values.rotation!+90);
  if (property === 'opacity') end.opacity = 0;
  if(property==='zOrder')end.zOrder=Math.min(500,(values.zOrder??0)+1);
  return {id: crypto.randomUUID(), layerId, property, startTime, duration, easing: 'linear', loop: 'none',
    keyframes: [{...values, id: crypto.randomUUID(), time: 0}, {...end, id: crypto.randomUUID(), time: duration}]};
}

export function upsertKeyframe(scene: Scene, layerId: string, property: AnimationProperty, sceneTime: number, values?: Partial<Keyframe>): Scene {
  const layer = scene.layers.find(l => l.id === layerId);
  if (!layer || layer.locked) return scene;
  const atTime = Math.max(0, Math.min(scene.duration, sceneTime));
  const world = evaluateSceneAtTime(scene, atTime).layers.find(l => l.id === layerId)!;
  const current={...world,transform:world.localTransform??world.transform};
  const evaluated = underlyingValues(layerValues(current, property),layer,property,atTime,scene.fps);
  const fields: Partial<Keyframe> = {};
  for (const key of propertyKeys[property]) fields[key] = values?.[key] ?? evaluated[key];
  const existing = scene.animations.find(a => a.layerId === layerId && a.property === property);
  let animation = existing ?? {id: crypto.randomUUID(), layerId, property, startTime: 0, duration: scene.duration, easing: 'linear' as const, loop: 'none' as const, keyframes: []};
  if (!existing && atTime > 1e-6) animation = {...animation, keyframes: [{...layerValues({...layer,zOrder:scene.layers.indexOf(layer)}, property), id: crypto.randomUUID(), time: 0}]};
  if (atTime < animation.startTime) {
    const delta = animation.startTime-atTime;
    animation = {...animation, startTime: atTime, duration: animation.duration+delta, keyframes: animation.keyframes.map(k => ({...k, time: k.time+delta}))};
  }
  const local = animation.loop === 'none' ? atTime-animation.startTime : localAnimationTime(animation, atTime)!;
  animation = {...animation, duration: Math.max(animation.duration, local)};
  const found = animation.keyframes.find(k => Math.abs(k.time-local) < 1e-6);
  const keyframe: Keyframe = {...found, ...(values && Object.hasOwn(values, 'easing') ? {easing: values.easing} : {}), ...fields, id: found?.id ?? crypto.randomUUID(), time: found?.time ?? local};
  const keys = [...animation.keyframes.filter(k => k.id !== keyframe.id), keyframe].sort((a,b) => a.time-b.time);
  animation = {...animation, keyframes: keys};
  return {...scene, animations: [...scene.animations.filter(a => a.id !== animation.id), animation]};
}
export function applyLayerEdits(scene: Scene, edits: {id: string; patch: Partial<Layer>}[], time: number, autoKey: boolean): Scene {
  let result = scene;
  const evaluated = evaluateSceneAtTime(scene, time);
  for (const {id, patch} of edits) {
    const base = result.layers.find(l => l.id === id), world = evaluated.layers.find(l => l.id === id);
    if(!base||!world)continue;
    const oldParent=base.binding&&evaluated.layers.find(l=>l.id===base.binding!.parentId);
    const parent=oldParent?{...oldParent,transform:edits.find(e=>e.id===oldParent.id)?.patch.transform??oldParent.transform}:oldParent;
    const localPatch=patch.transform&&parent&&base.binding ? {...patch,transform:decompose(multiply(inverse(bindingSpace(parent,base.binding)),matrixFromTransform(patch.transform)),patch.transform)} : patch;
    const current={...world,transform:world.localTransform??world.transform};
    if (!base || !current) continue;
    const next = {...current, ...localPatch};
    const transform = {...base.transform};
    let opacity = base.opacity;
    for (const property of ['position','scale','rotation','opacity'] as AnimationProperty[]) {
      const keys = propertyKeys[property];
      const values = layerValues(next, property), previous = layerValues(current, property);
      if (!keys.some(key => values[key] !== previous[key])) continue;
      if (base.locked) continue;
      const pose=sampleCodeFrames(base.codeFrames,time,scene.fps);
      if(property==='position'){values.x!-=pose.offset.x;values.y!-=pose.offset.y;}
      if(property==='rotation')values.rotation!-=pose.rotation;
      if(property==='scale'){values.scaleX!/=pose.scale.x;values.scaleY!/=pose.scale.y;}
      if(property==='opacity'&&pose.opacity>0)values.opacity!/=pose.opacity;
      if (autoKey) result = upsertKeyframe(result, id, property, time, values);
      else for (const key of keys) {if (key === 'opacity') opacity = values[key]!; else if(key!=='zOrder')transform[key] = values[key]!;}
    }
    if (localPatch.transform && !base.locked) for (const key of ['width','height','anchorX','anchorY','skewX'] as const) if(localPatch.transform[key]!==current.transform[key]) transform[key] = localPatch.transform[key] as number;
    if (localPatch.transform && !base.locked) for (const key of ['flipX','flipY'] as const) if(localPatch.transform[key]!==current.transform[key]) transform[key] = localPatch.transform[key];
    result = {...result, layers: result.layers.map(l => l.id === id ? {...l, ...localPatch, opacity, transform} : l)};
  }
  return result;
}
