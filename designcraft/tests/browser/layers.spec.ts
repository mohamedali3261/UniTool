import { saveAndWait, storedProject } from "./helpers/storage";
import { test, expect, type Page } from '@playwright/test';
const base = process.env.DESIGN_QA_URL || 'http://localhost:3000';
const objects = ['A', 'B', 'C'].map((id, i) => ({ id, name: `Layer ${id}`, type: 'rect', left: 50 + i * 110, top: 100, width: 80, height: 80, fill: ['#ff0000', '#00ff00', '#0000ff'][i] }));
async function load(page: Page, mobile = false, ar = false, custom = objects) {
  await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1440, height: 1100 });
  await page.addInitScript(lang => localStorage.setItem('unitool-lang', lang), ar ? 'ar' : 'en');
  await page.goto(base + '/designcraft.html');
  await page.locator('#designer-project-input').setInputFiles({ name: 'layers.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ format: 'unitool-designcraft', version: 1, project: { title: 'Layers QA', width: 800, height: 600, canvasData: { background: '#ffffff', objects: custom } } })) });
  await expect(page.locator('canvas.upper-canvas')).toBeVisible();
  await page.getByRole('button', { name: ar ? 'الطبقات' : 'Layers', exact: true }).click();
  return page.locator('[data-layer-panel]:visible');
}
async function saved(page: Page, ar = false) {
  await saveAndWait(page, ar);
  return storedProject(page, 'Layers QA');
}
for (const mobile of [false, true]) test(`pointer layer reorder and single-step undo on ${mobile ? 'mobile' : 'desktop'}`, async ({ page }) => {
  const panel = await load(page, mobile);
  expect((await panel.locator('[data-layer-id]').first().boundingBox())!.height).toBeLessThanOrEqual(70);
  await expect(panel.getByRole('combobox')).toHaveCount(0);
  const source = panel.locator('[data-layer-id="A"]').getByRole('button', { name: 'Drag layer Layer A', exact: true });
  await source.scrollIntoViewIfNeeded();
  const a = (await source.boundingBox())!, c = (await panel.locator('[data-layer-id="C"]').boundingBox())!;
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await page.mouse.down();
  await page.mouse.move(a.x + a.width / 2, c.y + c.height / 2, { steps: 12 }); await page.mouse.up();
  expect((await saved(page)).canvasData.objects.map((o: any) => o.id)).toEqual(['B', 'C', 'A']);
  if (!mobile) { await page.getByRole('button', { name: 'Undo', exact: true }).first().click(); expect((await saved(page)).canvasData.objects.map((o: any) => o.id)).toEqual(['A', 'B', 'C']); }
  expect(await panel.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
});

test('real touch drag reorders Arabic mobile layers and cancel leaves order unchanged', async ({ page }) => {
  const panel = await load(page, true, true);
  const handle = panel.locator('[data-layer-id="A"] button').first(); await handle.scrollIntoViewIfNeeded();
  const a = (await handle.boundingBox())!, c = (await panel.locator('[data-layer-id="C"]').boundingBox())!;
  const session = await page.context().newCDPSession(page);
  const x = a.x + a.width / 2, y = a.y + a.height / 2;
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: c.y + c.height / 2, id: 1 }] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
  expect((await saved(page, true)).canvasData.objects.map((o: any) => o.id)).toEqual(['A', 'B', 'C']);
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 2 }] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: c.y + c.height / 2, id: 2 }] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  expect((await saved(page, true)).canvasData.objects.map((o: any) => o.id)).toEqual(['B', 'C', 'A']);
  await session.detach();
});

test('compact rows keep actions, rename, visibility, locks and duplication without filters', async ({ page }) => {
  const panel = await load(page);
  await panel.getByRole('button', { name: 'Layer C', exact: true }).click();
  await panel.locator('[data-layer-id="A"]').getByRole('button', { name: 'Move layer up', exact: true }).click();
  expect((await saved(page)).canvasData.objects.map((o: any) => o.id)).toEqual(['B', 'A', 'C']);
  const row = panel.locator('[data-layer-id="A"]');
  await row.getByRole('button', { name: 'Rename layer', exact: true }).click();
  await row.getByRole('textbox', { name: 'Layer name', exact: true }).fill('Logo'); await page.keyboard.press('Enter');
  expect((await saved(page)).canvasData.objects.find((o: any) => o.id === 'A').name).toBe('Logo');
  await expect(panel.getByRole('textbox', { name: 'Search layers', exact: true })).toHaveCount(0);
  await expect(panel.getByRole('combobox')).toHaveCount(0);
  expect((await row.boundingBox())!.height).toBeLessThan(70);
  await row.getByRole('button', { name: 'Hide layer', exact: true }).click();
  await expect(panel.locator('[data-layer-id]')).toHaveCount(3);
  await row.getByRole('button', { name: 'Show layer', exact: true }).click();
  await row.getByRole('button', { name: 'Lock layer', exact: true }).click();
  await expect(row.getByRole('button', { name: 'Delete layer', exact: true })).toBeDisabled();
  await expect(row.getByRole('button', { name: 'Drag layer Logo', exact: true })).toBeDisabled();
  await row.getByRole('button', { name: 'Logo', exact: true }).click();
  await page.keyboard.press('Delete');
  expect((await saved(page)).canvasData.objects).toHaveLength(3);
  await row.getByRole('button', { name: 'Unlock layer', exact: true }).click();
  await row.getByRole('button', { name: 'Duplicate layer', exact: true }).click();
  const p = await saved(page);
  expect(p.canvasData.objects).toHaveLength(4);
  expect(new Set(p.canvasData.objects.map((o: any) => o.id)).size).toBe(4);
  expect(p.canvasData.objects.some((o: any) => o.name === 'Logo copy')).toBe(true);
});

test('layer IDs stay stable and keyboard reordering works without dragging', async ({ page }) => {
  const panel = await load(page, false, false, objects.map(({ id, ...o }) => o) as any);
  const first = (await saved(page)).canvasData.objects.map((o: any) => o.id);
  expect(first.every(Boolean)).toBe(true);
  await panel.getByRole('button', { name: 'Drag layer Layer A', exact: true }).focus();
  await page.keyboard.press('Alt+ArrowUp');
  const next = (await saved(page)).canvasData.objects.map((o: any) => o.id);
  expect(next).toEqual([first[1], first[0], first[2]]);
  expect((await saved(page)).canvasData.objects.map((o: any) => o.id)).toEqual(next);
});

test('long layer lists auto-scroll during drag; delete is undoable and carton guides stay protected', async ({ page }) => {
  const many = Array.from({ length: 20 }, (_, i) => ({ ...objects[0], id: `layer-${i}`, name: `Item ${i}` }));
  const panel = await load(page, false, false, many);
  const list = panel.locator('[data-layer-list]');
  const handle = panel.getByRole('button', { name: 'Drag layer Item 19', exact: true });
  const a = (await handle.boundingBox())!, bounds = (await list.boundingBox())!;
  await page.mouse.move(a.x + 10, a.y + 10); await page.mouse.down();
  await page.mouse.move(a.x + 10, bounds.y + bounds.height - 15, { steps: 8 });
  await expect.poll(() => list.evaluate(el => el.scrollTop)).toBeGreaterThan(20);
  await page.keyboard.press('Escape'); await page.mouse.up();
  expect((await saved(page)).canvasData.objects.map((o: any) => o.id)).toEqual(many.map(o => o.id));
  await list.evaluate(el => { el.scrollTop = 0; });
  await panel.locator('[data-layer-id="layer-19"]').getByRole('button', { name: 'Delete layer', exact: true }).click();
  expect((await saved(page)).canvasData.objects).toHaveLength(19);
  await page.getByRole('button', { name: 'Undo', exact: true }).first().click();
  expect((await saved(page)).canvasData.objects).toHaveLength(20);
  const { createCartonProject } = await import('../../src/packaging/project');
  const { DEFAULT_CARTON } = await import('../../src/packaging/geometry');
  const project = createCartonProject(DEFAULT_CARTON, 'Protected QA');
  await page.locator('#designer-project-input').setInputFiles({ name: 'carton.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ format: 'unitool-designcraft', version: 1, project })) });
  await page.getByRole('button', { name: 'Layers', exact: true }).click();
  const guides = page.locator('[data-layer-panel]:visible [data-protected="true"]');
  await expect(guides).toHaveCount(13);
  await expect(guides.first().getByRole('button', { name: 'Delete layer', exact: true })).toBeDisabled();
  await expect(guides.first().getByRole('button', { name: /Drag layer/ })).toBeDisabled();
});
