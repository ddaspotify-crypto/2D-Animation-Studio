import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import { pathToFileURL } from 'node:url';

const entry=process.env.STUDIO_PLAYWRIGHT_ENTRY;
const {chromium}=await import(entry ? pathToFileURL(entry).href : 'playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1680,height:1080}});
const base=process.env.STUDIO_TEST_URL ?? 'http://127.0.0.1:4310';
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
page.on('console',message=>{if(message.type()==='error') errors.push(message.text());});
page.on('response',response=>{if(response.status()>=400) errors.push(`${response.status()} ${response.url()}`);});
const name=`Phase2-Smoke-${Date.now()}`;
await fs.mkdir('test-results',{recursive:true});
async function value(label, expected) {
  await page.waitForFunction(({label,expected})=>{const element=document.querySelector(`input[aria-label="${label}"]`);return element && Math.abs(Number(element.value)-expected)<.01;},{label,expected});
}
async function number(label, next) {const field=page.getByRole('spinbutton',{name:label,exact:true});await field.fill(String(next));await field.press('Enter');await value(label,next);}
async function seek(time) {await page.getByRole('spinbutton',{name:'Playhead Time',exact:true}).fill(String(time));}
async function setCode(source) {
  await page.locator('.monaco-editor .view-lines').click({position:{x:120,y:20}});
  await page.keyboard.press('Control+Home');await page.keyboard.press('Control+A');await page.keyboard.insertText(source);
  await page.getByTitle('Apply Code',{exact:true}).click();
}
try {
  await page.goto(base);await page.locator('.monaco-editor').waitFor();
  const list=await (await page.request.get(`${base}/api/projects`)).json();
  const fixtureName=list.projects.filter(n=>n.startsWith('Smoke-')).at(-1);
  assert.ok(fixtureName,'Run scripts/browser-smoke.mjs first to create an image fixture.');
  await page.getByTitle('Open Project',{exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:fixtureName,exact:true}).click();
  page.once('dialog',dialog=>dialog.accept());await page.getByRole('dialog').getByRole('button',{name:'Open',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});
  await page.locator('.layer-row').first().click();
  const initialX=Number(await page.getByRole('spinbutton',{name:'Position X',exact:true}).inputValue());
  const initialScale=Number(await page.getByRole('spinbutton',{name:'Scale X',exact:true}).inputValue());
  const initialRotation=Number(await page.getByRole('spinbutton',{name:'Rotation (°)',exact:true}).inputValue());
  assert.equal(await page.getByRole('checkbox',{name:'Auto Keyframe',exact:true}).isChecked(),false);
  await page.getByTitle('Thêm Move / Position',{exact:true}).click();assert.equal(await page.locator('.timeline-key').count(),2);
  await number('Key x',initialX+500);await number('Animation Duration (s)',4);
  await seek(2);await value('Position X',initialX+250);
  await page.getByRole('combobox',{name:'Animation Easing',exact:true}).selectOption('easeIn');await value('Position X',initialX+125);
  await page.getByRole('combobox',{name:'Animation Easing',exact:true}).selectOption('linear');
  await page.getByRole('combobox',{name:'Animation Loop',exact:true}).selectOption('pingPong');await seek(6);await value('Position X',initialX+250);
  await seek(0);await page.getByTitle('Thêm Scale',{exact:true}).click();await page.getByTitle('Thêm Rotate',{exact:true}).click();await page.getByTitle('Thêm Fade / Opacity',{exact:true}).click();
  await seek(1);await value('Scale X',initialScale*1.25);await value('Rotation (°)',initialRotation+45);await value('Opacity',.5);await value('Position X',initialX+125);
  const ruler=await page.locator('.ruler').boundingBox();assert.ok(ruler);
  await page.mouse.move(ruler.x+70,ruler.y+10);await page.mouse.down();await page.mouse.move(ruler.x+140,ruler.y+10,{steps:6});await page.mouse.up();await value('Playhead Time',2);await value('Position X',initialX+250);
  const frameA=await page.locator('.canvas-workspace').screenshot();await seek(0);await page.waitForTimeout(100);const frameB=await page.locator('.canvas-workspace').screenshot();assert.notDeepEqual(frameA,frameB,'Canvas must update on scrub.');
  await seek(1);await page.getByRole('checkbox',{name:'Auto Keyframe',exact:true}).check();await number('Position X',initialX+200);
  assert.equal(await page.locator('.timeline-key').count(),9);await page.getByRole('checkbox',{name:'Auto Keyframe',exact:true}).uncheck();
  const moveRow=page.locator('.timeline-row').filter({has:page.locator('.track-label', {hasText:'Move / Position'})});
  const middle=moveRow.locator('.timeline-key').nth(1);const box=await middle.boundingBox();assert.ok(box);
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2+35,box.y+box.height/2,{steps:6});await page.mouse.up();
  await value('Key Time (s)',1.5);
  const resize=moveRow.getByRole('button',{name:'Resize position Duration',exact:true});const resizeBox=await resize.boundingBox();assert.ok(resizeBox);
  await page.mouse.move(resizeBox.x+resizeBox.width/2,resizeBox.y+resizeBox.height/2);await page.mouse.down();await page.mouse.move(resizeBox.x+resizeBox.width/2+70,resizeBox.y+resizeBox.height/2,{steps:6});await page.mouse.up();await value('Animation Duration (s)',5);
  await page.getByTitle('Undo · Ctrl+Z',{exact:true}).click();await page.locator('.layer-row').first().click();await moveRow.locator('.track-label').click();await value('Animation Duration (s)',4);
  const bar=moveRow.locator('.animation-bar');const barBox=await bar.boundingBox();assert.ok(barBox);
  await page.mouse.move(barBox.x+80,barBox.y+4);await page.mouse.down();await page.mouse.move(barBox.x+150,barBox.y+4,{steps:6});await page.mouse.up();await value('Start Time (s)',1);
  await page.getByTitle('Undo · Ctrl+Z',{exact:true}).click();await page.locator('.layer-row').first().click();await middle.click();await value('Start Time (s)',0);
  await page.getByTitle('Copy Keyframe',{exact:true}).click();await seek(3);await page.getByTitle('Paste Keyframe at Playhead',{exact:true}).click();assert.equal(await page.locator('.timeline-key').count(),10);
  await page.getByTitle('Delete Selected Keyframe',{exact:true}).click();assert.equal(await page.locator('.timeline-key').count(),9);
  await page.getByTitle('Stop',{exact:true}).first().click();await value('Playhead Time',0);
  await page.getByTitle('Play · Space',{exact:true}).first().click();await page.waitForFunction(()=>Number(document.querySelector('input[aria-label="Playhead Time"]')?.value)>.15);
  await page.getByTitle('Pause · Space',{exact:true}).first().click();const paused=await page.getByRole('spinbutton',{name:'Playhead Time',exact:true}).inputValue();await page.waitForTimeout(180);assert.equal(await page.getByRole('spinbutton',{name:'Playhead Time',exact:true}).inputValue(),paused);
  await page.getByTitle('Stop',{exact:true}).first().click();console.log('PASS: UI animation presets, combined tracks, easing/loop/scrub, Auto Key, drag/copy/paste/delete keyframes, Play/Pause/Stop');
  await page.getByTitle('Save As',{exact:true}).click();await page.getByRole('textbox',{name:'Tên thư mục project',exact:true}).fill(name);await page.getByRole('dialog').getByRole('button',{name:'Save',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});
  const saved=await (await page.request.get(`${base}/api/projects/${name}`)).json();assert.equal(saved.schemaVersion,5);assert.equal(saved.scenes[0].animations.length,4);
  const layer=saved.scenes[0].layers[0],asset=saved.assets.find(a=>a.id===layer.assetId);
  const source=`const scene=createScene({width:1920,height:1080,fps:30,duration:10});\nscene.addImage({id:${JSON.stringify(layer.id)},asset:${JSON.stringify(asset.path)},x:0,y:150});\n`+
    `scene.animate(${JSON.stringify(layer.id)},{property:"position",keyframes:[{time:0,x:0,y:150},{time:4,x:800,y:150}],easing:"easeInOut"});\n`+
    `scene.animate(${JSON.stringify(layer.id)},{property:"scale",keyframes:[{time:0,scaleX:1,scaleY:1},{time:4,scaleX:2,scaleY:3}]});\n`+
    `scene.animate(${JSON.stringify(layer.id)},{property:"rotation",keyframes:[{time:0,rotation:0},{time:4,rotation:360}]});\n`+
    `scene.animate(${JSON.stringify(layer.id)},{property:"opacity",keyframes:[{time:0,opacity:1},{time:4,opacity:0}]});`;
  await setCode(source);await seek(2);await page.locator('.layer-row').first().click();await value('Position X',400);await value('Scale X',1.5);await value('Scale Y',2);await value('Rotation (°)',180);await value('Opacity',.5);assert.equal(await page.locator('.timeline-key').count(),8);
  await page.getByTitle('Undo · Ctrl+Z',{exact:true}).click();assert.equal(await page.locator('.timeline-key').count(),9);await page.getByTitle('Redo · Ctrl+Y',{exact:true}).click();assert.equal(await page.locator('.timeline-key').count(),8);await page.locator('.layer-row').first().click();await value('Position X',400);
  await setCode(source+'\nscene.animate("missing",{property:"opacity",keyframes:[{time:0,opacity:1}]});');await page.locator('.code-error').waitFor();await value('Position X',400);assert.equal(await page.locator('.timeline-key').count(),8);
  page.once('dialog',dialog=>dialog.accept());await page.getByTitle('Generate Code từ Canvas',{exact:true}).click();await page.getByTitle('Save · Ctrl+S',{exact:true}).click();await page.waitForFunction(()=>document.querySelector('.statusbar')?.textContent.includes('Đã lưu:'));
  const stored=await (await page.request.get(`${base}/api/projects/${name}`)).json();assert.equal(stored.scenes[0].animations[0].keyframes[1].x,800);
  await page.reload();await page.locator('.monaco-editor').waitFor();await page.getByTitle('Open Project',{exact:true}).click();await page.getByRole('dialog').getByRole('button',{name,exact:true}).click();page.once('dialog',dialog=>dialog.accept());await page.getByRole('dialog').getByRole('button',{name:'Open',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});await page.locator('.layer-row').first().click();await seek(2);await value('Position X',400);assert.equal(await page.locator('.timeline-key').count(),8);
  await page.screenshot({path:'test-results/studio-phase2.png',fullPage:true});assert.deepEqual(errors,[]);
  console.log(`PASS: animation Code Apply/Undo/Redo/rejection, schema v3, Save/Open animation after reload. Project: ${name}`);
} catch(error) {await page.screenshot({path:'test-results/animation-failure.png',fullPage:true}).catch(()=>undefined);throw error;}
finally {await browser.close();}
