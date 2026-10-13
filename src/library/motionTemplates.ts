import { libraryMotionSchema,type LibraryMotion,type LibraryCategory } from '../../shared/animationLibrary.js';
import { evaluateSceneAtTime,propertyKeys } from '../../shared/animationEngine.js';
import { getScene,validateProject,type Project,type Scene,type Keyframe } from '../../shared/model.js';
import { matrixFromTransform,transformPoint } from '../../shared/transforms.js';

export function captureMotion(scene:Scene,ids:string[],name:string,category:LibraryCategory,description:string,selectedTracks:string[]):LibraryMotion{
  const layers=scene.layers.filter(l=>ids.includes(l.id));if(!layers.length)throw Error('Chọn Layer hoặc Group trước khi lưu mẫu.');
  const roles=new Map(layers.map((l,i)=>[l.id,`slot-${i}`]));
  const animations=scene.animations.filter(a=>roles.has(a.layerId)&&selectedTracks.includes(a.id)),paths=scene.motionPaths.filter(p=>roles.has(p.layerId)&&selectedTracks.includes(p.id));
  const poseTracks=scene.poseTracks.filter(p=>roles.has(p.layerId)&&selectedTracks.includes(p.id));
  const start=Math.min(...animations.map(a=>a.startTime),...paths.map(p=>p.startTime),...poseTracks.map(p=>p.keyframes[0].time));if(!Number.isFinite(start))throw Error('Chọn ít nhất một animation hoặc Motion Path để lưu.');
  const duration=Math.max(.001,Math.max(...animations.map(a=>a.startTime+a.duration),...paths.map(p=>p.startTime+p.duration),...poseTracks.map(p=>p.keyframes.at(-1)!.time))-start);
  const assetIds=[...new Set(poseTracks.flatMap(p=>scene.poseSets.find(s=>s.id===p.poseSetId)!.poses.map(p=>p.assetId)))],assetMap=new Map(assetIds.map((id,i)=>[id,`image-${i}`]));
  const tracks=animations.map(a=>{const layer=layers.find(l=>l.id===a.layerId)!,t=layer.transform;return {roleId:roles.get(a.layerId)!,property:a.property,startTime:a.startTime-start,duration:a.duration,easing:a.easing,loop:a.loop,keyframes:a.keyframes.map(k=>{const v:Keyframe={id:k.id,time:k.time,...(k.easing?{easing:k.easing}: {})};for(const key of propertyKeys[a.property]){
    v[key]=key==='x'?(k.x!-t.x)/(t.width*t.scaleX):key==='y'?(k.y!-t.y)/(t.height*t.scaleY):key==='scaleX'?k.scaleX!/t.scaleX:key==='scaleY'?k.scaleY!/t.scaleY:key==='rotation'?k.rotation!-t.rotation:key==='opacity'?k.opacity!-layer.opacity:k.zOrder!-scene.layers.indexOf(layer);
  }return v;})};});
  return libraryMotionSchema.parse({format:'studio-animation',version:1,id:crypto.randomUUID(),name,category,description,duration,roles:layers.map(l=>({id:roles.get(l.id),name:l.name.slice(0,100),pivot:{x:l.transform.anchorX,y:l.transform.anchorY},...(l.binding&&roles.has(l.binding.parentId)?{parentRole:roles.get(l.binding.parentId)}:{})})),tracks,paths:paths.map(p=>{
    const {id,layerId,...data}=p;void id;const t=layers.find(l=>l.id===layerId)!.transform,origin=p.followPoint?transformPoint(matrixFromTransform(t),{x:(p.followPoint.x-t.anchorX)*t.width,y:(p.followPoint.y-t.anchorY)*t.height}):{x:t.x,y:t.y};
    const relative=(q:{x:number;y:number})=>({x:(q.x-origin.x)/(t.width*t.scaleX),y:(q.y-origin.y)/(t.height*t.scaleY)});
    return {...data,roleId:roles.get(layerId),startTime:p.startTime-start,points:p.points.map(q=>({...relative(q),...(q.in?{in:relative(q.in)}:{}),...(q.out?{out:relative(q.out)}:{})}))};}),assetRoles:assetIds.map(id=>({id:assetMap.get(id),name:scene.poseSets.flatMap(s=>s.poses).find(p=>p.assetId===id)?.name??'Ảnh pose'})),poseTracks:poseTracks.map(p=>{const set=scene.poseSets.find(s=>s.id===p.poseSetId)!,base=layers.find(l=>l.id===p.layerId)!;return {roleId:roles.get(p.layerId),name:set.name,poses:set.poses.map((q,i)=>({id:`pose-${i}`,name:q.name,assetRoleId:assetMap.get(q.assetId),widthRatio:q.width/base.transform.width,heightRatio:q.height/base.transform.height,anchorX:q.anchorX,anchorY:q.anchorY})),keyframes:p.keyframes.map((k,i)=>({id:`key-${i}`,time:k.time-start,poseId:`pose-${set.poses.findIndex(p=>p.id===k.poseId)}`}))};})});
}
export type ApplyOptions={mapping:Record<string,string>;assetMapping?:Record<string,string>;start:number;duration:number;strength:number;direction:number;loop:'template'|'none'|'repeat'|'pingPong';conflict:'replace'|'keep'};
export function applyMotion(project:Project,value:LibraryMotion,options:ApplyOptions):Project{
  const template=libraryMotionSchema.parse(value),scene=getScene(project),{mapping,start,duration,strength,direction,loop,conflict}=options;
  if(!Number.isFinite(start)||start<0||!Number.isFinite(duration)||duration<=0||start+duration>scene.duration+1e-8)throw Error('Mẫu vượt thời lượng scene. Tăng Duration của scene hoặc đưa playhead sớm hơn.');
  if(!Number.isFinite(strength)||strength<0||strength>5||!Number.isFinite(direction))throw Error('Độ mạnh/hướng không hợp lệ.');
  const used=template.roles.filter(r=>template.tracks.some(t=>t.roleId===r.id)||template.paths.some(p=>p.roleId===r.id)||template.poseTracks.some(p=>p.roleId===r.id));
  if(new Set(used.map(r=>mapping[r.id])).size!==used.length)throw Error('Mỗi vai trò cần một Layer khác nhau.');
  for(const role of used){const layer=scene.layers.find(l=>l.id===mapping[role.id]);if(!layer)throw Error(`Chọn Layer cho ${role.name}.`);if(layer.locked)throw Error(`Mở khóa ${layer.name} trước khi Apply.`);}
  const baseline=evaluateSceneAtTime(scene,start),rate=duration/template.duration,angle=direction*Math.PI/180;
  const vector=(x:number,y:number)=>({x:(x*Math.cos(angle)-y*Math.sin(angle))*strength,y:(x*Math.sin(angle)+y*Math.cos(angle))*strength});
  let next:Scene={...scene,animations:[...scene.animations],motionPaths:[...scene.motionPaths]};
  for(const track of template.tracks){const layerId=mapping[track.roleId],base=baseline.layers.find(l=>l.id===layerId)!,t=base.localTransform??base.transform;
    const existing=next.animations.find(a=>a.layerId===layerId&&a.property===track.property);if(existing&&conflict==='keep')continue;
    const keyframes=track.keyframes.map(k=>{const result:Keyframe={id:crypto.randomUUID(),time:k.time*rate,...(k.easing?{easing:k.easing}:{})};
      if(track.property==='position'){const delta=vector(k.x!*t.width*t.scaleX,k.y!*t.height*t.scaleY);result.x=t.x+delta.x;result.y=t.y+delta.y;}
      else if(track.property==='scale'){result.scaleX=Math.max(.001,Math.min(100,t.scaleX*(1+(k.scaleX!-1)*strength)));result.scaleY=Math.max(.001,Math.min(100,t.scaleY*(1+(k.scaleY!-1)*strength)));}
      else if(track.property==='rotation')result.rotation=t.rotation+k.rotation!*strength;
      else if(track.property==='opacity')result.opacity=Math.max(0,Math.min(1,base.opacity+k.opacity!*strength));
      else result.zOrder=Math.max(0,Math.min(500,Math.round(base.zOrder+k.zOrder!*strength)));
      return result;
    });
    next.animations=[...next.animations.filter(a=>a!==existing),{id:crypto.randomUUID(),layerId,property:track.property,startTime:start+track.startTime*rate,duration:track.duration*rate,easing:track.easing,loop:loop==='template'?track.loop:loop,keyframes}];
  }
  for(const p of template.paths){const layerId=mapping[p.roleId],base=baseline.layers.find(l=>l.id===layerId)!,t=base.localTransform??base.transform,existing=next.motionPaths.find(p=>p.layerId===layerId);if(existing&&conflict==='keep')continue;
    const origin=p.followPoint?transformPoint(matrixFromTransform(t),{x:(p.followPoint.x-t.anchorX)*t.width,y:(p.followPoint.y-t.anchorY)*t.height}):{x:t.x,y:t.y};
    const absolute=(q:{x:number;y:number})=>{const d=vector(q.x*t.width*t.scaleX,q.y*t.height*t.scaleY);return {x:origin.x+d.x,y:origin.y+d.y};};
    const {roleId,...data}=p;void roleId;next.motionPaths=[...next.motionPaths.filter(a=>a!==existing),{...data,id:crypto.randomUUID(),layerId,startTime:start+p.startTime*rate,duration:p.duration*rate,loop:loop==='template'?p.loop:loop,points:p.points.map(q=>({...absolute(q),...(q.in?{in:absolute(q.in)}:{}),...(q.out?{out:absolute(q.out)}:{})}))}];
  }
  for(const p of template.poseTracks){const layerId=mapping[p.roleId],base=baseline.layers.find(l=>l.id===layerId)!,t=base.localTransform??base.transform,existing=next.poseTracks.find(p=>p.layerId===layerId);if(existing&&conflict==='keep')continue;
    const setId=crypto.randomUUID(),ids=new Map(p.poses.map(q=>[q.id,crypto.randomUUID()]));const poses=p.poses.map(q=>{const assetId=options.assetMapping?.[q.assetRoleId];if(!project.assets.some(a=>a.id===assetId))throw Error(`Chọn ảnh cho pose ${q.name}.`);return {id:ids.get(q.id)!,name:q.name,assetId:assetId!,width:t.width*q.widthRatio,height:t.height*q.heightRatio,anchorX:q.anchorX,anchorY:q.anchorY};});
    next.poseSets=[...next.poseSets,{id:setId,name:p.name,poses}];next.poseTracks=[...next.poseTracks.filter(t=>t!==existing),{id:crypto.randomUUID(),layerId,poseSetId:setId,keyframes:p.keyframes.map(k=>({id:crypto.randomUUID(),time:start+k.time*rate,poseId:ids.get(k.poseId)!}))}];
  }
  return validateProject({...project,scenes:project.scenes.map(s=>s.id===scene.id?next:s)});
}
