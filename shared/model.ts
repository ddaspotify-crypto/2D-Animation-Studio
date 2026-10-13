import { z } from 'zod';

export const SCHEMA_VERSION = 2;
const id = z.string().min(1).max(100).regex(/^[\w-]+$/);
const finite = z.number().finite().min(-1e7).max(1e7);
const size = z.number().finite().positive().max(16384);
export const transformSchema = z.object({
  x: finite, y: finite, width: size, height: size,
  scaleX: z.number().finite().positive().max(100), scaleY: z.number().finite().positive().max(100),
  rotation: finite, anchorX: z.number().min(0).max(1), anchorY: z.number().min(0).max(1),
}).strict();
export const assetSchema = z.object({
  id, name: z.string().min(1).max(250),
  path: z.string().regex(/^assets\/[a-f0-9]{64}\.(png|jpg|jpeg|webp)$/),
  folder: z.string().max(500), mime: z.enum(['image/png', 'image/jpeg', 'image/webp']),
  width: size, height: size,
}).strict();
export const layerSchema = z.object({
  id, name: z.string().min(1).max(250), assetId: id,
  visible: z.boolean(), locked: z.boolean(), opacity: z.number().min(0).max(1),
  transform: transformSchema,
}).strict();
export const easingSchema = z.enum(['linear', 'easeIn', 'easeOut', 'easeInOut']);
export const animationPropertySchema = z.enum(['position', 'scale', 'rotation', 'opacity']);
export const keyframeSchema = z.object({
  id, time: z.number().finite().nonnegative().max(86400), easing: easingSchema.optional(),
  x: finite.optional(), y: finite.optional(),
  scaleX: z.number().finite().positive().max(100).optional(), scaleY: z.number().finite().positive().max(100).optional(),
  rotation: finite.optional(), opacity: z.number().min(0).max(1).optional(),
}).strict();
export const animationSchema = z.object({
  id, layerId: id, property: animationPropertySchema,
  startTime: z.number().finite().nonnegative().max(86400), duration: z.number().finite().positive().max(86400),
  easing: easingSchema, loop: z.enum(['none', 'repeat', 'pingPong']),
  keyframes: z.array(keyframeSchema).min(1).max(2000),
}).strict().superRefine((animation, ctx) => {
  const keys = animation.property === 'position' ? ['x','y'] : animation.property === 'scale' ? ['scaleX','scaleY'] : [animation.property];
  const frameIds = new Set<string>(); let previousTime = -1;
  for (const frame of animation.keyframes) {
    if (frameIds.has(frame.id) || frame.time <= previousTime || frame.time > animation.duration + 1e-8) ctx.addIssue({code: 'custom', message: 'Keyframes phải có ID/thời gian khác nhau, tăng dần và trong duration.'});
    frameIds.add(frame.id); previousTime = frame.time;
    for (const key of keys) if (frame[key as keyof typeof frame] === undefined) ctx.addIssue({code: 'custom', message: `Keyframe ${frame.id} thiếu ${key}.`});
    for (const key of ['x','y','scaleX','scaleY','rotation','opacity']) if (!keys.includes(key) && frame[key as keyof typeof frame] !== undefined) ctx.addIssue({code: 'custom', message: `Keyframe không được chứa ${key} trong track ${animation.property}.`});
  }
});
export const sceneSchema = z.object({
  id, name: z.string().min(1).max(250), width: size, height: size,
  fps: z.number().int().min(1).max(120), duration: z.number().positive().max(86400),
  background: z.string().regex(/^#[a-fA-F0-9]{6}$/), layers: z.array(layerSchema).max(500),
  animations: z.array(animationSchema).max(2000),
}).strict();
export const projectSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION), id, name: z.string().min(1).max(250),
  assets: z.array(assetSchema).max(1000), scenes: z.array(sceneSchema).length(1), activeSceneId: id,
}).strict().superRefine((project, ctx) => {
  const unique = (values: string[], label: string) => {
    if (new Set(values).size !== values.length) ctx.addIssue({code: 'custom', message: `${label}: ID trùng lặp.`});
  };
  unique(project.assets.map(a => a.id), 'Assets');
  unique(project.assets.map(a => a.path), 'Asset paths');
  unique(project.scenes.map(s => s.id), 'Scenes');
  const assets = new Set(project.assets.map(a => a.id));
  for (const scene of project.scenes) {
    unique(scene.layers.map(l => l.id), 'Layers');
    for (const layer of scene.layers) if (!assets.has(layer.assetId)) ctx.addIssue({code: 'custom', message: `Layer ${layer.id}: asset không tồn tại.`});
    unique(scene.animations.map(a => a.id), 'Animations');
    unique(scene.animations.map(a => `${a.layerId}:${a.property}`), 'Track mỗi layer/property');
    for (const animation of scene.animations) {
      if (!scene.layers.some(l => l.id === animation.layerId)) ctx.addIssue({code: 'custom', message: `Animation ${animation.id}: layer không tồn tại.`});
      if (animation.startTime + animation.duration > scene.duration + 1e-8) ctx.addIssue({code: 'custom', message: 'Animation vượt Scene Duration. Tăng duration của scene trước.'});
    }
  }
  if (!project.scenes.some(s => s.id === project.activeSceneId)) ctx.addIssue({code: 'custom', message: 'Scene hiện tại không tồn tại.'});
});
export type Transform = z.infer<typeof transformSchema>;
export type Asset = z.infer<typeof assetSchema>;
export type Layer = z.infer<typeof layerSchema>;
export type Scene = z.infer<typeof sceneSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Easing = z.infer<typeof easingSchema>;
export type AnimationProperty = z.infer<typeof animationPropertySchema>;
export type Keyframe = z.infer<typeof keyframeSchema>;
export type Animation = z.infer<typeof animationSchema>;

// Contracts for later phases; only Animation/Keyframe are persisted in v2.
export interface MotionPath { id: string; type: 'line' | 'polyline' | 'bezier' | 'circle' | 'ellipse' | 'freehand'; points: {x: number; y: number}[]; reverse: boolean; orientToPath: boolean }
export interface PoseSet { id: string; name: string; poses: {id: string; assetId: string; anchorX: number; anchorY: number}[] }
export interface Camera { x: number; y: number; zoom: number; animations: Animation[] }
export interface AttachmentPoint { id: string; name: string; x: number; y: number }
export interface Binding { parentId: string; mode: 'position' | 'transform'; attachmentId?: string }

export function createProject(): Project {
  const sceneId = crypto.randomUUID();
  return {schemaVersion: 2, id: crypto.randomUUID(), name: 'Untitled Project', assets: [], activeSceneId: sceneId,
    scenes: [{id: sceneId, name: 'Scene 01', width: 1920, height: 1080, fps: 30, duration: 10, background: '#ffffff', layers: [], animations: []}]};
}
export function getScene(project: Project): Scene { return project.scenes.find(s => s.id === project.activeSceneId)!; }
export function validateProject(value: unknown): Project {
  if (typeof value === 'object' && value !== null && 'schemaVersion' in value && (value.schemaVersion === 0 || value.schemaVersion === 1)) {
    const legacy = value as Record<string, unknown>;
    value = {...legacy, schemaVersion: 2, scenes: Array.isArray(legacy.scenes) ? legacy.scenes.map((scene: unknown) =>
      typeof scene === 'object' && scene !== null ? {animations: [], ...scene} : scene) : legacy.scenes};
  }
  return projectSchema.parse(value);
}
