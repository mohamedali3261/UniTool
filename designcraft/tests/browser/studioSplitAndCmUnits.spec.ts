import { test, expect } from "@playwright/test";

const base = process.env.DESIGN_QA_URL || "http://localhost:3000";

test("two-button studio switcher cleanly separates Design Studio vs Box Design (templates, dimensions, and saved projects)", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1360, height: 960 });
  await page.goto(base + "/designcraft.html");

  // 1. Two-button top studio switcher: استوديو التصميم | تصميم العلب
  await expect(page.getByTestId("studio-section-switcher")).toBeVisible();
  const designBtn = page.getByTestId("studio-btn-design");
  const packagingBtn = page.getByTestId("studio-btn-packaging");
  await expect(designBtn).toContainText("استوديو التصميم");
  await expect(packagingBtn).toContainText("تصميم العلب");
  await expect(designBtn).toHaveAttribute("aria-pressed", "true");
  await expect(packagingBtn).toHaveAttribute("aria-pressed", "false");

  // 2. Design Studio displays its own Templates, Dimensions (px / سم), and Saved Projects
  await expect(page.getByTestId("graphic-section-pills")).toBeVisible();
  await expect(page.getByTestId("graphic-ready-templates")).toBeVisible();
  await expect(page.getByTestId("graphic-dimensions-section")).toBeVisible();
  await expect(page.getByTestId("graphic-saved-projects")).toBeVisible();
  await expect(page.getByTestId("graphic-custom-unit-toggle")).toBeVisible();

  // 3. Click Button 2: تصميم العلب — displays Box Templates, Box Dimensions (سم / مم), and Saved Box Projects separately
  await packagingBtn.click();
  await expect(packagingBtn).toHaveAttribute("aria-pressed", "true");
  await expect(designBtn).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByTestId("packaging-page")).toBeVisible();
  await expect(page.getByTestId("packaging-section-pills")).toBeVisible();
  await expect(page.getByTestId("packaging-quick-builder")).toBeVisible();
  await expect(page.getByTestId("packaging-projects")).toBeVisible();
  await expect(page.getByTestId("graphic-ready-templates")).toHaveCount(0);
  await expect(page.getByTestId("graphic-saved-projects")).toHaveCount(0);

  // 4. Quick Custom Box Builder defaults to cm (سم) and launches editor
  await page.getByTestId("quick-box-height").fill("14");
  await page.getByTestId("quick-box-width").fill("7.5");
  await page.getByTestId("quick-box-depth").fill("4.5");
  await page.getByTestId("quick-box-launch").click();

  // 5. Inside Packaging Editor: dedicated العلبة tab & cm resize dialog
  await expect(page.getByTestId("sidebar-tab-carton")).toBeVisible();
  await expect(page.getByTestId("carton-studio-tab")).toBeVisible();
  await expect(page.getByTestId("carton-tab-height")).toHaveValue("14");
  await expect(page.getByTestId("carton-tab-width")).toHaveValue("7.5");
  await expect(page.getByTestId("carton-tab-depth")).toHaveValue("4.5");

  await page.getByTestId("carton-resize-open").click();
  await page.getByTestId("resize-unit-cm").click();
  await page.getByLabel("طول العلبة بالسنتيمتر").fill("16.5");
  await page.getByLabel("عرض العلبة بالسنتيمتر").fill("8");
  await page.getByLabel("عمق العلبة بالسنتيمتر").fill("5");
  await page
    .getByRole("button", { name: "تطبيق مقاس العلبة", exact: true })
    .click();

  await expect(page.getByTestId("carton-tab-height")).toHaveValue("16.5");
  await expect(page.getByTestId("carton-tab-width")).toHaveValue("8");
  await expect(page.getByTestId("carton-tab-depth")).toHaveValue("5");

  // 6. Return to Dashboard: saved box appears ONLY under تصميم العلب, NOT under استوديو التصميم
  await page
    .getByRole("button", { name: "العودة للشاشة الرئيسية", exact: true })
    .first()
    .click();
  await page.getByTestId("studio-btn-packaging").click();
  await expect(page.getByTestId("packaging-projects")).toContainText("علبة مخصصة");

  await page.getByTestId("studio-btn-design").click();
  await expect(page.getByTestId("graphic-saved-projects")).not.toContainText(
    "علبة مخصصة",
  );
});
