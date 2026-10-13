import { SlidersHorizontal } from 'lucide-react';
import { getScene, type Transform } from '../../shared/model.js';
import { useEditor } from '../store/editorStore';
import { usePlayback } from '../store/playbackStore';
import { evaluateSceneAtTime } from '../../shared/animationEngine.js';
import AnimationPanel from './AnimationPanel';
import NumberField from './NumberField';
import { animationHelp, valueHelp } from './animationHelp';
import MotionPathPanel from './MotionPathPanel';
import BindingPanel from './BindingPanel';
import PosePanel from './PosePanel';
import HelpTip from './HelpTip';
import CameraPanel from './CameraPanel';

export default function PropertiesPanel() {
  const project = useEditor(s => s.project), selected = useEditor(s => s.selectedIds);
  const updateLayer = useEditor(s => s.updateLayer), updateScene = useEditor(s => s.updateScene);
  const time = usePlayback(s => s.time), playing = usePlayback(s => s.playing), autoKey = useEditor(s => s.autoKey);
  const scene = getScene(project), layer = evaluateSceneAtTime(scene, time).layers.find(l => l.id === selected[0]);
  const flip = (key:'flipX'|'flipY') => {if(!layer||layer.locked||playing)return;const base=scene.layers.find(l=>l.id===layer.id)!;useEditor.getState().commit({...project,scenes:project.scenes.map(s=>s.id===scene.id?{...s,layers:s.layers.map(l=>l.id===base.id?{...l,transform:{...l.transform,[key]:!l.transform[key]}}:l)}:s)});};
  const transformField = (key: Exclude<keyof Transform,'flipX'|'flipY'>, label: string, min?: number, max?: number, step?: number) => layer && <NumberField key={key} label={label} help={valueHelp[key] ? `Giá trị đang xem tại playhead. Auto Key ON để ghi chuyển động; OFF sửa giá trị nền. ${valueHelp[key].replace('ở key đang chọn', 'tại thời điểm đang xem')}` : key.startsWith('anchor') ? 'Pivot là điểm neo để xoay/scale: 0/0 ở góc trên trái, 0.5/0.5 ở tâm. X/Y là tọa độ của Pivot, nên đổi Pivot có thể làm ảnh dịch vị trí. Pivot chưa có keyframe trong Phase 2.' : undefined} value={layer.transform[key]??0} min={min} max={max} step={step} disabled={layer.locked || playing}
    onCommit={value => updateLayer(layer.id, {transform: {...layer.transform, [key]: value}})}/>;
  return <section className="properties-panel">
    <div className="panel-heading"><SlidersHorizontal size={16}/><h2>Properties</h2></div>
    <div className="properties-scroll">
      <h3>SCENE</h3>
      <label className="field">Tên Scene<input aria-label="Scene Name" key={scene.id+scene.name} defaultValue={scene.name} maxLength={250} onBlur={e=>{if(e.target.value.trim())updateScene({name:e.target.value.trim()});}} onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur();}}/></label>
      <label className="field"><span>Tỉ lệ khung hình</span><select aria-label="Tỉ lệ khung hình" value={scene.width === 1920 && scene.height === 1080 ? 'landscape' : scene.width === 1080 && scene.height === 1920 ? 'portrait' : 'custom'} onChange={event => {if (event.target.value !== 'custom') updateScene(event.target.value === 'landscape' ? {width: 1920, height: 1080} : {width: 1080, height: 1920});}}><option value="landscape">16:9 · Landscape</option><option value="portrait">9:16 · Mobile</option><option value="custom">Custom</option></select></label>
      <div className="field-grid"><NumberField label="Scene Width" value={scene.width} min={1} max={16384} onCommit={width => updateScene({width})}/><NumberField label="Scene Height" value={scene.height} min={1} max={16384} onCommit={height => updateScene({height})}/><NumberField label="FPS" help={animationHelp.fps} value={scene.fps} min={1} max={120} onCommit={fps => updateScene({fps: Math.round(fps)})}/><NumberField label="Duration (s)" help={animationHelp.sceneDuration} value={scene.duration} min={.01} max={86400} step={.1} onCommit={duration => updateScene({duration})}/></div>
      <label className="field color-field"><span>Background</span><input type="color" aria-label="Background" value={scene.background} onChange={event => updateScene({background: event.target.value})}/><small>{scene.background}</small></label>
      <CameraPanel/>
      {layer ? <>
        <h3>LAYER {selected.length > 1 ? `· ${selected.length} ĐÃ CHỌN (sửa layer đầu)` : ''}</h3>
        <label className="field"><span>Name</span><input aria-label="Layer Name" key={layer.id + layer.name} defaultValue={layer.name} maxLength={250} onBlur={event => {if (event.target.value.trim()) updateLayer(layer.id, {name: event.target.value.trim()});}} onKeyDown={event => {if (event.key === 'Enter') event.currentTarget.blur();}}/></label>
        <div className="toggle-row"><label><input type="checkbox" checked={layer.visible} onChange={event => updateLayer(layer.id, {visible: event.target.checked})}/>Visible</label><label><input type="checkbox" checked={layer.locked} onChange={event => updateLayer(layer.id, {locked: event.target.checked})}/>Locked</label></div>
        <NumberField label="Opacity" help="Độ rõ đang xem tại playhead: 0 = trong suốt, 1 = rõ hoàn toàn. Bật Auto Key để ghi mốc Fade khi sửa; nếu OFF, sửa giá trị nền và track Fade vẫn ưu tiên khi xem trước." value={layer.opacity} min={0} max={1} step={.05} disabled={layer.locked || playing} onCommit={opacity => updateLayer(layer.id, {opacity})}/>
        <h3>TRANSFORM</h3><div className="field-grid">{transformField('x', 'Position X')}{transformField('y', 'Position Y')}{transformField('width', 'Width', .001, 16384)}{transformField('height', 'Height', .001, 16384)}{transformField('scaleX', 'Scale X', .001, 100, .1)}{transformField('scaleY', 'Scale Y', .001, 100, .1)}{transformField('rotation', 'Rotation (°)')}{transformField('anchorX', 'Pivot X (0–1)', 0, 1, .1)}{transformField('anchorY', 'Pivot Y (0–1)', 0, 1, .1)}</div>
        <p className="property-note">Vị trí X/Y là tọa độ pivot. Width/Height là kích thước gốc; Scale là hệ số phóng.</p>
        <div className="advanced-actions"><button aria-label="Lật ngang" aria-pressed={!!scene.layers.find(l=>l.id===layer.id)?.transform.flipX} disabled={layer.locked||playing} onClick={()=>flip('flipX')}>↔ Lật ngang</button><button aria-label="Lật dọc" aria-pressed={!!scene.layers.find(l=>l.id===layer.id)?.transform.flipY} disabled={layer.locked||playing} onClick={()=>flip('flipY')}>↕ Lật dọc</button><HelpTip label="Lật ảnh đối xứng" text="Lật ngang đổi trái/phải, phù hợp tạo tay phải từ ảnh tay trái; lật dọc đổi trên/dưới. Bấm lần nữa để trở lại. Ảnh lật quanh Pivot, điểm gắn đi theo ảnh; Child dùng Bind Transform cũng đi theo. Trạng thái lật áp dụng toàn Timeline, kể cả đổi pose, không tạo keyframe khi Auto Key bật. Có thể Undo/Redo."/></div>
        <p className="property-note">Giá trị tại {time.toFixed(2)}s. {autoKey ? 'Auto Key ON: sửa giá trị sẽ tạo/cập nhật keyframe.' : 'Auto Key OFF: sửa transform nền; track animation vẫn ưu tiên khi preview.'}</p>
        <AnimationPanel layerId={layer.id}/>
        <MotionPathPanel layerId={layer.id}/><PosePanel layerId={layer.id}/><BindingPanel layerId={layer.id}/>
      </> : <div className="empty-state properties-empty"><SlidersHorizontal size={25}/><strong>Chọn một Layer</strong><p>Chỉnh vị trí, kích thước, rotation và độ trong suốt tại đây.</p></div>}
    </div>
  </section>;
}
