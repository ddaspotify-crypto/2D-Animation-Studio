// Run: node --import tsx scripts/performance-check.mjs
import { createProject } from '../shared/model.ts';
import { evaluateSceneAtTime } from '../shared/animationEngine.ts';
import { performance } from 'node:perf_hooks';
const s=createProject().scenes[0],count=750;
for(let i=0;i<count;i++){const id='layer-'+i;s.layers.push({id,name:id,assetId:'image',visible:true,locked:false,opacity:1,transform:{x:i,y:i,width:64,height:64,scaleX:1,scaleY:1,rotation:0,anchorX:.5,anchorY:.5}});s.motionPaths.push({id:'path-'+i,layerId:id,type:'line',points:[{x:i,y:i},{x:i+100,y:i+100}],startTime:0,duration:10,easing:'linear',loop:'none',reverse:false,orientToPath:false,show:true});s.poseSets.push({id:'set-'+i,name:'Set',poses:[{id:'pose-'+i,name:'Pose',assetId:'image',width:64,height:64,anchorX:.5,anchorY:.5}]});s.poseTracks.push({id:'pose-track-'+i,layerId:id,poseSetId:'set-'+i,keyframes:[{id:'key-'+i,time:0,poseId:'pose-'+i}]});}
for(let i=0;i<20;i++)evaluateSceneAtTime(s,i/30);const samples=200,start=performance.now();for(let i=0;i<samples;i++)evaluateSceneAtTime(s,i/30);const elapsed=performance.now()-start;console.log(`${count} Layers + ${count} Paths + ${count} Pose Sets/Tracks: ${(elapsed/samples).toFixed(2)} ms/evaluation over ${samples} samples. This measures the engine, not browser FPS.`);
