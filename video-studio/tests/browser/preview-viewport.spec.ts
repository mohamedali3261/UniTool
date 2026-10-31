import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs/promises";
import { blankProject } from "../../src/types";
const base = process.env.STUDIO_QA_URL || "http://localhost:3000";
async function open(page: Page) {
  await page.goto(`${base}/video-studio.html`);
  const url = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = 320;
    c.height = 180;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#175a64";
    ctx.fillRect(0, 0, 320, 180);
    return c.toDataURL();
  });
  const data = {
    version: 1,
    assets: [
      { id: "image", name: "scene.png", type: "image", duration: 5, url },
    ],
    project: {
      ...blankProject(),
      name: "Viewport QA",
      clips: [
        {
          id: "clip",
          assetId: "image",
          start: 0,
          end: 5,
          speed: 1,
          volume: 1,
          filter: "original",
          brightness: 1,
          contrast: 1,
          saturation: 1,
        },
      ],
      texts: [
        {
          id: "text",
          text: "نص المعاينة",
          start: 0,
          end: 5,
          x: 50,
          y: 50,
          size: 42,
          color: "#ffffff",
        },
      ],
    },
  };
  await page
    .locator('input[type=file][accept=".json"]')
    .setInputFiles({
      name: "viewport.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(data)),
    });
  await expect(page.locator(".preview-view-toggle")).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator(".preview-interaction")
        .evaluate((el) => el.getBoundingClientRect().width),
    )
    .toBeGreaterThan(10);
}
const menu = (page: Page) =>
  page.getByRole("button", { name: "خيارات عرض المعاينة", exact: true });
async function save(page: Page) {
  const next = page.waitForEvent("download");
  await page.getByRole("button", { name: "حفظ المشروع", exact: true }).click();
  return JSON.parse(await fs.readFile(await (await next).path(), "utf8"));
}
test("preview zoom, grid, fit and PNG capture do not change project or frame pixels", async ({
  page,
}) => {
  await open(page);
  const before = await save(page);
  const pixels = await page
    .locator(".canvas-stage canvas")
    .evaluate((c: HTMLCanvasElement) => c.toDataURL());
  await menu(page).click();
  await page
    .getByRole("button", { name: "زوم المعاينة 200%", exact: true })
    .click();
  await expect(menu(page)).toContainText("200%");
  await expect
    .poll(() =>
      page.evaluate(() => {
        const canvas = document
          .querySelector(".canvas-stage canvas")!
          .getBoundingClientRect();
        const overlay = document
          .querySelector(".preview-interaction")!
          .getBoundingClientRect();
        return (
          Math.abs(canvas.width - overlay.width) +
          Math.abs(canvas.x - overlay.x)
        );
      }),
    )
    .toBeLessThan(2);
  await page
    .getByRole("button", { name: "شبكة وهوامش آمنة", exact: true })
    .click();
  await expect(page.locator(".preview-composition-guides")).toBeVisible();
  expect(
    await page
      .locator(".canvas-stage canvas")
      .evaluate((c: HTMLCanvasElement) => c.toDataURL()),
  ).toBe(pixels);
  const next = page.waitForEvent("download");
  await page.getByRole("button", { name: "حفظ لقطة PNG", exact: true }).click();
  const shot = await next;
  expect(shot.suggestedFilename()).toMatch(/\.png$/);
  const png = await fs.readFile(await shot.path());
  expect(png.subarray(1, 4).toString()).toBe("PNG");
  await page
    .getByRole("button", { name: "ملاءمة وتوسيط", exact: true })
    .click();
  await expect(menu(page)).toContainText("100%");
  await page.keyboard.press("Escape");
  await expect(menu(page)).toBeFocused();
  expect((await save(page)).project).toEqual(before.project);
});
test("pan moves the viewport, not the selected element; cancelling a pan restores its starting view", async ({
  page,
}) => {
  await open(page);
  const before = await save(page);
  await menu(page).click();
  await page
    .getByRole("button", { name: "زوم المعاينة 200%", exact: true })
    .click();
  await page.getByRole("button", { name: "تحريك العرض", exact: true }).click();
  await page.keyboard.press("Escape");
  const stage = page.locator(".canvas-stage"),
    b = (await stage.boundingBox())!;
  const x = b.x + b.width / 2,
    y = b.y + b.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 45, y + 25, { steps: 5 });
  await page.mouse.up();
  const transform = await page
    .locator(".canvas-stage canvas")
    .evaluate((el) => (el as HTMLElement).style.transform);
  expect(transform).toContain("45px");
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - 40, y - 20, { steps: 5 });
  await page.keyboard.press("Escape");
  await page.mouse.up();
  await expect
    .poll(() =>
      page
        .locator(".canvas-stage canvas")
        .evaluate((el) => (el as HTMLElement).style.transform),
    )
    .toBe(transform);
  expect((await save(page)).project).toEqual(before.project);
});
test("Ctrl-wheel zoom stays scoped to preview and frame-step uses 30 FPS", async ({
  page,
}) => {
  await open(page);
  const r = (await page.locator(".canvas-stage").boundingBox())!;
  await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2);
  await page.keyboard.down("Control");
  await page.mouse.wheel(0, -200);
  await page.keyboard.up("Control");
  await expect(menu(page)).not.toContainText("100%");
  await menu(page).click();
  await page
    .getByRole("button", { name: "الفريم التالي", exact: true })
    .click();
  expect(
    Number(
      await page
        .getByRole("spinbutton", { name: "الانتقال إلى ثانية", exact: true })
        .inputValue(),
    ),
  ).toBeCloseTo(1 / 30, 3);
  await page
    .getByRole("button", { name: "الفريم السابق", exact: true })
    .click();
  await expect(
    page.getByRole("spinbutton", { name: "الانتقال إلى ثانية", exact: true }),
  ).toHaveValue("0");
});
for (const width of [320, 390])
  test(`viewport controls remain bounded and usable on mobile ${width}`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    await open(page);
    await menu(page).click();
    const panel = page.locator(".preview-view-panel");
    const b = (await panel.boundingBox())!;
    expect(b.x).toBeGreaterThanOrEqual(0);
    expect(b.y).toBeGreaterThanOrEqual(0);
    expect(b.x + b.width).toBeLessThanOrEqual(width);
    await page
      .getByRole("button", { name: "زوم المعاينة 200%", exact: true })
      .click();
    await expect(menu(page)).toContainText("200%");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({ path: `.cache/preview-mobile-${width}.png` });
    await context.close();
  });

test("direct text editing remains correctly mapped at 200% zoom and is undoable", async ({
  page,
}) => {
  await open(page);
  await menu(page).click();
  await page
    .getByRole("button", { name: "زوم المعاينة 200%", exact: true })
    .click();
  await page.keyboard.press("Escape");
  const r = (await page.locator(".canvas-stage canvas").boundingBox())!;
  const x = r.x + r.width / 2,
    y = r.y + r.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + r.width * 0.05, y, { steps: 8 });
  await page.mouse.up();
  expect((await save(page)).project.texts[0].x).toBeCloseTo(55, 0);
  await page.keyboard.press("Control+z");
  expect((await save(page)).project.texts[0].x).toBe(50);
});
