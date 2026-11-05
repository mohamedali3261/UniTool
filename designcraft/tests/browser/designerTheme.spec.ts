import { test, expect } from "@playwright/test";
import { saveAndWait, storedProject } from "./helpers/storage";
const base = process.env.DESIGN_QA_URL || "http://localhost:3000";
const key = "designcraft_theme_v1";
for (const mobile of [false, true])
  test(`theme toggles on every designer page and persists (${mobile ? "mobile" : "desktop"})`, async ({
    page,
  }) => {
    await page.setViewportSize(
      mobile ? { width: 390, height: 844 } : { width: 1360, height: 960 },
    );
    await page.goto(base + "/designcraft.html#packaging");
    const toggle = page.getByTestId("designer-theme-toggle");
    await expect(toggle).toHaveCount(1);
    await expect(page.locator("html")).toHaveAttribute(
      "data-dc-theme",
      "light",
    );
    await toggle.click();
    await expect(page.locator("html")).toHaveAttribute("data-dc-theme", "dark");
    await expect(page.locator(".packaging-daylight")).toHaveCount(0);
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-dc-theme", "dark");
    for (const tab of [
      "تصميم جديد",
      "مشاريعي",
      "الحفظ والتخزين",
      "تصميم العلب",
    ]) {
      await page
        .getByRole("button", { name: new RegExp("^" + tab) })
        .first()
        .click();
      await expect(toggle).toBeVisible();
      await toggle.click();
      await expect(page.locator("html")).toHaveAttribute(
        "data-dc-theme",
        "light",
      );
      expect(
        await page.evaluate(() => localStorage.getItem("designcraft_theme_v1")),
      ).toBe("light");
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await toggle.click();
    }
    await toggle.click();
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute(
      "data-dc-theme",
      "light",
    );
    await page.screenshot({
      path: `.cache/touch-browser/theme-${mobile ? "mobile" : "desktop"}.png`,
    });
  });
test("editor theme changes UI only, preserving native artwork, canvas pixels and saved design", async ({
  page,
}) => {
  await page.goto(base + "/designcraft.html");
  const project = {
    id: "theme-native",
    title: "Theme artwork QA",
    category: "custom",
    width: 320,
    height: 240,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    canvasData: {
      version: "5.3.0",
      background: "#b5234e",
      objects: [
        {
          type: "rect",
          version: "5.3.0",
          id: "unchanged-art",
          left: 35,
          top: 25,
          width: 150,
          height: 100,
          fill: "#1144dd",
          strokeWidth: 0,
          selectable: true,
          evented: true,
        },
      ],
    },
  };
  await page
    .locator("#designer-project-input")
    .setInputFiles({
      name: "theme.json",
      mimeType: "application/json",
      buffer: Buffer.from(
        JSON.stringify({ format: "unitool-designcraft", version: 1, project }),
      ),
    });
  await expect(page.locator("#editor-layout")).toBeVisible();
  await saveAndWait(page, true);
  const before = await storedProject(page, project.title),
    canvas = page.locator("canvas.lower-canvas").first();
  const pixels = () =>
    canvas.evaluate((canvas: HTMLCanvasElement) => {
      const context = canvas.getContext("2d")!,
        bytes = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let hash = 0;
      for (const b of bytes) hash = (Math.imul(hash, 31) + b) | 0;
      return hash;
    });
  const hash = await pixels();
  await page.getByTestId("designer-theme-toggle").click();
  await expect(page.locator("html")).toHaveAttribute("data-dc-theme", "dark");
  expect(await pixels()).toBe(hash);
  await page.getByTestId("designer-theme-toggle").click();
  await expect(page.locator("html")).toHaveAttribute("data-dc-theme", "light");
  expect(await pixels()).toBe(hash);
  await saveAndWait(page, true);
  const after = await storedProject(page, project.title);
  expect(after.canvasData).toEqual(before.canvasData);
  expect(after.width).toBe(before.width);
  expect(after.height).toBe(before.height);
  await page.screenshot({ path: ".cache/touch-browser/theme-editor.png" });
});
test("English toggle works even when theme preference storage is blocked", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem("unitool-lang", "en");
    const set = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "designcraft_theme_v1")
        throw new DOMException("Blocked", "SecurityError");
      return set.call(this, key, value);
    };
  });
  await page.goto(base + "/designcraft.html#projects");
  await page
    .getByRole("button", { name: "Switch to dark mode", exact: true })
    .click();
  await expect(page.locator("html")).toHaveAttribute("data-dc-theme", "dark");
  await page
    .getByRole("button", { name: "Switch to light mode", exact: true })
    .click();
  await expect(page.locator("html")).toHaveAttribute("data-dc-theme", "light");
});
