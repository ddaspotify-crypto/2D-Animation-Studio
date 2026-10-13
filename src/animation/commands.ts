import { evaluateSceneAtTime, layerValues, localAnimationTime, propertyKeys } from '../../shared/animationEngine.js';
import type { Animation, AnimationProperty, Keyframe, Layer, Scene } from '../../shared/model.js';

/** Data-only starter presets; React only dispatches the selected preset. */
export function createAnimationPreset(scene: Scene, layerId: string, property: AnimationProperty, startTime: number): Animation {
  if (startTime >= scene.duration) throw new Error('Đưa playhead về trước cuối scene để thêm animation.');
  const layer = evaluateSceneAtTime(scene, startTime).layers.find(l => l.id === layerId);
  if (!layer) throw new Error('Layer không tồn tại.');
  const duration = Math.min(2, scene.duration-startTime);
  const values = layerValues(layer, property), end = {...values};
  if (property === 'position') end.x = Math.min(1e7, values.x!+300);
  if (property === 'scale') {end.scaleX = Math.min(100, values.scaleX!*1.5); end.scaleY = Math.min(100, values.scaleY!*1.5);}
  if (property === 'rotation') end.rotation = Math.min(1e7, values.rotation!+90);
  if (property === 'opacity') end.opacity = 0;
  return {id: crypto.randomUUID(), layerId, property, startTime, duration, easing: 'linear', loop: 'none',
    keyframes: [{...values, id: crypto.randomUUID(), time: 0}, {...end, id: crypto.randomUUID(), time: duration}]};
}

export function upsertKeyframe(scene: Scene, layerId: string, property: AnimationProperty, sceneTime: number, values?: Partial<Keyframe>): Scene {
  const layer = scene.layers.find(l => l.id === layerId);
  if (!layer || layer.locked) return scene;
  const atTime = Math.max(0, Math.min(scene.duration, sceneTime));
  const current = evaluateSceneAtTime(scene, atTime).layers.find(l => l.id === layerId)!;
  const evaluated = layerValues(current, property);
  const fields: Partial<Keyframe> = {};
  for (const key of propertyKeys[property]) fields[key] = values?.[key] ?? evaluated[key];
  const existing = scene.animations.find(a => a.layerId === layerId && a.property === property);
  let animation = existing ?? {id: crypto.randomUUID(), layerId, property, startTime: 0, duration: scene.duration, easing: 'linear' as const, loop: 'none' as const, keyframes: []};
  if (!existing && atTime > 1e-6) animation = {...animation, keyframes: [{...layerValues(layer, property), id: crypto.randomUUID(), time: 0}]};
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
    const base = result.layers.find(l => l.id === id), current = evaluated.layers.find(l => l.id === id);
    if (!base || !current) continue;
    const next = {...current, ...patch};
    const transform = {...base.transform};
    let opacity = base.opacity;
    for (const property of ['position','scale','rotation','opacity'] as AnimationProperty[]) {
      const keys = propertyKeys[property];
      const values = layerValues(next, property), previous = layerValues(current, property);
      if (!keys.some(key => values[key] !== previous[key])) continue;
      if (base.locked) continue;
      if (autoKey) result = upsertKeyframe(result, id, property, time, values);
      else for (const key of keys) {if (key === 'opacity') opacity = values[key]!; else transform[key] = values[key]!;}
    }
    if (patch.transform && !base.locked) for (const key of ['width','height','anchorX','anchorY'] as const) transform[key] = patch.transform[key];
    result = {...result, layers: result.layers.map(l => l.id === id ? {...l, ...patch, opacity, transform} : l)};
  }
  return result;
}
