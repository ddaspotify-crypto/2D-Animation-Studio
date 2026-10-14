import { describe,it,expect } from 'vitest';
import { createProject,getScene,type Layer } from '../shared/model.js';
import { updateFrameSelection } from '../shared/frameSelection.js';
function fixture(){const scene=getScene(createProject()),layer:Layer={id:'body',name:'Body',assetId:'image',visible:true,locked:false,opacity:1,transform:{x:0,y:0,width:100,height:100,scaleX:1,scaleY:1,rotation:0,anchorX:0,anchorY:0},codeFrames:[0,1,2].map(n=>({id:`body-${n}`,batchId:`batch-${n}`,startFrame:n,holdFrames:1,transition:'interpolate',code:'frame.rotate(0);'}))};scene.layers=[layer,{...structuredClone(layer),id:'sword',codeFrames:layer.codeFrames!.map(f=>({...f,id:f.id.replace('body','sword')}))}];return scene;}
const ref=(n:number,layerId='body')=>({layerId,frameId:`${layerId}-${n}`});
describe('Frame click modifiers',()=>{
 it('Ctrl selects separate frames without selecting the middle',()=>{const s=fixture(),first=updateFrameSelection(s,[],ref(0),'single');expect(updateFrameSelection(s,first,ref(2),'toggle')).toEqual([ref(0),ref(2)]);});
 it('Ctrl deselects an already selected frame',()=>{expect(updateFrameSelection(fixture(),[ref(0),ref(2)],ref(2),'toggle')).toEqual([ref(0)]);});
 it('Ctrl on another member toggles the whole group pose once',()=>{expect(updateFrameSelection(fixture(),[ref(0),ref(2)],ref(2,'sword'),'toggle')).toEqual([ref(0)]);});
 it('Ctrl can clear the last selected frame',()=>{expect(updateFrameSelection(fixture(),[ref(0)],ref(0),'toggle')).toEqual([]);});
 it('Shift selects the range including intermediate poses',()=>{expect(updateFrameSelection(fixture(),[ref(0)],ref(2),'range')).toEqual([ref(0),ref(1),ref(2)]);});
 it('Shift resolves the range across members of the same group',()=>{const refs=updateFrameSelection(fixture(),[ref(0)],ref(2,'sword'),'range');expect(refs).toEqual([ref(0),ref(1,'sword'),ref(2,'sword')]);expect(updateFrameSelection(fixture(),refs,ref(1),'single')).toEqual([ref(1)]);});
});
