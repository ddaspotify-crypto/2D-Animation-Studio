import { Diamond, Copy, ClipboardPaste, Trash2 } from 'lucide-react';
import { getScene, type Animation, type AnimationProperty, type Easing } from '../../shared/model.js';
import { propertyKeys } from '../../shared/animationEngine.js';
import { createAnimationPreset, upsertKeyframe } from '../animation/commands';
import { useEditor } from '../store/editorStore';
import { usePlayback } from '../store/playbackStore';
import { useTimeline } from '../store/timelineStore';
import NumberField from './NumberField';
import HelpTip from './HelpTip';
import { animationHelp, easingLabels, trackHelp, valueHelp } from './animationHelp';

export const trackLabels: Record<AnimationProperty, string> = {position: 'Move / Position', scale: 'Scale', rotation: 'Rotate', opacity: 'Fade / Opacity',zOrder:'Z-order · Trước/sau'};
export default function AnimationPanel({layerId}: {layerId: string}) {
  const project = useEditor(s => s.project), autoKey = useEditor(s => s.autoKey);
  const error = useEditor(s => s.animationError);
  const selectedAnimation = useTimeline(s => s.animationId), selectedFrame = useTimeline(s => s.frameId), clipboard = useTimeline(s => s.clipboard);
  const scene = getScene(project), layer = scene.layers.find(l => l.id === layerId)!;
  const tracks = scene.animations.filter(a => a.layerId === layerId);
  const track = tracks.find(a => a.id === selectedAnimation) ?? tracks[0];
  const frame = track?.keyframes.find(k => k.id === selectedFrame) ?? track?.keyframes[0];
  const update = (animation: Animation) => useEditor.getState().setAnimation(animation);
  function add(property: AnimationProperty) {
    const found = tracks.find(a => a.property === property);
    if (found) {useTimeline.getState().select(found.id); return;}
    try {
      const animation = createAnimationPreset(scene, layerId, property, usePlayback.getState().time);
      update(animation); useTimeline.getState().select(animation.id, animation.keyframes[1].id);
    } catch (error) {useEditor.setState({animationError: error instanceof Error ? error.message : 'Không tạo được animation.'});}
  }
  function paste() {
    if (!clipboard) return;
    const state = useEditor.getState(); const next = upsertKeyframe(getScene(state.project), layerId, clipboard.property, usePlayback.getState().time, {...clipboard.frame, easing: clipboard.frame.easing});
    state.commit({...state.project, scenes: [next]});
    const animation = next.animations.find(a => a.layerId === layerId && a.property === clipboard.property)!;
    useTimeline.getState().select(animation.id);
  }
  return <div className="animation-properties">
    <h3 className="help-heading">ANIMATION <HelpTip label="Animation" text={animationHelp.animation}/></h3>
    <label className={`auto-key-label ${autoKey ? 'enabled' : ''}`}><input type="checkbox" aria-label="Auto Keyframe" checked={autoKey} onChange={event => useEditor.getState().setAutoKey(event.target.checked)}/><Diamond size={13}/>Auto Keyframe <HelpTip label="Auto Keyframe" text={animationHelp.autoKey}/><b>{autoKey ? 'ON' : 'OFF'}</b></label>
    <div className="animation-add-grid">{(['position','scale','rotation','opacity','zOrder'] as AnimationProperty[]).map(property => <div className="animation-preset" key={property}><button disabled={layer.locked} title={`Thêm ${trackLabels[property]}`} onClick={() => add(property)}>{tracks.some(a => a.property === property) ? '✓ ' : '+ '}{trackLabels[property]}</button><HelpTip label={trackLabels[property]} text={trackHelp[property]}/></div>)}</div>
    {track && <>
      <label className="field"><span className="field-label">Track đang sửa <HelpTip label="Track" text={animationHelp.track}/></span><select aria-label="Animation Track" value={track.id} onChange={event => useTimeline.getState().select(event.target.value)}>{tracks.map(a => <option key={a.id} value={a.id}>{trackLabels[a.property]}</option>)}</select></label>
      <div className="field-grid"><NumberField label="Start Time (s)" help={animationHelp.start} value={track.startTime} min={0} max={scene.duration-track.duration} step={1/scene.fps} disabled={layer.locked} onCommit={startTime => update({...track, startTime})}/>
        <NumberField label="Animation Duration (s)" help={animationHelp.duration} value={track.duration} min={.001} max={scene.duration-track.startTime} step={1/scene.fps} disabled={layer.locked} onCommit={duration => update({...track, duration, keyframes: track.keyframes.map(k => ({...k, time: k.time/track.duration*duration}))})}/></div>
      <div className="property-note field-label">End Time: {(track.startTime+track.duration).toFixed(3)}s <HelpTip label="End Time" text={animationHelp.end}/></div>
      <div className="field-grid"><label className="field"><span className="field-label">Easing mặc định <HelpTip label="Easing" text={animationHelp.easing}/></span><select aria-label="Animation Easing" value={track.easing} disabled={layer.locked||track.property==='zOrder'} onChange={event => update({...track, easing: event.target.value as Easing})}>{Object.entries(easingLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="field"><span className="field-label">Loop <HelpTip label="Loop" text={animationHelp.loop}/></span><select aria-label="Animation Loop" value={track.loop} disabled={layer.locked} onChange={event => update({...track, loop: event.target.value as Animation['loop']})}><option value="none">No Loop · Một lần</option><option value="repeat">Repeat · Lặp lại</option><option value="pingPong">Ping Pong · Tới/lui</option></select></label></div>
      <div className="key-actions"><button title="Add Keyframe at Playhead" disabled={layer.locked} onClick={() => useEditor.getState().addKeyframe(layerId, track.property)}><Diamond size={12}/>+ Key</button><button title="Copy Keyframe" disabled={!frame} onClick={() => frame && useTimeline.setState({clipboard: {property: track.property, frame: {...frame}}})}><Copy size={13}/></button><button title="Paste Keyframe at Playhead" disabled={!clipboard || layer.locked} onClick={paste}><ClipboardPaste size={13}/></button><button title="Delete Animation Track" disabled={layer.locked} onClick={() => useEditor.getState().removeAnimation(track.id)}><Trash2 size={13}/></button></div>
      <div className="key-help-row"><span>+ Key <HelpTip label="Thêm key tại playhead" text={animationHelp.addKey}/></span><span>Copy <HelpTip label="Copy Keyframe" text={animationHelp.copyKey}/></span><span>Paste <HelpTip label="Paste Keyframe" text={animationHelp.pasteKey}/></span><span>Track <HelpTip label="Xóa track" text={animationHelp.deleteTrack}/></span></div>
      {frame && <>
        <label className="field"><span className="field-label">Keyframe <HelpTip label="Keyframe" text={animationHelp.keyframe}/></span><select aria-label="Selected Keyframe" value={frame.id} onChange={event => useTimeline.getState().select(track.id, event.target.value)}>{track.keyframes.map(k => <option key={k.id} value={k.id}>{(track.startTime+k.time).toFixed(3)}s</option>)}</select></label>
        <NumberField label="Key Time (s)" help={animationHelp.keyTime} value={track.startTime+frame.time} min={track.startTime} max={track.startTime+track.duration} step={1/scene.fps} disabled={layer.locked} onCommit={time => useEditor.getState().editKeyframe(track.id, frame.id, {time: time-track.startTime})}/>
        <div className="field-grid">{propertyKeys[track.property].map(key => <NumberField key={key} label={`Key ${key}`} help={valueHelp[key]} value={frame[key]!} min={key === 'opacity' || key === 'zOrder' ? 0 : key.startsWith('scale') ? .001 : -1e7} max={key === 'zOrder' ? 500 : key === 'opacity' ? 1 : key.startsWith('scale') ? 100 : 1e7} step={key === 'opacity' || key.startsWith('scale') ? .1 : 1} disabled={layer.locked} onCommit={value => useEditor.getState().editKeyframe(track.id, frame.id, {[key]: value})}/>)}</div>
        <label className="field"><span className="field-label">Easing đến key tiếp theo <HelpTip label="Easing của key" text={animationHelp.keyEasing}/></span><select aria-label="Keyframe Easing" value={frame.easing ?? ''} disabled={layer.locked||track.property==='zOrder'} onChange={event => useEditor.getState().editKeyframe(track.id, frame.id, {easing: (event.target.value || undefined) as Easing | undefined})}><option value="">Theo track</option>{Object.entries(easingLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <div className="inline-help-action"><button title="Delete Selected Keyframe" disabled={layer.locked} onClick={() => useEditor.getState().removeKeyframe(track.id, frame.id)}><Trash2 size={12}/>Delete Keyframe</button><HelpTip label="Xóa keyframe" text={animationHelp.deleteKey}/></div>
      </>}
    </>}
    {!track && <p className="property-note">Chọn + Move/Scale/Rotate/Fade để tạo track với 2 keyframes, sau đó chỉnh các giá trị và thời gian.</p>}
    {error && <p role="alert" className="animation-error">{error}</p>}
  </div>;
}
