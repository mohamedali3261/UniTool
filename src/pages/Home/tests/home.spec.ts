import { test, expect } from "@playwright/test";
import { toolCategories, totalToolCount } from "../../ToolsHome/data";
import { sitePages } from "../../../config/sitePages";
const base = process.env.HOME_QA_URL || "http://localhost:3000";
test("every studio and live site entry has a real link, and every tool has a deep link", async ({
  page,
  request,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "مساحة واحدة",
  );
  await expect(page.locator(".studio-card")).toHaveCount(5);
  for (const p of sitePages.filter((p) => p.href !== "/index.html")) {
    await expect(
      page.locator(`.home-footer a[href="${p.href}"]`),
    ).toBeVisible();
    const response = await request.get(`${base}${p.href}`);
    expect(response.status()).toBe(200);
  }
  await page
    .getByRole("button", {
      name: `عرض كل الأدوات (${totalToolCount})`,
      exact: true,
    })
    .click();
  await expect(page.locator(".directory-tool")).toHaveCount(totalToolCount);
  for (const tool of toolCategories.flatMap((c) => c.tools))
    await expect(
      page.locator(`.directory-tool[href="/app.html#${tool.id}"]`),
    ).toHaveCount(1);
  expect(errors).toEqual([]);
});
test("quick picks cover each category; search and filters reveal tools, studios and empty states", async ({
  page,
}) => {
  await page.goto(base);
  await expect(page.locator(".directory-tool")).toHaveCount(8);
  for (const c of toolCategories)
    expect(
      await page.locator(`.directory-tool.tone-${c.id}`).count(),
    ).toBeGreaterThan(0);
  const search = page.getByRole("searchbox", {
    name: "ابحث عن أداة أو استوديو",
  });
  await search.fill("SVG");
  await expect(
    page.locator('.studio-search-matches a[href="/unitool-svg.html"]'),
  ).toBeVisible();
  await search.fill("دمج ملفات PDF");
  await expect(page.locator(".directory-tool")).toHaveCount(1);
  await expect(page.locator(".directory-tool")).toHaveAttribute(
    "href",
    "/app.html#pdfMerger",
  );
  await search.fill("unlikely-not-a-tool-123");
  await expect(page.locator(".directory-empty")).toBeVisible();
  await expect(page.locator(".directory-tool")).toHaveCount(0);
  await page
    .getByRole("button", { name: "عرض كل الأقسام", exact: true })
    .click();
  await expect(search).toHaveValue("");
  await page.getByRole("button", { name: "أدوات الصوت", exact: true }).click();
  await expect(page.locator(".directory-tool")).toHaveCount(
    toolCategories.find((c) => c.id === "audio")!.tools.length,
  );
  await expect(
    page.locator('.directory-tool[href="/app.html#compress"]'),
  ).toBeVisible();
});
test("language and motion preferences persist; English links and search stay usable", async ({
  page,
}) => {
  await page.goto(base);
  await page.getByRole("button", { name: "Switch to English" }).click();
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "One workspace.",
  );
  await page.getByRole("button", { name: "Pause motion", exact: true }).click();
  await expect(page.locator(".home-page")).toHaveClass(/motion-paused/);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator(".home-page")).toHaveClass(/motion-paused/);
  await page
    .getByRole("searchbox", { name: "Search tools or studios" })
    .fill("Audio Compression");
  await expect(
    page.locator('.directory-tool[href="/app.html#compress"]'),
  ).toBeVisible();
  await page.getByRole("button", { name: "Play motion", exact: true }).click();
  await expect(page.locator(".home-page")).not.toHaveClass(/motion-paused/);
});
for (const width of [320, 390, 768, 1440])
  test(`responsive homepage at ${width}px has no horizontal overflow`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      isMobile: width < 800,
      hasTouch: width < 800,
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await page.goto(base);
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    for (const id of ["design", "video", "svg", "reader", "logo"]) {
      const card = page.locator(`#${id}`);
      await card.scrollIntoViewIfNeeded();
      const b = (await card.boundingBox())!;
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.x + b.width).toBeLessThanOrEqual(width + 0.5);
    }
    if (width < 800) {
      const toggle = page.getByRole("button", {
        name: "القائمة الرئيسية",
        exact: true,
      });
      await toggle.click();
      await expect(page.locator("#home-mobile-nav")).toBeVisible();
      await expect(page.locator("#home-mobile-nav a")).toHaveCount(
        sitePages.length,
      );
      await page.keyboard.press("Escape");
      await expect(page.locator("#home-mobile-nav")).toHaveCount(0);
      await expect(toggle).toBeFocused();
    }
    expect(
      await page
        .locator(".art-flower svg")
        .first()
        .evaluate((el) => getComputedStyle(el).animationName),
    ).toBe("none");
    await context.close();
  });
test("keyboard search shortcut does not interfere with typing and deep links open the right tool", async ({
  page,
}) => {
  await page.goto(base);
  const search = page.getByRole("searchbox", {
    name: "ابحث عن أداة أو استوديو",
  });
  await expect(search).toBeVisible();
  await page.keyboard.press("/");
  await expect(search).toBeFocused();
  await page.keyboard.type("PDF/");
  await expect(search).toHaveValue("PDF/");
  await search.fill("ضغط الصوت");
  await page.locator('.directory-tool[href="/app.html#compress"]').click();
  await expect(page).toHaveURL(/app.html#compress$/);
  await expect(page.locator(".home-page")).toHaveCount(0);
});
