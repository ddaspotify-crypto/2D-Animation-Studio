import { useState,useRef,useEffect } from 'react';
import type { Layer,Scene } from '../../shared/model.js';
import { frameMoveBounds } from '../../shared/frameMovement.js';
import type { FrameReference } from '../../shared/frameClipboard.js';
import { useEditor } from '../store/editorStore';
import { useTimeline } from '../store/timelineStore';
import { usePlayback } from '../store/playbackStore';
import { addCodeFrame,changeFrameTiming,selectCodeFrame,moveSelectedCodeFrames } from './frameActions';
import type { CodeFrame } from '../../shared/drawingModel.js';

export default function CodeFramesTimeline({layer,scene,pps,width}:{layer:Layer;scene:Scene;pps:number;width:number}){
 const selection=useTimeline(),[resizePreview,setResizePreview]=useState<{id:string;hold:number}|null>(null);
 const gesture=useRef<{frame:CodeFrame;x:number;resize:boolean;hold:number;delta:number;refs:FrameReference[];bounds:ReturnType<typeof frameMoveBounds>;moved:boolean}|null>(null);
 const selectedFrames=selection.codeSelection.map(r=>scene.layers.find(l=>l.id===r.layerId)?.codeFrames?.find(f=>f.id===r.frameId));
 const selectedIds=new Set(selectedFrames.map(f=>f?.id)),selectedBatches=new Set(selectedFrames.flatMap(f=>f?.batchId?[f.batchId]:[]));
 const previewIds=new Set(selection.codeDrag?.ids??[]);
 useEffect(()=>()=>{if(gesture.current)useTimeline.setState({codeDrag:null});},[]);
 function cancel(){gesture.current=null;setResizePreview(null);useTimeline.setState({codeDrag:null});}
 return <div className="timeline-row" data-track-kind="code" data-track-id={layer.id}>
  <div className="track-label sticky-label"><button onClick={()=>{useEditor.getState().select(layer.id);selection.select(layer.id,null,'code');document.querySelector('.code-frame-properties')?.scrollIntoView({block:'start'});}}>Code Frames</button><button data-timeline-navigation="true" title="Frame trước" onClick={()=>usePlayback.getState().seek(Math.max(0,usePlayback.getState().time-1/scene.fps))}>◀</button><button data-timeline-navigation="true" title="Frame sau" onClick={()=>usePlayback.getState().seek(usePlayback.getState().time+1/scene.fps)}>▶</button></div>
  <div className="time-lane code-frame-lane" style={{width}} title="Ctrl+click chọn/bỏ chọn từng ô; Shift+click chọn dải frame; kéo thân một ô để di chuyển cả lựa chọn. Double-click chỗ trống để thêm frame." onDoubleClick={e=>{if(e.target!==e.currentTarget)return;const r=e.currentTarget.getBoundingClientRect();addCodeFrame(layer.id,Math.floor((e.clientX-r.left)/pps*scene.fps));}}>
   {(layer.codeFrames??[]).map(f=>{
    const start=f.startFrame+(previewIds.has(f.id)?selection.codeDrag?.delta??0:0),hold=resizePreview?.id===f.id?resizePreview.hold:f.holdFrames;
    return <div key={f.id} data-frame-id={f.id} className={`code-frame-clip ${selection.kind==='code'&&(selectedIds.has(f.id)||!!f.batchId&&selectedBatches.has(f.batchId))?'selected':''}`} style={{left:start/scene.fps*pps,width:Math.max(1,hold/scene.fps*pps)}}
     onPointerDown={e=>{if(e.button!==0||layer.locked)return;e.stopPropagation();if(e.shiftKey||e.ctrlKey||e.metaKey)return;
      try{const refs=structuredClone(useTimeline.getState().codeSelection),resize=(e.target as HTMLElement).classList.contains('code-frame-resize'),bounds=frameMoveBounds(scene,resize?[{layerId:layer.id,frameId:f.id}]:refs);usePlayback.getState().pause();e.currentTarget.setPointerCapture(e.pointerId);gesture.current={frame:f,x:e.clientX,resize,hold:f.holdFrames,delta:0,refs,bounds,moved:false};}catch(error){useEditor.setState({animationError:error instanceof Error?error.message:'Không kéo được frame.'});}
     }}
     onPointerMove={e=>{const g=gesture.current;if(!g||g.frame.id!==f.id)return;if(Math.abs(e.clientX-g.x)>3)g.moved=true;const delta=Math.round((e.clientX-g.x)/pps*scene.fps);
      if(g.resize){g.hold=Math.max(1,f.holdFrames+delta);setResizePreview({id:f.id,hold:g.hold});}
      else{g.delta=Math.max(g.bounds.minDelta,Math.min(g.bounds.maxDelta,delta));useTimeline.setState({codeDrag:{ids:g.bounds.ids,delta:g.delta}});}
     }}
     onPointerUp={()=>{const g=gesture.current;cancel();if(!g)return;if(g.resize){if(g.hold!==f.holdFrames)changeFrameTiming(layer.id,f.id,{holdFrames:g.hold});}else if(g.delta)moveSelectedCodeFrames(g.refs,g.delta);else if(!g.moved)selectCodeFrame(layer.id,f.id);}}
     onPointerCancel={cancel} onLostPointerCapture={()=>{if(gesture.current)cancel();}}>
     <button aria-label={`Code Frame ${f.startFrame}`} title={`Frame ${f.startFrame} → ${f.startFrame+f.holdFrames-1} · ${f.transition} · kéo thân để di chuyển các frame đã chọn`} onClick={e=>{if(e.detail===0)selectCodeFrame(layer.id,f.id,e.shiftKey,e.ctrlKey||e.metaKey);}}>F{f.startFrame}</button><span className="code-frame-resize" title="Kéo mép đổi Hold Frames của ô này"/>
    </div>;
   })}
  </div>
 </div>;
}
