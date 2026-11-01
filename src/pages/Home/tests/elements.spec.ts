import { test, expect } from "@playwright/test";
import { toolCategories } from "../../ToolsHome/data";
const base = process.env.HOME_QA_URL || "http://localhost:3000";
async function library(page: import("@playwright/test").Page) {
  await page.goto(`${base}/video-studio.html#elements`);
  await expect(page.locator(".editor-shell")).toBeVisible();
  await expect(page.locator(".studio-elements-grid article")).toHaveCount(12);
}
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
  expect(links.has("/video-studio.html#elements")).toBeTruthy();
  await page.getByRole("button", { name: "إيقاف الحركة", exact: true }).click();
  await expect(hero).toHaveClass(/is-still/);
  await page.keyboard.press("Control+k");
  await expect(
    page.getByRole("searchbox", { name: "ابحث عن أداة أو استوديو" }),
  ).toBeFocused();
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

test("elements is an editor section with search, filters, pagination and persisted favorites", async ({
  page,
}) => {
  await library(page);
  await expect(
    page.getByRole("button", { name: "العناصر", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("button", { name: "عرض عناصر أكتر", exact: true })
    .click();
  await expect(page.locator(".studio-elements-grid article")).toHaveCount(24);
  await page.locator(".studio-element-favorite").first().click();
  await page.getByRole("button", { name: "المفضلة (1)", exact: true }).click();
  await expect(page.locator(".studio-elements-grid article")).toHaveCount(1);
  await page.reload();
  await page.getByRole("button", { name: "المفضلة (1)", exact: true }).click();
  await expect(page.locator(".studio-elements-grid article")).toHaveCount(1);
  await page.getByRole("button", { name: "المفضلة (1)", exact: true }).click();
  await page
    .getByRole("button", { name: "الجديد · 48 عنصر", exact: true })
    .click();
  await expect(page.locator(".studio-elements > small")).toContainText(
    "48 عنصر",
  );
  await page
    .getByRole("combobox", { name: "القسم", exact: true })
    .selectOption("shapes");
  await expect(page.locator(".studio-elements > small")).toContainText(
    "24 عنصر",
  );
  await page
    .getByRole("searchbox", { name: "بحث في عناصر القوالب", exact: true })
    .fill("كاميرا فيديو");
  await expect(page.locator(".studio-elements-grid article")).toHaveCount(1);
  await page
    .getByRole("searchbox", { name: "بحث في عناصر القوالب", exact: true })
    .fill("no-matching-element");
  await expect(page.locator(".studio-elements")).toContainText(
    "مفيش عناصر مطابقة",
  );
});
for (const width of [320, 390, 768, 1440])
  test(`integrated elements fits ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await library(page);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    await expect(
      page.getByText("أفكارك الكبيرة.", { exact: true }),
    ).toHaveCount(0);
  });
test("new SVG overlays insert on top and new compositions retain editable text", async ({
  page,
}) => {
  await library(page);
  await page
    .getByRole("button", { name: "الجديد · 48 عنصر", exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "القسم", exact: true })
    .selectOption("shapes");
  await page
    .getByRole("button", {
      name: "إضافة كاميرا فيديو للتايم لاين",
      exact: true,
    })
    .click();
  await expect(page.locator("#studio-inspector")).toContainText(
    "video-icon-0.svg",
  );
  await page.getByRole("button", { name: "العناصر", exact: true }).click();
  await page
    .getByRole("combobox", { name: "القسم", exact: true })
    .selectOption("kits");
  await page
    .getByRole("searchbox", { name: "بحث في عناصر القوالب", exact: true })
    .fill("شريط فيديو");
  await page
    .locator('.studio-elements-grid button[aria-label$="للتايم لاين"]')
    .first()
    .click();
  await expect(page.locator("#studio-inspector")).toBeVisible();
});
