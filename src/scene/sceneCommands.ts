import { createProject,defaultCamera,type Scene } from '../../shared/model.js';
import { cloneLayers } from '../advanced/cloneLayers';
export function newScene(source:Scene,name:string):Scene{return {...createProject().scenes[0],name,width:source.width,height:source.height,fps:source.fps,duration:source.duration,background:source.background,camera:defaultCamera(source.width,source.height)};}
export function duplicateScene(source:Scene):Scene{
  const blank:Scene={...structuredClone(source),id:crypto.randomUUID(),name:source.name+' copy',layers:[],animations:[],motionPaths:[],poseSets:[],poseTracks:[],groups:[]};
  const copy=cloneLayers(blank,source,source.layers.map(l=>l.id),0,(source.groups??[]).map(g=>g.id),0).scene;
  copy.layers=copy.layers.map((l,i)=>({...l,name:source.layers[i].name}));copy.groups=copy.groups?.map((g,i)=>({...g,name:source.groups![i].name}));
  copy.camera={...source.camera,animations:source.camera.animations.map(a=>({...a,id:crypto.randomUUID(),keyframes:a.keyframes.map(k=>({...k,id:crypto.randomUUID()}))}))};return copy;
}
