import { test, expect, type Page } from "@playwright/test";
async function start(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("logo-designer-tour", "done");
    localStorage.setItem("logo-designer-lang", "en");
  });
  await page.goto("/logo-designer/");
  await expect(
    page.getByRole("heading", { name: "Make your mark." }),
  ).toBeVisible();
  await expect(page.getByRole("status").first()).toHaveText("Saved locally", {
    timeout: 15000,
  });
}
test("desktop: editable vectors, undo/redo, typography, layers, autosave and RTL", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await start(page);
  await page.getByRole("button", { name: "Add Circle", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Select Circle", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Select Circle", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await page.getByRole("button", { name: "Text", exact: true }).click();
  await page
    .getByRole("button", { name: "Add brand name", exact: true })
    .click();
  await page.getByRole("textbox", { name: "Text content" }).fill("NOVA BRAND");
  await page
    .getByRole("combobox", { name: "Font", exact: true })
    .selectOption("montserrat");
  await page
    .getByRole("spinbutton", { name: "Font size", exact: true })
    .fill("72");
  await expect(
    page.locator(".ld-artboard text").filter({ hasText: "NOVA BRAND" }),
  ).toHaveAttribute("dominant-baseline", "central");
  await page.getByRole("button", { name: "Layers", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Layer name Brand name" })
    .first()
    .fill("My editable brand");
  await page
    .getByRole("button", { name: "Show or hide My editable brand" })
    .click();
  await expect(
    page.getByRole("button", { name: "Select My editable brand" }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Show or hide My editable brand" })
    .click();
  await page
    .getByRole("textbox", { name: "Project name", exact: true })
    .fill("Test identity");
  await expect(page.getByRole("status").first()).toHaveText("Saved locally");
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Project name", exact: true }),
  ).toHaveValue("Test identity");
  await expect(
    page.locator(".ld-artboard text").filter({ hasText: "NOVA BRAND" }),
  ).toHaveCount(1);
  await page
    .getByRole("button", { name: "التبديل للعربية", exact: true })
    .click();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(
    page.getByRole("button", { name: "تصدير", exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("drag is undoable, keyboard moves and delete confirmation works", async ({
  page,
}) => {
  await start(page);
  await page.getByRole("button", { name: "Add Circle", exact: true }).click();
  const x = page.getByRole("spinbutton", { name: "X", exact: true });
  const before = await x.inputValue();
  const circle = page.getByRole("button", {
    name: "Select Circle",
    exact: true,
  });
  const r = (await circle.boundingBox())!;
  await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2);
  await page.mouse.down();
  await page.mouse.move(r.x + r.width / 2 + 45, r.y + r.height / 2 + 25, {
    steps: 8,
  });
  await page.mouse.up();
  expect(await x.inputValue()).not.toEqual(before);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(x).toHaveValue(before);
  await page.locator(".ld-canvas-heading").click();
  await page.keyboard.press("ArrowRight");
  await expect(x).toHaveValue(String(+before + 1));
  page.once("dialog", (d) => d.dismiss());
  await page.keyboard.press("Delete");
  await expect(circle).toHaveCount(1);
  page.once("dialog", (d) => d.accept());
  await page.keyboard.press("Delete");
  await expect(circle).toHaveCount(0);
});
test("PNG/SVG/JPG/PDF and ZIP are real downloads", async ({ page }) => {
  await start(page);
  await page.getByRole("button", { name: "Export", exact: true }).click();
  for (const format of ["PNG", "SVG", "JPG", "PDF"]) {
    await page.getByRole("button", { name: format, exact: true }).click();
    const dl = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Download file", exact: true })
      .click();
    const file = await dl;
    expect(file.suggestedFilename()).toMatch(
      new RegExp("\\." + format.toLowerCase() + "$"),
    );
    const path = await file.path();
    const { readFile } = await import("node:fs/promises");
    const bytes = await readFile(path!);
    expect(bytes.length).toBeGreaterThan(500);
    if (format === "PNG") expect(bytes.subarray(1, 4).toString()).toBe("PNG");
    if (format === "PDF") expect(bytes.subarray(0, 4).toString()).toBe("%PDF");
    if (format === "SVG") {
      expect(bytes.toString()).toContain("@font-face");
      expect(bytes.toString()).toContain("data:font/woff2");
    }
  }
  const dl = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download ZIP kit", exact: true })
    .click();
  const file = await dl;
  const { readFile } = await import("node:fs/promises");
  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(await readFile((await file.path())!));
  expect(Object.keys(zip.files)).toEqual(
    expect.arrayContaining([
      "logo.svg",
      "logo.png",
      "favicon.png",
      "profile.png",
      "logo-bw.svg",
      "logo-horizontal.svg",
      "logo-vertical.svg",
      "project.json",
    ]),
  );
});
test("all sections, local assistant, templates, projects and mockups", async ({
  page,
}) => {
  await start(page);
  for (const name of [
    "Templates",
    "Colors",
    "Upload",
    "Assistant",
    "Mockups",
    "Projects",
  ]) {
    await page.getByRole("button", { name, exact: true }).click();
    await expect(page.locator(".ld-section h2")).toBeVisible();
  }
  await page.getByRole("button", { name: "Assistant", exact: true }).click();
  await page.getByRole("textbox", { name: "Business name" }).fill("Future");
  await page.getByRole("button", { name: "Suggest 3 directions" }).click();
  await expect(page.locator(".ld-idea")).toHaveCount(3);
  page.once("dialog", (d) => d.accept());
  await page.locator(".ld-idea").first().click();
  await expect(
    page.locator(".ld-artboard text").filter({ hasText: "Future" }),
  ).toHaveCount(1);
  await page.getByRole("button", { name: "Mockups", exact: true }).click();
  for (const name of [
    "Business card",
    "Store sign",
    "Coffee mug",
    "T-shirt",
    "Shopping bag",
    "Product box",
    "Social cover",
  ]) {
    await page.getByRole("button", { name, exact: true }).click();
    await expect(page.locator(".ld-mockup-object > svg")).toBeVisible();
  }
  await page.getByRole("button", { name: "Projects", exact: true }).click();
  await expect(page.locator(".ld-projects article")).not.toHaveCount(0);
});
test("mobile fits viewport and tools collapse for touch canvas", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await start(page);
  await page
    .getByRole("button", { name: "Close library", exact: true })
    .click();
  await expect(page.locator(".ld-artboard")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  await page.getByRole("button", { name: "Text", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Type with character." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Close library", exact: true })
    .click();
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  await expect(page.locator(".ld-canvas-footer output")).toHaveText("110%");
  await page.getByRole("button", { name: "Fit artwork", exact: true }).click();
  await expect(page.locator(".ld-canvas-footer output")).toHaveText("100%");
});
test("upload, background removal, tracing and validated JSON round trip", async ({
  page,
}) => {
  await start(page);
  await page.getByRole("button", { name: "Upload", exact: true }).click();
  const png = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = 32;
    c.height = 32;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, 32, 32);
    ctx.fillStyle = "#1a533d";
    ctx.fillRect(8, 8, 16, 16);
    return c.toDataURL().split(",")[1];
  });
  await page
    .locator("input[type=file]")
    .setInputFiles({
      name: "mark.png",
      mimeType: "image/png",
      buffer: Buffer.from(png, "base64"),
    });
  await expect(page.getByRole("img", { name: "Image preview" })).toBeVisible();
  await page
    .getByRole("button", { name: "Remove background", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Add to canvas", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Select Uploaded image" }),
  ).toHaveCount(1);
  await page
    .getByRole("button", { name: "Trace simple vector & add", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Select Traced vector" }),
  ).toHaveCount(1);
  await page.getByRole("button", { name: "Export", exact: true }).click();
  await page.getByRole("button", { name: "JSON", exact: true }).click();
  const dl = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download file", exact: true })
    .click();
  const file = await dl;
  const { readFile } = await import("node:fs/promises");
  const bytes = await readFile((await file.path())!);
  const p = JSON.parse(bytes.toString());
  expect(p.nodes).toHaveLength(5);
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("button", { name: "Projects", exact: true }).click();
  await page
    .locator("input[type=file]")
    .setInputFiles({
      name: "project.json",
      mimeType: "application/json",
      buffer: bytes,
    });
  await expect(
    page.getByRole("button", { name: "Select Traced vector" }),
  ).toHaveCount(1);
  await page
    .locator("input[type=file]")
    .setInputFiles({
      name: "unsafe.json",
      mimeType: "application/json",
      buffer: Buffer.from(
        JSON.stringify({
          ...p,
          nodes: [
            {
              ...p.nodes[0],
              kind: "image",
              asset: "https://example.com/unsafe.png",
            },
          ],
        }),
      ),
    });
  await expect(page.getByRole("alert")).toContainText("Invalid project");
});
test("first-use tour and real pinch gesture on a touch viewport", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.goto("/logo-designer/");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "التالي", exact: true }).click();
  await page.getByRole("button", { name: "التالي", exact: true }).click();
  await page.getByRole("button", { name: "يلا نصمّم", exact: true }).click();
  await page
    .getByRole("button", { name: "إغلاق المكتبة", exact: true })
    .click();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { x: 150, y: 370 },
      { x: 220, y: 370 },
    ],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [
      { x: 100, y: 370 },
      { x: 270, y: 370 },
    ],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect(page.locator(".ld-canvas-footer output")).not.toHaveText("100%");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  await page.screenshot({ path: "test-results/logo-designer/mobile-ar.png" });
  await context.close();
});
