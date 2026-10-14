import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { vectorItemSchema,type VectorItem } from '../shared/drawingModel.js';
import { parseFrameCode,checkFrameDrawing } from '../shared/frameCode.js';
import { ProjectRepository } from './repository.js';
export function validateVectorItem(value:unknown){const item=vectorItemSchema.parse(value);let end=0;const ids=new Set<string>();for(const f of item.codeFrames){if(f.startFrame<end||ids.has(f.id))throw Error('Code Frames thư viện bị trùng/chồng đoạn.');end=f.startFrame+f.holdFrames;ids.add(f.id);checkFrameDrawing(parseFrameCode(f.code),item.drawing);}return item;}
export class VectorRepository{
 constructor(readonly root=path.resolve('Vector Library')){}
 async directory(){await fs.mkdir(this.root,{recursive:true});if((await fs.lstat(this.root)).isSymbolicLink())throw Error('Vector Library không được là liên kết filesystem.');return fs.realpath(this.root);}
 async list(){const folder=await this.directory(),repo=new ProjectRepository(folder),items:VectorItem[]=[];let skipped=0;for(const f of await fs.readdir(folder,{withFileTypes:true})){if(!f.name.endsWith('.vector.json'))continue;try{if(!f.isFile()||f.isSymbolicLink())throw Error('Invalid file');const file=await repo.safeFile(folder,f.name);if((await fs.stat(file)).size>8*1024*1024)throw Error('File quá lớn.');const item=validateVectorItem(JSON.parse(await fs.readFile(file,'utf8')));if(f.name!==item.id+'.vector.json')throw Error('ID sai.');items.push(item);}catch{skipped++;}}return {items,skipped,root:folder};}
 async save(value:unknown){const item=validateVectorItem(value),folder=await this.directory(),repo=new ProjectRepository(folder),target=await repo.safeFile(folder,item.id+'.vector.json'),temp=await repo.safeFile(folder,randomUUID()+'.tmp');try{await fs.writeFile(temp,JSON.stringify(item,null,2),{flag:'wx'});await fs.link(temp,target);}finally{await fs.unlink(temp).catch(()=>undefined);}return item;}
 async remove(id:string){if(!/^[\w-]{1,100}$/.test(id))throw Error('ID không hợp lệ.');const folder=await this.directory();await fs.unlink(await new ProjectRepository(folder).safeFile(folder,id+'.vector.json'));}
}
