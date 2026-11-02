import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
const base = process.env.DESIGN_QA_URL || 'http://localhost:3000';
const fixture = {
  format: 'unitool-designcraft', version: 1,
  project: { title: 'Mobile imported design', width: 800, height: 600, canvasData: { background: '#ffffff', objects: [{ type: 'textbox', text: 'Imported عربي', left: 100, top: 100, width: 300, fontFamily: 'Arial', fontSize: 32, fill: '#000000' }] } },
};
async function upload(page: Page, raw: unknown = fixture) {
  await page.locator('#designer-project-input').setInputFiles({ name: 'mobile.unitool.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(raw)) });
}
async function closeDrawers(page: Page, ar = false) {
  for (let i = 0; i < 4; i++) {
    const buttons = page.getByRole('button', { name: ar ? 'إغلاق' : 'Close', exact: true });
    if (!await buttons.count()) return;
    await buttons.last().click();
  }
}
for (const storageError of ['QuotaExceededError', 'SecurityError']) test(`mobile imports despite ${storageError}, warns honestly, exports and can later save`, async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.setItem('unitool-lang', 'en'));
  await page.goto(base + '/designcraft.html');
  const chooser = page.waitForEvent('filechooser');
  await page.getByTestId('dimensions-import').click();
  await chooser;
  await page.evaluate((errorName) => {
    const original = Storage.prototype.setItem;
    (window as any).restoreStorage = () => { Storage.prototype.setItem = original; };
    Storage.prototype.setItem = function(key, value) {
      if (key === 'designcraft_saved_projects_v1') throw new DOMException('Browser storage refused', errorName);
      return original.call(this, key, value);
    };
  }, storageError);
  await upload(page);
  await expect(page.locator('#editor-layout')).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('Project opened for editing without a durable save');
  await expect(page.getByTestId('design-save-status')).toHaveText('Unsaved changes');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('designcraft_saved_projects_v1') || '[]').some((p: any) => p.title === 'Mobile imported design'))).toBe(false);
  expect(await page.evaluate(() => { const event = new Event('beforeunload', { cancelable: true }); window.dispatchEvent(event); return event.defaultPrevented; })).toBe(true);
  await closeDrawers(page);
  await page.getByRole('button', { name: 'Import / Export', exact: true }).click();
  await page.getByRole('button', { name: 'Export', exact: true }).click();
  await page.getByRole('button', { name: /^Editable project/ }).click();
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download Image Now', exact: true }).click();
  const raw = JSON.parse(await fs.readFile((await (await pending).path())!, 'utf8'));
  expect(raw.project.canvasData.objects[0].text).toBe('Imported عربي');
  await page.evaluate(() => (window as any).restoreStorage());
  await page.getByRole('button', { name: 'Save', exact: true }).first().click();
  await expect(page.getByTestId('design-save-status')).toHaveText('No unsaved changes');
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('designcraft_saved_projects_v1') || '[]').some((p: any) => p.title === 'Mobile imported design' && p.sessionOnly === false))).toBe(true);
});

for (const ar of [false, true]) test(`file dropdown stays inside mobile viewport in ${ar ? 'Arabic RTL' : 'English LTR'}`, async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript((language) => localStorage.setItem('unitool-lang', language), ar ? 'ar' : 'en');
  await page.goto(base + '/designcraft.html');
  await upload(page);
  await expect(page.locator('#editor-layout')).toBeVisible();
  await closeDrawers(page, ar);
  const trigger = page.getByRole('button', { name: ar ? 'استيراد / تصدير' : 'Import / Export', exact: true });
  for (const size of [{ width: 320, height: 640 }, { width: 390, height: 844 }, { width: 640, height: 320 }]) {
    await page.setViewportSize(size);
    await trigger.click();
    const panel = page.locator('#designer-file-actions');
    await expect(panel).toBeVisible();
    const box = (await panel.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(size.width);
    expect(box.y + box.height).toBeLessThanOrEqual(size.height);
    const chooser = page.waitForEvent('filechooser');
    await panel.getByRole('button', { name: ar ? 'استيراد مشروع قابل للتعديل' : 'Import editable project', exact: true }).click();
    await chooser;
    await expect(panel).toHaveCount(0);
  }
  await trigger.focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('#designer-file-actions button').first()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
});
