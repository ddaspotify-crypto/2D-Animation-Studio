import { z } from 'zod';

export const SCHEMA_VERSION = 4;
const id = z.string().min(1).max(100).regex(/^[\w-]+$/);
const finite = z.number().finite().min(-1e7).max(1e7);
const size = z.number().finite().positive().max(16384);
export const transformSchema = z.object({
  x: finite, y: finite, width: size, height: size,
  scaleX: z.number().finite().positive().max(100), scaleY: z.number().finite().positive().max(100),
  rotation: finite, anchorX: z.number().min(0).max(1), anchorY: z.number().min(0).max(1),
  skewX: finite.optional(),
  flipX: z.boolean().optional(), flipY: z.boolean().optional(),
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
  groupId: id.optional(),
  binding: z.object({parentId: id, mode: z.enum(['position','transform']), attachmentId: id.optional()}).strict().nullable().optional(),
  attachments: z.array(z.object({id, name: z.string().min(1).max(100), x: z.number().min(0).max(1), y: z.number().min(0).max(1)}).strict()).max(100).optional(),
}).strict();
export const easingSchema = z.enum(['linear', 'easeIn', 'easeOut', 'easeInOut']);
export const animationPropertySchema = z.enum(['position', 'scale', 'rotation', 'opacity', 'zOrder']);
export const keyframeSchema = z.object({
  id, time: z.number().finite().nonnegative().max(86400), easing: easingSchema.optional(),
  x: finite.optional(), y: finite.optional(),
  scaleX: z.number().finite().positive().max(100).optional(), scaleY: z.number().finite().positive().max(100).optional(),
  rotation: finite.optional(), opacity: z.number().min(0).max(1).optional(),
  zOrder: z.number().int().min(0).max(500).optional(),
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
    for (const key of ['x','y','scaleX','scaleY','rotation','opacity','zOrder']) if (!keys.includes(key) && frame[key as keyof typeof frame] !== undefined) ctx.addIssue({code: 'custom', message: `Keyframe không được chứa ${key} trong track ${animation.property}.`});
  }
});
export const pointSchema = z.object({x: finite, y: finite}).strict();
export const motionPathSchema = z.object({
  id, layerId: id, type: z.enum(['line','polyline','bezier','circle','ellipse','freehand']),
  points: z.array(pointSchema.extend({in: pointSchema.optional(), out: pointSchema.optional()}).strict()).min(2).max(2000),
  followPoint: z.object({x:z.number().min(0).max(1),y:z.number().min(0).max(1)}).strict().optional(),
  startTime: z.number().finite().nonnegative().max(86400), duration: z.number().finite().positive().max(86400),
  easing: easingSchema, loop: z.enum(['none','repeat','pingPong']), reverse: z.boolean(), orientToPath: z.boolean(), show: z.boolean(),
}).strict().superRefine((path, ctx) => {
  if (['line','circle','ellipse'].includes(path.type) && path.points.length !== 2) ctx.addIssue({code:'custom',message:'Line/Circle/Ellipse cần đúng 2 điểm.'});
  if (['circle','ellipse'].includes(path.type)) {
    const [a,b] = path.points;
    if (Math.hypot(b.x-a.x,b.y-a.y) < .001 || path.type === 'ellipse' && (Math.abs(b.x-a.x)<.001 || Math.abs(b.y-a.y)<.001)) ctx.addIssue({code:'custom',message:'Bán kính đường đi phải lớn hơn 0.'});
  }
});
export const poseSetSchema = z.object({id, name: z.string().min(1).max(100), poses: z.array(z.object({
  id, name: z.string().min(1).max(100), assetId: id, width: size, height: size, anchorX: z.number().min(0).max(1), anchorY: z.number().min(0).max(1),
}).strict()).min(1).max(100)}).strict();
export const poseTrackSchema = z.object({id,layerId:id,poseSetId:id,keyframes:z.array(z.object({id,time:z.number().finite().nonnegative().max(86400),poseId:id}).strict()).min(1).max(2000)}).strict();
export const cameraKeySchema=z.object({id,time:z.number().nonnegative().max(86400),easing:easingSchema.optional(),x:finite.optional(),y:finite.optional(),zoom:z.number().finite().min(.01).max(100).optional(),rotation:finite.optional()}).strict();
export const cameraTrackSchema=z.object({id,property:z.enum(['position','zoom','rotation']),startTime:z.number().nonnegative().max(86400),duration:z.number().positive().max(86400),easing:easingSchema,loop:z.enum(['none','repeat','pingPong']),keyframes:z.array(cameraKeySchema).min(1).max(2000)}).strict().superRefine((a,ctx)=>{let previous=-1;const ids=new Set<string>(),fields=a.property==='position'?['x','y']:[a.property];for(const k of a.keyframes){if(ids.has(k.id)||k.time<=previous||k.time>a.duration+1e-8||fields.some(f=>k[f as keyof typeof k]===undefined)||['x','y','zoom','rotation'].some(f=>!fields.includes(f)&&k[f as keyof typeof k]!==undefined))ctx.addIssue({code:'custom',message:'Camera keys cần thời gian tăng dần và giá trị đúng track.'});ids.add(k.id);previous=k.time;}});
export const cameraSchema=z.object({x:finite,y:finite,zoom:z.number().finite().min(.01).max(100),rotation:finite.default(0),animations:z.array(cameraTrackSchema).max(3)}).strict();
export const sceneSchema = z.object({
  id, name: z.string().min(1).max(250), width: size, height: size,
  fps: z.number().int().min(1).max(120), duration: z.number().positive().max(86400),
  background: z.string().regex(/^#[a-fA-F0-9]{6}$/), layers: z.array(layerSchema).max(500),
  animations: z.array(animationSchema).max(2000),
  camera:cameraSchema,
  groups: z.array(z.object({id,name:z.string().trim().min(1).max(100)}).strict()).max(500).optional(),
  motionPaths: z.array(motionPathSchema).max(500), poseSets: z.array(poseSetSchema).max(500), poseTracks: z.array(poseTrackSchema).max(500),
}).strict();
export const projectSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION), id, name: z.string().min(1).max(250),
  assets: z.array(assetSchema).max(1000), scenes: z.array(sceneSchema).min(1).max(100), activeSceneId: id,
}).strict().superRefine((project, ctx) => {
  const unique = (values: string[], label: string) => {
    if (new Set(values).size !== values.length) ctx.addIssue({code: 'custom', message: `${label}: ID trùng lặp.`});
  };
  unique(project.assets.map(a => a.id), 'Assets');
  unique(project.assets.map(a => a.path), 'Asset paths');
  unique(project.scenes.map(s => s.id), 'Scenes');
  const assets = new Set(project.assets.map(a => a.id));
  for (const scene of project.scenes) {
    unique(scene.camera.animations.map(a=>a.id),'Camera Tracks');unique(scene.camera.animations.map(a=>a.property),'Camera Track mỗi loại');for(const a of scene.camera.animations)if(a.startTime+a.duration>scene.duration+1e-8)ctx.addIssue({code:'custom',message:'Camera track vượt Scene Duration.'});
    unique(scene.layers.map(l => l.id), 'Layers');
    unique((scene.groups??[]).map(g=>g.id),'Groups');
    for(const layer of scene.layers)if(layer.groupId&&!scene.groups?.some(g=>g.id===layer.groupId))ctx.addIssue({code:'custom',message:'Group của Layer không tồn tại.'});
    for (const layer of scene.layers) if (!assets.has(layer.assetId)) ctx.addIssue({code: 'custom', message: `Layer ${layer.id}: asset không tồn tại.`});
    unique(scene.animations.map(a => a.id), 'Animations');
    unique(scene.animations.map(a => `${a.layerId}:${a.property}`), 'Track mỗi layer/property');
    for (const animation of scene.animations) {
      if (!scene.layers.some(l => l.id === animation.layerId)) ctx.addIssue({code: 'custom', message: `Animation ${animation.id}: layer không tồn tại.`});
      if (animation.startTime + animation.duration > scene.duration + 1e-8) ctx.addIssue({code: 'custom', message: 'Animation vượt Scene Duration. Tăng duration của scene trước.'});
    }
    unique(scene.motionPaths.map(p=>p.id),'Motion Paths'); unique(scene.motionPaths.map(p=>p.layerId),'Path mỗi Layer');
    unique(scene.poseSets.map(p=>p.id),'Pose Sets'); unique(scene.poseTracks.map(p=>p.id),'Pose Tracks'); unique(scene.poseTracks.map(p=>p.layerId),'Pose Track mỗi Layer');
    for (const path of scene.motionPaths) {
      if (!scene.layers.some(l=>l.id===path.layerId)) ctx.addIssue({code:'custom',message:'Motion Path tham chiếu Layer không tồn tại.'});
      if (path.startTime+path.duration>scene.duration+1e-8) ctx.addIssue({code:'custom',message:'Motion Path vượt Scene Duration.'});
    }
    for (const set of scene.poseSets) {
      unique(set.poses.map(p=>p.id),'Poses');
      if (set.poses.some(p=>!assets.has(p.assetId))) ctx.addIssue({code:'custom',message:'Pose tham chiếu asset không tồn tại.'});
    }
    for (const track of scene.poseTracks) {
      const set=scene.poseSets.find(p=>p.id===track.poseSetId);
      if (!set || !scene.layers.some(l=>l.id===track.layerId)) ctx.addIssue({code:'custom',message:'Pose Track tham chiếu không hợp lệ.'});
      unique(track.keyframes.map(k=>k.id),'Pose Keys'); let previous=-1;
      for (const key of track.keyframes) {
        if (key.time<=previous || key.time>scene.duration || !set?.poses.some(p=>p.id===key.poseId)) ctx.addIssue({code:'custom',message:'Pose key cần thời gian tăng dần/không trùng, trong scene và pose hợp lệ.'});
        previous=key.time;
      }
    }
    const layers=new Map(scene.layers.map(l=>[l.id,l]));
    for (const layer of scene.layers) {
      unique((layer.attachments??[]).map(a=>a.id),'Attachment Points');
      const binding=layer.binding;
      if (!binding) continue;
      const parent=layers.get(binding.parentId);
      if (!parent || binding.attachmentId && !parent.attachments?.some(a=>a.id===binding.attachmentId)) ctx.addIssue({code:'custom',message:'Parent/Attachment không tồn tại.'});
      const visited=new Set([layer.id]); let current=parent;
      while(current) {
        if (visited.has(current.id)) {ctx.addIssue({code:'custom',message:'Parent–Child không được tạo vòng lặp.'});break;}
        visited.add(current.id); current=current.binding ? layers.get(current.binding.parentId) : undefined;
      }
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
export type MotionPath = z.infer<typeof motionPathSchema>;
export type PoseSet = z.infer<typeof poseSetSchema>;
export type PoseTrack = z.infer<typeof poseTrackSchema>;
export type Point = z.infer<typeof pointSchema>;
export type AttachmentPoint = NonNullable<Layer['attachments']>[number];
export type Binding = NonNullable<Layer['binding']>;

// Contracts for later phases; only Animation/Keyframe are persisted in v2.
export type Camera=z.infer<typeof cameraSchema>;
export type CameraTrack=z.infer<typeof cameraTrackSchema>;
export type CameraKey=z.infer<typeof cameraKeySchema>;
export function defaultCamera(width:number,height:number):Camera{return {x:width/2,y:height/2,zoom:1,rotation:0,animations:[]};}

export function createProject(): Project {
  const sceneId = crypto.randomUUID();
  return {schemaVersion: 4, id: crypto.randomUUID(), name: 'Untitled Project', assets: [], activeSceneId: sceneId,
    scenes: [{id: sceneId, name: 'Scene 01', width: 1920, height: 1080, fps: 30, duration: 10, background: '#ffffff', layers: [], animations: [],motionPaths:[],poseSets:[],poseTracks:[],camera:defaultCamera(1920,1080)}]};
}
export function getScene(project: Project): Scene { return project.scenes.find(s => s.id === project.activeSceneId)!; }
export function validateProject(value: unknown): Project {
  if (typeof value === 'object' && value !== null && 'schemaVersion' in value && [0,1,2,3].includes(value.schemaVersion as number)) {
    const legacy = value as Record<string, unknown>;
    value = {...legacy, schemaVersion: 4, scenes: Array.isArray(legacy.scenes) ? legacy.scenes.map((scene: unknown) =>
      typeof scene === 'object' && scene !== null ? {animations: [],motionPaths:[],poseSets:[],poseTracks:[],camera:defaultCamera(Number((scene as Record<string,unknown>).width),Number((scene as Record<string,unknown>).height)), ...scene} : scene) : legacy.scenes};
  }
  return projectSchema.parse(value);
}
