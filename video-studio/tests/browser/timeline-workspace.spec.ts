import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs/promises";
import { blankProject } from "../../src/types";
const base = process.env.STUDIO_QA_URL || "http://localhost:3000";
const more = (page: Page) =>
  page.getByRole("button", { name: "خيارات التايم لاين", exact: true });
async function open(page: Page, count = 1, stacked = false) {
  await page.goto(`${base}/video-studio.html`);
  const url = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = 160;
    c.height = 90;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#165d69";
    ctx.fillRect(0, 0, 160, 90);
    return c.toDataURL();
  });
  const data = {
    version: 1,
    assets: [
      { id: "image", name: "صورة المشهد", type: "image", duration: 5, url },
    ],
    project: {
      ...blankProject(),
      name: "Timeline workspace QA",
      clips: Array.from({ length: count }, (_, i) => ({
        id: `clip-${i}`,
        assetId: "image",
        start: 0,
        end: 2,
        speed: 1,
        volume: 1,
        filter: "original",
        brightness: 1,
        contrast: 1,
        saturation: 1,
      })),
      texts: Array.from({ length: count }, (_, i) => ({
        id: `text-${i}`,
        text: `نص ${i}`,
        start: stacked ? 0 : i * 2,
        end: stacked ? 2 : i * 2 + 1,
        x: 50,
        y: 50,
        size: 24,
        color: "#ffffff",
      })),
    },
  };
  await page
    .locator('input[type=file][accept=".json"]')
    .setInputFiles({
      name: "timeline.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(data)),
    });
  await expect(page.locator(".timeline-pro")).toBeVisible();
  return data;
}
async function save(page: Page) {
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "حفظ المشروع", exact: true }).click();
  return JSON.parse(await fs.readFile(await (await download).path(), "utf8"));
}

test("small desktop timeline keeps essentials visible; More is bounded, labelled, dismissible and non-destructive", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page);
  const before = await save(page);
  expect((await page.locator(".timeline-pro").boundingBox())!.height).toBe(220);
  expect(
    await page.locator(".timeline-toolbar").getByRole("button").count(),
  ).toBeLessThanOrEqual(9);
  await expect(more(page)).toHaveAttribute("aria-expanded", "false");
  await more(page).click();
  const panel = page.getByRole("region", {
    name: "خيارات التايم لاين",
    exact: true,
  });
  await expect(panel).toBeVisible();
  await expect(
    panel.getByRole("button", { name: "تجميع وربط التحديد", exact: true }),
  ).toBeVisible();
  const bounds = (await panel.boundingBox())!;
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.y).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(1440);
  expect((await page.locator(".timeline-pro").boundingBox())!.height).toBe(220);
  await panel.getByRole("button", { name: "عرض مضغوط للمسارات" }).click();
  await expect(page.locator(".timeline-pro")).not.toHaveClass(/is-dense/);
  await page.keyboard.press("Escape");
  await expect(panel).toHaveCount(0);
  await expect(more(page)).toBeFocused();
  expect((await save(page)).project).toEqual(before.project);
  await more(page).click();
  await page.locator(".timeline-meta input").click();
  await expect(panel).toHaveCount(0);
  await page.screenshot({ path: ".cache/timeline/desktop.png" });
});

test("long projects render buffered windows, search reveals offscreen elements, and fit resets the viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, 180);
  expect(await page.locator(".timeline-clip").count()).toBeLessThan(40);
  expect(await page.locator(".timeline-text").count()).toBeLessThan(40);
  await page.locator(".timeline-scroll").evaluate((el) => {
    el.scrollLeft = 16500;
  });
  await expect(page.locator('[data-timeline-id="clip-150"]')).toBeVisible();
  await more(page).click();
  await page
    .getByRole("searchbox", { name: "بحث في عناصر التايم لاين" })
    .fill("نص 175");
  await page
    .locator(".timeline-search-results")
    .getByRole("button", { name: "نص 175", exact: false })
    .click();
  await expect(more(page)).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator('[data-timeline-id="text-175"]')).toBeVisible();
  await expect(
    page.getByRole("spinbutton", { name: "الانتقال إلى ثانية", exact: true }),
  ).toHaveValue("350");
  await expect(page.locator(".preview-selection")).toHaveCount(0);
  const saved = await save(page);
  expect(saved.project.clips).toHaveLength(180);
  expect(saved.project.texts).toHaveLength(180);
  await page.locator(".tracks").focus();
  await page.keyboard.press("f");
  await expect
    .poll(() =>
      page.locator(".timeline-scroll").evaluate((el) => el.scrollLeft),
    )
    .toBe(0);
  expect(
    await page
      .locator(".timeline-scroll")
      .evaluate(
        (el) =>
          Number(
            (
              el.querySelector(
                ".timeline-clip[data-timeline-id=clip-179]",
              ) as HTMLElement
            )?.style.left.replace("px", ""),
          ) < el.clientWidth,
      ),
  ).toBe(true);
});

test("stacked text lanes are vertically windowed and searchable without dropping project data", async ({
  page,
}) => {
  await open(page, 120, true);
  expect(await page.locator(".timeline-text").count()).toBeLessThan(25);
  await more(page).click();
  await page
    .getByRole("searchbox", { name: "بحث في عناصر التايم لاين" })
    .fill("نص 119");
  await page.keyboard.press("Enter");
  await expect(page.locator('[data-timeline-id="text-119"]')).toBeVisible();
  expect(await page.locator(".timeline-text").count()).toBeLessThan(25);
  expect((await save(page)).project.texts).toHaveLength(120);
});

test("a burst of pointer moves flushes its final position; pointer cancellation leaves no partial edit", async ({
  page,
}) => {
  await open(page, 4);
  await page
    .getByRole("button", { name: "الجذب المغناطيسي", exact: true })
    .click();
  const text = page.locator('[data-timeline-id="text-1"]');
  const b = (await text.boundingBox())!,
    x = b.x + b.width / 2,
    y = b.y + b.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.evaluate(
    ({ x, y }) => {
      const el = document.querySelector(".tracks")!;
      for (let i = 1; i <= 100; i++)
        el.dispatchEvent(
          new PointerEvent("pointermove", {
            bubbles: true,
            pointerId: 1,
            clientX: x + i * 0.275,
            clientY: y,
            buttons: 1,
          }),
        );
      el.dispatchEvent(
        new PointerEvent("pointerup", {
          bubbles: true,
          pointerId: 1,
          clientX: x + 27.5,
          clientY: y,
        }),
      );
    },
    { x, y },
  );
  await page.mouse.up();
  expect((await save(page)).project.texts[1].start).toBeCloseTo(2.5, 4);
  await page.keyboard.press("Control+z");
  expect((await save(page)).project.texts[1].start).toBe(2);
  const b2 = (await text.boundingBox())!;
  await page.mouse.move(b2.x + b2.width / 2, b2.y + b2.height / 2);
  await page.mouse.down();
  await page.mouse.move(b2.x + b2.width / 2 + 30, b2.y + b2.height / 2);
  await page
    .locator(".tracks")
    .dispatchEvent("pointercancel", { pointerId: 1 });
  await page.mouse.up();
  expect((await save(page)).project.texts[1].start).toBe(2);
});

for (const width of [320, 390])
  test(`mobile ${width}px has compact essentials and a usable options/search panel`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    await open(page, 2);
    await expect(
      page.getByRole("button", { name: "ملاءمة المشروع للعرض", exact: true }),
    ).toBeVisible();
    await more(page).click();
    const panel = page.getByRole("region", {
      name: "خيارات التايم لاين",
      exact: true,
    });
    await expect(panel).toBeVisible();
    const bounds = (await panel.boundingBox())!;
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.y).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
    await expect(
      panel.getByRole("slider", { name: "تكبير الخط الزمني", exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `.cache/timeline/mobile-${width}-options.png`,
    });
    await page
      .getByRole("searchbox", { name: "بحث في عناصر التايم لاين" })
      .fill("نص 1");
    await page.keyboard.press("Enter");
    await expect(panel).toHaveCount(0);
    await expect(page.locator('[data-timeline-id="text-1"]')).toBeVisible();
    await context.close();
  });

test("playback pages the timeline with the live clock; follow can be disabled without stopping playback", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await open(page, 40);
  await page
    .getByRole("spinbutton", { name: "الانتقال إلى ثانية", exact: true })
    .fill("30");
  await page.locator(".timeline-scroll").evaluate((el) => {
    el.scrollLeft = 0;
  });
  await page.getByRole("button", { name: "تشغيل", exact: true }).click();
  await expect
    .poll(() =>
      page.locator(".timeline-scroll").evaluate((el) => el.scrollLeft),
    )
    .toBeGreaterThan(500);
  expect(
    await page.locator(".timeline-scroll").evaluate((el) => {
      const head = el.querySelector(".playhead")!.getBoundingClientRect(),
        box = el.getBoundingClientRect();
      return head.x >= box.x && head.x <= box.right;
    }),
  ).toBe(true);
  await more(page).click();
  await page
    .getByRole("button", { name: "متابعة مؤشر التشغيل", exact: true })
    .click();
  await page.keyboard.press("Escape");
  await page.locator(".timeline-scroll").evaluate((el) => {
    el.scrollLeft = 0;
  });
  await page.waitForTimeout(600);
  expect(
    await page.locator(".timeline-scroll").evaluate((el) => el.scrollLeft),
  ).toBe(0);
  await expect(
    page.getByRole("button", { name: "إيقاف", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "إيقاف", exact: true }).click();
});
