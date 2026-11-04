// The advanced-tools launcher/modal was intentionally removed. Native core operations
// remain unit-tested; these checks cover retained editor behavior and headless recovery.
import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs/promises";
import { saveAndWait, storedProject } from "./helpers/storage";
const base = process.env.DESIGN_QA_URL || "http://localhost:3000";
const rects = [
  {
    type: "rect",
    left: 80,
    top: 80,
    width: 60,
    height: 40,
    strokeWidth: 0,
    fill: "#ff0000",
  },
  {
    type: "rect",
    left: 220,
    top: 130,
    width: 80,
    height: 40,
    strokeWidth: 0,
    fill: "#00ff00",
  },
  {
    type: "rect",
    left: 500,
    top: 200,
    width: 100,
    height: 40,
    strokeWidth: 0,
    fill: "#0000ff",
  },
];
async function load(
  page: Page,
  objects: any[] = rects,
  title = "Advanced QA",
  extra: any = {},
) {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.addInitScript(() => localStorage.setItem("unitool-lang", "en"));
  await page.goto(base + "/designcraft.html");
  await importDesign(page, objects, title, extra);
}
async function importDesign(
  page: Page,
  objects: any[],
  title: string,
  extra: any = {},
) {
  await page
    .getByLabel("Designer project file", { exact: true })
    .setInputFiles({
      name: "test.json",
      mimeType: "application/json",
      buffer: Buffer.from(
        JSON.stringify({
          format: "unitool-designcraft",
          version: 1,
          project: {
            title,
            width: 800,
            height: 600,
            canvasData: { background: "#ffffff", objects },
            ...extra,
          },
        }),
      ),
    });
  await expect(page.locator("#editor-layout")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Advanced designer tools", exact: true }),
  ).toHaveCount(0);
  if (!extra.packaging)
    await expect
      .poll(
        async () =>
          (await page.locator("canvas.upper-canvas").boundingBox())?.width,
      )
      .toBe(720);
}
async function saved(page: Page, title = "Advanced QA") {
  await saveAndWait(page);
  return storedProject(page, title);
}
async function select(page: Page, x: number, y: number) {
  const b = (await page.locator("canvas.upper-canvas").boundingBox())!,
    z = b.width / 800;
  await page.mouse.click(b.x + x * z, b.y + y * z);
}
async function download(page: Page, button: string) {
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: button, exact: true }).click();
  return fs.readFile((await (await pending).path())!);
}
async function projectFile(page: Page) {
  await page.getByRole('button', { name: 'Import / Export', exact: true }).click();
  await page
    .getByRole("button", { name: "Export", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: /^Editable project/ }).click();
  return JSON.parse((await download(page, "Download Image Now")).toString());
}
async function recoveries(page:Page,title='Advanced QA'){
 const project=await storedProject(page,title);
 return page.evaluate(async id=>{const path='/designcraft/src/advanced/core/recovery.ts';const {recoveryPoints}=await import(path);return recoveryPoints(id);},project.id);
}
test('automatic recovery keeps changed native artwork without the removed tools strip',async({page})=>{
 await load(page);await select(page,100,100);await page.keyboard.press('ArrowRight');
 await expect.poll(async()=>(await recoveries(page)).length).toBeGreaterThan(0);
 const first=JSON.parse((await recoveries(page))[0].data).project.canvasData.objects[0].left;
 await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');
 await expect.poll(async()=>(await recoveries(page)).length).toBeGreaterThanOrEqual(2);
 const points=await recoveries(page);expect(JSON.parse(points[0].data).project.canvasData.objects[0].left).toBeGreaterThan(first);
 expect(JSON.parse(points[points.length-1].data).project.canvasData.objects[0].left).toBe(first);
});
test("unsaved edits trigger beforeunload and save failures keep the warning", async ({
  page,
}) => {
  await load(page);
  await select(page, 100, 100);
  await page.keyboard.press("ArrowRight");
  await expect(page.locator(".adv-toolbar")).toHaveCount(0);
  const pending = page.waitForEvent("dialog");
  void page.evaluate(() => location.assign("/index.html")).catch(() => {});
  const warning = await pending;
  expect(warning.type()).toBe("beforeunload");
  await warning.dismiss();
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args: any[]) {
      if (this.name === "projects") throw new DOMException("Full", "QuotaExceededError");
      return original.apply(this, args);
    };
  });
  await page.getByRole("button", { name: "Save", exact: true }).first().click();
  await expect(page.locator(".adv-toolbar")).toHaveCount(0);
  const file = await projectFile(page);
  expect(file.project.title).toBe("Advanced QA");
});
test("curved text survives idle recovery, undo, cloning and reopening", async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.stack || error.message));
  const path = {
    type: 'path', path: [['M', 0, 0], ['Q', 130, 55, 260, 0]],
    fill: '', stroke: '', strokeWidth: 0, visible: false,
  };
  await load(page, ['textbox', 'i-text', 'text'].map((type, i) => ({
    type, text: `Curved ${type}`, left: 80, top: 70 + i * 140,
    width: 260, fontFamily: 'Arial', fontSize: 28, fill: '#223344', path,
  })));
  await select(page, 700, 500);
  await page.keyboard.press('Control+a');
  await page.keyboard.press('ArrowRight');
  // Wait for the real debounced automatic snapshot, not just a manual save.
  await expect.poll(async()=>(await recoveries(page)).length).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Undo', exact: true }).first().click();
  await page.getByRole('button', { name: 'Redo', exact: true }).first().click();
  await select(page, 700, 500);
  await page.keyboard.press('Control+a');
  await page.keyboard.press('Control+c');
  await page.keyboard.press('Control+v');
  await expect.poll(async () => (await saved(page)).canvasData.objects.length).toBe(6);
  await select(page, 700, 500);
  await page.keyboard.press('Control+a');
  const raw = await projectFile(page);
  await importDesign(page, raw.project.canvasData.objects, 'Curved reopened');
  const reopened = await saved(page, 'Curved reopened');
  const members = reopened.canvasData.objects;
  expect(members).toHaveLength(6);
  for (const text of members) {
    expect(text.path.type).toBe('path');
    expect(text.path.path).toEqual(path.path);
    expect(text.path.visible).toBe(false);
  }
  expect(errors).toEqual([]);
});

test('file dropdown combines import/export and compact dialog fits mobile and keyboard', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await load(page);
  const trigger = page.getByRole('button', { name: 'Import / Export', exact: true });
  await trigger.click();
  await expect(page.getByRole('button', { name: 'Import editable project', exact: true })).toBeVisible();
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Import editable project', exact: true }).click();
  expect((await chooser).isMultiple()).toBe(false);
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await trigger.click();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.getByRole('button', { name: 'Export', exact: true }).click();
  const modal = page.locator('#export-modal');
  for (const size of [{ width: 1440, height: 900 }, { width: 390, height: 640 }]) {
    await page.setViewportSize(size);
    const box = (await modal.boundingBox())!;
    expect(box.width).toBeLessThanOrEqual(384);
    expect(box.height).toBeLessThanOrEqual(size.height * .9 + 1);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(await modal.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  }
  // Arrow/delete shortcuts must not change the artwork behind an export dialog.
  await page.keyboard.press('Control+a');
  await page.keyboard.press('Delete');
  await page.keyboard.press('Tab');
  expect(await modal.evaluate(el => el.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(modal).toBeHidden();
  const triggerBox = (await trigger.boundingBox())!;
  expect(triggerBox.x).toBeGreaterThanOrEqual(0);
  expect(triggerBox.x + triggerBox.width).toBeLessThanOrEqual(390);
  await page.setViewportSize({ width: 1440, height: 900 });
  expect((await saved(page)).canvasData.objects).toHaveLength(3);
  expect(errors).toEqual([]);
});

test('repeated mixed-artwork edits and rapid undo redo remain renderable after idle snapshots', async ({ page }) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  let navigations = 0;
  await load(page, [...rects, {
    type: 'group', left: 350, top: 330, objects: [
      { type: 'textbox', text: 'Mixed artwork', fontFamily: 'Arial', fontSize: 24, width: 200,
        shadow: { color: '#333333', blur: 3, offsetX: 1, offsetY: 2 },
        fill: { type: 'linear', coords: { x1: 0, y1: 0, x2: 200, y2: 0 }, colorStops: [{ offset: 0, color: '#ff0000' }, { offset: 1, color: '#0000ff' }] } },
      { type: 'image', left: 0, top: 60, width: 1, height: 1, scaleX: 60, scaleY: 60,
        src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',
        clipPath: { type: 'circle', radius: .5, originX: 'center', originY: 'center' } },
    ],
  }]);
  page.on('framenavigated', frame => { if (frame === page.mainFrame()) navigations++; });
  await select(page, 100, 100);
  for (let round = 0; round < 6; round++) {
    for (let i = 0; i < 8; i++) await page.keyboard.press('ArrowRight');
    for (let i = 0; i < 4; i++) await page.keyboard.press('Control+z');
    for (let i = 0; i < 3; i++) await page.keyboard.press('Control+y');
    // Intentional idle interval: let the real 2-second debounce finish every cycle.
    await page.waitForTimeout(2400);
    await expect.poll(async()=>(await recoveries(page)).length).toBeGreaterThan(0);
    const p = await saved(page);
    expect(p.canvasData.objects).toHaveLength(4);
    expect(p.canvasData.objects[3].objects[1].clipPath.type).toBe('circle');
    await select(page, 100 + round * 8, 100);
  }
  const raw = await projectFile(page);
  expect(raw.project.canvasData.objects[3].objects[0].fill.type).toBe('linear');
  expect(navigations).toBe(0);
  expect(errors).toEqual([]);
});

test('Arabic-layout shortcuts and safe hand dragging never transform artwork', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await load(page);
  await select(page, 100, 100);
  const physical = async (code: string, key: string, ctrlKey = true) => {
    await page.evaluate(({ code, key, ctrlKey }) => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code, key, ctrlKey, bubbles: true, cancelable: true }));
      window.dispatchEvent(new KeyboardEvent('keyup', { code, key, ctrlKey, bubbles: true }));
    }, { code, key, ctrlKey });
  };
  await physical('KeyD', 'ي');
  expect((await saved(page)).canvasData.objects).toHaveLength(4);
  await physical('KeyZ', 'ئ');
  expect((await saved(page)).canvasData.objects).toHaveLength(3);
  await physical('KeyY', 'غ');
  expect((await saved(page)).canvasData.objects).toHaveLength(4);
  await physical('KeyA', 'ش');
  await physical('KeyC', 'ؤ');
  await physical('KeyV', 'ر');
  expect((await saved(page)).canvasData.objects).toHaveLength(8);
  await physical('KeyX', 'ء');
  expect((await saved(page)).canvasData.objects).toHaveLength(4);
  await physical('KeyS', 'س');
  await expect(page.locator('.adv-toolbar')).toHaveCount(0);
  const before = (await saved(page)).canvasData.objects;
  const box = (await page.locator('canvas.upper-canvas').boundingBox())!;
  const drag = async () => {
    await page.mouse.move(box.x + 100 * .9, box.y + 100 * .9);
    await page.mouse.down();
    await page.mouse.move(box.x + 190 * .9, box.y + 160 * .9, { steps: 8 });
    await page.mouse.up();
  };
  await physical('KeyH', 'ا', false);
  await expect(page.locator('#canvas-area-container')).toHaveClass(/cursor-grab/);
  await drag();
  expect((await saved(page)).canvasData.objects.map((o: any) => [o.left, o.top])).toEqual(before.map((o: any) => [o.left, o.top]));
  await physical('KeyV', 'ر', false);
  await page.keyboard.down('Space');
  await drag();
  await page.keyboard.up('Space');
  expect((await saved(page)).canvasData.objects.map((o: any) => [o.left, o.top])).toEqual(before.map((o: any) => [o.left, o.top]));
  expect(errors).toEqual([]);
});

test('text content may stay empty and retype Arabic without placeholder replacement', async ({ page }) => {
  await load(page, [{ type: 'textbox', text: 'Original', left: 100, top: 100, width: 250, fontSize: 32, fill: '#ff0000', fontFamily: 'Arial' }]);
  await select(page, 120, 120);
  const content = page.getByRole('textbox', { name: 'Text content', exact: true });
  await expect(content).toHaveValue('Original');
  await content.fill('');
  expect((await saved(page)).canvasData.objects[0].text).toBe('');
  await content.fill('نص جديد بدون نص افتراضي');
  let p = await saved(page);
  expect(p.canvasData.objects[0].text).toBe('نص جديد بدون نص افتراضي');
  expect(p.canvasData.objects[0].fill).toBe('#000000');
  expect(p.canvasData.objects[0].padding || 0).toBe(0);
  await content.fill('');
  await content.fill('Second');
  p = await saved(page);
  expect(p.canvasData.objects[0].text).toBe('Second');
});

test('touch hand and two-finger gestures leave artwork coordinates unchanged', async ({ page }) => {
  await load(page);
  const before = (await saved(page)).canvasData.objects.map((o: any) => [o.left, o.top, o.scaleX, o.scaleY]);
  await page.keyboard.press('h');
  const box = (await page.locator('canvas.upper-canvas').boundingBox())!;
  const session = await page.context().newCDPSession(page);
  const point = (x: number, y: number, id: number) => ({ x: box.x + x, y: box.y + y, id });
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point(100, 100, 1)] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point(180, 160, 1)] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.keyboard.press('v');
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point(150, 150, 1), point(250, 150, 2)] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point(130, 130, 1), point(280, 180, 2)] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  const after = (await saved(page)).canvasData.objects.map((o: any) => [o.left, o.top, o.scaleX, o.scaleY]);
  expect(after).toEqual(before);
  await session.detach();
});

test('oversized artboard supports plain wheel zoom and automatic blank-space dragging', async ({ page }) => {
  await load(page);
  await page.locator('#floating-zoom-pill').getByRole('button', { name: '100%', exact: true }).click();
  for (let i = 0; i < 12; i++) await page.locator('#floating-zoom-pill button').nth(1).click();
  const area = page.locator('#canvas-area-container');
  const info = await area.evaluate(el => { el.scrollLeft = 0; el.scrollTop = 0; return { width: el.clientWidth, scrollWidth: el.scrollWidth }; });
  expect(info.scrollWidth).toBeGreaterThan(info.width);
  const rect = (await area.boundingBox())!;
  await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
  const zoomBefore = await page.locator('#floating-zoom-pill').innerText();
  await page.mouse.wheel(0, 200);
  await expect.poll(() => page.locator('#floating-zoom-pill').innerText()).not.toBe(zoomBefore);
  await area.evaluate(el => { el.scrollLeft = 150; el.scrollTop = 150; });
  const before = await area.evaluate(el => el.scrollLeft);
  await page.mouse.move(rect.x + 80, rect.y + rect.height - 100);
  await page.mouse.down();
  await page.mouse.move(rect.x + 130, rect.y + rect.height - 70, { steps: 5 });
  await page.mouse.up();
  expect(await area.evaluate(el => el.scrollLeft)).toBeLessThan(before);
});

test('all 16 print templates apply as editable artwork at their suggested dimensions', async ({ page }) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const { PRINT_TEMPLATES } = await import('../../src/data/templates/print');
  await load(page);
  page.on('dialog', dialog => dialog.accept());
  await page.getByRole('button',{name:'Templates',exact:true}).click();
  for (const template of PRINT_TEMPLATES) {
    await page.locator(`[data-template-id="${template.id}"] > button`).first().click();
    await expect.poll(async () => {
      const p = await saved(page);
      return [p.width, p.height, p.canvasData.objects.length];
    }).toEqual([template.baseW, template.baseH, template.objects.length]);
    const p = await saved(page);
    expect(p.canvasData.objects.filter((o: any) => o.type === 'textbox').map((o: any) => o.text)).toEqual(template.objects.filter(o => o.type === 'text').map(o => o.text));
    expect(p.canvasData.objects.every((o: any) => ['textbox', 'rect', 'circle'].includes(o.type))).toBe(true);
  }
  expect(errors).toEqual([]);
});

test('template favorites persist and orientation/reset filters work without applying a design', async ({ page }) => {
  await load(page);
  await page.getByRole('button',{name:'Templates',exact:true}).click();
  const favorite = page.getByRole('button', { name: 'Favorite Round bakery sticker', exact: true });
  await favorite.click();
  await expect(favorite).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Favorites', exact: true }).click();
  await expect(page.locator('[data-template-id]:visible')).toHaveCount(1);
  await page.getByRole('combobox', { name: 'Template orientation', exact: true }).selectOption('landscape');
  await expect(page.locator('[data-template-id]:visible')).toHaveCount(0);
  await page.getByRole('button', { name: /reset/i }).click();
  await expect(page.locator('[data-template-id]:visible')).toHaveCount(59);
  await page.reload();
  await importDesign(page, rects, 'Favorite QA');
  await page.getByRole('button',{name:'Templates',exact:true}).click();
  await expect(favorite).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Favorites', exact: true }).click();
  await expect(page.locator('[data-template-id]:visible')).toHaveCount(1);
  await favorite.click();
  await expect(page.locator('[data-template-id]:visible')).toHaveCount(0);
});

test('desktop unselected artwork first-drag pans and requires a released click before movement', async ({ page }) => {
  await load(page);
  let box = (await page.locator('canvas.upper-canvas').boundingBox())!;
  await page.mouse.move(box.x + 100 * .9, box.y + 100 * .9);
  await page.mouse.down();
  await page.mouse.move(box.x + 140 * .9, box.y + 130 * .9, { steps: 6 });
  await page.mouse.up();
  expect((await saved(page)).canvasData.objects[0]).toMatchObject({ left: 80, top: 80 });
  box = (await page.locator('canvas.upper-canvas').boundingBox())!;
  await page.mouse.click(box.x + 100 * .9, box.y + 100 * .9);
  expect((await saved(page)).canvasData.objects[0]).toMatchObject({ left: 80, top: 80 });
  box = (await page.locator('canvas.upper-canvas').boundingBox())!;
  await page.mouse.move(box.x + 100 * .9, box.y + 100 * .9);
  await page.mouse.down();
  await page.mouse.move(box.x + 140 * .9, box.y + 130 * .9, { steps: 6 });
  await page.mouse.up();
  const object = (await saved(page)).canvasData.objects[0];
  expect(object.left).toBeGreaterThan(100); expect(object.top).toBeGreaterThan(100);
  await expect(page.locator('#floating-object-hud')).toHaveCount(0);
});
