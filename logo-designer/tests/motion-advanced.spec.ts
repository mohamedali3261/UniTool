import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
async function start(page: Page, lang = "en") {
  await page.addInitScript((lang) => {
    localStorage.setItem("logo-designer-tour", "done");
    localStorage.setItem("logo-designer-lang", lang);
  }, lang);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/logo-designer/");
  await expect(page.getByRole("status").first()).toHaveText(
    lang === "en" ? "Saved locally" : "محفوظ على الجهاز",
  );
}
async function logo(page: Page) {
  await page.getByRole("button", { name: "Templates", exact: true }).click();
  page.once("dialog", (d) => d.accept());
  await page
    .getByRole("button", {
      name: "Apply animated template: Soft reveal",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("region", { name: "Animated logo preview" }),
  ).toBeVisible();
}
test("layer-local drawing, Arabic-safe typing and shine use the same scrubbed preview; edits undo", async ({
  page,
}) => {
  await start(page);
  await logo(page);
  await page
    .getByLabel("Motion element", { exact: true })
    .selectOption({ label: "Orbit" });
  await page.getByLabel("Entrance", { exact: true }).selectOption("draw");
  await page.getByLabel("Entrance duration (s)", { exact: true }).fill("1");
  await page.getByLabel("Animation position", { exact: true }).fill("150");
  const graphic = page.locator(".ld-motion-screen svg[role=img]");
  await expect(graphic.locator("[data-motion-draw]")).toHaveCount(1);
  expect(await graphic.locator('[pathLength="1"]').count()).toBeGreaterThan(0);
  await page.getByLabel("Hold effect", { exact: true }).selectOption("shine");
  await page.getByLabel("Animation position", { exact: true }).fill("500");
  await expect(graphic.locator("[data-motion-shine]")).toHaveCount(1);
  await page
    .getByLabel("Motion element", { exact: true })
    .selectOption({ label: "NEXA" });
  await page.getByLabel("Entrance", { exact: true }).selectOption("type");
  await page.getByLabel("Entrance duration (s)", { exact: true }).fill("1");
  await page.getByLabel("Animation position", { exact: true }).fill("150");
  expect(await graphic.locator("text").allTextContents()).toContain("NE");
  await page.getByLabel("Animation position", { exact: true }).fill("500");
  expect(await graphic.locator("text").allTextContents()).toContain("NEXA");
  await page.getByLabel("Element start (s)", { exact: true }).fill(".4");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(
    page.getByLabel("Element start (s)", { exact: true }),
  ).toHaveValue("0");
  await page
    .getByRole("button", {
      name: "Auto-sequence: icon → name → details",
      exact: true,
    })
    .click();
  const starts = await page
    .locator(".ld-motion-track-bar")
    .evaluateAll((bars) =>
      bars.map((b) => Number(b.getAttribute("aria-valuenow"))),
    );
  expect(new Set(starts).size).toBeGreaterThan(1);
});
test("timeline drag and keyboard produce bounded timing and one undo step per gesture", async ({
  page,
}) => {
  await start(page);
  await logo(page);
  await page
    .getByLabel("Motion element", { exact: true })
    .selectOption({ label: "Orbit" });
  await page.getByLabel("Element end (s)", { exact: true }).fill("2");
  await page.getByLabel("Element start (s)", { exact: true }).fill(".2");
  const bar = page.getByRole("slider", { name: "Timing Orbit", exact: true });
  await bar.scrollIntoViewIfNeeded();
  const box = (await bar.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 50, box.y + box.height / 2, {
    steps: 8,
  });
  await page.mouse.up();
  expect(Number(await bar.getAttribute("aria-valuenow"))).toBeGreaterThan(0.2);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(
    page.getByLabel("Element start (s)", { exact: true }),
  ).toHaveValue("0.2");
  await bar.focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByLabel("Element start (s)", { exact: true }),
  ).toHaveValue("0.3");
  await page
    .getByLabel("Animation duration", { exact: true })
    .selectOption("2");
  expect(
    Number(
      await page.getByLabel("Element end (s)", { exact: true }).inputValue(),
    ),
  ).toBeLessThanOrEqual(2);
});
test("industry filters expose 18 distinct editable motion templates and preserve an entered brand", async ({
  page,
}) => {
  await start(page);
  await page.getByRole("button", { name: "Templates", exact: true }).click();
  await page.getByLabel("Template brand name", { exact: true }).fill("CUSTOM");
  await page
    .getByLabel("Motion template industry", { exact: true })
    .selectOption("fashion");
  await expect(page.locator(".ld-motion-template")).toHaveCount(3);
  expect(
    await page
      .locator(".ld-motion-template")
      .first()
      .locator("text")
      .allTextContents(),
  ).toContain("CUSTOM");
  page.once("dialog", (d) => d.accept());
  await page
    .getByRole("button", {
      name: "Apply animated template: THREAD / 01",
      exact: true,
    })
    .click();
  expect(
    await page
      .locator(".ld-motion-screen svg[role=img] text")
      .allTextContents(),
  ).toContain("CUSTOM");
  await expect(page.getByLabel("Entrance", { exact: true })).toHaveValue(
    "draw",
  );
});
test("publishing sizes, motion/color alternatives, naming and persistence retain each independent version", async ({
  page,
}) => {
  await start(page);
  await logo(page);
  await page.getByText("Motion & color alternatives", { exact: false }).click();
  await page
    .getByLabel("New version name", { exact: true })
    .fill("Experiment B");
  await page
    .getByRole("button", { name: "Create alternative", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Breathing loop", exact: false })
    .filter({ has: page.locator("strong") })
    .first()
    .click();
  await page
    .getByText("Publishing sizes & safe areas", { exact: true })
    .click();
  await page
    .getByRole("button", { name: "Story / Reel", exact: false })
    .click();
  await expect(page.locator(".ld-canvas-heading")).toContainText("1080");
  await page
    .getByRole("button", { name: "Open version: Original", exact: true })
    .click();
  await expect(page.locator(".ld-canvas-heading")).toContainText("800");
  await expect(
    page.locator(".ld-motion-presets button[aria-pressed=true] strong"),
  ).toHaveText("Soft reveal");
  await page
    .getByRole("button", { name: "Open version: Experiment B", exact: true })
    .click();
  await expect(page.locator(".ld-canvas-heading")).toContainText("1920");
  await expect(
    page.locator(".ld-motion-presets button[aria-pressed=true] strong"),
  ).toHaveText("Breathing loop");
  await page
    .getByLabel("Version name: Experiment B", { exact: true })
    .fill("My final");
  await page
    .getByLabel("Version name: Experiment B", { exact: true })
    .press("Tab");
  await expect(
    page.getByRole("button", { name: "Open version: My final", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("status").first()).toHaveText("Saved locally");
  await page.reload();
  await page.getByRole("button", { name: "Motion", exact: true }).click();
  await page.getByText("Motion & color alternatives", { exact: false }).click();
  await expect(
    page.getByRole("button", { name: "Open version: My final", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});
test("true animated WebP and repeated lightweight video downloads report exact size and duration", async ({
  page,
}, info) => {
  test.setTimeout(90000);
  await start(page);
  await logo(page);
  await page
    .getByLabel("Animation duration", { exact: true })
    .selectOption("2");
  await page
    .getByRole("button", { name: "Export GIF or video", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Animation format", { exact: true })
    .selectOption("webp");
  await dialog
    .getByLabel("Export quality", { exact: true })
    .selectOption("light");
  await expect(
    dialog.getByLabel("File specifications", { exact: true }),
  ).toContainText("256 × 192px · 2s · 10 fps");
  let download = page.waitForEvent("download");
  await dialog
    .getByRole("button", { name: "Download animated logo", exact: true })
    .click();
  let file = await download;
  expect(file.suggestedFilename()).toMatch(/\.webp$/);
  await file.saveAs(info.outputPath("animated.webp"));
  const bytes = await readFile(info.outputPath("animated.webp"));
  expect(bytes.subarray(0, 4).toString()).toBe("RIFF");
  expect(bytes.subarray(8, 12).toString()).toBe("WEBP");
  expect(bytes.includes(Buffer.from("ANIM"))).toBe(true);
  expect(bytes.includes(Buffer.from("ANMF"))).toBe(true);
  await expect(dialog.getByRole("status").last()).toHaveText(
    "Animated logo downloaded.",
  );
  await dialog
    .getByLabel("Animation format", { exact: true })
    .selectOption("video");
  await dialog
    .getByLabel("Export quality", { exact: true })
    .selectOption("light");
  await dialog
    .getByLabel("Video repeat count", { exact: true })
    .selectOption("2");
  await expect(
    dialog.getByLabel("File specifications", { exact: true }),
  ).toContainText("256 × 192px · 4s");
  download = page.waitForEvent("download");
  await dialog
    .getByRole("button", { name: "Download animated logo", exact: true })
    .click();
  file = await download;
  await file.saveAs(
    info.outputPath(`repeated.${file.suggestedFilename().split(".").pop()}`),
  );
});
for (const [width, lang] of [
  [320, "ar"],
  [1440, "en"],
] as const)
  test(`context scenes and timeline fit ${width} ${lang}`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 950 });
    await start(page, lang);
    await page
      .getByRole("button", {
        name: lang === "ar" ? "حركة" : "Motion",
        exact: true,
      })
      .click();
    if (width < 850)
      await page
        .getByRole("button", { name: "عرض المعاينة كاملة", exact: true })
        .click();
    for (const scene of ["video", "phone", "website", "canvas"]) {
      await page
        .getByLabel(lang === "ar" ? "سياق الاستخدام" : "Usage preview", {
          exact: true,
        })
        .selectOption(scene);
      await expect(page.locator(`.ld-motion-context-${scene}`)).toBeVisible();
      const rect = (await page.locator(".ld-motion-screen").boundingBox())!;
      expect(rect.height).toBeGreaterThanOrEqual(100);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({ path: info.outputPath(`${scene}.png`) });
    }
    await page
      .getByRole("button", {
        name: lang === "ar" ? "خلفية فاتحة" : "Light backdrop",
        exact: true,
      })
      .click();
    await expect(page.locator(".ld-motion-context")).toHaveClass(/is-dark/);
  });
