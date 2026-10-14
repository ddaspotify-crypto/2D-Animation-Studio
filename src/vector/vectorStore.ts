import { create } from 'zustand';
import type { Project } from '../../shared/model.js';
export const useVectorEditor=create<{pathId:string|null;pointId:string|null;showPoints:boolean;onion:boolean;drafts:Record<string,string>}>()(()=>({pathId:null,pointId:null,showPoints:false,onion:false,drafts:{}}));
export function currentFrameDrafts(project:Project){const ids=new Set(project.scenes.flatMap(s=>s.layers.flatMap(l=>(l.codeFrames??[]).map(f=>f.id))));return Object.fromEntries(Object.entries(useVectorEditor.getState().drafts).filter(([id])=>ids.has(id)));}
