import { test, expect } from "@playwright/test";
import { sitePages } from "../../../config/sitePages";
const base = process.env.HOME_QA_URL || "http://localhost:3000";
for (const width of [390, 1440])
  for (const entry of sitePages)
    test(`${entry.href}: shared logo and usable navigation at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.addInitScript(() =>
        localStorage.setItem("logo-designer-tour", "done"),
      );
      await page.goto(base + entry.href);
      const bar = page.locator("[data-site-navbar]");
      await expect(bar).toHaveCount(1);
      await expect(bar).toBeVisible();
      await expect(bar.locator("img")).toHaveAttribute(
        "src",
        "/UniTool_logo.png",
      );
      expect(
        await bar.evaluate((el) => el.getBoundingClientRect().width),
      ).toBeLessThanOrEqual(width);
      if (width < 960) {
        const toggle = bar.getByRole("button", {
          name: "القائمة الرئيسية",
          exact: true,
        });
        await toggle.click();
        await expect(bar.locator(".ut-nav-mobile a")).toHaveCount(
          sitePages.length,
        );
        await page.keyboard.press("Escape");
        await expect(toggle).toBeFocused();
        await expect(bar.locator(".ut-nav-mobile")).toHaveCount(0);
      } else {
        await bar.locator("summary").click();
        await expect(bar.locator("details a")).toHaveCount(sitePages.length);
        await expect(
          bar.locator(`details a[href="${entry.href}"]`),
        ).toHaveAttribute("aria-current", "page");
        await page.keyboard.press("Escape");
        await expect(bar.locator("details")).not.toHaveAttribute("open", "");
      }
      expect(errors).toEqual([]);
    });
test("SUM extra examples switch sheet data, animation and playground together", async ({
  page,
}) => {
  await page.goto(base + "/excel-studio/");
  await page
    .getByRole("button", { name: "مكتبة المعادلات", exact: true })
    .click();
  await page.getByRole("textbox", { name: "بحث المعادلات" }).fill("SUM");
  await page
    .locator(".xs-function-card")
    .filter({ has: page.getByRole("heading", { name: "SUM", exact: true }) })
    .locator(".xs-function-open")
    .click();
  const picker = page.getByRole("combobox", { name: "اختار مثال الشرح" });
  await picker.selectOption("1");
  await expect(page.locator('[data-cell="A1"]')).toHaveText("120");
  await expect(page.locator(".xs-example-result b")).toHaveText("400");
  const next = page
    .locator(".xs-formula-animation")
    .getByRole("button", { name: /التالي|Next/ });
  for (let i = 0; i < 4; i++) await next.click();
  await expect(page.getByTestId("demo-cell-result")).toHaveText("400");
  await picker.selectOption("2");
  await expect(page.locator('[data-cell="A1"]')).toHaveText("45");
  await expect(page.locator(".xs-example-result b")).toHaveText("115");
  await expect(page.getByTestId("demo-cell-result")).toHaveCount(0);
  await picker.selectOption("0");
  await expect(page.locator(".xs-example-result b")).toHaveText("60");
});
for (const width of [390, 1440])
  test(`video and design editor commands remain below the shared navigation at ${width}px`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      isMobile: width < 900,
      hasTouch: width < 900,
    });
    const page = await context.newPage();
    await page.goto(base + "/video-studio.html");
    await page.locator(".template-card").first().click();
    await expect(page.locator(".editor-shell")).toBeVisible();
    const bar = page.locator("[data-site-navbar]");
    const navBox = (await bar.boundingBox())!,
      toolsBox = (await page.locator(".editor-header").boundingBox())!;
    expect(toolsBox.y).toBeGreaterThanOrEqual(navBox.y + navBox.height - 1);
    expect(
      (await page.locator(".editor-shell").boundingBox())!.y +
        (await page.locator(".editor-shell").boundingBox())!.height,
    ).toBeLessThanOrEqual(901);
    if (width < 900) {
      await bar.locator(".ut-menu-toggle").click();
      await expect(bar.locator(".ut-nav-mobile")).toBeVisible();
      await page.keyboard.press("Escape");
    }
    await page.goto(base + "/designcraft.html");
    await page
      .locator("#designer-project-input")
      .setInputFiles({
        name: "navigation.json",
        mimeType: "application/json",
        buffer: Buffer.from(
          JSON.stringify({
            format: "unitool-designcraft",
            version: 1,
            project: {
              title: "Navigation QA",
              width: 400,
              height: 400,
              canvasData: { objects: [] },
            },
          }),
        ),
      });
    await expect(page.locator("canvas.upper-canvas")).toBeVisible();
    const editorBar = (await page.locator("[data-site-navbar]").boundingBox())!,
      commandBar = (await page.locator("#editor-top-bar").boundingBox())!;
    expect(commandBar.y).toBeGreaterThanOrEqual(
      editorBar.y + editorBar.height - 1,
    );
    expect(
      (await page.locator("#canvas-area-container").boundingBox())!.height,
    ).toBeGreaterThan(150);
    await context.close();
  });
