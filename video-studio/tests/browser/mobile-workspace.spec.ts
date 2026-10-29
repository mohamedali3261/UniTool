import { test, expect, type Page } from "@playwright/test";
const base = process.env.STUDIO_QA_URL || "http://localhost:3000";
const rail = (page: Page, name: string) =>
  page
    .getByRole("navigation", { name: "أقسام التحرير", exact: true })
    .getByRole("button", { name, exact: true });
async function toolPage(page: Page, name: string) {
  await expect(page.locator(".editor-shell")).toBeVisible();
  if (await rail(page, name).isVisible()) await rail(page, name).click();
  else {
    await page
      .getByRole("combobox", { name: "قسم التحرير", exact: true })
      .click();
    await page.getByRole("option", { name, exact: true }).click();
  }
}
async function samePreview(
  page: Page,
  before: { x: number; y: number; width: number; height: number },
) {
  const after = (await page.locator(".center-workspace").boundingBox())!;
  for (const coordinate of ["x", "y", "width", "height"] as const)
    expect(Math.abs(after[coordinate] - before[coordinate])).toBeLessThan(1);
  expect(await page.evaluate(() => scrollY)).toBe(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}
for (const [width, height] of [
  [320, 740],
  [390, 844],
  [360, 640],
  [768, 1024],
  [844, 390],
]) {
  test(`fixed mobile workspace ${width}x${height}: panels scroll without moving the preview`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width, height },
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`${base}/video-studio.html`);
    await page.locator(".template-card").first().click();
    await expect(page.locator(".timeline")).toBeVisible();
    await expect(page.locator(".timeline-pro")).toHaveClass(/is-compact/);
    expect((await page.locator(".editor-header").boundingBox())!.height).toBe(
      height < 500 ? 44 : 48,
    );
    expect(
      (await page.locator(".timeline-toolbar").boundingBox())!.height,
    ).toBe(38);
    expect((await page.locator(".ruler").boundingBox())!.height).toBe(30);
    expect(
      (await page.locator(".timeline-clip").first().boundingBox())!.height,
    ).toBeLessThanOrEqual(60);
    expect(
      await rail(page, "النصوص").evaluate((el) =>
        parseFloat(getComputedStyle(el).fontSize),
      ),
    ).toBe(8);
    const before = (await page.locator(".center-workspace").boundingBox())!;
    expect(before.y).toBeGreaterThanOrEqual(0);
    const canvas = (await page.locator(".canvas-stage canvas").boundingBox())!;
    expect(canvas.height).toBeGreaterThan(70);
    if (height > width) expect(canvas.height).toBeGreaterThan(height * 0.38);
    expect(canvas.y + canvas.height).toBeLessThan(height);
    await toolPage(page, "النصوص");
    await expect(
      page.getByRole("textbox", { name: "محتوى النص", exact: true }),
    ).toHaveCount(1);
    await page
      .getByRole("textbox", { name: "محتوى النص", exact: true })
      .fill("نص واضح على الموبايل");
    await samePreview(page, before);
    await toolPage(page, "التأثيرات");
    await expect(page.locator("#studio-library")).toBeVisible();
    await expect(page.locator(".effects-intro")).toBeHidden();
    expect((await page.locator(".effect-search").boundingBox())!.height).toBe(
      34,
    );
    const picture = (await page
      .locator(".effect-picture")
      .first()
      .boundingBox())!;
    expect(picture.height).toBeCloseTo(picture.width, 1);
    expect(
      await page
        .locator(".live-effects-grid")
        .evaluate(
          (el) => getComputedStyle(el).gridTemplateColumns.split(" ").length,
        ),
    ).toBe(4);
    await page.locator("#studio-library").evaluate((el) => {
      el.scrollTop = 400;
    });
    await samePreview(page, before);
    await toolPage(page, "الفلاتر");
    await samePreview(page, before);
    await toolPage(page, "تعديل وخصائص");
    await expect(page.locator("#studio-inspector")).toHaveClass(/is-expanded/);
    await expect(
      page.getByRole("combobox", { name: "مقاس الفيديو", exact: true }),
    ).toBeVisible();
    await page.locator("#studio-inspector").evaluate((el) => {
      el.scrollTop = 500;
    });
    await samePreview(page, before);
    await page
      .getByRole("button", { name: "تم والعودة للتايم لاين", exact: true })
      .click();
    await expect(page.locator(".timeline")).toBeVisible();
    await expect(page.locator("#studio-library")).toBeHidden();
    await samePreview(page, before);
    await expect(
      page.getByRole("button", { name: "تكبير العنصر", exact: true }),
    ).toBeHidden();
    await page
      .getByRole("button", { name: "أدوات العنصر الإضافية", exact: true })
      .click();
    await page
      .getByRole("combobox", { name: "عناصر المعاينة", exact: true })
      .click();
    await page
      .getByRole("option", { name: /المقطع الأساسي/ })
      .first()
      .click();
    await page
      .getByRole("button", { name: "تكبير العنصر", exact: true })
      .click();
    await samePreview(page, before);
    await page
      .getByRole("button", { name: "تكبير مساحة المعاينة", exact: true })
      .click();
    expect(
      (await page.locator(".canvas-stage canvas").boundingBox())!.height,
    ).toBeGreaterThanOrEqual(canvas.height);
    const focused = (await page.locator(".center-workspace").boundingBox())!;
    expect(focused.width * focused.height).toBeGreaterThan(
      before.width * before.height,
    );
    await expect(page.locator(".timeline")).toBeHidden();
    await toolPage(page, "النصوص");
    await expect(
      page.getByRole("button", { name: "تكبير مساحة المعاينة", exact: true }),
    ).toBeVisible();
    await samePreview(page, before);
    expect(errors).toEqual([]);
    await context.close();
  });
}
test("mobile keyboard viewport, orientation changes and leaving editor clean up without losing text", async ({
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
  await toolPage(page, "النصوص");
  const input = page.getByRole("textbox", { name: "محتوى النص", exact: true });
  await input.fill("محتوى يفضل محفوظ");
  // Exercise the visualViewport keyboard resize path without claiming a physical keyboard test.
  await page.evaluate(() => {
    Object.defineProperty(visualViewport!, "height", {
      configurable: true,
      get: () => 460,
    });
    visualViewport!.dispatchEvent(new Event("resize"));
  });
  await expect(page.locator("body")).toHaveClass(/studio-keyboard-open/);
  await expect(
    page.getByRole("navigation", { name: "أقسام التحرير" }),
  ).toBeHidden();
  await input.fill("محتوى يفضل محفوظ أثناء الكتابة");
  const box = (await page.locator(".editor-shell").boundingBox())!;
  expect(box.height).toBeCloseTo(460, 0);
  await page.evaluate(() => {
    delete (visualViewport as any).height;
    visualViewport!.dispatchEvent(new Event("resize"));
  });
  await expect(
    page.getByRole("navigation", { name: "تنقل صفحة الأداة" }),
  ).toBeVisible();
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(input).toHaveValue("محتوى يفضل محفوظ أثناء الكتابة");
  expect(
    (await page.locator(".center-workspace").boundingBox())!.height,
  ).toBeGreaterThan(200);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(input).toHaveValue("محتوى يفضل محفوظ أثناء الكتابة");
  await page
    .getByRole("button", { name: "العودة للاستوديو", exact: true })
    .click();
  await expect(page.locator(".template-card")).toHaveCount(4);
  await expect(page.locator("body")).not.toHaveClass(/studio-mobile-editing/);
  expect(
    await page.evaluate(() =>
      document.documentElement.style.getPropertyValue("--studio-viewport"),
    ),
  ).toBe("");
  await context.close();
});

test("compact project menu keeps import, performance and save accessible", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 320, height: 740 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto(`${base}/video-studio.html`);
  await page.locator(".template-card").first().click();
  const menu = page.locator(".mobile-project-menu");
  await menu.locator("summary").first().click();
  await expect(
    menu.getByRole("button", { name: "فتح مشروع", exact: true }),
  ).toBeVisible();
  await expect(
    menu.getByRole("button", { name: "إضافة وسائط", exact: true }),
  ).toBeVisible();
  await menu.locator(".performance-menu > summary").click();
  await expect(menu.locator(".performance-popover")).toBeVisible();
  const bounds = (await menu.locator(".mobile-project-popover").boundingBox())!;
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(320);
  await page.keyboard.press("Escape");
  await expect(menu).not.toHaveAttribute("open", "");
  await menu.locator("summary").first().click();
  await rail(page, "النصوص").tap();
  await expect(menu).not.toHaveAttribute("open", "");
  await page
    .getByRole("button", { name: "الرجوع للتعديل", exact: true })
    .click();
  await page
    .getByRole("button", { name: "تعديل المقاطع", exact: true })
    .click();
  await expect(page.locator("#studio-inspector")).toBeVisible();
  await page
    .getByRole("button", { name: "الرجوع للتعديل", exact: true })
    .click();
  await expect(page.locator(".timeline")).toBeVisible();
  await expect(page.locator(".save-button")).toBeVisible();
  for (const name of ["فتح مشروع", "إضافة وسائط"]) {
    await menu.locator("summary").first().click();
    const chooser = page.waitForEvent("filechooser");
    await menu.getByRole("button", { name, exact: true }).click();
    await chooser;
    await expect(menu).not.toHaveAttribute("open", "");
  }
  await context.close();
});

for (const [width, height] of [
  [320, 740],
  [390, 844],
  [360, 640],
  [768, 1024],
  [844, 390],
]) {
  test(`mobile contextual tool pages replace the dock ${width}x${height}`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width, height },
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.goto(`${base}/video-studio.html`);
    await page.locator(".template-card").first().click();
    const preview = (await page.locator(".center-workspace").boundingBox())!;
    const timelineHeight = (await page.locator(".timeline").boundingBox())!
      .height;
    for (const name of [
      "وسائط",
      "الصوت",
      "النصوص",
      "الفلاتر",
      "التأثيرات",
      "ملصقات",
      "تعديل المقاطع",
    ]) {
      await rail(page, name).click();
      await expect(
        page.getByRole("navigation", { name: "أقسام التحرير", exact: true }),
      ).toBeHidden();
      await expect(page.locator(".mobile-panel-bar")).toBeHidden();
      const footer = page.getByRole("navigation", {
        name: "تنقل صفحة الأداة",
        exact: true,
      });
      await expect(footer).toBeVisible();
      const pane = page.locator(
        name === "تعديل المقاطع" ? "#studio-inspector" : "#studio-library",
      );
      await expect(pane).toBeVisible();
      expect((await pane.boundingBox())!.height).toBeGreaterThan(
        timelineHeight + 20,
      );
      const f = (await footer.boundingBox())!;
      expect(f.y + f.height).toBeCloseTo(height, 0);
      await samePreview(page, preview);
      await page
        .getByRole("button", { name: "تم والعودة للتايم لاين", exact: true })
        .click();
      await expect(page.locator(".timeline")).toBeVisible();
      await expect(
        page.getByRole("navigation", { name: "أقسام التحرير", exact: true }),
      ).toBeVisible();
      await expect(footer).toHaveCount(0);
    }
    await context.close();
  });
}
