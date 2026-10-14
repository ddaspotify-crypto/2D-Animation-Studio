import { spawn,type ChildProcessWithoutNullStreams } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { validateProject } from '../shared/model.js';
import { exportSettingsSchema,frameCount,ffmpegArgs,type ExportStatus } from '../shared/exportModel.js';
import { chooseDirectory } from './directoryPicker.js';
type Job={status:ExportStatus;child:ChildProcessWithoutNullStreams;temporary:string;busy:boolean;timer:NodeJS.Timeout;closed:Promise<void>;width:number;height:number};
export class ExportManager{
 private jobs=new Map<string,Job>();private directories=new Map<string,string>();private starting=false;private picking=false;
 constructor(readonly defaultDirectory=path.resolve('exports'),readonly executable=process.env.STUDIO_FFMPEG_PATH??path.resolve('tools',process.platform==='win32'?'ffmpeg.exe':'ffmpeg')){}
 async capabilities(){let version='';try{version=await new Promise<string>((resolve,reject)=>{const p=spawn(this.executable,['-version'],{windowsHide:true});let text='';p.stdout.on('data',b=>text+=String(b));p.on('error',reject);p.on('close',code=>code===0?resolve(text.split(/\r?\n/)[0]):reject(Error('FFmpeg lỗi.')));});}catch{}return {available:!!version,version,defaultDirectory:this.defaultDirectory,nativePicker:process.platform==='win32'};}
 async choose(){if(this.picking)throw Error('Đang chọn thư mục.');this.picking=true;try{const directory=await chooseDirectory(this.defaultDirectory,'Chọn thư mục lưu video MP4 của 2D Animation Studio');if(!directory)return null;const actual=await fs.realpath(directory),token=randomUUID();this.directories.set(token,actual);return {directory:actual,token};}finally{this.picking=false;}}
 get(id:string){const j=this.jobs.get(id);if(!j)throw Error('Không tìm thấy export.');return j;}
 async shutdown(){await Promise.all([...this.jobs.keys()].map(id=>this.cancel(id)));}
 async start(value:unknown,settingsValue:unknown){
  if(this.starting||[...this.jobs.values()].some(j=>['rendering','encoding'].includes(j.status.state)))throw Error('Đang xuất video khác.');
  this.starting=true;
  try{const project=validateProject(value),s=exportSettingsSchema.parse(settingsValue),scene=project.scenes.find(c=>c.id===s.sceneId);if(!scene)throw Error('Scene không tồn tại.');const total=frameCount(scene.duration,s.fps);if(total>1_000_000)throw Error('Export tối đa 1 triệu frame; chia thành các scene ngắn hơn.');if(!(await this.capabilities()).available)throw Error('Không tìm thấy FFmpeg. Cài vào tools/ffmpeg.exe hoặc đặt STUDIO_FFMPEG_PATH rồi khởi động lại app.');
   const directory=s.directoryToken?this.directories.get(s.directoryToken):this.defaultDirectory;if(!directory)throw Error('Hãy chọn lại thư mục xuất.');await fs.mkdir(directory,{recursive:true});const folder=await fs.realpath(directory),outputPath=path.join(folder,s.filename);try{await fs.lstat(outputPath);throw Error('File đã tồn tại. Đổi tên để giữ nguyên video cũ.');}catch(e){if(!(e instanceof Error&&'code'in e&&e.code==='ENOENT'))throw e;}
   for(const [id,j]of this.jobs)if(!['rendering','encoding'].includes(j.status.state))this.jobs.delete(id);
   const id=randomUUID(),temporary=path.join(folder,`.studio-export-${id}.mp4`),child=spawn(this.executable,ffmpegArgs(s,temporary),{windowsHide:true}),status:ExportStatus={id,state:'rendering',framesRendered:0,framesEncoded:0,totalFrames:total,outputPath,error:''};
   let resolveClosed!:()=>void;const closed=new Promise<void>(resolve=>resolveClosed=resolve),timer=setTimeout(()=>void this.cancel(id),120000),job:Job={status,child,temporary,busy:false,timer,closed,width:s.width,height:s.height};this.jobs.set(id,job);
   let errors='',progress='';child.stderr.on('data',b=>{errors=(errors+String(b)).slice(-4000);});child.stdout.on('data',b=>{progress+=String(b);let newline;while((newline=progress.indexOf('\n'))>=0){const line=progress.slice(0,newline).trim();progress=progress.slice(newline+1);if(line.startsWith('frame='))status.framesEncoded=Math.min(total,Number(line.slice(6))||0);}});
   child.stdin.on('error',()=>{});child.on('error',e=>{status.error=e.message;status.state='error';});
   child.on('close',async code=>{clearTimeout(job.timer);try{if(status.state==='cancelled'||status.state==='error')return;if(code!==0||status.framesRendered!==total){status.state='error';status.error=errors||'FFmpeg kết thúc trước khi nhận đủ frame.';return;}await fs.link(temporary,outputPath);if(job.status.state==='cancelled'){await fs.unlink(outputPath);return;}status.framesEncoded=total;status.state='completed';}catch(e){status.state='error';status.error=e instanceof Error?e.message:'Không ghi được video.';}finally{await fs.unlink(temporary).catch(()=>undefined);resolveClosed();}});
   return {...status};
  }finally{this.starting=false;}
 }
 async frame(id:string,index:number,bytes:Buffer){const j=this.get(id),s=j.status;if(s.state!=='rendering'||j.busy||index!==s.framesRendered||index>=s.totalFrames)throw Error('Frame không đúng thứ tự hoặc export đã dừng.');if(bytes.length<24||bytes.length>72*1024*1024||!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))||bytes.readUInt32BE(16)!==j.width||bytes.readUInt32BE(20)!==j.height)throw Error('Frame PNG sai kích thước hoặc không hợp lệ.');
  j.busy=true;j.timer.refresh();try{await new Promise<void>((resolve,reject)=>j.child.stdin.write(bytes,error=>error?reject(error):resolve()));if(s.state!=='rendering')throw Error('Export đã dừng.');s.framesRendered++;return {...s};}finally{j.busy=false;}
 }
 finish(id:string){const j=this.get(id);if(j.status.state!=='rendering'||j.busy||j.status.framesRendered!==j.status.totalFrames)throw Error('Chưa nhận đủ frame.');j.status.state='encoding';clearTimeout(j.timer);j.timer=setTimeout(()=>void this.cancel(id),600000);j.child.stdin.end();return {...j.status};}
 async cancel(id:string){const j=this.get(id);if(!['rendering','encoding'].includes(j.status.state))return {...j.status};j.status.state='cancelled';clearTimeout(j.timer);j.child.kill();await j.closed;return {...j.status};}
}
