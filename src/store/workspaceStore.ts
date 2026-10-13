import { create } from 'zustand';
export const useWorkspace=create<{area:'layers'|'timeline'|'assets';assetId:string|null}>()(()=>({area:'layers',assetId:null}));
