import { test, expect } from "@playwright/test";
const base = process.env.DESIGN_QA_URL || "http://localhost:3000";
for (const mobile of [false, true])
  test(`packaging daylight uses supplied background, readable light surfaces, and stays scoped (${mobile ? "mobile" : "desktop"})`, async ({
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
    expect(
      await root.evaluate((e) => getComputedStyle(e).backgroundImage),
    ).toContain("daylight-background.jpg");
    await expect(page.locator(".packaging-studio")).toHaveCSS(
      "color",
      "rgb(38, 62, 56)",
    );
    await expect(page.locator(".packaging-search input").first()).toHaveCSS(
      "color",
      "rgb(38, 62, 56)",
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
      "rgb(247, 247, 239)",
    );
    await page
      .getByRole("button", { name: "إغلاق قالب العلبة", exact: true })
      .click();
    await page.getByRole("button", { name: /^مشاريعي/ }).click();
    await expect(page.locator(".packaging-daylight")).toHaveCount(0);
    await expect(page.locator("[data-site-navbar]")).toHaveCSS(
      "background-color",
      "rgba(16, 19, 18, 0.95)",
    );
  });
