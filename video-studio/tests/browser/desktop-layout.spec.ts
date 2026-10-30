import { test, expect } from "@playwright/test";
const base = process.env.STUDIO_QA_URL || "http://localhost:3000";
for (const width of [1024, 1440, 1920]) {
  test(`desktop workspace has left library, center player, right inspector and full-width timeline at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${base}/video-studio.html`);
    await page.locator(".template-card").first().click();
    const library = await page.locator(".library-panel").boundingBox();
    const rail = await page.locator(".tool-rail").boundingBox();
    const player = await page.locator(".center-workspace").boundingBox();
    const inspector = await page.locator(".inspector").boundingBox();
    const timeline = await page.locator(".timeline").boundingBox();
    expect(library && rail && player && inspector && timeline).toBeTruthy();
    expect(library!.x + library!.width).toBeLessThanOrEqual(player!.x);
    expect(player!.x + player!.width).toBeLessThanOrEqual(inspector!.x);
    expect(rail!.y + rail!.height).toBeLessThanOrEqual(library!.y + 1);
    expect(player!.y).toBeLessThan(library!.y);
    expect(timeline!.y).toBeGreaterThanOrEqual(player!.y + player!.height);
    expect(timeline!.width).toBeGreaterThan(width - 24);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    const divider = page.getByRole("separator", { name: "تغيير عرض المكتبة" });
    await divider.focus();
    await page.keyboard.press("ArrowRight");
    await expect
      .poll(
        async () => (await page.locator(".library-panel").boundingBox())!.width,
      )
      .toBeGreaterThan(library!.width + 10);
    await page.keyboard.press("Home");
    await expect
      .poll(async () =>
        Math.abs(
          (await page.locator(".library-panel").boundingBox())!.width -
            library!.width,
        ),
      )
      .toBeLessThan(2);
    const rightDivider = page.getByRole("separator", {
      name: "تغيير عرض الخصائص",
    });
    const box = (await rightDivider.boundingBox())!;
    await page.mouse.move(box.x + 3, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x - 37, box.y + 100);
    await page.mouse.up();
    await expect
      .poll(async () => (await page.locator(".inspector").boundingBox())!.width)
      .toBeGreaterThan(inspector!.width + 30);
    await page.getByRole("button", { name: "النصوص", exact: true }).click();
    await expect(page.locator(".library-panel.is-text")).toBeVisible();
  });
}
test("desktop panel splitters never appear in mobile layout", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto(`${base}/video-studio.html`);
  await page.locator(".template-card").first().click();
  await expect(page.locator(".preview-area")).toBeVisible();
  await expect(page.locator(".divider-library")).toBeHidden();
  await expect(
    page.getByRole("button", { name: "تعديل المقاطع", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await context.close();
});

test("touch landscape retains mobile workspace at desktop-like width", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 1024, height: 450 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto(`${base}/video-studio.html`);
  await page.locator(".template-card").first().click();
  await expect(page.locator(".divider-library")).toBeHidden();
  await expect(
    page.getByRole("button", { name: "تعديل المقاطع", exact: true }),
  ).toBeVisible();
  await context.close();
});

test("custom panel widths shrink safely when the desktop window becomes narrow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 900 });
  await page.goto(`${base}/video-studio.html`);
  await page.locator(".template-card").first().click();
  for (const name of ["تغيير عرض المكتبة", "تغيير عرض الخصائص"]) {
    await page.getByRole("separator", { name }).focus();
    for (let i = 0; i < 24; i++)
      await page.keyboard.press(
        name.includes("المكتبة") ? "ArrowRight" : "ArrowLeft",
      );
  }
  await page.setViewportSize({ width: 768, height: 900 });
  const l = (await page.locator(".library-panel").boundingBox())!;
  const p = (await page.locator(".center-workspace").boundingBox())!;
  const r = (await page.locator(".inspector").boundingBox())!;
  expect(l.x + l.width).toBeLessThanOrEqual(p.x);
  expect(p.width).toBeGreaterThanOrEqual(179);
  expect(p.x + p.width).toBeLessThanOrEqual(r.x);
  expect(r.x + r.width).toBeLessThanOrEqual(768);
});
