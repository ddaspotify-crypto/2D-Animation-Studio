import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { libraryItemSchema,type LibraryMotion } from '../shared/animationLibrary.js';
import { ProjectRepository } from './repository.js';
export class AnimationLibraryRepository{
  constructor(readonly root:string){}
  async directory(category?:string){await fs.mkdir(this.root,{recursive:true});if((await fs.lstat(this.root)).isSymbolicLink())throw Error('Thư viện không được là symlink.');const root=await fs.realpath(this.root);if(!category)return root;if(!['background','character','weapon'].includes(category))throw Error('Nhóm thư viện không hợp lệ.');const folder=path.join(root,category);await fs.mkdir(folder,{recursive:true});const stat=await fs.lstat(folder);if(stat.isSymbolicLink()||!stat.isDirectory())throw Error('Thư mục mẫu không hợp lệ.');return folder;}
  async list(){const items:LibraryMotion[]=[];let skipped=0;for(const category of ['background','character','weapon']){const folder=await this.directory(category);for(const entry of await fs.readdir(folder,{withFileTypes:true})){if(!entry.name.endsWith('.animation.json'))continue;try{if(!entry.isFile()||entry.isSymbolicLink())throw Error('Invalid file');const file=await new ProjectRepository(folder).safeFile(folder,entry.name);if((await fs.stat(file)).size>4*1024*1024)throw Error('Too large');const item=libraryItemSchema.parse(JSON.parse(await fs.readFile(file,'utf8')));if(entry.name!==item.id+'.animation.json'||item.category!==category||items.some(t=>t.id===item.id))throw Error('Invalid metadata');items.push(item);}catch{skipped++;}}}return {items:items.sort((a,b)=>a.name.localeCompare(b.name)),skipped};}
  async save(value:unknown){const item=libraryItemSchema.parse(value);if(item.id.startsWith('builtin-'))throw Error('Mẫu có sẵn chỉ được lưu thành bản riêng.');const list=await this.list();if(list.items.some(i=>i.id===item.id))throw Error('ID mẫu đã tồn tại; import thành bản mới.');const folder=await this.directory(item.category),repo=new ProjectRepository(folder),target=await repo.safeFile(folder,item.id+'.animation.json');
    // Exclusive create prevents overwriting a malformed or concurrently created entry.
    const temporary=await repo.safeFile(folder,randomUUID()+'.tmp');let reserved=false;
    try{await fs.writeFile(temporary,JSON.stringify(item,null,2),'utf8');await fs.writeFile(target,'',{flag:'wx'});reserved=true;await fs.rename(temporary,target);}catch(error){if(reserved)await fs.unlink(target).catch(()=>undefined);throw error;}finally{await fs.unlink(temporary).catch(()=>undefined);}return item;
  }
  async remove(id:string){if(!/^[\w-]{1,100}$/.test(id)||id.startsWith('builtin-'))throw Error('ID mẫu không hợp lệ.');const item=(await this.list()).items.find(i=>i.id===id);if(!item)throw Error('Mẫu không tồn tại.');const folder=await this.directory(item.category);await fs.unlink(await new ProjectRepository(folder).safeFile(folder,id+'.animation.json'));}
}
