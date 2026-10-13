import { useState } from 'react';
import { Layers, Eye, EyeOff, Lock, Unlock, Copy, Trash2, ArrowUp, ArrowDown, ChevronsUp, ChevronsDown, GripVertical, Folder, ChevronDown, ChevronRight } from 'lucide-react';
import { getScene, type Layer } from '../../shared/model.js';
import { useEditor } from '../store/editorStore';
import { assetUrl } from '../assets/assetManager';
import HelpTip from './HelpTip';

export default function GroupLayersPanel() {
  const state=useEditor(),scene=getScene(state.project),layers=scene.layers;
  const [collapsed,setCollapsed]=useState<Set<string>>(new Set());
  const active=layers.find(l=>l.id===state.selectedIds[0]),index=active?layers.indexOf(active):-1;
  const row=(layer:Layer)=><div key={layer.id} tabIndex={0} className={`layer-row ${state.selectedIds.includes(layer.id)?'selected':''}`} draggable
    onDragStart={e=>e.dataTransfer.setData('application/x-studio-layer',layer.id)} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const id=e.dataTransfer.getData('application/x-studio-layer');if(id)state.reorder(id,layers.indexOf(layer));}}
    onClick={e=>state.select(layer.id,e.shiftKey)} onKeyDown={e=>{if(e.key==='Enter')state.select(layer.id,e.shiftKey);}}>
    <GripVertical size={12}/><img alt="" src={assetUrl(state.project.assets.find(a=>a.id===layer.assetId)!.path)}/><span title={layer.name}>{layer.name}</span>
    <button title={layer.visible?'Ẩn Layer':'Hiện Layer'} onClick={e=>{e.stopPropagation();state.updateLayer(layer.id,{visible:!layer.visible});}}>{layer.visible?<Eye size={13}/>:<EyeOff size={13}/>}</button>
    <button title={layer.locked?'Mở khóa':'Khóa Layer'} onClick={e=>{e.stopPropagation();state.updateLayer(layer.id,{locked:!layer.locked});}}>{layer.locked?<Lock size={13}/>:<Unlock size={13}/>}</button>
  </div>;
  const seen=new Set<string>();
  return <section className="layers-panel" tabIndex={0}>
    <div className="panel-heading"><Layers size={16}/><h2>Layers</h2><span className="count">{layers.length}</span></div>
    <div className="layer-actions">
      <button disabled={!active} title="Bring to Front" onClick={()=>active&&state.reorder(active.id,layers.length-1)}><ChevronsUp size={15}/></button><button disabled={!active||index===layers.length-1} title="Bring Forward" onClick={()=>active&&state.reorder(active.id,index+1)}><ArrowUp size={15}/></button><button disabled={!active||index<=0} title="Send Backward" onClick={()=>active&&state.reorder(active.id,index-1)}><ArrowDown size={15}/></button><button disabled={!active} title="Send to Back" onClick={()=>active&&state.reorder(active.id,0)}><ChevronsDown size={15}/></button>
      <button disabled={!active} title="Duplicate · Ctrl+D" onClick={state.duplicate}><Copy size={15}/></button><button disabled={!active||state.selectedIds.some(id=>layers.find(l=>l.id===id)?.locked)} title="Delete" onClick={state.deleteSelected}><Trash2 size={15}/></button>
      <button title="Group Layer đã chọn" disabled={!state.selectedIds.length} onClick={state.groupSelected}><Folder size={15}/></button><HelpTip label="Group Layer" text="Giữ Shift để chọn body, tay và kiếm rồi bấm Group. Group là thư mục chọn chung, giữ nguyên Parent/Child và thứ tự trước/sau. Chọn hàng Group để Duplicate hoặc Ctrl+C/V toàn nhóm, gồm animation, path, pose và điểm gắn; bản sao có Pose Set riêng. Sửa tên trên hàng Group. Ungroup chỉ bỏ thư mục, giữ hình và animation."/>
    </div>
    <div className="layers-scroll">{[...layers].reverse().map(layer=>{
      const group=scene.groups?.find(g=>g.id===layer.groupId);if(!group)return row(layer);if(seen.has(group.id))return null;seen.add(group.id);
      return <div className="layer-group" key={group.id}>
        <div className={`group-row ${state.selectedGroupId===group.id?'selected':''}`} tabIndex={0} onClick={()=>state.selectGroup(group.id)} onKeyDown={e=>{if(e.key==='Enter')state.selectGroup(group.id);}}>
          <button title="Thu gọn / mở Group" onClick={e=>{e.stopPropagation();setCollapsed(prev=>{const next=new Set(prev);if(next.has(group.id))next.delete(group.id);else next.add(group.id);return next;});}}>{collapsed.has(group.id)?<ChevronRight size={13}/>:<ChevronDown size={13}/>}</button><Folder size={14}/>
          <input aria-label={`Tên Group ${group.id}`} title="Sửa tên Group" key={group.name} defaultValue={group.name} maxLength={100} onFocus={()=>state.selectGroup(group.id)} onBlur={e=>state.renameGroup(group.id,e.target.value)} onKeyDown={e=>{e.stopPropagation();if(e.key==='Enter')e.currentTarget.blur();}}/>
          <button title="Duplicate Group" onClick={e=>{e.stopPropagation();state.selectGroup(group.id);state.duplicate();}}><Copy size={13}/></button><button title="Ungroup · Bỏ nhóm" onClick={e=>{e.stopPropagation();state.ungroup(group.id);}}>↗</button>
        </div>
        {!collapsed.has(group.id)&&<div className="group-children">{[...layers].reverse().filter(l=>l.groupId===group.id).map(row)}</div>}
      </div>;
    })}{!layers.length&&<p className="muted layer-empty">Layer sẽ xuất hiện khi bạn thêm ảnh vào Canvas.</p>}</div>
    <div className="panel-foot">Trên cùng = phía trước · Group không đổi Z-order</div>
  </section>;
}
