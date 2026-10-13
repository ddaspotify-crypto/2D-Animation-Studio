import { useState } from 'react';
import { Circle, Line, Text } from 'react-konva';
import { evaluateSceneAtTime } from '../../shared/animationEngine.js';
import { pathPolyline } from '../../shared/motionPaths.js';
import { bindingSpace, identity, inverse, matrixFromTransform, transformPoint } from '../../shared/transforms.js';
import { getScene, type Point, type Scene } from '../../shared/model.js';
import { usePlayback } from '../store/playbackStore';
import { usePathEditor } from '../store/pathEditorStore';
import { useEditor } from '../store/editorStore';
import { editAdvanced } from '../advanced/actions';

export default function PathOverlay({scene,layerId,zoom}:{scene:Scene;layerId:string;zoom:number}) {
  const time=usePlayback(s=>s.time),at=usePathEditor(s=>s.pointIndex),[ghost,setGhost]=useState<{index:number;point:Point;handle?:'in'|'out'}|null>(null);
  const evaluated=evaluateSceneAtTime(scene,time),layer=evaluated.layers.find(l=>l.id===layerId);if(!layer)return null;
  const path=scene.motionPaths.find(p=>p.layerId===layerId),parent=layer.binding&&evaluated.layers.find(l=>l.id===layer.binding!.parentId),space=parent&&layer.binding?bindingSpace(parent,layer.binding):identity;
  const toWorld=(p:Point)=>transformPoint(space,p),toLocal=(p:Point)=>transformPoint(inverse(space),p);
  const effective=path&&ghost?{...path,points:path.points.map((p,i)=>i===ghost.index?ghost.handle?{...p,[ghost.handle]:ghost.point}:{...p,...ghost.point,in:p.in?{x:p.in.x+ghost.point.x-p.x,y:p.in.y+ghost.point.y-p.y}:undefined,out:p.out?{x:p.out.x+ghost.point.x-p.x,y:p.out.y+ghost.point.y-p.y}:undefined}:p)}:path;
  const line=effective?pathPolyline(effective).map(toWorld).flatMap(p=>[p.x,p.y]):[];
  return <>
    {path?.show&&<AttachmentMarker follow pos={transformPoint(matrixFromTransform(layer.transform),{x:((path.followPoint?.x??layer.transform.anchorX)-layer.transform.anchorX)*layer.transform.width,y:((path.followPoint?.y??layer.transform.anchorY)-layer.transform.anchorY)*layer.transform.height})} name="Điểm bám đường · kéo vòng xanh" zoom={zoom} locked={layer.locked} onEnd={world=>{
      const t=layer.transform,local=transformPoint(inverse(matrixFromTransform(t)),world),followPoint={x:Math.max(0,Math.min(1,local.x/t.width+t.anchorX)),y:Math.max(0,Math.min(1,local.y/t.height+t.anchorY))};
      editAdvanced(s=>({...s,motionPaths:s.motionPaths.map(p=>p.id===path.id?{...p,followPoint}:p)}));
    }}/>}
    {path?.show&&<>
      <Line points={line} stroke="#6ecfe5" strokeWidth={2/zoom} dash={[8/zoom,5/zoom]} onDblClick={event=>{
        event.cancelBubble=true;if(layer.locked||['line','circle','ellipse'].includes(path.type))return;
        const pointer=event.target.getStage()?.getRelativePointerPosition();if(!pointer)return;
        const point=toLocal(pointer),points=[...path.points],before=path.points[at]??path.points[0],after=path.points[at+1]??{x:before.x+100,y:before.y},dx=(after.x-before.x)/6,dy=(after.y-before.y)/6;
        points.splice(Math.min(points.length,at+1),0,path.type==='bezier'?{...point,in:{x:point.x-dx,y:point.y-dy},out:{x:point.x+dx,y:point.y+dy}}:point);
        editAdvanced(s=>({...s,motionPaths:s.motionPaths.map(p=>p.id===path.id?{...p,points}:p)}));
      }}/>
      {effective!.points.map((point,index)=>{
        const pos=toWorld(point);
        return <Circle key={index} x={pos.x} y={pos.y} radius={5/zoom} fill={at===index?'#ffca7a':'#d7f6ff'} stroke="#2a6b82" strokeWidth={1/zoom} draggable={!layer.locked}
          onClick={e=>{e.cancelBubble=true;usePathEditor.setState({pointIndex:index});}}
          onDragMove={e=>setGhost({index,point:toLocal({x:e.target.x(),y:e.target.y()})})}
          onDragEnd={()=>{if(effective)editAdvanced(s=>({...s,motionPaths:s.motionPaths.map(p=>p.id===path.id?effective:p)}));setGhost(null);usePathEditor.setState({pointIndex:index});}}/>;
      })}
      {path.type==='bezier'&&effective!.points.flatMap((point,index)=>(['in','out'] as const).map(handle=>{
        const control=point[handle];if(!control)return null;const p=toWorld(point),h=toWorld(control);
        return <ReactHandle key={`${index}-${handle}`} p={p} h={h} zoom={zoom} locked={layer.locked}
          onMove={position=>setGhost({index,handle,point:toLocal(position)})}
          onEnd={()=>{if(effective)editAdvanced(s=>({...s,motionPaths:s.motionPaths.map(p=>p.id===path.id?effective:p)}));setGhost(null);}}/>;
      }))}
    </>}
    {(layer.attachments??[]).map(point=>{
      const t=layer.transform,m=matrixFromTransform(t),pos=transformPoint(m,{x:(point.x-t.anchorX)*t.width,y:(point.y-t.anchorY)*t.height});
      return <AttachmentMarker key={point.id} pos={pos} name={point.name} zoom={zoom} locked={layer.locked} onEnd={world=>{
        const local=transformPoint(inverse(m),world),x=Math.max(0,Math.min(1,local.x/t.width+t.anchorX)),y=Math.max(0,Math.min(1,local.y/t.height+t.anchorY));
        const state=useEditor.getState(),base=getScene(state.project).layers.find(l=>l.id===layerId)!;
        state.updateLayer(layerId,{attachments:base.attachments?.map(a=>a.id===point.id?{...a,x,y}:a)});
      }}/>;
    })}
  </>;
}
function ReactHandle({p,h,zoom,locked,onMove,onEnd}:{p:Point;h:Point;zoom:number;locked:boolean;onMove:(p:Point)=>void;onEnd:()=>void}) {
  return <><Line points={[p.x,p.y,h.x,h.y]} stroke="#dba6fa" strokeWidth={1/zoom} listening={false}/><Circle x={h.x} y={h.y} radius={4/zoom} fill="#dba6fa" draggable={!locked} onDragMove={e=>onMove({x:e.target.x(),y:e.target.y()})} onDragEnd={onEnd}/></>;
}
function AttachmentMarker({pos,name,zoom,locked,onEnd,follow=false}:{pos:Point;name:string;zoom:number;locked:boolean;onEnd:(p:Point)=>void;follow?:boolean}) {
  return <><Circle x={pos.x} y={pos.y} radius={(follow?11:6)/zoom} fill={follow?undefined:'#ffc66f'} stroke={follow?'#19ddcb':'#7a4c15'} strokeWidth={(follow?3:1)/zoom} draggable={!locked} onDragEnd={e=>onEnd({x:e.target.x(),y:e.target.y()})}/><Text x={pos.x+14/zoom} y={pos.y-(follow?30:7)/zoom} text={name} fontSize={11/zoom} fill={follow?'#19ddcb':'#ffd799'} listening={false}/></>;
}
