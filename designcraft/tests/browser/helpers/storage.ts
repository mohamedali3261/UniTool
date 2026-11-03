import { expect, type Page } from '@playwright/test';

export async function storedProjects(page: Page): Promise<any[]> {
  return page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('designcraft-projects', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      return await new Promise<any[]>((resolve, reject) => {
        const tx = database.transaction('projects', 'readonly');
        const request = tx.objectStore('projects').getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } finally { database.close(); }
  });
}

export async function storedProject(page: Page, title: string): Promise<any> {
  const project = (await storedProjects(page)).find((p) => p.title === title);
  expect(project, `stored project ${title}`).toBeTruthy();
  return project;
}

/** Click Save and wait for the actual IndexedDB commit, not just the optimistic cache. */
export async function saveAndWait(page: Page, ar = false): Promise<void> {
  const committed = page.evaluate(() => new Promise<{ id: string; ok: boolean }>((resolve) => {
    window.addEventListener('designcraft:saved', (event) => resolve((event as CustomEvent).detail), { once: true });
  }));
  await page.getByRole('button', { name: ar ? 'حفظ' : 'Save', exact: true }).first().click();
  const result = await committed;
  expect(result.ok).toBe(true);
}

export async function setStoredBackground(page: Page, title: string, background: string): Promise<void> {
  await page.evaluate(async ({ title, background }) => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('designcraft-projects', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = database.transaction('projects', 'readwrite');
      const store = tx.objectStore('projects');
      const request = store.getAll();
      request.onsuccess = () => {
        const project = request.result.find((p: any) => p.title === title);
        if (!project) { reject(Error('Project not found')); return; }
        project.canvasData.background = background;
        store.put(project);
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    database.close();
  }, { title, background });
}
