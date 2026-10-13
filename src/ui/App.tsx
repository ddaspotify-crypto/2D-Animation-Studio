import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Aperture, FilePlus2, FolderOpen, Save, SaveAll, Undo2, Redo2, Code2, Loader2, Check, X } from 'lucide-react';
import { createProject, validateProject, type Project } from '../../shared/model.js';
import { useEditor } from '../store/editorStore';
import { assetUploads, clearAssets, fetchAssets, importImages, registerAsset } from '../assets/assetManager';
import AssetLibrary from './AssetLibrary';
import LayersPanel from './LayersPanel';
import ResizablePropertiesPanel from './ResizablePropertiesPanel';
import CanvasEditor from './CanvasEditor';
import Timeline from './Timeline';
import PlaybackControls from './PlaybackControls';
import { usePlayback } from '../store/playbackStore';
import { useTimeline } from '../store/timelineStore';
const CodePanel = lazy(() => import('./CodePanel'));

interface ProjectList {root: string; projects: string[]; nativePicker?: boolean; changed?: boolean}
async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const result = await response.json() as T & {error?: string};
  if (!response.ok) throw new Error(result.error ?? `Lỗi API ${response.status}`);
  return result;
}
export default function App() {
  const project = useEditor(s => s.project), revision = useEditor(s => s.revision), savedRevision = useEditor(s => s.savedRevision);
  const codeDirty = useEditor(s => s.codeDirty), location = useEditor(s => s.location);
  const animationError = useEditor(s => s.animationError);
  const canUndo = useEditor(s => !!s.past.length), canRedo = useEditor(s => !!s.future.length);
  const [showCode, setShowCode] = useState(true), [placement, setPlacement] = useState<'bottom' | 'right'>('bottom');
  const [busy, setBusy] = useState(false), [status, setStatus] = useState('Sẵn sàng'), [error, setError] = useState('');
  const [dialog, setDialog] = useState<'save' | 'saveAs' | 'open' | null>(null);
  const [list, setList] = useState<ProjectList>({root: '', projects: []});
  const [folderName, setFolderName] = useState('');
  const [chosen, setChosen] = useState('');
  const dirty = revision !== savedRevision;
  const refreshList = useCallback(async () => {
    try {setList(await api<ProjectList>('/api/projects'));}
    catch (error) {setError(`Không kết nối được backend local. ${error instanceof Error ? error.message : ''}`);}
  }, []);
  useEffect(() => {void refreshList();}, [refreshList]);
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {if (dirty || codeDirty) {event.preventDefault(); event.returnValue = '';}};
    window.addEventListener('beforeunload', beforeUnload); return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [dirty, codeDirty]);
  const safeToReplace = () => !(dirty || codeDirty) || window.confirm('Project hoặc code có thay đổi chưa lưu. Tiếp tục sẽ bỏ các thay đổi này.');
  const save = useCallback(async (name: string, saveAs: boolean) => {
    if (busy) return;
    setBusy(true); setError(''); setStatus('Đang lưu project…');
    const snapshot = useEditor.getState();
    try {
      const assets = await assetUploads(snapshot.project.assets);
      await api('/api/projects', {method: 'POST', headers: {'Content-Type': 'application/json', 'X-Studio-Request': '1'}, body: JSON.stringify({name, project: snapshot.project, assets, saveAs})});
      useEditor.getState().markSaved(snapshot.revision, name);
      setDialog(null); setStatus(`Đã lưu: ${name}/project.json${snapshot.codeDirty ? ' · Code chưa Apply không được lưu' : ''}`);
      await refreshList();
    } catch (error) {setError(error instanceof Error ? error.message : 'Không lưu được project.'); setStatus('Lưu thất bại');}
    finally {setBusy(false);}
  }, [busy, refreshList]);
  const requestSave = useCallback((saveAs = false) => {
    if (busy) return;
    if (location && !saveAs) void save(location, false);
    else {setFolderName(project.name === 'Untitled Project' ? 'My Animation' : project.name.replace(/[^\p{L}\p{N}_ -]/gu, '')); setDialog(saveAs ? 'saveAs' : 'save'); void refreshList();}
  }, [busy, location, project.name, refreshList, save]);
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      const target = event.target;
      const typing = target instanceof HTMLElement && (target.closest('input,textarea,select,[contenteditable="true"],.monaco-editor') !== null);
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {event.preventDefault(); requestSave(); return;}
      if (typing || dialog || busy) return;
      const state = useEditor.getState(), key = event.key.toLowerCase();
      if (event.code === 'Space') {event.preventDefault(); const playback = usePlayback.getState(); if (playback.playing) playback.pause(); else playback.play();}
      if (event.ctrlKey || event.metaKey) {
        if (key === 'z') {event.preventDefault(); if (event.shiftKey) state.redo(); else state.undo();}
        if (key === 'y') {event.preventDefault(); state.redo();}
        if (key === 'd') {event.preventDefault(); state.duplicate();}
      }
      if (event.key === 'Delete') {event.preventDefault(); const selection = useTimeline.getState(); if (selection.animationId && selection.frameId && target instanceof HTMLElement && target.closest('.timeline-panel')) state.removeKeyframe(selection.animationId, selection.frameId); else state.deleteSelected();}
      if (event.key === 'Escape') state.select();
    };
    window.addEventListener('keydown', shortcut); return () => window.removeEventListener('keydown', shortcut);
  }, [dialog, busy, requestSave]);
  async function importFiles(files: File[], point?: {x: number; y: number}) {
    if (busy || !files.length) return;
    setBusy(true); setError('');
    try {
      const imported = await importImages(files, count => setStatus(`Import ${count}/${files.length}…`));
      useEditor.getState().addAssets(imported.assets);
      if (point) imported.assets.forEach((asset, i) => {
        const actual = useEditor.getState().project.assets.find(a => a.path === asset.path);
        if (actual) useEditor.getState().addImage(actual.id, point.x + i*25, point.y + i*25);
      });
      setStatus(`Đã import ${imported.assets.length} ảnh · ${imported.errors.length} lỗi`);
      if (imported.errors.length) setError(imported.errors.join('\n'));
    } catch (error) {setError(error instanceof Error ? error.message : 'Lỗi import.');}
    finally {setBusy(false);}
  }
  async function openProject() {
    if (busy || !chosen || !safeToReplace()) return;
    setBusy(true); setError(''); setStatus('Đang mở project…');
    try {
      const incoming: Project = validateProject(await api(`/api/projects/${encodeURIComponent(chosen)}`));
      const assets = await fetchAssets(incoming.assets, chosen);
      clearAssets(); assets.forEach(({asset, blob}) => registerAsset(asset.path, blob));
      useEditor.getState().replace(incoming, chosen);
      setDialog(null); setStatus(`Đã mở ${chosen}`);
    } catch (error) {setError(error instanceof Error ? error.message : 'Không mở được project.'); setStatus('Mở thất bại');}
    finally {setBusy(false);}
  }
  async function chooseRoot() {
    setBusy(true); setError(''); setStatus('Chọn thư mục trong hộp thoại Windows…');
    try {
      const result = await api<ProjectList>('/api/choose-directory', {method: 'POST', headers: {'X-Studio-Request': '1'}});
      setList(result); setChosen('');
      if (result.changed && result.root !== list.root) useEditor.setState({location: null, savedRevision: -1});
      setStatus('Sẵn sàng');
    } catch (error) {setError(error instanceof Error ? error.message : 'Không chọn được thư mục.');}
    finally {setBusy(false);}
  }
  return <div className="studio">
    <header className="topbar">
      <div className="brand"><div className="brand-icon"><Aperture size={23}/></div><div><strong>2D Animation Studio</strong><small>ANIMATION FOUNDATION <b>PHASE 2</b></small></div></div>
      <div className="top-actions">
        <button disabled={busy} title="New Project" onClick={() => {if (safeToReplace()) {clearAssets(); useEditor.getState().replace(createProject()); setError(''); setStatus('Project mới');}}}><FilePlus2 size={16}/><span>New</span></button>
        <button disabled={busy} title="Open Project" onClick={() => {setChosen(''); setDialog('open'); void refreshList();}}><FolderOpen size={16}/><span>Open</span></button>
        <button disabled={busy} title="Save · Ctrl+S" onClick={() => requestSave()}><Save size={16}/><span>Save</span></button>
        <button disabled={busy} title="Save As" onClick={() => requestSave(true)}><SaveAll size={16}/><span>Save As</span></button>
        <span className="divider"/><button title="Undo · Ctrl+Z" disabled={!canUndo || busy} onClick={() => useEditor.getState().undo()}><Undo2 size={17}/></button><button title="Redo · Ctrl+Y" disabled={!canRedo || busy} onClick={() => useEditor.getState().redo()}><Redo2 size={17}/></button>
      </div>
      <PlaybackControls/>
      <div className="project-title"><input aria-label="Project Name" key={project.id + project.name} defaultValue={project.name} maxLength={250} onBlur={event => {const name = event.target.value.trim(); if (name) useEditor.getState().commit({...useEditor.getState().project, name});}} onKeyDown={event => {if (event.key === 'Enter') event.currentTarget.blur();}}/><span title={dirty ? 'Chưa lưu' : 'Đã lưu'} className={dirty ? 'unsaved-dot' : 'saved-dot'}/></div>
      <button className={showCode ? 'code-toggle active' : 'code-toggle'} title="Show / Hide Code" onClick={() => setShowCode(!showCode)}><Code2 size={17}/>Code</button>
    </header>
    {error && <div role="alert" className="error-banner"><span>{error}</span><button title="Đóng thông báo" onClick={() => setError('')}><X size={16}/></button></div>}
    {animationError && <div role="alert" className="error-banner"><span>{animationError}</span><button title="Đóng lỗi animation" onClick={() => useEditor.setState({animationError: ''})}><X size={16}/></button></div>}
    <main className="editor-layout">
      <aside className="left-sidebar"><AssetLibrary busy={busy} onImport={files => void importFiles(files)}/><LayersPanel/></aside>
      <div className="center-area"><div className={`editing-area ${showCode && placement === 'right' ? 'code-right' : ''}`}>
        <CanvasEditor busy={busy} onDropFiles={(files, point) => void importFiles(files, point)}/>
        {showCode && <Suspense fallback={<div className="code-panel bottom empty-state">Đang tải Code Editor…</div>}><CodePanel onClose={() => setShowCode(false)} placement={placement} setPlacement={setPlacement}/></Suspense>}
      </div><Timeline/></div>
      <ResizablePropertiesPanel/>
    </main>
    <footer className="statusbar"><span>{busy ? <Loader2 size={12} className="spin"/> : <Check size={12}/>} {status}</span><span>Local workspace · {project.assets.length} assets · {dirty ? 'Có thay đổi chưa lưu' : 'Đã lưu'}</span></footer>
    {dialog && <div className="modal-overlay"><div className="project-dialog" role="dialog" aria-modal="true" aria-label={dialog === 'open' ? 'Open Project' : 'Save Project'}>
      <div className="dialog-heading"><h2>{dialog === 'open' ? 'Open Project' : dialog === 'saveAs' ? 'Save Project As' : 'Save Project'}</h2><button disabled={busy} onClick={() => setDialog(null)} title="Đóng"><X size={18}/></button></div>
      <p>Thư mục lưu trữ local:</p><code className="root-path">{list.root || 'Đang lấy thư mục…'}</code>
      {list.nativePicker && <button disabled={busy} onClick={() => void chooseRoot()}><FolderOpen size={15}/>Chọn vị trí khác…</button>}
      {dialog === 'open' ? <><p>Chọn project đã lưu:</p><div className="project-list">{list.projects.length ? list.projects.map(name => <button key={name} className={chosen === name ? 'selected' : ''} onClick={() => setChosen(name)}><FolderOpen size={16}/>{name}</button>) : <p className="muted">Chưa có project. Hãy Save project đầu tiên.</p>}</div></> : <>
        <label className="field"><span>Tên thư mục project</span><input aria-label="Tên thư mục project" autoFocus value={folderName} onChange={event => setFolderName(event.target.value)}/></label><p className="muted">Ảnh được chép vào assets/. JSON chỉ dùng đường dẫn tương đối. Save As cần tên thư mục mới.</p>
        {codeDirty && <p className="draft-note">Code chưa Apply không được lưu. Project lưu trạng thái Canvas hiện tại.</p>}
      </>}
      <div className="dialog-actions"><button disabled={busy} onClick={() => setDialog(null)}>Cancel</button><button className="primary" disabled={busy || (dialog === 'open' ? !chosen : !folderName.trim())} onClick={() => dialog === 'open' ? void openProject() : void save(folderName.trim(), dialog === 'saveAs' || !location)}>{busy ? 'Đang xử lý…' : dialog === 'open' ? 'Open' : 'Save'}</button></div>
    </div></div>}
  </div>;
}
