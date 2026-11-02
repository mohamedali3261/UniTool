import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import { PDFDocument } from 'pdf-lib';
const base = process.env.DESIGN_QA_URL || 'http://localhost:3000';
async function load(page: Page, width = 800, height = 600, objects: any[] = [{ type: 'rect', left: 100, top: 100, width: 120, height: 80, fill: '#ff0000' }]) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.setItem('unitool-lang', 'en'));
  await page.goto(base + '/designcraft.html');
  await page.locator('#designer-project-input').setInputFiles({ name: 'mobile.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ format: 'unitool-designcraft', version: 1, project: { title: 'Mobile performance QA', width, height, canvasData: { background: '#ffffff', objects } } })) });
  await expect(page.locator('canvas.upper-canvas')).toBeVisible();
  for (let i = 0; i < 4; i++) { const close = page.getByRole('button', { name: 'Close', exact: true }); if (!await close.count()) break; await close.last().click(); }
}
async function openExport(page: Page, format: RegExp) {
  await page.getByRole('button', { name: 'Import / Export', exact: true }).click();
  await page.getByRole('button', { name: 'Export', exact: true }).click();
  await page.getByRole('button', { name: format }).click();
}
async function download(page: Page) {
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download Image Now', exact: true }).click();
  return fs.readFile((await (await pending).path())!);
}
test('large mobile import never allocates a full-design artboard before fitting; reduced export works', async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).canvasAllocations = [];
    for (const property of ['width', 'height']) {
      const descriptor = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, property)!;
      Object.defineProperty(HTMLCanvasElement.prototype, property, { ...descriptor, set(value) { (window as any).canvasAllocations.push(value); descriptor.set!.call(this, value); } });
    }
  });
  await load(page, 8000, 5000, Array.from({ length: 500 }, (_, i) => ({ type: 'rect', left: i % 25 * 100, top: Math.floor(i / 25) * 100, width: 60, height: 60, fill: '#123456' })));
  expect(await page.evaluate(() => Math.max(...(window as any).canvasAllocations))).toBeLessThan(4000);
  await page.getByRole('button', { name: 'Import / Export', exact: true }).click();
  await page.getByRole('button', { name: 'Quick PNG download', exact: true }).click();
  await expect(page.locator('#export-modal')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Download Image Now', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: /^0.25×/ }).click();
  const bytes = await download(page);
  expect(bytes.readUInt32BE(16)).toBe(2000); expect(bytes.readUInt32BE(20)).toBe(1250);
});
test('mobile PNG, JPEG, SVG, PDF and editable project produce real downloadable files without popups', async ({ page }) => {
  let popups = 0; page.on('popup', () => popups++);
  await load(page);
  for (const format of [/^PNG Image/, /^JPG Image/, /^SVG Vector/, /^PDF Document/, /^Editable project/]) {
    await openExport(page, format);
    const bytes = await download(page);
    if (format.source.includes('PNG')) expect(bytes.subarray(1, 4).toString()).toBe('PNG');
    if (format.source.includes('JPG')) expect(bytes.subarray(0, 2).toString('hex')).toBe('ffd8');
    if (format.source.includes('SVG')) expect(bytes.toString()).toContain('<svg');
    if (format.source.includes('PDF')) { const pdf = await PDFDocument.load(bytes); expect(pdf.getPageCount()).toBe(1); expect(pdf.getPage(0).getWidth()).toBe(600); }
    if (format.source.includes('Editable')) expect(JSON.parse(bytes.toString()).project.canvasData.objects).toHaveLength(1);
  }
  await page.getByRole('button', { name: 'Import / Export', exact: true }).click();
  const quick = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Quick PNG download', exact: true }).click();
  const quickBytes = await fs.readFile((await (await quick).path())!);
  expect(quickBytes.readUInt32BE(16)).toBe(1600);
  expect(quickBytes.readUInt32BE(20)).toBe(1200);
  expect(popups).toBe(0);
});
test('mobile failed blob encoding stays recoverable rather than announcing a successful download', async ({ page }) => {
  await load(page);
  await openExport(page, /^PNG Image/);
  await page.evaluate(() => {
    const original = HTMLCanvasElement.prototype.toBlob;
    (window as any).restoreBlob = () => { HTMLCanvasElement.prototype.toBlob = original; };
    HTMLCanvasElement.prototype.toBlob = function(callback) { callback(null); };
  });
  await page.getByRole('button', { name: 'Download Image Now', exact: true }).click();
  await expect(page.locator('#export-modal')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Download Image Now', exact: true })).toBeEnabled();
  await page.evaluate(() => (window as any).restoreBlob());
  expect((await download(page)).subarray(1, 4).toString()).toBe('PNG');
});
