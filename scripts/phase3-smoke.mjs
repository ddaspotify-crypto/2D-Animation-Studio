import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { pathToFileURL } from 'node:url';
import { evaluateSceneAtTime } from '../dist-server/shared/animationEngine.js';
const entry=process.env.STUDIO_PLAYWRIGHT_ENTRY;
const {chromium}=await import(entry?pathToFileURL(entry).href:'playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1680,height:1100}}),base='http://127.0.0.1:4310';
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await fs.mkdir('test-results',{recursive:true});
const name=`Phase3-Smoke-${Date.now()}`;
async function value(label,expected){await page.waitForFunction(({label,expected})=>{const input=document.querySelector(`input[aria-label="${label}"]`);return input&&Math.abs(Number(input.value)-expected)<.05;},{label,expected});}
async function number(label,n){const input=page.getByRole('spinbutton',{name:label,exact:true});await input.fill(String(n));await input.press('Enter');await value(label,n);}
async function seek(n){await page.getByRole('spinbutton',{name:'Playhead Time',exact:true}).fill(String(n));}
async function code(source){await page.locator('.monaco-editor').click({position:{x:100,y:20}});await page.keyboard.press('Control+Home');await page.keyboard.press('Control+A');await page.keyboard.insertText(source);await page.getByTitle('Apply Code',{exact:true}).click();}
async function selectLayer(label){await page.locator('.layer-row').filter({has:page.locator('span',{hasText:new RegExp(`^${label}$`)})}).click();}
function crc(bytes){let c=0xffffffff;for(const b of bytes){c^=b;for(let i=0;i<8;i++)c=(c>>>1)^(c&1?0xedb88320:0);}return (c^0xffffffff)>>>0;}
function chunk(type,data){const t=Buffer.from(type),a=Buffer.alloc(4),b=Buffer.alloc(4);a.writeUInt32BE(data.length);b.writeUInt32BE(crc(Buffer.concat([t,data])));return Buffer.concat([a,t,data,b]);}
function png(){const h=Buffer.alloc(13);h.writeUInt32BE(80,0);h.writeUInt32BE(140,4);h[8]=8;h[9]=6;const raw=Buffer.alloc(140*321);for(let y=0;y<140;y++)for(let x=0;x<80;x++){const i=y*321+x*4+1;raw[i]=240;raw[i+1]=155;raw[i+2]=70;raw[i+3]=255;}return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',h),chunk('IDAT',deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);}
function sourceOf(project){const s=project.scenes[0],{layers,animations,motionPaths,poseSets,poseTracks,...options}=s;let source=`const scene=createScene(${JSON.stringify(options)});\n`;for(const l of layers){const a=project.assets.find(a=>a.id===l.assetId);source+=`scene.addImage(${JSON.stringify({id:l.id,name:l.name,asset:a.path,...l.transform,opacity:l.opacity,visible:l.visible,locked:l.locked,attachments:l.attachments})});\n`;}for(const a of animations){const {layerId,...options}=a;source+=`scene.animate(${JSON.stringify(layerId)},${JSON.stringify(options)});\n`;}for(const p of motionPaths){const {layerId,...options}=p;source+=`scene.motionPath(${JSON.stringify(layerId)},${JSON.stringify(options)});\n`;}for(const p of poseSets)source+=`scene.poseSet(${JSON.stringify(p)});\n`;for(const p of poseTracks){const {layerId,...options}=p;source+=`scene.poseTrack(${JSON.stringify(layerId)},${JSON.stringify(options)});\n`;}for(const l of layers)if(l.binding)source+=`scene.bind(${JSON.stringify(l.id)},${JSON.stringify(l.binding)});\n`;return source;}
try{
  await page.goto(base);await page.locator('.monaco-editor').waitFor();
  const list=await(await page.request.get(`${base}/api/projects`)).json(),fixture=list.projects.filter(n=>n.startsWith('Smoke-')).at(-1);assert.ok(fixture);
  await page.getByTitle('Open Project',{exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:fixture,exact:true}).click();page.once('dialog',d=>d.accept());await page.getByRole('dialog').getByRole('button',{name:'Open',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});
  const original=await(await page.request.get(`${base}/api/projects/${fixture}`)).json(),asset=original.assets[0];
  await code(`const scene=createScene({width:1920,height:1080,fps:30,duration:10});scene.addImage({id:"hero",name:"Hero",asset:${JSON.stringify(asset.path)},x:200,y:250,width:120,height:80});`);await selectLayer('Hero');
  await page.getByTitle('Tạo Motion Path',{exact:true}).click();await seek(2);await value('Position X',400);assert.equal(await page.locator('.path-bar').count(),1);await seek(0);
  await page.getByRole('combobox',{name:'Motion Path Type',exact:true}).selectOption('bezier');await page.getByTitle('Tạo Motion Path',{exact:true}).click();
  const rect=await page.locator('.canvas-workspace').boundingBox(),zoom=Math.min((rect.width-100)/1920,(rect.height-100)/1080),ox=rect.x+(rect.width-1920*zoom)/2,oy=rect.y+(rect.height-1080*zoom)/2;
  await page.mouse.move(ox+200*zoom-11,oy+250*zoom);await page.mouse.down();await page.mouse.move(ox+230*zoom,oy+280*zoom,{steps:8});await page.mouse.up();
  assert.ok(Number(await page.getByRole('spinbutton',{name:'Điểm bám X (0–1)',exact:true}).inputValue())>.1);assert.ok(Number(await page.getByRole('spinbutton',{name:'Điểm bám Y (0–1)',exact:true}).inputValue())>.1);
  await page.getByRole('button',{name:'Theo Pivot',exact:true}).click();
  await page.mouse.move(ox+200*zoom,oy+250*zoom);await page.mouse.down();await page.mouse.move(ox+250*zoom,oy+270*zoom,{steps:8});await page.mouse.up();assert.ok(Math.abs(Number(await page.getByRole('spinbutton',{name:'Path Point X',exact:true}).inputValue())-250)<4);await number('Path Point X',250);await number('Path Point Y',270);
  await page.getByRole('button',{name:'+ Điểm',exact:true}).click();assert.equal(await page.getByRole('combobox',{name:'Path Point',exact:true}).locator('option').count(),3);await page.getByRole('button',{name:'Xóa điểm',exact:true}).click();
  for(const type of ['circle','ellipse','polyline','freehand']){await page.getByRole('combobox',{name:'Motion Path Type',exact:true}).selectOption(type);await page.getByTitle('Tạo Motion Path',{exact:true}).click();}
  await page.getByTitle('Vẽ Freehand trên Canvas',{exact:true}).click();await page.mouse.move(ox+300*zoom,oy+400*zoom);await page.mouse.down();await page.mouse.move(ox+450*zoom,oy+300*zoom,{steps:10});await page.mouse.move(ox+600*zoom,oy+400*zoom,{steps:10});await page.mouse.up();await page.getByRole('combobox',{name:'Path Point',exact:true}).selectOption('0');assert.ok(Math.abs(Number(await page.getByRole('spinbutton',{name:'Path Point X',exact:true}).inputValue())-300)<4);await number('Path Point X',300);await number('Path Point Y',400);
  await page.getByRole('combobox',{name:'Motion Path Type',exact:true}).selectOption('line');await page.getByTitle('Tạo Motion Path',{exact:true}).click();
  await page.getByRole('checkbox',{name:'Reverse Motion Path',exact:true}).check();await value('Position X',700);await page.getByRole('checkbox',{name:'Reverse Motion Path',exact:true}).uncheck();
  await page.getByRole('checkbox',{name:'Orient to Path',exact:true}).check();await page.getByRole('checkbox',{name:'Show Motion Path',exact:true}).uncheck();await page.getByRole('checkbox',{name:'Show Motion Path',exact:true}).check();
  console.log('PASS: six path types, Canvas point drag, add/delete point, freehand drawing, reverse/orient/show, path Timeline');
  await page.locator('input[type=file]').first().setInputFiles({name:'pose-alt.png',mimeType:'image/png',buffer:png()});await page.locator('.asset-card').filter({hasText:'pose-alt.png'}).waitFor();
  await page.getByTitle('Tạo Pose Set',{exact:true}).click();await number('Pose Anchor X',.5);await number('Pose Anchor Y',1);
  await page.getByRole('combobox',{name:'Pose Asset',exact:true}).selectOption({label:'pose-alt.png'});await page.getByTitle('Thêm ảnh vào Pose Set',{exact:true}).click();await number('Pose Anchor X',.5);await number('Pose Anchor Y',1);await seek(2);await page.getByTitle('Đặt Pose tại Playhead',{exact:true}).click();await value('Width',80);await value('Height',140);assert.equal(await page.locator('.pose-key').count(),2);
  await seek(1);await value('Width',120);await seek(2);await value('Width',80);
  const poseKey=page.locator('.pose-key').last(),pk=await poseKey.boundingBox();await page.mouse.move(pk.x+7,pk.y+7);await page.mouse.down();await page.mouse.move(pk.x+42,pk.y+7,{steps:6});await page.mouse.up();await seek(2);await value('Width',120);await seek(2.5);await value('Width',80);
  console.log('PASS: import alternate pose, shared/per-pose anchor, switching/scrub and drag Pose Timeline key');
  await seek(0);await selectLayer('Hero');await page.getByTitle('Thêm Attachment Point',{exact:true}).click();
  await page.locator('.asset-card').filter({hasText:asset.name}).dblclick();const nameField=page.getByRole('textbox',{name:'Layer Name',exact:true});await nameField.fill('Accessory');await nameField.press('Enter');await selectLayer('Accessory');await number('Position X',350);await number('Position Y',250);
  await page.getByRole('combobox',{name:'Parent Layer',exact:true}).selectOption({label:'Hero'});await value('Position X',350);await seek(2);await value('Position X',550);await seek(0);
  await page.getByRole('combobox',{name:'Bind Mode',exact:true}).selectOption('transform');await page.getByRole('combobox',{name:'Bind Attachment',exact:true}).selectOption({label:'Center'});await value('Position X',350);
  await selectLayer('Hero');await page.getByTitle('Thêm Scale',{exact:true}).click();await page.getByTitle('Thêm Rotate',{exact:true}).click();await seek(2);await selectLayer('Accessory');await value('Scale X',1.5);await value('Rotation (°)',90);
  await seek(0);await selectLayer('Hero');await page.getByTitle('Thêm Z-order · Trước/sau',{exact:true}).click();await number('Key zOrder',5);
  const tooltipTrigger=page.getByRole('button',{name:'Giải thích: Motion Path',exact:true});await tooltipTrigger.hover();await page.getByRole('tooltip').waitFor();assert.match(await page.getByRole('tooltip').innerText(),/đường ảnh/);await page.keyboard.press('Escape');
  console.log('PASS: Parent/Bind modes/Attachment with moving/rotating/scaling parent, Z-order keys and Vietnamese help');
  const zRow=page.locator('[data-track-kind="animation"]').filter({has:page.getByRole('button',{name:'Z-order · Trước/sau',exact:true})});
  await zRow.locator('.track-label').click({button:'right'});await page.getByRole('menuitem',{name:'Mở Properties của track này',exact:true}).click();assert.equal(await page.getByRole('combobox',{name:'Animation Track',exact:true}).inputValue(),await zRow.getAttribute('data-track-id'));
  await zRow.locator('.timeline-key').first().click({button:'right'});await page.getByRole('menuitem',{name:'Xóa keyframe đang chọn',exact:true}).click();assert.equal(await zRow.locator('.timeline-key').count(),1);await page.getByTitle('Undo · Ctrl+Z',{exact:true}).click();
  await zRow.locator('.track-label').click({button:'right'});await page.getByRole('menuitem',{name:'Xóa animation này',exact:true}).click();assert.equal(await zRow.count(),0);await page.getByTitle('Undo · Ctrl+Z',{exact:true}).click();assert.equal(await zRow.count(),1);
  await page.locator('.path-bar').click({button:'right'});await page.getByRole('menuitem',{name:'Xóa Motion Path',exact:true}).click();assert.equal(await page.locator('.path-bar').count(),0);await page.getByTitle('Undo · Ctrl+Z',{exact:true}).click();assert.equal(await page.locator('.path-bar').count(),1);
  await page.locator('.pose-key').last().click({button:'right'});await page.getByRole('menuitem',{name:'Xóa keyframe đang chọn',exact:true}).click();assert.equal(await page.locator('.pose-key').count(),1);await page.getByTitle('Undo · Ctrl+Z',{exact:true}).click();assert.equal(await page.locator('.pose-key').count(),2);
  await selectLayer('Hero');await page.getByRole('button',{name:'Tâm ảnh',exact:true}).click();await value('Điểm bám X (0–1)',.5);await value('Điểm bám Y (0–1)',.5);
  console.log('PASS: Timeline context Properties/key deletion/track deletion with Undo; custom Motion Path image follow point');
  const flipX=page.getByRole('button',{name:'Lật ngang',exact:true}),flipY=page.getByRole('button',{name:'Lật dọc',exact:true});
  await flipX.click();assert.equal(await flipX.getAttribute('aria-pressed'),'true');
  await page.getByTitle('Undo · Ctrl+Z',{exact:true}).click();await selectLayer('Hero');assert.equal(await flipX.getAttribute('aria-pressed'),'false');
  await page.getByTitle('Redo · Ctrl+Y',{exact:true}).click();await selectLayer('Hero');assert.equal(await flipX.getAttribute('aria-pressed'),'true');
  await flipY.click();assert.equal(await flipY.getAttribute('aria-pressed'),'true');await flipY.click();assert.equal(await flipY.getAttribute('aria-pressed'),'false');
  await page.getByTitle('Save As',{exact:true}).click();await page.getByRole('textbox',{name:'Tên thư mục project',exact:true}).fill(name);await page.getByRole('dialog').getByRole('button',{name:'Save',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});
  const saved=await(await page.request.get(`${base}/api/projects/${name}`)).json(),scene=saved.scenes[0];assert.equal(saved.schemaVersion,4);assert.equal(scene.motionPaths.length,1);assert.equal(scene.poseTracks.length,1);assert.ok(scene.layers.find(l=>l.name==='Accessory').binding.attachmentId);assert.deepEqual(evaluateSceneAtTime(scene,2).layers.at(-1).id,'hero');
  assert.equal(scene.layers.find(l=>l.id==='hero').transform.flipX,true);assert.equal(scene.layers.find(l=>l.id==='hero').transform.flipY,false);
  assert.deepEqual(scene.motionPaths[0].followPoint,{x:.5,y:.5});
  const modified=structuredClone(saved);modified.scenes[0].motionPaths[0].points[1].x+=200;await code(sourceOf(modified));await seek(2);await selectLayer('Hero');const expected=evaluateSceneAtTime(modified.scenes[0],2).layers.find(l=>l.id==='hero');await value('Position X',expected.transform.x);
  await page.getByTitle('Undo · Ctrl+Z',{exact:true}).click();await selectLayer('Hero');await value('Position X',evaluateSceneAtTime(scene,2).layers.find(l=>l.id==='hero').transform.x);await page.getByTitle('Redo · Ctrl+Y',{exact:true}).click();
  await code(sourceOf(modified)+'scene.bind("hero",{parentId:"hero",mode:"transform"});');await page.locator('.code-error').waitFor();await selectLayer('Hero');await value('Position X',expected.transform.x);
  page.once('dialog',d=>d.accept());await page.getByTitle('Generate Code từ Canvas',{exact:true}).click();await page.getByTitle('Save · Ctrl+S',{exact:true}).click();await page.waitForFunction(()=>document.querySelector('.statusbar')?.textContent.includes('Đã lưu:'));
  await page.reload();await page.locator('.monaco-editor').waitFor();await page.getByTitle('Open Project',{exact:true}).click();await page.getByRole('dialog').getByRole('button',{name,exact:true}).click();page.once('dialog',d=>d.accept());await page.getByRole('dialog').getByRole('button',{name:'Open',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});await seek(2);await selectLayer('Hero');await value('Position X',expected.transform.x);assert.equal(await page.locator('.pose-key').count(),2);
  assert.equal(await flipX.getAttribute('aria-pressed'),'true');assert.equal(await flipY.getAttribute('aria-pressed'),'false');
  await page.screenshot({path:'test-results/studio-phase3.png',fullPage:true});assert.deepEqual(errors,[]);console.log(`PASS: Phase 3 Code Apply/Undo/Redo/invalid graph preservation, horizontal/vertical flip, Save/Open/reload. Project: ${name}`);
}catch(error){await page.screenshot({path:'test-results/phase3-failure.png',fullPage:true}).catch(()=>undefined);throw error;}finally{await browser.close();}
