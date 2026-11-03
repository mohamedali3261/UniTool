import { test, expect } from '@playwright/test';
const base = process.env.DESIGN_QA_URL || 'http://localhost:3000';
test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
test('mobile empty-space drag pans, object drag edits, and scroll rails are hidden', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('unitool-lang', 'en'));
  await page.goto(base + '/designcraft.html');
  await page.locator('#designer-project-input').setInputFiles({ name: 'gestures.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ format: 'unitool-designcraft', version: 1, project: { title: 'Gesture QA', width: 1600, height: 1200, canvasData: { objects: [{ type: 'rect', left: 300, top: 400, width: 80, height: 80, fill: '#ff0000', strokeWidth: 0 }] } } })) });
  await expect(page.locator('canvas.upper-canvas')).toBeVisible();
  for (let i = 0; i < 4; i++) { const close = page.getByRole('button', { name: 'Close', exact: true }); if (!await close.count()) break; await close.last().tap(); }
  await expect(page.getByRole('group', { name: 'Canvas tools', exact: true })).toHaveCount(0);
  await page.locator('#floating-zoom-pill').getByRole('button', { name: '100%', exact: true }).tap();
  const area = page.locator('#canvas-area-container');
  await expect.poll(() => area.evaluate(el => getComputedStyle(el).scrollbarWidth)).toBe('none');
  await area.evaluate(el => { el.scrollLeft = 150; el.scrollTop = 150; });
  const box = (await area.boundingBox())!;
  const session = await page.context().newCDPSession(page);
  async function drag(x: number, y: number, dx: number, dy: number) {
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] });
    for (let i = 1; i <= 5; i++) await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + dx * i / 5, y: y + dy * i / 5, id: 1 }] });
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  }
  await drag(box.x + 80, box.y + 180, 50, 30);
  await expect.poll(() => area.evaluate(el => el.scrollLeft)).toBe(100);
  await expect.poll(() => area.evaluate(el => el.scrollTop)).toBe(120);
  const save = async () => {
    await page.getByRole('button', { name: 'Save', exact: true }).first().tap();
    return page.evaluate(() => JSON.parse(localStorage.getItem('designcraft_saved_projects_v1')!).find((p: any) => p.title === 'Gesture QA').canvasData.objects[0]);
  };
  expect(await save()).toMatchObject({ left: 300, top: 400 });
  let canvas = (await page.locator('canvas.upper-canvas').boundingBox())!;
  await drag(canvas.x + 340, canvas.y + 440, 30, 25);
  expect(await save()).toMatchObject({ left: 300, top: 400 });
  expect(await area.evaluate(el => [el.scrollLeft, el.scrollTop])).toEqual([70, 95]);
  canvas = (await page.locator('canvas.upper-canvas').boundingBox())!;
  await page.touchscreen.tap(canvas.x + 340, canvas.y + 440);
  await drag(canvas.x + 340, canvas.y + 440, 30, 25);
  await expect(page.locator('#floating-object-hud')).toHaveCount(0);
  const object = await save();
  expect(object.left).toBeCloseTo(330, 0); expect(object.top).toBeCloseTo(425, 0);
  expect(await area.evaluate(el => [el.scrollLeft, el.scrollTop])).toEqual([70, 95]);
  await page.getByTitle('Fit to Screen', { exact: true }).tap();
  const fitted = (await page.locator('canvas.upper-canvas').boundingBox())!;
  await drag(fitted.x + 30, fitted.y + fitted.height - 25, 25, 15);
  const shifted = (await page.locator('canvas.upper-canvas').boundingBox())!;
  expect(shifted.x - fitted.x).toBeCloseTo(25, 0);
  expect(shifted.y - fitted.y).toBeCloseTo(15, 0);
  expect(await save()).toMatchObject({ left: 330, top: 425 });
  await session.detach();
});
