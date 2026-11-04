import { test, expect, type Page } from '@playwright/test';
import { saveAndWait, storedProject } from './helpers/storage';
const base = process.env.DESIGN_QA_URL || 'http://localhost:3000';
async function load(page: Page, lang = 'en', extra: any = {}) {
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
  await page.locator('#designer-project-input').setInputFiles({
    name: 'crop.json',
    mimeType: 'application/json',
    buffer: Buffer.from(
      JSON.stringify({
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
                id: 'crop-target',
                name: 'Crop target',
                type: 'image',
                src,
                width: 400,
                height: 200,
                left: 60,
                top: 60,
                scaleX: 0.75,
                scaleY: 0.75,
                ...extra,
              },
            ],
          },
        },
      }),
    ),
  });
  await expect(page.locator('canvas.upper-canvas')).toBeVisible();
  return src;
}
async function select(page: Page, lang = 'en') {
  await page
    .getByRole('button', {
      name: lang === 'ar' ? 'الطبقات' : 'Layers',
      exact: true,
    })
    .click();
  await page
    .locator('[data-layer-panel]:visible')
    .getByRole('button', { name: 'Crop target', exact: true })
    .click();
  await expect(
    page.getByRole('toolbar', {
      name: lang === 'ar' ? 'أدوات الصورة' : 'Image actions',
    }),
  ).toBeVisible();
}
async function saved(page: Page, ar = false) {
  await saveAndWait(page, ar);
  return (await storedProject(page, 'Crop QA')).canvasData.objects[0];
}
async function start(page: Page, lang = 'en') {
  await page
    .getByRole('button', {
      name: lang === 'ar' ? 'قص الصورة' : 'Crop image',
      exact: true,
    })
    .click();
  await expect(page.getByTestId('canvas-image-crop')).toBeVisible();
  const handle = page.getByRole('button', {
    name: lang === 'ar' ? 'تغيير حافة القص w' : 'Resize crop w',
    exact: true,
  });
  await handle.hover();
  return handle;
}
for (const width of [390, 900, 1440])
  test(`direct drag crop applies once, preserves source, and supports undo at ${width}px`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
        viewport: { width, height: 900 },
        isMobile: width < 768,
        hasTouch: width < 768,
      }),
      page = await context.newPage();
    const src = await load(page);
    await select(page);
    const handle = await start(page),
      box = (await handle.boundingBox())!,
      overlay = (await page.getByTestId('canvas-image-crop').boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(
      box.x + box.width / 2 + overlay.width * 0.25,
      box.y + box.height / 2,
      { steps: 8 },
    );
    await page.mouse.up();
    expect((await saved(page)).cropLeft || 0).toBe(0);
    await page.getByRole('button', { name: 'Apply crop', exact: true }).click();
    await expect(page.getByTestId('canvas-image-crop')).toHaveCount(0);
    const image = await saved(page);
    expect(image.cropLeft).toBeCloseTo(100, 0);
    expect(image.src).toBe(src);
    expect(image.clipPath).toBeTruthy();
    expect(image.scaleX).toBe(0.75);
    await page.keyboard.press('Control+z');
    await expect.poll(async () => (await saved(page)).cropLeft || 0).toBe(0);
    await page.keyboard.press('Control+y');
    await expect
      .poll(async () => (await saved(page)).cropLeft)
      .toBeCloseTo(100, 0);
    await page.reload();
    await page.getByRole('button', { name: /^My Projects/ }).click();
    await page.getByRole('heading', { name: 'Crop QA', exact: true }).click();
    await expect(page.locator('canvas.upper-canvas')).toBeVisible();
    expect((await saved(page)).cropLeft).toBeCloseTo(100, 0);
    await context.close();
  });
test('mobile focus brings an off-center large image fully into view', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await load(page, 'en', { left: 250, top: 160 });
  await select(page);
  await start(page);
  await expect
    .poll(async () => {
      const box = await page.getByTestId('canvas-image-crop').boundingBox();
      return !!box && box.x >= 0 && box.x + box.width <= 390;
    })
    .toBe(true);
});

test('removed crop fields and transform section are absent; property button focuses the actual image', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await load(page);
  await select(page);
  await expect(page.locator('.dc-crop-editor')).toHaveCount(0);
  await expect(page.locator('.dc-transform')).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Crop image on canvas', exact: true })
    .click();
  await expect(page.getByTestId('canvas-image-crop')).toBeInViewport({
    ratio: 1,
  });
  await expect(page.locator('.dc-properties:visible')).toHaveCount(0);
  const tools = page.getByRole('toolbar', { name: 'Image actions' });
  await expect(tools.getByRole('button')).toHaveCount(3);
  await tools.getByRole('button', { name: 'Cancel crop' }).click();
  expect((await saved(page)).cropLeft || 0).toBe(0);
});
test('Escape discards draft; delete from crop toolbar is undoable', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await load(page);
  await select(page);
  const handle = await start(page);
  await handle.focus();
  await page.keyboard.press('Shift+ArrowRight');
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('canvas-image-crop')).toHaveCount(0);
  expect((await saved(page)).cropLeft || 0).toBe(0);
  await start(page);
  await page.getByRole('button', { name: 'Delete image', exact: true }).click();
  await saveAndWait(page);
  expect(
    (await storedProject(page, 'Crop QA')).canvasData.objects,
  ).toHaveLength(0);
  await page.keyboard.press('Control+z');
  await expect
    .poll(async () => {
      await saveAndWait(page);
      return (await storedProject(page, 'Crop QA')).canvasData.objects.length;
    })
    .toBe(1);
});
test('mobile starts without a drawer, and the library is first on mobile and desktop', async ({
  browser,
}) => {
  for (const width of [390, 1440]) {
    const context = await browser.newContext({
        viewport: { width, height: 900 },
      }),
      page = await context.newPage();
    await load(page);
    const nav = page.locator(
      width < 768 ? '#mobile-bottom-nav' : '#sidebar-nav-tabs',
    );
    await expect(nav.getByRole('button').first()).toHaveText('Media');
    await expect(
      page.getByRole('button', { name: /Apply template/i }),
    ).toHaveCount(0);
    if (width < 768) {
      await expect(
        page.getByText('Media Library · Photos · Icons · Ornaments', {
          exact: true,
        }),
      ).not.toBeVisible();
      await nav.getByRole('button').first().click();
    }
    await expect(
      page
        .locator('span:visible')
        .filter({ hasText: 'Media Library · Photos · Icons · Ornaments' }),
    ).toBeVisible();
    await context.close();
  }
});
test('Arabic touch drag changes the crop without dragging artwork', async ({
  browser,
}) => {
  const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    }),
    page = await context.newPage();
  await load(page, 'ar');
  await select(page, 'ar');
  const handle = await start(page, 'ar'),
    box = (await handle.boundingBox())!,
    x = box.x + box.width / 2,
    y = box.y + box.height / 2,
    cdp = await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x, y, id: 1 }],
  });
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ x: x + 45, y, id: 1 }],
  });
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  });
  await page.getByRole('button', { name: 'تطبيق القص', exact: true }).click();
  const image = await saved(page, true);
  expect(image.cropLeft).toBeGreaterThan(10);
  expect(image.left).toBe(60);
  expect(image.top).toBe(60);
  await context.close();
});
test('rotated and flipped images keep crop interaction in source coordinates', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await load(page, 'en', { angle: 30, flipX: true });
  await select(page);
  const handle = await start(page);
  await handle.focus();
  await page.keyboard.press('Shift+ArrowRight');
  await page.getByRole('button', { name: 'Apply crop', exact: true }).click();
  const image = await saved(page);
  expect(image.cropLeft).toBe(10);
  expect(image.angle).toBe(30);
  expect(image.flipX).toBe(true);
  expect(image.left).toBe(60);
});
