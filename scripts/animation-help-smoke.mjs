import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import { pathToFileURL } from 'node:url';
const entry=process.env.STUDIO_PLAYWRIGHT_ENTRY;
const {chromium}=await import(entry ? pathToFileURL(entry).href : 'playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const base=process.env.STUDIO_TEST_URL ?? 'http://127.0.0.1:4310';
const errors=[];page.on('pageerror',error=>errors.push(error.message));
async function checkTip(label, fragment) {
  const trigger=page.getByRole('button',{name:`Giải thích: ${label}`,exact:true});await trigger.hover();
  const tooltip=page.getByRole('tooltip');await tooltip.waitFor();assert.ok((await tooltip.innerText()).includes(fragment));
  const box=await tooltip.boundingBox();const viewport=page.viewportSize();assert.ok(box && box.x>=0 && box.y>=0 && box.x+box.width<=viewport.width && box.y+box.height<=viewport.height,'Tooltip must fit viewport');
  await page.keyboard.press('Escape');await tooltip.waitFor({state:'hidden'});
}
try {
  await page.goto(base);await page.locator('.monaco-editor').waitFor();
  await checkTip('Timeline','kéo hình thoi');await checkTip('Thời lượng (s)','không tự kéo dài');await checkTip('Time / Playhead','Time không phải');
  const list=await (await page.request.get(`${base}/api/projects`)).json();const name=list.projects.filter(n=>n.startsWith('Phase2-Smoke-')).at(-1);assert.ok(name,'Run animation-smoke first');
  await page.getByTitle('Open Project',{exact:true}).click();await page.getByRole('dialog').getByRole('button',{name,exact:true}).click();page.once('dialog',dialog=>dialog.accept());await page.getByRole('dialog').getByRole('button',{name:'Open',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});await page.locator('.layer-row').first().click();
  await page.getByTitle('Animation Properties',{exact:true}).click();
  await checkTip('Move / Position','di chuyển');await checkTip('Scale','phóng to');await checkTip('Rotate','−360');await checkTip('Fade / Opacity','mờ dần');
  await checkTip('Auto Keyframe','OFF');
  const checkbox=page.getByRole('checkbox',{name:'Auto Keyframe',exact:true});const before=await checkbox.isChecked();
  await page.getByRole('button',{name:'Giải thích: Auto Keyframe',exact:true}).click();assert.equal(await checkbox.isChecked(),before,'Help click must not toggle checkbox');await page.keyboard.press('Escape');
  await checkTip('Start Time (s)','giây thứ 2');await checkTip('Animation Duration (s)','giãn/co');await checkTip('Easing','easeInOut');await checkTip('Loop','Ping Pong');await checkTip('Keyframe','hình thoi');await checkTip('Key Time (s)','toàn scene');await checkTip('Easing của key','đến key tiếp theo');
  await checkTip('Key x','sang phải');
  await page.getByRole('button',{name:'Giải thích: Easing',exact:true}).focus();await page.getByRole('tooltip').waitFor();await page.keyboard.press('Escape');await page.getByRole('tooltip').waitFor({state:'hidden'});
  await page.getByRole('combobox',{name:'Animation Easing',exact:true}).selectOption('easeIn');assert.match(await page.getByRole('combobox',{name:'Animation Easing',exact:true}).innerText(),/Nhanh dần/);
  await page.getByRole('button',{name:'Giải thích: Easing',exact:true}).hover();await page.getByRole('tooltip').waitFor();
  await fs.mkdir('test-results',{recursive:true});await page.screenshot({path:'test-results/animation-help.png',fullPage:true});
  assert.deepEqual(errors,[]);console.log('PASS: Vietnamese help on Timeline/animation/keyframe terms, hover/focus/Escape, viewport positioning, help click preserves Auto Key, translated easing choices');
} finally {await browser.close();}
