import { create } from 'zustand';
export const usePathEditor=create<{drawLayerId:string|null;pointIndex:number}>()(()=>({drawLayerId:null,pointIndex:0}));
