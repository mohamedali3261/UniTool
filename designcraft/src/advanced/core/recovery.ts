import { retainedRecovery } from '../../utils/recoveryRetention';
export interface RecoveryPoint {
  id: string;
  projectId: string;
  created: number;
  data: string;
}
let connection: Promise<IDBDatabase> | undefined;
function db() {
  if (!connection)
    connection = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("designcraft-recovery", 1);
      request.onupgradeneeded = () =>
        request.result.createObjectStore("points", { keyPath: "id" });
      request.onerror = () => {
        connection = undefined;
        reject(request.error);
      };
      request.onsuccess = () => {
        request.result.onversionchange = () => {
          request.result.close();
          connection = undefined;
        };
        resolve(request.result);
      };
    });
  return connection;
}
async function transact<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
) {
  const database = await db();
  return new Promise<T>((resolve, reject) => {
    const tx = database.transaction("points", mode),
      request = action(tx.objectStore("points"));
    let value: T;
    request.onsuccess = () => {
      value = request.result;
    };
    tx.oncomplete = () => resolve(value);
    tx.onabort = tx.onerror = () => reject(tx.error || Error("RECOVERY"));
  });
}
export async function recoveryPoints(id: string) {
  const all = (await transact("readonly", (store) =>
    store.getAll(),
  )) as RecoveryPoint[];
  return all
    .filter((p) => p.projectId === id)
    .sort((a, b) => b.created - a.created);
}
export async function saveRecovery(projectId: string, data: string) {
  if (new Blob([data]).size > 8 * 1024 * 1024) throw Error("RECOVERY_SIZE");
  const point = {
    id: crypto.randomUUID(),
    projectId,
    created: Date.now(),
    data,
  };
  const database = await db();
  const saved = await new Promise<RecoveryPoint>((resolve, reject) => {
    const tx = database.transaction('points', 'readwrite'), store = tx.objectStore('points');
    let result: RecoveryPoint = point;
    const request = store.getAll();
    request.onsuccess = () => {
      const all = request.result as RecoveryPoint[];
      const previous = all.filter(p => p.projectId === projectId).sort((a,b) => b.created - a.created)[0];
      if (previous?.data === data) { result = previous; return; }
      point.created = Math.max(point.created, (previous?.created || 0) + 1);
      const kept = new Set(retainedRecovery(all, point).map(p => p.id));
      store.put(point);
      for (const old of all) if (!kept.has(old.id)) store.delete(old.id);
    };
    tx.oncomplete = () => resolve(result);
    tx.onabort = tx.onerror = () => reject(tx.error || Error('RECOVERY_WRITE'));
  });
  if (saved.id === point.id) notifyRecovery();
  return saved;
}
export async function deleteRecovery(projectId: string) {
  for (const point of await recoveryPoints(projectId))
    await transact("readwrite", (s) => s.delete(point.id));
  notifyRecovery();
}

export const RECOVERY_CHANGED_EVENT = "designcraft:recovery-changed";

function notifyRecovery() {
  try { window.dispatchEvent(new CustomEvent(RECOVERY_CHANGED_EVENT)); } catch { /* Node tests */ }
}

export async function recoveryStats(): Promise<{ count: number; bytes: number; byProject: Record<string, { count: number; bytes: number }> }> {
  const all = (await transact("readonly", (s) => s.getAll())) as RecoveryPoint[];
  const byProject: Record<string, { count: number; bytes: number }> = Object.create(null);
  let bytes = 0;
  for (const point of all) {
    const size = new Blob([point.data]).size;
    bytes += size;
    const entry = byProject[point.projectId] ||= { count: 0, bytes: 0 };
    entry.count++;
    entry.bytes += size;
  }
  return { count: all.length, bytes, byProject };
}

export async function clearAllRecovery(): Promise<void> {
  await transact("readwrite", (s) => s.clear());
  notifyRecovery();
}
