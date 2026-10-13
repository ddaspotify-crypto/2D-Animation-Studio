import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { getScene } from '../../shared/model.js';
import { useEditor } from '../store/editorStore';
import { useTimeline } from '../store/timelineStore';
import { editAdvanced } from '../advanced/actions';
import { deleteCameraTrack } from '../camera/actions';

type Target = {kind:string;id:string;frameId?:string;x:number;y:number};
export default function TimelineTrackMenu({children}:{children:ReactNode}) {
  const [menu,setMenu]=useState<Target|null>(null);
  const scene=useEditor(s=>getScene(s.project));
  const resolve=(t:Target)=>t.kind==='camera'?scene.camera.animations.map(a=>({...a,layerId:''})).find(a=>a.id===t.id):t.kind==='animation'?scene.animations.find(a=>a.id===t.id):t.kind==='path'?scene.motionPaths.find(p=>p.id===t.id):scene.poseTracks.find(p=>p.id===t.id);
  const select=(t:Target)=>{const track=resolve(t);if(!track)return;useEditor.getState().select(track.layerId||undefined);useTimeline.getState().select(track.id,t.frameId,t.kind as 'animation'|'path'|'pose'|'camera');};
  const properties=(t:Target)=>{select(t);setMenu(null);requestAnimationFrame(()=>document.querySelector(t.kind==='camera'?'.camera-properties':t.kind==='animation'?'.animation-properties':t.kind==='path'?'.motion-path-properties':'.pose-properties')?.scrollIntoView({block:'start',behavior:'smooth'}));};
  useEffect(()=>{if(!menu)return;const close=()=>setMenu(null);const key=(e:KeyboardEvent)=>{if(e.key==='Escape')close();};document.addEventListener('pointerdown',close);document.addEventListener('keydown',key);window.addEventListener('resize',close);return()=>{document.removeEventListener('pointerdown',close);document.removeEventListener('keydown',key);window.removeEventListener('resize',close);};},[menu]);
  const track=menu&&resolve(menu),locked=scene.layers.find(l=>l.id===track?.layerId)?.locked;
  const remove=(keyOnly:boolean)=>{if(!menu||!track||locked)return;const t=menu;setMenu(null);
    if(t.kind==='camera'){deleteCameraTrack(t.id,keyOnly?t.frameId:undefined);return;}
    if(t.kind==='animation'){if(keyOnly&&t.frameId)useEditor.getState().removeKeyframe(t.id,t.frameId);else useEditor.getState().removeAnimation(t.id);}
    else editAdvanced(s=>t.kind==='path'?{...s,motionPaths:s.motionPaths.filter(p=>p.id!==t.id)}:{...s,poseTracks:s.poseTracks.flatMap(p=>p.id!==t.id?[p]:keyOnly&&t.frameId?(()=>{const keyframes=p.keyframes.filter(k=>k.id!==t.frameId);return keyframes.length?[{...p,keyframes}]:[];})():[])});
  };
  return <div className="timeline-menu-host" onPointerDownCapture={e=>{if(e.button!==0)return;const row=(e.target as HTMLElement).closest<HTMLElement>('[data-track-id]');if(row)select({kind:row.dataset.trackKind!,id:row.dataset.trackId!,x:0,y:0,frameId:(e.target as HTMLElement).closest<HTMLElement>('[data-frame-id]')?.dataset.frameId});}} onContextMenuCapture={e=>{const row=(e.target as HTMLElement).closest<HTMLElement>('[data-track-id]');if(!row)return;e.preventDefault();const frame=(e.target as HTMLElement).closest<HTMLElement>('[data-frame-id]');const t={kind:row.dataset.trackKind!,id:row.dataset.trackId!,frameId:frame?.dataset.frameId,x:Math.min(e.clientX,window.innerWidth-245),y:Math.min(e.clientY,window.innerHeight-155)};select(t);setMenu(t);}} onDoubleClickCapture={e=>{const row=(e.target as HTMLElement).closest<HTMLElement>('[data-track-id]');if(row)properties({kind:row.dataset.trackKind!,id:row.dataset.trackId!,x:0,y:0,frameId:(e.target as HTMLElement).closest<HTMLElement>('[data-frame-id]')?.dataset.frameId});}}>
    {children}
    {menu&&track&&createPortal(<div role="menu" aria-label="Thao tác track Timeline" className="timeline-context-menu" style={{left:menu.x,top:menu.y}} onPointerDown={e=>e.stopPropagation()}>
      <button role="menuitem" autoFocus onClick={()=>properties(menu)}>Mở Properties của track này</button>
      {menu.frameId&&menu.kind!=='path'&&<button role="menuitem" disabled={locked} onClick={()=>remove(true)}>Xóa keyframe đang chọn</button>}
      <button role="menuitem" disabled={locked} onClick={()=>remove(false)}>Xóa {menu.kind==='path'?'Motion Path':menu.kind==='pose'?'track đổi pose':'animation này'}</button>
      <small>Double-click track để mở Properties. Esc đóng menu.</small>
    </div>,document.body)}
  </div>;
}
