import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs/promises';

const base = process.env.DESIGNCRAFT_QA_URL || 'http://localhost:3000';
const project = {
  id: 'qa-project', title: 'Studio QA', width: 800, height: 600, category: 'custom', createdAt: 1, updatedAt: 1,
  canvasData: { background: '#FFFFFF', objects: [
    { type: 'rect', id: 'qa-rect', left: 80, top: 80, width: 120, height: 80, fill: '#0EA5E9', strokeWidth: 0 },
    { type: 'textbox', id: 'qa-text', left: 440, top: 350, width: 240, height: 60, text: 'أفكارك، أدواتك', fontSize: 28, fill: '#0F172A' },
  ] },
};

async function open(page: Page, mobile = false, seed = project) {
  await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 });
  await page.addInitScript(({ project, mobile }) => {
    if (!localStorage.getItem('qa-seeded')) {
      localStorage.setItem('designcraft_saved_projects_v1', JSON.stringify([project]));
      localStorage.setItem('designcraft_open_tabs_v1', '[]');
      localStorage.setItem('unitool-lang', 'ar');
      localStorage.setItem('qa-seeded', 'true');
    }
    if (mobile) localStorage.setItem('unitool-lang', 'ar');
  }, { project: seed, mobile });
  // External fonts are not needed to verify editor behavior.
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ body: '', contentType: 'text/css' }));
  await page.goto(`${base}/designcraft.html`);
  await page.getByText('مشاريعي', { exact: true }).click();
  await page.getByText(project.title, { exact: true }).click();
  await expect(page.locator('.lower-canvas')).toBeVisible();
  await page.waitForTimeout(250);
}

async function backup(page: Page) {
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'تنزيل نسخة احتياطية قابلة للتعديل', exact: true }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toMatch(/\.unitool\.json$/);
  return JSON.parse(await fs.readFile((await download.path())!, 'utf8'));
}

async function selectAll(page: Page) {
  await page.locator('.upper-canvas').click({ position: { x: 5, y: 5 } });
  await page.keyboard.press('Control+a');
}

test('smart guides snap at zoom, clear on release and never enter exported pixels', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await open(page);
  const canvas = page.locator('.upper-canvas');
  const box = (await canvas.boundingBox())!;
  const scale = box.width / 800;
  // Move the rectangle's center from (140,120) close to the artboard center (400,300).
  await page.mouse.move(box.x + 140 * scale, box.y + 120 * scale);
  await page.mouse.down();
  await page.mouse.move(box.x + 397 * scale, box.y + 297 * scale, { steps: 12 });
  await expect(page.getByTestId('smart-guides-overlay')).toHaveAttribute('data-active-guides', '2');
  await page.mouse.up();
  await expect(page.getByTestId('smart-guides-overlay')).toHaveAttribute('data-active-guides', '0');
  const file = await backup(page);
  expect(file.project.canvasData.objects[0].left).toBe(340);
  expect(file.project.canvasData.objects[0].top).toBe(260);
  const overlayIsBlank = await page.getByTestId('smart-guides-overlay').evaluate((element: HTMLCanvasElement) => {
    const pixels = element.getContext('2d')!.getImageData(0, 0, element.width, element.height).data;
    for (let i = 3; i < pixels.length; i += 4) if (pixels[i]) return false;
    return true;
  });
  expect(overlayIsBlank).toBe(true);
  expect(errors).toEqual([]);
});

test('group, undo, redo and ungroup preserve editable objects', async ({ page }) => {
  await open(page);
  await selectAll(page);
  await page.keyboard.press('Control+g');
  await expect(page.getByRole('button', { name: 'فك المجموعة', exact: true }).first()).toBeVisible();
  expect((await backup(page)).project.canvasData.objects).toHaveLength(1);
  await page.keyboard.press('Control+z');
  await expect.poll(async () => (await backup(page)).project.canvasData.objects.length).toBe(2);
  await page.keyboard.press('Control+Shift+z');
  await expect.poll(async () => (await backup(page)).project.canvasData.objects[0].type).toBe('group');
  await page.locator('.upper-canvas').click({ position: { x: 80, y: 80 } });
  await page.keyboard.press('Control+Shift+g');
  const restored = (await backup(page)).project.canvasData.objects;
  expect(restored).toHaveLength(2);
  expect(restored.map((object: any) => object.type).sort()).toEqual(['rect', 'textbox']);
});

test('brand palette persists, recolors selection and extracts design colors', async ({ page }) => {
  await open(page);
  await page.getByTitle('ألواني (Brand colors)', { exact: true }).click();
  await page.getByRole('button', { name: 'استخراج ألوان التصميم', exact: true }).click();
  await expect(page.getByRole('button', { name: 'تطبيق اللون #0EA5E9', exact: true })).toBeVisible();
  await page.locator('.upper-canvas').click({ position: { x: 90, y: 90 } });
  await page.getByRole('button', { name: 'تطبيق اللون #0EA5E9', exact: true }).click();
  expect((await backup(page)).project.canvasData.objects[0].fill).toBe('#0EA5E9');
  await page.getByLabel('HEX', { exact: true }).fill('#123456');
  await page.getByRole('button', { name: 'إضافة اللون', exact: true }).click();
  await page.getByRole('button', { name: 'تطبيق اللون #123456', exact: true }).click();
  expect((await backup(page)).project.canvasData.objects[0].fill).toBe('#123456');
  await page.reload();
  await page.getByText('مشاريعي', { exact: true }).click();
  await page.getByText(project.title, { exact: true }).click();
  await page.getByTitle('ألواني (Brand colors)', { exact: true }).click();
  await expect(page.getByRole('button', { name: 'تطبيق اللون #123456', exact: true })).toBeVisible();
});

test('editable backup imports as a new project and rejects invalid files', async ({ page }) => {
  await open(page);
  const file = await backup(page);
  await page.getByRole('button', { name: 'العودة للشاشة الرئيسية', exact: true }).click();
  await page.getByText('مشاريعي', { exact: true }).click();
  await page.locator('input[type="file"][accept=".json,application/json"]').setInputFiles({ name: 'design.unitool.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(file)) });
  await expect(page.locator('#editor-layout')).toBeVisible();
  const imported = await backup(page);
  expect(imported.project.canvasData).toEqual(file.project.canvasData);
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('designcraft_saved_projects_v1')!));
  expect(stored).toHaveLength(2);
  expect(stored[0].id).not.toBe(stored[1].id);
  await page.getByRole('button', { name: 'العودة للشاشة الرئيسية', exact: true }).click();
  await page.getByText('مشاريعي', { exact: true }).click();
  await page.locator('input[type="file"][accept=".json,application/json"]').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{" nope') });
  await expect(page.getByText('تعذر استيراد الملف. اختر نسخة DesignCraft بصيغة JSON، بحد أقصى 12 MB.', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('designcraft_saved_projects_v1')!).length)).toBe(2);
});

test('mobile brand sheet and grouping controls fit the viewport', async ({ page }) => {
  await open(page, true);
  await page.locator('#mobile-bottom-nav').getByRole('button', { name: 'ألواني', exact: true }).click();
  await expect(page.getByRole('button', { name: 'استخراج ألوان التصميم', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'استخراج ألوان التصميم', exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('#mobile-bottom-nav').getByRole('button', { name: 'ألواني', exact: true }).click();
  await selectAll(page);
  await page.locator('#floating-object-hud').getByRole('button', { name: 'تجميع العناصر', exact: true }).click();
  await expect(page.locator('#floating-object-hud').getByRole('button', { name: 'فك المجموعة', exact: true })).toBeVisible();
  expect((await backup(page)).project.canvasData.objects[0].type).toBe('group');
});


test('gradient, pattern and embedded image survive an editable backup round trip', async ({ page }) => {
  const pixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWZ1sAAAAAElFTkSuQmCC';
  const assetProject: any = structuredClone(project);
  assetProject.canvasData.background = { type: 'linear', coords: { x1: 0, y1: 0, x2: 800, y2: 600 }, colorStops: [{ offset: 0, color: '#0F172A' }, { offset: 1, color: '#0EA5E9' }] };
  assetProject.canvasData.backgroundImage = { type: 'image', src: pixel, left: 0, top: 0, width: 1, height: 1, scaleX: 800, scaleY: 600, opacity: 0.2 };
  assetProject.canvasData.objects = [{ type: 'rect', left: 100, top: 100, width: 200, height: 200, fill: { type: 'pattern', source: pixel, repeat: 'repeat' } }];
  await open(page, false, assetProject);
  const original = await backup(page);
  expect(original.project.canvasData.background.colorStops).toHaveLength(2);
  expect(original.project.canvasData.backgroundImage.src).toBe(pixel);
  expect(original.project.canvasData.objects[0].fill.source).toBe(pixel);
  await page.getByRole('button', { name: 'العودة للشاشة الرئيسية', exact: true }).click();
  await page.getByText('مشاريعي', { exact: true }).click();
  await page.locator('input[type="file"][accept=".json,application/json"]').setInputFiles({ name: 'assets.unitool.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(original)) });
  await expect(page.locator('#editor-layout')).toBeVisible();
  const imported = await backup(page);
  // Fabric regenerates internal gradient ids when enlivening a document; the
  // visible colors, coordinates, image pixels and pattern must stay identical.
  expect(imported.project.canvasData.background.colorStops).toEqual(original.project.canvasData.background.colorStops);
  expect(imported.project.canvasData.background.coords).toEqual(original.project.canvasData.background.coords);
  expect(imported.project.canvasData.backgroundImage).toEqual(original.project.canvasData.backgroundImage);
  expect(imported.project.canvasData.objects).toEqual(original.project.canvasData.objects);
});
