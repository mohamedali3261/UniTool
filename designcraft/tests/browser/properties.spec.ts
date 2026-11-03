import { test, expect, type Page } from '@playwright/test';
import { saveAndWait, storedProject } from './helpers/storage';
const base = process.env.DESIGN_QA_URL || 'http://localhost:3000';
async function loadText(page: Page, ar: boolean, mobile: boolean) {
  await page.setViewportSize(mobile ? { width: 390, height: 720 } : { width: 1440, height: 1100 });
  await page.addInitScript(lang => localStorage.setItem('unitool-lang', lang), ar ? 'ar' : 'en');
  await page.goto(base + '/designcraft.html');
  await page.locator('#designer-project-input').setInputFiles({ name: 'properties.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ format: 'unitool-designcraft', version: 1, project: { title: 'Properties QA', width: 800, height: 600, canvasData: { background: '#ffffff', objects: [{ type: 'textbox', text: 'Editable عربي', left: 100, top: 100, width: 260, fontSize: 32, fontFamily: 'Arial', fontWeight: 700, fill: '#cc3344' }] } } })) });
  await expect(page.locator('canvas.upper-canvas')).toBeVisible();
  for (let i = 0; i < 4; i++) {
    const close = page.getByRole('button', { name: ar ? 'إغلاق' : 'Close', exact: true });
    if (!await close.count()) break;
    await close.last().click();
  }
  // Wait out the intentional initial auto-fit before mapping design-space coordinates.
  await page.waitForTimeout(200);
  const box = (await page.locator('canvas.upper-canvas').boundingBox())!;
  await page.mouse.click(box.x + 120 * box.width / 800, box.y + 120 * box.width / 800);
  if (mobile) await page.getByTitle(ar ? 'إظهار الخصائص' : 'Show properties', { exact: true }).click();
  await expect(page.locator('#editor-properties-panel:visible')).toBeVisible();
}
async function saved(page: Page, ar: boolean) {
  await saveAndWait(page, ar);
  return storedProject(page, 'Properties QA');
}
for (const ar of [false, true]) for (const mobile of [false, true]) test(`color controls stay above sections and inside viewport: ${ar ? 'Arabic' : 'English'} ${mobile ? 'mobile' : 'desktop'}`, async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await loadText(page, ar, mobile);
  const properties = page.locator('#editor-properties-panel:visible');
  expect(await properties.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  const colorLabel = ar ? 'لون النص' : 'Text Color';
  const trigger = properties.getByRole('button', { name: colorLabel, exact: true });
  await trigger.click();
  const popup = page.locator('[data-color-popover]');
  await expect(popup).toBeVisible();
  for (const size of mobile ? [{ width: 390, height: 720 }, { width: 320, height: 480 }] : [{ width: 1440, height: 1100 }]) {
    await page.setViewportSize(size);
    await expect.poll(async () => { const b = await popup.boundingBox(); return !!b && b.x >= 0 && b.y >= 0 && b.x + b.width <= size.width && b.y + b.height <= size.height; }).toBe(true);
    const box = (await popup.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(size.width);
    expect(box.y + box.height).toBeLessThanOrEqual(size.height);
    expect(await popup.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    expect(await popup.evaluate(el => { const b = el.getBoundingClientRect(); return el.contains(document.elementFromPoint(b.x + b.width / 2, b.y + 24)); })).toBe(true);
  }
  const hex = popup.getByRole('textbox', { name: colorLabel + ' HEX', exact: true });
  await hex.fill('not-a-color');
  await popup.getByRole('button', { name: ar ? 'تطبيق' : 'Apply', exact: true }).click();
  await expect(hex).toHaveAttribute('aria-invalid', 'true');
  await hex.fill('#00ab88');
  await popup.getByRole('button', { name: ar ? 'تطبيق' : 'Apply', exact: true }).click();
  await expect(popup).toHaveCount(0);
  expect((await saved(page, ar)).canvasData.objects[0].fill).toBe('#00ab88');
  await trigger.click();
  await expect(popup.getByRole('button', { name: (ar ? 'لون سابق' : 'Recent color') + ' #00ab88', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(popup).toHaveCount(0);
  await expect(trigger).toBeFocused();
  expect(errors).toEqual([]);
});

test('property clear-format keeps words, is undoable and quick lock/duplicate work', async ({ page }) => {
  await loadText(page, false, false);
  const properties = page.locator('#editor-properties-panel:visible');
  await properties.getByRole('button', { name: 'Clear formatting, keep text', exact: true }).click();
  let p = await saved(page, false);
  expect(p.canvasData.objects[0].text).toBe('Editable عربي');
  expect(p.canvasData.objects[0].fill).toBe('#000000');
  expect(p.canvasData.objects[0].fontWeight).toBe(400);
  await page.getByRole('button', { name: 'Undo', exact: true }).first().click();
  p = await saved(page, false);
  expect(p.canvasData.objects[0].fontWeight).toBe(700);
  expect(p.canvasData.objects[0].fill).toBe('#cc3344');
  const box = (await page.locator('canvas.upper-canvas').boundingBox())!;
  await page.mouse.click(box.x + 120 * box.width / 800, box.y + 120 * box.width / 800);
  await properties.getByRole('button', { name: 'Lock object', exact: true }).click();
  await expect(properties.getByRole('button', { name: 'Unlock object', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await properties.getByRole('button', { name: 'Unlock object', exact: true }).click();
  await properties.getByRole('button', { name: 'Duplicate object', exact: true }).click();
  expect((await saved(page, false)).canvasData.objects).toHaveLength(2);
});
