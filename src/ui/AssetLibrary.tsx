import { useRef, useState } from 'react';
import { FolderOpen, ImagePlus, Search, Images } from 'lucide-react';
import { assetUrl } from '../assets/assetManager';
import { getScene } from '../../shared/model.js';
import { useEditor } from '../store/editorStore';

export default function AssetLibrary({busy, onImport}: {busy: boolean; onImport: (files: File[]) => void}) {
  const assets = useEditor(s => s.project.assets);
  const [search, setSearch] = useState(''), [folder, setFolder] = useState('');
  const [preview, setPreview] = useState<string>();
  const files = useRef<HTMLInputElement>(null), directory = useRef<HTMLInputElement>(null);
  const folders = [...new Set(assets.map(a => a.folder).filter(Boolean))];
  const filtered = assets.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) && (!folder || a.folder === folder));
  return <section className="asset-panel">
    <div className="panel-heading"><Images size={16}/><h2>Asset Library</h2><span className="count">{assets.length}</span></div>
    <div className="import-actions"><button disabled={busy} onClick={() => files.current?.click()}><ImagePlus size={14}/>Import ảnh</button><button title="Import thư mục và thư mục con" disabled={busy} onClick={() => directory.current?.click()}><FolderOpen size={15}/></button></div>
    <input ref={files} hidden type="file" multiple accept="image/png,image/jpeg,image/webp" onChange={event => {onImport([...event.target.files ?? []]); event.target.value = '';}}/>
    <input ref={directory} hidden type="file" multiple {...{webkitdirectory: '', directory: ''}} onChange={event => {onImport([...event.target.files ?? []].filter(f => /\.(png|jpe?g|webp)$/i.test(f.name))); event.target.value = '';}}/>
    <label className="search"><Search size={14}/><input placeholder="Tìm tên ảnh…" value={search} onChange={event => setSearch(event.target.value)}/></label>
    {folders.length > 0 && <select aria-label="Lọc thư mục" value={folder} onChange={event => setFolder(event.target.value)}><option value="">Tất cả thư mục</option>{folders.map(f => <option key={f}>{f}</option>)}</select>}
    <div className="assets-scroll">
      {filtered.length ? <div className="asset-grid">{filtered.map(asset => <div className="asset-card" key={asset.id} draggable={!busy}
        onDragStart={event => event.dataTransfer.setData('application/x-studio-asset', asset.id)} title={`${asset.name} · ${asset.width} × ${asset.height}\nKéo vào canvas; double-click để thêm`}
        onDoubleClick={() => {const scene = getScene(useEditor.getState().project); useEditor.getState().addImage(asset.id, scene.width/2 - asset.width/2, scene.height/2 - asset.height/2);}}>
        <div className="asset-thumb"><img src={assetUrl(asset.path)} alt={asset.name}/><button className="preview-button" onClick={() => setPreview(asset.path)} title="Xem trước">↗</button></div>
        <span>{asset.name}</span><small>{asset.width} × {asset.height}</small>
      </div>)}</div> : <div className="empty-state"><Images size={32}/><strong>{assets.length ? 'Không tìm thấy ảnh' : 'Thêm những hình ảnh đầu tiên'}</strong><p>PNG, JPG hoặc WebP.<br/>Ảnh trong suốt được giữ nguyên.</p></div>}
    </div>
    <div className="panel-foot">Kéo ảnh vào Canvas để tạo Layer</div>
    {preview && <div className="modal-overlay" onClick={() => setPreview(undefined)}><div className="image-preview"><img src={assetUrl(preview)} alt="Xem trước ảnh"/><button onClick={() => setPreview(undefined)}>Đóng</button></div></div>}
  </section>;
}
