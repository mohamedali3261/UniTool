import type { ProjectItem } from '../types';
import { INITIAL_MOCK_PROJECTS } from '../data/presets';
import { clearAllRecovery, deleteRecovery } from '../advanced/core/recovery';

/**
 * Durable, browser-local project storage.
 *
 * IndexedDB keeps one record per project (including embedded images), avoiding
 * the small single-blob localStorage quota. A hydrated in-memory cache keeps
 * reads synchronous for the editor; writes are ordered and callers can await
 * their actual durable result. The old localStorage archive is migrated once.
 */
export const LEGACY_PROJECTS_KEY = 'designcraft_saved_projects_v1';
export const PROJECTS_DB_NAME = 'designcraft-projects';
export const STORAGE_CHANGED_EVENT = 'designcraft:storage-changed';
export type StorageEngine = 'indexeddb' | 'localstorage' | 'memory';
export type StorageChange = { kind: 'load' | 'save' | 'delete' | 'clear'; id?: string };

const CACHE_KEYS = [
  LEGACY_PROJECTS_KEY,
  'designcraft_open_tabs_v1',
  'designcraft-recent-colors',
  'designcraft-template-favorites',
  'designcraft_brand_v1',
];

let cache: ProjectItem[] = [];
let engine: StorageEngine = 'memory';
let connection: Promise<IDBDatabase> | undefined;
let ready: Promise<void> | undefined;
let writeQueue: Promise<unknown> = Promise.resolve();
const pending = new Set<Promise<boolean>>();
let epoch = 0;

function openDb(): Promise<IDBDatabase> {
  if (!connection) {
    connection = new Promise<IDBDatabase>((resolve, reject) => {
      if (typeof indexedDB === 'undefined') { reject(Error('IDB_UNAVAILABLE')); return; }
      let settled = false;
      const fail = (error: unknown) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        connection = undefined;
        reject(error instanceof Error ? error : Error('IDB_OPEN'));
      };
      const timer = setTimeout(() => fail(Error('IDB_TIMEOUT')), 5000);
      let request: IDBOpenDBRequest;
      try { request = indexedDB.open(PROJECTS_DB_NAME, 1); }
      catch (error) { fail(error); return; }
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains('projects')) database.createObjectStore('projects', { keyPath: 'id' });
        if (!database.objectStoreNames.contains('meta')) database.createObjectStore('meta');
      };
      request.onerror = () => fail(request.error);
      request.onblocked = () => fail(Error('IDB_BLOCKED'));
      request.onsuccess = () => {
        if (settled) { request.result.close(); return; }
        settled = true;
        clearTimeout(timer);
        request.result.onversionchange = () => { request.result.close(); connection = undefined; };
        resolve(request.result);
      };
    });
  }
  return connection;
}

async function idbValue<T>(store: string, mode: IDBTransactionMode, action: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const database = await openDb();
  return new Promise<T>((resolve, reject) => {
    const tx = database.transaction(store, mode);
    const request = action(tx.objectStore(store));
    let value: T;
    request.onsuccess = () => { value = request.result; };
    tx.oncomplete = () => resolve(value);
    tx.onabort = tx.onerror = () => reject(tx.error || Error('IDB_TRANSACTION'));
  });
}

async function idbBulk(projects: ProjectItem[]): Promise<void> {
  const database = await openDb();
  return new Promise<void>((resolve, reject) => {
    const tx = database.transaction(['projects', 'meta'], 'readwrite');
    const store = tx.objectStore('projects');
    for (const project of projects) store.put(project);
    tx.objectStore('meta').put(true, 'seeded');
    tx.oncomplete = () => resolve();
    tx.onabort = tx.onerror = () => reject(tx.error || Error('IDB_TRANSACTION'));
  });
}

function readLegacy(): ProjectItem[] | null {
  try {
    const raw = localStorage.getItem(LEGACY_PROJECTS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((p) => p && typeof p.id === 'string') : null;
  } catch { return null; }
}

function notify(detail: StorageChange) {
  try { window.dispatchEvent(new CustomEvent<StorageChange>(STORAGE_CHANGED_EVENT, { detail })); }
  catch { /* Node unit tests do not have a window. */ }
}

const byNewest = (a: ProjectItem, b: ProjectItem) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0);

/** Hydrate the cache before rendering. Storage failures are reported by saves, not by blocking startup. */
export function initProjectStorage(): Promise<void> {
  if (!ready) ready = load();
  return ready;
}

async function load(): Promise<void> {
  const legacy = readLegacy();
  try {
    const [stored, seeded] = await Promise.all([
      idbValue<ProjectItem[]>('projects', 'readonly', (s) => s.getAll() as IDBRequest<ProjectItem[]>),
      idbValue<unknown>('meta', 'readonly', (s) => s.get('seeded')),
    ]);
    engine = 'indexeddb';
    const merged = new Map(stored.map((p) => [p.id, p]));
    // Prefer the newer record if a previous fallback write only reached localStorage.
    for (const p of legacy || []) {
      const current = merged.get(p.id);
      if (!current || (p.updatedAt || 0) > (current.updatedAt || 0)) merged.set(p.id, p);
    }
    if (!stored.length && !seeded && !legacy) {
      for (const p of INITIAL_MOCK_PROJECTS) merged.set(p.id, { ...p });
    }
    cache = [...merged.values()].sort(byNewest);
    try {
      if (!seeded || cache.some((p) => !stored.some((s) => s.id === p.id && s.updatedAt === p.updatedAt))) await idbBulk(cache);
      // Never discard the legacy archive until its migration has committed.
      localStorage.removeItem(LEGACY_PROJECTS_KEY);
    } catch { /* Keep the legacy backup and the readable IndexedDB records. */ }
  } catch {
    cache = (legacy ?? INITIAL_MOCK_PROJECTS.map((p) => ({ ...p }))).sort(byNewest);
    try {
      localStorage.setItem('designcraft_storage_probe', '1');
      localStorage.removeItem('designcraft_storage_probe');
      engine = 'localstorage';
    } catch { engine = 'memory'; }
  }
  notify({ kind: 'load' });
}

/** Synchronous view of the cache, hydrated by initProjectStorage(). */
export function getSavedProjects(): ProjectItem[] {
  return [...cache];
}

function enqueue(job: () => Promise<void>): Promise<boolean> {
  const run: Promise<boolean> = writeQueue.then(job).then(
    () => true,
    (error) => { console.error('Project storage write failed', error); return false; },
  );
  pending.add(run);
  writeQueue = run.then(() => { pending.delete(run); });
  return run;
}

async function writeRecord(project: ProjectItem | null, id?: string): Promise<void> {
  if (engine === 'indexeddb') {
    if (project) await idbValue('projects', 'readwrite', (s) => s.put(project));
    else if (id) await idbValue('projects', 'readwrite', (s) => s.delete(id));
    return;
  }
  if (engine === 'localstorage') {
    localStorage.setItem(LEGACY_PROJECTS_KEY, JSON.stringify(cache));
    return;
  }
  throw Error('STORAGE_UNAVAILABLE');
}

/** Update the readable cache immediately; resolve only after the durable write. */
export function saveProjectToStorage(project: ProjectItem): Promise<boolean> {
  const now = Date.now();
  const index = cache.findIndex((p) => p.id === project.id);
  const previous = index >= 0 ? cache[index] : undefined;
  const record: ProjectItem = {
    ...project,
    sessionOnly: false,
    createdAt: previous?.createdAt || project.createdAt || now,
    updatedAt: now,
  };
  if (index >= 0) cache[index] = record;
  else cache.unshift(record);
  notify({ kind: 'save', id: record.id });
  return enqueue(() => writeRecord(record)).then((ok) => {
    // Do not roll back a newer save/delete that happened while this write waited.
    if (!ok && cache.some((p) => p === record)) {
      if (previous) cache[cache.findIndex((p) => p === record)] = previous;
      else cache = cache.filter((p) => p !== record);
      notify({ kind: 'save', id: record.id });
    }
    return ok;
  });
}

/** Durable deletion, including this project's recovery points. */
export async function removeProject(projectId: string): Promise<boolean> {
  const index = cache.findIndex((p) => p.id === projectId);
  if (index < 0) return true;
  const previous = cache[index];
  const writeEpoch = epoch;
  cache = cache.filter((p) => p.id !== projectId);
  notify({ kind: 'delete', id: projectId });
  const ok = await enqueue(() => writeRecord(null, projectId));
  if (!ok && writeEpoch === epoch && !cache.some((p) => p.id === projectId)) {
    cache.splice(Math.min(index, cache.length), 0, previous);
    notify({ kind: 'save', id: projectId });
    return false;
  }
  if (ok) await deleteRecovery(projectId).catch(() => undefined);
  return ok;
}

/** Compatibility API: synchronous remaining list; use removeProject() to await deletion. */
export function deleteProjectFromStorage(projectId: string): ProjectItem[] {
  void removeProject(projectId);
  return getSavedProjects();
}

/** Await the writes pending at this moment, without waiting for unrelated later edits. */
export async function flushProjectWrites(): Promise<boolean> {
  const results = await Promise.all([...pending]);
  return results.every(Boolean);
}

export function hasPendingProjectWrites(): boolean {
  return pending.size > 0;
}

export function getStorageEngine(): StorageEngine {
  return engine;
}

export function projectBytes(project: ProjectItem): number {
  try { return new Blob([JSON.stringify(project)]).size; } catch { return 0; }
}

export function projectsBytes(): number {
  return cache.reduce((total, p) => total + projectBytes(p), 0);
}

export async function browserStorageEstimate(): Promise<{ usage: number; quota: number } | null> {
  try {
    if (!navigator.storage?.estimate) return null;
    const estimate = await navigator.storage.estimate();
    return { usage: estimate.usage || 0, quota: estimate.quota || 0 };
  } catch { return null; }
}

export async function isStoragePersisted(): Promise<boolean> {
  try { return (await navigator.storage?.persisted?.()) === true; } catch { return false; }
}

export async function requestPersistentStorage(): Promise<boolean> {
  try { return (await navigator.storage?.persist?.()) === true; } catch { return false; }
}

/** Clear studio projects, recovery history and preferences; keep the chosen language. */
export async function clearAllProjectData(): Promise<void> {
  const ok = await enqueue(async () => {
    epoch++;
    if (engine === 'indexeddb') {
      await idbValue('projects', 'readwrite', (s) => s.clear());
      await idbValue('meta', 'readwrite', (s) => s.put(true, 'seeded'));
    }
    cache = [];
    notify({ kind: 'clear' });
    let failed = false;
    try { await clearAllRecovery(); } catch { failed = true; }
    for (const key of CACHE_KEYS) {
      try { localStorage.removeItem(key); } catch { failed = true; }
    }
    if (failed) throw Error('CACHE_PARTIALLY_CLEARED');
  });
  if (!ok) throw Error('CACHE_CLEAR_FAILED');
}

// A tab close must not silently interrupt an in-flight durable write.
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', (event) => {
    if (pending.size > 0) { event.preventDefault(); event.returnValue = ''; }
  });
}
