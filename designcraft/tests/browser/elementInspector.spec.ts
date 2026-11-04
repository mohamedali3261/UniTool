import { test, expect, type Page } from '@playwright/test';
import { saveAndWait, storedProject } from './helpers/storage';
const base = process.env.DESIGN_QA_URL || 'http://localhost:3000';
async function load(page: Page, lang = 'en') {
  await page.addInitScript(
    (lang) => localStorage.setItem('unitool-lang', lang),
    lang,
  );
  await page.goto(base + '/designcraft.html');
  const src = await page.evaluate(() => {
    const c = document.createElement('canvas');
    c.width = 400;
    c.height = 200;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = 'red';
    ctx.fillRect(0, 0, 200, 200);
    ctx.fillStyle = 'blue';
    ctx.fillRect(200, 0, 200, 200);
    return c.toDataURL();
  });
  const project = {
    format: 'unitool-designcraft',
    version: 1,
    project: {
      title: 'Crop QA',
      width: 600,
      height: 400,
      canvasData: {
        background: '#fff',
        objects: [
          {
            id: 'image-qa',
            type: 'image',
            src,
            width: 400,
            height: 200,
            left: 60,
            top: 60,
            scaleX: 0.75,
            scaleY: 0.75,
          },
        ],
      },
    },
  };
  await page
    .locator('#designer-project-input')
    .setInputFiles({
      name: 'crop.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(project)),
    });
  await expect(page.locator('canvas.upper-canvas')).toBeVisible();
  for (let i = 0; i < 4; i++) {
    const close = page.getByRole('button', {
      name: lang === 'ar' ? 'إغلاق' : 'Close',
      exact: true,
    });
    if (!(await close.count())) break;
    await close.last().click();
  }
  const b = (await page.locator('canvas.upper-canvas').boundingBox())!;
  await page.mouse.click(
    b.x + (b.width * 200) / 600,
    b.y + (b.height * 120) / 400,
  );
  if ((await page.viewportSize())!.width < 768)
    await page
      .locator('#mobile-bottom-nav')
      .getByRole('button', {
        name: lang === 'ar' ? 'الخصائص' : 'Properties',
        exact: true,
      })
      .click();
  await expect(page.locator('.dc-crop-editor:visible')).toBeVisible();
  return src;
}
async function saved(page: Page) {
  await saveAndWait(page);
  return (await storedProject(page, 'Crop QA')).canvasData.objects[0];
}
for (const width of [390, 900, 1440])
  test(`crop is previewed, applied atomically, undoable and saved at ${width}px`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
        viewport: { width, height: 900 },
        isMobile: width < 768,
        hasTouch: width < 768,
      }),
      page = await context.newPage();
    const src = await load(page),
      crop = page.locator('.dc-crop-editor:visible');
    if (width < 768) {
      const dock = (await page
          .locator('#mobile-properties-dock')
          .boundingBox())!,
        canvas = (await page.locator('#canvas-area-container').boundingBox())!;
      expect(dock.height).toBeLessThan(900 * 0.45);
      expect(canvas.height).toBeGreaterThan(200);
      expect(canvas.y + canvas.height).toBeLessThanOrEqual(dock.y + 1);
    }
    await crop.getByRole('button', { name: '1:1', exact: true }).click();
    await expect(crop.locator('output')).toHaveText('200 × 200 px');
    let image = await saved(page);
    expect(image.cropLeft || 0).toBe(0);
    await crop.getByRole('button', { name: 'Apply crop', exact: true }).click();
    image = await saved(page);
    expect(image.cropLeft).toBe(100);
    expect(image.cropRight).toBe(100);
    expect(image.src).toBe(src);
    expect(image.clipPath).toBeTruthy();
    expect(image.scaleX).toBe(0.75);
    await page.keyboard.press('Control+z');
    await expect.poll(async () => (await saved(page)).cropLeft || 0).toBe(0);
    await page.keyboard.press('Control+y');
    await expect.poll(async () => (await saved(page)).cropLeft).toBe(100);
    await page.reload();
    await page.getByRole('button', { name: /^My Projects/ }).click();
    await page.getByRole('heading', { name: 'Crop QA', exact: true }).click();
    await expect(page.locator('canvas.upper-canvas')).toBeVisible();
    expect((await saved(page)).cropRight).toBe(100);
    await context.close();
  });
test('cancel discards the draft, keyboard moves the region, and reset restores the original', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await load(page);
  const crop = page.locator('.dc-crop-editor:visible');
  await crop.getByRole('button', { name: '1:1', exact: true }).click();
  const region = crop.getByRole('group', { name: /Crop region/ });
  await region.focus();
  await page.keyboard.press('Shift+ArrowRight');
  await expect(crop.getByLabel('Left %', { exact: true })).toHaveValue('27.5');
  await crop
    .getByRole('button', { name: 'Cancel changes', exact: true })
    .click();
  await expect(crop.locator('output')).toHaveText('400 × 200 px');
  await crop.getByRole('button', { name: '9:16', exact: true }).click();
  await crop.getByRole('button', { name: 'Apply crop', exact: true }).click();
  await crop
    .getByRole('button', { name: 'Restore full image', exact: true })
    .click();
  const image = await saved(page);
  expect(image.cropLeft).toBe(0);
  expect(image.cropRight).toBe(0);
  expect(image.clipPath).toBeFalsy();
});
test('linked dimensions resize proportionally; rotate and flip survive saving', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await load(page);
  const panel = page.locator('.dc-properties:visible'),
    transform = panel.locator('.dc-transform');
  await transform.locator('summary').click();
  await transform.getByLabel('Width', { exact: true }).fill('240');
  let image = await saved(page);
  expect(image.scaleX).toBe(0.6);
  expect(image.scaleY).toBe(0.6);
  await transform
    .getByRole('button', { name: 'Rotate 90°', exact: true })
    .click();
  await transform
    .getByRole('button', { name: 'Flip horizontally', exact: true })
    .click();
  image = await saved(page);
  expect(image.angle).toBe(90);
  expect(image.flipX).toBe(true);
});
test('an off-center crop shows the chosen source pixels rather than recentering the mask', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await load(page);
  const crop = page.locator('.dc-crop-editor:visible');
  await crop.getByLabel('Left %', { exact: true }).fill('75');
  await crop.getByRole('button', { name: 'Apply crop', exact: true }).click();
  const pixel = async (x: number) =>
    page
      .locator('canvas.lower-canvas')
      .evaluate(
        (el: HTMLCanvasElement, x) =>
          Array.from(
            el
              .getContext('2d')!
              .getImageData(
                Math.round((x * el.width) / 600),
                Math.round((100 * el.height) / 400),
                1,
                1,
              ).data,
          ),
        x,
      );
  await expect.poll(() => pixel(200)).toEqual([255, 255, 255, 255]);
  await expect.poll(() => pixel(300)).toEqual([0, 0, 255, 255]);
  const image = await saved(page);
  expect(image.cropLeft).toBe(300);
  expect(image.clipPath.left).toBe(150);
});
test('Arabic mobile crop supports touch dragging while leaving a usable canvas preview', async ({
  browser,
}) => {
  const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    }),
    page = await context.newPage();
  await load(page, 'ar');
  const crop = page.locator('.dc-crop-editor:visible');
  await crop.getByRole('button', { name: '1:1', exact: true }).click();
  const region = crop.getByRole('group', { name: /منطقة القص/ });
  await region.scrollIntoViewIfNeeded();
  const b = (await region.boundingBox())!,
    cdp = await context.newCDPSession(page),
    x = b.x + b.width / 2,
    y = b.y + b.height / 2;
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x, y, id: 1 }],
  });
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ x: x + 20, y, id: 1 }],
  });
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  });
  expect(
    Number(await crop.getByLabel('يسار %', { exact: true }).inputValue()),
  ).toBeGreaterThan(25);
  await crop.getByRole('button', { name: 'تطبيق القص', exact: true }).click();
  await saveAndWait(page, true);
  expect(
    (await storedProject(page, 'Crop QA')).canvasData.objects[0].cropLeft,
  ).toBeGreaterThan(100);
  await region.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: '.cache/touch-browser/inspector-mobile-ar.png',
  });
  await context.close();
});
