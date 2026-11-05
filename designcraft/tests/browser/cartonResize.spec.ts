import fs from "node:fs/promises";
import { test, expect, type Page } from "@playwright/test";
import { createCartonProject } from "../../src/packaging/project";
import { cartonArtwork } from "../../src/packaging/artwork";
import {
  cartonGeometry,
  DEFAULT_CARTON,
  MM_TO_PX,
} from "../../src/packaging/geometry";
import { saveAndWait, storedProject, storedProjects } from "./helpers/storage";
const base = process.env.DESIGN_QA_URL || "http://localhost:3000";
async function load(page: Page) {
  await page.goto(base + "/designcraft.html");
  const project = createCartonProject(DEFAULT_CARTON, "Resize QA");
  project.canvasData.objects.push(
    ...cartonArtwork(DEFAULT_CARTON, {
      style: "noir",
      brand: "SAME BRAND",
      product: "ORIGINAL",
      accent: "#d6b77b",
      ml: 50,
    }),
  );
  await page.locator("#designer-project-input").setInputFiles({
    name: "resize.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({ format: "unitool-designcraft", version: 1, project }),
    ),
  });
  await expect(page.locator("#editor-layout")).toBeVisible();
  await saveAndWait(page, true);
  return storedProject(page, "Resize QA");
}
async function dimensions(
  page: Page,
  height: string,
  width: string,
  depth: string,
) {
  await page
    .getByRole("button", { name: "تعديل المقاسات", exact: true })
    .click();
  for (const [label, value] of [
    ["طول العلبة", height],
    ["عرض العلبة", width],
    ["عمق العلبة", depth],
  ])
    await page
      .getByRole("spinbutton", { name: label + " بالملليمتر", exact: true })
      .fill(value);
  await page
    .getByRole("button", { name: "تطبيق المقاسات", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}
test("resize same editable artwork, undo/redo nominal geometry, preview, physical export and persistence", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const before = await load(page),
    count = (await storedProjects(page)).length;
  await expect(
    page.getByRole("button", { name: "أدوات المصمم المتقدمة", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator(".adv-toolbar")).toHaveCount(0);
  await dimensions(page, "155", "105", "45");
  await expect(page.locator(".carton-editor-bar")).toContainText(
    "155 × 105 × 45 mm",
  );
  await saveAndWait(page, true);
  const after = await storedProject(page, "Resize QA"),
    g = cartonGeometry({
      ...DEFAULT_CARTON,
      height: 155,
      width: 105,
      depth: 45,
    });
  expect(after.id).toBe(before.id);
  expect((await storedProjects(page)).length).toBe(count);
  expect(after.width).toBeCloseTo(g.width * MM_TO_PX, 5);
  expect(after.height).toBeCloseTo(g.height * MM_TO_PX, 5);
  const original = before.canvasData.objects.filter(
      (o: any) => !o.id.startsWith("packaging-"),
    ),
    art = after.canvasData.objects.filter(
      (o: any) => !o.id.startsWith("packaging-"),
    );
  expect(art.map((o: any) => o.id)).toEqual(original.map((o: any) => o.id));
  for (let i = 0; i < art.length; i++) {
    expect(art[i].type).toBe(original[i].type);
    expect(art[i].text).toBe(original[i].text);
    expect(art[i].fill).toEqual(original[i].fill);
    if (art[i].type !== "rect")
      expect(art[i].scaleX / art[i].scaleY).toBeCloseTo(
        original[i].scaleX / original[i].scaleY,
        5,
      );
  }
  expect(
    after.canvasData.objects.filter((o: any) => o.id.startsWith("packaging-")),
  ).toHaveLength(13);
  await page.keyboard.press("Control+z");
  await expect(page.locator(".carton-editor-bar")).toContainText(
    "120 × 80 × 35 mm",
  );
  await saveAndWait(page, true);
  const undone = await storedProject(page, "Resize QA");
  expect(
    undone.canvasData.objects.filter(
      (o: any) => !o.id.startsWith("packaging-"),
    ),
  ).toEqual(original);
  await page.keyboard.press("Control+Shift+z");
  await expect(page.locator(".carton-editor-bar")).toContainText(
    "155 × 105 × 45 mm",
  );
  await saveAndWait(page, true);
  await page
    .getByRole("button", { name: "معاينة ثلاثية الأبعاد 360°", exact: true })
    .click();
  await expect(page.getByTestId("carton-3d-stage")).toHaveAttribute(
    "data-ready",
    "true",
    {timeout:30000},
  );
  await expect(page.getByRole("dialog")).toContainText("155 × 105 × 45 mm");
  await page
    .getByRole("button", { name: "إغلاق المعاينة", exact: true })
    .click();
  await page
    .getByRole("button", { name: "تصدير للطباعة", exact: true })
    .click();
  await expect(page.getByRole("dialog")).not.toContainText(
    "أدوات المصمم المتقدمة",
  );
  await page
    .getByRole("combobox", { name: "صيغة ملف الطباعة", exact: true })
    .selectOption("svg");
  const pending = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "تنزيل ملف الطباعة", exact: true })
    .click();
  const svg = await fs.readFile((await (await pending).path())!, "utf8");
  expect(svg).toContain(`width="${g.width}mm"`);
  expect(svg).toContain(`height="${g.height}mm"`);
  await page.keyboard.press("Escape");
  await page.reload();
  await page.getByRole("button", { name: "تصميم العلب",exact:true }).click();
  await page.getByRole("heading", { name: "Resize QA", exact: true }).click();
  await expect(page.locator(".carton-editor-bar")).toContainText(
    "155 × 105 × 45 mm",
  );
  expect(errors).toEqual([]);
});
test("mobile compact actions, invalid/cancel untouched, minimum dimensions adjust tabs safely", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const before = await load(page);
  const bar = page.locator(".carton-editor-bar");
  expect(await bar.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
    true,
  );
  for (const button of await bar.locator("button").all())
    expect((await button.boundingBox())!.height).toBeLessThanOrEqual(30);
  await page
    .getByRole("button", { name: "تعديل المقاسات", exact: true })
    .click();
  const input = page.getByRole("spinbutton", {
    name: "عمق العلبة بالملليمتر",
    exact: true,
  });
  await input.fill("0");
  await expect(
    page.getByRole("button", { name: "تطبيق المقاسات", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "إلغاء", exact: true }).click();
  await saveAndWait(page, true);
  expect((await storedProject(page, "Resize QA")).canvasData).toEqual(
    before.canvasData,
  );
  await dimensions(page, "30", "20", "10");
  await saveAndWait(page, true);
  const after = await storedProject(page, "Resize QA");
  expect(after.packaging.size).toEqual({
    height: 30,
    width: 20,
    depth: 10,
    glue: 8,
    tuck: 5,
  });
  await page.screenshot({
    path: ".cache/touch-browser/carton-resize-mobile.png",
  });
});
test("native image crop, groups, rotation, absolute clips and invalid atomic validation", async ({
  page,
}) => {
  await page.goto(base + "/designcraft.html");
  const result = await page.evaluate(async () => {
    const fabricPath = "/node_modules/.vite/deps/fabric.js",
      resizePath = "/designcraft/src/packaging/resize.ts",
      geometryPath = "/designcraft/src/packaging/geometry.ts";
    const { fabric } = (await import(fabricPath)).default,
      { resizeCarton } = await import(resizePath),
      {
        DEFAULT_CARTON: size,
        MM_TO_PX: px,
        cartonGeometry,
      } = await import(geometryPath);
    const c = new fabric.Canvas(null),
      g = cartonGeometry(size),
      p = g.panels[0],
      center = {
        left: (p.x + 40) * px,
        top: (p.y + 60) * px,
        originX: "center",
        originY: "center",
      };
    const source = document.createElement("canvas");
    source.width = 80;
    source.height = 40;
    source.getContext("2d")!.fillRect(0, 0, 80, 40);
    const image = new fabric.Image(source, {
      ...center,
      width: 30,
      height: 20,
      cropX: 12,
      cropY: 8,
      angle: 32,
      flipX: true,
    });
    image.id = "photo";
    image.clipPath = new fabric.Rect({
      ...center,
      width: 12,
      height: 14,
      absolutePositioned: true,
    });
    const group = new fabric.Group(
      [
        new fabric.Circle({ radius: 5 }),
        new fabric.Text("EDITABLE", { fontSize: 8, left: 12 }),
      ],
      { ...center, angle: 14 },
    );
    group.id = "group";
    c.add(image, group);
    const before = JSON.stringify(c.toJSON(["id"]));
    let rejected = false;
    try {
      await resizeCarton(c, size, { ...size, width: 0 });
    } catch {
      rejected = true;
    }
    const untouched = before === JSON.stringify(c.toJSON(["id"]));
    await resizeCarton(c, size, {
      ...size,
      width: 120,
      height: 180,
      depth: 50,
    });
    const result = {
      rejected,
      untouched,
      objects: c.getObjects().length,
      same: c.getObjects().includes(image) && c.getObjects().includes(group),
      crop: [image.cropX, image.cropY, image.width, image.height],
      angle: image.angle,
      flip: image.flipX,
      ratio: image.scaleX / image.scaleY,
      groupText: group.item(1).text,
      clip: image.clipPath.absolutePositioned,
    };
    c.dispose();
    return result;
  });
  expect(result).toEqual({
    rejected: true,
    untouched: true,
    objects: 15,
    same: true,
    crop: [12, 8, 30, 20],
    angle: 32,
    flip: true,
    ratio: 1,
    groupText: "EDITABLE",
    clip: true,
  });
});

test("English dimension controls adapt fractional millimetres on the same design", async ({
  page,
}) => {
  await load(page);
  await page.evaluate(() => {
    localStorage.setItem("unitool-lang", "en");
    window.dispatchEvent(
      new CustomEvent("unitool-lang-change", { detail: "en" }),
    );
  });
  await page
    .getByRole("button", { name: "Edit dimensions", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Resize carton design", exact: true }),
  ).toBeVisible();
  for (const [label, value] of [
    ["Carton length", "95.5"],
    ["Carton width", "40.2"],
    ["Carton depth", "30.1"],
  ])
    await page
      .getByRole("spinbutton", { name: label + " in millimetres", exact: true })
      .fill(value);
  await page
    .getByRole("button", { name: "Apply dimensions", exact: true })
    .click();
  await expect(page.locator(".carton-editor-bar")).toContainText(
    "95.5 × 40.2 × 30.1 mm",
  );
  await saveAndWait(page);
  expect((await storedProject(page, "Resize QA")).packaging.size).toEqual({
    height: 95.5,
    width: 40.2,
    depth: 30.1,
    glue: 12,
    tuck: 10.05,
  });
});
