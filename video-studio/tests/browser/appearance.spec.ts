import fs from "node:fs/promises";
import { test, expect, type Page } from "@playwright/test";
const base = process.env.STUDIO_QA_URL || "http://localhost:3000";
async function savedProject(page: Page) {
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "حفظ المشروع", exact: true }).click();
  return JSON.parse(await fs.readFile((await (await pending).path())!, "utf8"))
    .project;
}
for (const mobile of [false, true])
  test(`video light/dark appearance persists on home/editor, preserves frames and project (${mobile ? "mobile" : "desktop"})`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: mobile
        ? { width: 390, height: 844 }
        : { width: 1440, height: 1000 },
      isMobile: mobile,
      hasTouch: mobile,
    });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base + "/video-studio.html");
    const toggle = page.getByTestId("video-theme-toggle");
    await expect(toggle).toHaveCount(1);
    await expect(page.locator("html")).toHaveAttribute(
      "data-video-theme",
      "light",
    );
    await toggle.click();
    await expect(page.locator("html")).toHaveAttribute(
      "data-video-theme",
      "dark",
    );
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute(
      "data-video-theme",
      "dark",
    );
    await page.getByTestId("video-theme-toggle").click();
    await expect(page.locator("html")).toHaveAttribute(
      "data-video-theme",
      "light",
    );
    await expect(page.locator('.video-site-shell')).toHaveCSS('background-color','rgb(245, 247, 244)');
    await page.screenshot({
      path: `.cache/touch-browser/video-theme-home-${mobile ? "mobile" : "desktop"}.png`,
    });
    await page.locator(".template-card").first().click();
    await expect(page.locator(".editor-shell")).toBeVisible();
    const canvas = page.locator(".canvas-stage canvas");
    await expect(canvas).toBeVisible();
    const fingerprint = () =>
      canvas.evaluate((c: HTMLCanvasElement) => {
        const bytes = c
          .getContext("2d")!
          .getImageData(0, 0, c.width, c.height).data;
        let hash = 2166136261;
        for (const b of bytes) hash = Math.imul(hash ^ b, 16777619);
        return hash >>> 0;
      });
    const original = await savedProject(page),
      before = await fingerprint();
    await toggle.click();
    await expect(page.locator("html")).toHaveAttribute(
      "data-video-theme",
      "dark",
    );
    expect(await fingerprint()).toBe(before);
    await toggle.click();
    await expect(page.locator("html")).toHaveAttribute(
      "data-video-theme",
      "light",
    );
    expect(await fingerprint()).toBe(before);
    expect(await savedProject(page)).toEqual(original);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `.cache/touch-browser/video-theme-editor-${mobile ? "mobile" : "desktop"}.png`,
    });
    expect(errors).toEqual([]);
    await context.close();
  });
test("video starts with designer preference; own preference stays independent and English labels work", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem("designcraft_theme_v1", "dark");
    localStorage.setItem("unitool-lang", "en");
  });
  await page.goto(base + "/video-studio.html");
  await expect(page.locator("html")).toHaveAttribute(
    "data-video-theme",
    "dark",
  );
  await page
    .getByRole("button", { name: "Switch to light mode", exact: true })
    .click();
  expect(
    await page.evaluate(() => localStorage.getItem("unitool.video.theme.v1")),
  ).toBe("light");
  expect(
    await page.evaluate(() => localStorage.getItem("designcraft_theme_v1")),
  ).toBe("dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute(
    "data-video-theme",
    "light",
  );
});
test("video appearance remains usable if preference writes are blocked", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const set = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) {
      if (k === "unitool.video.theme.v1")
        throw new DOMException("Blocked", "SecurityError");
      return set.call(this, k, v);
    };
  });
  await page.goto(base + "/video-studio.html");
  await page.getByTestId("video-theme-toggle").click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-video-theme",
    "dark",
  );
  await page.getByTestId("video-theme-toggle").click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-video-theme",
    "light",
  );
});
