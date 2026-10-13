import { create } from 'zustand';
import type { AnimationProperty, Keyframe } from '../../shared/model.js';

export const useTimeline = create<{
  animationId: string | null; frameId: string | null; clipboard: {property: AnimationProperty; frame: Keyframe} | null;
  select: (animationId: string | null, frameId?: string | null) => void;
}>((set) => ({animationId: null, frameId: null, clipboard: null, select: (animationId, frameId = null) => set({animationId, frameId})}));
