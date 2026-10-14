import type { Layer,Scene } from './model.js';
import type { CodeFrame } from './drawingModel.js';

export interface FrameClip {fps:number;entries:{layer:Layer;frames:CodeFrame[]}[]}
export interface FrameReference {layerId:string;frameId:string}
export function captureSelectedFrames(scene:Scene,refs:FrameReference[]):FrameClip {
 const byLayer=new Map<string,{layer:Layer;frames:CodeFrame[]}>();
 for(const ref of refs){for(const entry of captureFrameClip(scene,ref.layerId,ref.frameId).entries){let item=byLayer.get(entry.layer.id);if(!item){item={layer:entry.layer,frames:[]};byLayer.set(entry.layer.id,item);}for(const frame of entry.frames)if(!item.frames.some(f=>f.id===frame.id))item.frames.push(frame);}}
 if(!byLayer.size)throw Error('Chọn frame trước khi Copy.');
 return {fps:scene.fps,entries:[...byLayer.values()].map(e=>({...e,frames:e.frames.sort((a,b)=>a.startFrame-b.startFrame)}))};
}
export function captureFrameClip(scene:Scene,ownerId:string,frameId?:string):FrameClip {
 const owner=scene.layers.find(l=>l.id===ownerId),frame=owner?.codeFrames?.find(f=>f.id===frameId);
 if(!owner||frameId&&!frame)throw Error('Frame không tồn tại.');
 const entries=frame?.batchId?scene.layers.filter(l=>l.codeFrames?.some(f=>f.batchId===frame.batchId)).map(layer=>({layer,frames:layer.codeFrames!.filter(f=>f.batchId===frame.batchId)})):[{layer:owner,frames:frame?[frame]:owner.codeFrames??[]}];
 if(!entries[0]?.frames.length)throw Error('Chưa có Code Frame để copy.');
 return structuredClone({fps:scene.fps,entries});
}
const name=(s:string)=>s.trim().toLowerCase().replace(/(?:\s+copy)+$/,'');
export function pasteFrameClip(scene:Scene,clip:FrameClip,targetIds:string[],start:number,makeId:()=>string,insert=false){
 const targets=scene.layers.filter(l=>targetIds.includes(l.id));
 if(targets.length!==clip.entries.length)throw Error(`Frame có ${clip.entries.length} layer. Chọn Layer/Group nhận có cùng số layer trước khi Paste.`);
 if(targets.some(l=>l.locked))throw Error('Mở khóa tất cả Layer nhận trước khi Paste frame.');
 if(!Number.isInteger(start)||start<0)throw Error('Vị trí Paste không hợp lệ.');
 const used=new Set<string>(),pairs=clip.entries.map(entry=>{
  const target=targets.find(l=>l.id===entry.layer.id)??(targets.length===1?targets[0]:targets.find(l=>name(l.name)===name(entry.layer.name)&&!used.has(l.id)));
  if(!target||used.has(target.id))throw Error('Group nhận cần các Layer cùng tên (body, tay, kiếm…) để ghép đúng tư thế.');
  used.add(target.id);return {entry,target};
 }),first=Math.min(...clip.entries.flatMap(e=>e.frames.map(f=>f.startFrame))),batchMap=new Map<string,string>(),addedById=new Map<string,CodeFrame[]>();
 for(const {entry,target} of pairs){const a=entry.layer.transform,b=target.transform;addedById.set(target.id,entry.frames.map(f=>{
  if(f.batchId&&!batchMap.has(f.batchId))batchMap.set(f.batchId,makeId());
  const visual=f.visual?{...f.visual,transform:{...f.visual.transform,x:b.x+f.visual.transform.x-a.x,y:b.y+f.visual.transform.y-a.y,rotation:b.rotation+f.visual.transform.rotation-a.rotation,scaleX:b.scaleX*f.visual.transform.scaleX/a.scaleX,scaleY:b.scaleY*f.visual.transform.scaleY/a.scaleY,width:b.width*f.visual.transform.width/a.width,height:b.height*f.visual.transform.height/a.height}}:undefined;
  return {...structuredClone(f),id:makeId(),...(f.batchId?{batchId:batchMap.get(f.batchId)!}:{}),...(visual?{visual}:{}),startFrame:start+Math.round((f.startFrame-first)*scene.fps/clip.fps),holdFrames:Math.max(1,Math.round(f.holdFrames*scene.fps/clip.fps))};
 }));}
 const span=Math.max(...[...addedById.values()].flat().map(f=>f.startFrame+f.holdFrames))-start;
 const layers=scene.layers.map(layer=>{const added=addedById.get(layer.id);if(!added)return layer;const old=(layer.codeFrames??[]).map(f=>insert&&f.startFrame>=start?{...f,startFrame:f.startFrame+span}:f),frames=[...old,...added].sort((a,b)=>a.startFrame-b.startFrame);let end=0;for(const f of frames){if(f.startFrame<end)throw Error('Vị trí này đã có frame. Đưa playhead tới chỗ trống; Duplicate / tiếp nối sẽ chèn và dịch các frame phía sau.');end=f.startFrame+f.holdFrames;}return {...layer,codeFrames:frames};});
 const end=Math.max(...layers.flatMap(l=>(l.codeFrames??[]).map(f=>f.startFrame+f.holdFrames)),0);
 if(!insert&&end>Math.ceil(scene.duration*scene.fps-1e-9))throw Error('Frame vượt thời lượng Scene. Tăng Duration hoặc Paste sớm hơn.');
 const seen=new Set<string>(),references:FrameReference[]=[];
 for(const [layerId,frames] of addedById)for(const frame of frames){const key=frame.batchId??frame.id;if(!seen.has(key)){seen.add(key);references.push({layerId,frameId:frame.id});}}
 return {scene:{...scene,layers,duration:insert?Math.max(scene.duration,end/scene.fps):scene.duration},layerId:pairs[0].target.id,frameId:addedById.get(pairs[0].target.id)![0].id,references,targetIds:pairs.map(p=>p.target.id)};
}
