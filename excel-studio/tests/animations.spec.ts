import { test, expect, type Page } from "@playwright/test";
async function openLesson(page: Page, name: string, lang = "ar") {
  await page.addInitScript((lang) => {
    localStorage.setItem("excel-studio.lang", lang);
  }, lang);
  await page.goto("/excel-studio/");
  await page
    .getByRole("button", {
      name: lang === "ar" ? "مكتبة المعادلات" : "Formula library",
      exact: true,
    })
    .click();
  await page
    .getByRole("textbox", {
      name: lang === "ar" ? "بحث المعادلات" : "Search formulas",
    })
    .fill(name);
  await page
    .locator(".xs-function-card")
    .filter({ has: page.getByRole("heading", { name, exact: true }) })
    .locator(".xs-function-open")
    .click();
  await expect(page.locator(".xs-formula-animation")).toBeVisible();
}
for (const [name, result] of Object.entries({
  SUM: "60",
  AVERAGE: "20",
  COUNT: "6",
  COUNTA: "9",
  MAX: "30",
  MIN: "10",
  IF: "ناجح",
  SUMIF: "10",
  COUNTIF: "2",
  VLOOKUP: "4",
}))
  test(`${name}: manual steps agree with the real playground`, async ({
    page,
  }) => {
    await openLesson(page, name);
    const animation = page.locator(".xs-formula-animation");
    await animation.locator(".xs-animation-progress button").last().click();
    await expect(animation.locator(".xs-animation-final")).toContainText(
      result,
    );
    await animation
      .getByRole("button", { name: "ضع مثال الشرح في التجربة", exact: true })
      .click();
    await expect(page.locator(".xs-example-result b")).toHaveText(result);
    await page
      .getByRole("textbox", { name: "تجربة المعادلة", exact: true })
      .fill("=999");
    await expect(page.locator(".xs-example-result b")).toHaveText("999");
    await expect(animation.locator(".xs-animation-final")).toContainText(
      result,
    );
    await animation
      .getByRole("button", { name: "إعادة الشرح من البداية", exact: true })
      .click();
    await expect(animation.locator(".xs-animation-step-number")).toContainText(
      "1 /",
    );
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
test("play, pause, speed, next and restart are deterministic", async ({
  page,
}) => {
  await openLesson(page, "SUM");
  await page.clock.install();
  const a = page.locator(".xs-formula-animation");
  await a.getByRole("button", { name: "تشغيل الشرح", exact: true }).click();
  await page.clock.runFor(2900);
  await expect(a.locator(".xs-animation-step-number")).toContainText("2 /");
  await a.getByRole("button", { name: "إيقاف مؤقت", exact: true }).click();
  await page.clock.runFor(6000);
  await expect(a.locator(".xs-animation-step-number")).toContainText("2 /");
  await a.getByRole("button", { name: "الخطوة التالية", exact: true }).click();
  await expect(a.getByTestId("demo-selection")).toBeVisible();
  await expect(a.getByTestId("demo-formula-bar")).toHaveText("=SUM(A1:A3");
  await a
    .getByRole("combobox", { name: "سرعة الشرح", exact: true })
    .selectOption("1400");
  await a.getByRole("button", { name: "تشغيل الشرح", exact: true }).click();
  await page.clock.runFor(1000);
  await expect(a.locator(".xs-animation-step-number")).toContainText("4 /");
  await a
    .getByRole("button", { name: "إعادة الشرح من البداية", exact: true })
    .click();
  await page.clock.runFor(6000);
  await expect(a.locator(".xs-animation-step-number")).toContainText("1 /");
});
test("mobile and reduced motion keep a usable manual explanation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openLesson(page, "VLOOKUP");
  const a = page.locator(".xs-formula-animation");
  expect(await a.evaluate((e) => e.scrollWidth <= e.clientWidth)).toBe(true);
  await a.getByRole("button", { name: "الخطوة التالية", exact: true }).click();
  await expect(a.locator('[data-cell="D1"] input')).toHaveValue("=VLOOKUP(20,");
  await a.getByRole("button", { name: "الخطوة التالية", exact: true }).click();
  await expect(a.getByTestId("demo-selection")).toBeVisible();
  await expect(a.getByTestId("demo-formula-bar")).toHaveText(
    "=VLOOKUP(20,A1:B3",
  );
  expect(
    await a
      .locator(".xs-demo-pointer")
      .evaluate((e) => getComputedStyle(e).animationName),
  ).toBe("none");
});
test("English explanations and the animated-only library tab stay accessible", async ({
  page,
}) => {
  await openLesson(page, "VLOOKUP", "en");
  const a = page.locator(".xs-formula-animation");
  await expect(a).toContainText("Find 20 in the first column");
  await a.getByRole("button", { name: "Next step", exact: true }).click();
  await expect(a.locator(".xs-animation-step-number")).toContainText("Step 2");
  await page.keyboard.press("Escape");
  await page.getByRole("textbox", { name: "Search formulas" }).fill("");
  await page
    .getByRole("button", { name: "Animated lessons · 10", exact: true })
    .click();
  await expect(page.locator(".xs-function-card")).toHaveCount(10);
});
test("autoplay really types in D1, drags a range and commits with Enter", async ({
  page,
}) => {
  await openLesson(page, "SUM");
  await page.clock.install();
  const a = page.locator(".xs-formula-animation");
  await a.getByRole("button", { name: "تشغيل الشرح", exact: true }).click();
  await page.clock.runFor(3000);
  const typed = await a.locator('[data-cell="D1"] input').inputValue();
  expect(typed.startsWith("=")).toBe(true);
  expect(typed.length).toBeLessThan("=SUM(".length);
  await a.getByRole("button", { name: "إيقاف مؤقت", exact: true }).click();
  const pausedText = await a.locator('[data-cell="D1"] input').inputValue();
  await page.clock.runFor(2000);
  await expect(a.locator('[data-cell="D1"] input')).toHaveValue(pausedText);
  await a.getByRole("button", { name: "تشغيل الشرح", exact: true }).click();
  await page.clock.runFor(1800);
  await expect(a.getByTestId("demo-selection")).toBeVisible();
  const before = await a.locator(".xs-demo-pointer").getAttribute("style");
  await page.clock.runFor(400);
  expect(await a.locator(".xs-demo-pointer").getAttribute("style")).not.toBe(
    before,
  );
  await page.clock.runFor(8000);
  await expect(a.getByTestId("demo-cell-result")).toHaveText("60");
  await expect(a.locator(".xs-demo-keyboard kbd")).toHaveClass("pressed");
  await expect(
    a.getByRole("button", { name: "تشغيل الشرح", exact: true }),
  ).toBeVisible();
});
