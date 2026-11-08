import { expect, test } from "@playwright/test";

const base = process.env.DESIGN_QA_URL || "http://localhost:3000";

test.describe("Design Studio Split (Graphic vs Boxes) & Centimetre (سم) Box Editing", () => {
  test("dashboard cleanly separates Graphic Designs Studio and Boxes Studio with dedicated tools & cm creation", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto(`${base}/designcraft.html`);

    // 1. Both distinct Studio section cards are visible on Dashboard
    const switcher = page.getByTestId("studio-section-switcher");
    await expect(switcher).toBeVisible();
    await expect(page.getByTestId("section-card-graphics")).toContainText(
      "قسم التصميمات الجرافيكية",
    );
    await expect(page.getByTestId("section-card-boxes")).toContainText(
      "قسم العلب والتغليف",
    );

    // 2. Graphic Studio shows Ready Graphic Templates + px/cm (300 DPI) custom builder
    await expect(page.getByTestId("graphic-ready-templates")).toBeVisible();
    await expect(page.getByTestId("packaging-page")).toHaveCount(0);

    // 3. Switch to Boxes Studio via the Boxes card CTA
    await page
      .getByRole("button", { name: "قوالب العلب والمقاسات", exact: true })
      .click();
    await expect(page.getByTestId("packaging-page")).toBeVisible();
    await expect(page.getByTestId("graphic-ready-templates")).toHaveCount(0);

    // 4. Toggle catalog display to cm ('عرض بالـ سم')
    await page.getByTestId("catalog-unit-cm").click();
    await expect(page.locator("[data-carton-preset]").first()).toContainText(
      "سم",
    );

    // 5. Create a custom box in cm ('سم') directly from the Quick Box Workbench
    await page.getByTestId("quick-box-height").fill("14");
    await page.getByTestId("quick-box-width").fill("7.5");
    await page.getByTestId("quick-box-depth").fill("4.5");
    await page.getByTestId("quick-box-launch").click();

    // 6. Editor opens in Boxes Studio mode with 140 × 75 × 45 mm (14 × 7.5 × 4.5 سم)
    await expect(page.locator("#editor-layout")).toBeVisible();
    const bar = page.locator(".carton-editor-bar");
    await expect(bar).toContainText("140 × 75 × 45 mm");
    await expect(bar).toContainText("14 × 7.5 × 4.5 سم");

    // 7. Dedicated 'العلبة' sidebar tab is open by default with cm inputs
    const cartonTab = page.getByTestId("carton-studio-tab");
    await expect(cartonTab).toBeVisible();
    await expect(page.getByTestId("sidebar-dim-height")).toHaveValue("14");
    await expect(page.getByTestId("sidebar-dim-width")).toHaveValue("7.5");
    await expect(page.getByTestId("sidebar-dim-depth")).toHaveValue("4.5");

    // 8. Edit carton dimensions directly in cm ('سم') from the sidebar!
    await page.getByTestId("sidebar-dim-height").fill("13.5");
    await page.getByTestId("sidebar-dim-width").fill("7");
    await page.getByTestId("sidebar-dim-depth").fill("4");
    await page.getByTestId("carton-sidebar-apply-size").click();
    await expect(bar).toContainText("135 × 70 × 40 mm");

    // 9. Also edit carton dimensions in cm ('سم') via CartonResizeDialog ('تعديل المقاسات')
    await page
      .getByRole("button", { name: "تعديل المقاسات", exact: true })
      .click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByTestId("resize-unit-cm").click();
    await dialog
      .getByRole("spinbutton", { name: "طول العلبة بالسنتيمتر", exact: true })
      .fill("15.5");
    await dialog
      .getByRole("spinbutton", { name: "عرض العلبة بالسنتيمتر", exact: true })
      .fill("8.5");
    await dialog
      .getByRole("spinbutton", { name: "عمق العلبة بالسنتيمتر", exact: true })
      .fill("5");
    await dialog
      .getByRole("button", { name: "تطبيق المقاسات", exact: true })
      .click();
    await expect(bar).toContainText("155 × 85 × 50 mm");
    await expect(bar).toContainText("15.5 × 8.5 × 5 سم");

    // 10. Place a packaging barcode stamp onto the carton & check Packaging Themes in 'قوالب'
    await page.getByTestId("stamp-barcode").click();
    await page
      .locator("#sidebar-nav-tabs")
      .getByRole("button", { name: "قوالب", exact: true })
      .click();
    await expect(page.getByTestId("packaging-templates-panel")).toBeVisible();
  });

  test("graphic project opens pure Graphic Studio editor without carton clutter", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${base}/designcraft.html`);

    // Launch a Ready Graphic Template directly from Graphic Studio
    await page.locator('[data-testid^="graphic-starter-tpl-"]').first().click();
    await expect(page.locator("#editor-layout")).toBeVisible();

    // Shows Graphic Studio pill, NO carton bar, and NO 'العلبة' tab in sidebar rail
    await expect(page.getByTestId("graphic-editor-mode-pill")).toBeVisible();
    await expect(page.locator(".carton-editor-bar")).toHaveCount(0);
    await expect(
      page
        .locator("#sidebar-nav-tabs")
        .getByRole("button", { name: "العلبة", exact: true }),
    ).toHaveCount(0);
  });
});
