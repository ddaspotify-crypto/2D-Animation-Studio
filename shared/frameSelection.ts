import type { Scene } from './model.js';
import type { FrameReference } from './frameClipboard.js';
export function updateFrameSelection(scene:Scene,previous:FrameReference[],current:FrameReference,mode:'single'|'range'|'toggle'){
 const frame=(r:FrameReference)=>scene.layers.find(l=>l.id===r.layerId)?.codeFrames?.find(f=>f.id===r.frameId);
 const key=(r:FrameReference)=>{const f=frame(r);return f?.batchId??f?.id;};
 const target=frame(current);if(!target)return previous;
 if(mode==='single')return [current];
 if(mode==='toggle')return previous.some(r=>key(r)===key(current))?previous.filter(r=>key(r)!==key(current)):[...previous,current];
 const anchor=previous[0],source=anchor&&frame(anchor),onTrack=source&&(anchor.layerId===current.layerId?source:scene.layers.find(l=>l.id===current.layerId)?.codeFrames?.find(f=>!!source.batchId&&f.batchId===source.batchId));
 const range=onTrack?(scene.layers.find(l=>l.id===current.layerId)?.codeFrames??[]).filter(f=>f.startFrame>=Math.min(onTrack.startFrame,target.startFrame)&&f.startFrame<=Math.max(onTrack.startFrame,target.startFrame)).map(f=>({layerId:current.layerId,frameId:f.id})):[current];
 const refs=[...previous];for(const ref of range)if(!refs.some(r=>key(r)===key(ref)))refs.push(ref);return refs;
}
