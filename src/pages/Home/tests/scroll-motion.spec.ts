import { test, expect, type Page } from "@playwright/test";
import { scrollChapters } from "../components/scroll/chapters";
const base = process.env.HOME_QA_URL || "http://localhost:3000";
async function scroll(page: Page, y: number) {
  await page.evaluate((y) => {
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo(0, y);
  }, y);
  await page.evaluate(
    () =>
      new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
  );
}
test("eight scroll-directed chapters cover every workspace and animate with real scroll", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base);
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator(".journey-chapter")).toHaveCount(8);
  await expect(page.locator(".home-header img")).toHaveAttribute(
    "src",
    "/UniTool_logo.png",
  );
  for (const chapter of scrollChapters) {
    const el = page.locator(`#journey-${chapter.id}`);
    await expect(el.locator(".journey-open")).toHaveAttribute(
      "href",
      chapter.href,
    );
  }
  const pdf = page.locator("#journey-pdf"),
    top = await pdf.evaluate((el) => el.getBoundingClientRect().top + scrollY);
  await scroll(page, top - 750);
  await expect
    .poll(() => pdf.evaluate((el) => el.style.getPropertyValue("--enter")))
    .not.toBe("");
  const first = await pdf.evaluate((el) =>
    el.style.getPropertyValue("--progress"),
  );
  await scroll(page, top + 120);
  await expect
    .poll(() => pdf.evaluate((el) => el.style.getPropertyValue("--progress")))
    .not.toBe(first);
  await page.screenshot({ path: "test-results/home-scroll-desktop.png" });
  // Native reverse scroll must rewind the timeline, not only play a one-shot entrance.
  await scroll(page, top - 750);
  await expect
    .poll(() => pdf.evaluate((el) => el.style.getPropertyValue("--progress")))
    .toBe(first);
  expect(errors).toEqual([]);
});
for (const width of [390, 768])
  test(`scroll journey fits ${width}px and chapter links remain reachable`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      hasTouch: true,
      isMobile: true,
    });
    const page = await context.newPage();
    await page.goto(base);
    await page.evaluate(() => document.fonts.ready);
    const el = page.locator("#journey-video"),
      top = await el.evaluate((el) => el.getBoundingClientRect().top + scrollY);
    await scroll(page, top + 80);
    await expect(el.locator(".journey-open")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const box = await el.locator(".journey-stage").boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width);
    await page.screenshot({ path: `test-results/home-scroll-${width}.png` });
    await context.close();
  });
test("pause and live reduced-motion preference settle all scenes without hiding their content", async ({
  page,
}) => {
  await page.goto(base);
  const pdf = page.locator("#journey-pdf");
  await page.getByRole("button", { name: "إيقاف الحركة", exact: true }).click();
  await expect(pdf).toHaveCSS("--enter", "1");
  const first = await pdf.evaluate((el) =>
    el.style.getPropertyValue("--progress"),
  );
  await pdf.scrollIntoViewIfNeeded();
  await expect(pdf).toHaveCSS("--progress", first);
  await page.getByRole("button", { name: "تشغيل الحركة", exact: true }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(pdf).toHaveCSS("--enter", "1");
  await expect(pdf.locator(".journey-stage")).toHaveCSS("position", "relative");
  for (const chapter of scrollChapters)
    await expect(
      page.locator(`#journey-${chapter.id} .journey-open`),
    ).toBeVisible();
});
