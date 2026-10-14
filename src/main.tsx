import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './ui/App';
import './styles.css';
import { useEditor } from './store/editorStore';
import { assetBlobs } from './assets/assetManager';
import { saveRecovery } from './recovery/recoveryDatabase';

class ErrorBoundary extends React.Component<React.PropsWithChildren, {error: string}> {
  state = {error: ''};
  static getDerivedStateFromError(error: Error) {return {error: error.message};}
  componentDidCatch(){const s=useEditor.getState();try{const drafts={...s.drafts};if(s.codeDirty)drafts[s.project.activeSceneId]={code:s.code,stale:s.codeStale};void saveRecovery({id:s.project.id,project:s.project,updatedAt:Date.now(),assets:assetBlobs(s.project.assets),drafts}).catch(()=>undefined);}catch{/* Saved project remains available if emergency recovery storage is unavailable. */}}
  render() { return this.state.error ? <div className="fatal"><h2>Editor gặp lỗi hiển thị</h2><p>{this.state.error}</p><p>Ứng dụng đã thử tạo bản khôi phục. Sau khi mở lại, chọn bản tự lưu nếu có. Project đã Save vẫn ở thư mục của bạn.</p><button onClick={()=>this.setState({error:''})}>Mở lại editor</button><button onClick={()=>window.location.reload()}>Tải lại trang</button></div> : this.props.children; }
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><ErrorBoundary><App/></ErrorBoundary></React.StrictMode>);
