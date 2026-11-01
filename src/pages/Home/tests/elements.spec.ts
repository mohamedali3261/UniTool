import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { toolCategories, totalToolCount } from "../../ToolsHome/data";
const base = process.env.HOME_QA_URL || "http://localhost:3000";
const library = async (page: import("@playwright/test").Page) => {
  await page.goto(`${base}/elements.html`);
  await expect(page.locator(".element-card")).toHaveCount(24);
};
test("motion hero cycles through every real tool and studio and respects pause", async ({
  page,
}) => {
  await page.goto(base);
  await expect(page.locator(".home-header img")).toHaveAttribute(
    "src",
    "/UniTool_logo.png",
  );
  const hero = page.locator(".hero-motion"),
    chapters = hero.locator(".film-chapters button");
  const count = await chapters.count();
  expect(count).toBeGreaterThan(5);
  const links = new Set<string>();
  for (let i = 0; i < count; i++) {
    await chapters.nth(i).click();
    for (const href of await hero
      .locator(".film-tool")
      .evaluateAll((nodes) => nodes.map((n) => n.getAttribute("href")!)))
      links.add(href);
  }
  for (const tool of toolCategories.flatMap((c) => c.tools))
    expect(links.has(tool.href || `/app.html#${tool.id}`)).toBeTruthy();
  expect(links.has("/elements.html")).toBeTruthy();
  await page.getByRole("button", { name: "إيقاف الحركة", exact: true }).click();
  await expect(hero).toHaveClass(/is-still/);
  await page.keyboard.press("Control+k");
  await expect(
    page.getByRole("searchbox", { name: "ابحث عن أداة أو استوديو" }),
  ).toBeFocused();
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
  await page
    .locator(".element-category-grid")
    .getByRole("button", { name: /نصوص وعناوين/ })
    .click();
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
  await page.locator('input[accept=".json"]').setInputFiles({
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
test("motion hero advances automatically, but reduced motion disables autoplay", async ({
  page,
}) => {
  await page.goto(base);
  const scene = page.locator(".film-scene");
  const initial = await scene.getAttribute("data-scene");
  await expect(scene).not.toHaveAttribute("data-scene", initial!, {
    timeout: 7000,
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".hero-motion")).toHaveClass(/is-still/);
});
test("fifty new live motions really repaint and can be paused", async ({
  page,
}) => {
  await library(page);
  await page
    .getByRole("combobox", { name: "قالب المصدر" })
    .selectOption("unitool-motion");
  await expect(page.locator(".element-results-heading")).toContainText(
    "50 عنصر",
  );
  const canvas = page.locator(".element-card canvas").first();
  await canvas.scrollIntoViewIfNeeded();
  await expect(canvas).toHaveAttribute("data-live", "true");
  await expect
    .poll(() => canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL()))
    .not.toBe(await canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL()));
  await page
    .getByRole("button", { name: "إيقاف المعاينات الحية", exact: true })
    .click();
  await expect(canvas).toHaveAttribute("data-live", "false");
});
test("hero cursor clicks, opens each tool in order, then advances, with useful previews", async ({
  page,
}) => {
  await page.goto(base);
  await expect(
    page.locator('.film-preview[data-tool="excelStudio"]'),
  ).toBeVisible({ timeout: 5000 });
  await expect(page.locator(".film-preview")).toContainText("معاينة توضيحية");
  await page.screenshot({ path: ".cache/hero-open-desktop.png" });
  await expect(page.locator(".film-scene")).toHaveAttribute(
    "data-scene",
    "pdf-0",
    { timeout: 5000 },
  );
  const ids = await page
    .locator(".film-tool")
    .evaluateAll((nodes) =>
      nodes.map((n) =>
        n.getAttribute("href") === "/pdf-studio/"
          ? "pdfStudio"
          : n.getAttribute("href")!.split("#")[1],
      ),
    );
  for (const id of ids.slice(0, 3)) {
    await expect(page.locator(`.film-preview[data-tool="${id}"]`)).toBeVisible({
      timeout: 7000,
    });
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".hero-motion")).toHaveClass(/is-still/);
  const current = await page.locator(".film-preview").getAttribute("data-tool");
  await page.waitForTimeout(3700);
  await expect(page.locator(".film-preview")).toHaveAttribute(
    "data-tool",
    current!,
  );
});
