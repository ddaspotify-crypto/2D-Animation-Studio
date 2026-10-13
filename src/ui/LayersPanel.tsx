import { Layers, Eye, EyeOff, Lock, Unlock, Copy, Trash2, ArrowUp, ArrowDown, ChevronsUp, ChevronsDown, GripVertical } from 'lucide-react';
import { getScene } from '../../shared/model.js';
import { useEditor } from '../store/editorStore';
import { assetUrl } from '../assets/assetManager';

export default function LayersPanel() {
  const state = useEditor();
  const layers = getScene(state.project).layers;
  const active = layers.find(l => l.id === state.selectedIds[0]);
  const index = active ? layers.indexOf(active) : -1;
  return <section className="layers-panel">
    <div className="panel-heading"><Layers size={16}/><h2>Layers</h2><span className="count">{layers.length}</span></div>
    <div className="layer-actions">
      <button disabled={!active} title="Bring to Front" onClick={() => active && state.reorder(active.id, layers.length-1)}><ChevronsUp size={15}/></button>
      <button disabled={!active || index === layers.length-1} title="Bring Forward" onClick={() => active && state.reorder(active.id, index+1)}><ArrowUp size={15}/></button>
      <button disabled={!active || index <= 0} title="Send Backward" onClick={() => active && state.reorder(active.id, index-1)}><ArrowDown size={15}/></button>
      <button disabled={!active} title="Send to Back" onClick={() => active && state.reorder(active.id, 0)}><ChevronsDown size={15}/></button>
      <button disabled={!active} title="Duplicate · Ctrl+D" onClick={state.duplicate}><Copy size={15}/></button>
      <button disabled={!active || active.locked} title="Delete" onClick={state.deleteSelected}><Trash2 size={15}/></button>
    </div>
    <div className="layers-scroll">{[...layers].reverse().map(layer => <div key={layer.id} className={`layer-row ${state.selectedIds.includes(layer.id) ? 'selected' : ''}`} draggable
      onDragStart={event => event.dataTransfer.setData('application/x-studio-layer', layer.id)}
      onDragOver={event => event.preventDefault()}
      onDrop={event => {event.preventDefault(); const id = event.dataTransfer.getData('application/x-studio-layer'); if (id) state.reorder(id, layers.indexOf(layer));}}
      onClick={event => state.select(layer.id, event.shiftKey)}>
      <GripVertical size={12}/><img alt="" src={assetUrl(state.project.assets.find(a => a.id === layer.assetId)!.path)}/><span title={layer.name}>{layer.name}</span>
      <button title={layer.visible ? 'Ẩn Layer' : 'Hiện Layer'} onClick={event => {event.stopPropagation(); state.updateLayer(layer.id, {visible: !layer.visible});}}>{layer.visible ? <Eye size={13}/> : <EyeOff size={13}/>}</button>
      <button title={layer.locked ? 'Mở khóa' : 'Khóa Layer'} onClick={event => {event.stopPropagation(); state.updateLayer(layer.id, {locked: !layer.locked});}}>{layer.locked ? <Lock size={13}/> : <Unlock size={13}/>}</button>
    </div>)}{!layers.length && <p className="muted layer-empty">Layer sẽ xuất hiện khi bạn thêm ảnh vào Canvas.</p>}</div>
    <div className="panel-foot">Trên cùng = phía trước · Kéo để đổi thứ tự</div>
  </section>;
}
