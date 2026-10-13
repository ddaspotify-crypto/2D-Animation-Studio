import type { Scene } from '../../shared/model.js';
import { getScene } from '../../shared/model.js';
import { useEditor } from '../store/editorStore';

export function editAdvanced(edit:(scene:Scene)=>Scene) {
  const state=useEditor.getState();
  try {state.commit({...state.project,scenes:[edit(getScene(state.project))]});useEditor.setState({animationError:''});}
  catch(error){useEditor.setState({animationError:error instanceof Error?error.message:'Dữ liệu Phase 3 không hợp lệ.'});}
}
