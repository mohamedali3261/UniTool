import { test, expect, type Page } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { PDFDocument, PDFName, PDFDict, StandardFonts } from "pdf-lib";
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
test("font-private glyphs are visible as missing text, presentation forms are readable, and raw extraction remains available", async ({
  page,
}) => {
  const doc = await PDFDocument.create(),
    font = await doc.embedFont(StandardFonts.Helvetica),
    p = doc.addPage([595, 842]);
  p.drawText("~ _ ^ 001.02 04-Apr-2027", { x: 40, y: 700, size: 24, font });
  await font.embed();
  // PDF.js bidi consumes visual glyph order; use non-date glyphs so date text stays unchanged.
  const cmap = `/CIDInit /ProcSet findresource begin
12 dict begin begincmap
/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def
/CMapName /SyntheticTest def /CMapType 2 def
1 begincodespacerange <00> <FF> endcodespacerange
3 beginbfchar <7E> <FEC9FEEEFEE7> <5F> <E018> <5E> <E032> endbfchar
endcmap CMapName currentdict /CMap defineresource pop end end`;
  doc.context
    .lookup(font.ref, PDFDict)
    .set(
      PDFName.of("ToUnicode"),
      doc.context.register(doc.context.flateStream(cmap)),
    );
  await page.addInitScript(() => localStorage.setItem("pdf-studio.lang", "en"));
  await page.goto("/pdf-studio/");
  await page.locator(".ps-upload input[type=file]").setInputFiles({
    name: "synthetic-font-mappings.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from(await doc.save()),
  });
  await expect(page.locator(".ps-paper")).toHaveAttribute("data-ready", "true");
  const text = page.getByRole("textbox", {
    name: "Extracted text",
    exact: true,
  });
  await expect(text).toHaveValue(/نوع/);
  const clean = await text.inputValue();
  expect(clean).not.toMatch(/[\uE000-\uF8FF]/u);
  expect(clean).toContain("�");
  expect(clean).toContain("001.02");
  expect(clean).toContain("04-Apr-2027");
  await expect(page.getByRole("alert")).toContainText("Incomplete text");
  await expect(page.locator(".ps-source-badge")).toHaveText(
    "Text needs review",
  );
  await page.locator(".ps-encoding-notice summary").click();
  await expect(page.locator(".ps-encoding-notice")).toContainText("U+E018");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "TXT", exact: true }).click();
  const content = await readFile((await (await download).path())!, "utf8");
  expect(content).toContain("نوع");
  expect(content).not.toMatch(/[\uE000-\uF8FF]/u);
  await page
    .getByRole("combobox", { name: "Reading order", exact: true })
    .selectOption("rawSource");
  await expect(text).toHaveValue(/[\uE000-\uF8FF]/u);
  await page
    .getByRole("button", { name: "Read the page image with OCR", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Cancel OCR", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cancel OCR", exact: true }).click();
});
test("limited native editing replaces real source text and opens the edited copy for review", async ({
  page,
}) => {
  const doc = await PDFDocument.create(),
    font = await doc.embedFont(StandardFonts.Helvetica);
  doc.addPage().drawText("Original 123", { x: 40, y: 700, size: 20, font });
  await page.addInitScript(() => localStorage.setItem("pdf-studio.lang", "en"));
  await page.goto("/pdf-studio/");
  await page.locator(".ps-upload input[type=file]").setInputFiles({
    name: "native.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from(await doc.save()),
  });
  await expect(page.locator(".ps-paper")).toHaveAttribute("data-ready", "true");
  await page
    .getByRole("button", { name: "Edit original text (limited)", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Edit text on page", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Edit text inside page", exact: true })
    .fill("Changed 456");
  await page
    .getByRole("textbox", { name: "Edit text inside page", exact: true })
    .press("Enter");
  await page
    .getByRole("spinbutton", { name: "Native move X", exact: true })
    .fill("20");
  await page
    .getByRole("button", { name: "Create edited copy", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Download native edited copy",
      exact: true,
    }),
  ).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Open edited copy for review", exact: true })
    .click();
  await expect(page.locator(".ps-paper")).toHaveAttribute("data-ready", "true");
  const text = page.getByRole("textbox", {
    name: "Extracted text",
    exact: true,
  });
  await expect(text).toHaveValue(/Changed 456/);
  await expect(text).not.toHaveValue(/Original 123/);
});

for (const rotation of [0, 90, 180, 270]) {
  test(`native page drag respects PDF rotation ${rotation}, crop offsets, zoom and movement undo`, async ({
    page,
  }) => {
    const { degrees } = await import("pdf-lib");
    const doc = await PDFDocument.create(),
      font = await doc.embedFont(StandardFonts.Helvetica),
      p = doc.addPage([595, 842]);
    p.setCropBox(20, 30, 500, 760);
    p.setRotation(degrees(rotation));
    p.drawText("Drag original", { x: 100, y: 650, size: 22, font });
    await page.addInitScript(() =>
      localStorage.setItem("pdf-studio.lang", "en"),
    );
    await page.goto("/pdf-studio/");
    await page.locator(".ps-upload input[type=file]").setInputFiles({
      name: "drag.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from(await doc.save()),
    });
    await expect(page.locator(".ps-paper")).toHaveAttribute(
      "data-ready",
      "true",
    );
    await page
      .getByRole("button", {
        name: "Edit original text (limited)",
        exact: true,
      })
      .click();
    const rect = page.locator('[data-native-block="0"]');
    await expect(rect).toHaveAttribute("tabindex", "0", { timeout: 30000 });
    const zoom = page.getByRole("slider", {
      name: "Editing preview zoom",
      exact: true,
    });
    await zoom.fill("1.5");
    await rect.scrollIntoViewIfNeeded();
    const box = (await rect.boundingBox())!;
    const expected = await rect.evaluate((el) => {
      const matrix = (
        (el as SVGElement).ownerSVGElement as SVGSVGElement
      ).getScreenCTM()!;
      const start = new DOMPoint(0, 0).matrixTransform(matrix.inverse());
      const end = new DOMPoint(24, 12).matrixTransform(matrix.inverse());
      return { x: end.x - start.x, y: end.y - start.y };
    });
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(
      box.x + box.width / 2 + 24,
      box.y + box.height / 2 + 12,
      { steps: 5 },
    );
    await page.mouse.up();
    const x = Number(
      await page
        .getByRole("spinbutton", { name: "Native move X", exact: true })
        .inputValue(),
    );
    const y = Number(
      await page
        .getByRole("spinbutton", { name: "Native move Y", exact: true })
        .inputValue(),
    );
    // Screen vector -> inverse of native page rotation. Viewport in PDF.js has a flipped Y axis.
    const expectedX =
      rotation === 0
        ? expected.x
        : rotation === 90
          ? expected.y
          : rotation === 180
            ? -expected.x
            : -expected.y;
    const expectedY =
      rotation === 0
        ? -expected.y
        : rotation === 90
          ? expected.x
          : rotation === 180
            ? expected.y
            : -expected.x;
    expect(x).toBeCloseTo(expectedX, 1);
    expect(y).toBeCloseTo(expectedY, 1);
    await page
      .getByRole("button", { name: "Undo movement", exact: true })
      .click();
    await expect(
      page.getByRole("spinbutton", { name: "Native move X", exact: true }),
    ).toHaveValue("0");
    await page
      .getByRole("button", { name: "Redo movement", exact: true })
      .click();
    expect(
      Number(
        await page
          .getByRole("spinbutton", { name: "Native move X", exact: true })
          .inputValue(),
      ),
    ).toBeCloseTo(x, 2);
    await rect.focus();
    await page.keyboard.press("Shift+ArrowRight");
    const keyboardX = Number(
      await page
        .getByRole("spinbutton", { name: "Native move X", exact: true })
        .inputValue(),
    );
    const keyboardY = Number(
      await page
        .getByRole("spinbutton", { name: "Native move Y", exact: true })
        .inputValue(),
    );
    expect(Math.hypot(keyboardX - x, keyboardY - y)).toBeCloseTo(0.1, 2);
  });
}

test("native touch drag commits once and touch cancellation restores the last position on mobile", async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const doc = await PDFDocument.create(),
    font = await doc.embedFont(StandardFonts.Helvetica);
  doc
    .addPage([595, 842])
    .drawText("Touch original", { x: 60, y: 700, size: 28, font });
  await page.addInitScript(() => localStorage.setItem("pdf-studio.lang", "en"));
  await page.goto("/pdf-studio/");
  await page.locator(".ps-upload input[type=file]").setInputFiles({
    name: "touch.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from(await doc.save()),
  });
  await expect(page.locator(".ps-paper")).toHaveAttribute("data-ready", "true");
  await page.getByRole("button", { name: "Tools", exact: true }).click();
  await page
    .getByRole("button", { name: "Edit original text (limited)", exact: true })
    .click();
  const rect = page.locator('[data-native-block="0"]');
  await expect(rect).toHaveAttribute("tabindex", "0", { timeout: 30000 });
  await rect.scrollIntoViewIfNeeded();
  const box = (await rect.boundingBox())!,
    client = await context.newCDPSession(page);
  const x = box.x + box.width / 2,
    y = box.y + box.height / 2;
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y }],
  });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: x + 18, y: y + 12 }],
  });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  const moved = await page
    .getByRole("spinbutton", { name: "Native move X", exact: true })
    .inputValue();
  expect(Number(moved)).toBeGreaterThan(0);
  const nextBox = (await rect.boundingBox())!,
    nx = nextBox.x + nextBox.width / 2,
    ny = nextBox.y + nextBox.height / 2;
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: nx, y: ny }],
  });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: nx + 12, y: ny + 10 }],
  });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchCancel",
    touchPoints: [],
  });
  await expect(
    page.getByRole("spinbutton", { name: "Native move X", exact: true }),
  ).toHaveValue(moved);
  await page
    .getByRole("button", { name: "Undo movement", exact: true })
    .click();
  await expect(
    page.getByRole("spinbutton", { name: "Native move X", exact: true }),
  ).toHaveValue("0");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > innerWidth,
  );
  expect(overflow).toBe(false);
});

test("supported embedded Arabic glyphs move on the page without attempting character replacement", async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem("pdf-studio.lang", "en"));
  await page.goto("/pdf-studio/");
  await page.locator(".ps-upload input[type=file]").setInputFiles({
    name: "native-arabic.pdf",
    mimeType: "application/pdf",
    buffer: await readFile(fixture("arabic-native-movable.pdf")),
  });
  await expect(page.locator(".ps-paper")).toHaveAttribute("data-ready", "true");
  await expect(
    page.getByRole("textbox", { name: "Extracted text", exact: true }),
  ).toHaveValue(/مرحبا/);
  const original = await page
    .getByRole("textbox", { name: "Extracted text", exact: true })
    .inputValue();
  expect(original).toContain("مرحبا");
  await page
    .getByRole("button", { name: "Edit original text (limited)", exact: true })
    .click();
  const rect = page.locator('[data-native-block="0"]');
  await expect(rect).toHaveAttribute("tabindex", "0", { timeout: 30000 });
  const ink = await page
    .locator(".ps-native-preview-paper > canvas")
    .evaluateAll((canvases) =>
      canvases.map((node) => {
        const c = node as HTMLCanvasElement,
          pixels = c
            .getContext("2d")!
            .getImageData(0, 0, c.width, c.height).data;
        let count = 0;
        for (let i = 0; i < pixels.length; i += 4)
          if (pixels[i + 3] > 0 && pixels[i] < 128) count++;
        return count;
      }),
    );
  expect(ink[0]).toBe(0); // No ghost of the original block under the moving layer.
  expect(ink[1]).toBeGreaterThan(100); // Actual Arabic glyphs, not merely extractable invisible text.
  await expect(
    page.getByRole("textbox", { name: "Replacement text", exact: true }),
  ).toHaveCount(0);
  await rect.scrollIntoViewIfNeeded();
  const before = (await rect.boundingBox())!;
  await page.mouse.move(
    before.x + before.width / 2,
    before.y + before.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    before.x + before.width / 2 + 30,
    before.y + before.height / 2 + 18,
    { steps: 6 },
  );
  await page.mouse.up();
  const after = (await rect.boundingBox())!;
  expect(after.x - before.x).toBeCloseTo(30, 0);
  expect(after.y - before.y).toBeCloseTo(18, 0);
  await page
    .getByRole("button", { name: "Create edited copy", exact: true })
    .click();
  page.once("dialog", (d) => d.accept());
  await page
    .getByRole("button", { name: "Open edited copy for review", exact: true })
    .click();
  await expect(page.locator(".ps-paper")).toHaveAttribute("data-ready", "true");
  await expect(
    page.getByRole("textbox", { name: "Extracted text", exact: true }),
  ).toHaveValue(original);
});

for (const mobile of [false, true])
  test(`toolbar edit mode edits in place without a dialog and preserves native layout ${mobile ? "on mobile" : "on desktop"}`, async ({
    page,
  }) => {
    if (mobile) await page.setViewportSize({ width: 390, height: 844 });
    const doc = await PDFDocument.create(),
      font = await doc.embedFont(StandardFonts.Helvetica);
    doc
      .addPage([595, 842])
      .drawText("Original 123", { x: 70, y: 650, size: 22, font });
    await page.addInitScript(() =>
      localStorage.setItem("pdf-studio.lang", "en"),
    );
    await page.goto("/pdf-studio/");
    await page.locator(".ps-upload input[type=file]").setInputFiles({
      name: "inline.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from(await doc.save()),
    });
    await expect(page.locator(".ps-paper")).toHaveAttribute(
      "data-ready",
      "true",
    );
    const edit = page.getByRole("button", {
      name: "Edit page text",
      exact: true,
    });
    await expect(
      edit.locator("xpath=preceding-sibling::button[1]"),
    ).toHaveAttribute("aria-label", "Rotate current page");
    await edit.click();
    await expect(edit).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("dialog[open]")).toHaveCount(0);
    const target = page.getByRole("button", {
      name: "Edit text Original 123",
      exact: true,
    });
    await expect(target).toBeVisible({ timeout: 30000 });
    const originalBox = (await target.boundingBox())!;
    await target.click();
    const input = page.getByRole("textbox", {
      name: "Text inside page",
      exact: true,
    });
    await expect(input).toHaveValue("Original 123");
    await input.fill("An excessively wide replacement that should not fit");
    await page
      .getByRole("button", { name: "Save text change", exact: true })
      .click();
    await expect(page.locator(".ps-inline-native-message")).toContainText(
      "exceeds original width",
    );
    await expect(input).toBeVisible();
    await input.fill("New 123");
    await page
      .getByRole("button", { name: "Save text change", exact: true })
      .click();
    const changed = page.getByRole("button", {
      name: "Edit text New 123",
      exact: true,
    });
    await expect(changed).toBeVisible({ timeout: 30000 });
    const newBox = (await changed.boundingBox())!;
    expect(newBox.x).toBeCloseTo(originalBox.x, 0);
    expect(newBox.y).toBeCloseTo(originalBox.y, 0);
    expect(newBox.height).toBeCloseTo(originalBox.height, 0);
    await page
      .getByRole("button", { name: "Undo text edit", exact: true })
      .click();
    await expect(target).toBeVisible({ timeout: 30000 });
    await target.click();
    await input.fill("New 123");
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(input).toHaveCount(0);
    await expect(target).toBeVisible();
    await page
      .getByRole("button", { name: "Finish editing", exact: true })
      .click();
    await expect(edit).toHaveAttribute("aria-pressed", "false");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
  });

test("toolbar text editing refuses embedded Arabic replacement rather than changing its font", async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem("pdf-studio.lang", "en"));
  await page.goto("/pdf-studio/");
  await page
    .locator(".ps-upload input[type=file]")
    .setInputFiles(fixture("arabic-native-movable.pdf"));
  await expect(page.locator(".ps-paper")).toHaveAttribute("data-ready", "true");
  await page
    .getByRole("button", { name: "Edit page text", exact: true })
    .click();
  await page.locator(".ps-inline-native-targets rect").click();
  await expect(page.locator(".ps-inline-native-message")).toContainText(
    "character replacement",
  );
  await expect(
    page.getByRole("textbox", { name: "Text inside page", exact: true }),
  ).toHaveCount(0);
});

test("toolbar text edits survive PDF export with annotations and protect JSON project recovery", async ({
  page,
}) => {
  const doc = await PDFDocument.create(),
    font = await doc.embedFont(StandardFonts.Helvetica);
  doc
    .addPage([595, 842])
    .drawText("Original 123", { x: 70, y: 650, size: 22, font });
  await page.addInitScript(() => localStorage.setItem("pdf-studio.lang", "en"));
  await page.goto("/pdf-studio/");
  await page.locator(".ps-upload input[type=file]").setInputFiles({
    name: "inline-export.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from(await doc.save()),
  });
  await expect(page.locator(".ps-paper")).toHaveAttribute("data-ready", "true");
  await page.getByRole("button", { name: "Add text", exact: true }).click();
  await page.locator(".ps-interaction").click({ position: { x: 100, y: 300 } });
  await page
    .getByRole("button", { name: "Edit page text", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Edit text Original 123", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Text inside page", exact: true })
    .fill("New 123");
  await page
    .getByRole("button", { name: "Save text change", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Edit text New 123", exact: true }),
  ).toBeVisible({ timeout: 30000 });
  await expect(page.locator(".ps-interaction rect")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Save annotation project", exact: true })
    .click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "projects do not include native text edits" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Finish editing", exact: true })
    .click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export PDF", exact: true }).click();
  const bytes = new Uint8Array(
    await readFile((await (await download).path())!),
  );
  const { inspectNativeText } = await import("../src/core/nativeText");
  expect(
    (await inspectNativeText(bytes, 0)).map((item) => item.text),
  ).toContain("New 123");
  expect(
    (await inspectNativeText(bytes, 0)).map((item) => item.text),
  ).not.toContain("Original 123");
});

test("explicit rebuild replaces unsupported Arabic visually, keeps other pages, and supports undo", async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem("pdf-studio.lang", "en"));
  await page.goto("/pdf-studio/");
  const doc = await PDFDocument.load(
    await readFile(fixture("arabic-native-movable.pdf")),
  );
  const font = await doc.embedFont(StandardFonts.Helvetica);
  doc
    .addPage([595, 842])
    .drawText("Other page retained", { x: 50, y: 700, size: 20, font });
  await page.locator(".ps-upload input[type=file]").setInputFiles({
    name: "rebuild-arabic.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from(await doc.save()),
  });
  await expect(page.locator(".ps-paper")).toHaveAttribute("data-ready", "true");
  await page
    .getByRole("button", { name: "Edit page text", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Enable rebuild — broader support",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Rebuild text 1", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Rebuild replacement text", exact: true })
    .fill("جديد");
  await page
    .getByRole("spinbutton", { name: "Rebuild region w", exact: true })
    .fill("150");
  await page
    .getByRole("spinbutton", { name: "Rebuild region h", exact: true })
    .fill("55");
  await page
    .getByRole("button", { name: "Apply rebuild", exact: true })
    .click();
  await expect(
    page.getByRole("img", { name: "Rebuilt page preview", exact: true }),
  ).toBeVisible();
  page.once("dialog", (d) => d.accept());
  await page
    .getByRole("button", { name: "Confirm rebuild", exact: true })
    .click();
  await expect(page.locator(".ps-rebuild-form")).toHaveCount(0, {
    timeout: 30000,
  });
  await expect(page.locator(".ps-paper")).toHaveAttribute("data-ready", "true");
  await expect(
    page.getByRole("button", { name: "Undo text edit", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Finish editing", exact: true })
    .click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export PDF", exact: true }).click();
  const bytes = new Uint8Array(
    await readFile((await (await download).path())!),
  );
  expect((await PDFDocument.load(bytes)).getPageCount()).toBe(2);
  const { inspectNativeText } = await import("../src/core/nativeText");
  expect(await inspectNativeText(bytes, 0)).toHaveLength(0);
  expect((await inspectNativeText(bytes, 1)).map((x) => x.text)).toContain(
    "Other page retained",
  );
  await page
    .getByRole("button", { name: "Edit page text", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Undo text edit", exact: true })
    .click();
  await expect(page.locator(".ps-inline-native-targets rect")).toHaveCount(1, {
    timeout: 30000,
  });
});

test("rebuild lets a scanned page use a manual region and cancels without modifying the PDF", async ({
  page,
}) => {
  await boot(page, "arabic-scanned.pdf", "en");
  await page
    .getByRole("button", { name: "Edit page text", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Enable rebuild — broader support",
      exact: true,
    })
    .click();
  const svg = page.locator(".ps-rebuild-targets"),
    box = (await svg.boundingBox())!;
  await page.mouse.move(box.x + 60, box.y + 150);
  await page.mouse.down();
  await page.mouse.move(box.x + 260, box.y + 220);
  await page.mouse.up();
  await expect(
    page.getByRole("textbox", {
      name: "Rebuild replacement text",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Rebuild replacement text", exact: true })
    .fill("نص جديد");
  await page
    .getByRole("button", { name: "Apply rebuild", exact: true })
    .click();
  await expect(
    page.getByRole("img", { name: "Rebuilt page preview", exact: true }),
  ).toBeVisible();
  page.once("dialog", (d) => d.dismiss());
  await page
    .getByRole("button", { name: "Confirm rebuild", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Back without applying", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", {
      name: "Rebuild replacement text",
      exact: true,
    }),
  ).toHaveValue("نص جديد");
  await expect(
    page.getByRole("button", { name: "Undo text edit", exact: true }),
  ).toBeDisabled();
});

test("mobile rebuild supports touch-selected regions without horizontal overflow", async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await boot(page, "arabic-scanned.pdf", "en");
  await page
    .getByRole("button", { name: "Edit page text", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Enable rebuild — broader support",
      exact: true,
    })
    .click();
  const svg = page.locator(".ps-rebuild-targets");
  await svg.scrollIntoViewIfNeeded();
  const box = (await svg.boundingBox())!,
    client = await context.newCDPSession(page);
  const x = box.x + 40,
    y = box.y + 160;
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y }],
  });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: x + 150, y: y + 65 }],
  });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect(
    page.getByRole("textbox", {
      name: "Rebuild replacement text",
      exact: true,
    }),
  ).toBeVisible();
  expect(
    Number(
      await page
        .getByRole("spinbutton", { name: "Rebuild region w", exact: true })
        .inputValue(),
    ),
  ).toBeGreaterThan(100);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
});
