import type { Scene } from '../../shared/model.js';
import { evaluateSceneAtTime } from '../../shared/animationEngine.js';
import { bindingSpace, inverse, transformPoint } from '../../shared/transforms.js';

/** Snapshot copy: remap internal graph references and give roots one Canvas offset. */
export function cloneLayers(target:Scene,source:Scene,ids:string[],time:number,groupIds:string[]=[],offset=30){
  const originals=source.layers.filter(l=>ids.includes(l.id));
  const remap=new Map(originals.map(l=>[l.id,crypto.randomUUID()]));
  const groupMap=new Map(groupIds.map(id=>[id,crypto.randomUUID()]));
  const evaluated=evaluateSceneAtTime(source,time);
  const shifts=new Map(originals.map(l=>{
    if(l.binding&&remap.has(l.binding.parentId))return [l.id,{x:0,y:0}] as const;
    const parent=l.binding&&evaluated.layers.find(p=>p.id===l.binding!.parentId);
    if(!parent||!l.binding)return [l.id,{x:offset,y:offset}] as const;
    const m=inverse(bindingSpace(parent,l.binding)),a=transformPoint(m,{x:0,y:0}),b=transformPoint(m,{x:offset,y:offset});return [l.id,{x:b.x-a.x,y:b.y-a.y}] as const;
  }));
  const setIds=new Set(source.poseTracks.filter(t=>remap.has(t.layerId)).map(t=>t.poseSetId));
  const setMap=new Map([...setIds].map(id=>[id,crypto.randomUUID()])),poseMap=new Map<string,string>();
  const poseSets=source.poseSets.filter(s=>setIds.has(s.id)).map(s=>({...s,id:setMap.get(s.id)!,poses:s.poses.map(p=>{const id=crypto.randomUUID();poseMap.set(`${s.id}:${p.id}`,id);return {...p,id};})}));
  const copies=originals.map(l=>({...structuredClone(l),id:remap.get(l.id)!,name:`${l.name} copy`,groupId:l.groupId?groupMap.get(l.groupId):undefined,transform:{...l.transform,x:l.transform.x+shifts.get(l.id)!.x,y:l.transform.y+shifts.get(l.id)!.y},binding:l.binding?{...l.binding,parentId:remap.get(l.binding.parentId)??l.binding.parentId}:l.binding}));
  const scene:Scene={...target,layers:[...target.layers,...copies],animations:[...target.animations,...source.animations.filter(a=>remap.has(a.layerId)).map(a=>({...a,id:crypto.randomUUID(),layerId:remap.get(a.layerId)!,keyframes:a.keyframes.map(k=>({...k,id:crypto.randomUUID(),...(a.property==='position'?{x:k.x!+shifts.get(a.layerId)!.x,y:k.y!+shifts.get(a.layerId)!.y}:{})}))}))],
    motionPaths:[...target.motionPaths,...source.motionPaths.filter(p=>remap.has(p.layerId)).map(p=>{const d=shifts.get(p.layerId)!;return {...structuredClone(p),id:crypto.randomUUID(),layerId:remap.get(p.layerId)!,points:p.points.map(q=>({...q,x:q.x+d.x,y:q.y+d.y,...(q.in?{in:{x:q.in.x+d.x,y:q.in.y+d.y}}:{}),...(q.out?{out:{x:q.out.x+d.x,y:q.out.y+d.y}}:{})}))};})],
    poseSets:[...target.poseSets,...poseSets],poseTracks:[...target.poseTracks,...source.poseTracks.filter(p=>remap.has(p.layerId)).map(p=>({...p,id:crypto.randomUUID(),layerId:remap.get(p.layerId)!,poseSetId:setMap.get(p.poseSetId)!,keyframes:p.keyframes.map(k=>({...k,id:crypto.randomUUID(),poseId:poseMap.get(`${p.poseSetId}:${k.poseId}`)!}))}))],
    ...(groupMap.size?{groups:[...(target.groups??[]),...(source.groups??[]).filter(g=>groupMap.has(g.id)).map(g=>({...g,id:groupMap.get(g.id)!,name:`${g.name} copy`}))]}:{})};
  return {scene,ids:copies.map(l=>l.id),groupId:groupIds.length===1?groupMap.get(groupIds[0])??null:null};
}
