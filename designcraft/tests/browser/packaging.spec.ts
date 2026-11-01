import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs/promises";
import { PDFDocument } from "pdf-lib";
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
    ["عرض الوجه", "100"],
    ["ارتفاع العلبة", "150"],
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
    "80 × 120 × 35 mm",
  );
  await page
    .getByRole("button", { name: "مقاسات وقالب العلبة", exact: true })
    .click();
  await expect(
    page.getByRole("spinbutton", { name: "عرض الوجه بالملليمتر", exact: true }),
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
    .getByRole("spinbutton", { name: "Face width in millimetres", exact: true })
    .fill("70");
  await expect(page.getByTestId("carton-sheet-size")).toHaveText(
    "242 × 234 mm",
  );
});
