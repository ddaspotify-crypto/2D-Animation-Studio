import type { Animation, AnimationProperty, Easing, Keyframe, Layer, Scene } from './model.js';

export const propertyKeys: Record<AnimationProperty, ('x'|'y'|'scaleX'|'scaleY'|'rotation'|'opacity')[]> = {
  position: ['x','y'], scale: ['scaleX','scaleY'], rotation: ['rotation'], opacity: ['opacity'],
};
export const easingFunctions: Record<Easing, (t: number) => number> = {
  linear: t => t, easeIn: t => t*t, easeOut: t => 1-(1-t)*(1-t), easeInOut: t => t < .5 ? 2*t*t : 1-((-2*t+2)**2)/2,
};
export function ease(easing: Easing, progress: number): number {return easingFunctions[easing](Math.max(0, Math.min(1, progress)));}
export function localAnimationTime(animation: Animation, sceneTime: number): number | null {
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
  const progress = ease(from.easing ?? animation.easing, (local-from.time)/(to.time-from.time));
  const result: Partial<Keyframe> = {};
  for (const key of propertyKeys[animation.property]) result[key] = from[key]! + (to[key]! - from[key]!) * progress;
  return result;
}
export function layerValues(layer: Layer, property: AnimationProperty): Partial<Keyframe> {
  const values: Partial<Keyframe> = {};
  for (const key of propertyKeys[property]) values[key] = key === 'opacity' ? layer.opacity : layer.transform[key];
  return values;
}
/** Pure timestamp evaluator; the same output is intended for preview and future export. */
export function evaluateSceneAtTime(scene: Scene, time: number): {layers: Layer[]; camera: {x: number; y: number; zoom: number}; time: number} {
  const t = Math.max(0, Math.min(scene.duration, Number.isFinite(time) ? time : 0));
  const tracks = new Map<string, Animation[]>();
  for (const animation of scene.animations) {const existing = tracks.get(animation.layerId) ?? []; existing.push(animation); tracks.set(animation.layerId, existing);}
  const layers = scene.layers.map(layer => {
    const result = {...layer, transform: {...layer.transform}};
    for (const track of tracks.get(layer.id) ?? []) {
      const values = sampleAnimation(track, t); if (!values) continue;
      for (const key of propertyKeys[track.property]) {
        if (key === 'opacity') result.opacity = values.opacity!;
        else result.transform[key] = values[key]!;
      }
    }
    return result;
  });
  return {layers, camera: {x: scene.width/2, y: scene.height/2, zoom: 1}, time: t};
}
