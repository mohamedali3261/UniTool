import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs/promises";
async function open(page: Page, lang = "en") {
  await page.addInitScript(
    (lang) => localStorage.setItem("unitool-lang", lang),
    lang,
  );
  await page.goto("/text-studio/");
  await expect(
    page.getByRole("button", { name: "Download design", exact: true }),
  ).toBeEnabled();
}
async function tab(page: Page, name: string) {
  await page
    .getByRole("navigation", { name: "Text Studio sections" })
    .getByRole("button", { name, exact: true })
    .click();
}
async function save(page: Page) {
  const wait = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download design", exact: true })
    .click();
  return fs.readFile((await (await wait).path())!);
}
async function pixels(page: Page, bytes: Buffer, type = "image/png") {
  return page.evaluate(
    async ({ base64, type }) => {
      const img = new Image();
      img.src = `data:${type};base64,${base64}`;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, c.width, c.height).data;
      let visible = 0;
      for (let i = 3; i < d.length; i += 4) if (d[i]) visible++;
      return {
        width: c.width,
        height: c.height,
        corner: Array.from(d.slice(0, 4)),
        visible,
      };
    },
    { base64: bytes.toString("base64"), type },
  );
}
test("local-only rendering, live text, templates, undo/redo and text tools", async ({
  page,
}) => {
  const remote: string[] = [];
  page.on("request", (r) => {
    if (!new URL(r.url()).hostname.match(/^(localhost|127\.0\.0\.1)$/))
      remote.push(r.url());
  });
  await open(page);
  const text = page.getByLabel("Main text", { exact: true });
  await text.fill("أهلًا بالعالم\nHello UniTool");
  await expect(page.locator(".artboard")).toContainText("Hello UniTool");
  await tab(page, "Templates");
  await page.getByRole("button", { name: "Poetry", exact: true }).click();
  await expect(page.locator(".artboard svg")).toContainText("Hello UniTool");
  await expect(page.locator(".artboard svg g[font-family]")).toHaveAttribute(
    "font-family",
    "TextStudio-amiri",
  );
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.locator(".artboard svg g[font-family]")).toHaveAttribute(
    "font-family",
    "TextStudio-cairo",
  );
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await tab(page, "Text tools");
  await page
    .getByRole("button", { name: "Remove Arabic diacritics", exact: true })
    .click();
  await tab(page, "Text");
  await expect(text).toHaveValue("أهلا بالعالم\nHello UniTool");
  expect(remote).toEqual([]);
});
test("PNG has real pixels, SVG embeds fonts without external resources, transparent PNG and JPG work", async ({
  page,
}) => {
  await open(page);
  let p = await pixels(page, await save(page));
  expect(p.width).toBe(1080);
  expect(p.visible).toBe(1080 * 1080);
  await page.getByLabel("Export format", { exact: true }).selectOption("svg");
  const svg = (await save(page)).toString();
  expect(svg).toContain("data:");
  expect(svg).toContain("base64,");
  expect(svg).not.toContain("url('/assets/");
  expect(svg).toContain("كل فكرة عظيمة");
  const valid = await page.evaluate(
    (s) =>
      !new DOMParser()
        .parseFromString(s, "image/svg+xml")
        .querySelector("parsererror"),
    svg,
  );
  expect(valid).toBe(true);
  p = await pixels(page, Buffer.from(svg), "image/svg+xml");
  expect(p.visible).toBe(1080 * 1080);
  await tab(page, "Appearance");
  await page
    .getByLabel("Background type", { exact: true })
    .selectOption("transparent");
  await page.getByLabel("Decoration", { exact: true }).selectOption("none");
  await page.getByLabel("Export format", { exact: true }).selectOption("png");
  p = await pixels(page, await save(page));
  expect(p.corner[3]).toBe(0);
  expect(p.visible).toBeGreaterThan(500);
  expect(p.visible).toBeLessThan((1080 * 1080) / 2);
  await page.getByLabel("Export format", { exact: true }).selectOption("jpeg");
  p = await pixels(page, await save(page), "image/jpeg");
  expect(p.corner).toEqual([255, 255, 255, 255]);
});
test("project JSON roundtrip, unsafe imports rejected and local draft restores", async ({
  page,
}) => {
  await open(page);
  await page.getByLabel("Main text", { exact: true }).fill("تصميم محفوظ");
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save project", exact: true }).click();
  const project = await fs.readFile((await (await pending).path())!);
  expect(JSON.parse(project.toString()).design.text).toBe("تصميم محفوظ");
  await page.getByLabel("Main text", { exact: true }).fill("temporary");
  await page.locator("input[type=file]").setInputFiles({
    name: "project.json",
    mimeType: "application/json",
    buffer: project,
  });
  await expect(page.getByLabel("Main text", { exact: true })).toHaveValue(
    "تصميم محفوظ",
  );
  await expect(page.getByText("Saved locally", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Main text", { exact: true })).toHaveValue(
    "تصميم محفوظ",
  );
  await page.locator("input[type=file]").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        version: 1,
        design: { text: "<script>alert(1)</script>" },
      }),
    ),
  });
  await expect(page.getByText(/Invalid project/)).toBeVisible();
  await expect(page.getByLabel("Main text", { exact: true })).toHaveValue(
    "تصميم محفوظ",
  );
});
test("custom dimensions, actual fitting, 2x resolution and empty-state export protection", async ({
  page,
}) => {
  await open(page);
  await tab(page, "Canvas");
  await page.getByLabel("Width", { exact: true }).fill("800");
  await page.getByLabel("Width", { exact: true }).press("Tab");
  await page.getByLabel("Height", { exact: true }).fill("400");
  await page.getByLabel("Height", { exact: true }).press("Tab");
  await expect(page.locator(".artboard svg")).toHaveAttribute(
    "viewBox",
    "0 0 800 400",
  );
  await page.getByLabel("Export scale", { exact: true }).selectOption("2");
  const p = await pixels(page, await save(page));
  expect([p.width, p.height]).toEqual([1600, 800]);
  await tab(page, "Text");
  await page.getByLabel("Main text", { exact: true }).fill("");
  await expect(
    page.getByRole("button", { name: "Download design", exact: true }),
  ).toBeDisabled();
});
test("Arabic mobile layout and all sections remain usable without horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.setItem("unitool-lang", "ar"));
  await page.goto("/text-studio/");
  await expect(
    page.getByRole("heading", { name: "استوديو النصوص", exact: false }),
  ).toBeVisible();
  await page
    .getByLabel("النص الرئيسي", { exact: true })
    .fill("كلمات عربية جميلة");
  for (const name of [
    "القوالب",
    "الخطوط",
    "المظهر",
    "اللوحة",
    "أدوات النص",
    "النص",
  ])
    await page
      .getByRole("navigation", { name: "أقسام استوديو النصوص" })
      .getByRole("button", { name, exact: true })
      .click();
  await expect(
    page.getByRole("button", { name: "تحميل التصميم", exact: true }),
  ).toBeEnabled();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("clipboard copies real image bytes and plain text; clearing draft disables autosave", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await open(page);
  await page
    .getByRole("button", { name: "Copy design as image", exact: true })
    .click();
  await expect(page.getByText("Image copied.", { exact: true })).toBeVisible();
  const png = await page.evaluate(async () => {
    const items = await navigator.clipboard.read();
    const b = await items[0].getType("image/png");
    return { type: b.type, size: b.size };
  });
  expect(png.type).toBe("image/png");
  expect(png.size).toBeGreaterThan(1000);
  await page
    .getByRole("button", { name: "Copy plain text", exact: true })
    .click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
    "كل فكرة",
  );
  await page
    .getByRole("button", { name: "Remove local draft", exact: true })
    .click();
  await expect(
    page.getByLabel("Auto-save in this browser", { exact: true }),
  ).not.toBeChecked();
  expect(
    await page.evaluate(() => localStorage.getItem("unitool-text-studio-v1")),
  ).toBeNull();
});
test("undoing to the original design also updates the saved draft", async ({
  page,
}) => {
  await open(page);
  const text = page.getByLabel("Main text", { exact: true }),
    original = await text.inputValue();
  await text.fill("A saved change");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("unitool-text-studio-v1") || "{}")
            .design?.text,
      ),
    )
    .toBe("A saved change");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(text).toHaveValue(original);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("unitool-text-studio-v1") || "{}")
            .design?.text,
      ),
    )
    .toBe(original);
  await page.reload();
  await expect(text).toHaveValue(original);
});
test("storage failures are disclosed and never block project download", async ({
  page,
}) => {
  await open(page);
  await page.evaluate(() =>
    Object.defineProperty(Storage.prototype, "setItem", {
      value: () => {
        throw Error("Quota");
      },
    }),
  );
  await page.getByLabel("Main text", { exact: true }).fill("Still editable");
  await expect(
    page.getByText("Save failed; download your project.", { exact: true }),
  ).toBeVisible();
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save project", exact: true }).click();
  expect(
    JSON.parse((await fs.readFile((await (await pending).path())!)).toString())
      .design.text,
  ).toBe("Still editable");
});
test("case conversion never silently exceeds the project text limit", async ({
  page,
}) => {
  await open(page);
  await page.getByLabel("Main text", { exact: true }).fill("ß".repeat(1000));
  await tab(page, "Text tools");
  await page.getByRole("button", { name: "UPPERCASE", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Your text is unchanged");
  await tab(page, "Text");
  await expect(page.getByLabel("Main text", { exact: true })).toHaveValue(
    "ß".repeat(1000),
  );
});
test("every template exports a self-contained SVG and font embedding changes rasterized glyphs", async ({
  page,
}) => {
  await open(page);
  await page.getByLabel("Export format", { exact: true }).selectOption("svg");
  await tab(page, "Templates");
  for (const name of [
    "Editorial",
    "Poetry",
    "Neon",
    "Sunset",
    "Minimal",
    "Ink",
    "Pop",
    "Ocean",
  ]) {
    await page.getByRole("button", { name, exact: true }).click();
    const svg = (await save(page)).toString();
    expect(svg).toContain("data:");
    expect(svg).not.toContain("url('/assets/");
    expect(
      (await pixels(page, Buffer.from(svg), "image/svg+xml")).visible,
    ).toBeGreaterThan(1000);
  }
  await page.getByRole("button", { name: "Poetry", exact: true }).click();
  const svg = (await save(page)).toString();
  const changed = await page.evaluate(async (svg) => {
    async function raster(s: string) {
      const img = new Image();
      img.src =
        "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(s)));
      await img.decode();
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      return ctx.getImageData(0, 0, c.width, c.height).data;
    }
    const original = await raster(svg),
      fallback = await raster(svg.replace(/<style>[\s\S]*?<\/style>/, ""));
    let diff = 0;
    for (let i = 0; i < original.length; i += 4)
      if (original[i] !== fallback[i]) diff++;
    return diff;
  }, svg);
  expect(changed).toBeGreaterThan(1000);
});
test("homepage, all-tools entry and legacy deep link reach the new studio", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.locator('.studio-card a[href="/text-studio/"]'),
  ).toBeVisible();
  await page.goto("/app.html#textStudio");
  await expect(page).toHaveURL(/\/text-studio\//);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
