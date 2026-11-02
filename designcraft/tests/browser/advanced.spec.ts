import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs/promises";
import JSZip from "jszip";
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
          (await page.locator("canvas.upper-canvas").boundingBox())!.width,
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
  await page.getByRole("button", { name: "Save", exact: true }).first().click();
  return page.evaluate(
    (title) =>
      JSON.parse(localStorage.getItem("designcraft_saved_projects_v1")!).find(
        (p: any) => p.title === title,
      ),
    title,
  );
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
  await page.evaluate(() =>
    Object.defineProperty(Storage.prototype, "setItem", {
      value: () => {
        throw Error("Quota");
      },
    }),
  );
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
