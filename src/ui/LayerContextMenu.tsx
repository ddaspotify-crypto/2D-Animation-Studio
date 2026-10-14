import { useEffect,useState,type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { getScene } from '../../shared/model.js';
import { useEditor } from '../store/editorStore';
import { useWorkspace } from '../store/workspaceStore';
import { copyWorkspace,pasteWorkspace } from '../advanced/clipboard';
export default function LayerContextMenu({children}:{children:ReactNode}){
 const [menu,setMenu]=useState<{x:number;y:number}|null>(null),state=useEditor(),scene=getScene(state.project),selected=scene.layers.filter(l=>state.selectedIds.includes(l.id)),active=selected[0],locked=selected.some(l=>l.locked),group=state.selectedGroupId;
 useEffect(()=>{if(!menu)return;const close=()=>setMenu(null),key=(e:KeyboardEvent)=>{if(e.key==='Escape')close();};window.addEventListener('pointerdown',close);window.addEventListener('resize',close);window.addEventListener('keydown',key);return()=>{window.removeEventListener('pointerdown',close);window.removeEventListener('resize',close);window.removeEventListener('keydown',key);};},[menu]);
 function action(fn:()=>void){setMenu(null);try{fn();}catch(e){useEditor.setState({animationError:e instanceof Error?e.message:'Thao tác thất bại.'});}}
 return <div className="layer-context-host" onContextMenu={e=>{const target=e.target as HTMLElement;if(target.closest('input,textarea,select,.monaco-editor,[role="dialog"],.timeline-panel,.asset-panel'))return;const row=target.closest<HTMLElement>('[data-layer-id]'),groupRow=target.closest<HTMLElement>('[data-group-id]'),canvas=target.closest('.canvas-workspace');if(!row&&!groupRow&&!canvas)return;e.preventDefault();useWorkspace.setState({area:'layers'});if(row&&!state.selectedIds.includes(row.dataset.layerId!))state.select(row.dataset.layerId!);else if(groupRow)state.selectGroup(groupRow.dataset.groupId!);setMenu({x:Math.max(8,Math.min(e.clientX,window.innerWidth-245)),y:Math.max(8,Math.min(e.clientY,window.innerHeight-425))});}}>{children}
 {menu&&createPortal(<div role="menu" aria-label="Thao tác Layer" className="timeline-context-menu layer-context-menu" style={{left:menu.x,top:menu.y}} onPointerDown={e=>e.stopPropagation()}>
 <button role="menuitem" disabled={!active} onClick={()=>action(()=>{document.querySelector('input[aria-label="Layer Name"]')?.closest('label')?.scrollIntoView({block:'start',behavior:'smooth'});})}>Properties · Thuộc tính</button>
 <button role="menuitem" disabled={!active} onClick={()=>action(()=>{copyWorkspace();})}>Copy · Ctrl+C</button><button role="menuitem" onClick={()=>action(()=>{pasteWorkspace();})}>Paste · Ctrl+V</button><button role="menuitem" disabled={!active} onClick={()=>action(state.duplicate)}>Duplicate · Ctrl+D</button>
 <button role="menuitem" disabled={!active} onClick={()=>action(()=>active&&state.reorder(active.id,scene.layers.length-1))}>Bring to Front · Lên trước</button><button role="menuitem" disabled={!active} onClick={()=>action(()=>active&&state.reorder(active.id,0))}>Send to Back · Ra sau</button>
 <button role="menuitem" disabled={!active||locked} onClick={()=>action(()=>state.editLayers(selected.map(l=>({id:l.id,patch:{visible:!l.visible}}))))}>Ẩn / hiện Layer</button><button role="menuitem" disabled={!active} onClick={()=>action(()=>state.editLayers(selected.map(l=>({id:l.id,patch:{locked:!locked}}))))}>{locked?'Mở khóa':'Khóa'} Layer</button>
 <button role="menuitem" disabled={!active} onClick={()=>action(state.groupSelected)}>Group · Ctrl+G</button>{group&&<button role="menuitem" onClick={()=>action(()=>state.ungroup(group))}>Ungroup · Ctrl+Shift+G</button>}
 <button role="menuitem" disabled={!active||locked} onClick={()=>action(()=>{if(group&&!window.confirm('Xóa Group và toàn bộ Layer bên trong? Có thể Undo để khôi phục.'))return;state.deleteSelected();})}>Delete · Xóa</button>
 </div>,document.body)}</div>;
}
