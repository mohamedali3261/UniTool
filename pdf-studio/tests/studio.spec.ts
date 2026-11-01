import { test, expect, type Page } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";
const fixture = (name: string) =>
  fileURLToPath(new URL("./fixtures/" + name, import.meta.url));
async function boot(page: Page, name = "arabic-native.pdf", lang = "ar") {
  await page.addInitScript(
    (lang) => localStorage.setItem("pdf-studio.lang", lang),
    lang,
  );
  await page.goto("/pdf-studio/");
  await page
    .locator(".ps-upload input[type=file]")
    .setInputFiles(fixture(name));
  await expect(page.locator(".ps-paper")).toHaveAttribute(
    "data-ready",
    "true",
    { timeout: 20000 },
  );
}
test("native Arabic, diacritics and mixed digits are readable and searchable without reversal", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await boot(page);
  const text = await page
    .getByRole("textbox", { name: "النص المستخرج", exact: true })
    .inputValue();
  expect(text).toContain("مرحبًا بكم في القاهرة");
  expect(text).toContain("12345");
  expect(text).toContain("2500");
  expect(text).toContain("Arabic and English");
  await page
    .getByRole("textbox", { name: "البحث في المستند", exact: true })
    .fill("مرحبا");
  await expect(page.locator(".ps-search-results")).toContainText("موجود");
  await expect(page.locator(".ps-search-layer rect")).toHaveCount(3);
  await expect(page.locator(".textLayer span").first()).toBeAttached();
  await page.screenshot({
    path: ".cache/pdf-native-desktop.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
test("Arabic annotations export without changing native text, and undo/redo is real", async ({
  page,
}) => {
  await boot(page);
  await page.getByRole("button", { name: "إضافة نص", exact: true }).click();
  const svg = page.locator(".ps-interaction"),
    box = (await svg.boundingBox())!;
  await svg.click({ position: { x: 120, y: 350 } });
  await expect(page.locator(".ps-layer-list>div")).toHaveCount(1);
  await page.locator(".ps-properties textarea").fill("إضافة عربية 2026");
  await page.getByRole("button", { name: "تطبيق النص", exact: true }).click();
  await expect(page.locator(".ps-layer-list")).toContainText("إضافة عربية");
  await page.getByRole("button", { name: "تراجع", exact: true }).click();
  await expect(page.locator(".ps-layer-list")).toContainText("نص جديد");
  await page.getByRole("button", { name: "إعادة", exact: true }).click();
  const wait = page.waitForEvent("download");
  await page.getByRole("button", { name: "تصدير PDF", exact: true }).click();
  const download = await wait,
    bytes = await readFile((await download.path())!);
  expect(bytes.length).toBeGreaterThan(1000);
  expect((await PDFDocument.load(bytes)).getPageCount()).toBe(1);
  page.on("dialog", (d) => d.accept());
  await page
    .locator('.ps-documentbar input[accept="application/pdf,.pdf"]')
    .setInputFiles({
      name: "edited.pdf",
      mimeType: "application/pdf",
      buffer: bytes,
    });
  await expect(page.locator(".ps-paper")).toHaveAttribute("data-ready", "true");
  await expect(
    page.getByRole("textbox", { name: "النص المستخرج", exact: true }),
  ).toHaveValue(/مرحبًا بكم في القاهرة/);
  await expect(page.locator(".ps-layer-list>div")).toHaveCount(0);
  await page.screenshot({
    path: ".cache/pdf-exported-arabic.png",
    fullPage: true,
  });
});
test("page duplication, rotation, ordering and deletion survive PDF export", async ({
  page,
}) => {
  await boot(page, "arabic-rotations.pdf", "en");
  await expect(page.locator(".ps-page-item")).toHaveCount(4);
  await page
    .getByRole("button", { name: "Duplicate page", exact: true })
    .click();
  await expect(page.locator(".ps-page-item")).toHaveCount(5);
  await page
    .getByRole("button", { name: "Rotate current page", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Move page later", exact: true })
    .click();
  await page.getByRole("button", { name: "Delete page", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Remove page", exact: true })
    .click();
  await expect(page.locator(".ps-page-item")).toHaveCount(4);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.locator(".ps-page-item")).toHaveCount(5);
  const wait = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export PDF", exact: true }).click();
  const bytes = await readFile((await (await wait).path())!),
    doc = await PDFDocument.load(bytes);
  expect(doc.getPageCount()).toBe(5);
  expect(doc.getPage(1).getRotation().angle).toBe(90);
});
test("scanned Arabic is identified honestly and real local OCR reads words and numerals", async ({
  page,
}) => {
  test.setTimeout(180000);
  const requests: string[] = [];
  page.on("request", (r) => requests.push(r.url()));
  await boot(page, "arabic-scanned.pdf");
  await expect(page.locator(".ps-source-badge")).toContainText("لا توجد");
  await expect(page.locator(".ps-text-panel .ps-warning")).toContainText(
    "مصوّرة",
  );
  await page
    .getByRole("combobox", { name: "تخطيط OCR", exact: true })
    .selectOption("block");
  await page
    .getByRole("button", { name: "قراءة الصفحة بـ OCR", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "مراجعة نص OCR", exact: true }),
  ).toBeVisible({ timeout: 120000 });
  const text = await page
    .getByRole("textbox", { name: "مراجعة نص OCR", exact: true })
    .inputValue();
  expect(text).toContain("الفاتورة");
  expect(text).toContain("القاهرة");
  expect(text).toContain("12345");
  await expect(page.locator(".ps-ocr-confidence")).toContainText(
    "ليست نسبة دقة",
  );
  await page
    .getByRole("textbox", { name: "مراجعة نص OCR", exact: true })
    .fill(text + "\nنص تمت مراجعته");
  await page.getByRole("checkbox", { name: "راجعت النص مقابل الصورة" }).check();
  await expect(
    page.getByRole("checkbox", { name: "راجعت النص مقابل الصورة" }),
  ).toBeChecked();
  expect(
    requests.filter(
      (u) =>
        /^https?:/.test(u) &&
        !u.startsWith("http://localhost:3000") &&
        !u.startsWith("http://localhost:4173"),
    ),
  ).toEqual([]);
  await page.screenshot({ path: ".cache/pdf-ocr-arabic.png", fullPage: true });
});
test("project backups are fingerprint-bound and do not leak annotations across PDFs", async ({
  page,
}) => {
  await boot(page);
  await page.getByRole("button", { name: "إضافة نص", exact: true }).click();
  await page.locator(".ps-interaction").click({ position: { x: 100, y: 180 } });
  const wait = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "حفظ مشروع التعديلات", exact: true })
    .click();
  const bytes = await readFile((await (await wait).path())!),
    project = JSON.parse(bytes.toString());
  expect(project.pages[0].annotations.length).toBe(1);
  expect(project.fingerprint.length).toBe(64);
  page.on("dialog", (d) => d.accept());
  await page
    .locator('.ps-documentbar input[accept="application/pdf,.pdf"]')
    .setInputFiles(fixture("latin.pdf"));
  await expect(page.locator(".ps-paper")).toHaveAttribute("data-ready", "true");
  await expect(page.locator(".ps-layer-list>div")).toHaveCount(0);
  await page
    .locator('.ps-documentbar input[accept=".json,application/json"]')
    .setInputFiles({
      name: "project.json",
      mimeType: "application/json",
      buffer: bytes,
    });
  await expect(page.locator(".ps-toast")).toContainText("المشروع لا يطابق");
});
for (const width of [320, 390, 768])
  test(`Arabic workspace and OCR panels fit ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/pdf-studio/");
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    await page
      .locator(".ps-upload input[type=file]")
      .setInputFiles(fixture("arabic-native.pdf"));
    await expect(page.locator(".ps-paper")).toHaveAttribute(
      "data-ready",
      "true",
    );
    await page.getByRole("button", { name: "النص وOCR", exact: true }).click();
    await expect(
      page.getByRole("textbox", { name: "النص المستخرج", exact: true }),
    ).toBeVisible();
    await expect(page.locator(".ps-paper")).toHaveAttribute(
      "data-ready",
      "true",
    );
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    await page.screenshot({
      path: `.cache/pdf-mobile-${width}.png`,
      fullPage: true,
    });
  });
test("invalid PDFs produce an actionable error without opening an empty editor", async ({
  page,
}) => {
  await page.goto("/pdf-studio/");
  await page.locator(".ps-upload input[type=file]").setInputFiles({
    name: "bad.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("not a PDF"),
  });
  await expect(page.getByRole("alert")).toContainText("ليس PDF");
  await expect(page.locator(".ps-upload")).toBeVisible();
});
test("annotation positions stay aligned on all four native rotations and non-zero crop boxes", async ({
  page,
}) => {
  await boot(page, "arabic-rotations.pdf", "en");
  const saved = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Save annotation project", exact: true })
    .click();
  const project = JSON.parse(
    (await readFile((await (await saved).path())!)).toString(),
  );
  for (const p of project.pages)
    p.annotations = [
      {
        id: "mark-" + p.id,
        type: "highlight",
        x: 30,
        y: 30,
        w: 40,
        h: 50,
        fontSize: 22,
        color: "#e7b52f",
      },
    ];
  page.on("dialog", (d) => d.accept());
  await page
    .locator('.ps-documentbar input[accept=".json,application/json"]')
    .setInputFiles({
      name: "positions.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(project)),
    });
  await expect(page.locator(".ps-layer-list>div")).toHaveCount(1);
  const wait = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export PDF", exact: true }).click();
  const output = await readFile((await (await wait).path())!),
    doc = await PDFDocument.load(output);
  await page
    .locator('.ps-documentbar input[accept="application/pdf,.pdf"]')
    .setInputFiles({
      name: "positions.pdf",
      mimeType: "application/pdf",
      buffer: output,
    });
  await expect(page.locator(".ps-paper")).toHaveAttribute("data-ready", "true");
  for (let i = 0; i < 4; i++) {
    await page
      .getByRole("button", { name: `Open page ${i + 1}`, exact: true })
      .click();
    await expect(page.locator(".ps-paper")).toHaveAttribute(
      "data-ready",
      "true",
    );
    const p = doc.getPage(i),
      box = p.getCropBox(),
      rotated = p.getRotation().angle % 180 !== 0;
    const fraction = await page.locator(".ps-native").evaluate(
      (canvas: HTMLCanvasElement, size: { w: number; h: number }) => {
        const ctx = canvas.getContext("2d")!,
          x = Math.floor((32 / size.w) * canvas.width),
          y = Math.floor((32 / size.h) * canvas.height),
          w = Math.max(1, Math.floor((36 / size.w) * canvas.width)),
          h = Math.max(1, Math.floor((46 / size.h) * canvas.height)),
          data = ctx.getImageData(x, y, w, h).data;
        let gold = 0;
        for (let i = 0; i < data.length; i += 4)
          if (
            data[i] > 180 &&
            data[i + 1] > 140 &&
            data[i + 2] < 240 &&
            data[i] - data[i + 2] > 20
          )
            gold++;
        return gold / (data.length / 4);
      },
      {
        w: rotated ? box.height : box.width,
        h: rotated ? box.width : box.height,
      },
    );
    expect(fraction).toBeGreaterThan(0.35);
    await expect(
      page.getByRole("textbox", { name: "Extracted text", exact: true }),
    ).toHaveValue(/مرحبًا بكم في القاهرة/);
  }
});
test("OCR cancellation settles safely and a later scan can still complete", async ({
  page,
}) => {
  await boot(page, "arabic-scanned.pdf", "en");
  await page
    .getByRole("button", { name: "Run OCR on this page", exact: true })
    .click();
  await page.getByRole("button", { name: "Cancel OCR", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Run OCR on this page", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Run OCR on this page", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Review OCR text", exact: true }),
  ).toBeVisible({ timeout: 30000 });
});
test("keyboard geometry controls move and resize annotations independently of zoom", async ({
  page,
}) => {
  await boot(page, "latin.pdf", "en");
  await page.getByRole("button", { name: "Add text", exact: true }).click();
  await page.locator(".ps-interaction").click({ position: { x: 100, y: 200 } });
  await page
    .getByRole("spinbutton", { name: "Position/size X", exact: true })
    .fill("80");
  await page
    .getByRole("spinbutton", { name: "Position/size Width", exact: true })
    .fill("170");
  await page
    .getByRole("button", { name: "Apply position and size", exact: true })
    .click();
  await expect(page.locator(".ps-interaction rect")).toHaveAttribute("x", "80");
  await expect(page.locator(".ps-interaction rect")).toHaveAttribute(
    "width",
    "170",
  );
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  await expect(page.locator(".ps-interaction rect")).toHaveAttribute("x", "80");
});
