import { create } from 'zustand';
import type { AnimationProperty, Keyframe } from '../../shared/model.js';

export const useTimeline = create<{
  animationId: string | null; frameId: string | null; clipboard: {property: AnimationProperty; frame: Keyframe} | null;
  kind:'animation'|'path'|'pose'|'camera'|'code';
  codeSelection:{layerId:string;frameId:string}[];
  codeDrag:{ids:string[];delta:number}|null;
  select: (animationId: string | null, frameId?: string | null,kind?:'animation'|'path'|'pose'|'camera'|'code') => void;
}>((set) => ({animationId: null, frameId: null, kind:'animation',clipboard: null,codeSelection:[],codeDrag:null, select: (animationId, frameId = null,kind='animation') => set({animationId, frameId,kind,codeDrag:null,codeSelection:kind==='code'&&animationId&&frameId?[{layerId:animationId,frameId}]:[]})}));
