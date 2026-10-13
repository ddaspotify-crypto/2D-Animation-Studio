import { useRef, useState, type PointerEvent } from 'react';
import { Diamond } from 'lucide-react';
import type { Scene } from '../../shared/model.js';
import { useEditor } from '../store/editorStore';
import { usePlayback } from '../store/playbackStore';
import { editAdvanced } from '../advanced/actions';
import { useTimeline } from '../store/timelineStore';
import { phase3Help } from './phase3Help';

export default function AdvancedTimelineRows({scene,layerId,width,pps}:{scene:Scene;layerId:string;width:number;pps:number}) {
  const selection=useTimeline();
  const path=scene.motionPaths.find(p=>p.layerId===layerId),poseTrack=scene.poseTracks.find(p=>p.layerId===layerId),locked=scene.layers.find(l=>l.id===layerId)!.locked;
  const [ghost,setGhost]=useState<{kind:'pathStart'|'pathDuration'|'pose';value:number;keyId?:string}|null>(null);
  const gesture=useRef<{kind:'pathStart'|'pathDuration'|'pose';x:number;initial:number;value:number;keyId?:string}|null>(null);
  function begin(e:PointerEvent<HTMLElement>,kind:'pathStart'|'pathDuration'|'pose',initial:number,keyId?:string){e.stopPropagation();if(locked||e.button!==0)return;usePlayback.getState().pause();useEditor.getState().select(layerId);e.currentTarget.setPointerCapture(e.pointerId);gesture.current={kind,x:e.clientX,initial,value:initial,keyId};}
  function move(e:PointerEvent<HTMLElement>){e.stopPropagation();const g=gesture.current;if(!g)return;const max=g.kind==='pathStart'?scene.duration-path!.duration:g.kind==='pathDuration'?scene.duration-path!.startTime:scene.duration;g.value=Math.max(g.kind==='pathDuration'?.001:0,Math.min(max,Math.round((g.initial+(e.clientX-g.x)/pps)*scene.fps)/scene.fps));setGhost({...g});}
  function end(e:PointerEvent<HTMLElement>){e.stopPropagation();const g=gesture.current;gesture.current=null;setGhost(null);if(!g||g.value===g.initial)return;
    if(g.kind==='pose')editAdvanced(s=>({...s,poseTracks:s.poseTracks.map(p=>p.id===poseTrack!.id?{...p,keyframes:p.keyframes.map(k=>k.id===g.keyId?{...k,time:g.value}:k).sort((a,b)=>a.time-b.time)}:p)}));
    else editAdvanced(s=>({...s,motionPaths:s.motionPaths.map(p=>p.id===path!.id?{...p,[g.kind==='pathStart'?'startTime':'duration']:g.value}:p)}));
  }
  const start=ghost?.kind==='pathStart'?ghost.value:path?.startTime,duration=ghost?.kind==='pathDuration'?ghost.value:path?.duration;
  return <>
    {path&&<div className={`timeline-row ${selection.animationId===path.id?'active-track':''}`} data-track-id={path.id} data-track-kind="path"><button className="track-label sticky-label" title={phase3Help.path} onClick={()=>{useEditor.getState().select(layerId);document.querySelector('.motion-path-properties')?.scrollIntoView({block:'start'});}}>Motion Path</button><div className="time-lane" style={{width}}><div className={`animation-bar path-bar ${selection.animationId===path.id?'selected':''}`} style={{left:start!*pps,width:duration!*pps}} onPointerDown={e=>begin(e,'pathStart',path.startTime)} onPointerMove={move} onPointerUp={end} onPointerCancel={()=>{gesture.current=null;setGhost(null);}}><button className="timeline-duration-handle" title="Đổi Duration của Motion Path" onPointerDown={e=>begin(e,'pathDuration',path.duration)} onPointerMove={move} onPointerUp={end}/></div></div></div>}
    {poseTrack&&<div className={`timeline-row ${selection.animationId===poseTrack.id?'active-track':''}`} data-track-id={poseTrack.id} data-track-kind="pose"><button className="track-label sticky-label" title={phase3Help.poseKey} onClick={()=>useEditor.getState().select(layerId)}>Pose · Đổi ảnh</button><div className="time-lane" style={{width}}>{poseTrack.keyframes.map(key=><button key={key.id} data-frame-id={key.id} className={`timeline-key pose-key ${selection.animationId===poseTrack.id&&selection.frameId===key.id?'selected':''}`} title={`Pose @ ${key.time.toFixed(3)}s · Kéo để đổi mốc ảnh`} aria-label={`Pose Key ${key.id}`} style={{left:(ghost?.kind==='pose'&&ghost.keyId===key.id?ghost.value:key.time)*pps}} onPointerDown={e=>begin(e,'pose',key.time,key.id)} onPointerMove={move} onPointerUp={end}><Diamond size={12}/></button>)}</div></div>}
  </>;
}
