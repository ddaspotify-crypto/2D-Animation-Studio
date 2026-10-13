import { getScene,type CameraTrack,type CameraKey } from '../../shared/model.js';
import { useEditor } from '../store/editorStore';
import { usePlayback } from '../store/playbackStore';
import { editAdvanced } from '../advanced/actions';
import { editCamera,upsertCameraKey } from './commands';
export const changeCamera=(patch:{x?:number;y?:number;zoom?:number;rotation?:number})=>editAdvanced(s=>editCamera(s,patch,usePlayback.getState().time,useEditor.getState().autoKey));
export const addCameraKey=(property:CameraTrack['property'])=>editAdvanced(s=>upsertCameraKey(s,property,usePlayback.getState().time));
export function updateCameraTrack(track:CameraTrack){editAdvanced(s=>({...s,camera:{...s.camera,animations:[...s.camera.animations.filter(a=>a.id!==track.id),track]}}));}
export function deleteCameraTrack(id:string,frameId?:string){editAdvanced(s=>({...s,camera:{...s.camera,animations:s.camera.animations.flatMap(a=>{if(a.id!==id)return [a];if(!frameId)return [];const keyframes=a.keyframes.filter(k=>k.id!==frameId);return keyframes.length?[{...a,keyframes}]:[];})}}));}
export function changeCameraKey(id:string,keyId:string,patch:Partial<CameraKey>){const track=getScene(useEditor.getState().project).camera.animations.find(a=>a.id===id);if(track)updateCameraTrack({...track,keyframes:track.keyframes.map(k=>k.id===keyId?{...k,...patch}:k).sort((a,b)=>a.time-b.time)});}
