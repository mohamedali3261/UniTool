import { test, expect, type Page } from "@playwright/test";
const base = process.env.STUDIO_QA_URL || "http://localhost:3000";

async function open(page: Page) {
  await page.goto(`${base}/video-studio.html`);
  await page.locator(".template-card").first().click();
  await expect(page.locator(".timeline-pro")).toBeVisible();
}

test("compact desktop timeline keeps primary tools visible and advanced tools on demand", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page);
  const timeline = page.locator(".timeline");
  const box = (await timeline.boundingBox())!;
  expect(box.height).toBeLessThanOrEqual(260);
  await expect(page.getByRole("button", { name: "تقسيم عند المؤشر", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "الجذب المغناطيسي", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "القص المتتابع Ripple", exact: true })).toBeHidden();
  await page.getByRole("button", { name: "خيارات التايم لاين", exact: true }).click();
  const panel = page.getByRole("group", { name: "أدوات التايم لاين المتقدمة" });
  await expect(panel).toBeVisible();
  const panelBox = (await panel.boundingBox())!;
  expect(panelBox.y).toBeGreaterThanOrEqual(0);
  expect(panelBox.y + panelBox.height).toBeLessThanOrEqual(900);
  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
});

test("view preferences persist locally without entering the exported project", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page);
  await page.getByRole("button", { name: "الجذب المغناطيسي", exact: true }).click();
  await page.getByRole("button", { name: "تبديل عرض المسارات المدمج والواسع", exact: true }).click();
  await expect(page.locator(".timeline")).toHaveClass(/is-roomy/);
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("unitool.timeline.view.v1")!));
  expect(stored.snap).toBe(false);
  expect(stored.roomy).toBe(true);
  await page.reload();
  await page.locator(".template-card").first().click();
  await expect(page.getByRole("button", { name: "الجذب المغناطيسي", exact: true })).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator(".timeline")).toHaveClass(/is-roomy/);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "حفظ المشروع", exact: true }).click();
  const file = await download;
  const fs = await import("node:fs/promises");
  const saved = JSON.parse(await fs.readFile((await file.path())!, "utf8"));
  expect(saved.project.timelineView).toBeUndefined();
  expect(saved.project.view).toBeUndefined();
});

test("timeline transport, follow toggle and overview navigation stay in sync with the player", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page);
  await page.getByRole("button", { name: "تشغيل المعاينة من التايم لاين", exact: true }).click();
  await expect(page.getByRole("button", { name: "إيقاف المعاينة من التايم لاين", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "إيقاف المعاينة من التايم لاين", exact: true }).click();
  const follow = page.getByRole("button", { name: "تتبع المؤشر أثناء التشغيل", exact: true });
  await expect(follow).toHaveAttribute("aria-pressed", "true");
  await follow.click();
  await expect(follow).toHaveAttribute("aria-pressed", "false");
  // Zoom until the overview appears, then jump near the end through the overview.
  const slider = page.getByRole("slider", { name: "تكبير الخط الزمني", exact: true });
  await slider.focus();
  await slider.press("End");
  const overview = page.getByRole("slider", { name: "التنقل في خريطة المشروع", exact: true });
  await expect(overview).toBeVisible();
  const box = (await overview.boundingBox())!;
  await page.mouse.click(box.x + box.width * 0.9, box.y + box.height / 2);
  const seek = page.getByRole("spinbutton", { name: "الانتقال إلى ثانية", exact: true });
  expect(Number(await seek.inputValue())).toBeGreaterThan(8);
  await overview.focus();
  await overview.press("Home");
  expect(Number(await seek.inputValue())).toBe(0);
});

test("keyboard reorders the selected clip and track settings open beside their track", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page);
  const first = page.locator(".timeline-clip").first();
  await first.click();
  const name = await first.locator(".clip-caption").textContent();
  await page.locator(".tracks").focus();
  await page.keyboard.press("Alt+ArrowRight");
  await expect(page.locator(".timeline-clip").nth(1).locator(".clip-caption")).toHaveText(name!);
  await page.keyboard.press("Control+z");
  await expect(page.locator(".timeline-clip").first().locator(".clip-caption")).toHaveText(name!);
  await page.getByRole("button", { name: "أدوات مسار الفيديو", exact: true }).click();
  const popover = page.getByRole("group", { name: "إعدادات مسار الفيديو" });
  await expect(popover).toBeVisible();
  const trigger = (await page.getByRole("button", { name: "أدوات مسار الفيديو", exact: true }).boundingBox())!;
  const pop = (await popover.boundingBox())!;
  expect(Math.abs(pop.x - trigger.x)).toBeLessThan(120);
  await page.getByRole("button", { name: "قفل مسار الفيديو", exact: true }).click();
  await expect(page.getByRole("button", { name: "قفل مسار الفيديو", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Escape");
  await expect(popover).toBeHidden();
});

for (const [width, height] of [[320, 740], [390, 844], [844, 390]] as const) {
  test(`mobile ${width}x${height}: transport stays visible and tools panel never covers its toggle`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width, height }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    await open(page);
    await expect(page.getByRole("button", { name: "تشغيل المعاينة من التايم لاين", exact: true })).toBeVisible();
    const toggle = page.getByRole("button", { name: "خيارات التايم لاين", exact: true });
    await toggle.tap();
    const panel = page.getByRole("group", { name: "أدوات التايم لاين المتقدمة" });
    await expect(panel).toBeVisible();
    const t = (await toggle.boundingBox())!;
    const p = (await panel.boundingBox())!;
    expect(p.y + p.height).toBeLessThanOrEqual(t.y + 1);
    await toggle.tap();
    await expect(panel).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await context.close();
  });
}
