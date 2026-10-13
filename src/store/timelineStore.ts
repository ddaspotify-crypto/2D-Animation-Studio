import { create } from 'zustand';
import type { AnimationProperty, Keyframe } from '../../shared/model.js';

export const useTimeline = create<{
  animationId: string | null; frameId: string | null; clipboard: {property: AnimationProperty; frame: Keyframe} | null;
  kind:'animation'|'path'|'pose'|'camera';
  select: (animationId: string | null, frameId?: string | null,kind?:'animation'|'path'|'pose'|'camera') => void;
}>((set) => ({animationId: null, frameId: null, kind:'animation',clipboard: null, select: (animationId, frameId = null,kind='animation') => set({animationId, frameId,kind})}));
