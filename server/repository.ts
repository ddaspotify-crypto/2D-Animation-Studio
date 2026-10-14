import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { validateProject, type Project } from '../shared/model.js';

export interface AssetUpload {path: string; base64: string}
export class ProjectRepository {
  constructor(readonly root: string) {}
  async folder(name: string, create = false): Promise<string> {
    if (!/^[\p{L}\p{N}_ -]{1,80}$/u.test(name) || /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i.test(name) || name.endsWith(' ') || name.startsWith(' ')) throw new Error('Tên thư mục: 1–80 ký tự chữ/số, dấu cách, _ hoặc -.');
    await fs.mkdir(this.root, {recursive: true});
    const target = path.join(await fs.realpath(this.root), name);
    if (create) await fs.mkdir(target, {recursive: true});
    const stat = await fs.lstat(target);
    if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error('Không cho phép project là liên kết filesystem.');
    return target;
  }
  async safeFile(folder: string, relative: string): Promise<string> {
    const parts = relative.split('/');
    if (parts.some(p => !p || p === '..' || p === '.' || p.includes('\\') || p.includes(':'))) throw new Error('Đường dẫn không hợp lệ.');
    let current = folder;
    for (const part of parts) {
      current = path.join(current, part);
      try { if ((await fs.lstat(current)).isSymbolicLink()) throw new Error('Không cho phép liên kết filesystem.'); }
      catch (error) { if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error; }
    }
    return current;
  }
  async list(): Promise<string[]> {
    await fs.mkdir(this.root, {recursive: true});
    const entries = await fs.readdir(this.root, {withFileTypes: true});
    const projects: string[] = [];
    for (const item of entries) {
      if (!item.isDirectory() || item.isSymbolicLink()) continue;
      try { await this.load(item.name); projects.push(item.name); } catch {try{await this.loadBackup(item.name);projects.push(item.name);}catch{ /* Malformed/unrelated folders are not projects. */ }}
    }
    return projects.sort();
  }
  async load(name: string): Promise<Project> {
    const folder = await this.folder(name);
    return validateProject(JSON.parse(await fs.readFile(await this.safeFile(folder, 'project.json'), 'utf8')));
  }
  async loadBackup(name:string):Promise<Project>{const folder=await this.folder(name);try{return validateProject(JSON.parse(await fs.readFile(await this.safeFile(folder,'project.backup.json'),'utf8')));}catch(e){if(e instanceof Error&&'code'in e&&e.code==='ENOENT')throw Error('Chưa có bản sao lưu cho project này. Bản sao được tạo từ lần Save thứ hai; có thể thử Khôi phục tự lưu.');throw e;}}
  async save(name: string, value: unknown, uploads: AssetUpload[], saveAs: boolean): Promise<void> {
    const project = validateProject(value);
    const folder = await this.folder(name, true);
    const manifest = await this.safeFile(folder, 'project.json');
    const entries = await fs.readdir(folder);
    let previous:Project|undefined;
    if (entries.length) {
      if (saveAs) throw new Error('Save As cần thư mục mới; tên này đã tồn tại.');
      const existing = await this.load(name);
      previous=existing;
      if (existing.id !== project.id) throw new Error('Thư mục đang chứa project khác. Hãy dùng Save As với tên mới.');
    }
    const assetsFolder = await this.safeFile(folder, 'assets');
    await fs.mkdir(assetsFolder, {recursive: true});
    const data = new Map(uploads.map(u => [u.path, u.base64]));
    for (const asset of project.assets) {
      const target = await this.safeFile(folder, asset.path);
      const provided = data.get(asset.path);
      if (provided === undefined) {
        const stored = await fs.readFile(target);
        this.verifyAsset(stored, asset.path);
        continue;
      }
      if (provided.length > 90_000_000 || !/^[A-Za-z0-9+/]*={0,2}$/.test(provided)) throw new Error(`Dữ liệu ảnh không hợp lệ: ${asset.name}`);
      const bytes = Buffer.from(provided, 'base64');
      this.verifyAsset(bytes, asset.path);
      try {
        await fs.writeFile(target, bytes, {flag: 'wx'});
      } catch (error) {
        if (!(error instanceof Error && 'code' in error && error.code === 'EEXIST')) throw error;
        this.verifyAsset(await fs.readFile(target), asset.path);
      }
    }
    // Immutable content-addressed assets first, then atomically replace the manifest.
    if(previous){const backup=await this.safeFile(folder,'project.backup.json'),temp=await this.safeFile(folder,`backup-${randomUUID()}.tmp`);try{await fs.writeFile(temp,JSON.stringify(previous,null,2),{flag:'wx'});await fs.rename(temp,backup);}finally{await fs.unlink(temp).catch(()=>undefined);}}
    const temporary = await this.safeFile(folder, `project-${randomUUID()}.tmp`);
    try {
      await fs.writeFile(temporary, JSON.stringify(project, null, 2), {flag: 'wx'});
      await fs.rename(temporary, manifest);
    } finally { await fs.unlink(temporary).catch(() => undefined); }
  }
  verifyAsset(bytes: Buffer, relative: string): void {
    const hash = createHash('sha256').update(bytes).digest('hex');
    if (!relative.startsWith(`assets/${hash}.`)) throw new Error('Checksum ảnh không khớp.');
    const png = bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
    const jpg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    const webp = bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
    const ext = path.extname(relative);
    if (!(ext === '.png' && png || ['.jpg', '.jpeg'].includes(ext) && jpg || ext === '.webp' && webp)) throw new Error('Định dạng ảnh không đúng PNG/JPEG/WebP.');
  }
}
