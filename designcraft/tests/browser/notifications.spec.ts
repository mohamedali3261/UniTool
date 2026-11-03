import { test, expect } from '@playwright/test';
import { saveAndWait } from './helpers/storage';
const base = process.env.DESIGN_QA_URL || 'http://localhost:3000';
for (const ar of [false, true]) test(`notifications share one FIFO box, coalesce repetitions and pause while reading: ${ar ? 'RTL' : 'LTR'}`, async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(lang => localStorage.setItem('unitool-lang', lang), ar ? 'ar' : 'en');
  await page.goto(base + '/designcraft.html');
  await page.locator('#designer-project-input').setInputFiles({ name: 'notifications.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ format: 'unitool-designcraft', version: 1, project: { title: 'Notifications QA', width: 800, height: 600, canvasData: { objects: [] } } })) });
  await expect(page.locator('canvas.upper-canvas')).toBeVisible();
  for (let i = 0; i < 4; i++) { const close = page.getByRole('button', { name: ar ? 'إغلاق' : 'Close', exact: true }).filter({ visible: true }); if (!await close.count()) break; await close.last().click(); }
  await page.getByRole('button', { name: ar ? 'الخلفية' : 'Background', exact: true }).last().click();
  await page.getByRole('button', { name: ar ? 'ألوان وتدرجات' : 'Colors & Gradients', exact: true }).click();
  await page.locator('button[title^="#"]').evaluateAll(buttons => { for (let i = 0; i < 8; i++) (buttons[i % buttons.length] as HTMLButtonElement).click(); });
  const card = page.getByTestId('notification-card');
  await expect(card).toHaveCount(1);
  await expect(card).toContainText(ar ? 'تغيير خلفية الكانفاس' : 'Canvas Background');
  await expect(page.getByTestId('notification-repeat')).toContainText('8');
  const bounds = (await card.boundingBox())!;
  expect(bounds.x).toBeGreaterThanOrEqual(0); expect(bounds.x + bounds.width).toBeLessThanOrEqual(390);
  await card.hover();
  // A real dwell exceeding the automatic timeout must not dismiss the message.
  await page.waitForTimeout(3800);
  await expect(card).toHaveCount(1);
  await saveAndWait(page, ar);
  await expect(page.getByTestId('notification-pending')).toContainText('1');
  await expect(card).toHaveCount(1);
  await card.getByRole('button', { name: ar ? 'التالي' : 'Next', exact: true }).click();
  await expect(card).toContainText(ar ? 'تم الحفظ بنجاح' : 'Saved Successfully');
  await expect(page.getByTestId('notification-repeat')).toHaveCount(0);
  await expect(page.getByTestId('notification-pending')).toHaveCount(0);
  await page.mouse.move(0, 0);
  await page.getByRole('button', { name: ar ? 'حفظ' : 'Save', exact: true }).first().focus();
  await expect(card).toHaveCount(0, { timeout: 7000 });
  await saveAndWait(page, ar);
  await expect(card).toHaveCount(1);
  await card.getByRole('button', { name: ar ? 'إغلاق' : 'Close', exact: true }).click();
  await expect(card).toHaveCount(0);
});
