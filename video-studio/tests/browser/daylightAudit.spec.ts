import { test, expect } from "@playwright/test";
import { darkSurfaces } from "../../../scripts/qa/darkSurfaces";
const base = process.env.STUDIO_QA_URL || "http://localhost:3000";
for (const mobile of [false, true])
  test(`video day surfaces across catalogs, tools and dialogs (${mobile ? "mobile" : "desktop"})`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: mobile
        ? { width: 390, height: 844 }
        : { width: 1440, height: 1000 },
      isMobile: mobile,
      hasTouch: mobile,
    });
    const page = await context.newPage();
    await page.goto(base + "/video-studio.html");
    await expect(page.locator(".home-shell")).toBeVisible();
    const audit = async (label: string) =>
      expect(await page.evaluate(darkSurfaces), label).toEqual([]);
    await audit("home");
    await page.locator(".template-card").first().click();
    await expect(page.locator(".editor-shell")).toBeVisible();
    if (!mobile) {
      for (const tab of [
        "وسائط",
        "العناصر",
        "الصوت",
        "النصوص",
        "الفلاتر",
        "التأثيرات",
        "ملصقات",
      ]) {
        await page
          .locator(".tool-rail")
          .getByRole("button", { name: tab, exact: true })
          .click();
        await audit(tab);
      }
    } else {
      await audit("mobile editor");
      await page
        .getByRole("button", { name: "تعديل المقاطع", exact: true })
        .click();
      await audit("mobile clip tools");
    }
    await page.locator('.editor-actions').getByRole('button',{name:/^تصدير/}).click();
    await expect(page.getByRole('dialog')).toBeVisible();await audit('export dialog');
    await page.getByRole('dialog').getByRole('button',{name:'إغلاق',exact:true}).click();
    await page.screenshot({
      path: `.cache/touch-browser/video-daylight-audit-${mobile ? "mobile" : "desktop"}.png`,
    });
    await context.close();
  });
