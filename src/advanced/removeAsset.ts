import { type Project,type Scene } from '../../shared/model.js';
import { changeBinding } from './commands';
export function removeAsset(project:Project,assetId:string,time:number):Project{
  const scenes=project.scenes.map(s=>cleanScene(s,assetId,s.id===project.activeSceneId?time:0));return {...project,assets:project.assets.filter(a=>a.id!==assetId),scenes};
}
function cleanScene(source:Scene,assetId:string,time:number):Scene{
  let scene=source;
  const removed=new Set(scene.layers.filter(l=>l.assetId===assetId).map(l=>l.id));
  const affectedPoseSets=new Set(scene.poseSets.filter(s=>s.poses.some(p=>p.assetId===assetId)).map(s=>s.id));
  if(scene.layers.some(l=>l.locked&&(removed.has(l.id)||scene.poseTracks.some(t=>t.layerId===l.id&&affectedPoseSets.has(t.poseSetId)))))throw Error('Mở khóa các Layer đang dùng ảnh hoặc pose này trước khi xóa.');
  for(const l of scene.layers)if(!removed.has(l.id)&&l.binding&&removed.has(l.binding.parentId)){if(l.locked)throw Error('Mở khóa Child trước khi xóa ảnh của Parent.');scene=changeBinding(scene,l.id,null,time);}
  const poseSets=scene.poseSets.map(s=>({...s,poses:s.poses.filter(p=>p.assetId!==assetId)})).filter(s=>s.poses.length);
  const layers=scene.layers.filter(l=>!removed.has(l.id));
  return {...scene,layers,animations:scene.animations.filter(a=>!removed.has(a.layerId)),motionPaths:scene.motionPaths.filter(p=>!removed.has(p.layerId)),poseSets,poseTracks:scene.poseTracks.flatMap(t=>{const set=poseSets.find(s=>s.id===t.poseSetId);const keys=t.keyframes.filter(k=>set?.poses.some(p=>p.id===k.poseId));return !removed.has(t.layerId)&&set&&keys.length?[{...t,keyframes:keys}]:[];}),...(scene.groups?{groups:scene.groups.filter(g=>layers.some(l=>l.groupId===g.id))}:{})};
}
