import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import { saveAndWait, storedProject, storedProjects } from './helpers/storage';

const base = process.env.DESIGN_QA_URL || 'http://localhost:3000';

async function importProject(page: Page, title: string, canvasExtra: Record<string, unknown> = {}) {
  await page.locator('#designer-project-input').setInputFiles({
    name: 'storage.unitool.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({
      format: 'unitool-designcraft',
      version: 1,
      project: {
        title,
        width: 800,
        height: 600,
        category: 'custom',
        canvasData: { background: '#ffffff', objects: [{ type: 'textbox', text: 'نص محفوظ', left: 80, top: 80, width: 300, fontFamily: 'Arial', fontSize: 32, fill: '#111111' }], ...canvasExtra },
      },
    })),
  });
  await expect(page.locator('#editor-layout')).toBeVisible();
  await expect.poll(async()=>!!(await storedProjects(page)).find(p=>p.title===title)).toBe(true);
}

async function backToStorage(page: Page) {
  await page.getByRole('button', { name: 'العودة للشاشة الرئيسية', exact: true }).first().click();
  await page.getByRole('button', { name: 'الحفظ والتخزين', exact: true }).click();
  await expect(page.getByTestId('storage-manager')).toBeVisible();
}

async function createRecovery(page: Page) {
  // Background recovery remains active without the deleted tools section.
  const box=(await page.locator('canvas.upper-canvas').boundingBox())!;
  await page.mouse.click(box.x+2,box.y+2);
  await page.keyboard.press('Control+a');await page.keyboard.press('ArrowRight');
  await expect.poll(()=>recoveryCount(page)).toBeGreaterThan(0);
}

async function recoveryCount(page: Page) {
  return page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('designcraft-recovery', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      return await new Promise<number>((resolve, reject) => {
        const request = database.transaction('points', 'readonly').objectStore('points').count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } finally { database.close(); }
  });
}

test('storage page saves a large project in IndexedDB, survives reload, and downloads an editable backup', async ({ page }) => {
  await page.goto(base + '/designcraft.html');
  await page.getByRole('button', { name: 'الحفظ والتخزين', exact: true }).click();
  await expect(page.getByTestId('storage-manager')).toBeVisible();
  await expect(page.getByText('IndexedDB', { exact: true })).toBeVisible();

  // The old single localStorage blob would exceed its typical ~5 MB quota.
  await importProject(page, 'مشروع كبير محفوظ', { payload: 'x'.repeat(6 * 1024 * 1024) });
  await expect(page.getByRole('alert')).toHaveCount(0);
  const stored = await storedProject(page, 'مشروع كبير محفوظ');
  expect(stored.canvasData.payload.length).toBe(6 * 1024 * 1024);
  expect(await page.evaluate(() => localStorage.getItem('designcraft_saved_projects_v1'))).toBeNull();

  await page.reload();
  await page.getByRole('button', { name: 'الحفظ والتخزين', exact: true }).click();
  const row = page.getByTestId('storage-project').filter({ hasText: 'مشروع كبير محفوظ' });
  await expect(row).toBeVisible();
  await expect(row).toContainText('MB');

  const pending = page.waitForEvent('download');
  await row.getByRole('button', { name: /^تنزيل نسخة احتياطية قابلة للتعديل:/ }).click();
  const raw = JSON.parse(await fs.readFile((await (await pending).path())!, 'utf8'));
  expect(raw.format).toBe('unitool-designcraft');
  expect(raw.project.title).toBe('مشروع كبير محفوظ');
  expect(raw.project.canvasData.objects[0].text).toBe('نص محفوظ');
});

test('storage page deletes one project with its recovery copies, clears recovery only, and clears all cache without reseeding', async ({ page }) => {
  await page.goto(base + '/designcraft.html');
  await importProject(page, 'مشروع للحذف');
  await createRecovery(page);
  await saveAndWait(page, true);
  expect(await recoveryCount(page)).toBeGreaterThan(0);
  await backToStorage(page);

  const row = page.getByTestId('storage-project').filter({ hasText: 'مشروع للحذف' });
  await row.getByRole('button', { name: /^حذف المشروع ونسخه:/ }).click();
  const dialog = page.getByRole('dialog', { name: 'حذف هذا المشروع؟', exact: true });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'إلغاء', exact: true }).click();
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: /^حذف المشروع ونسخه:/ }).click();
  await dialog.getByRole('button', { name: 'نعم، احذف', exact: true }).click();
  await expect(row).toHaveCount(0);
  expect((await storedProjects(page)).some((p) => p.title === 'مشروع للحذف')).toBe(false);
  await expect.poll(() => recoveryCount(page)).toBe(0);

  await importProject(page, 'مشروع الاسترداد');
  await createRecovery(page);
  await saveAndWait(page, true);
  expect(await recoveryCount(page)).toBeGreaterThan(0);
  await backToStorage(page);
  await page.getByRole('button', { name: 'حذف نسخ الاسترداد فقط', exact: true }).click();
  await page.getByRole('dialog', { name: 'حذف نسخ الاسترداد؟', exact: true }).getByRole('button', { name: 'نعم، احذف', exact: true }).click();
  await expect.poll(() => recoveryCount(page)).toBe(0);
  expect((await storedProjects(page)).some((p) => p.title === 'مشروع الاسترداد')).toBe(true);

  await page.evaluate(() => {
    localStorage.setItem('unitool-lang', 'ar');
    localStorage.setItem('designcraft-recent-colors', '["#ffffff"]');
    localStorage.setItem('designcraft-template-favorites', '["template"]');
    localStorage.setItem('designcraft_brand_v1', '{"name":"brand"}');
  });
  await page.getByRole('button', { name: 'حذف كل بيانات الاستوديو المحفوظة', exact: true }).click();
  const clearDialog = page.getByRole('dialog', { name: 'حذف كل الكاش الخاص بالاستوديو؟', exact: true });
  await expect(clearDialog).toBeVisible();
  await clearDialog.getByRole('button', { name: 'نعم، احذف', exact: true }).click();
  await expect(page.getByTestId('storage-project')).toHaveCount(0);
  await expect(page.getByText('لا توجد مشاريع محفوظة. أنشئ تصميمًا وسيظهر هنا تلقائيًا.', { exact: true })).toBeVisible();
  expect(await storedProjects(page)).toEqual([]);
  expect(await page.evaluate(() => localStorage.getItem('unitool-lang'))).toBe('ar');
  expect(await page.evaluate(() => localStorage.getItem('designcraft-recent-colors'))).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('designcraft-template-favorites'))).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('designcraft_brand_v1'))).toBeNull();

  await page.reload();
  await page.getByRole('button', { name: 'الحفظ والتخزين', exact: true }).click();
  await expect(page.getByTestId('storage-project')).toHaveCount(0);
});
