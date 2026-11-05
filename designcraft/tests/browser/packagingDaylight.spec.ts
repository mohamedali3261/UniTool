import { test, expect } from "@playwright/test";
const base = process.env.DESIGN_QA_URL || "http://localhost:3000";
for (const mobile of [false, true])
  test(`packaging daylight uses spreadsheet palette, readable light surfaces, and shared theme (${mobile ? "mobile" : "desktop"})`, async ({
    page,
  }) => {
    await page.setViewportSize(
      mobile ? { width: 390, height: 844 } : { width: 1360, height: 960 },
    );
    await page.goto(base + "/designcraft.html#packaging");
    const root = page.locator(".packaging-daylight");
    await expect(root).toBeVisible();
    const image = await page.request.get(
      base + "/images/packaging/daylight-background.jpg",
    );
    expect(image.ok()).toBe(true);
    expect(image.headers()["content-type"]).toContain("image/jpeg");
    await expect(root).toHaveCSS("color-scheme", "light");
    await expect(root).toHaveCSS('background-color','rgb(245, 247, 244)');
    await expect(page.locator(".packaging-studio")).toHaveCSS(
      "color",
      "rgb(36, 61, 49)",
    );
    await expect(page.locator(".packaging-search input").first()).toHaveCSS(
      "color",
      "rgb(36, 61, 49)",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page
      .getByRole("button", { name: "علب البيتزا", exact: true })
      .click();
    await expect(page.locator("[data-carton-preset]")).toHaveCount(9);
    await page.screenshot({
      path: `.cache/touch-browser/packaging-daylight-${mobile ? "mobile" : "desktop"}.png`,
    });
    await page
      .getByRole("button", { name: "قوالب العلب والمقاسات", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toHaveCSS(
      "background-color",
      "rgb(255, 255, 255)",
    );
    await page
      .getByRole("button", { name: "إغلاق قالب العلبة", exact: true })
      .click();
    await page.getByRole("button", { name: /^مشاريعي/ }).click();
    await expect(page.locator(".packaging-daylight")).toHaveCount(1);
    await expect(page.locator("[data-site-navbar]")).toHaveCSS(
      "background-color",
      "rgb(255, 255, 255)",
    );
  });
