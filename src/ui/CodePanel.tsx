import { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor/editor/editor.api';
import * as typescript from 'monaco-editor/languages/features/typescript/register';
import 'monaco-editor/languages/definitions/javascript/register';
import 'monaco-editor/editor/contrib/format/browser/formatActions';
import 'monaco-editor/editor/contrib/suggest/browser/suggestController';
import 'monaco-editor/editor/contrib/hover/browser/hoverContribution';
import 'monaco-editor/editor/contrib/clipboard/browser/clipboard';
import 'monaco-editor/editor/contrib/find/browser/findController';
import EditorWorker from 'monaco-editor/editor/editor.worker?worker';
import TypeScriptWorker from 'monaco-editor/language/typescript/ts.worker?worker';
import { Code2, Play, RotateCcw, Wand2, RefreshCw, X, PanelBottom, PanelRight } from 'lucide-react';
import { useEditor } from '../store/editorStore';
import { parseSceneCode } from '../code/sceneCode';
import HelpTip from './HelpTip';
import { animationHelp } from './animationHelp';

self.MonacoEnvironment = {getWorker(_moduleId, label) {return label === 'javascript' || label === 'typescript' ? new TypeScriptWorker() : new EditorWorker();}};
typescript.javascriptDefaults.setDiagnosticsOptions({noSemanticValidation: false, noSyntaxValidation: false});
typescript.javascriptDefaults.addExtraLib(`
interface SceneOptions {groups?:{id:string;name:string}[];id?: string; name?: string; width: number; height: number; fps: number; duration: number; background?: string}
interface DrawingOptions {width:number;height:number;paths:{id:string;name:string;fill:string;opacity:number;contours:{id:string;points:{id:string;x:number;y:number;in?:{x:number;y:number};out?:{x:number;y:number}}[]}[]}[]}
interface CodeFrameOptions {id:string;startFrame:number;holdFrames:number;transition:'hold'|'interpolate';code:string}
interface ImageOptions {drawing?:DrawingOptions;codeFrames?:CodeFrameOptions[];id: string; asset: string; name?: string; x?: number; y?: number; width?: number; height?: number; scale?: number; scaleX?: number; scaleY?: number; rotation?: number; opacity?: number; visible?: boolean; locked?: boolean; anchorX?: number; anchorY?: number; zIndex?: number; flipX?: boolean; flipY?: boolean}
interface KeyframeOptions {id?: string; time: number; easing?: 'linear'|'easeIn'|'easeOut'|'easeInOut'; x?: number; y?: number; scaleX?: number; scaleY?: number; rotation?: number; opacity?: number;zOrder?:number}
interface AnimationOptions {id?: string; property: 'position'|'scale'|'rotation'|'opacity'|'zOrder'; startTime?: number; duration?: number; easing?: 'linear'|'easeIn'|'easeOut'|'easeInOut'; loop?: 'none'|'repeat'|'pingPong'; keyframes: KeyframeOptions[]}
interface PathPoint {x:number;y:number;in?:{x:number;y:number};out?:{x:number;y:number}}
interface MotionPathOptions {id:string;type:'line'|'polyline'|'bezier'|'circle'|'ellipse'|'freehand';points:PathPoint[];followPoint?:{x:number;y:number};startTime:number;duration:number;easing:'linear'|'easeIn'|'easeOut'|'easeInOut';loop:'none'|'repeat'|'pingPong';reverse:boolean;orientToPath:boolean;show:boolean}
interface PoseSetOptions {id:string;name:string;poses:{id:string;name:string;assetId:string;width:number;height:number;anchorX:number;anchorY:number}[]}
interface PoseTrackOptions {id:string;poseSetId:string;keyframes:{id:string;time:number;poseId:string}[]}
interface BindingOptions {parentId:string;mode:'position'|'transform';attachmentId?:string}
interface CameraOptions {x:number;y:number;zoom:number;rotation?:number}
interface CameraTrackOptions {id:string;property:"position"|"zoom"|"rotation";startTime:number;duration:number;easing:"linear"|"easeIn"|"easeOut"|"easeInOut";loop:"none"|"repeat"|"pingPong";keyframes:{id:string;time:number;x?:number;y?:number;zoom?:number;rotation?:number;easing?:"linear"|"easeIn"|"easeOut"|"easeInOut"}[]}
interface GroupOptions {id:string;name:string;layerIds:string[]}
declare function createScene(options: SceneOptions): {addVector(options:ImageOptions & {drawing:DrawingOptions}):void;addImage(options: ImageOptions & {attachments?:{id:string;name:string;x:number;y:number}[];skewX?:number}): void; animate(layerId: string, options: AnimationOptions): void;motionPath(layerId:string,options:MotionPathOptions):void;poseSet(options:PoseSetOptions):void;poseTrack(layerId:string,options:PoseTrackOptions):void;bind(layerId:string,options:BindingOptions):void;group(options:GroupOptions):void;camera(options:CameraOptions):void;cameraAnimate(options:CameraTrackOptions):void};
`, 'studio-api.d.ts');

export default function CodePanel({onClose, placement, setPlacement}: {onClose: () => void; placement: 'bottom' | 'right'; setPlacement: (placement: 'bottom' | 'right') => void}) {
  const code = useEditor(s => s.code), dirty = useEditor(s => s.codeDirty), stale = useEditor(s => s.codeStale), error = useEditor(s => s.codeError);
  const container = useRef<HTMLDivElement>(null), editor = useRef<monaco.editor.IStandaloneCodeEditor | undefined>(undefined);
  useEffect(() => {
    const model = monaco.editor.createModel(useEditor.getState().code, 'javascript');
    const instance = monaco.editor.create(container.current!, {model, theme: 'vs-dark', editContext: false, fontSize: 12, fontFamily: 'Consolas, monospace', minimap: {enabled: false}, automaticLayout: true, scrollBeyondLastLine: false, tabSize: 2, padding: {top: 12}, wordWrap: 'on'});
    editor.current = instance;
    const listener = instance.onDidChangeModelContent(() => useEditor.getState().editCode(instance.getValue()));
    return () => {listener.dispose(); instance.dispose(); model.dispose(); editor.current = undefined;};
  }, []);
  useEffect(() => {
    if (editor.current && editor.current.getValue() !== code) editor.current.setValue(code);
    const timer = setTimeout(() => {
      const model = editor.current?.getModel(); if (!model) return;
      try {parseSceneCode(code, useEditor.getState().project); monaco.editor.setModelMarkers(model, 'studio', []);}
      catch (error) {
        const message = error instanceof Error ? error.message : 'Code không hợp lệ.';
        const match = message.match(/(?:Dòng |\()([0-9]+)/);
        const line = Math.max(1, Math.min(model.getLineCount(), Number(match?.[1] ?? 1)));
        monaco.editor.setModelMarkers(model, 'studio', [{severity: monaco.MarkerSeverity.Error, message, startLineNumber: line, startColumn: 1, endLineNumber: line, endColumn: model.getLineMaxColumn(line)}]);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [code]);
  function reset() {if (!dirty || window.confirm('Bỏ code chưa Apply và sinh lại từ Canvas hiện tại?')) useEditor.getState().resetCode();}
  function apply() {
    if (stale && !window.confirm('Canvas đã thay đổi sau khi bạn sửa code. Apply sẽ thay thế scene bằng bản code này. Tiếp tục?')) return;
    useEditor.getState().applyCode();
  }
  return <section className={`code-panel ${placement}`}>
    <div className="code-toolbar"><div className="code-title"><Code2 size={16}/><strong>Scene Code</strong><span className={`sync-badge ${dirty ? 'draft' : ''}`}>{stale ? 'Canvas đã đổi · Cần đồng bộ' : dirty ? 'Chưa Apply' : 'Đã đồng bộ'}</span></div>
      <div className="code-actions"><button title="Generate Code từ Canvas" onClick={reset}><RefreshCw size={13}/><span>Generate</span></button><button title="Reset Changes" disabled={!dirty} onClick={reset}><RotateCcw size={13}/></button>
        <button title="Format Code" onClick={() => void editor.current?.getAction('editor.action.formatDocument')?.run()}><Wand2 size={13}/></button>
        <button className="primary" title="Apply Code" onClick={apply}><Play size={13}/>Apply Code</button>
        <button title={placement === 'bottom' ? 'Đặt cạnh Canvas' : 'Đặt dưới Canvas'} onClick={() => setPlacement(placement === 'bottom' ? 'right' : 'bottom')}>{placement === 'bottom' ? <PanelRight size={14}/> : <PanelBottom size={14}/>}</button>
        <button title="Hide Code" onClick={onClose}><X size={14}/></button></div>
    </div>
    {error && <div role="alert" className="code-error">{error}</div>}
    <div className="monaco-host" ref={container}/>
    <div className="code-foot field-label">createScene · addImage · animate · Keyframe time tương đối với startTime <HelpTip label="Animation trong Code Editor" text={animationHelp.codeTime}/></div>
  </section>;
}
