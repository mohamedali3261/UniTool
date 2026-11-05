import { test, expect, type Page } from "@playwright/test";
import { storedProjects, saveAndWait } from "./helpers/storage";
const base = process.env.DESIGN_QA_URL || "http://localhost:3000";
async function studio(page: Page) {
  await page.goto(base + "/designcraft.html#packaging");
  await expect(page.getByTestId("packaging-page")).toBeVisible();
}
test("dedicated studio supports direct URL, real preset filters, navigation history and editable canvas", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await studio(page);
  await expect(page.locator("[data-carton-preset]")).toHaveCount(28);
  await page.getByRole("button",{name:"علب المنتجات",exact:true}).click();
  await expect(page.locator("[data-carton-preset]")).toHaveCount(12);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "عريض ومسطح", exact: true }).click();
  await expect(page.locator("[data-carton-preset]")).toHaveCount(4);
  await page
    .getByRole("searchbox", { name: "بحث في قوالب العلب" })
    .fill("صابون");
  await expect(page.locator("[data-carton-preset]")).toHaveCount(1);
  await page
    .getByRole("searchbox", { name: "بحث في قوالب العلب" })
    .fill("not-found");
  await expect(page.locator("[data-carton-preset]")).toHaveCount(0);
  await page.getByRole("button", { name: "عرض الكل", exact: true }).click();
  await page
    .getByRole("button", { name: "الحفظ والتخزين", exact: true })
    .click();
  await expect(page).toHaveURL(/#storage$/);
  await page.goBack();
  await expect(page.getByTestId("packaging-page")).toBeVisible();
  await page
    .getByRole("button", { name: "اختيار مكعب هدايا", exact: true })
    .click();
  await expect(
    page.getByRole("spinbutton", {
      name: "طول العلبة بالملليمتر",
      exact: true,
    }),
  ).toHaveValue("70");
  await expect(
    page.getByRole("spinbutton", {
      name: "عرض العلبة بالملليمتر",
      exact: true,
    }),
  ).toHaveValue("70");
  await expect(
    page.getByRole("textbox", { name: "اسم المنتج", exact: true }),
  ).toHaveValue("GIFT EDITION");
  await expect(
    page.getByRole("combobox", { name: "السعة على التصميم", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "إنشاء تصميم جديد بالقالب", exact: true })
    .click();
  await expect(page.locator("#editor-layout")).toBeVisible();
  await saveAndWait(page, true);
  const project = (await storedProjects(page)).find(
    (p) => p.title === "مكعب هدايا",
  );
  expect(project.packaging.size.height).toBe(70);
  expect(project.packaging.size.depth).toBe(70);
  expect(
    project.canvasData.objects.some(
      (o: any) => o.type === "textbox" && o.text === "GIFT EDITION",
    ),
  ).toBe(true);
  expect(
    project.canvasData.objects.filter((o: any) =>
      o.id.startsWith("packaging-"),
    ),
  ).toHaveLength(13);
  await page
    .getByRole("button", { name: "معاينة ثلاثية الأبعاد 360°", exact: true })
    .click();
  const stage = page.getByTestId("carton-3d-stage");
  await expect(stage).toHaveAttribute("data-ready", "true", { timeout: 30000 });
  await expect(stage).toHaveAttribute("data-quality", "high");
  await page
    .getByRole("combobox", { name: "خامة العلبة", exact: true })
    .selectOption("satin");
  await expect(
    page.getByRole("combobox", { name: "خامة العلبة", exact: true }),
  ).toHaveValue("satin");
  await page.screenshot({
    path: ".cache/touch-browser/studio-artwork-high.png",
  });
  await page.getByRole("button", { name: "فرد القالب", exact: true }).click();
  await page
    .getByRole("combobox", { name: "جودة المعاينة", exact: true })
    .selectOption("balanced");
  await expect(stage).toHaveAttribute("data-ready", "true", { timeout: 30000 });
  await expect(stage).toHaveAttribute("data-fold", "0");
  await expect(stage).toHaveAttribute("data-quality", "balanced");
  await expect(
    page.getByRole("combobox", { name: "خامة العلبة", exact: true }),
  ).toHaveValue("satin");
  await page
    .getByRole("button", { name: "إغلاق المعاينة", exact: true })
    .click();
  await page
    .getByRole("button", { name: "العودة للشاشة الرئيسية", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "الحفظ والتخزين", exact: true })
    .click();
  const search = page.getByRole("searchbox", {
    name: "بحث في التصميمات المحفوظة",
    exact: true,
  });
  await search.fill("مكعب");
  await expect(page.getByTestId("storage-project")).toHaveCount(1);
  await page
    .getByRole("combobox", { name: "ترتيب التصميمات", exact: true })
    .selectOption("size");
  await expect(page.getByTestId("storage-project")).toContainText("مكعب هدايا");
  await search.fill("not-found");
  await expect(page.getByTestId("storage-project")).toHaveCount(0);
  await search.fill("");
  await page.screenshot({
    path: ".cache/touch-browser/storage-catalog-desktop.png",
  });
  expect(errors).toEqual([]);
});
for (const language of ["ar", "en"])
  test(`studio and storage are clean and responsive in ${language}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(
      (lang) => localStorage.setItem("unitool-lang", lang),
      language,
    );
    await studio(page);
    expect(
      await page
        .getByTestId("packaging-page")
        .evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
    await page.screenshot({
      path: `.cache/touch-browser/packaging-studio-${language}.png`,
    });
    await page.reload();
    await expect(page.getByTestId("packaging-page")).toBeVisible();
    await page
      .getByRole("button", {
        name: language === "ar" ? "الحفظ والتخزين" : "Save & storage",
        exact: true,
      })
      .click();
    await expect(page.getByTestId("storage-manager")).toBeVisible();
    expect(
      await page
        .getByTestId("storage-manager")
        .evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
    await expect(
      page.getByRole("searchbox", {
        name:
          language === "ar"
            ? "بحث في التصميمات المحفوظة"
            : "Search saved designs",
        exact: true,
      }),
    ).toBeVisible();
    await page.screenshot({
      path: `.cache/touch-browser/storage-studio-${language}.png`,
    });
  });
