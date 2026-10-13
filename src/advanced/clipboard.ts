import { getScene, type Project, type Scene } from '../../shared/model.js';
import { useEditor } from '../store/editorStore';
import { usePlayback } from '../store/playbackStore';
import { useTimeline } from '../store/timelineStore';
import { useWorkspace } from '../store/workspaceStore';
import { cloneLayers } from './cloneLayers';
import { upsertKeyframe } from '../animation/commands';
import { upsertCameraKey } from '../camera/commands';

type Clip={projectId:string;scene:Scene;ids:string[];groups:string[];time:number;kind:'layers'|'asset'|'animation'|'path'|'pose'|'camera';id?:string;frameId?:string};
let clipboard:Clip|null=null;
export function copyWorkspace(){
  const state=useEditor.getState(),scene=getScene(state.project),area=useWorkspace.getState(),selection=useTimeline.getState();
  let clip:Clip={projectId:state.project.id,scene:structuredClone(scene),ids:[...state.selectedIds],groups:state.selectedGroupId?[state.selectedGroupId]:[],time:usePlayback.getState().time,kind:'layers'};
  if(area.area==='assets'){if(!area.assetId)return false;clip={...clip,kind:'asset',id:area.assetId};}
  else if(area.area==='timeline'){if(!selection.animationId)return false;clip={...clip,kind:selection.kind,id:selection.animationId,frameId:selection.frameId??undefined};const list=clip.kind==='camera'?scene.camera.animations:clip.kind==='animation'?scene.animations:clip.kind==='path'?scene.motionPaths:scene.poseTracks;if(!list.some(t=>t.id===clip.id))return false;}
  else if(!clip.ids.length)return false;
  clipboard=clip;return true;
}
export function pasteWorkspace(){
  if(!clipboard)return false;
  const c=clipboard,state=useEditor.getState(),scene=getScene(state.project),time=usePlayback.getState().time;
  try{
    if(c.projectId!==state.project.id)throw Error('Clipboard thuộc project khác. Hãy copy lại trong project hiện tại.');
    if(c.kind==='asset'){if(!state.project.assets.some(a=>a.id===c.id))throw Error('Ảnh đã bị xóa khỏi project.');state.addImage(c.id!,scene.width/2,scene.height/2);return true;}
    if(c.kind==='layers'){
      const copy=cloneLayers(scene,c.scene,c.ids,c.time,c.groups);
      if(copy.scene.layers.some(l=>l.binding&&!copy.scene.layers.some(p=>p.id===l.binding!.parentId)))throw Error('Parent bên ngoài phần đã copy đã bị xóa. Copy cả nhóm hoặc tháo binding trước.');
      state.commit({...state.project,scenes:[copy.scene]});useEditor.setState({selectedIds:copy.ids,selectedGroupId:copy.groupId});return true;
    }
    if(c.kind==='camera'){const track=c.scene.camera.animations.find(a=>a.id===c.id)!;let next:Scene;if(c.frameId)next=upsertCameraKey(scene,track.property,time,track.keyframes.find(k=>k.id===c.frameId));else{if(time+track.duration>scene.duration)throw Error('Camera track vượt Scene Duration.');next={...scene,camera:{...scene.camera,animations:[...scene.camera.animations.filter(a=>a.property!==track.property),{...structuredClone(track),id:crypto.randomUUID(),startTime:time,keyframes:track.keyframes.map(k=>({...k,id:crypto.randomUUID()}))}]}};}commit(next,state.project);useTimeline.getState().select(next.camera.animations.find(a=>a.property===track.property)!.id,null,'camera');return true;}
    const layerId=state.selectedIds[0],layer=scene.layers.find(l=>l.id===layerId);if(!layer)throw Error('Chọn Layer nhận animation trước khi Paste.');if(layer.locked)throw Error('Mở khóa Layer trước khi Paste.');
    let next:Scene;
    if(c.kind==='animation'){
      const a=c.scene.animations.find(a=>a.id===c.id)!;
      if(c.frameId){const k=a.keyframes.find(k=>k.id===c.frameId)!;next=upsertKeyframe(scene,layerId,a.property,time,k);const track=next.animations.find(t=>t.layerId===layerId&&t.property===a.property)!;useTimeline.getState().select(track.id,track.keyframes.find(k=>Math.abs(k.time+track.startTime-time)<1e-6)?.id);}
      else{if(time+a.duration>scene.duration)throw Error('Track vượt thời lượng Scene. Tăng Duration hoặc đưa playhead sớm hơn.');const id=crypto.randomUUID();next={...scene,animations:[...scene.animations.filter(t=>t.layerId!==layerId||t.property!==a.property),{...structuredClone(a),id,layerId,startTime:time,keyframes:a.keyframes.map(k=>({...k,id:crypto.randomUUID()}))}]};useTimeline.getState().select(id);}
    }else if(c.kind==='path'){
      const p=c.scene.motionPaths.find(p=>p.id===c.id)!;if(time+p.duration>scene.duration)throw Error('Motion Path vượt Scene Duration.');const id=crypto.randomUUID();next={...scene,motionPaths:[...scene.motionPaths.filter(p=>p.layerId!==layerId),{...structuredClone(p),id,layerId,startTime:time}]};useTimeline.getState().select(id,null,'path');
    }else{
      const p=c.scene.poseTracks.find(p=>p.id===c.id)!,set=c.scene.poseSets.find(s=>s.id===p.poseSetId)!;
      const setId=crypto.randomUUID(),poseMap=new Map(set.poses.map(p=>[p.id,crypto.randomUUID()]));
      const old=scene.poseTracks.find(t=>t.layerId===layerId),id=old?.id??crypto.randomUUID();
      if(c.frameId&&old?.poseSetId===p.poseSetId&&scene.poseSets.some(s=>s.id===p.poseSetId)){
        const key={...p.keyframes.find(k=>k.id===c.frameId)!,id:crypto.randomUUID(),time};next={...scene,poseTracks:scene.poseTracks.map(t=>t.id===old.id?{...t,keyframes:[...t.keyframes.filter(k=>Math.abs(k.time-time)>1e-6),key].sort((a,b)=>a.time-b.time)}:t)};useTimeline.getState().select(old.id,key.id,'pose');
      }else{
        const keys=c.frameId?[{...p.keyframes.find(k=>k.id===c.frameId)!,time}]:p.keyframes.map(k=>({...k,time:k.time-p.keyframes[0].time+time}));if(keys.some(k=>k.time>scene.duration))throw Error('Pose keys vượt Scene Duration.');next={...scene,poseSets:[...scene.poseSets,{...structuredClone(set),id:setId,poses:set.poses.map(p=>({...p,id:poseMap.get(p.id)!}))}],poseTracks:[...scene.poseTracks.filter(t=>t.layerId!==layerId),{...p,id,layerId,poseSetId:setId,keyframes:keys.map(k=>({...k,id:crypto.randomUUID(),poseId:poseMap.get(k.poseId)!}))}]};useTimeline.getState().select(id,null,'pose');
      }
    }
    commit(next,state.project);return true;
  }catch(error){useEditor.setState({animationError:error instanceof Error?error.message:'Không Paste được dữ liệu.'});return true;}
}
function commit(scene:Scene,project:Project){useEditor.getState().commit({...project,scenes:[scene]});}
