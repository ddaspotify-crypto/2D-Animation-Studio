import { useEffect, useRef, useState } from 'react';
import Konva from 'konva';
import { Stage, Layer as KonvaLayer, Rect, Image as KonvaImage, Transformer, Line } from 'react-konva';
import { Maximize, Minus, Plus, Grid2X2, Hand, MousePointer2 } from 'lucide-react';
import { getScene, type Layer } from '../../shared/model.js';
import { loadImage } from '../assets/assetManager';
import { useEditor } from '../store/editorStore';
import { usePlayback } from '../store/playbackStore';
import { evaluateSceneAtTime } from '../../shared/animationEngine.js';
import PathOverlay from './PathOverlay';
import { usePathEditor } from '../store/pathEditorStore';
import { simplifyFreehand } from '../../shared/motionPaths.js';
import { bindingSpace, identity, inverse, transformPoint } from '../../shared/transforms.js';
import { editAdvanced } from '../advanced/actions';
import type { Point } from '../../shared/model.js';
import { useCameraView } from '../store/cameraViewStore';
import CameraOverlay from './CameraOverlay';
import OutputCameraPreview from './OutputCameraPreview';

function ImageNode({layer,drawing}: {layer: Layer;drawing:boolean}) {
  const select = useEditor(s => s.select);
  const update = useEditor(s => s.updateLayer);
  const t = layer.transform;
  return <KonvaImage id={layer.id} image={undefined} x={t.x} y={t.y} width={t.width} height={t.height}
    scaleX={t.scaleX*(t.flipX?-1:1)} scaleY={t.scaleY*(t.flipY?-1:1)} rotation={t.rotation} offsetX={t.anchorX * t.width} offsetY={t.anchorY * t.height}
    visible={layer.visible} opacity={layer.opacity} draggable={!layer.locked&&!drawing} listening={!layer.locked&&!drawing}
    onClick={event => {event.cancelBubble = true; select(layer.id, event.evt.shiftKey);}}
    onTap={() => select(layer.id)}
    onDragStart={() => {if (!useEditor.getState().selectedIds.includes(layer.id)) select(layer.id);}}
    onDragEnd={event => {
      const state = useEditor.getState();
      const evaluated = evaluateSceneAtTime(getScene(state.project), usePlayback.getState().time).layers.find(l => l.id === layer.id)!;
      update(layer.id, {transform: {...evaluated.transform, x: event.target.x(), y: event.target.y()}});
    }}
  />;
}
export default function CanvasEditor({busy, onDropFiles}: {busy: boolean; onDropFiles: (files: File[], point: {x: number; y: number}) => void}) {
  const project = useEditor(s => s.project);
  const output=useCameraView(s=>s.output),cameraEdit=useCameraView(s=>s.edit);
  const selected = useEditor(s => s.selectedIds);
  const drawLayerId=usePathEditor(s=>s.drawLayerId);
  const drawing=useRef<Point[]>([]),[drawPreview,setDrawPreview]=useState<Point[]>([]);
  const scene = getScene(project);
  const stage = useRef<Konva.Stage>(null), transformer = useRef<Konva.Transformer>(null);
  const container = useRef<HTMLDivElement>(null);
  const editing = useRef(false);
  useEffect(()=>{if(!drawLayerId&&drawing.current.length){drawing.current=[];setDrawPreview([]);editing.current=false;usePlayback.getState().pause();}if(drawLayerId)setPan(false);},[drawLayerId]);
  const [size, setSize] = useState({width: 800, height: 600});
  const [view, setView] = useState({x: 40, y: 40, zoom: .35});
  const [grid, setGrid] = useState(false), [pan, setPan] = useState(false);
  const fit = () => {
    const zoom = Math.min((size.width - 100) / scene.width, (size.height - 100) / scene.height);
    setView({zoom: Math.max(.02, zoom), x: (size.width - scene.width * zoom) / 2, y: (size.height - scene.height * zoom) / 2});
  };
  useEffect(() => {
    const observer = new ResizeObserver(entries => {const rect = entries[0].contentRect; setSize({width: Math.max(1, rect.width), height: Math.max(1, rect.height)});});
    observer.observe(container.current!); return () => observer.disconnect();
  }, []);
  useEffect(fit, [size.width, size.height, scene.width, scene.height, project.id,scene.id]);
  useEffect(() => {
    const nodes = selected.map(id => stage.current?.findOne(`#${id}`)).filter((node): node is Konva.Node => !!node && !!scene.layers.find(l => l.id === node.id() && !l.locked && l.visible));
    transformer.current?.nodes(nodes); transformer.current?.getLayer()?.batchDraw();
  }, [selected, scene]);
  useEffect(() => {
    let active=true;
    const nodes = new Map(scene.layers.map(layer => [layer.id, stage.current?.findOne(`#${layer.id}`)]));
    const images=new Map<string,HTMLImageElement>();
    const render = () => {
      if (editing.current||output) return;
      for (const layer of evaluateSceneAtTime(scene, usePlayback.getState().time).layers) {
        const t = layer.transform;
        const node=nodes.get(layer.id);
        node?.setAttrs({x:t.x,y:t.y,width:t.width,height:t.height,offsetX:t.anchorX*t.width,offsetY:t.anchorY*t.height,skewX:t.skewX??0,scaleX:t.scaleX*(t.flipX?-1:1),scaleY:t.scaleY*(t.flipY?-1:1),rotation:t.rotation,opacity:layer.opacity,image:images.get(layer.assetId)});
        node?.moveToTop();
      }
      transformer.current?.moveToTop();transformer.current?.forceUpdate(); stage.current?.batchDraw();
    };
    render();
    Promise.all(project.assets.map(async asset=>{try{const image=await loadImage(asset.path);if(active)images.set(asset.id,image);}catch{}})).then(()=>{if(active)render();});
    const unsubscribe=usePlayback.subscribe(render);
    return ()=>{active=false;unsubscribe();};
  }, [scene, selected,project.assets,output]);
  function drawPoint():Point|null {
    const pointer=stage.current?.getRelativePointerPosition();if(!pointer||!drawLayerId)return null;
    const layers=evaluateSceneAtTime(scene,usePlayback.getState().time).layers,layer=layers.find(l=>l.id===drawLayerId),parent=layer?.binding&&layers.find(l=>l.id===layer.binding!.parentId);
    const space=parent&&layer?.binding?bindingSpace(parent,layer.binding):identity;return transformPoint(inverse(space),pointer);
  }
  function drawWorld(point:Point):Point {
    const layers=evaluateSceneAtTime(scene,usePlayback.getState().time).layers,layer=layers.find(l=>l.id===drawLayerId),parent=layer?.binding&&layers.find(l=>l.id===layer.binding!.parentId);
    return transformPoint(parent&&layer?.binding?bindingSpace(parent,layer.binding):identity,point);
  }
  function finishDraw(){
    if(!drawLayerId||!drawing.current.length)return;
    editing.current=false;let points=simplifyFreehand(drawing.current,2);
    if(points.length>=2)editAdvanced(s=>({...s,motionPaths:s.motionPaths.map(p=>p.layerId===drawLayerId?{...p,points}:p)}));
    drawing.current=[];setDrawPreview([]);usePathEditor.setState({drawLayerId:null});
  }
  function commitTransforms() {
    const current = useEditor.getState();
    const transformed = new Set(transformer.current?.nodes().map(n => n.id()));
    const activeScene = getScene(current.project);
    const effective = evaluateSceneAtTime(activeScene, usePlayback.getState().time).layers;
    const edits = effective.filter(layer => transformed.has(layer.id)).flatMap(layer => {
      const node = stage.current?.findOne(`#${layer.id}`);
      return node ? [{id: layer.id, patch: {transform: {...layer.transform, x: node.x(), y: node.y(), scaleX: Math.min(100, Math.max(.001, Math.abs(node.scaleX()))), scaleY: Math.min(100, Math.max(.001, Math.abs(node.scaleY()))), flipX:node.scaleX()<0,flipY:node.scaleY()<0,rotation: node.rotation()}}}] : [];
    });
    editing.current = false;
    current.editLayers(edits);
  }
  const zoomBy = (factor: number, point = {x: size.width / 2, y: size.height / 2}) => setView(v => {
    const zoom = Math.max(.02, Math.min(8, v.zoom * factor));
    return {zoom, x: point.x - (point.x - v.x) / v.zoom * zoom, y: point.y - (point.y - v.y) / v.zoom * zoom};
  });
  return <div className="canvas-column">
    <div className="canvas-toolbar"><span className="scene-label"><i/>{scene.name} <small>{scene.width} × {scene.height}</small></span>
      <button title="Toggle Output Camera" aria-pressed={output} onClick={()=>{usePlayback.getState().pause();useCameraView.setState({output:!output,edit:false});}}>{output?'← Editor View':'Camera Preview'}</button>
      <div className="tool-cluster">
        <button className={!pan ? 'active' : ''} title="Chọn / di chuyển" onClick={() => setPan(false)}><MousePointer2 size={15}/></button>
        <button className={pan ? 'active' : ''} title="Pan workspace" onClick={() => setPan(!pan)}><Hand size={15}/></button>
        <button className={grid ? 'active' : ''} title="Hiện lưới" onClick={() => setGrid(!grid)}><Grid2X2 size={15}/></button>
        <button title="Thu nhỏ" onClick={() => zoomBy(1/1.2)}><Minus size={15}/></button><span>{Math.round(view.zoom * 100)}%</span>
        <button title="Phóng to" onClick={() => zoomBy(1.2)}><Plus size={15}/></button><button title="Fit to Screen" onClick={fit}><Maximize size={15}/></button>
      </div>
    </div>
    <div className={`canvas-workspace ${pan ? 'panning' : ''}`} ref={container}
      onDragOver={event => {event.preventDefault(); event.dataTransfer.dropEffect = 'copy';}}
      onDrop={event => {
        event.preventDefault(); if (busy||output) return;
        const rect = container.current!.getBoundingClientRect();
        const point = {x: (event.clientX - rect.left - view.x) / view.zoom, y: (event.clientY - rect.top - view.y) / view.zoom};
        const assetId = event.dataTransfer.getData('application/x-studio-asset');
        if (assetId) useEditor.getState().addImage(assetId, point.x, point.y);
        else if (event.dataTransfer.files.length) onDropFiles([...event.dataTransfer.files], point);
      }}>
      <Stage style={{visibility:output?'hidden':'visible'}} ref={stage} width={size.width} height={size.height} x={view.x} y={view.y} scaleX={view.zoom} scaleY={view.zoom} draggable={pan&&!cameraEdit}
        onDragStart={() => {editing.current = true; usePlayback.getState().pause();}}
        onDragEnd={event => {editing.current = false; if (event.target === stage.current) setView(v => ({...v, x: event.target.x(), y: event.target.y()}));}}
        onWheel={event => {event.evt.preventDefault(); const point = stage.current?.getPointerPosition(); if (point) zoomBy(event.evt.deltaY < 0 ? 1.12 : 1/1.12, point);}}
        onMouseDown={event => {if(drawLayerId){editing.current=true;usePlayback.getState().pause();const point=drawPoint();if(point){drawing.current=[point];setDrawPreview([point]);}return;}if (event.target === stage.current || event.target.name() === 'background') useEditor.getState().select();}}
        onMouseMove={()=>{if(drawLayerId&&drawing.current.length){const point=drawPoint();if(point&&drawing.current.length<10000){drawing.current.push(point);setDrawPreview([...drawing.current]);}}}} onMouseUp={finishDraw} onMouseLeave={finishDraw}>
        <KonvaLayer listening={!pan}>
          <Rect name="background" width={scene.width} height={scene.height} fill={scene.background} shadowColor="black" shadowBlur={30} shadowOpacity={.35}/>
          {grid && Array.from({length: Math.floor(scene.width / 100)}, (_, i) => <Line key={`x${i}`} points={[(i+1)*100,0,(i+1)*100,scene.height]} stroke="#8290a0" opacity={.25} strokeWidth={1 / view.zoom} listening={false}/>)}
          {grid && Array.from({length: Math.floor(scene.height / 100)}, (_, i) => <Line key={`y${i}`} points={[0,(i+1)*100,scene.width,(i+1)*100]} stroke="#8290a0" opacity={.25} strokeWidth={1 / view.zoom} listening={false}/>)}
          {scene.layers.map(layer => <ImageNode key={layer.id} layer={layer} drawing={!!drawLayerId}/>)}
          <Transformer visible={!cameraEdit&&!output} ref={transformer} onTransformStart={() => {editing.current = true; usePlayback.getState().pause();}} onTransformEnd={commitTransforms} flipEnabled={false} rotateEnabled
            anchorSize={8} borderStroke="#8b7bff" anchorStroke="#8b7bff" anchorFill="#fff" padding={3}
            boundBoxFunc={(oldBox, newBox) => Math.abs(newBox.width) < 4 || Math.abs(newBox.height) < 4 ? oldBox : newBox}/>
        </KonvaLayer>
        <KonvaLayer listening={!pan&&!drawLayerId}>
          {!output&&selected[0]&&<PathOverlay scene={scene} layerId={selected[0]} zoom={view.zoom}/>}
          {!output&&<CameraOverlay zoom={view.zoom}/>}
          {!!drawPreview.length&&<Line points={drawPreview.map(drawWorld).flatMap(p=>[p.x,p.y])} stroke="#6ecfe5" strokeWidth={2/view.zoom} listening={false}/>}
        </KonvaLayer>
      </Stage>
      {output&&<OutputCameraPreview width={size.width} height={size.height}/>}
      {!scene.layers.length && <div className="canvas-empty"><MousePointer2 size={22}/><strong>Không gian sáng tạo của bạn</strong><span>Kéo ảnh từ thư viện hoặc từ máy vào Canvas</span></div>}
    </div>
    <div className="canvas-footer"><span>{output?'Camera Preview: khung hình đầu ra · Về Editor View để chỉnh ảnh.':drawLayerId?'Giữ chuột vẽ đường; thả để lưu. Esc hủy vẽ.':'Shift + click: chọn nhiều · Cuộn chuột: zoom · Hand: pan'}</span><span>{output?'Output Camera':'Editor View'} · {scene.fps} FPS · {scene.duration}s</span></div>
  </div>;
}
