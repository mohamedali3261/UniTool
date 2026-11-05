import { test, expect } from "@playwright/test";
const base = process.env.DESIGN_QA_URL || "http://localhost:3000";
test("graphic and video primary controls match the spreadsheet studio reference", async ({
  browser,
}) => {
  const context = await browser.newContext(),
    reference = await context.newPage();
  await reference.goto(base + "/excel-studio/index.html");
  const original = reference.locator(".xs-button.primary").first();
  await expect(original).toBeVisible();
  const expected = await original.evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      background: s.backgroundColor,
      color: s.color,
      radius: s.borderRadius,
      font: s.fontSize,
      weight: s.fontWeight,
    };
  });
  expect(expected.background).toBe("rgb(36, 121, 94)");
  for (const [url, selector] of [
    ["/designcraft.html#packaging", ".packaging-primary"],
    ["/video-studio.html", ".hero .primary"],
  ]) {
    const page = await context.newPage();
    await page.goto(base + url);
    const action = page.locator(selector);
    await expect(action).toBeVisible();
    await expect(action).toHaveCSS("background-color", expected.background);
    await expect(action).toHaveCSS("color", expected.color);
    await expect(action).toHaveCSS("border-radius", expected.radius);
    await expect(action).toHaveCSS("font-size", expected.font);
    await expect(action).toHaveCSS("font-weight", expected.weight);
    await action.hover();
    await expect(action).toHaveCSS("background-color", "rgb(29, 99, 75)");
    await page
      .getByTestId(
        url.includes("video") ? "video-theme-toggle" : "designer-theme-toggle",
      )
      .click();
    await expect(action).toHaveCSS("color", "rgb(255, 255, 255)");
    await page.close();
  }
  await context.close();
});
test("spreadsheet-style controls remain compact and usable on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base + "/designcraft.html#packaging");
  await expect(page.locator(".packaging-primary")).toHaveCSS(
    "border-radius",
    "8px",
  );
  await page
    .getByRole("button", { name: "قوالب العلب والمقاسات", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "إنشاء تصميم جديد بالقالب", exact: true }),
  ).toHaveCSS("background-color", "rgb(36, 121, 94)");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
