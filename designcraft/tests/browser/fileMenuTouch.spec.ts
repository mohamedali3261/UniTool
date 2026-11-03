import { test, expect } from '@playwright/test';
const base = process.env.DESIGN_QA_URL || 'http://localhost:3000';
test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
for (const ar of [false, true]) test(`touch file menu survives unidentified blur and activates actions: ${ar ? 'Arabic' : 'English'}`, async ({ page }) => {
  await page.addInitScript(language => localStorage.setItem('unitool-lang', language), ar ? 'ar' : 'en');
  await page.goto(base + '/designcraft.html');
  await page.locator('#designer-project-input').setInputFiles({ name: 'touch.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ format: 'unitool-designcraft', version: 1, project: { title: 'Touch menu', width: 800, height: 600, canvasData: { background: '#ffffff', objects: [] } } })) });
  await expect(page.locator('canvas.upper-canvas')).toBeVisible();
  for (let i = 0; i < 4; i++) {
    const close = page.getByRole('button', { name: ar ? 'إغلاق' : 'Close', exact: true });
    if (!await close.count()) break;
    await close.last().tap();
  }
  const trigger = page.getByRole('button', { name: ar ? 'استيراد / تصدير' : 'Import / Export', exact: true });
  const panel = page.locator('#designer-file-actions');
  await trigger.tap();
  await expect(panel).toBeVisible();
  // Mobile browsers can report a null relatedTarget while touching buttons.
  // Losing focus alone must not remove the menu before the touch click arrives.
  await trigger.dispatchEvent('focusout', { relatedTarget: null });
  await expect(panel).toBeVisible();
  await panel.getByRole('button').first().dispatchEvent('focusout', { relatedTarget: null });
  await expect(panel).toBeVisible();
  const chooser = page.waitForEvent('filechooser');
  await panel.getByRole('button', { name: ar ? 'استيراد مشروع قابل للتعديل' : 'Import editable project', exact: true }).tap();
  await chooser;
  await expect(panel).toHaveCount(0);
  await trigger.tap();
  await panel.getByRole('button', { name: ar ? 'تصدير' : 'Export', exact: true }).tap();
  await expect(page.locator('#export-modal')).toBeVisible();
});

test('touch toggles and outside dismissal coexist with keyboard focus navigation', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('unitool-lang', 'en'));
  await page.goto(base + '/designcraft.html');
  await page.locator('#designer-project-input').setInputFiles({ name: 'touch.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ format: 'unitool-designcraft', version: 1, project: { title: 'Touch', width: 800, height: 600, canvasData: { objects: [] } } })) });
  await expect(page.locator('canvas.upper-canvas')).toBeVisible();
  for (let i = 0; i < 4; i++) { const close = page.getByRole('button', { name: 'Close', exact: true }); if (!await close.count()) break; await close.last().tap(); }
  const trigger = page.getByRole('button', { name: 'Import / Export', exact: true });
  const panel = page.locator('#designer-file-actions');
  await trigger.tap(); await expect(panel).toBeVisible();
  await trigger.tap(); await expect(panel).toHaveCount(0);
  await trigger.tap(); await page.locator('canvas.upper-canvas').tap(); await expect(panel).toHaveCount(0);
  await trigger.focus(); await trigger.press('ArrowDown');
  await expect(panel.getByRole('button').first()).toBeFocused();
  await page.keyboard.press('Escape'); await expect(trigger).toBeFocused(); await expect(panel).toHaveCount(0);
  await trigger.press('ArrowDown');
  await page.keyboard.press('Tab');
  await expect(panel.getByRole('button').nth(1)).toBeFocused();
  await page.getByRole('button', { name: 'Save', exact: true }).first().focus();
  await expect(panel).toHaveCount(0);
});
