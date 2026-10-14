import type { Project } from '../../shared/model.js';
import { frameTime,type ExportSettings,type ExportStatus } from '../../shared/exportModel.js';
import { createOutputRenderer } from '../render/outputRenderer';
import { loadImage } from '../assets/assetManager';
export async function exportApi<T>(url:string,init?:RequestInit):Promise<T>{const r=await fetch(url,{...init,headers:{'X-Studio-Request':'1',...init?.headers}});const result=await r.json();if(!r.ok)throw Error(result.error??'Export thất bại.');return result as T;}
export async function renderVideo(project:Project,settings:ExportSettings,signal:AbortSignal,onJob:(id:string)=>void,onProgress:(s:ExportStatus)=>void){
 const scene=project.scenes.find(s=>s.id===settings.sceneId);if(!scene)throw Error('Không tìm thấy Scene.');
 const used=new Set(scene.layers.map(l=>l.assetId));for(const set of scene.poseSets)for(const pose of set.poses)used.add(pose.assetId);
 const images=new Map<string,HTMLImageElement>();for(const id of used){signal.throwIfAborted();const a=project.assets.find(a=>a.id===id);if(!a)throw Error('Thiếu ảnh cho Layer/Pose.');images.set(id,await loadImage(a.path));}
 signal.throwIfAborted();const job=await exportApi<ExportStatus>('/api/exports',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({project,settings})});onJob(job.id);
 const renderer=createOutputRenderer(scene,settings.width,settings.height,images);
 try{onProgress(job);for(let i=0;i<job.totalFrames;i++){signal.throwIfAborted();const canvas=renderer.render(frameTime(i,settings.fps));const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Không tạo được frame PNG.')),'image/png'));signal.throwIfAborted();onProgress(await exportApi<ExportStatus>(`/api/exports/${job.id}/frames?index=${i}`,{method:'POST',body:blob,signal}));}
 signal.throwIfAborted();onProgress(await exportApi<ExportStatus>(`/api/exports/${job.id}/finish`,{method:'POST',signal}));
 while(true){signal.throwIfAborted();const status=await exportApi<ExportStatus>(`/api/exports/${job.id}`,{signal});onProgress(status);if(status.state==='completed')return;if(status.state==='error')throw Error(status.error);if(status.state==='cancelled')throw new DOMException('Đã hủy','AbortError');await new Promise<void>(resolve=>setTimeout(resolve,250));}
 }catch(error){await exportApi(`/api/exports/${job.id}`,{method:'DELETE'}).catch(()=>undefined);throw error;}finally{renderer.destroy();}
}
