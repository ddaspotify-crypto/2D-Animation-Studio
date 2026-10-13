import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { ProjectRepository } from '../server/repository.js';
import { createProject } from '../shared/model.js';

let root: string;
let repository: ProjectRepository;
beforeEach(async () => {root = await fs.mkdtemp(path.join(os.tmpdir(), 'studio-test-')); repository = new ProjectRepository(root);});
afterEach(async () => {
  const target = path.resolve(root); const temp = path.resolve(os.tmpdir());
  if (!target.startsWith(temp + path.sep) || !path.basename(target).startsWith('studio-test-')) throw new Error('Unsafe cleanup target');
  await fs.rm(target, {recursive: true, force: true});
});
describe('Project local persistence', () => {
  it('saves, loads and deduplicates stable asset paths; supports Save As', async () => {
    const bytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==', 'base64');
    const hash = createHash('sha256').update(bytes).digest('hex'), assetPath = `assets/${hash}.png`;
    const project = createProject(); project.assets.push({id: 'a', name: 'pixel.png', path: assetPath, folder: '', mime: 'image/png', width: 1, height: 1});
    const uploads = [{path: assetPath, base64: bytes.toString('base64')}];
    await repository.save('Demo', project, uploads, true); await repository.save('Demo', project, uploads, false);
    expect(await repository.load('Demo')).toEqual(project);
    expect(await fs.readdir(path.join(root, 'Demo', 'assets'))).toHaveLength(1);
    await repository.save('Copy', project, uploads, true); expect(await repository.list()).toEqual(['Copy','Demo']);
    await expect(repository.save('Demo', project, uploads, true)).rejects.toThrow();
  });
  it('rejects traversal, reserved folder names and absolute paths', async () => {
    for (const name of ['../escape', 'C:\\other', 'CON', 'nested/name', 'a.']) await expect(repository.folder(name, true)).rejects.toThrow();
    const folder = await repository.folder('Demo', true);
    await expect(repository.safeFile(folder, '../escape')).rejects.toThrow();
  });
  it('does not overwrite another project or unrelated files', async () => {
    await repository.save('Demo', createProject(), [], true);
    await expect(repository.save('Demo', createProject(), [], false)).rejects.toThrow();
    await fs.mkdir(path.join(root, 'Personal')); await fs.writeFile(path.join(root, 'Personal', 'notes.txt'), 'private');
    await expect(repository.save('Personal', createProject(), [], false)).rejects.toThrow();
    expect(await fs.readFile(path.join(root, 'Personal', 'notes.txt'), 'utf8')).toBe('private');
  });
  it('rejects checksum mismatch before writing manifest', async () => {
    const project = createProject(); project.assets.push({id: 'a', name: 'x.png', path: `assets/${'b'.repeat(64)}.png`, folder: '', mime: 'image/png', width: 1, height: 1});
    await expect(repository.save('Bad', project, [{path: project.assets[0].path, base64: 'AAAA'}], true)).rejects.toThrow();
    await expect(repository.load('Bad')).rejects.toThrow();
  });
  it('rejects malformed project JSON without crashing listing', async () => {
    await fs.mkdir(path.join(root, 'Bad')); await fs.writeFile(path.join(root, 'Bad', 'project.json'), '{}');
    await expect(repository.load('Bad')).rejects.toThrow(); expect(await repository.list()).toEqual([]);
  });
  it('loads a v1 project through migration without rewriting disk until Save', async () => {
    const project = createProject(); const {animations, ...scene} = project.scenes[0]; void animations;
    const legacy = {...project, schemaVersion: 1, scenes: [scene]};
    await fs.mkdir(path.join(root, 'Legacy')); await fs.writeFile(path.join(root, 'Legacy', 'project.json'), JSON.stringify(legacy));
    const loaded = await repository.load('Legacy'); expect(loaded.schemaVersion).toBe(2); expect(loaded.scenes[0].animations).toEqual([]);
    expect(JSON.parse(await fs.readFile(path.join(root, 'Legacy', 'project.json'), 'utf8')).schemaVersion).toBe(1);
    await repository.save('Legacy', loaded, [], false); expect(JSON.parse(await fs.readFile(path.join(root, 'Legacy', 'project.json'), 'utf8')).schemaVersion).toBe(2);
  });
});
