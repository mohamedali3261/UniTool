import { test, expect } from "@playwright/test";
import { darkSurfaces } from "../../../scripts/qa/darkSurfaces";
import { createCartonProject } from "../../src/packaging/project";
import { DEFAULT_CARTON } from "../../src/packaging/geometry";
const base = process.env.DESIGN_QA_URL || "http://localhost:3000";
for (const mobile of [false, true])
  test(`designer day surfaces across pages, tools, properties, menus and packaging dialogs (${mobile ? "mobile" : "desktop"})`, async ({
    page,
  }) => {
    await page.setViewportSize(
      mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 },
    );
    await page.goto(base + "/designcraft.html");
    await expect(page.locator(".dc-dashboard")).toBeVisible();
    const audit = async (label: string) =>
      expect(await page.evaluate(darkSurfaces), label).toEqual([]);
    for (const tab of [
      "تصميم جديد",
      "مشاريعي",
      "الحفظ والتخزين",
      "تصميم العلب",
    ]) {
      await page
        .getByRole("button", { name: new RegExp("^" + tab) })
        .first()
        .click();
      await audit(tab);
    }
    const project = createCartonProject(DEFAULT_CARTON, "Daylight audit");
    project.canvasData.objects.unshift({
      type: "rect",
      version: "5.3.0",
      id: "audit-object",
      name: "Audit shape",
      left: 180,
      top: 180,
      width: 120,
      height: 100,
      fill: "#194bd4",
      strokeWidth: 0,
    });
    await page
      .locator("#designer-project-input")
      .setInputFiles({
        name: "daylight.json",
        mimeType: "application/json",
        buffer: Buffer.from(
          JSON.stringify({
            format: "unitool-designcraft",
            version: 1,
            project,
          }),
        ),
      });
    await expect(page.locator("#editor-layout")).toBeVisible();
    for (const tab of [
      "قوالب",
      "النصوص",
      "الأشكال",
      "الخلفية",
      "الطبقات",
      "مكتبة",
    ]) {
      await page
        .getByRole("button", { name: tab, exact: true })
        .filter({ visible: true })
        .first()
        .click();
      await audit(tab);
    }
    for (const tab of ["أيقونات", "زخارف", "صور"]) {
      await page
        .getByRole("button", { name: tab, exact: true })
        .filter({ visible: true })
        .first()
        .click();
      await audit(tab);
    }
    await page
      .getByRole("button", { name: "الطبقات", exact: true })
      .filter({ visible: true })
      .first()
      .click();
    await page
      .getByRole("button", { name: "Audit shape", exact: true })
      .filter({ visible: true })
      .click();
    if (mobile)
      await page
        .locator("#editor-layout")
        .getByRole("button", { name: "إغلاق", exact: true })
        .click();
    if (
      await page
        .getByRole("button", { name: "إظهار الخصائص", exact: true })
        .count()
    )
      await page
        .getByRole("button", { name: "إظهار الخصائص", exact: true })
        .click();
    await expect(
      page.locator("#editor-properties-panel").filter({ visible: true }),
    ).toBeVisible();
    await audit("selected object properties");
    await page
      .getByRole("button", { name: "إخفاء الخصائص", exact: true })
      .click();
    await page.getByRole("button", { name: /استيراد \/ تصدير/ }).focus();
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#designer-file-actions")).toBeVisible();
    await audit("file portal menu");
    await page.keyboard.press("Escape");
    await page
      .getByRole("button", { name: "تعديل المقاسات", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await audit("resize dialog");
    await page.getByRole("button", { name: "إلغاء", exact: true }).click();
    await page
      .getByRole("button", { name: "تصدير للطباعة", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await audit("print dialog");
    await page.keyboard.press("Escape");
    await page.screenshot({
      path: `.cache/touch-browser/designer-daylight-audit-${mobile ? "mobile" : "desktop"}.png`,
    });
  });
