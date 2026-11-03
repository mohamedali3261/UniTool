import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs/promises";
import JSZip from "jszip";
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
  ).toBeEnabled();
  if (!extra.packaging)
    await expect
      .poll(
        async () =>
          (await page.locator("canvas.upper-canvas").boundingBox())?.width,
      )
      .toBe(720);
}
async function openTools(page: Page, tab?: string) {
  await page
    .getByRole("button", { name: "Advanced designer tools", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Advanced designer tools",
    exact: true,
  });
  await expect(dialog).toBeVisible();
  if (tab) await dialog.getByRole("button", { name: tab, exact: true }).click();
  return dialog;
}
async function close(page: Page) {
  await page.getByRole("button", { name: "Close tools", exact: true }).click();
}
async function action(page: Page, label: string) {
  const dialog = page.getByRole("dialog", { name: "Advanced designer tools" });
  await dialog.getByRole("button", { name: label, exact: true }).click();
  await expect(dialog.locator(".adv-message")).toHaveText("Done.", {
    timeout: 20000,
  });
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
test("equal gaps, all alignments, grouping and member editing are real undoable operations", async ({
  page,
}) => {
  await load(page);
  await select(page, 700, 500);
  await page.keyboard.press("Control+a");
  const dialog = await openTools(page);
  await action(page, "Equal horizontal gaps");
  await action(page, "Top");
  await close(page);
  let p = await saved(page),
    o = p.canvasData.objects;
  expect(o.map((x: any) => Math.round(x.top))).toEqual([80, 80, 80]);
  expect(o[1].left - o[0].left - o[0].width).toBeCloseTo(
    o[2].left - o[1].left - o[1].width,
    2,
  );
  await openTools(page);
  await action(page, "Group objects");
  await close(page);
  p = await saved(page);
  expect(p.canvasData.objects[0].type).toBe("group");
  await openTools(page);
  await action(page, "Ungroup / edit members");
  await close(page);
  p = await saved(page);
  expect(p.canvasData.objects.length).toBe(3);
  await page.getByRole("button", { name: "Undo", exact: true }).first().click();
  p = await saved(page);
  expect(p.canvasData.objects[0].type).toBe("group");
});
test("precise transforms respect ratio and numeric coordinates", async ({
  page,
}) => {
  await load(page);
  await select(page, 100, 100);
  const dialog = await openTools(page);
  await dialog.getByLabel("X position", { exact: true }).fill("125");
  await dialog.getByLabel("Y position", { exact: true }).fill("145");
  await dialog.getByLabel("Width", { exact: true }).fill("120");
  await action(page, "Apply transform");
  await close(page);
  const p = await saved(page),
    o = p.canvasData.objects[0];
  expect(o.left).toBeCloseTo(125);
  expect(o.top).toBeCloseTo(145);
  expect(o.scaleX).toBeCloseTo(2);
  expect(o.scaleY).toBeCloseTo(2);
});
test("format painter preserves words, clear formatting and fitting survive project export", async ({
  page,
}) => {
  const source = {
      type: "textbox",
      left: 60,
      top: 80,
      width: 230,
      text: "Source",
      fontFamily: "Arial",
      fontSize: 40,
      fontWeight: 700,
      fill: "#ee3300",
      shadow: { color: "#ff0000", blur: 3, offsetX: 2, offsetY: 2 },
    },
    target = {
      type: "textbox",
      left: 400,
      top: 80,
      width: 230,
      text: "Target words here",
      fontFamily: "Arial",
      fontSize: 24,
      fill: "#333333",
    };
  await load(page, [source, target]);
  await select(page, 100, 100);
  await openTools(page, "Text formatting");
  await action(page, "Copy formatting only");
  await close(page);
  await select(page, 440, 100);
  await openTools(page, "Text formatting");
  await action(page, "Paste formatting");
  await close(page);
  let p = await saved(page);
  expect(p.canvasData.objects[1].text).toBe("Target words here");
  expect(p.canvasData.objects[1].fill).toBe("#ee3300");
  await openTools(page, "Text formatting");
  await action(page, "Clear formatting");
  const dialog = page.getByRole("dialog", { name: "Advanced designer tools" });
  await dialog.getByLabel("Box height in pixels", { exact: true }).fill("30");
  await action(page, "Apply fit policy");
  await close(page);
  p = await saved(page);
  expect(p.canvasData.objects[1].fontWeight).toBe(400);
  expect(p.canvasData.objects[1].shadow).toBeNull();
  expect(p.canvasData.objects[1].fontSize).toBeLessThan(40);
  expect(p.canvasData.objects[1].textFitMode).toBe("shrink");
  const file = await projectFile(page);
  expect(file.project.canvasData.objects[1].textFitHeight).toBe(30);
});
test("brand kit colors, font and uploaded logo persist and insert actual artwork", async ({
  page,
}) => {
  await load(page);
  await select(page, 100, 100);
  const dialog = await openTools(page, "Brand kit");
  await dialog.getByLabel("Brand name", { exact: true }).fill("My local brand");
  await dialog.getByLabel("Brand color 1", { exact: true }).fill("#6633aa");
  await dialog
    .getByRole("button", { name: "Apply color", exact: true })
    .first()
    .click();
  const buffer = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = 40;
    c.height = 20;
    c.getContext("2d")!.fillRect(0, 0, 40, 20);
    return c.toDataURL().split(",")[1];
  });
  await dialog
    .locator("input[type=file]")
    .setInputFiles({
      name: "logo.png",
      mimeType: "image/png",
      buffer: Buffer.from(buffer, "base64"),
    });
  await expect(
    dialog.getByRole("img", { name: "Brand logo", exact: true }),
  ).toBeVisible();
  await action(page, "Save brand locally");
  await action(page, "Insert brand logo");
  await close(page);
  const p = await saved(page);
  expect(p.canvasData.objects[0].fill).toBe("#6633aa");
  expect(p.canvasData.objects.at(-1).type).toBe("image");
  await importDesign(page, rects, "Brand second");
  await openTools(page, "Brand kit");
  await expect(page.getByLabel("Brand name", { exact: true })).toHaveValue(
    "My local brand",
  );
});
test("preflight reports hidden, off-canvas and low-DPI images", async ({
  page,
}) => {
  await load(page, [
    ...rects,
    {type: "image", src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=", left: 40, top: 40, width: 1, height: 1, scaleX: 80, scaleY: 80},
    {
      type: "rect",
      left: 900,
      top: 20,
      width: 60,
      height: 60,
      fill: "#333333",
      visible: false,
    },
  ]);
  const dialog = await openTools(page, "Export preflight");
  await dialog
    .getByRole("button", { name: "Run export preflight", exact: true })
    .click();
  await expect(dialog).toContainText("Hidden");
  await expect(dialog).toContainText("Outside canvas");
  await expect(dialog).toContainText("DPI < 300");
});
test("real background/transparent ZIP variants and multi-design archives download", async ({
  page,
}) => {
  await load(page);
  let dialog = await openTools(page, "Batch export");
  let zip = await JSZip.loadAsync(
    await download(page, "ZIP: background and transparent variants"),
  );
  expect(Object.keys(zip.files).length).toBe(2);
  const transparent = await zip
    .file(Object.keys(zip.files).find((x) => x.includes("transparent"))!)!
    .async("base64");
  const alpha = await page.evaluate(async (base64) => {
    const i = new Image();
    i.src = "data:image/png;base64," + base64;
    await i.decode();
    const c = document.createElement("canvas");
    c.width = i.width;
    c.height = i.height;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(i, 0, 0);
    return ctx.getImageData(0, 0, 1, 1).data[3];
  }, transparent);
  expect(alpha).toBe(0);
  await close(page);
  await saved(page);
  await importDesign(page, rects, "Batch second");
  dialog = await openTools(page, "Batch export");
  await dialog.getByLabel(/Advanced QA/).check();
  await dialog.getByLabel(/Batch second/).check();
  zip = await JSZip.loadAsync(
    await download(page, "Download selected designs ZIP"),
  );
  expect(Object.keys(zip.files).filter((n) => n.endsWith(".png")).length).toBe(
    2,
  );
});
test("recovery points contain changed artwork and can restore a prior version", async ({
  page,
}) => {
  await load(page);
  await select(page, 100, 100);
  await page.keyboard.press("ArrowRight");
  await openTools(page, "Recovery");
  await action(page, "Save recovery point now");
  await close(page);
  const first = (await saved(page)).canvasData.objects[0].left;
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  const dialog = await openTools(page, "Recovery");
  await action(page, "Save recovery point now");
  await expect
    .poll(() =>
      dialog
        .getByRole("button", { name: "Restore version", exact: true })
        .count(),
    )
    .toBeGreaterThanOrEqual(2);
  page.once("dialog", (d) => d.accept());
  await dialog
    .getByRole("button", { name: "Restore version", exact: true })
    .last()
    .click();
  await expect(dialog.locator(".adv-message")).toHaveText("Done.");
  await close(page);
  expect((await saved(page)).canvasData.objects[0].left).toBe(first);
});
test("unsaved edits trigger beforeunload and save failures keep the warning", async ({
  page,
}) => {
  await load(page);
  await select(page, 100, 100);
  await page.keyboard.press("ArrowRight");
  await expect(page.getByTestId("design-save-status")).toHaveText(
    "Unsaved changes",
  );
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
  await expect(page.getByTestId("design-save-status")).toHaveText(
    "Unsaved changes",
  );
  const file = await projectFile(page);
  expect(file.project.title).toBe("Advanced QA");
});
test("carton faces, safe/bleed guides, actual artwork 3D textures and print bleed work", async ({
  page,
}) => {
  const size = { width: 80, height: 120, depth: 35, glue: 12, tuck: 12 },
    s = 96 / 25.4;
  await load(
    page,
    [
      {
        type: "rect",
        left: 22 * s,
        top: 57 * s,
        width: 80 * s,
        height: 120 * s,
        fill: "#ff0000",
        strokeWidth: 0,
      },
    ],
    "Box advanced",
    {
      width: 262 * s,
      height: 234 * s,
      packaging: { kind: "reverse-tuck", version: 1, size },
    },
  );
  let dialog = await openTools(page, "Carton faces");
  await dialog
    .getByLabel("Show faces and print guides in editor only", { exact: true })
    .check();
  await dialog.getByLabel("Safe margin mm", { exact: true }).fill("4");
  await action(page, "Refresh assembled artwork preview");
  await expect(
    dialog.getByTestId("assembled-carton").locator("img"),
  ).toHaveCount(6);
  const front = await dialog
    .getByRole("img", { name: "Front", exact: true })
    .getAttribute("src");
  expect(front).toMatch(/^data:image\/png/);
  await dialog.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page.getByTestId("print-guides-overlay")).toBeVisible();
  await page.getByRole("button", { name: "Print export", exact: true }).click();
  const print = page.getByRole("dialog", { name: "Print carton artwork" });
  await print
    .getByRole("combobox", { name: "Print format", exact: true })
    .selectOption("svg");
  await print
    .getByRole("checkbox", { name: "Include print bleed", exact: true })
    .check();
  const bytes = await download(page, "Download print file");
  expect(bytes.toString()).not.toContain("print-guides-overlay");
  expect(bytes.toString()).toContain("262mm");
});
test("advanced tools fit an Arabic mobile viewport", async ({ page }) => {
  await load(page);
  await closeIfOpen(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByTitle('Switch Language / تبديل اللغة').click();
  while (await page.getByRole('button', { name: 'إغلاق', exact: true }).count()) {
    await page.getByRole('button', { name: 'إغلاق', exact: true }).last().click();
  }
  await page
    .getByRole("button", { name: "أدوات المصمم المتقدمة", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "أدوات المصمم المتقدمة" });
  for (const name of [
    "ترتيب ومقاسات",
    "تنسيق النص",
    "الهوية",
    "أوجه العلبة",
    "فحص التصدير",
    "استرداد النسخ",
    "تصدير جماعي",
  ])
    await dialog.getByRole("button", { name, exact: true }).click();
  expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
    true,
  );
});
async function closeIfOpen(page: Page) {
  const b = page.getByRole("button", { name: "Close tools", exact: true });
  if (await b.count()) await b.click();
}

test("curved text survives idle recovery, undo, cloning, grouping and reopening", async ({ page }) => {
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
  await expect(page.getByText('Recovery: Local version saved', { exact: true })).toBeVisible({ timeout: 15000 });
  const recovery = await openTools(page, 'Recovery');
  page.once('dialog', d => d.accept());
  await recovery.getByRole('button', { name: 'Restore version', exact: true }).first().click();
  await expect(recovery.locator('.adv-message')).toHaveText('Done.');
  await close(page);
  await page.getByRole('button', { name: 'Undo', exact: true }).first().click();
  await page.getByRole('button', { name: 'Redo', exact: true }).first().click();
  await select(page, 700, 500);
  await page.keyboard.press('Control+a');
  await page.keyboard.press('Control+c');
  await page.keyboard.press('Control+v');
  await expect.poll(async () => (await saved(page)).canvasData.objects.length).toBe(6);
  await select(page, 700, 500);
  await page.keyboard.press('Control+a');
  await openTools(page, 'Arrange & dimensions');
  await action(page, 'Group objects');
  await close(page);
  const grouped = await saved(page);
  expect(grouped.canvasData.objects[0].objects).toHaveLength(6);
  const raw = await projectFile(page);
  await importDesign(page, raw.project.canvasData.objects, 'Curved reopened');
  const reopened = await saved(page, 'Curved reopened');
  const members = reopened.canvasData.objects[0].objects;
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
    await expect(page.getByText('Recovery: Local version saved', { exact: true })).toBeVisible({ timeout: 10000 });
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
  await expect(page.getByTestId('design-save-status')).toHaveText('No unsaved changes');
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
