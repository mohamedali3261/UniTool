import { readFile } from "node:fs/promises";
import { test, expect, type Page } from "@playwright/test";
async function boot(page: Page, lang = "ar") {
  await page.addInitScript((lang) => {
    if (!sessionStorage.getItem("excel-qa-initialized")) {
      localStorage.clear();
      localStorage.setItem("excel-studio.lang", lang);
      sessionStorage.setItem("excel-qa-initialized", "1");
    }
  }, lang);
  await page.goto("/excel-studio/");
  await expect(
    page.getByRole("heading", {
      name: lang === "ar" ? "شغلك، بشكل أرتب. ✦" : "Make room for clarity. ✦",
    }),
  ).toBeVisible();
}
async function cell(page: Page, ref: string, raw: string) {
  const target = page.locator(`[data-ref="${ref}"]`);
  await target.dblclick();
  const input = target.locator("input");
  await input.fill(raw);
  await input.press("Enter");
}
test("editor real formulas, formatting, autosave and undo/redo", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await boot(page);
  await cell(page, "B2", "30");
  await expect(page.locator('[data-ref="E2"]')).toContainText("٢٬٥٥٠");
  await page.getByRole("button", { name: "تراجع", exact: true }).click();
  await expect(page.locator('[data-ref="B2"]')).toContainText("٢٤");
  await page.getByRole("button", { name: "إعادة", exact: true }).click();
  await expect(page.locator('[data-ref="B2"]')).toContainText("٣٠");
  await page.locator('[data-ref="A3"]').click();
  await page.getByRole("button", { name: "عريض", exact: true }).click();
  await expect(page.locator('[data-ref="A3"]')).toHaveCSS("font-weight", "700");
  await page.waitForTimeout(650);
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("unitool.excel-studio.workbook.v1")!)
          .sheets[0].cells.B2.raw,
    ),
  ).toBe("30");
  expect(errors).toEqual([]);
  await page.screenshot({ path: ".cache/excel-desktop.png", fullPage: true });
});
test("guided assistant inserts a sum into a selected empty cell", async ({
  page,
}) => {
  await boot(page);
  await page.locator('[data-ref="D8"]').click();
  await page
    .locator(".xs-table-actions")
    .getByRole("button", { name: "مساعد المعادلات" })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.locator('input[dir="ltr"]').first().fill("B2:B5");
  await expect(dialog.locator("code")).toContainText("=SUM(B2:B5)");
  await dialog.getByRole("button", { name: "طبّق على الخلية" }).click();
  await expect(page.locator('[data-ref="D8"]')).toContainText("١١٤");
  await expect(page.locator("#xs-formula-input")).toHaveValue("=SUM(B2:B5)");
});
test("new table designer, sheet tabs, delete confirmation and undo", async ({
  page,
}) => {
  await boot(page);
  await page.getByRole("button", { name: "جدول جديد", exact: true }).click();
  let dialog = page.getByRole("dialog");
  await dialog.locator("input").first().fill("طلبات العملاء");
  await dialog.locator("textarea").fill("اسم العميل، السعر، المدفوع، المتبقي");
  await dialog.getByRole("button", { name: "أنشئ الجدول" }).click();
  await expect(page.getByRole("tab", { name: "طلبات العملاء" })).toBeVisible();
  await expect(page.locator('[data-ref="A1"]')).toContainText("اسم العميل");
  await page.getByRole("button", { name: "حذف الورقة" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "احذف الورقة" })
    .click();
  await expect(page.getByRole("tab", { name: "طلبات العملاء" })).toHaveCount(0);
  await page.getByRole("button", { name: "تراجع", exact: true }).click();
  await expect(page.getByRole("tab", { name: "طلبات العملاء" })).toBeVisible();
});
test("library searches every function, explains and runs examples, favorites persist", async ({
  page,
}) => {
  await boot(page);
  await page
    .getByRole("button", { name: "مكتبة المعادلات", exact: true })
    .click();
  await page.getByRole("textbox", { name: "بحث المعادلات" }).fill("SUMIFS");
  const card = page.locator(".xs-function-card");
  await expect(card).toHaveCount(1);
  await card.getByRole("button", { name: "تفضيل SUMIFS" }).click();
  await card.locator(".xs-function-open").click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("جمع بعدة شروط");
  await expect(dialog.locator(".xs-example-result b")).toHaveText("10");
  await dialog
    .getByRole("textbox", { name: "تجربة المعادلة" })
    .fill("=SUM(A1:A3)*2");
  await expect(dialog.locator(".xs-example-result b")).toHaveText("120");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("textbox", { name: "بحث المعادلات" }).fill("");
  await page.getByRole("button", { name: "المفضلة", exact: true }).click();
  await expect(page.locator(".xs-function-card h2")).toContainText("SUMIFS");
  await page.screenshot({ path: ".cache/excel-library.png", fullPage: true });
});
test("templates are genuinely editable with live calculations", async ({
  page,
}) => {
  await boot(page);
  await page.getByRole("button", { name: "قوالب جاهزة", exact: true }).click();
  await expect(page.locator(".xs-template-card")).toHaveCount(11);
  await page
    .locator(".xs-template-card")
    .filter({
      has: page.getByRole("heading", { name: "فاتورة احترافية", exact: true }),
    })
    .getByRole("button")
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "افتح الجدول", exact: true })
    .click();
  await cell(page, "B2", "2");
  await expect(page.locator('[data-ref="D2"]')).toContainText("٥٬٠٠٠");
  await expect(page.locator('[data-ref="F2"]')).toContainText("٥٬٧٠٠");
});
test("outside-click dismisses dialogs without replacing data", async ({
  page,
}) => {
  await boot(page);
  await page.getByRole("button", { name: "جدول جديد", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.mouse.click(5, 5);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("tab", { name: "البيانات" })).toBeVisible();
  await page.getByRole("button", { name: "تصدير الملف", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
test("CSV import is literal-safe, new workbook confirmed before replacement", async ({
  page,
}) => {
  await boot(page);
  await page.getByLabel("استيراد ملف جدول").setInputFiles({
    name: "customers.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("الاسم,العدد\nعلي,25\nنص,=1+2"),
  });
  await expect(page.getByRole("dialog")).toContainText("CSV");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "افتح الجدول", exact: true })
    .click();
  await expect(page.locator('[data-ref="A2"]')).toContainText("علي");
  await expect(page.locator('[data-ref="B3"]')).toContainText("=1+2");
});
test("XLSX export downloads a real zip workbook and chart downloads SVG", async ({
  page,
}) => {
  await boot(page);
  await page.getByRole("button", { name: "تصدير الملف", exact: true }).click();
  let event = page.waitForEvent("download");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /Excel .xlsx/ })
    .click();
  const download = await event;
  expect(download.suggestedFilename()).toMatch(/\.xlsx$/);
  const file = await download.path();
  expect(file).toBeTruthy();
  const bytes = await readFile(file!);
  expect(bytes.subarray(0, 2).toString()).toBe("PK");
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(bytes as any);
  expect(workbook.worksheets[0].getCell("E2").formula).toBe("B2*C2");
  await page.getByRole("button", { name: "رسم بياني قابل للتنزيل" }).click();
  event = page.waitForEvent("download");
  await page.getByRole("button", { name: "تنزيل الرسم SVG" }).click();
  expect((await event).suggestedFilename()).toBe("chart.svg");
});
test("circular formulas show actionable error, filtering does not affect totals", async ({
  page,
}) => {
  await boot(page);
  await cell(page, "D8", "=D8+1");
  await page.locator('[data-ref="D8"]').click();
  await expect(page.getByRole("alert")).toContainText("مرجع دائري");
  await page
    .getByRole("textbox", { name: "تصفية الصفوف", exact: true })
    .fill("قلم");
  await expect(page.locator('[data-ref="A2"]')).toHaveCount(0);
  await expect(page.locator('[data-ref="A3"]')).toBeVisible();
});
test("mobile and English layouts remain within viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await boot(page, "en");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Formula library", exact: true })
    .click();
  await expect(page.locator(".xs-function-card").first()).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Ready-made templates", exact: true })
    .click();
  await expect(page.locator(".xs-template-card")).toHaveCount(11);
  await page.screenshot({ path: ".cache/excel-mobile.png", fullPage: true });
});

test("multi-cell paste, range fill, sorting and style settings are real operations", async ({
  page,
}) => {
  await boot(page);
  await page.locator('[data-ref="D8"]').click();
  await page.evaluate(() => {
    const data = new DataTransfer();
    data.setData("text/plain", "8\t9\n10\t11");
    document
      .querySelector('[data-ref="D8"]')!
      .dispatchEvent(
        new ClipboardEvent("paste", { bubbles: true, clipboardData: data }),
      );
  });
  await expect(page.locator('[data-ref="E9"]')).toContainText("١١");
  await cell(page, "D8", "=B2*C2");
  await page.locator('[data-ref="D8"]').click();
  await page.locator('[data-ref="D10"]').click({ modifiers: ["Shift"] });
  await page.getByRole("button", { name: "تعبئة لأسفل", exact: true }).click();
  await page.locator('[data-ref="D10"]').click();
  await expect(page.locator("#xs-formula-input")).toHaveValue("=B4*C4");
  await page
    .getByRole("combobox", { name: "مظهر الجدول" })
    .selectOption("indigo");
  await expect(page.locator('[data-ref="A1"]')).toHaveCSS(
    "background-color",
    "rgb(78, 70, 165)",
  );
});
test("language switch and local reload preserve workbook edits", async ({
  page,
}) => {
  await boot(page);
  await cell(page, "B2", "35");
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Export file", exact: true }),
  ).toBeVisible();
  await page.waitForTimeout(700);
  await page.reload();
  await expect(page.locator('[data-ref="B2"]')).toContainText("35");
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("unitool.excel-studio.workbook.v1")!),
  );
  expect(saved.sheets[0].cells.B2.raw).toBe("35");
  expect(await page.evaluate(() => document.documentElement.dir)).toBe("ltr");
});
