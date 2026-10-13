import { create } from 'zustand';
export const useCameraView=create<{output:boolean;edit:boolean}>()(()=>({output:false,edit:false}));
