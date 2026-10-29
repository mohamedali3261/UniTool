import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs/promises";
const base = process.env.STUDIO_QA_URL || "http://localhost:3000";
async function open(page: Page) {
  await page.goto(`${base}/video-studio.html`);
  const data = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = 160;
    c.height = 90;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#406090";
    ctx.fillRect(0, 0, 160, 90);
    return {
      version: 1,
      assets: [
        {
          id: "image",
          name: "sample.png",
          type: "image",
          duration: 5,
          url: c.toDataURL("image/png"),
        },
      ],
      project: {
        name: "Preview QA",
        ratio: "16:9",
        clips: [
          {
            id: "base",
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
            id: "caption",
            text: "نص قابل للتحريك",
            start: 0,
            end: 5,
            x: 50,
            y: 70,
            size: 52,
            color: "#ffffff",
          },
        ],
        overlays: [
          {
            id: "logo",
            assetId: "image",
            at: 0,
            start: 0,
            end: 5,
            x: 75,
            y: 25,
            width: 20,
            opacity: 1,
            rotation: 0,
            volume: 0,
          },
        ],
        audioId: null,
        audioVolume: 0.7,
      },
    };
  });
  await page.locator('input[type=file][accept=".json"]').setInputFiles({
    name: "preview.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(data)),
  });
  await page.locator(".preview-interaction").waitFor();
  await expect
    .poll(
      async () =>
        (await page.locator(".preview-interaction").boundingBox())?.width || 0,
    )
    .toBeGreaterThan(100);
}
async function save(page: Page) {
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "حفظ المشروع", exact: true }).click();
  return JSON.parse(await fs.readFile(await (await pending).path(), "utf8"));
}
async function pick(page: Page, name: RegExp) {
  await page
    .getByRole("combobox", { name: "عناصر المعاينة", exact: true })
    .click();
  await page.getByRole("option", { name }).click();
}
async function drag(
  page: Page,
  x: number,
  y: number,
  dx: number,
  dy: number,
  cancel = false,
) {
  const b = (await page.locator(".preview-interaction").boundingBox())!;
  await page.mouse.move(b.x + b.width * x, b.y + b.height * y);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width * (x + dx), b.y + b.height * (y + dy), {
    steps: 15,
  });
  if (cancel) await page.keyboard.press("Escape");
  await page.mouse.up();
}
test("canvas drag commits one undo entry, tracks canvas bounds, and Escape cancels", async ({
  page,
}) => {
  await open(page);
  const area = (await page.locator(".preview-interaction").boundingBox())!,
    canvas = (await page.locator(".canvas-stage canvas").boundingBox())!;
  expect(Math.abs(area.x - canvas.x)).toBeLessThan(1);
  expect(Math.abs(area.height - canvas.height)).toBeLessThan(1);
  await drag(page, 0.5, 0.7, 0.12, -0.08);
  const moved = (await save(page)).project.texts[0];
  expect(moved.x).toBeCloseTo(62, 0);
  expect(moved.y).toBeCloseTo(62, 0);
  await page.keyboard.press("Control+z");
  expect((await save(page)).project.texts[0].x).toBe(50);
  await page.keyboard.press("Control+Shift+z");
  expect((await save(page)).project.texts[0].x).toBeCloseTo(62, 0);
  await drag(page, 0.62, 0.62, -0.1, 0.15, true);
  expect((await save(page)).project.texts[0]).toEqual(moved);
});
test("resize and free rotation handles persist and inline text editing is undoable", async ({
  page,
}) => {
  await open(page);
  await pick(page, /نص قابل/);
  const handle = page.getByRole("button", {
    name: "تغيير حجم العنصر",
    exact: true,
  });
  const b = (await handle.boundingBox())!;
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2 + 30, b.y + b.height / 2 + 12, {
    steps: 10,
  });
  await page.mouse.up();
  expect((await save(page)).project.texts[0].size).toBeGreaterThan(52);
  const rotate = (await page
    .getByRole("button", { name: "مقبض تدوير العنصر", exact: true })
    .boundingBox())!;
  await page.mouse.move(rotate.x + 22, rotate.y + 22);
  await page.mouse.down();
  await page.mouse.move(rotate.x + 48, rotate.y + 52, { steps: 10 });
  await page.mouse.up();
  const rotated = (await save(page)).project.texts[0].rotation;
  expect(rotated).toBeGreaterThan(0);
  expect(rotated % 90).not.toBe(0);
  await page.getByRole("button", { name: "✎ النص", exact: true }).click();
  await page
    .getByRole("textbox", { name: "النص داخل المعاينة", exact: true })
    .fill("أول سطر\nوتاني سطر");
  await page.getByRole("button", { name: "تم ✓", exact: true }).click();
  expect((await save(page)).project.texts[0].text).toBe("أول سطر\nوتاني سطر");
  await page.keyboard.press("Control+z");
  expect((await save(page)).project.texts[0].text).toBe("نص قابل للتحريك");
});
test("overlay/base manipulation, lock safety, keyboard nudge, duplicate and hidden recovery", async ({
  page,
}) => {
  await open(page);
  await drag(page, 0.75, 0.25, -0.1, 0.1);
  expect((await save(page)).project.overlays[0].x).toBeCloseTo(65, 0);
  await page.getByRole("button", { name: "إخفاء العنصر", exact: true }).click();
  expect((await save(page)).project.overlays[0].hidden).toBe(true);
  await page.getByRole("button", { name: "إظهار العنصر", exact: true }).click();
  await pick(page, /نص قابل/);
  await page.getByRole("button", { name: "قفل العنصر", exact: true }).click();
  await page.locator(".preview-interaction").focus();
  await page.keyboard.press("Delete");
  const locked = await save(page);
  expect(locked.project.clips).toHaveLength(1);
  expect(locked.project.texts).toHaveLength(1);
  await page
    .getByRole("button", { name: "فتح قفل العنصر", exact: true })
    .click();
  await page.locator(".preview-interaction").focus();
  await page.keyboard.press("ArrowRight");
  expect((await save(page)).project.texts[0].x).toBeGreaterThan(50);
  await page.locator(".preview-interaction").focus();
  await page.keyboard.press("Control+d");
  expect((await save(page)).project.texts).toHaveLength(2);
  await page
    .getByRole("button", { name: "حذف العنصر المحدد", exact: true })
    .click();
  expect((await save(page)).project.texts).toHaveLength(1);
  await drag(page, 0.15, 0.5, 0.1, 0);
  expect((await save(page)).project.clips[0].x).toBeCloseTo(10, 0);
});
test("simplified text panel edits only one layer, preserves styles and canvas pixels", async ({
  page,
}) => {
  await open(page);
  await pick(page, /نص قابل/);
  await page.getByRole("button", { name: "تنسيق", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "محتوى النص", exact: true }),
  ).toHaveCount(1);
  await expect(page.locator(".text-advanced")).not.toHaveAttribute("open");
  await page
    .getByRole("textbox", { name: "محتوى النص", exact: true })
    .fill("نص مبسط");
  await page.getByRole("button", { name: "حدود", exact: true }).click();
  await page.getByRole("button", { name: "خلفية", exact: true }).click();
  const p = (await save(page)).project;
  expect(p.texts[0].text).toBe("نص مبسط");
  expect(p.texts[0].outline).toBe(true);
  expect(p.texts[0].background).toBe("#101116");
  const frame = () =>
    page
      .locator(".canvas-stage canvas")
      .evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL());
  const shown = await frame();
  await page.getByRole("button", { name: "إخفاء العنصر", exact: true }).click();
  await expect.poll(frame).not.toBe(shown);
  expect((await save(page)).project.texts[0].hidden).toBe(true);
});
test("real touch drag works on mobile without horizontal overflow", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await open(page);
  await page.locator(".preview-interaction").scrollIntoViewIfNeeded();
  const b = (await page.locator(".preview-interaction").boundingBox())!;
  const client = await context.newCDPSession(page);
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: b.x + b.width * 0.5, y: b.y + b.height * 0.7 }],
  });
  for (let i = 1; i <= 8; i++)
    await client.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        { x: b.x + b.width * (0.5 + (0.12 * i) / 8), y: b.y + b.height * 0.7 },
      ],
    });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  expect((await save(page)).project.texts[0].x).toBeCloseTo(62, 0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "تعديل", exact: true }).click();
  expect(
    await page
      .locator(".preview-interaction")
      .evaluate((el) => getComputedStyle(el).pointerEvents),
  ).toBe("none");
  await context.close();
});
