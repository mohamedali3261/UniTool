import { expect, test } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

/**
 * End-to-end QA for the font studio. These run on a machine with Playwright
 * browsers installed (`npm run test:font-lab:browser`).
 */
test.beforeEach(async ({ page }) => {
  await page.goto('/font-lab/');
  await expect(page.locator('.fl-stage')).toBeVisible();
  await expect(page.locator('.fl-glyph').first()).toBeVisible();
});

test('loads a real font and shows editable outlines', async ({ page }) => {
  await expect(page.locator('.fl-stage-title')).toContainText('upm');
  const outline = page.locator('.fl-outline-line');
  await expect(outline).toHaveAttribute('d', /M[\d.]+/);
  await expect(page.locator('.fl-node').first()).toBeVisible();
  await expect(page.locator('.fl-forms button')).toHaveCount(4);
});

test('glyph search filters the rail', async ({ page }) => {
  const before = await page.locator('.fl-glyph').count();
  await page.locator('.fl-search input').fill('باء');
  await expect
    .poll(async () => page.locator('.fl-glyph').count(), { timeout: 5000 })
    .toBeLessThan(before);
  await expect(page.locator('.fl-glyph').first()).toBeVisible();
});

test('dragging a node changes the outline and adds one history step', async ({ page }) => {
  const d = await page.locator('.fl-outline-line').getAttribute('d');
  const node = page.locator('.fl-node rect').first();
  const box = await node.boundingBox();
  if (!box) throw new Error('node not visible');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 24, box.y + box.height / 2 + 16, { steps: 6 });
  await page.mouse.up();
  await expect.poll(async () => page.locator('.fl-outline-line').getAttribute('d'), { timeout: 5000 }).not.toBe(d);

  await page.getByRole('button', { name: 'السجل' }).click();
  await expect(page.locator('.fl-history-list li').first()).toContainText('تحريك نقاط');
  await page.getByRole('button', { name: 'تراجع' }).first().click();
  await page.getByRole('button', { name: 'المحرر' }).click();
  await expect.poll(async () => page.locator('.fl-outline-line').getAttribute('d')).toBe(d);
});

test('preset shapes and undo', async ({ page }) => {
  const before = await page.locator('.fl-outline-line').getAttribute('d');
  await page.locator('.fl-shape-grid button').nth(4).click();
  await expect.poll(async () => page.locator('.fl-outline-line').getAttribute('d')).not.toBe(before);
  await page.locator('.fl-stage-toggles button[aria-label="تراجع"]').click();
  await expect.poll(async () => page.locator('.fl-outline-line').getAttribute('d')).toBe(before);
});

test('exports a font that the browser can parse', async ({ page }) => {
  await page.getByRole('button', { name: 'التصدير' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /تنزيل TTF/i }).click();
  const download = await downloadPromise;
  const target = path.join(test.info().outputDir, download.suggestedFilename());
  fs.mkdirSync(path.dirname(target), { recursive: true });
  await download.saveAs(target);
  const size = fs.statSync(target).size;
  expect(size).toBeGreaterThan(20_000);
  await expect(page.locator('.fl-export-message')).toContainText('تم تصدير');

  // The exported font must be loadable by the browser's own font engine.
  const loaded = await page.evaluate(async (bytes) => {
    const response = await fetch(`data:application/octet-stream;base64,${bytes}`);
    const buffer = await response.arrayBuffer();
    const face = new FontFace('exported-check', buffer);
    const result = await face.load();
    return result.status;
  }, fs.readFileSync(target).toString('base64'));
  expect(loaded).toBe('loaded');
});

test('language and theme switches work', async ({ page }) => {
  await page.locator('.fl-icon-btn[aria-label="تبديل اللغة"]').click();
  await expect(page.locator('.fl-app')).toHaveAttribute('dir', 'ltr');
  await expect(page.getByRole('button', { name: 'Editor' })).toBeVisible();
  await page.locator('.fl-icon-btn[aria-label="Switch language"]').click();
  await expect(page.locator('.fl-app')).toHaveAttribute('dir', 'rtl');

  await page.locator('.fl-icon-btn[aria-label="تبديل الوضع الليلي"]').click();
  await expect(page.locator('.fl-app')).toHaveClass(/is-dark/);
});

test('the live preview uses the edited font', async ({ page }) => {
  await page.getByRole('button', { name: 'المعاينة' }).click();
  const sample = page.locator('.fl-preview-canvas p');
  await expect(sample).toBeVisible();
  const family = await sample.evaluate((element) => getComputedStyle(element).fontFamily);
  expect(family).toContain('unitool-fontlab-preview');
  await expect.poll(async () => page.evaluate(() => document.fonts.check("16px 'unitool-fontlab-preview'"))).toBe(true);
});

test('tablet and desktop widths keep the canvas large enough to draw', async ({ page }) => {
  for (const width of [1280, 1024, 768]) {
    await page.setViewportSize({ width, height: 800 });
    const box = await page.locator('.fl-stage').boundingBox();
    expect(box, `stage at ${width}px`).not.toBeNull();
    expect(box!.width).toBeGreaterThan(width < 1100 ? 380 : 430);
    expect(box!.height).toBeGreaterThan(280);
  }
});

test('mobile layout keeps the stage and rail usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.fl-stage')).toBeVisible();
  await expect(page.locator('.fl-rail')).toBeVisible();
  await expect(page.locator('.fl-mobile-only')).toBeVisible();
  await page.locator('.fl-mobile-only .fl-icon-btn').click();
  await expect(page.locator('.fl-mobile-menu')).toBeVisible();
});
