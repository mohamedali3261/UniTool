import { DATABASES } from './registry';
function estimatedBytes(value: any, seen = new Set<any>()): number {
  if (typeof value === 'string') return value.length * 3;
  if (!value || typeof value !== 'object' || seen.has(value)) return 8;
  seen.add(value);
  if (value instanceof Blob) return value.size;
  if (value instanceof ArrayBuffer || ArrayBuffer.isView(value)) return value.byteLength;
  if (value instanceof Map) return Array.from(value).reduce((sum, pair) => sum + estimatedBytes(pair, seen), 0);
  if (value instanceof Set) return Array.from(value).reduce((sum, v) => sum + estimatedBytes(v, seen), 0);
  return Object.entries(value).reduce((sum, [k,v]) => sum + k.length * 3 + estimatedBytes(v, seen), 0);
}
export type StoreDump = { name: string; keyPath: string | null; records: { key: any; value: any }[] };
export type DatabaseDump = { name: string; stores: StoreDump[] };
export function openDatabase(name: string, create = false): Promise<IDBDatabase | null> {
  return new Promise((resolve, reject) => {
    let missing = false, expired = false;
    const timer = setTimeout(() => { expired = true; reject(Error('أغلق تبويبات الموقع الأخرى ثم أعد المحاولة / Close other site tabs and retry')); }, 5000);
    const req = indexedDB.open(name);
    req.onupgradeneeded = () => {
      if (!create) { missing = true; req.transaction!.abort(); return; }
      for (const [store, keyPath] of Object.entries(DATABASES[name].stores)) req.result.createObjectStore(store, keyPath ? { keyPath } : undefined);
    };
    req.onsuccess = () => { clearTimeout(timer); if (expired) { req.result.close(); return; } resolve(req.result); };
    req.onerror = () => { clearTimeout(timer); if (missing) resolve(null); else reject(req.error); };
    req.onblocked = () => { clearTimeout(timer); expired = true; reject(Error('قاعدة البيانات مشغولة / Database blocked: close other tabs')); };
  });
}
export async function readDatabase(name: string): Promise<DatabaseDump | null> {
  const db = await openDatabase(name);
  if (!db) return null;
  try {
    const names = Array.from(db.objectStoreNames);
    if (db.version !== 1 || names.length !== Object.keys(DATABASES[name].stores).length || names.some(n => !Object.hasOwn(DATABASES[name].stores, n))) throw Error('Unsupported database schema: ' + name);
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(names, 'readonly');
      let approximate = 0, oversized = false;
      const stores: StoreDump[] = names.map(storeName => {
        const store = tx.objectStore(storeName);
        if (store.keyPath !== DATABASES[name].stores[storeName] || store.autoIncrement || store.indexNames.length) throw Error('Unsupported database schema: ' + name);
        return { name: storeName, keyPath: store.keyPath as string | null, records: [] };
      });
      for (const dump of stores) {
        const request = tx.objectStore(dump.name).openCursor();
        request.onsuccess = () => { const cursor = request.result; if (cursor) { approximate += estimatedBytes(cursor.value); if (approximate > 128 * 1024 * 1024 || dump.records.length >= 50000) { oversized = true; tx.abort(); return; } dump.records.push({ key: cursor.key, value: cursor.value }); cursor.continue(); } };
      }
      tx.oncomplete = () => resolve({ name, stores });
      tx.onerror = tx.onabort = () => reject(oversized ? Error('Backup exceeds 128 MB safety limit') : tx.error || Error('Database read failed'));
    });
  } finally { db.close(); }
}
/** One atomic transaction per database; existing keys are deliberately never overwritten. */
export async function mergeDatabase(dump: DatabaseDump) {
  const db = (await openDatabase(dump.name, true))!;
  try {
    if (db.version !== 1) throw Error('Unsupported existing database version');
    for (const s of dump.stores) {
      if (!db.objectStoreNames.contains(s.name) || db.transaction(s.name).objectStore(s.name).keyPath !== s.keyPath) throw Error('Schema mismatch: ' + dump.name);
    }
    return await new Promise<{ added: number; skipped: number }>((resolve, reject) => {
      let added = 0, skipped = 0;
      const tx = db.transaction(dump.stores.map(s => s.name), 'readwrite');
      for (const dumpStore of dump.stores) {
        const store = tx.objectStore(dumpStore.name);
        for (const record of dumpStore.records) {
          const request = store.count(record.key);
          request.onsuccess = () => { if (request.result) skipped++; else { store.add(record.value, store.keyPath === null ? record.key : undefined); added++; } };
        }
      }
      tx.oncomplete = () => resolve({ added, skipped });
      tx.onabort = tx.onerror = () => reject(tx.error || Error('Not enough storage / تعذر الحفظ')); 
    });
  } finally { db.close(); }
}
