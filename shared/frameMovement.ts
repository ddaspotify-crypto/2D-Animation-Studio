import type { Scene } from './model.js';
import type { FrameReference } from './frameClipboard.js';

export function frameMoveBounds(scene:Scene,refs:FrameReference[]){
 const ids=new Set<string>(),batches=new Set<string>();
 for(const ref of refs){const frame=scene.layers.find(l=>l.id===ref.layerId)?.codeFrames?.find(f=>f.id===ref.frameId);if(!frame)throw Error('Frame được chọn không còn tồn tại.');ids.add(frame.id);if(frame.batchId)batches.add(frame.batchId);}
 const frames=scene.layers.flatMap(layer=>(layer.codeFrames??[]).filter(f=>ids.has(f.id)||!!f.batchId&&batches.has(f.batchId)).map(frame=>({layer,frame})));
 if(!frames.length)throw Error('Chọn frame trước khi kéo.');
 if(frames.some(f=>f.layer.locked))throw Error('Mở khóa tất cả Layer thuộc các frame đang chọn trước khi kéo.');
 return {ids:frames.map(f=>f.frame.id),minDelta:-Math.min(...frames.map(f=>f.frame.startFrame)),maxDelta:Math.ceil(scene.duration*scene.fps-1e-9)-Math.max(...frames.map(f=>f.frame.startFrame+f.frame.holdFrames))};
}
/** One atomic transaction: keep clip IDs, lengths, poses and spacing intact. */
export function moveFrameSelection(scene:Scene,refs:FrameReference[],requestedDelta:number){
 if(!Number.isInteger(requestedDelta))throw Error('Vị trí kéo phải nằm trên mốc frame.');
 const bounds=frameMoveBounds(scene,refs),delta=Math.max(bounds.minDelta,Math.min(bounds.maxDelta,requestedDelta))||0,ids=new Set(bounds.ids);
 if(!delta)return {scene,delta};
 const layers=scene.layers.map(layer=>{if(!layer.codeFrames?.some(f=>ids.has(f.id)))return layer;
  const frames=layer.codeFrames.map(f=>ids.has(f.id)?{...f,startFrame:f.startFrame+delta}:f).sort((a,b)=>a.startFrame-b.startFrame);
  let end=0;for(const f of frames){if(f.startFrame<end)throw Error('Các frame mới chồng lên frame khác. Hãy kéo tới khoảng trống đủ dài.');end=f.startFrame+f.holdFrames;}
  return {...layer,codeFrames:frames};
 });
 return {scene:{...scene,layers},delta};
}
