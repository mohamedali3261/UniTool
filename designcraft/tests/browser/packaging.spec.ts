import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs/promises";
import { PDFDocument, PDFRawStream, PDFName } from "pdf-lib";
const base = process.env.DESIGN_QA_URL || "http://localhost:3000";
async function open(page: Page) {
  await page.goto(base + "/designcraft.html");
  await page
    .getByRole("button", { name: "قوالب العلب والمقاسات", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
}
test("custom preview downloads actual physical SVG and PDF files", async ({
  page,
}) => {
  await open(page);
  await expect(page.getByTestId("carton-sheet-size")).toHaveText(
    "262 × 234 mm",
  );
  for (const [name, value] of [
    ["عرض العلبة", "100"],
    ["طول العلبة", "150"],
    ["عمق العلبة", "40"],
  ])
    await page
      .getByRole("spinbutton", { name: name + " بالملليمتر", exact: true })
      .fill(value);
  await expect(page.getByTestId("carton-sheet-size")).toHaveText(
    "312 × 274 mm",
  );
  let pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "SVG · mm", exact: true }).click();
  const svg = await fs.readFile((await (await pending).path())!, "utf8");
  expect(svg).toContain('width="312mm"');
  expect(svg).toContain('height="274mm"');
  expect(svg).toContain('id="fold"');
  pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "PDF · mm", exact: true }).click();
  const doc = await PDFDocument.load(
    await fs.readFile((await (await pending).path())!),
  );
  expect((doc.getPage(0).getWidth() * 25.4) / 72).toBeCloseTo(312, 3);
  expect((doc.getPage(0).getHeight() * 25.4) / 72).toBeCloseTo(274, 3);
});
test("native carton metadata survives reopening the designer", async ({
  page,
}) => {
  await open(page);
  await page
    .getByRole("textbox", { name: "اسم قالب العلبة", exact: true })
    .fill("علبة تجريبية");
  await page
    .getByRole("button", { name: "إنشاء تصميم جديد بالقالب", exact: true })
    .click();
  await expect(page.locator("#editor-layout")).toBeVisible();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("designcraft_saved_projects_v1")!).find(
      (p: any) => p.category === "packaging",
    ),
  );
  expect(saved.canvasData.objects).toHaveLength(13);
  expect(saved.packaging.size.width).toBe(80);
  await page.reload();
  await page.getByRole("button", { name: /مشاريعي/ }).click();
  await page
    .getByRole("heading", { name: "علبة تجريبية", exact: true })
    .click();
  await expect(page.locator(".carton-editor-bar")).toContainText(
    "120 × 80 × 35 mm",
  );
  await page
    .getByRole("button", { name: "مقاسات وقالب العلبة", exact: true })
    .click();
  await expect(
    page.getByRole("spinbutton", {
      name: "عرض العلبة بالملليمتر",
      exact: true,
    }),
  ).toHaveValue("80");
});
for (const width of [390, 768])
  test(`responsive dialog and validation at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await open(page);
    const input = page.getByRole("spinbutton", {
      name: "عمق العلبة بالملليمتر",
      exact: true,
    });
    await input.fill("0");
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "SVG · mm", exact: true }),
    ).toBeDisabled();
    await input.fill("35");
    await expect(
      page.getByRole("button", { name: "SVG · mm", exact: true }),
    ).toBeEnabled();
    expect(
      await page
        .getByRole("dialog")
        .evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "قوالب العلب والمقاسات", exact: true }),
    ).toBeFocused();
  });
test("artwork exports as physical SVG with locked native guides", async ({
  page,
}) => {
  await open(page);
  await page
    .getByRole("button", { name: "إنشاء تصميم جديد بالقالب", exact: true })
    .click();
  await expect(page.locator("#editor-layout")).toBeVisible();
  await page.getByRole("button", { name: "النصوص", exact: true }).click();
  await page.getByRole("button", { name: "عنوان رئيسي", exact: true }).click();
  await page.getByRole("button", { name: "حفظ", exact: true }).first().click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(
            localStorage.getItem("designcraft_saved_projects_v1")!,
          ).find((p: any) => p.category === "packaging").canvasData.objects
            .length,
      ),
    )
    .toBe(14);
  const objects = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("designcraft_saved_projects_v1")!).find(
        (p: any) => p.category === "packaging",
      ).canvasData.objects,
  );
  expect(objects[0].type).toBe("textbox");
  expect(
    objects
      .slice(1)
      .every((o: any) => o.lockScalingX && o.selectable === false),
  ).toBe(true);
  await page
    .getByRole("button", { name: "تصدير", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: /SVG Vector/ }).click();
  const pending = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "تحميل الصورة الآن", exact: true })
    .click();
  const svg = await fs.readFile((await (await pending).path())!, "utf8");
  expect(svg).toContain('width="262mm"');
  expect(svg).toContain('height="234mm"');
  expect(svg).toContain("<text");
  expect(svg).toContain("<path");
});
test("storage failure does not pretend a project was created", async ({
  page,
}) => {
  await open(page);
  await page.evaluate(() => {
    Storage.prototype.setItem = function () {
      throw new DOMException("Full", "QuotaExceededError");
    };
  });
  await page
    .getByRole("button", { name: "إنشاء تصميم جديد بالقالب", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText(
    "تعذر إنشاء القالب أو حفظه",
  );
  await expect(page.getByRole("dialog")).toBeVisible();
});
test("English controls retain physical units", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("unitool-lang", "en"));
  await page.goto(base + "/designcraft.html");
  await page
    .getByRole("button", { name: "Carton templates & dimensions", exact: true })
    .click();
  await page
    .getByRole("spinbutton", { name: "Box width in millimetres", exact: true })
    .fill("70");
  await expect(page.getByTestId("carton-sheet-size")).toHaveText(
    "242 × 234 mm",
  );
});
test("print downloads preserve full artwork, silhouette, DPI and actual physical size", async ({
  page,
}) => {
  await open(page);
  await page
    .getByRole("textbox", { name: "اسم قالب العلبة", exact: true })
    .fill("Print QA");
  await page
    .getByRole("button", { name: "إنشاء تصميم جديد بالقالب", exact: true })
    .click();
  await expect(page.locator("#editor-layout")).toBeVisible();
  // Native project fixture: a full-sheet background, deliberately extending beyond every cut edge.
  await page.evaluate(() => {
    const key = "designcraft_saved_projects_v1",
      items = JSON.parse(localStorage.getItem(key)!);
    const p = items.find((p: any) => p.title === "Print QA");
    p.canvasData.background = "#ef2345";
    localStorage.setItem(key, JSON.stringify(items));
  });
  await page.reload();
  await page.getByRole("button", { name: /مشاريعي/ }).click();
  await page.getByRole("heading", { name: "Print QA", exact: true }).click();
  await expect(page.locator("#editor-layout")).toBeVisible();
  await page
    .getByRole("button", { name: "تصدير للطباعة", exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "صيغة ملف الطباعة", exact: true })
    .selectOption("png");
  await page.getByRole("checkbox", { name: "تضمين خطوط القص والطي" }).uncheck();
  let pending = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "تنزيل ملف الطباعة", exact: true })
    .click();
  const png = await fs.readFile((await (await pending).path())!);
  const raster = await page.evaluate(async (base64) => {
    const image = await createImageBitmap(
      await (await fetch("data:image/png;base64," + base64)).blob(),
    );
    const c = document.createElement("canvas");
    c.width = image.width;
    c.height = image.height;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(image, 0, 0);
    const at = (x: number, y: number) =>
      Array.from(
        ctx.getImageData(
          Math.round((x * image.width) / 262),
          Math.round((y * image.height) / 234),
          1,
          1,
        ).data,
      );
    return {
      w: image.width,
      h: image.height,
      outside: at(5, 5),
      inside: at(60, 100),
      betweenFlaps: at(16, 15),
    };
  }, png.toString("base64"));
  expect(raster.w).toBe(3095);
  expect(raster.h).toBe(2764);
  expect(raster.outside[3]).toBe(0);
  expect(raster.betweenFlaps[3]).toBe(0);
  expect(raster.inside).toEqual([239, 35, 69, 255]);
  const phys = png.indexOf("pHYs");
  expect(phys).toBeGreaterThan(0);
  expect(png.readUInt32BE(phys + 4)).toBe(11811);
  await page
    .getByRole("combobox", { name: "صيغة ملف الطباعة", exact: true })
    .selectOption("svg");
  pending = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "تنزيل ملف الطباعة", exact: true })
    .click();
  const svg = await fs.readFile((await (await pending).path())!, "utf8");
  expect(svg).toContain('width="262mm"');
  expect(svg).toContain("<clipPath");
  expect(svg).toContain('clip-path="url(#');
  expect(svg).toContain('fill="#ef2345"');
  await page
    .getByRole("combobox", { name: "صيغة ملف الطباعة", exact: true })
    .selectOption("pdf");
  await page.getByRole("checkbox", { name: "تضمين خطوط القص والطي" }).check();
  pending = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "تنزيل ملف الطباعة", exact: true })
    .click();
  const pdf = await PDFDocument.load(
    await fs.readFile((await (await pending).path())!),
  );
  expect((pdf.getPage(0).getWidth() * 25.4) / 72).toBeCloseTo(262, 6);
  expect((pdf.getPage(0).getHeight() * 25.4) / 72).toBeCloseTo(234, 6);
  expect(pdf.getSubject()).toContain("300 DPI");
  expect(
    pdf.context
      .enumerateIndirectObjects()
      .some(
        ([, o]) =>
          o instanceof PDFRawStream &&
          o.dict.get(PDFName.of("Width"))?.toString() === "3095" &&
          o.dict.get(PDFName.of("Height"))?.toString() === "2764",
      ),
  ).toBe(true);
  await page
    .getByRole("combobox", { name: "صيغة ملف الطباعة", exact: true })
    .selectOption("png");
  await page
    .getByRole("combobox", { name: "دقة الطباعة", exact: true })
    .selectOption("600");
  pending = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "تنزيل ملف الطباعة", exact: true })
    .click();
  const high = await fs.readFile((await (await pending).path())!);
  expect(high.readUInt32BE(16)).toBe(6189);
  expect(high.readUInt32BE(20)).toBe(5528);
  expect(high.readUInt32BE(high.indexOf("pHYs") + 4)).toBe(23622);
});
test("perfume starter sizes remain editable and measured-bottle sizing persists", async ({
  page,
}) => {
  await open(page);
  for (const [ml, length, width, depth] of [
    [30, 95, 40, 30],
    [50, 115, 50, 35],
    [100, 140, 60, 45],
  ]) {
    await page
      .getByRole("button", { name: new RegExp(`عطر ${ml} مل`) })
      .click();
    await expect(
      page.getByRole("spinbutton", {
        name: "طول العلبة بالملليمتر",
        exact: true,
      }),
    ).toHaveValue(String(length));
    await expect(
      page.getByRole("spinbutton", {
        name: "عرض العلبة بالملليمتر",
        exact: true,
      }),
    ).toHaveValue(String(width));
    await expect(
      page.getByRole("spinbutton", {
        name: "عمق العلبة بالملليمتر",
        exact: true,
      }),
    ).toHaveValue(String(depth));
  }
  await page
    .getByText("ضبط العلبة حسب زجاجتك الفعلية", { exact: true })
    .click();
  await page
    .getByRole("spinbutton", { name: "طول الزجاجة بالغطاء · mm", exact: true })
    .fill("110");
  await page
    .getByRole("spinbutton", { name: "عرض الزجاجة · mm", exact: true })
    .fill("48");
  await page
    .getByRole("spinbutton", { name: "عمق الزجاجة · mm", exact: true })
    .fill("33");
  await page
    .getByRole("button", { name: "تطبيق المقاسات المحسوبة", exact: true })
    .click();
  await expect(
    page.getByRole("spinbutton", {
      name: "طول العلبة بالملليمتر",
      exact: true,
    }),
  ).toHaveValue("114");
  await expect(
    page.getByRole("spinbutton", {
      name: "عرض العلبة بالملليمتر",
      exact: true,
    }),
  ).toHaveValue("52");
  await expect(
    page.getByRole("spinbutton", {
      name: "عمق العلبة بالملليمتر",
      exact: true,
    }),
  ).toHaveValue("37");
  await page
    .getByRole("spinbutton", { name: "طول العلبة بالملليمتر", exact: true })
    .fill("116");
  await page
    .getByRole("button", { name: "إنشاء تصميم جديد بالقالب", exact: true })
    .click();
  await expect(page.locator("#editor-layout")).toBeVisible();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("designcraft_saved_projects_v1")!).find(
      (p: any) => p.title === "علبة عطر 100 مل",
    ),
  );
  expect(saved.packaging.size.height).toBe(116);
  expect(saved.packaging.size.width).toBe(52);
  expect(saved.packaging.size.depth).toBe(37);
});
test("designed perfume templates preview, customize and save editable artwork", async ({
  page,
}) => {
  await open(page);
  await page.getByRole("button", { name: /عطر 50 مل/ }).click();
  await expect(
    page.getByRole("button", { name: /حديقة الزمرد/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("textbox", { name: "اسم العلامة التجارية", exact: true })
    .fill("MY MAISON");
  await page
    .getByRole("textbox", { name: "اسم العطر", exact: true })
    .fill("NIGHT BLOOM");
  await page
    .getByRole("checkbox", {
      name: "منطقة أمان إرشادية 3 مم (معاينة التصميم فقط)",
      exact: true,
    })
    .check();
  await expect(page.locator(".carton-preview svg")).toContainText("MY MAISON");
  await expect(page.locator("#suggested-safe-area")).toBeAttached();
  await page.getByRole("button", { name: "القص والطي", exact: true }).click();
  await expect(page.locator(".carton-preview svg")).not.toContainText(
    "MY MAISON",
  );
  await page.getByRole("button", { name: "التصميم", exact: true }).click();
  await page
    .getByRole("button", { name: "إنشاء تصميم جديد بالقالب", exact: true })
    .click();
  await expect(page.locator("#editor-layout")).toBeVisible();
  const p = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("designcraft_saved_projects_v1")!).find(
      (p: any) => p.title === "علبة عطر 50 مل",
    ),
  );
  expect(
    p.canvasData.objects.filter((o: any) => o.id.startsWith("art-")).length,
  ).toBeGreaterThan(20);
  expect(
    p.canvasData.objects.some(
      (o: any) => o.text === "NIGHT BLOOM" && o.selectable !== false,
    ),
  ).toBe(true);
  expect(
    p.canvasData.objects.filter((o: any) => o.id.startsWith("packaging-"))
      .length,
  ).toBe(13);
  expect(
    p.canvasData.objects.some((o: any) => o.id === "suggested-safe-area"),
  ).toBe(false);
  await page
    .getByRole("button", { name: "تصدير للطباعة", exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "صيغة ملف الطباعة", exact: true })
    .selectOption("svg");
  const pending = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "تنزيل ملف الطباعة", exact: true })
    .click();
  const svg = await fs.readFile((await (await pending).path())!, "utf8");
  expect(svg).toContain("NIGHT BLOOM");
  expect(svg).toContain("MY MAISON");
  expect(svg).toContain("clipPath");
  expect(svg).toContain('width="202mm"');
});
test("reset restores a blank template without discarding existing projects", async ({
  page,
}) => {
  await open(page);
  await page.getByRole("button", { name: /عطر 30 مل/ }).click();
  await page.getByRole("button", { name: "إعادة الضبط", exact: true }).click();
  await expect(page.getByTestId("carton-sheet-size")).toHaveText(
    "262 × 234 mm",
  );
  await expect(
    page.getByRole("button", { name: /بدء بقالب فارغ/ }),
  ).toHaveAttribute("aria-pressed", "true");
});
