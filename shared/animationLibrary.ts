import { z } from 'zod';
import { animationSchema,keyframeSchema,motionPathSchema } from './model.js';
const id=z.string().regex(/^[\w-]{1,100}$/);
const ratio=z.number().finite().positive().max(1e12);
export const categorySchema=z.enum(['background','character','weapon']);
export const libraryMotionSchema=z.object({
  format:z.literal('studio-animation'),version:z.literal(1),id,name:z.string().trim().min(1).max(100),description:z.string().max(2000),category:categorySchema,
  duration:z.number().positive().max(86400),
  roles:z.array(z.object({id,name:z.string().min(1).max(100),pivot:z.object({x:z.number().min(0).max(1),y:z.number().min(0).max(1)}),parentRole:id.optional()}).strict()).min(1).max(100),
  tracks:z.array(z.object(animationSchema.shape).omit({id:true,layerId:true}).extend({roleId:id,keyframes:z.array(keyframeSchema.extend({scaleX:ratio.optional(),scaleY:ratio.optional(),opacity:z.number().min(-1).max(1).optional(),zOrder:z.number().int().min(-500).max(500).optional()}).strict()).min(1).max(2000)}).strict()).max(1000),
  paths:z.array(z.object(motionPathSchema.shape).omit({id:true,layerId:true}).extend({roleId:id}).strict()).max(100),
  assetRoles:z.array(z.object({id,name:z.string().min(1).max(250)}).strict()).max(1000).default([]),
  poseTracks:z.array(z.object({roleId:id,name:z.string().min(1).max(100),poses:z.array(z.object({id,name:z.string().min(1).max(100),assetRoleId:id,widthRatio:z.number().positive().max(10000),heightRatio:z.number().positive().max(10000),anchorX:z.number().min(0).max(1),anchorY:z.number().min(0).max(1)}).strict()).min(1).max(100),keyframes:z.array(z.object({id,time:z.number().nonnegative().max(86400),poseId:id}).strict()).min(1).max(2000)}).strict()).max(100).default([]),
}).strict().superRefine((value,ctx)=>{
  const roles=new Set(value.roles.map(r=>r.id));if(roles.size!==value.roles.length)ctx.addIssue({code:'custom',message:'Role trùng lặp.'});
  const tracks=new Set<string>(),paths=new Set<string>();
  for(const t of value.tracks){const key=t.roleId+':'+t.property;if(!roles.has(t.roleId)||tracks.has(key)||t.startTime+t.duration>value.duration+1e-8)ctx.addIssue({code:'custom',message:'Track mẫu không hợp lệ.'});tracks.add(key);
    const fields=t.property==='position'?['x','y']:t.property==='scale'?['scaleX','scaleY']:[t.property];let previous=-1;const ids=new Set<string>();
    for(const k of t.keyframes){if(ids.has(k.id)||k.time<=previous||k.time>t.duration+1e-8||fields.some(f=>k[f as keyof typeof k]===undefined)||['x','y','scaleX','scaleY','rotation','opacity','zOrder'].some(f=>!fields.includes(f)&&k[f as keyof typeof k]!==undefined))ctx.addIssue({code:'custom',message:'Keyframe mẫu thiếu/sai giá trị hoặc thời gian.'});previous=k.time;ids.add(k.id);}
  }
  for(const p of value.paths){if(!roles.has(p.roleId)||paths.has(p.roleId)||p.startTime+p.duration>value.duration+1e-8)ctx.addIssue({code:'custom',message:'Path mẫu không hợp lệ.'});paths.add(p.roleId);if(['line','circle','ellipse'].includes(p.type)&&p.points.length!==2)ctx.addIssue({code:'custom',message:'Line/Circle/Ellipse cần đúng 2 điểm.'});if(['circle','ellipse'].includes(p.type)){const [a,b]=p.points;if(Math.hypot(b.x-a.x,b.y-a.y)<1e-10||p.type==='ellipse'&&(Math.abs(b.x-a.x)<1e-10||Math.abs(b.y-a.y)<1e-10))ctx.addIssue({code:'custom',message:'Bán kính mẫu không hợp lệ.'});}}
  for(const r of value.roles)if(r.parentRole&&!roles.has(r.parentRole))ctx.addIssue({code:'custom',message:'Parent role không hợp lệ.'});
  const assets=new Set(value.assetRoles.map(a=>a.id)),poseRoles=new Set<string>();if(assets.size!==value.assetRoles.length)ctx.addIssue({code:'custom',message:'Vai trò ảnh trùng.'});
  for(const t of value.poseTracks){const poses=new Set(t.poses.map(p=>p.id)),keys=new Set<string>();let previous=-1;if(!roles.has(t.roleId)||poseRoles.has(t.roleId)||poses.size!==t.poses.length||t.poses.some(p=>!assets.has(p.assetRoleId)))ctx.addIssue({code:'custom',message:'Pose role/ảnh không hợp lệ.'});poseRoles.add(t.roleId);for(const k of t.keyframes){if(keys.has(k.id)||k.time<=previous||k.time>value.duration+1e-8||!poses.has(k.poseId))ctx.addIssue({code:'custom',message:'Pose key mẫu không hợp lệ.'});keys.add(k.id);previous=k.time;}}
  if(!value.tracks.length&&!value.paths.length&&!value.poseTracks.length)ctx.addIssue({code:'custom',message:'Mẫu cần ít nhất một track hoặc Motion Path.'});
});
// Relative scale ratios remain positive; scale strength is clamped at application time.
export const libraryItemSchema=libraryMotionSchema;
export type LibraryMotion=z.infer<typeof libraryMotionSchema>;
export type LibraryCategory=z.infer<typeof categorySchema>;
