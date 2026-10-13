import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { ChevronDown, ChevronRight, Diamond, Minus, Plus, Trash2 } from 'lucide-react';
import { getScene, type Animation } from '../../shared/model.js';
import { useEditor } from '../store/editorStore';
import { usePlayback } from '../store/playbackStore';
import { useTimeline } from '../store/timelineStore';
import { trackLabels } from './AnimationPanel';
import PlaybackControls from './PlaybackControls';
import NumberField from './NumberField';
import HelpTip from './HelpTip';
import { animationHelp, trackHelp } from './animationHelp';
import AdvancedTimelineRows from './AdvancedTimelineRows';
import TimelineTrackMenu from './TimelineTrackMenu';
import CameraTimelineRows from './CameraTimelineRows';

function TimelinePlayhead({pixelsPerSecond}: {pixelsPerSecond: number}) {
  const time = usePlayback(s => s.time);
  return <div className="timeline-playhead-overlay" style={{left: 170+time*pixelsPerSecond}}><div className="ruler-head"/><div className="track-playhead"/></div>;
}
function TimeInput() {
  const time = usePlayback(s => s.time), duration = usePlayback(s => s.duration);
  const [draft, setDraft] = useState(String(time)), [focused, setFocused] = useState(false);
  useEffect(() => {if (!focused) setDraft(String(Math.round(time*1000)/1000));}, [time, focused]);
  return <label className="seek-input">Time <HelpTip label="Time / Playhead" text={animationHelp.playhead}/><input type="number" aria-label="Playhead Time" min={0} max={duration} step={.001} value={draft}
    onFocus={() => setFocused(true)} onBlur={() => {setFocused(false); setDraft(String(Math.round(usePlayback.getState().time*1000)/1000));}}
    onChange={event => {setDraft(event.target.value); if (event.target.value.trim()) usePlayback.getState().seek(Number(event.target.value));}} onKeyDown={event => {if (event.key === 'Enter') event.currentTarget.blur();}}/></label>;
}

export default function Timeline() {
  const scene = useEditor(s => getScene(s.project)), selectedLayers = useEditor(s => s.selectedIds), autoKey = useEditor(s => s.autoKey);
  const selection = useTimeline();
  const [pixelsPerSecond, setPixelsPerSecond] = useState(70), [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [drag, setDrag] = useState<{animationId: string; frameId?: string; resizing?: boolean; value: number} | null>(null);
  const gesture = useRef<{id: string; frameId?: string; resizing?: boolean; startX: number; original: number; value: number} | null>(null);
  const timelineWidth = Math.min(6_000_000, Math.max(300, scene.duration*pixelsPerSecond));
  const snap = (value: number) => Math.round(value*scene.fps)/scene.fps;
  function seek(event: PointerEvent<HTMLDivElement>) {
    if(event.type==='pointerdown'&&event.button!==0)return;
    const box = event.currentTarget.getBoundingClientRect();
    usePlayback.getState().seek(snap((event.clientX-box.left)/pixelsPerSecond));
  }
  function startGesture(event: PointerEvent<HTMLElement>, animation: Animation, frameId?: string, resizing = false) {
    event.stopPropagation();
    const layer = scene.layers.find(l => l.id === animation.layerId); if (layer?.locked || event.button !== 0) return;
    usePlayback.getState().pause(); useEditor.getState().select(animation.layerId); selection.select(animation.id, frameId);
    event.currentTarget.setPointerCapture(event.pointerId);
    const original = resizing ? animation.duration : frameId ? animation.keyframes.find(k => k.id === frameId)!.time : animation.startTime;
    gesture.current = {id: animation.id, frameId, resizing, startX: event.clientX, original, value: original};
  }
  function moveGesture(event: PointerEvent<HTMLElement>, animation: Animation) {
    const current = gesture.current; if (!current) return;
    const max = current.resizing ? scene.duration-animation.startTime : current.frameId ? animation.duration : scene.duration-animation.duration;
    const value = Math.max(current.resizing ? .001 : 0, Math.min(max, snap(current.original+(event.clientX-current.startX)/pixelsPerSecond)));
    current.value = value; setDrag({animationId: current.id, frameId: current.frameId, resizing: current.resizing, value});
  }
  function endGesture() {
    const current = gesture.current; gesture.current = null; setDrag(null);
    if (!current || current.value === current.original) return;
    const animation = scene.animations.find(a => a.id === current.id)!;
    if (current.resizing) useEditor.getState().setAnimation({...animation, duration: current.value, keyframes: animation.keyframes.map(k => ({...k, time: k.time/animation.duration*current.value}))});
    else if (current.frameId) useEditor.getState().editKeyframe(animation.id, current.frameId, {time: current.value});
    else useEditor.getState().setAnimation({...animation, startTime: current.value});
  }
  const scaleTick = pixelsPerSecond >= 80 ? .5 : pixelsPerSecond >= 40 ? 1 : 2;
  // Keep long-duration timelines bounded: at most 1000 ruler labels.
  const interval = Math.max(scaleTick, Math.ceil(scene.duration/1000));
  const selectedTrack = scene.animations.find(a => a.id === selection.animationId);
  return <TimelineTrackMenu><section tabIndex={0} className="timeline-panel" aria-label="Animation Timeline">
    <div className="timeline-toolbar"><strong className="field-label">Timeline <HelpTip label="Timeline" text={animationHelp.timeline}/></strong><PlaybackControls/>
      <label className={`auto-key-label ${autoKey ? 'enabled' : ''}`}><input aria-label="Timeline Auto Keyframe" type="checkbox" checked={autoKey} onChange={event => useEditor.getState().setAutoKey(event.target.checked)}/><Diamond size={12}/>Auto Key <HelpTip label="Auto Key trên Timeline" text={animationHelp.autoKey}/></label>
      <TimeInput/>
      <div className="timeline-duration-input" title="Tổng thời lượng scene. Nhập số giây rồi nhấn Enter.">
        <NumberField label="Thời lượng (s)" help={animationHelp.sceneDuration} value={scene.duration} min={.01} max={86400} step={1}
          onCommit={duration => useEditor.getState().updateScene({duration})}/>
      </div>
      <div className="inline-help-action"><button title="Animation Properties" disabled={!selectedLayers.length} onClick={() => document.querySelector('.animation-properties')?.scrollIntoView({block: 'start', behavior: 'smooth'})}>+ Animation</button><HelpTip label="Mở phần Animation" text="Chọn Layer rồi bấm + Animation để tới phần tạo chuyển động trong Properties. Bấm tiếp Move/Scale/Rotate/Fade để thêm track; nút này chỉ đưa bạn tới các điều khiển."/></div>
      <button title="Delete Timeline Keyframe" disabled={!selection.frameId || !selectedTrack || scene.layers.find(l => l.id === selectedTrack?.layerId)?.locked} onClick={() => selectedTrack && selection.frameId && useEditor.getState().removeKeyframe(selectedTrack.id, selection.frameId)}><Trash2 size={13}/></button>
      <div className="timeline-zoom"><button title="Timeline Zoom Out" onClick={() => setPixelsPerSecond(v => Math.max(10, v/1.4))}><Minus size={13}/></button><span>{Math.round(pixelsPerSecond)} px/s</span><button title="Timeline Zoom In" onClick={() => setPixelsPerSecond(v => Math.min(300, v*1.4))}><Plus size={13}/></button><HelpTip label="Zoom Timeline / px/s" text={animationHelp.zoom}/></div>
    </div>
    <div className="timeline-scroll"><div className="timeline-content" style={{width: timelineWidth+170}}>
      <div className="timeline-row ruler-row"><div className="track-label sticky-label field-label">Layers / Tracks <HelpTip label="Layer / Track / Keyframe" text={`${animationHelp.track} ${animationHelp.keyframe}`}/></div><div className="time-lane ruler" style={{width: timelineWidth}} title="Click hoặc kéo trên thước để xem tại thời điểm đó; playback sẽ tạm dừng."
        onPointerDown={event => {event.currentTarget.setPointerCapture(event.pointerId); seek(event);}}
        onPointerMove={event => {if (event.buttons === 1) seek(event);}}>
        {Array.from({length: Math.floor(scene.duration/interval)+1}, (_, i) => <span key={i} style={{left: i*interval*pixelsPerSecond}}>{(i*interval).toFixed(interval < 1 ? 1 : 0)}s</span>)}
      </div></div>
      <CameraTimelineRows scene={scene} pps={pixelsPerSecond} width={timelineWidth}/>
      {scene.layers.map(layer => <div key={layer.id}>
        <div className={`timeline-row ${selectedLayers.includes(layer.id) ? 'selected-layer' : ''}`}><button className="track-label sticky-label layer-track-label" onClick={() => {useEditor.getState().select(layer.id); setCollapsed(previous => {const next = new Set(previous); if (next.has(layer.id)) next.delete(layer.id); else next.add(layer.id); return next;});}}>{collapsed.has(layer.id) ? <ChevronRight size={13}/> : <ChevronDown size={13}/>}<span>{layer.name}</span></button><div className="time-lane layer-lane" style={{width: timelineWidth, backgroundSize: `${pixelsPerSecond}px 100%`}} onPointerDown={seek}/></div>
        {!collapsed.has(layer.id) && scene.animations.filter(a => a.layerId === layer.id).map(animation => {
          const startTime = drag?.animationId === animation.id && !drag.frameId && !drag.resizing ? drag.value : animation.startTime;
          const duration = drag?.animationId === animation.id && drag.resizing ? drag.value : animation.duration;
          return <div className={`timeline-row ${selection.animationId===animation.id?'active-track':''}`} key={animation.id} data-track-id={animation.id} data-track-kind="animation"><button className={`track-label sticky-label ${selection.animationId === animation.id ? 'selected' : ''}`} title={trackHelp[animation.property]} onClick={() => {useEditor.getState().select(layer.id); selection.select(animation.id);}}>{trackLabels[animation.property]}</button><div className="time-lane" style={{width: timelineWidth, backgroundSize: `${pixelsPerSecond}px 100%`}} onPointerDown={seek}>
            <div className={`animation-bar ${selection.animationId === animation.id ? 'selected' : ''}`} title={`${trackLabels[animation.property]} · kéo để đổi Start Time`} style={{left: startTime*pixelsPerSecond, width: duration*pixelsPerSecond}}
              onPointerDown={event => startGesture(event, animation)} onPointerMove={event => moveGesture(event, animation)} onPointerUp={endGesture} onPointerCancel={() => {gesture.current = null; setDrag(null);}}>
              {animation.keyframes.map(frame => {
                const at = drag?.animationId === animation.id && drag.frameId === frame.id ? drag.value : frame.time/animation.duration*duration;
                return <button key={frame.id} data-frame-id={frame.id} className={`timeline-key ${selection.frameId === frame.id && selection.animationId === animation.id ? 'selected' : ''}`} title={`Keyframe ${animation.property} @ ${(startTime+at).toFixed(3)}s\nMốc giá trị của chuyển động. Click để chọn, kéo sang trái/phải để đổi thời gian; chỉnh Key values trong Properties.`} aria-label={`Keyframe ${animation.property} ${frame.id}`} style={{left: at*pixelsPerSecond}}
                  onPointerDown={event => startGesture(event, animation, frame.id)} onPointerMove={event => {event.stopPropagation(); moveGesture(event, animation);}} onPointerUp={event => {event.stopPropagation(); endGesture();}}><Diamond size={12}/></button>;
              })}
              <button className="timeline-duration-handle" title="Kéo đổi Animation Duration" aria-label={`Resize ${animation.property} Duration`}
                onPointerDown={event => startGesture(event, animation, undefined, true)} onPointerMove={event => {event.stopPropagation(); moveGesture(event, animation);}} onPointerUp={event => {event.stopPropagation(); endGesture();}}/>
            </div>
          </div></div>;
        })}
        {!collapsed.has(layer.id)&&<AdvancedTimelineRows scene={scene} layerId={layer.id} width={timelineWidth} pps={pixelsPerSecond}/>}
      </div>)}
      {!scene.layers.length && <div className="timeline-empty">Thêm ảnh vào Canvas, chọn Layer và tạo animation trong Properties.</div>}
      <TimelinePlayhead pixelsPerSecond={pixelsPerSecond}/>
    </div></div>
  </section></TimelineTrackMenu>;
}
