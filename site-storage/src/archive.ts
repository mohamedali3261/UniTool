import JSZip from 'jszip';
import { DATABASES, allowedLocal, sectionFor, safeLocalValue } from './registry';
import { encode, decode } from './codec';
import { readDatabase, mergeDatabase, type DatabaseDump } from './database';
export const LIMIT = 128 * 1024 * 1024;
const MAX_FILES = 20000, MAX_RECORDS = 50000;
type Entry = { path: string; size: number; sha256: string; kind: 'local' | 'database' | 'binary' };
export type Manifest = { format: 'unitool-site-backup'; version: 1; created: string; entries: Entry[] };
export type Prepared = { manifest: Manifest; databases: DatabaseDump[]; local: [string, string][]; records: number; bytes: number };
function keyIdentity(key: IDBValidKey): string {
  if (key instanceof Date) return 'date:' + key.getTime();
  if (Array.isArray(key)) return 'array:' + JSON.stringify(key.map(keyIdentity));
  if (key instanceof ArrayBuffer || ArrayBuffer.isView(key)) {
    const view = key instanceof ArrayBuffer ? new Uint8Array(key) : new Uint8Array(key.buffer, key.byteOffset, key.byteLength);
    return 'bytes:' + Array.from(view).join(',');
  }
  return typeof key + ':' + key;
}
const utf8 = new TextEncoder();
const hash = async (data: Uint8Array) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', data.slice().buffer))).map(n => n.toString(16).padStart(2, '0')).join('');
const json = (v: any) => utf8.encode(JSON.stringify(v));
const validPath = (path: string) => typeof path === 'string' && /^(sections\/(design|logos|video|sheets|audio|svg|cv|settings)\/[a-zA-Z0-9_.-]+\.json|assets\/(design|logos|video|sheets|audio|svg|cv|settings)\/\d+\.bin)$/.test(path) && !path.includes('..');
export async function exportSite(progress: (text: string) => void = () => {}) {
  const zip = new JSZip();
  const entries: Entry[] = [];
  let bytes = 0, serial = 0, recordCount = 0, logicalBinaryBytes = 0, jsonBytes = 0;
  const binaryPaths = new Map<string, string>();
  const add = async (path: string, data: Uint8Array, kind: Entry['kind'], digest?: string) => {
    if (kind !== 'binary') jsonBytes += data.byteLength;
    if (jsonBytes + logicalBinaryBytes > LIMIT) throw Error('Backup exceeds 128 MB logical safety limit');
    bytes += data.byteLength;
    if (bytes > LIMIT || entries.length >= MAX_FILES) throw Error('النسخة تتجاوز حد 128 MB. انقل الملفات الكبيرة من أدواتها / Backup exceeds 128 MB safety limit');
    entries.push({ path, size: data.byteLength, sha256: digest || await hash(data), kind });
    zip.file(path, data);
  };
  const local = new Map<string, [string, string][]>();
  for (const key of Object.keys(localStorage).sort()) {
    if (!allowedLocal(key)) continue;
    const group = sectionFor(key), rows = local.get(group) || [];
    const value = localStorage.getItem(key);
    if (value !== null) rows.push([key, safeLocalValue(value)]);
    local.set(group, rows);
  }
  for (const [group, rows] of local) await add(`sections/${group}/settings.json`, json(rows), 'local');
  for (const [name, config] of Object.entries(DATABASES)) {
    progress(name);
    const dump = await readDatabase(name);
    if (!dump) continue;
    for (const store of dump.stores) {
      recordCount += store.records.length;
      if (recordCount > MAX_RECORDS) throw Error('Too many records');
      const rows = [];
      const binary = async (blob: Blob) => {
        logicalBinaryBytes += blob.size;
        if (logicalBinaryBytes + jsonBytes > LIMIT) throw Error('Backup exceeds 128 MB safety limit');
        const data = new Uint8Array(await blob.arrayBuffer()), digest = await hash(data);
        const existing = binaryPaths.get(digest);
        if (existing) return existing;
        const path = `assets/${config.section}/${serial++}.bin`;
        await add(path, data, 'binary', digest); binaryPaths.set(digest, path); return path;
      };
      for (const row of store.records) rows.push({ key: await encode(row.key, binary), value: await encode(row.value, binary) });
      store.records = rows;
    }
    await add(`sections/${config.section}/${name}.json`, json(dump), 'database');
  }
  const manifest: Manifest = { format: 'unitool-site-backup', version: 1, created: new Date().toISOString(), entries };
  zip.file('manifest.json', json(manifest));
  progress('ZIP');
  return zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE', compressionOptions: { level: 6 } });
}
/** Fully validate and decode the whole archive before permitting any writes. */
export async function prepareArchive(input: Uint8Array): Promise<Prepared> {
  if (input.byteLength > LIMIT) throw Error('Archive too large / الملف كبير جدًا');
  const zip = await JSZip.loadAsync(input, { createFolders: false });
  const files = Object.values(zip.files).filter(f => !f.dir);
  if (files.length > MAX_FILES) throw Error('Too many archive entries');
  let total = 0;
  for (const file of files) {
    const rawName = (file as any).unsafeOriginalName;
    if (rawName && rawName !== file.name) throw Error('Unsafe archive path');
    const size = (file as any)._data?.uncompressedSize;
    if (!Number.isSafeInteger(size) || size < 0) throw Error('Invalid archive size');
    total += size;
    if (total > LIMIT || (file.name === 'manifest.json' && size > 4 * 1024 * 1024)) throw Error('Expanded archive too large');
  }
  const manifestFile = zip.file('manifest.json');
  if (!manifestFile) throw Error('Not a UniTool backup / ليست نسخة احتياطية للموقع');
  const manifest = JSON.parse(await manifestFile.async('string')) as Manifest;
  if (manifest.format !== 'unitool-site-backup' || manifest.version !== 1 || !Array.isArray(manifest.entries) || manifest.entries.length + 1 !== files.length || !Number.isFinite(Date.parse(manifest.created))) throw Error('Unsupported backup manifest');
  const content = new Map<string, Uint8Array>();
  for (const entry of manifest.entries) {
    if (!validPath(entry.path) || content.has(entry.path) || !['local', 'database', 'binary'].includes(entry.kind) || !Number.isSafeInteger(entry.size) || entry.size < 0 || !/^[a-f0-9]{64}$/.test(entry.sha256)) throw Error('Invalid backup entry');
    const file = zip.file(entry.path);
    if (!file || (file as any)._data.uncompressedSize !== entry.size) throw Error('Missing or mismatched backup file');
    const data = await file.async('uint8array');
    if (data.byteLength !== entry.size || await hash(data) !== entry.sha256) throw Error('Damaged backup / ملف النسخة تالف');
    content.set(entry.path, data);
  }
  const databases: DatabaseDump[] = [], local: [string, string][] = [];
  const dbNames = new Set(), localKeys = new Set();
  let records = 0;
  let decodedBinaryBytes = 0;
  const metadataBytes = manifest.entries.filter(e => e.kind !== 'binary').reduce((sum,e) => sum + e.size, 0);
  const readBinary = async (path: string) => {
    if (!manifest.entries.some(e => e.path === path && e.kind === 'binary') || !path.startsWith('assets/')) throw Error('Missing binary asset');
    decodedBinaryBytes += content.get(path)!.byteLength;
    if (decodedBinaryBytes + metadataBytes > LIMIT) throw Error('Expanded binary references exceed safety limit');
    return content.get(path)!;
  };
  for (const entry of manifest.entries) {
    if (entry.kind === 'binary') { if (!entry.path.startsWith('assets/')) throw Error('Invalid binary entry'); continue; }
    const data = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(content.get(entry.path)!));
    if (entry.kind === 'local') {
      if (!Array.isArray(data) || !entry.path.endsWith('/settings.json')) throw Error('Invalid settings');
      for (const row of data) {
        if (!Array.isArray(row) || row.length !== 2 || typeof row[0] !== 'string' || typeof row[1] !== 'string' || !allowedLocal(row[0]) || localKeys.has(row[0]) || !entry.path.includes('/' + sectionFor(row[0]) + '/')) throw Error('Unsafe settings key');
        localKeys.add(row[0]); local.push([row[0], safeLocalValue(row[1])]);
      }
    } else {
      const config = data && Object.hasOwn(DATABASES, data.name) ? DATABASES[data.name] : null;
      if (!config || dbNames.has(data.name) || entry.path !== `sections/${config.section}/${data.name}.json` || !Array.isArray(data.stores) || data.stores.length !== Object.keys(config.stores).length) throw Error('Unsupported database');
      dbNames.add(data.name);
      const stores = new Set();
      for (const store of data.stores) {
        if (!Object.hasOwn(config.stores, store.name) || stores.has(store.name) || store.keyPath !== config.stores[store.name] || !Array.isArray(store.records)) throw Error('Invalid database schema');
        stores.add(store.name); records += store.records.length;
        if (records > MAX_RECORDS) throw Error('Too many records');
        const decoded = [], keys = new Set<string>();
        for (const row of store.records) {
          const key = await decode(row.key, readBinary), value = await decode(row.value, readBinary);
          indexedDB.cmp(key, key);
          const identity = keyIdentity(key);
          if (keys.has(identity)) throw Error('Duplicate record key');
          keys.add(identity);
          if (store.keyPath !== null && (!value || indexedDB.cmp(value[store.keyPath], key) !== 0)) throw Error('Record ID mismatch');
          decoded.push({ key, value });
        }
        store.records = decoded;
      }
      databases.push(data);
    }
  }
  return { manifest, databases, local, records, bytes: total };
}
export async function restoreSite(prepared: Prepared, progress: (text: string) => void = () => {}) {
  let added = 0, skipped = 0;
  const completed: string[] = [];
  try {
    for (const db of prepared.databases) {
      progress(db.name);
      const result = await mergeDatabase(db); added += result.added; skipped += result.skipped; completed.push(db.name);
    }
    for (const [key, value] of prepared.local) {
      if (!allowedLocal(key)) throw Error('Unsafe key');
      if (localStorage.getItem(key) !== null) skipped++;
      else { localStorage.setItem(key, value); added++; }
    }
    return { added, skipped };
  } catch (error) {
    throw Error(`الاستعادة توقفت؛ لم نمسح الموجود. أُضيف ${added} وتُرك ${skipped}. قواعد مكتملة: ${completed.join(', ') || '—'}. Restoration stopped; some data may already be restored. ${String(error)}`);
  }
}
