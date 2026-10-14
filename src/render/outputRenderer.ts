import Konva from 'konva';
import type { Scene } from '../../shared/model.js';
import { evaluateSceneAtTime } from '../../shared/animationEngine.js';
import { cameraProjection } from '../../shared/cameraEngine.js';
import { vectorSceneFunc } from './drawingRenderer';
/** One output renderer for Preview and deterministic export. No editor decorations. */
export function drawOutputFrame(stage:Konva.Stage,world:Konva.Group,scene:Scene,time:number,images:Map<string,HTMLImageElement>,sx:number,sy=sx){
 const evaluated=evaluateSceneAtTime(scene,time),c=cameraProjection(scene,evaluated.camera);
 // An outer viewport scales resolution; the camera stays in original scene coordinates.
 const viewport=world.getParent() as Konva.Group;
 viewport.setAttrs({scaleX:sx,scaleY:sy});
 world.setAttrs({x:c.x,y:c.y,scaleX:c.zoom,scaleY:c.zoom,rotation:c.rotation});
 const children=world.getChildren(),nodes=new Map(children.map(n=>[n.id(),n]));
 const order=JSON.stringify(evaluated.layers.map(l=>l.id)),reorder=JSON.stringify(children.map(n=>n.id()))!==order;
 for(const l of evaluated.layers){const node=nodes.get(l.id),t=l.transform;node?.setAttrs({x:t.x,y:t.y,width:t.width,height:t.height,scaleX:t.scaleX*(t.flipX?-1:1),scaleY:t.scaleY*(t.flipY?-1:1),rotation:t.rotation,skewX:t.skewX??0,offsetX:t.anchorX*t.width,offsetY:t.anchorY*t.height,opacity:l.opacity,visible:l.visible,drawingData:l.drawing,image:images.get(l.assetId)});if(reorder)node?.moveToTop();}
 stage.draw();
}
export function createOutputRenderer(scene:Scene,width:number,height:number,images:Map<string,HTMLImageElement>){
 const stage=new Konva.Stage({container:document.createElement('div'),width,height}),layer=new Konva.Layer({listening:false}),viewport=new Konva.Group(),world=new Konva.Group();
 stage.add(layer);layer.add(new Konva.Rect({width,height,fill:scene.background}));layer.add(viewport);viewport.add(world);scene.layers.forEach(l=>world.add(l.drawing?new Konva.Shape({id:l.id,sceneFunc:vectorSceneFunc,drawingData:l.drawing}):new Konva.Image({id:l.id,image:undefined})));
 return {render(time:number){drawOutputFrame(stage,world,scene,time,images,width/scene.width,height/scene.height);return stage.toCanvas({pixelRatio:1});},destroy(){stage.destroy();}};
}
