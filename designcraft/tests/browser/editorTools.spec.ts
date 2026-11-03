import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs/promises";
import { saveAndWait, storedProject, storedProjects } from "./helpers/storage";
const base = process.env.DESIGN_QA_URL || "http://localhost:3000";
function fixture(objects: any[]) {
  return {
    format: "unitool-designcraft",
    version: 1,
    project: {
      title: "Tools QA",
      width: 800,
      height: 600,
      category: "custom",
      canvasData: { background: "#FFFFFF", objects },
    },
  };
}
async function load(page: Page, objects: any[]) {
  await page.goto(base + "/designcraft.html");
  await page.locator('input[aria-label="ملف مشروع المصمم"]').setInputFiles({
    name: "test.unitool.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(fixture(objects))),
  });
  await expect(page.locator("#editor-layout")).toBeVisible();
  await expect(page.locator("canvas.upper-canvas")).toBeVisible();
}
async function saved(page: Page) {
  await saveAndWait(page, true);
  return storedProject(page, "Tools QA");
}
async function exportFile(page: Page, name: RegExp) {
  await page.getByRole('button', { name: 'استيراد / تصدير', exact: true }).click();
  await page
    .getByRole("button", { name: "تصدير", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name }).click();
  const pending = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "تحميل الصورة الآن", exact: true })
    .click();
  return fs.readFile((await (await pending).path())!);
}
test("editable JSON reimports as a new project and rejects unsafe resources", async ({
  page,
}) => {
  await load(page, [
    {
      type: "textbox",
      text: "Editable Arabic عربي",
      left: 100,
      top: 100,
      width: 250,
      fontSize: 32,
      fontFamily: "Arial",
      fill: "#123456",
    },
  ]);
  const project = JSON.parse(
    (await exportFile(page, /^مشروع قابل للتعديل/)).toString(),
  );
  expect(project.project.canvasData.objects[0].text).toBe(
    "Editable Arabic عربي",
  );
  await page.keyboard.press("Escape");
  await page.locator('input[aria-label="ملف مشروع المصمم"]').setInputFiles({
    name: "roundtrip.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(project)),
  });
  await expect
    .poll(() =>
      storedProjects(page).then((projects) =>
        projects.filter((p: any) => p.title === "Tools QA").length,
      ),
    )
    .toBe(2);
  await page.locator('input[aria-label="ملف مشروع المصمم"]').setInputFiles({
    name: "unsafe.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify(
        fixture([{ type: "image", src: "https://example.com/x.png" }]),
      ),
    ),
  });
  await expect(page.getByRole("alert")).toContainText("تعذر الاستيراد");
});
test("dragging snaps physical edges/centers and never saves guide lines as artwork", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await load(page, [
    {
      type: "rect",
      left: 100,
      top: 100,
      width: 100,
      height: 50,
      fill: "#ff0000",
      strokeWidth: 0,
    },
    {
      type: "rect",
      left: 300,
      top: 180,
      width: 100,
      height: 50,
      fill: "#0000ff",
      strokeWidth: 0,
    },
  ]);
  const canvas = page.locator("canvas.upper-canvas");
  await expect
    .poll(async () => (await canvas.boundingBox())!.width)
    .toBe(720); // Wait for the initial 90% auto-fit before mapping design coordinates.
  const b = (await canvas.boundingBox())!,
    z = b.width / 800;
  await page.mouse.move(b.x + 350 * z, b.y + 205 * z);
  await page.mouse.down();
  await page.mouse.move(b.x + 350 * z, b.y + 127 * z, { steps: 15 });
  await page.mouse.up();
  const project = await saved(page);
  expect(project.canvasData.objects.length).toBe(2);
  expect(Math.abs(project.canvasData.objects[1].top - 100)).toBeLessThan(1);
  expect(JSON.stringify(project.canvasData)).not.toContain("#f472b6");
});
test("clearing styled text and retyping starts an ordinary text run", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await load(page, [
    {
      type: "textbox",
      text: "Fancy",
      left: 200,
      top: 200,
      width: 250,
      fontSize: 32,
      fontWeight: 700,
      fontStyle: "italic",
      fontFamily: "Arial",
      fill: "#ff0000",
      stroke: "#333333",
      strokeWidth: 2,
      underline: true,
      shadow: { color: "#ff0000", blur: 5, offsetX: 2, offsetY: 2 },
      styles: { 0: { 0: { fill: "#00ff00" } } },
    },
  ]);
  const canvas = page.locator("canvas.upper-canvas");
  await expect
    .poll(async () => (await canvas.boundingBox())!.width)
    .toBe(720); // Wait for the initial 90% auto-fit before mapping design coordinates.
  const b = (await canvas.boundingBox())!,
    z = b.width / 800;
  await page.mouse.dblclick(b.x + 230 * z, b.y + 220 * z);
  await page.keyboard.press("Control+a");
  await page.keyboard.press("Backspace");
  await page.keyboard.type("Normal");
  await page.mouse.click(b.x + 700 * z, b.y + 500 * z);
  const p = await saved(page),
    text = p.canvasData.objects[0];
  expect(text.text).toBe("Normal");
  expect(text.fontWeight).toBe(400);
  expect(text.fontFamily).toBe("Cairo");
  expect(Object.keys(text.styles)).toEqual([]);
  expect(text.shadow).toBeNull();
  expect(text.strokeWidth).toBe(0);
  expect(text.underline).toBe(false);
});
test("ordinary carton export can hide manufacturing guides without deleting them", async ({
  page,
}) => {
  await page.goto(base + "/designcraft.html");
  await page
    .getByRole("button", { name: "قوالب العلب والمقاسات", exact: true })
    .click();
  await page
    .getByRole("button", { name: "إنشاء تصميم جديد بالقالب", exact: true })
    .click();
  await expect(page.locator("#editor-layout")).toBeVisible();
  await page.getByRole('button', { name: 'استيراد / تصدير', exact: true }).click();
  await page
    .getByRole("button", { name: "تصدير", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: /SVG Vector/ }).click();
  const toggle = page.getByRole("checkbox", {
    name: "تضمين خطوط القص والطي",
    exact: true,
  });
  await toggle.uncheck();
  const pending = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "تحميل الصورة الآن", exact: true })
    .click();
  const svg = (await fs.readFile((await (await pending).path())!)).toString();
  expect(svg).not.toContain('id="packaging-');
  await page.getByRole('button', { name: 'استيراد / تصدير', exact: true }).click();
  await page
    .getByRole("button", { name: "تصدير", exact: true })
    .first()
    .click();
  await toggle.check();
  const again = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "تحميل الصورة الآن", exact: true })
    .click();
  const withGuides = (
    await fs.readFile((await (await again).path())!)
  ).toString();
  expect(withGuides.length).toBeGreaterThan(svg.length);
});
test("raster sources and image filters survive editable project export", async ({
  page,
}) => {
  await page.goto(base + "/designcraft.html");
  const src = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = 20;
    c.height = 10;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#3456ff";
    ctx.fillRect(0, 0, 20, 10);
    return c.toDataURL();
  });
  await load(page, [
    {
      type: "image",
      src,
      width: 20,
      height: 10,
      left: 50,
      top: 60,
      scaleX: 4,
      scaleY: 4,
      filters: [{ type: "Brightness", brightness: 0.15 }],
    },
  ]);
  const project = JSON.parse(
    (await exportFile(page, /^مشروع قابل للتعديل/)).toString(),
  );
  const image = project.project.canvasData.objects[0];
  expect(image.src).toMatch(/^data:image\/png;base64,/);
  expect(image.filters[0].type).toBe("Brightness");
  expect(image.scaleX).toBe(4);
  await page.locator('input[aria-label="ملف مشروع المصمم"]').setInputFiles({
    name: "image-roundtrip.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(project)),
  });
  await expect(page.locator("#editor-layout")).toBeVisible();
  expect((await saved(page)).canvasData.objects[0].filters[0].brightness).toBe(
    0.15,
  );
});
test("hiding carton lines removes their actual raster pixels and project metadata remains editable", async ({
  page,
}) => {
  await page.goto(base + "/designcraft.html");
  await page
    .getByRole("button", { name: "قوالب العلب والمقاسات", exact: true })
    .click();
  await page
    .getByRole("button", { name: "إنشاء تصميم جديد بالقالب", exact: true })
    .click();
  await expect(page.locator("#editor-layout")).toBeVisible();
  await page.getByRole('button', { name: 'استيراد / تصدير', exact: true }).click();
  await page
    .getByRole("button", { name: "تصدير", exact: true })
    .first()
    .click();
  const toggle = page.getByRole("checkbox", {
    name: "تضمين خطوط القص والطي",
    exact: true,
  });
  await toggle.uncheck();
  const pending = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "تحميل الصورة الآن", exact: true })
    .click();
  const bytes = await fs.readFile((await (await pending).path())!);
  const colored = await page.evaluate(async (data) => {
    const image = new Image();
    image.src = "data:image/png;base64," + data;
    await image.decode();
    const c = document.createElement("canvas");
    c.width = image.width;
    c.height = image.height;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(image, 0, 0);
    const p = ctx.getImageData(0, 0, c.width, c.height).data;
    let colored = 0;
    for (let i = 0; i < p.length; i += 4)
      if (
        p[i + 3] > 128 &&
        Math.max(p[i], p[i + 1], p[i + 2]) -
          Math.min(p[i], p[i + 1], p[i + 2]) >
          10
      )
        colored++;
    return colored;
  }, bytes.toString("base64"));
  expect(colored).toBe(0);
  const project = JSON.parse(
    (await exportFile(page, /^مشروع قابل للتعديل/)).toString(),
  );
  expect(project.project.packaging.size.width).toBe(80);
  expect(
    project.project.canvasData.objects.filter((o: any) =>
      o.id?.startsWith("packaging-"),
    ).length,
  ).toBe(13);
  await page.locator('input[aria-label="ملف مشروع المصمم"]').setInputFiles({
    name: "carton.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(project)),
  });
  await expect(page.locator("#editor-layout")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "تصدير للطباعة", exact: true }),
  ).toBeVisible();
});
