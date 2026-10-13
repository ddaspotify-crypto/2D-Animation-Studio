import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { ProjectRepository } from './repository.js';
import { chooseDirectory } from './directoryPicker.js';

let root = path.resolve(process.env.STUDIO_PROJECTS_DIR ?? path.join(process.cwd(), 'projects'));
let repository = new ProjectRepository(root);
let pickingDirectory = false;
const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../dist');
const saves = new Set<string>();
function json(response: ServerResponse, status: number, body: unknown) {
  response.writeHead(status, {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store'});
  response.end(JSON.stringify(body));
}
async function body(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []; let length = 0;
  for await (const chunk of request) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array);
    length += bytes.length;
    if (length > 256 * 1024 * 1024) throw new Error('Project upload vượt 256 MB; import ít ảnh hơn mỗi project.');
    chunks.push(bytes);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
}
const saveSchema = z.object({name: z.string(), project: z.unknown(), saveAs: z.boolean(), assets: z.array(z.object({path: z.string(), base64: z.string()}).strict()).max(1000)}).strict();
const server = createServer(async (request, response) => {
  try {
    const host = request.headers.host;
    if (!host || !/^(127\.0\.0\.1|localhost):(4310|5173)$/.test(host)) return json(response, 403, {error: 'Localhost only.'});
    const origin = request.headers.origin;
    if (origin && !/^http:\/\/(127\.0\.0\.1|localhost):(4310|5173)$/.test(origin)) return json(response, 403, {error: 'Origin không được phép.'});
    const url = new URL(request.url ?? '/', 'http://127.0.0.1:4310');
    const parts = url.pathname.split('/').filter(Boolean).map(decodeURIComponent);
    if (request.method === 'GET' && url.pathname === '/api/projects') return json(response, 200, {root, projects: await repository.list(), nativePicker: process.platform === 'win32'});
    if (request.method === 'POST' && url.pathname === '/api/choose-directory') {
      if (request.headers['x-studio-request'] !== '1') return json(response, 403, {error: 'Thiếu request header.'});
      if (pickingDirectory || saves.size) return json(response, 409, {error: 'Đang có thao tác filesystem. Hãy thử lại sau.'});
      pickingDirectory = true;
      try {
        const chosen = await chooseDirectory(root);
        if (chosen) {root = await fs.realpath(chosen); repository = new ProjectRepository(root);}
        return json(response, 200, {root, projects: await repository.list(), nativePicker: true, changed: chosen !== null});
      } finally {pickingDirectory = false;}
    }
    if (request.method === 'GET' && parts[0] === 'api' && parts[1] === 'projects' && parts.length === 3) return json(response, 200, await repository.load(parts[2]));
    if (request.method === 'GET' && parts[0] === 'api' && parts[1] === 'assets' && parts.length === 4) {
      const project = await repository.load(parts[2]);
      const asset = project.assets.find(a => a.path === `assets/${parts[3]}`);
      if (!asset) return json(response, 404, {error: 'Asset không tồn tại.'});
      const folder = await repository.folder(parts[2]);
      const data = await fs.readFile(await repository.safeFile(folder, asset.path));
      repository.verifyAsset(data, asset.path);
      response.writeHead(200, {'Content-Type': asset.mime, 'Cache-Control': 'private, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff'});
      response.end(data); return;
    }
    if (request.method === 'POST' && url.pathname === '/api/projects') {
      if (request.headers['x-studio-request'] !== '1') return json(response, 403, {error: 'Thiếu request header.'});
      const payload = saveSchema.parse(await body(request));
      if (saves.has(payload.name)) return json(response, 409, {error: 'Project đang được lưu.'});
      saves.add(payload.name);
      try { await repository.save(payload.name, payload.project, payload.assets, payload.saveAs); }
      finally { saves.delete(payload.name); }
      return json(response, 200, {name: payload.name});
    }
    if (parts[0] === 'api') return json(response, 404, {error: 'API không tồn tại.'});
    if (request.method !== 'GET') return json(response, 405, {error: 'Method not allowed.'});
    const relative = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
    const file = path.resolve(dist, relative);
    if (!file.startsWith(dist + path.sep)) return json(response, 403, {error: 'Đường dẫn không hợp lệ.'});
    const types: Record<string, string> = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.ttf': 'font/ttf', '.svg': 'image/svg+xml'};
    const data = await fs.readFile(file);
    response.writeHead(200, {'Content-Type': types[path.extname(file)] ?? 'application/octet-stream', 'X-Content-Type-Options': 'nosniff'});
    response.end(data);
  } catch (error) {
    const missing = error instanceof Error && 'code' in error && error.code === 'ENOENT';
    json(response, missing ? 404 : 400, {error: error instanceof Error ? error.message : 'Lỗi filesystem.'});
  }
});
server.listen(4310, '127.0.0.1', () => console.log(`2D Animation Studio: http://127.0.0.1:4310 · Projects: ${root}`));
