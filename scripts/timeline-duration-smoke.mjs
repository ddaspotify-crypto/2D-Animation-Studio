import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const entry=process.env.STUDIO_PLAYWRIGHT_ENTRY;
const {chromium}=await import(entry ? pathToFileURL(entry).href : 'playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1000}});
const errors=[];page.on('pageerror',error=>errors.push(error.message));
const base=process.env.STUDIO_TEST_URL ?? 'http://127.0.0.1:4310';
const name=`Duration-Smoke-${Date.now()}`;
async function duration(seconds) {
  const field=page.getByRole('spinbutton',{name:'Thời lượng (s)',exact:true});
  await field.fill(String(seconds));await field.press('Enter');
  await page.waitForFunction(value=>Number(document.querySelector('input[aria-label="Thời lượng (s)"]')?.value)===value,seconds);
}
try {
  await page.goto(base);await page.locator('.monaco-editor').waitFor();
  await duration(60);
  assert.equal(await page.getByRole('spinbutton',{name:'Duration (s)',exact:true}).inputValue(),'60');
  assert.equal(await page.locator('.ruler').evaluate(element=>element.style.width),'4200px');
  await page.getByRole('spinbutton',{name:'Playhead Time',exact:true}).fill('45');
  assert.equal(await page.getByRole('spinbutton',{name:'Playhead Time',exact:true}).inputValue(),'45');
  assert.equal(await page.getByRole('spinbutton',{name:'Playhead Time',exact:true}).getAttribute('max'),'60');
  await page.getByTitle('Undo · Ctrl+Z',{exact:true}).click();assert.equal(await page.getByRole('spinbutton',{name:'Thời lượng (s)',exact:true}).inputValue(),'10');
  await page.getByTitle('Redo · Ctrl+Y',{exact:true}).click();assert.equal(await page.getByRole('spinbutton',{name:'Thời lượng (s)',exact:true}).inputValue(),'60');
  await duration(120);assert.equal(await page.getByRole('spinbutton',{name:'Playhead Time',exact:true}).getAttribute('max'),'120');
  await duration(60);
  await page.getByTitle('Save · Ctrl+S',{exact:true}).click();await page.getByRole('textbox',{name:'Tên thư mục project',exact:true}).fill(name);await page.getByRole('dialog').getByRole('button',{name:'Save',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});
  const saved=await (await page.request.get(`${base}/api/projects/${name}`)).json();assert.equal(saved.scenes[0].duration,60);
  await page.reload();await page.locator('.monaco-editor').waitFor();await page.getByTitle('Open Project',{exact:true}).click();await page.getByRole('dialog').getByRole('button',{name,exact:true}).click();page.once('dialog',dialog=>dialog.accept());await page.getByRole('dialog').getByRole('button',{name:'Open',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});assert.equal(await page.getByRole('spinbutton',{name:'Thời lượng (s)',exact:true}).inputValue(),'60');
  assert.deepEqual(errors,[]);console.log(`PASS: Timeline duration 60/120s, ruler/playhead limits, Properties sync, Undo/Redo, Save/Open. Project: ${name}`);
} finally {await browser.close();}
