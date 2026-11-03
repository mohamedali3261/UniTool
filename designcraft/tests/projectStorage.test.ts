import 'fake-indexeddb/auto';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { ProjectItem } from '../src/types';
import {
  LEGACY_PROJECTS_KEY,
  clearAllProjectData,
  flushProjectWrites,
  getSavedProjects,
  getStorageEngine,
  initProjectStorage,
  projectBytes,
  removeProject,
  saveProjectToStorage,
} from '../src/utils/projectStorage';
import { recoveryPoints, saveRecovery } from '../src/advanced/core/recovery';

const memory = new Map<string, string>();
Object.assign(globalThis, {
  localStorage: {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => { memory.set(key, String(value)); },
    removeItem: (key: string) => { memory.delete(key); },
    clear: () => memory.clear(),
    key: (index: number) => [...memory.keys()][index] ?? null,
    get length() { return memory.size; },
  },
});

function project(id: string, title = id): ProjectItem {
  return { id, title, width: 800, height: 600, category: 'custom', createdAt: 1, updatedAt: 1, canvasData: { background: '#fff', objects: [] } };
}

async function readIdb(): Promise<ProjectItem[]> {
  const database = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('designcraft-projects', 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  try {
    return await new Promise<ProjectItem[]>((resolve, reject) => {
      const request = database.transaction('projects', 'readonly').objectStore('projects').getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally { database.close(); }
}

test('legacy localStorage projects migrate into IndexedDB and the old blob is removed', async () => {
  const legacy = project('legacy', 'مشروع قديم');
  memory.set(LEGACY_PROJECTS_KEY, JSON.stringify([legacy]));
  await initProjectStorage();
  assert.equal(getStorageEngine(), 'indexeddb');
  assert.deepEqual(getSavedProjects().find((p) => p.id === 'legacy')?.title, 'مشروع قديم');
  assert.equal(memory.has(LEGACY_PROJECTS_KEY), false);
  assert.ok((await readIdb()).some((p) => p.id === 'legacy'));
});

test('projects larger than the old localStorage quota save durably and are readable synchronously', async () => {
  await clearAllProjectData();
  const large = project('large', 'تصميم كبير');
  large.canvasData.payload = 'x'.repeat(6 * 1024 * 1024);
  const pending = saveProjectToStorage(large);
  assert.ok(getSavedProjects().some((p) => p.id === 'large'), 'cache is immediately readable');
  assert.equal(await pending, true);
  assert.equal(await flushProjectWrites(), true);
  const stored = (await readIdb()).find((p) => p.id === 'large')!;
  assert.ok(projectBytes(stored) > 5 * 1024 * 1024);
  assert.equal(stored.canvasData.payload.length, 6 * 1024 * 1024);
});

test('failed durable writes roll back the optimistic cache instead of pretending to save', async () => {
  await clearAllProjectData();
  const original = IDBObjectStore.prototype.put;
  IDBObjectStore.prototype.put = function (this: IDBObjectStore, ...args: any[]) {
    if (this.name === 'projects') throw new DOMException('Full', 'QuotaExceededError');
    return original.apply(this, args);
  };
  try {
    assert.equal(await saveProjectToStorage(project('failed')), false);
    assert.equal(getSavedProjects().some((p) => p.id === 'failed'), false);
  } finally {
    IDBObjectStore.prototype.put = original;
  }
  assert.equal(await saveProjectToStorage(project('recovered')), true);
});

test('deleting a project also deletes only that project’s recovery copies', async () => {
  await clearAllProjectData();
  await saveProjectToStorage(project('a'));
  await saveProjectToStorage(project('b'));
  await saveRecovery('a', '{"version":1}');
  await saveRecovery('b', '{"version":1}');
  assert.equal(await removeProject('a'), true);
  assert.deepEqual(await recoveryPoints('a'), []);
  assert.equal((await recoveryPoints('b')).length, 1);
  assert.equal((await readIdb()).some((p) => p.id === 'a'), false);
});

test('clear all removes studio caches, keeps language, and a fresh load does not reseed mocks', async () => {
  await saveProjectToStorage(project('kept'));
  await saveRecovery('kept', '{}');
  memory.set('unitool-lang', 'ar');
  memory.set('designcraft_open_tabs_v1', '["kept"]');
  memory.set('designcraft-recent-colors', '["#fff"]');
  memory.set('designcraft-template-favorites', '["x"]');
  memory.set('designcraft_brand_v1', '{}');
  await clearAllProjectData();
  assert.deepEqual(getSavedProjects(), []);
  assert.deepEqual(await readIdb(), []);
  assert.deepEqual(await recoveryPoints('kept'), []);
  assert.equal(memory.get('unitool-lang'), 'ar');
  for (const key of ['designcraft_open_tabs_v1', 'designcraft-recent-colors', 'designcraft-template-favorites', 'designcraft_brand_v1']) assert.equal(memory.has(key), false);
  const fresh = await import('../src/utils/projectStorage.ts?fresh-after-clear');
  await fresh.initProjectStorage();
  assert.deepEqual(fresh.getSavedProjects(), []);
});
