import { describe,it,expect } from 'vitest';
import { promises as fs,existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { deflateSync } from 'node:zlib';
import { ExportManager } from '../server/exportManager.js';
import { createProject,getScene } from '../shared/model.js';
import { exportSettingsSchema,frameCount,frameTime,ffmpegArgs,type ExportSettings } from '../shared/exportModel.js';
const settings:ExportSettings={sceneId:'s',width:16,height:16,fps:3,quality:'balanced',filename:'test.mp4'};
function png(){const chunk=(name:string,data:Buffer)=>{const type=Buffer.from(name),content=Buffer.concat([type,data]);let crc=0xffffffff;for(const b of content){crc^=b;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}const size=Buffer.alloc(4),check=Buffer.alloc(4);size.writeUInt32BE(data.length);check.writeUInt32BE((crc^0xffffffff)>>>0);return Buffer.concat([size,content,check]);};const header=Buffer.alloc(13);header.writeUInt32BE(16,0);header.writeUInt32BE(16,4);header[8]=8;header[9]=2;const scan=Buffer.alloc(16*(1+16*3),170);for(let i=0;i<16;i++)scan[i*49]=0;return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(scan)),chunk('IEND',Buffer.alloc(0))]);}
describe('Export settings and deterministic timestamps',()=>{
 it('samples at n/fps without duplicated final frame',()=>{expect(frameCount(10,30)).toBe(300);expect(frameCount(.1,30)).toBe(3);expect(frameTime(299,30)).toBeCloseTo(9.9666667);});
 it('rejects odd sizes, filesystem traversal and invalid FPS',()=>{for(const patch of [{width:15},{filename:'../x.mp4'},{filename:'CON.mp4'},{fps:121},{width:8192}])expect(exportSettingsSchema.safeParse({...settings,...patch}).success).toBe(false);});
 it('uses argument array, H264, fixed input FPS and exclusive output',()=>{const args=ffmpegArgs(settings,'C:/folder with spaces/tmp.mp4');expect(args).toContain('libx264');expect(args).toContain('yuv420p');expect(args).toContain('-n');expect(args).not.toContain('-y');expect(args.at(-1)).toBe('C:/folder with spaces/tmp.mp4');});
});
describe.skipIf(!existsSync(path.resolve('tools/ffmpeg.exe')))('Real FFmpeg pipeline',()=>{
 it('writes all frames, finalizes MP4, protects old output and cleans temp',async()=>{const dir=await fs.mkdtemp(path.join(os.tmpdir(),'studio-export-test-')),m=new ExportManager(dir),p=createProject();getScene(p).duration=1;const s={...settings,sceneId:getScene(p).id};try{const j=await m.start(p,s);await expect(m.frame(j.id,1,png())).rejects.toThrow('thứ tự');await expect(m.frame(j.id,0,Buffer.from('bad'))).rejects.toThrow('PNG');expect(()=>m.finish(j.id)).toThrow('đủ frame');for(let i=0;i<3;i++)await m.frame(j.id,i,png());m.finish(j.id);await m.get(j.id).closed;expect(m.get(j.id).status.state).toBe('completed');const bytes=await fs.readFile(path.join(dir,'test.mp4'));expect(bytes.toString('ascii',4,8)).toBe('ftyp');expect(await fs.readdir(dir)).toEqual(['test.mp4']);await expect(m.start(p,s)).rejects.toThrow('tồn tại');}finally{await fs.rm(dir,{recursive:true,force:true});}},15000);
 it('cancels active encoder and removes partial output',async()=>{const dir=await fs.mkdtemp(path.join(os.tmpdir(),'studio-export-test-')),m=new ExportManager(dir),p=createProject();try{const j=await m.start(p,{...settings,sceneId:getScene(p).id});await m.frame(j.id,0,png());await m.cancel(j.id);expect(m.get(j.id).status.state).toBe('cancelled');expect(await fs.readdir(dir)).toEqual([]);}finally{await fs.rm(dir,{recursive:true,force:true});}},15000);
 it('reports missing FFmpeg before launching job',async()=>{const m=new ExportManager('exports','missing-studio-ffmpeg'),p=createProject();await expect(m.start(p,{...settings,sceneId:getScene(p).id})).rejects.toThrow('FFmpeg');});
});
