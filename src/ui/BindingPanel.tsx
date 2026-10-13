import { useState } from 'react';
import { getScene, type Binding } from '../../shared/model.js';
import { useEditor } from '../store/editorStore';
import { usePlayback } from '../store/playbackStore';
import { changeBinding } from '../advanced/commands';
import { editAdvanced } from '../advanced/actions';
import NumberField from './NumberField';
import HelpTip from './HelpTip';
import { phase3Help } from './phase3Help';

export default function BindingPanel({layerId}:{layerId:string}) {
  const scene=useEditor(s=>getScene(s.project)),layer=scene.layers.find(l=>l.id===layerId)!,parent=scene.layers.find(l=>l.id===layer.binding?.parentId);
  const [preset,setPreset]=useState('Center');
  const bind=(binding:Binding|null)=>editAdvanced(s=>changeBinding(s,layerId,binding,usePlayback.getState().time));
  const updatePoint=(id:string,patch:Partial<NonNullable<typeof layer.attachments>[number]>)=>useEditor.getState().updateLayer(layerId,{attachments:layer.attachments?.map(a=>a.id===id?{...a,...patch}:a)});
  return <section className="advanced-section"><h3 className="help-heading">PARENT / BINDING <HelpTip label="Parent–Child" text={phase3Help.bind}/></h3>
    <label className="field"><span>Parent · Ảnh cha</span><select aria-label="Parent Layer" value={layer.binding?.parentId??''} disabled={layer.locked} onChange={e=>bind(e.target.value?{parentId:e.target.value,mode:layer.binding?.mode??'position'}:null)}><option value="">Không liên kết</option>{scene.layers.filter(l=>l.id!==layerId).map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</select></label>
    {layer.binding&&<>
      <label className="field"><span className="field-label">Bind Mode <HelpTip label="Bind Position / Transform" text={phase3Help.mode}/></span><select aria-label="Bind Mode" value={layer.binding.mode} disabled={layer.locked} onChange={e=>bind({...layer.binding!,mode:e.target.value as Binding['mode']})}><option value="position">Bind Position · Theo vị trí</option><option value="transform">Bind Transform · Theo vị trí/xoay/scale</option></select></label>
      <label className="field"><span className="field-label">Attachment · Điểm gắn <HelpTip label="Attachment của Child" text={phase3Help.attachment}/></span><select aria-label="Bind Attachment" value={layer.binding.attachmentId??''} disabled={layer.locked} onChange={e=>bind({...layer.binding!,attachmentId:e.target.value||undefined})}><option value="">Pivot của Parent</option>{parent?.attachments?.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
      <p className="property-note">Child lưu Transform tương đối với liên kết; các ô phía trên hiển thị kết quả trên Canvas.</p>
    </>}
    <h3 className="help-heading">ATTACHMENT POINTS <HelpTip label="Attachment Points" text={phase3Help.attachment}/></h3>
    <div className="advanced-actions"><select aria-label="Attachment Preset" value={preset} onChange={e=>setPreset(e.target.value)}>{['Head','Left Hand','Right Hand','Center','Custom Point'].map(p=><option key={p}>{p}</option>)}</select><button title="Thêm Attachment Point" disabled={layer.locked} onClick={()=>{
      const positions:Record<string,[number,number]>={'Head':[.5,.1],'Left Hand':[.15,.5],'Right Hand':[.85,.5],'Center':[.5,.5],'Custom Point':[.5,.5]},[x,y]=positions[preset];
      useEditor.getState().updateLayer(layerId,{attachments:[...layer.attachments??[],{id:crypto.randomUUID(),name:preset,x,y}]});
    }}>+ Điểm gắn</button></div>
    {(layer.attachments??[]).map(point=><div key={point.id} className="attachment-card">
      <input aria-label={`Attachment Name ${point.id}`} disabled={layer.locked} key={point.name} defaultValue={point.name} maxLength={100} onBlur={e=>{if(e.target.value.trim())updatePoint(point.id,{name:e.target.value.trim()});}}/>
      <div className="field-grid"><NumberField label={`Attachment X ${point.id}`} displayLabel="Point X (0–1)" value={point.x} min={0} max={1} step={.05} disabled={layer.locked} onCommit={x=>updatePoint(point.id,{x})}/><NumberField label={`Attachment Y ${point.id}`} displayLabel="Point Y (0–1)" value={point.y} min={0} max={1} step={.05} disabled={layer.locked} onCommit={y=>updatePoint(point.id,{y})}/></div>
      <button disabled={layer.locked||scene.layers.some(l=>l.binding?.parentId===layerId&&l.binding.attachmentId===point.id)} title="Tháo liên kết Child dùng điểm này trước khi xóa" onClick={()=>useEditor.getState().updateLayer(layerId,{attachments:layer.attachments?.filter(a=>a.id!==point.id)})}>Xóa điểm gắn</button>
    </div>)}
  </section>;
}
