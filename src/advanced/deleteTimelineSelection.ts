import { getScene } from '../../shared/model.js';
import { useEditor } from '../store/editorStore';
import { useTimeline } from '../store/timelineStore';
import { editAdvanced } from './actions';
import { deleteCameraTrack } from '../camera/actions';

/** Timeline Delete never falls back to deleting the owning Layer. */
export function deleteTimelineSelection(){
  const selection=useTimeline.getState(),state=useEditor.getState(),scene=getScene(state.project),id=selection.animationId;
  if(!id)return;
  if(selection.kind==='camera'){deleteCameraTrack(id,selection.frameId??undefined);useTimeline.getState().select(null);return;}
  const track=selection.kind==='animation'?scene.animations.find(a=>a.id===id):selection.kind==='path'?scene.motionPaths.find(p=>p.id===id):scene.poseTracks.find(p=>p.id===id);
  if(!track||scene.layers.find(l=>l.id===track.layerId)?.locked)return;
  if(selection.kind==='animation'){
    if(selection.frameId)state.removeKeyframe(id,selection.frameId);else state.removeAnimation(id);
  }else if(selection.kind==='path')editAdvanced(s=>({...s,motionPaths:s.motionPaths.filter(p=>p.id!==id)}));
  else editAdvanced(s=>({...s,poseTracks:s.poseTracks.flatMap(p=>{
    if(p.id!==id)return [p];if(!selection.frameId)return [];
    const keyframes=p.keyframes.filter(k=>k.id!==selection.frameId);return keyframes.length?[{...p,keyframes}]:[];
  })}));
  useTimeline.getState().select(null);
}
