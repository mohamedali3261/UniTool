import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import JSZip from 'jszip';
const base = process.env.SITE_QA_URL || 'http://localhost:4174';
test('a real ZIP transfers editable design, media Blob and preferences to a second browser context', async ({ browser }) => {
  const source = await browser.newContext();
  const page = await source.newPage();
  await page.addInitScript(() => localStorage.setItem('unitool-lang','en'));
  await page.goto(base + '/designcraft.html');
  await page.locator('#designer-project-input').setInputFiles({ name: 'transfer.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ format: 'unitool-designcraft', version: 1, project: { title: 'Cross-device editable QA', width: 800, height: 600, canvasData: { objects: [{ type: 'textbox', left: 80, top: 100, width: 200, fontSize: 30, text: 'نص محفوظ عربي', fill: '#000000' }] } } })) });
  await expect(page.locator('canvas.upper-canvas')).toBeVisible();
  await expect(page.getByTestId('design-save-status')).toHaveText('No unsaved changes');
  await page.evaluate(async () => {
    localStorage.setItem('sawti_bookmarks_v1_qa', '[20,40]');
    localStorage.setItem('unitool-api_key', 'DO-NOT-EXPORT');
    const db = await new Promise<IDBDatabase>((resolve,reject) => { const r=indexedDB.open('unitool-video-studio',1); r.onupgradeneeded=()=>{r.result.createObjectStore('projects',{keyPath:'id'});r.result.createObjectStore('media',{keyPath:'key'});};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error); });
    await new Promise<void>((resolve,reject)=>{const tx=db.transaction(['projects','media'],'readwrite');tx.objectStore('projects').put({id:'portable-video',name:'QA',assetIds:['portable-video:clip','portable-video:copy']});tx.objectStore('media').put({key:'portable-video:clip',file:new Blob([new Uint8Array([0,1,255,10])],{type:'video/mp4'})});tx.objectStore('media').put({key:'portable-video:copy',file:new File([new Uint8Array([0,1,255,10])],'copy.bin',{type:'application/octet-stream',lastModified:123})});tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error);});db.close();
  });
  await page.goto(base + '/storage.html');
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download full ZIP backup', exact: true }).click();
  const bytes = await fs.readFile((await (await pending).path())!);
  const zip = await JSZip.loadAsync(bytes);
  expect(zip.file('sections/video/unitool-video-studio.json')).toBeTruthy();
  expect(Object.keys(zip.files).filter(path=>path.endsWith('.bin'))).toHaveLength(1);
  const manifest = JSON.parse(await zip.file('manifest.json')!.async('string'));
  expect(manifest.format).toBe('unitool-site-backup');
  for (const entry of manifest.entries.filter((e:any)=>e.path.endsWith('.json'))) expect(await zip.file(entry.path)!.async('string')).not.toContain('DO-NOT-EXPORT');
  const destination = await browser.newContext({ viewport: { width:390,height:844 }, isMobile: true, hasTouch: true });
  const target = await destination.newPage();
  await target.addInitScript(()=>localStorage.setItem('unitool-lang','en'));
  await target.goto(base + '/storage.html');
  await target.getByTestId('backup-input').setInputFiles({ name:'backup.zip',mimeType:'application/zip',buffer:bytes });
  await expect(target.getByTestId('backup-preview')).toBeVisible();
  await expect(target.getByRole('button',{name:'Confirm safe restore',exact:true})).toBeDisabled();
  expect(await target.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await target.getByRole('checkbox').check();
  await target.getByRole('button',{name:'Confirm safe restore',exact:true}).click();
  await expect(target.getByRole('status')).toContainText('Restore complete');
  const binary = await target.evaluate(async()=>{
    const db=await new Promise<IDBDatabase>(resolve=>{const r=indexedDB.open('unitool-video-studio');r.onsuccess=()=>resolve(r.result);});
    const record=await new Promise<any>(resolve=>{const r=db.transaction('media').objectStore('media').get('portable-video:clip');r.onsuccess=()=>resolve(r.result);});
    const copy=await new Promise<any>(resolve=>{const r=db.transaction('media').objectStore('media').get('portable-video:copy');r.onsuccess=()=>resolve(r.result);});db.close();
    return { copyName:copy.file.name, copyType:copy.file.type, copyTime:copy.file.lastModified, bytes:Array.from(new Uint8Array(await record.file.arrayBuffer())),type:record.file.type,bookmarks:localStorage.getItem('sawti_bookmarks_v1_qa'),key:localStorage.getItem('unitool-api_key') };
  });
  expect(binary).toEqual({copyName:'copy.bin',copyType:'application/octet-stream',copyTime:123,bytes:[0,1,255,10],type:'video/mp4',bookmarks:'[20,40]',key:null});
  await target.goto(base + '/designcraft.html');
  await target.getByRole('button', { name: /^My Projects/ }).click();
  await expect(target.getByText('Cross-device editable QA',{exact:true}).first()).toBeVisible();
  await target.getByText('Cross-device editable QA',{exact:true}).first().click();
  await expect(target.locator('canvas.upper-canvas')).toBeVisible();
  await target.reload();
  await target.getByRole('button', { name: /^My Projects/ }).click();
  await expect(target.getByText('Cross-device editable QA',{exact:true}).first()).toBeVisible();
  await source.close(); await destination.close();
});
test('retired studios are absent from navigation and malformed backups cannot enable restoration', async ({ page }) => {
  await page.goto(base + '/');
  await expect(page.locator('a[href="/text-studio/"], a[href="/pdf-studio/"]')).toHaveCount(0);
  await expect(page.locator('.home-footer a[href="/storage.html"]')).toBeVisible();
  for (const path of ['/text-studio/','/pdf-studio/']) { await page.goto(base+path); await page.waitForURL('**/index.html'); }
  await page.goto(base+'/storage.html');
  await page.getByTestId('backup-input').setInputFiles({name:'bad.zip',mimeType:'application/zip',buffer:Buffer.from('not a ZIP')});
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByTestId('backup-preview')).toHaveCount(0);
  await expect(page.getByRole('checkbox')).toHaveCount(0);
});

test('space overview counts records without reading full project/media values or creating empty databases', async ({ page }) => {
  await page.setViewportSize({width:320,height:844});
  await page.addInitScript(()=>localStorage.setItem('unitool-lang','en'));
  await page.goto(base+'/storage.html');
  await expect(page.getByRole('button',{name:'Refresh storage usage',exact:true})).toBeEnabled();
  await page.evaluate(async()=>{
    localStorage.setItem('unitool-usage-qa','x'.repeat(10240));
    const db=await new Promise<IDBDatabase>(resolve=>{const r=indexedDB.open('unitool-video-studio',1);r.onupgradeneeded=()=>{r.result.createObjectStore('projects',{keyPath:'id'});r.result.createObjectStore('media',{keyPath:'key'});};r.onsuccess=()=>resolve(r.result);});
    await new Promise<void>(resolve=>{const tx=db.transaction('media','readwrite');tx.objectStore('media').put({key:'test',file:new Blob(['test'])});tx.oncomplete=()=>resolve();});db.close();
    for(const method of ['getAll','openCursor','get'] as const) IDBObjectStore.prototype[method]=function(){throw Error('Overview must not read saved values');} as any;
  });
  await page.getByRole('button',{name:'Refresh storage usage',exact:true}).click();
  await expect(page.getByTestId('storage-sections')).toContainText('unitool-video-studio · 1 records');
  await expect(page.getByTestId('storage-sections')).toContainText('20.1 KB');
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect((await page.evaluate(()=>indexedDB.databases())).map(d=>d.name)).toEqual(['unitool-video-studio']);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await expect(page.getByText('Usually settings only.',{exact:false})).toBeVisible();
});
