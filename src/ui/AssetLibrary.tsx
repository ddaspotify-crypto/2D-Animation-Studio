import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FolderOpen, ImagePlus, Search, Images } from 'lucide-react';
import { assetUrl } from '../assets/assetManager';
import { getScene } from '../../shared/model.js';
import { useEditor } from '../store/editorStore';
import { useWorkspace } from '../store/workspaceStore';
import { usePlayback } from '../store/playbackStore';
import { removeAsset } from '../advanced/removeAsset';
import { copyWorkspace } from '../advanced/clipboard';

export default function AssetLibrary({busy, onImport}: {busy: boolean; onImport: (files: File[]) => void}) {
  const assets = useEditor(s => s.project.assets);
  const [search, setSearch] = useState(''), [folder, setFolder] = useState('');
  const [preview, setPreview] = useState<string>();
  const selected=useWorkspace(s=>s.assetId);
  const [menu,setMenu]=useState<{id:string;x:number;y:number}|null>(null),[properties,setProperties]=useState<string|null>(null);
  useEffect(()=>{if(!menu)return;const close=()=>setMenu(null),key=(e:KeyboardEvent)=>{if(e.key==='Escape')close();};document.addEventListener('pointerdown',close);document.addEventListener('keydown',key);return()=>{document.removeEventListener('pointerdown',close);document.removeEventListener('keydown',key);};},[menu]);
  const asset=assets.find(a=>a.id===properties);
  const select=(id:string)=>useWorkspace.setState({area:'assets',assetId:id});
  const remove=(id:string)=>{try{const state=useEditor.getState();state.commit(removeAsset(state.project,id,usePlayback.getState().time));setMenu(null);setProperties(null);useWorkspace.setState({assetId:null});}catch(error){useEditor.setState({animationError:error instanceof Error?error.message:'Không xóa được ảnh.'});}};
  const rename=(id:string,patch:{name?:string;folder?:string})=>{const state=useEditor.getState();state.commit({...state.project,assets:state.project.assets.map(a=>a.id===id?{...a,...patch}:a)});};
  const usage=(id:string)=>{const scenes=useEditor.getState().project.scenes;return {layers:scenes.reduce((n,s)=>n+s.layers.filter(l=>l.assetId===id).length,0),poses:scenes.reduce((n,s)=>n+s.poseSets.reduce((n,set)=>n+set.poses.filter(p=>p.assetId===id).length,0),0)};};
  const files = useRef<HTMLInputElement>(null), directory = useRef<HTMLInputElement>(null);
  const folders = [...new Set(assets.map(a => a.folder).filter(Boolean))];
  const filtered = assets.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) && (!folder || a.folder === folder));
  return <section className="asset-panel" tabIndex={0}>
    <div className="panel-heading"><Images size={16}/><h2>Asset Library</h2><span className="count">{assets.length}</span></div>
    <div className="import-actions"><button disabled={busy} onClick={() => files.current?.click()}><ImagePlus size={14}/>Import ảnh</button><button title="Import thư mục và thư mục con" disabled={busy} onClick={() => directory.current?.click()}><FolderOpen size={15}/></button></div>
    <input ref={files} hidden type="file" multiple accept="image/png,image/jpeg,image/webp" onChange={event => {onImport([...event.target.files ?? []]); event.target.value = '';}}/>
    <input ref={directory} hidden type="file" multiple {...{webkitdirectory: '', directory: ''}} onChange={event => {onImport([...event.target.files ?? []].filter(f => /\.(png|jpe?g|webp)$/i.test(f.name))); event.target.value = '';}}/>
    <label className="search"><Search size={14}/><input placeholder="Tìm tên ảnh…" value={search} onChange={event => setSearch(event.target.value)}/></label>
    {folders.length > 0 && <select aria-label="Lọc thư mục" value={folder} onChange={event => setFolder(event.target.value)}><option value="">Tất cả thư mục</option>{folders.map(f => <option key={f}>{f}</option>)}</select>}
    <div className="assets-scroll">
      {filtered.length ? <div className="asset-grid">{filtered.map(asset => <div className={`asset-card ${selected===asset.id?'selected':''}`} tabIndex={0} key={asset.id} draggable={!busy} onClick={()=>select(asset.id)} onContextMenu={e=>{e.preventDefault();select(asset.id);setMenu({id:asset.id,x:Math.max(0,Math.min(e.clientX,window.innerWidth-270)),y:Math.max(0,Math.min(e.clientY,window.innerHeight-210))});}}
        onDragStart={event => event.dataTransfer.setData('application/x-studio-asset', asset.id)} title={`${asset.name} · ${asset.width} × ${asset.height}\nKéo vào canvas; double-click để thêm`}
        onDoubleClick={() => {const scene = getScene(useEditor.getState().project); useEditor.getState().addImage(asset.id, scene.width/2 - asset.width/2, scene.height/2 - asset.height/2);}}>
        <div className="asset-thumb"><img src={assetUrl(asset.path)} alt={asset.name}/><button className="preview-button" onClick={() => setPreview(asset.path)} title="Xem trước">↗</button></div>
        <span>{asset.name}</span><small>{asset.width} × {asset.height}</small>
      </div>)}</div> : <div className="empty-state"><Images size={32}/><strong>{assets.length ? 'Không tìm thấy ảnh' : 'Thêm những hình ảnh đầu tiên'}</strong><p>PNG, JPG hoặc WebP.<br/>Ảnh trong suốt được giữ nguyên.</p></div>}
    </div>
    <div className="panel-foot">Kéo ảnh vào Canvas để tạo Layer</div>
    {menu&&createPortal(<div role="menu" aria-label="Asset Library menu" className="timeline-context-menu" style={{left:menu.x,top:menu.y,width:260}} onPointerDown={e=>e.stopPropagation()}>
      <button role="menuitem" onClick={()=>{setProperties(menu.id);setMenu(null);}}>Properties · Thông tin ảnh</button>
      <button role="menuitem" disabled={busy} onClick={()=>{const a=assets.find(a=>a.id===menu.id)!;const s=getScene(useEditor.getState().project);useEditor.getState().addImage(a.id,s.width/2,s.height/2);setMenu(null);}}>Thêm vào Canvas</button>
      <button role="menuitem" onClick={()=>{select(menu.id);copyWorkspace();setMenu(null);}}>Copy ảnh · Ctrl+C</button>
      <button role="menuitem" disabled={busy} onClick={()=>remove(menu.id)}>Xóa ảnh khỏi project{usage(menu.id).layers+usage(menu.id).poses>0?' và layer/pose đang dùng':''}</button>
      <small>Xóa trong project; Undo khôi phục. File ảnh gốc trên máy được giữ nguyên.</small>
    </div>,document.body)}
    {asset&&<div className="modal-overlay" onClick={()=>setProperties(null)}><div className="project-dialog" role="dialog" aria-label="Asset Properties" onClick={e=>e.stopPropagation()}>
      <div className="dialog-heading"><h2>Properties · Thông tin ảnh</h2><button onClick={()=>setProperties(null)}>Đóng</button></div>
      <img className="asset-properties-preview" src={assetUrl(asset.path)} alt={asset.name}/>
      <label className="field"><span>Tên ảnh</span><input aria-label="Asset Name" defaultValue={asset.name} key={asset.name} maxLength={250} onBlur={e=>{if(e.target.value.trim())rename(asset.id,{name:e.target.value.trim()});}} onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur();}}/></label>
      <label className="field"><span>Thư mục trong Library</span><input aria-label="Asset Folder" defaultValue={asset.folder} key={asset.folder} maxLength={500} onBlur={e=>rename(asset.id,{folder:e.target.value.trim()})}/></label>
      <p>{asset.width} × {asset.height} · {asset.mime}<br/>{usage(asset.id).layers} Layer và {usage(asset.id).poses} Pose đang dùng.</p>
      <small className="muted">Tên/thư mục chỉ đổi trong Library. Xóa ảnh sẽ bỏ các Layer và pose dùng ảnh đó; Child còn lại được tháo binding. Có thể Undo.</small>
      <div className="dialog-actions"><button disabled={busy} onClick={()=>remove(asset.id)}>Xóa ảnh khỏi project</button></div>
    </div></div>}
    {preview && <div className="modal-overlay" onClick={() => setPreview(undefined)}><div className="image-preview"><img src={assetUrl(preview)} alt="Xem trước ảnh"/><button onClick={() => setPreview(undefined)}>Đóng</button></div></div>}
  </section>;
}
