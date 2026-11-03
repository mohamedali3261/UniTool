import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { IDBFactory, IDBObjectStore } from 'fake-indexeddb';
import { File } from 'node:buffer';
import JSZip from 'jszip';
import { exportSite, prepareArchive, restoreSite } from '../src/archive';
import { openDatabase, readDatabase, mergeDatabase } from '../src/database';
import { encode, decode } from '../src/codec';
import { allowedLocal } from '../src/registry';
function newDevice() {
  Object.defineProperty(globalThis, 'indexedDB', { value: new IDBFactory(), configurable: true });
  const data = {};
  Object.defineProperties(data, {
    getItem: { value: (key: string) => Object.hasOwn(data, key) ? data[key] : null },
    setItem: { value: (key: string, value: string) => Object.defineProperty(data, key, { value: String(value), writable: true, configurable: true, enumerable: true }) },
  });
  Object.defineProperty(globalThis, 'localStorage', { value: data, configurable: true });
  Object.defineProperty(globalThis, 'File', { value: File, configurable: true });
}
beforeEach(newDevice);
async function seed() {
  localStorage.setItem('unitool.excel-studio.workbook.v1', JSON.stringify({ name: 'مبيعات', cells: { A1: 42 } }));
  localStorage.setItem('sawti_bookmarks_v1_book', '[12,45]');
  localStorage.setItem('unitool-settings', JSON.stringify({ theme: 'dark', apiKey: 'DO-NOT-EXPORT' }));
  localStorage.setItem('unitool-api_key', 'DO-NOT-EXPORT');
  const file = new File([new Uint8Array([0, 255, 18, 67])], 'clip.mp4', { type: 'video/mp4', lastModified: 123 });
  await mergeDatabase({ name: 'unitool-video-studio', stores: [
    { name: 'projects', keyPath: 'id', records: [{ key: 'video-1', value: { id: 'video-1', assetIds: ['video-1:clip'], name: 'فيديو' } }] },
    { name: 'media', keyPath: 'key', records: [{ key: 'video-1:clip', value: { key: 'video-1:clip', file, samples: new Uint16Array([2, 300]), date: new Date('2026-01-01') } }] },
  ] });
  await mergeDatabase({ name: 'designcraft-projects', stores: [
    { name: 'projects', keyPath: 'id', records: [{ key: 'design-1', value: { id: 'design-1', width: 884.4094488188978, canvasData: { objects: [{ type: 'textbox', text: 'نص قابل للتعديل' }] } } }] },
    { name: 'meta', keyPath: null, records: [{ key: 'migrated', value: true }] },
  ] });
  return exportSite();
}
test('one organized ZIP round-trips projects, binaries, precision and tool settings on another device', async () => {
  const archive = await seed();
  const zip = await JSZip.loadAsync(archive);
  assert.ok(zip.file('sections/video/unitool-video-studio.json'));
  assert.ok(zip.file('sections/sheets/settings.json'));
  assert.ok(zip.file('sections/design/designcraft-projects.json'));
  newDevice();
  const prepared = await prepareArchive(archive);
  assert.equal(prepared.records, 4);
  const result = await restoreSite(prepared);
  assert.equal(result.added, 7);
  assert.equal(result.skipped, 0);
  const video = await readDatabase('unitool-video-studio');
  const asset = video!.stores.find(s => s.name === 'media')!.records[0].value;
  assert.equal(asset.file.type, 'video/mp4');
  assert.deepEqual(Array.from(new Uint8Array(await asset.file.arrayBuffer())), [0, 255, 18, 67]);
  assert.deepEqual(Array.from(asset.samples), [2, 300]);
  assert.equal(asset.date.toISOString(), '2026-01-01T00:00:00.000Z');
  assert.equal(JSON.parse(localStorage.getItem('unitool-settings')!).apiKey, undefined);
  assert.equal(localStorage.getItem('unitool-api_key'), null);
  assert.equal((await readDatabase('designcraft-projects'))!.stores.find(s => s.name === 'projects')!.records[0].value.width, 884.4094488188978);
});
test('merge and repeated restore preserve all existing keys rather than replacing work', async () => {
  const archive = await seed();
  const prepared = await prepareArchive(archive);
  localStorage.setItem('unitool-settings', '{"theme":"new"}');
  const result = await restoreSite(prepared);
  assert.equal(result.added, 0); assert.equal(result.skipped, 7);
  assert.equal(localStorage.getItem('unitool-settings'), '{"theme":"new"}');
});
test('altered assets are rejected before any records are written', async () => {
  const zip = await JSZip.loadAsync(await seed());
  const path = Object.keys(zip.files).find(p => p.endsWith('.bin'))!;
  zip.file(path, new Uint8Array([1,2,3,4]));
  newDevice();
  await assert.rejects(prepareArchive(await zip.generateAsync({ type: 'uint8array' })), /Damaged backup/);
  assert.equal(await readDatabase('unitool-video-studio'), null);
});
test('unsupported archives, extra paths, unsafe keys and credential settings do not pass import validation', async () => {
  assert.equal(allowedLocal('unitool_auth_token'), false); assert.equal(allowedLocal('unrelated-cookie'), false);
  const data = await seed();
  const zip = await JSZip.loadAsync(data); zip.file('surprise.js', 'alert(1)');
  await assert.rejects(prepareArchive(await zip.generateAsync({ type: 'uint8array' })), /manifest/);
  const versioned = await JSZip.loadAsync(data), manifest = JSON.parse(await versioned.file('manifest.json')!.async('string'));
  manifest.version = 99; versioned.file('manifest.json', JSON.stringify(manifest));
  await assert.rejects(prepareArchive(await versioned.generateAsync({ type: 'uint8array' })), /manifest/);
  await assert.rejects(decode(['object', [['__proto__', ['scalar', 'bad']]]], async () => new Uint8Array()), /Unsafe/);
});
test('codec handles shared references without inventing cycles and rejects real cycles', async () => {
  const value = { a: 1 }, data = await encode([value, value, undefined, new Set(['a']), new Map([['key', 2]])], async () => 'none');
  const restored = await decode(data, async () => new Uint8Array());
  assert.deepEqual(restored.slice(0, 3), [{ a: 1 }, { a: 1 }, undefined]);
  assert.equal(restored[4].get('key'), 2);
  const cycle: any = {}; cycle.self = cycle;
  await assert.rejects(encode(cycle, async () => 'none'), /cyclic/);
});
test('missing databases are not left behind by a backup scan', async () => {
  await exportSite();
  assert.deepEqual(await indexedDB.databases(), []);
});
test('a transaction failure rolls back its database and reports a partial restore honestly', async () => {
  const prepared = await prepareArchive(await seed());
  newDevice();
  const original = IDBObjectStore.prototype.add;
  IDBObjectStore.prototype.add = function(...args: any[]) {
    if (this.name === 'media') { this.transaction.abort(); throw Error('QuotaExceededError'); }
    return original.apply(this, args as any);
  };
  try {
    await assert.rejects(restoreSite(prepared), /Restoration stopped/);
    const video = await readDatabase('unitool-video-studio');
    assert.equal(video!.stores.flatMap(s => s.records).length, 0);
    assert.equal(localStorage.getItem('sawti_bookmarks_v1_book'), null);
  } finally { IDBObjectStore.prototype.add = original; }
});

test('re-signed archives still reject mismatched record IDs and credential settings', async () => {
  const original = await seed();
  async function alter(path: string, edit: (value: any) => void) {
    const zip = await JSZip.loadAsync(original), manifest = JSON.parse(await zip.file('manifest.json')!.async('string'));
    const value = JSON.parse(await zip.file(path)!.async('string')); edit(value);
    const data = new TextEncoder().encode(JSON.stringify(value));
    zip.file(path, data);
    const entry = manifest.entries.find((e:any) => e.path === path);
    entry.size = data.byteLength;
    entry.sha256 = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', data))).map(n => n.toString(16).padStart(2,'0')).join('');
    zip.file('manifest.json', JSON.stringify(manifest));
    return zip.generateAsync({type:'uint8array'});
  }
  const mismatched = await alter('sections/video/unitool-video-studio.json', value => { value.stores.find((s:any)=>s.name==='projects').records[0].key=['scalar','other-id']; });
  const forbidden = await alter('sections/settings/settings.json', value => { value.push(['unitool-api_key','MUST-NOT-IMPORT']); });
  newDevice();
  await assert.rejects(prepareArchive(mismatched), /ID mismatch/);
  await assert.rejects(prepareArchive(forbidden), /Unsafe settings/);
  assert.equal(await readDatabase('unitool-video-studio'), null);
});

test('identical binary bytes are archived once without losing per-file metadata', async () => {
  await mergeDatabase({name:'unitool-video-studio',stores:[
    {name:'projects',keyPath:'id',records:[]},
    {name:'media',keyPath:'key',records:[
      {key:'one',value:{key:'one',name:'one.mp4',file:new File(['same-media'],'one.mp4',{type:'video/mp4'})}},
      {key:'two',value:{key:'two',name:'two.bin',file:new File(['same-media'],'two.bin',{type:'application/octet-stream'})}},
    ]},
  ]});
  const archive = await exportSite(), zip = await JSZip.loadAsync(archive);
  assert.equal(Object.keys(zip.files).filter(p=>p.endsWith('.bin')).length,1);
  newDevice(); await restoreSite(await prepareArchive(archive));
  const rows = (await readDatabase('unitool-video-studio'))!.stores.find(s=>s.name==='media')!.records;
  assert.equal(rows[0].value.name,'one.mp4'); assert.equal(rows[1].value.name,'two.bin');
  assert.equal(rows[1].value.file.type,'application/octet-stream');
  assert.equal(await rows[0].value.file.text(),'same-media'); assert.equal(await rows[1].value.file.text(),'same-media');
});

test('the binary codec retains native file names and modification time', async () => {
  let bytes = new Uint8Array();
  const encoded = await encode(new File(['same'], 'source.mp4', { type: 'video/mp4', lastModified: 123 }), async blob => { bytes = new Uint8Array(await blob.arrayBuffer()); return 'assets/video/0.bin'; });
  const restored = await decode(encoded, async () => bytes);
  assert.equal(restored.name, 'source.mp4'); assert.equal(restored.lastModified, 123);
});
