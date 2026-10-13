import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { deflateSync } from 'node:zlib';
import { pathToFileURL } from 'node:url';

const entry = process.env.STUDIO_PLAYWRIGHT_ENTRY;
const {chromium} = await import(entry ? pathToFileURL(entry).href : 'playwright');
const browser = await chromium.launch({channel: 'msedge', headless: true});
const page = await browser.newPage({viewport: {width: 1600, height: 1000}});
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => {if (message.type() === 'error') errors.push(message.text());});
page.on('response', response => {if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);});
const base = process.env.STUDIO_TEST_URL ?? 'http://127.0.0.1:4310';
const name = `Smoke-${Date.now()}`;
await fs.mkdir('test-results', {recursive: true});

// Real PNG bytes, generated fixture; no user asset dependency.
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {crc ^= byte; for (let n = 0; n < 8; n++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);}
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const tag = Buffer.from(type), length = Buffer.alloc(4), checksum = Buffer.alloc(4);
  length.writeUInt32BE(data.length); checksum.writeUInt32BE(crc32(Buffer.concat([tag, data])));
  return Buffer.concat([length, tag, data, checksum]);
}
function png() {
  const header = Buffer.alloc(13); header.writeUInt32BE(120, 0); header.writeUInt32BE(80, 4); header[8] = 8; header[9] = 6;
  const raw = Buffer.alloc(80 * (120 * 4 + 1));
  for (let y = 0; y < 80; y++) for (let x = 0; x < 120; x++) {const i = y * 481 + x * 4 + 1; raw[i] = 140; raw[i+1] = 110; raw[i+2] = 240; raw[i+3] = 255;}
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', header), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
async function waitForValue(label, expected) {
  await page.waitForFunction(({label, expected}) => {
    const input = document.querySelector(`input[aria-label="${label}"]`);
    return input && Math.abs(Number(input.value) - expected) < .1;
  }, {label, expected});
}
async function changeNumber(label, value) {
  const input = page.getByRole('spinbutton', {name: label, exact: true});
  await input.fill(String(value)); await input.press('Enter'); await waitForValue(label, value);
}
async function writeCode(code, apply = true) {
  await page.locator('.monaco-editor .view-lines').click({position: {x: 120, y: 20}});
  await page.keyboard.press('Control+Home'); await page.keyboard.press('Control+A');
  await page.keyboard.insertText(code);
  if (apply) await page.getByRole('button', {name: 'Apply Code', exact: true}).click();
}
try {
  await page.goto(base); await page.locator('.monaco-editor').waitFor();
  await page.locator('input[type=file]').first().setInputFiles({name: 'smoke-image.png', mimeType: 'image/png', buffer: png()});
  await page.locator('.asset-card').waitFor();
  const asset = page.locator('.asset-card').first();
  const transfer = await page.evaluateHandle(() => new DataTransfer());
  await asset.dispatchEvent('dragstart', {dataTransfer: transfer});
  const workspace = page.locator('.canvas-workspace'); const rect = await workspace.boundingBox();
  await workspace.dispatchEvent('drop', {dataTransfer: transfer, clientX: rect.x + rect.width/2, clientY: rect.y + rect.height/2});
  await page.getByRole('spinbutton', {name: 'Position X', exact: true}).waitFor();
  await changeNumber('Position X', 200); await changeNumber('Position Y', 150);
  // Move an actual Konva node with the mouse.
  const zoom = Math.min((rect.width - 100)/1920, (rect.height - 100)/1080);
  const originX = rect.x + (rect.width - 1920*zoom)/2, originY = rect.y + (rect.height - 1080*zoom)/2;
  const center = {x: originX + 260*zoom, y: originY + 190*zoom};
  await page.mouse.move(center.x, center.y); await page.mouse.down(); await page.mouse.move(center.x+45, center.y+20, {steps: 6}); await page.mouse.up();
  await waitForValue('Position X', 200 + 45/zoom);
  await page.getByRole('button', {name: 'Undo · Ctrl+Z', exact: true}).click();
  await page.locator('.layer-row').first().click(); await waitForValue('Position X', 200);
  // Resize/rotate with the actual Transformer handles, each must Undo in one step.
  const corner = {x: originX + 320*zoom, y: originY + 230*zoom};
  await page.mouse.move(corner.x, corner.y); await page.mouse.down(); await page.mouse.move(corner.x+30, corner.y+20, {steps: 6}); await page.mouse.up();
  await page.waitForFunction(() => Number(document.querySelector('input[aria-label="Scale X"]')?.value) > 1.1);
  await page.getByTitle('Undo · Ctrl+Z', {exact: true}).click(); await page.locator('.layer-row').first().click(); await waitForValue('Scale X', 1);
  const rotate = {x: originX + 260*zoom, y: originY + 150*zoom - 50};
  await page.mouse.move(rotate.x, rotate.y); await page.mouse.down(); await page.mouse.move(rotate.x+70, rotate.y+50, {steps: 8}); await page.mouse.up();
  await page.waitForFunction(() => Math.abs(Number(document.querySelector('input[aria-label="Rotation (°)"]')?.value)) > 10);
  await page.getByTitle('Undo · Ctrl+Z', {exact: true}).click(); await page.locator('.layer-row').first().click(); await waitForValue('Rotation (°)', 0);
  await page.getByTitle('Duplicate · Ctrl+D', {exact: true}).click();
  assert.equal(await page.locator('.layer-row').count(), 2);
  await page.getByRole('checkbox', {name: 'Visible', exact: true}).uncheck();
  await page.getByRole('checkbox', {name: 'Visible', exact: true}).check();
  await page.getByRole('checkbox', {name: 'Locked', exact: true}).check();
  await page.locator('.canvas-toolbar').click(); await page.keyboard.press('Delete'); assert.equal(await page.locator('.layer-row').count(), 2);
  await page.getByRole('checkbox', {name: 'Locked', exact: true}).uncheck(); await page.getByTitle('Delete', {exact: true}).click();
  assert.equal(await page.locator('.layer-row').count(), 1); await page.locator('.layer-row').first().click();
  await page.getByTitle('Save · Ctrl+S', {exact: true}).click();
  await page.getByRole('textbox', {name: 'Tên thư mục project', exact: true}).fill(name);
  await page.getByRole('dialog').getByRole('button', {name: 'Save', exact: true}).click();
  await page.getByRole('dialog').waitFor({state: 'hidden'});
  console.log('Import/drop/move/Save passed');
  const response = await page.request.get(`${base}/api/projects/${name}`); assert.equal(response.status(), 200);
  const project = await response.json();
  assert.equal(project.scenes[0].layers[0].transform.x, 200);
  const assetPath = project.assets[0].path;
  const source = `const scene = createScene({width:1920,height:1080,fps:30,duration:10});\nscene.addImage({id:"image-1",name:"Code image",asset:"${assetPath}",x:500,y:150,scale:2,rotation:15});`;
  await writeCode(source, false); await waitForValue('Scene Width', 1920);
  await page.getByTitle('Format Code', {exact: true}).click();
  await page.waitForFunction(() => document.querySelector('.monaco-editor .view-lines')?.textContent.replace(/\u00a0/g, ' ').includes('width: 1920'));
  await page.getByRole('button', {name: 'Apply Code', exact: true}).click();
  await page.locator('.layer-row').filter({hasText: 'Code image'}).click(); await waitForValue('Position X', 500); await waitForValue('Scale X', 2);
  console.log('Apply passed');
  await page.getByRole('button', {name: 'Undo · Ctrl+Z', exact: true}).click(); await page.locator('.layer-row').first().click(); await waitForValue('Position X', 200);
  await page.getByRole('button', {name: 'Redo · Ctrl+Y', exact: true}).click(); await page.locator('.layer-row').first().click(); await waitForValue('Position X', 500);
  await writeCode(source + '\nalert("forbidden");');
  await page.locator('.code-error').waitFor(); await waitForValue('Position X', 500);
  await changeNumber('Position X', 600); assert.match(await page.locator('.sync-badge').innerText(), /Cần đồng bộ/);
  page.once('dialog', dialog => dialog.accept()); await page.getByTitle('Generate Code từ Canvas', {exact: true}).click();
  await page.getByTitle('Save · Ctrl+S', {exact: true}).click();
  await page.waitForFunction(() => document.querySelector('.statusbar')?.textContent.includes('Đã lưu:'));
  const saved = await (await page.request.get(`${base}/api/projects/${name}`)).json(); assert.equal(saved.scenes[0].layers[0].transform.x, 600);
  await page.reload(); await page.locator('.monaco-editor').waitFor();
  await page.getByTitle('Open Project', {exact: true}).click();
  await page.getByRole('dialog').getByRole('button', {name, exact: true}).click();
  page.once('dialog', dialog => dialog.accept()); await page.getByRole('dialog').getByRole('button', {name: 'Open', exact: true}).click();
  await page.getByRole('dialog').waitFor({state: 'hidden'});
  await page.locator('.layer-row').first().click(); await waitForValue('Position X', 600); await waitForValue('Rotation (°)', 15);
  await page.screenshot({path: path.resolve('test-results/studio-phase1.png'), fullPage: true});
  assert.deepEqual(errors, [], `Browser errors: ${errors.join('\n')}`);
  console.log(`PASS: import, HTML drag/drop, Konva move/resize/rotate, layer duplicate/visibility/lock/delete, properties, Save/Open, Format/Apply, Undo/Redo, invalid code, draft conflict, reload recovery. Project: ${name}`);
} catch (error) {
  await page.screenshot({path: path.resolve('test-results/studio-failure.png'), fullPage: true}).catch(() => undefined);
  throw error;
} finally {await browser.close();}
