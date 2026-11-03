import { DATABASES, allowedLocal, sectionFor } from './registry';
import { openDatabase } from './database';
export type UsageReport = { usage?: number; quota?: number; persistent?: boolean; local: { section: string; bytes: number; count: number }[]; databases: { name: string; section: string; records: number }[] };
/** Count records without loading project/media values, or creating absent databases. */
export async function storageUsage(): Promise<UsageReport> {
  const estimate = await navigator.storage?.estimate?.().catch(() => ({})) || {};
  const persistent = await navigator.storage?.persisted?.().catch(() => false);
  const groups = new Map<string, { section: string; bytes: number; count: number }>();
  for (const key of Object.keys(localStorage)) {
    if (!allowedLocal(key)) continue;
    const section = sectionFor(key), row = groups.get(section) || { section, bytes: 0, count: 0 };
    row.bytes += (key.length + (localStorage.getItem(key)?.length || 0)) * 2; row.count++;
    groups.set(section, row);
  }
  const databases: UsageReport['databases'] = [];
  for (const [name, config] of Object.entries(DATABASES)) {
    const database = await openDatabase(name);
    if (!database) continue;
    try {
      const records = await new Promise<number>((resolve, reject) => {
        const names = Array.from(database.objectStoreNames);
        if (!names.length) { resolve(0); return; }
        const tx = database.transaction(names), counts: number[] = [];
        for (const store of names) { const r = tx.objectStore(store).count(); r.onsuccess = () => counts.push(r.result); }
        tx.oncomplete = () => resolve(counts.reduce((a,b) => a+b, 0));
        tx.onabort = tx.onerror = () => reject(tx.error);
      });
      databases.push({ name, section: config.section, records });
    } finally { database.close(); }
  }
  return { ...estimate, persistent, local: [...groups.values()], databases };
}
