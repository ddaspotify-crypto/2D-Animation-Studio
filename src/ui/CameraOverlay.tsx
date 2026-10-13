import { Rect,Text,Circle } from 'react-konva';
import { getScene } from '../../shared/model.js';
import { evaluateSceneAtTime } from '../../shared/animationEngine.js';
import { cameraFrame } from '../../shared/cameraEngine.js';
import { useEditor } from '../store/editorStore';
import { usePlayback } from '../store/playbackStore';
import { useCameraView } from '../store/cameraViewStore';
import { changeCamera } from '../camera/actions';
export default function CameraOverlay({zoom}:{zoom:number}){
 const scene=useEditor(s=>getScene(s.project)),time=usePlayback(s=>s.time),edit=useCameraView(s=>s.edit),camera=evaluateSceneAtTime(scene,time).camera,frame=cameraFrame(scene,camera),r=camera.rotation*Math.PI/180,c=Math.cos(r),s=Math.sin(r),dx=frame.width/2,dy=frame.height/2;
 const corner={x:camera.x+c*dx-s*dy,y:camera.y+s*dx+c*dy},top={x:camera.x-c*dx+s*dy,y:camera.y-s*dx-c*dy};
 return <><Rect x={camera.x} y={camera.y} offsetX={dx} offsetY={dy} rotation={camera.rotation} width={frame.width} height={frame.height} stroke="#ffc66f" strokeWidth={2/zoom} dash={[10/zoom,5/zoom]} draggable={edit} listening={edit} onDragStart={()=>usePlayback.getState().pause()} onDragEnd={e=>changeCamera({x:e.target.x(),y:e.target.y()})}/><Text x={top.x+8/zoom} y={top.y+8/zoom} rotation={camera.rotation} text="OUTPUT CAMERA" fill="#d09d3a" fontSize={11/zoom} listening={false}/>{edit&&<Circle x={corner.x} y={corner.y} radius={6/zoom} fill="#ffc66f" draggable onDragStart={()=>usePlayback.getState().pause()} onDragEnd={e=>{const x=e.target.x()-camera.x,y=e.target.y()-camera.y,radius=Math.max(.001,Math.abs(c*x+s*y),Math.abs(-s*x+c*y)*scene.width/scene.height);changeCamera({zoom:Math.max(.01,Math.min(100,scene.width/(2*radius)))});}}/>}</>;
}
