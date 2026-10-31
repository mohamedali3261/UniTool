import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { toolCategories, totalToolCount } from "../../ToolsHome/data";
const base = process.env.HOME_QA_URL || "http://localhost:3000";
const library = async (page: import("@playwright/test").Page) => {
  await page.goto(`${base}/elements.html`);
  await expect(page.locator(".element-card")).toHaveCount(24);
};
test("restored logo and workspace expose all canonical tools, studios, elements and recent tools", async ({
  page,
}) => {
  await page.goto(base);
  await expect(page.locator(".home-header img")).toHaveAttribute(
    "src",
    "/UniTool_logo.png",
  );
  const hero = page.locator(".hero-workspace");
  await expect(hero.locator(".hero-space-grid>a")).toHaveCount(6);
  await hero
    .getByRole("button", { name: `كل الأدوات ${totalToolCount}`, exact: true })
    .click();
  await expect(hero.locator(".hero-tool-result")).toHaveCount(totalToolCount);
  for (const tool of toolCategories.flatMap((c) => c.tools))
    await expect(hero.locator(`a[href="/app.html#${tool.id}"]`)).toHaveCount(1);
  await page.keyboard.press("Control+k");
  const search = hero.getByRole("searchbox");
  await expect(search).toBeFocused();
  await search.fill("ضغط الصوت");
  await expect(hero.locator(".hero-tool-result")).toHaveCount(1);
  await hero.locator(".hero-tool-result").click();
  await expect(page).toHaveURL(/app.html#compress$/);
  await page.goto(base);
  await expect(page.locator(".hero-recent a")).toHaveText("ضغط الصوت");
  await hero
    .getByRole("button", { name: "كل المساحات ✳", exact: true })
    .click();
  await search.fill("العناصر");
  await expect(hero.locator(".hero-space-grid>a")).toHaveCount(1);
  await expect(hero.locator(".hero-space-grid>a")).toHaveAttribute(
    "href",
    "/elements.html",
  );
});
test("library search, source/category filters, pagination, empty state and saved favorites", async ({
  page,
}) => {
  await library(page);
  await page.locator(".elements-load-more").click();
  await expect(page.locator(".element-card")).toHaveCount(48);
  const first = page.locator(".element-favorite").first();
  await first.click();
  await expect(first).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "المفضلة (1)", exact: true }).click();
  await expect(page.locator(".element-card")).toHaveCount(1);
  await page.reload();
  await page.getByRole("button", { name: "المفضلة (1)", exact: true }).click();
  await expect(page.locator(".element-card")).toHaveCount(1);
  await page.getByRole("button", { name: "المفضلة (1)", exact: true }).click();
  await page
    .getByRole("combobox", { name: "قالب المصدر" })
    .selectOption("nova");
  await expect(page.locator(".element-card")).toHaveCount(18);
  await page
    .getByRole("searchbox", { name: "بحث في العناصر" })
    .fill("unlikely-not-a-real-element");
  await expect(page.locator(".elements-empty")).toBeVisible();
  await page.getByRole("button", { name: "مسح الفلاتر", exact: true }).click();
  await expect(page.locator(".element-card")).toHaveCount(24);
  await page
    .locator(".element-category-grid")
    .getByRole("button", { name: /مشاهد بالكود/ })
    .click();
  await expect(page.locator(".element-card")).toHaveCount(7);
  await expect(page.locator(".element-card-info>small").first()).toContainText(
    "Interface Flow",
  );
});
test("inspector color/source, PNG/project downloads, actual editor import and Escape focus return", async ({
  page,
}) => {
  await library(page);
  const opener = page.locator(".element-inspect").first();
  await opener.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("لون العنصر").fill("#22aa88");
  await expect(dialog.locator("textarea")).toContainText("#22aa88");
  const pngPromise = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "حفظ PNG", exact: true }).click();
  const png = await pngPromise;
  const image = await readFile((await png.path())!);
  expect(image.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  const projectPromise = page.waitForEvent("download");
  await dialog
    .getByRole("button", { name: "تنزيل مشروع قابل للفتح", exact: true })
    .click();
  const download = await projectPromise;
  const json = await readFile((await download.path())!);
  const data = JSON.parse(json.toString());
  expect(data.version).toBe(1);
  expect(data.project.texts[0].color).toBe("#22aa88");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
  await page.goto(`${base}/video-studio.html`);
  await page
    .locator('input[accept=".json"]')
    .setInputFiles({
      name: "element.unitool.json",
      mimeType: "application/json",
      buffer: json,
    });
  await expect(page.locator(".editor-shell")).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "اسم المشروع", exact: true }),
  ).toHaveValue(data.project.name);
});
test("SVG original export and procedural playback/scrubbing work without page errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await library(page);
  await page
    .getByRole("combobox", { name: "قالب المصدر" })
    .selectOption("nova");
  await page
    .locator(".element-category-grid")
    .getByRole("button", { name: /خلفيات وSVG/ })
    .click();
  await page.locator(".element-inspect").first().click();
  let dialog = page.getByRole("dialog");
  await expect(dialog.getByLabel("لون العنصر")).toBeDisabled();
  const dlPromise = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "تنزيل SVG", exact: true }).click();
  const dl = await dlPromise;
  expect(
    (await readFile((await dl.path())!, "utf8")).startsWith("<svg"),
  ).toBeTruthy();
  await page.keyboard.press("Escape");
  await page.getByRole("combobox", { name: "قالب المصدر" }).selectOption("all");
  await page
    .locator(".element-category-grid")
    .getByRole("button", { name: /مشاهد بالكود/ })
    .click();
  await page.locator(".element-inspect").first().click();
  dialog = page.getByRole("dialog");
  await expect(dialog.locator("textarea")).toContainText("drawInterfaceScene");
  await dialog
    .getByRole("button", { name: "تشغيل الحركة", exact: true })
    .click();
  await expect(dialog.locator("output")).not.toHaveText("1.2s");
  await dialog.getByRole("slider").fill("4");
  await expect(dialog.locator("output")).toHaveText("4.0s");
  await expect(
    dialog.getByRole("button", { name: "تشغيل الحركة", exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
for (const width of [320, 390, 768, 1440])
  test(`elements and inspector fit ${width}px with keyboard-safe mobile navigation`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await library(page);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    await page.locator(".element-inspect").first().click();
    const dialog = page.getByRole("dialog");
    const bounds = (await dialog.boundingBox())!;
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
    expect(
      await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBeTruthy();
    await expect(
      dialog.getByRole("button", { name: "حفظ PNG", exact: true }),
    ).toBeEnabled();
    await page.keyboard.press("Escape");
    if (width < 700) {
      await page.locator(".elements-mobile-menu summary").click();
      await expect(
        page.locator('.elements-mobile-menu a[href="/video-studio.html"]'),
      ).toBeVisible();
    }
    expect(errors).toEqual([]);
    await context.close();
  });
