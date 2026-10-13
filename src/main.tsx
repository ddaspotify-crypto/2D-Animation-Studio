import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './ui/App';
import './styles.css';

class ErrorBoundary extends React.Component<React.PropsWithChildren, {error: string}> {
  state = {error: ''};
  static getDerivedStateFromError(error: Error) {return {error: error.message};}
  render() { return this.state.error ? <div className="fatal">Không thể hiển thị editor: {this.state.error}<br/>Hãy tải lại trang. Project đã lưu vẫn ở thư mục projects.</div> : this.props.children; }
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><ErrorBoundary><App/></ErrorBoundary></React.StrictMode>);
