import { useState } from 'react';
import { getScene, type PoseSet } from '../../shared/model.js';
import { useEditor } from '../store/editorStore';
import { usePlayback } from '../store/playbackStore';
import { editAdvanced } from '../advanced/actions';
import NumberField from './NumberField';
import HelpTip from './HelpTip';
import { phase3Help } from './phase3Help';

export default function PosePanel({layerId}:{layerId:string}) {
  const project=useEditor(s=>s.project),scene=getScene(project),layer=scene.layers.find(l=>l.id===layerId)!,track=scene.poseTracks.find(p=>p.layerId===layerId),set=scene.poseSets.find(p=>p.id===track?.poseSetId);
  const [assetId,setAssetId]=useState(''),[poseId,setPoseId]=useState('');const pose=set?.poses.find(p=>p.id===poseId)??set?.poses[0];
  const updateSet=(next:PoseSet)=>editAdvanced(s=>({...s,poseSets:s.poseSets.map(p=>p.id===next.id?next:p)}));
  return <section className="advanced-section pose-properties"><h3 className="help-heading">POSE SWITCHING <HelpTip label="Pose Set / Pose Switching" text={phase3Help.pose}/></h3>
    {!set?<button title="Tạo Pose Set" disabled={layer.locked} onClick={()=>editAdvanced(s=>{
      const pose={id:crypto.randomUUID(),name:'Pose gốc',assetId:layer.assetId,width:layer.transform.width,height:layer.transform.height,anchorX:layer.transform.anchorX,anchorY:layer.transform.anchorY},setId=crypto.randomUUID();
      return {...s,poseSets:[...s.poseSets,{id:setId,name:`${layer.name} · Poses`,poses:[pose]}],poseTracks:[...s.poseTracks,{id:crypto.randomUUID(),layerId,poseSetId:setId,keyframes:[{id:crypto.randomUUID(),time:0,poseId:pose.id}]}]};
    })}>Tạo Pose Set từ Layer</button>:<>
      <label className="field"><span>Tên Pose Set</span><input aria-label="Pose Set Name" key={set.name} defaultValue={set.name} maxLength={100} disabled={layer.locked} onBlur={e=>{if(e.target.value.trim())updateSet({...set,name:e.target.value.trim()});}}/></label>
      <div className="advanced-actions"><select aria-label="Pose Asset" value={assetId} disabled={layer.locked} onChange={e=>setAssetId(e.target.value)}><option value="">Chọn ảnh tư thế đã import</option>{project.assets.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select><button title="Thêm ảnh vào Pose Set" disabled={layer.locked||!assetId} onClick={()=>{
        const asset=project.assets.find(a=>a.id===assetId)!,base=project.assets.find(a=>a.id===layer.assetId)!,newPose={id:crypto.randomUUID(),name:asset.name,assetId,width:asset.width*layer.transform.width/base.width,height:asset.height*layer.transform.height/base.height,anchorX:layer.transform.anchorX,anchorY:layer.transform.anchorY};updateSet({...set,poses:[...set.poses,newPose]});setPoseId(newPose.id);
      }}>+ Pose</button></div>
      <label className="field"><span>Pose đang sửa</span><select aria-label="Pose Selection" value={pose?.id} onChange={e=>setPoseId(e.target.value)}>{set.poses.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      {pose&&<>
        <input aria-label="Pose Name" key={pose.id+pose.name} defaultValue={pose.name} disabled={layer.locked} maxLength={100} onBlur={e=>{if(e.target.value.trim())updateSet({...set,poses:set.poses.map(p=>p.id===pose.id?{...p,name:e.target.value.trim()}:p)});}}/>
        <div className="field-grid"><NumberField label="Pose Anchor X" help={phase3Help.anchor} value={pose.anchorX} min={0} max={1} step={.1} disabled={layer.locked} onCommit={anchorX=>updateSet({...set,poses:set.poses.map(p=>p.id===pose.id?{...p,anchorX}:p)})}/><NumberField label="Pose Anchor Y" help={phase3Help.anchor} value={pose.anchorY} min={0} max={1} step={.1} disabled={layer.locked} onCommit={anchorY=>updateSet({...set,poses:set.poses.map(p=>p.id===pose.id?{...p,anchorY}:p)})}/></div>
        <div className="advanced-actions"><button disabled={layer.locked} title="Đặt Pose tại Playhead" onClick={()=>editAdvanced(s=>{const time=usePlayback.getState().time,key=track!.keyframes.find(k=>Math.abs(k.time-time)<1e-6);return {...s,poseTracks:s.poseTracks.map(t=>t.id===track!.id?{...t,keyframes:[...t.keyframes.filter(k=>k.id!==key?.id),{id:key?.id??crypto.randomUUID(),time,poseId:pose.id}].sort((a,b)=>a.time-b.time)}:t)};})}>Đặt pose tại playhead</button><HelpTip label="Pose Timeline" text={phase3Help.poseKey}/></div>
        <button disabled={layer.locked||set.poses.length<=1||track!.keyframes.some(k=>k.poseId===pose.id)} title="Xóa các mốc dùng pose này trước" onClick={()=>{updateSet({...set,poses:set.poses.filter(p=>p.id!==pose.id)});setPoseId('');}}>Xóa pose khỏi nhóm</button>
      </>}
      <p className="property-note">Mốc đổi ảnh (giây toàn scene):</p>
      {track!.keyframes.map(key=><div className="pose-key-row" key={key.id}><NumberField label={`Pose Time ${key.id}`} displayLabel="Mốc Pose (s)" value={key.time} min={0} max={scene.duration} disabled={layer.locked} onCommit={time=>editAdvanced(s=>({...s,poseTracks:s.poseTracks.map(t=>t.id===track!.id?{...t,keyframes:t.keyframes.map(k=>k.id===key.id?{...k,time}:k).sort((a,b)=>a.time-b.time)}:t)}))}/><span>{set.poses.find(p=>p.id===key.poseId)?.name}</span><button title="Xóa mốc Pose" disabled={layer.locked||track!.keyframes.length<=1} onClick={()=>editAdvanced(s=>({...s,poseTracks:s.poseTracks.map(t=>t.id===track!.id?{...t,keyframes:t.keyframes.filter(k=>k.id!==key.id)}:t)}))}>×</button></div>)}
      <button disabled={layer.locked} title="Bỏ Pose Track" onClick={()=>editAdvanced(s=>({...s,poseTracks:s.poseTracks.filter(t=>t.layerId!==layerId)}))}>Bỏ đổi pose cho Layer</button>
    </>}
  </section>;
}
