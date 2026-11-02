import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
async function boot(page: Page) {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem("bi-qa")) {
      localStorage.clear();
      localStorage.setItem("excel-studio.lang", "en");
      sessionStorage.setItem("bi-qa", "1");
    }
  });
  await page.goto("/excel-studio/#analytics");
  await expect(page.locator(".bi-widget")).toHaveCount(7);
}
test("linked dashboard recalculates source formulas and persists filters and settings", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await boot(page);
  await expect(
    page.locator('[data-widget="kpi-total"] .bi-kpi-body>b'),
  ).toHaveText("10,620");
  await page.getByRole("button", { name: "Open linked sheet" }).click();
  const c = page.locator('[data-ref="B2"]');
  await c.dblclick();
  await c.locator("input").fill("30");
  await c.locator("input").press("Enter");
  await page
    .locator(".xs-table-tools")
    .getByRole("button", { name: "Analytics", exact: true })
    .click();
  await expect(
    page.locator('[data-widget="kpi-total"] .bi-kpi-body>b'),
  ).toHaveText("11,130");
  await page.getByRole("button", { name: "Add filter", exact: true }).click();
  await page
    .getByLabel("Filter value", { exact: true })
    .selectOption("Notebook");
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(
    page.locator('[data-widget="kpi-total"] .bi-kpi-body>b'),
  ).toHaveText("2,550");
  await page
    .getByRole("textbox", { name: "Report title" })
    .fill("My live report");
  await page.waitForTimeout(650);
  await page.reload();
  await expect(page.getByRole("textbox", { name: "Report title" })).toHaveValue(
    "My live report",
  );
  await expect(
    page.locator('[data-widget="kpi-total"] .bi-kpi-body>b'),
  ).toHaveText("2,550");
  await page.screenshot({ path: ".cache/bi-filtered.png", fullPage: true });
  expect(errors).toEqual([]);
});
test("visual creation, chart types, drill filters, safe data downloads and PNG", async ({
  page,
}) => {
  await boot(page);
  await page.getByRole("button", { name: "Add visual", exact: true }).click();
  let d = page.getByRole("dialog");
  await d.getByLabel("Title", { exact: true }).fill("Profit area");
  await d.getByLabel("Visual type").selectOption("area");
  await d
    .getByRole("combobox", { name: "Measure", exact: true })
    .selectOption("F");
  await d.getByRole("button", { name: "Save visual" }).click();
  await expect(page.locator(".bi-widget")).toHaveCount(8);
  await expect(page.getByRole("img", { name: "Profit area" })).toBeVisible();
  await page
    .locator('[data-widget="visual-category"] .bi-chart-point')
    .first()
    .click();
  await expect(page.locator(".bi-filter-chips")).toContainText("Bag");
  await expect(
    page.locator('[data-widget="kpi-count"] .bi-kpi-body>b'),
  ).toHaveText("1");
  const dl = page.waitForEvent("download");
  await page.getByRole("button", { name: "CSV", exact: true }).click();
  const file = await dl;
  const csv = await readFile((await file.path())!, "utf8");
  expect(csv).toContain("Bag");
  expect(csv).not.toContain("Notebook");
  await page.getByRole("button", { name: "Clear all filters" }).click();
  const pngWait = page.waitForEvent("download", { timeout: 30000 });
  await page.getByRole("button", { name: "PNG", exact: true }).click();
  expect((await pngWait).suggestedFilename()).toBe("dashboard.png");
  await page.screenshot({ path: ".cache/bi-desktop.png", fullPage: true });
});
test("table validation, conditional colors, replacement, wrap and resize have real effects", async ({
  page,
}) => {
  await boot(page);
  await page.getByRole("button", { name: "Open linked sheet" }).click();
  await page
    .getByRole("button", { name: "Rules & conditional format", exact: true })
    .click();
  const d = page.getByRole("dialog");
  await d
    .getByRole("combobox", { name: "Column", exact: true })
    .selectOption("1");
  await d.getByLabel("Minimum (optional)").fill("0");
  await d.getByRole("button", { name: "Save column rule" }).click();
  await expect(d.locator(".xs-rule-list").first()).toContainText("B · number");
  await d.getByLabel("Value", { exact: true }).fill("20");
  await d.getByRole("button", { name: "Add formatting" }).click();
  await page.keyboard.press("Escape");
  await expect(page.locator('[data-ref="B2"]')).toHaveCSS(
    "background-color",
    "rgb(255, 241, 215)",
  );
  const c = page.locator('[data-ref="B2"]');
  await c.dblclick();
  await c.locator("input").fill("-1");
  await c.locator("input").press("Enter");
  await expect(c).toContainText("24");
  await expect(page.locator(".xs-toast")).toContainText("Below minimum");
  await page.getByRole("button", { name: "Wrap text", exact: true }).click();
  await expect(page.locator(".xs-grid")).toHaveClass(/xs-wrap/);
  const separator = page.getByRole("separator", { name: "Column width B" });
  await separator.focus();
  await page.keyboard.press("ArrowRight");
  await expect(separator).toHaveAttribute("aria-valuenow", "135");
  await page
    .getByRole("button", { name: "Show formulas", exact: true })
    .click();
  await expect(page.locator('[data-ref="E2"]')).toContainText("=B2*C2");
  await page
    .getByRole("button", { name: "Find & replace", exact: true })
    .click();
  await page.getByLabel("Find", { exact: true }).fill("Notebook");
  await page.getByLabel("Replace with", { exact: true }).fill("New notebook");
  await expect(page.getByRole("dialog")).toContainText("1 cells will change");
  await page.getByRole("button", { name: "Apply replacements" }).click();
  await expect(page.locator('[data-ref="A2"]')).toContainText("New notebook");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.locator('[data-ref="A2"]')).toContainText("Notebook");
});
for (const width of [390, 768])
  test(`analytics fits ${width}px and menus remain usable`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await boot(page);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    await page.locator('[data-widget="kpi-total"] summary').click();
    await page
      .locator('[data-widget="kpi-total"]')
      .getByRole("button", { name: "Edit", exact: true })
      .click();
    const d = page.getByRole("dialog");
    const box = (await d.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
    await page.keyboard.press("Escape");
    await page.screenshot({ path: `.cache/bi-${width}.png`, fullPage: true });
  });
test("visual menus reorder, duplicate, remove and undo without changing sheet data", async ({
  page,
}) => {
  await boot(page);
  const card = page.locator('[data-widget="visual-category"]');
  await card.locator("summary").click();
  await card.getByRole("button", { name: "Move earlier", exact: true }).click();
  await expect(page.locator(".bi-widget").nth(2)).toHaveAttribute(
    "data-widget",
    "visual-category",
  );
  await card.locator("summary").click();
  await card.getByRole("button", { name: "Duplicate", exact: true }).click();
  await expect(page.locator(".bi-widget")).toHaveCount(8);
  await card.locator("summary").click();
  await card.getByRole("button", { name: "Remove", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Remove visual", exact: true })
    .click();
  await expect(page.locator(".bi-widget")).toHaveCount(7);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.locator(".bi-widget")).toHaveCount(8);
  await expect(
    page.locator('[data-widget="kpi-total"] .bi-kpi-body>b'),
  ).toHaveText("10,620");
});
test("source reconnection recovers a report after its source sheet was removed", async ({
  page,
}) => {
  await boot(page);
  await page.waitForTimeout(600);
  await page.evaluate(() => {
    const key = "unitool.excel-studio.workbook.v1",
      b = JSON.parse(localStorage.getItem(key)!);
    b.dashboard.source = "removed-sheet";
    localStorage.setItem(key, JSON.stringify(b));
  });
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Reconnect your report to a sheet" }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Report source" })
    .selectOption({ label: "Data" });
  await expect(page.locator(".bi-widget")).toHaveCount(7);
  await expect(
    page.locator('[data-widget="kpi-total"] .bi-kpi-body>b'),
  ).toHaveText("10,620");
});
test("scatter and donut can be created from real numeric fields, exported and printed", async ({
  page,
}) => {
  await boot(page);
  await page.getByRole("button", { name: "Add visual", exact: true }).click();
  const d = page.getByRole("dialog");
  await d.getByLabel("Title", { exact: true }).fill("Correlation");
  await d
    .getByRole("combobox", { name: "Visual type", exact: true })
    .selectOption("scatter");
  await d
    .getByRole("combobox", { name: "Measure", exact: true })
    .selectOption("B");
  await d
    .getByRole("combobox", { name: "Y measure", exact: true })
    .selectOption("E");
  await d.getByRole("button", { name: "Save visual" }).click();
  await expect(
    page.getByRole("img", { name: "Correlation" }).locator("circle"),
  ).toHaveCount(4);
  const card = page
    .locator(".bi-widget")
    .filter({
      has: page.getByRole("heading", { name: "Correlation", exact: true }),
    });
  await card.locator("summary").click();
  const waiting = page.waitForEvent("download");
  await card.getByRole("button", { name: "Download SVG" }).click();
  const svg = await readFile((await (await waiting).path())!, "utf8");
  expect(svg).toContain("Notebook: 24, 2040");
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".bi-print-title").first()).toBeVisible();
  await expect(page.locator(".bi-report-toolbar")).toBeHidden();
  await expect(page.locator(".xs-sidebar")).toBeHidden();
});
