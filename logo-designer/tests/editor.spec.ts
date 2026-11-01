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
  await page.locator("input[type=file]").setInputFiles({
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
  await page.locator("input[type=file]").setInputFiles({
    name: "project.json",
    mimeType: "application/json",
    buffer: bytes,
  });
  await expect(
    page.getByRole("button", { name: "Select Traced vector" }),
  ).toHaveCount(1);
  await page.locator("input[type=file]").setInputFiles({
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

test("expanded library filters original marks, favorites persist, and recent tracks additions", async ({
  page,
}) => {
  await start(page);
  await page
    .getByRole("combobox", { name: "Element type", exact: true })
    .selectOption("vector");
  await expect(page.locator(".ld-library-item")).toHaveCount(28);
  await page.getByRole("searchbox", { name: "Search symbols" }).fill("North");
  await expect(page.locator(".ld-library-item")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Favorite North arrow", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Add North arrow", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Select North arrow", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Favorites", exact: true }).click();
  await expect(page.locator(".ld-library-item")).toHaveCount(1);
  await page.reload();
  await page.getByRole("button", { name: "Favorites", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Favorite North arrow", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Recent", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Add North arrow", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("searchbox", { name: "Search symbols" })
    .fill("no-matches-xyz");
  await expect(
    page.getByRole("button", { name: "Show all elements", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Show all elements", exact: true })
    .click();
  await expect(page.locator(".ld-library-item")).toHaveCount(295);
});

test("new template families preview a custom name, apply editable layers and undo", async ({
  page,
}) => {
  await start(page);
  await page.getByRole("button", { name: "Templates", exact: true }).click();
  await expect(page.locator(".ld-template-grid>button")).toHaveCount(80);
  await page
    .getByRole("textbox", { name: "Template brand name", exact: true })
    .fill("LUMEN");
  await page
    .getByRole("combobox", { name: "Layout family", exact: true })
    .selectOption("crest");
  await expect(page.locator(".ld-template-grid>button")).toHaveCount(4);
  await expect(
    page
      .locator(".ld-template-grid>button")
      .first()
      .locator("text")
      .filter({ hasText: "LUMEN" }),
  ).toHaveCount(1);
  page.once("dialog", (d) => d.accept());
  await page.locator(".ld-template-grid>button").first().click();
  await expect(
    page.locator(".ld-artboard text").filter({ hasText: "LUMEN" }),
  ).toHaveCount(1);
  await expect(page.locator(".ld-artboard [role=button]")).toHaveCount(8);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(
    page.locator(".ld-artboard text").filter({ hasText: "LUMEN" }),
  ).toHaveCount(0);
  await page
    .getByRole("combobox", { name: "Layout family", exact: true })
    .selectOption("all");
  await page
    .getByRole("searchbox", { name: "Search templates" })
    .fill("education");
  await expect(page.locator(".ld-template-grid>button")).toHaveCount(4);
  await page
    .getByRole("searchbox", { name: "Search templates" })
    .fill("nothing-xyz");
  await expect(page.locator(".ld-library .ld-empty")).toBeVisible();
});

test("multi-selection alignment is undoable and enables distribution", async ({
  page,
}) => {
  await start(page);
  await page.getByRole("button", { name: "Add Circle", exact: true }).click();
  await page.getByRole("button", { name: "Add Square", exact: true }).click();
  await page.locator(".ld-canvas-heading").click();
  await page.keyboard.press("Control+a");
  await expect(
    page.getByRole("button", { name: "Align left", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Align left", exact: true }).click();
  const locations = () =>
    page
      .locator(".ld-artboard rect[role=button]")
      .evaluateAll((nodes) =>
        nodes.map((n) => n.parentElement!.getAttribute("transform")),
      );
  const aligned = await locations();
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  expect(await locations()).not.toEqual(aligned);
  await expect(
    page.getByRole("button", { name: "Distribute horizontally", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Distribute horizontally", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Bring to front", exact: true })
    .click();
});

test("composed icons add independent parts, allow editing one part, ungroup and undo", async ({
  page,
}) => {
  await start(page);
  await page
    .getByRole("button", { name: "Editable icon combinations", exact: true })
    .click();
  await expect(page.locator(".ld-composition-grid>button")).toHaveCount(12);
  await page
    .getByRole("textbox", { name: "Your initial for shield / arrow" })
    .fill("N");
  await page
    .getByRole("button", {
      name: "Add composition Shield & initial",
      exact: true,
    })
    .click();
  await expect(page.locator(".ld-artboard rect[role=button]")).toHaveCount(6);
  await expect(
    page.getByRole("heading", { name: "Icon parts", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Part 3 · Your initial", exact: true })
    .click();
  await expect(page.locator(".ld-properties-heading small")).toHaveText(
    "1 selected",
  );
  const x = page.getByRole("spinbutton", { name: "X", exact: true });
  await x.fill("450");
  await expect(x).toHaveValue("450");
  await page
    .getByRole("button", { name: "Select whole icon", exact: true })
    .click();
  await expect(page.locator(".ld-properties-heading small")).toHaveText(
    "3 selected",
  );
  await page
    .getByRole("button", { name: "Ungroup for free editing", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Icon parts", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Icon parts", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Add composition Shield & initial",
      exact: true,
    })
    .click();
  await expect(page.locator(".ld-artboard rect[role=button]")).toHaveCount(9);
  await expect(page.locator(".ld-part-list>button")).toHaveCount(3);
});
test("compositions can be added ungrouped and searched without replacing design", async ({
  page,
}) => {
  await start(page);
  await page
    .getByRole("button", { name: "Editable icon combinations", exact: true })
    .click();
  await page
    .getByRole("searchbox", { name: "Search combinations", exact: true })
    .fill("Coffee");
  await expect(page.locator(".ld-composition-grid>button")).toHaveCount(1);
  await page
    .getByRole("checkbox", { name: "Add as an editable group", exact: true })
    .uncheck();
  await page
    .getByRole("button", { name: "Add composition Coffee & sun", exact: true })
    .click();
  await expect(page.locator(".ld-artboard rect[role=button]")).toHaveCount(6);
  await expect(
    page.getByRole("heading", { name: "Icon parts", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.locator(".ld-artboard rect[role=button]")).toHaveCount(3);
});

test("context menu supports copy, paste, cut, lock, unlock, delete and keyboard navigation", async ({
  page,
}) => {
  await start(page);
  await page.getByRole("button", { name: "Add Circle", exact: true }).click();
  const circle = () =>
    page.getByRole("button", { name: "Select Circle", exact: true });
  await circle().click({ button: "right" });
  const menu = page.getByRole("menu", { name: "Element actions" });
  await expect(menu).toBeVisible();
  await page.keyboard.press("End");
  await expect(
    page.getByRole("menuitem", { name: "Delete", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menu).toHaveCount(0);
  await circle().click({ button: "right" });
  await page.getByRole("menuitem", { name: "Copy", exact: false }).click();
  await page
    .locator(".ld-artboard")
    .click({ button: "right", position: { x: 80, y: 80 } });
  await page
    .getByRole("menuitem", { name: "Paste here", exact: false })
    .click();
  await expect(circle()).toHaveCount(2);
  await circle().last().click({ button: "right" });
  await page.getByRole("menuitem", { name: "Cut", exact: false }).click();
  await expect(circle()).toHaveCount(1);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(circle()).toHaveCount(2);
  await circle().last().click({ button: "right" });
  await page.getByRole("menuitem", { name: "Lock", exact: true }).click();
  await circle().last().click({ button: "right" });
  await expect(
    page.getByRole("menuitem", { name: "Cut", exact: false }),
  ).toBeDisabled();
  await page.getByRole("menuitem", { name: "Unlock", exact: true }).click();
  await circle().last().click({ button: "right" });
  page.once("dialog", (d) => d.accept());
  await page.getByRole("menuitem", { name: "Delete", exact: true }).click();
  await expect(circle()).toHaveCount(1);
});

test("canvas keyboard clipboard shortcuts and keyboard context menu do not affect text input", async ({
  page,
}) => {
  await start(page);
  await page.getByRole("button", { name: "Add Circle", exact: true }).click();
  const circle = page.getByRole("button", {
    name: "Select Circle",
    exact: true,
  });
  await circle.focus();
  await page.keyboard.press("Control+c");
  await page.keyboard.press("Control+v");
  await expect(circle).toHaveCount(2);
  await circle.first().focus();
  await page.keyboard.press("Shift+F10");
  await expect(page.getByRole("menu")).toBeVisible();
  await page.keyboard.press("Control+d");
  await expect(circle).toHaveCount(3);
  await expect(page.getByRole("menu")).toHaveCount(0);
  await page
    .getByRole("textbox", { name: "Project name", exact: true })
    .fill("Typing is safe");
  await page.keyboard.press("Control+a");
  await expect(page.locator(".ld-properties-heading small")).not.toHaveText(
    "6 selected",
  );
});

test("touch long press opens a bounded menu; moving or pinching cancels it", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.addInitScript(() => {
    localStorage.setItem("logo-designer-tour", "done");
    localStorage.setItem("logo-designer-lang", "en");
  });
  await page.goto("/logo-designer/");
  await page
    .getByRole("button", { name: "Close library", exact: true })
    .click();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: 350, y: 660 }],
  });
  await expect(page.getByRole("menu")).toBeVisible();
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  const box = (await page.getByRole("menu").boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(390);
  expect(box.y + box.height).toBeLessThanOrEqual(844);
  await page.getByRole("menuitem", { name: "Select all", exact: true }).tap();
  await expect(page.getByRole("menu")).toHaveCount(0);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: 200, y: 420 }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: 240, y: 450 }],
  });
  await page.waitForTimeout(650);
  await expect(page.getByRole("menu")).toHaveCount(0);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { x: 100, y: 400 },
      { x: 250, y: 400 },
    ],
  });
  await page.waitForTimeout(650);
  await expect(page.getByRole("menu")).toHaveCount(0);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await context.close();
});

test("new template edition has distinct editable layouts and new symbols are searchable", async ({
  page,
}) => {
  await start(page);
  await page.getByRole("searchbox", { name: "Search symbols" }).fill("Guitar");
  await expect(
    page.getByRole("button", { name: "Add Guitar", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Add Guitar", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Select Guitar", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Templates", exact: true }).click();
  for (const layout of [
    "archway",
    "mosaic",
    "capsule",
    "beacon",
    "signature",
  ]) {
    await page
      .getByRole("combobox", { name: "Layout family", exact: true })
      .selectOption(layout);
    await expect(page.locator(".ld-template-grid>button")).toHaveCount(4);
  }
  page.once("dialog", (d) => d.accept());
  await page.locator(".ld-template-grid>button").first().click();
  await expect(page.locator(".ld-artboard rect[role=button]")).toHaveCount(6);
});
for (const width of [320, 390, 600])
  test(`mobile dock at ${width}px keeps canvas visible and all tools accessible`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await start(page);
    const canvas = await page.locator(".ld-center").boundingBox(),
      panel = await page.locator(".ld-library").boundingBox();
    expect(canvas!.y + canvas!.height).toBeLessThanOrEqual(panel!.y + 1);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width);
    for (const name of [
      "Elements",
      "Templates",
      "Text",
      "Colors",
      "Layers",
      "Upload",
      "Assistant",
      "Mockups",
      "Projects",
      "Help",
    ]) {
      const tool = page.getByRole("button", { name, exact: true });
      await tool.scrollIntoViewIfNeeded();
      await expect(tool).toBeInViewport();
    }
    const rail = (await page.locator(".ld-rail").boundingBox())!;
    expect(rail.height).toBeLessThanOrEqual(56);
    expect(panel!.height).toBeLessThanOrEqual(211);
    expect(canvas!.height).toBeGreaterThan(panel!.height * 1.8);
    await page
      .getByRole("button", { name: "Expand tool panel", exact: true })
      .click();
    await expect(page.locator(".ld-center")).toBeHidden();
    await page
      .getByRole("button", { name: "Expand tool panel", exact: true })
      .click();
    await expect(page.locator(".ld-center")).toBeVisible();
    await page
      .getByRole("button", { name: "Toggle properties", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Close properties", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Close properties", exact: true })
      .click();
    await expect(page.locator(".ld-inspector")).toHaveCount(0);
  });

test("resizing desktop to a phone never stacks two open tool panels", async ({
  page,
}) => {
  await start(page);
  await expect(page.locator(".ld-library")).toBeVisible();
  await expect(page.locator(".ld-inspector")).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".ld-inspector")).toHaveCount(0);
  const c = (await page.locator(".ld-center").boundingBox())!,
    p = (await page.locator(".ld-library").boundingBox())!;
  expect(c.y + c.height).toBeLessThanOrEqual(p.y + 1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
});

test("closing an expanded mobile panel restores the large preview", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await start(page);
  await page
    .getByRole("button", { name: "Expand tool panel", exact: true })
    .click();
  await expect(page.locator(".ld-center")).toBeHidden();
  await page
    .getByRole("button", { name: "Close library", exact: true })
    .click();
  await expect(page.locator(".ld-center")).toBeVisible();
  expect(
    (await page.locator(".ld-center").boundingBox())!.height,
  ).toBeGreaterThan(600);
});

test("Boolean shapes and path point editing change real geometry with undo", async ({
  page,
}) => {
  await start(page);
  await page.getByRole("button", { name: "Add Circle", exact: true }).click();
  await page.getByRole("spinbutton", { name: "X", exact: true }).fill("300");
  await page.getByRole("button", { name: "Add Square", exact: true }).click();
  await page
    .getByRole("button", { name: "Select Circle", exact: true })
    .click({ position: { x: 8, y: 40 } });
  await page
    .getByRole("button", { name: "Select Square", exact: true })
    .click({ modifiers: ["Shift"], position: { x: 65, y: 40 } });
  await page.getByRole("button", { name: "Union", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Select Editable path", exact: true }),
  ).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: "Select Circle", exact: true }),
  ).toHaveCount(0);
  const editor = page.getByLabel("Path point editor");
  await expect(editor).toBeVisible();
  const path = editor.locator("path").first(),
    before = await path.getAttribute("d");
  await page
    .getByRole("spinbutton", { name: "Point X", exact: true })
    .fill("15");
  await expect(path).not.toHaveAttribute("d", before!);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(path).toHaveAttribute("d", before!);
  await page
    .getByRole("button", { name: "Add curve handles", exact: true })
    .click();
  await expect(
    page.getByRole("spinbutton", { name: "Handle out X", exact: true }),
  ).toHaveValue("12");
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Delete point", exact: true }).click();
  await expect(editor.locator("circle[role=button]")).not.toHaveCount(0);
});

test("style transfer and full screen preview preserve editable design", async ({
  page,
}) => {
  await start(page);
  await page.getByRole("button", { name: "Add Circle", exact: true }).click();
  await page.getByLabel("Quick color", { exact: true }).fill("#334455");
  await page.getByRole("button", { name: "Copy style", exact: true }).click();
  await page.getByRole("button", { name: "Add Square", exact: true }).click();
  await page.getByRole("button", { name: "Paste style", exact: true }).click();
  await expect(page.getByLabel("Quick color", { exact: true })).toHaveValue(
    "#334455",
  );
  await page
    .getByRole("button", { name: "Full screen preview", exact: true })
    .click();
  await expect(page.locator(".ld-topbar")).toBeHidden();
  await expect(page.locator(".ld-rail")).toBeHidden();
  await expect(
    page.getByRole("button", { name: "Show tools", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Show tools", exact: true }).click();
  await expect(page.locator(".ld-topbar")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Select Square", exact: true }),
  ).toBeVisible();
});

test("double click edits inside a group and double click text edits on canvas", async ({
  page,
}) => {
  await start(page);
  await page
    .getByRole("button", { name: "Editable icon combinations", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Add composition House & key", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Select House", exact: true })
    .dblclick({ position: { x: 10, y: 10 } });
  await expect(
    page.getByText("Editing inside group", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".ld-properties-heading small")).toHaveText(
    "1 selected",
  );
  await page
    .getByRole("button", { name: "Finish group editing", exact: true })
    .click();
  await expect(page.locator(".ld-properties-heading small")).toHaveText(
    "3 selected",
  );
  await page.getByRole("button", { name: "Text", exact: true }).click();
  await page
    .getByRole("button", { name: "Add brand name", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Select Brand name", exact: true })
    .last()
    .dblclick();
  await page
    .getByRole("textbox", { name: "Edit text on canvas", exact: true })
    .fill("DIRECT EDIT");
  await page.keyboard.press("Enter");
  await expect(
    page.locator(".ld-artboard text").filter({ hasText: "DIRECT EDIT" }),
  ).toHaveCount(1);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(
    page.locator(".ld-artboard text").filter({ hasText: "DIRECT EDIT" }),
  ).toHaveCount(0);
});

test("brand lab creates persistent variants, shows actual sizes and downloads a PDF guide", async ({
  page,
}) => {
  await start(page);
  await page.getByRole("button", { name: "Brand lab", exact: true }).click();
  await page.getByRole("button", { name: "Dark version", exact: true }).click();
  await expect(page.locator(".ld-variant-grid article")).toHaveCount(2);
  await page
    .getByRole("button", { name: "Light version", exact: true })
    .click();
  await page.getByRole("button", { name: "Monochrome", exact: true }).click();
  await expect(page.locator(".ld-variant-grid article")).toHaveCount(4);
  await page
    .getByRole("button", { name: "Open variant Original", exact: true })
    .click();
  const size = await page
    .getByLabel("Logo at 16px", { exact: true })
    .boundingBox();
  expect(size!.width).toBe(16);
  await page
    .getByRole("button", { name: "Test background #14221d", exact: true })
    .click();
  const dl = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download brand guide PDF", exact: true })
    .click();
  const file = await dl;
  expect(file.suggestedFilename()).toContain("brand-guide.pdf");
  const { readFile } = await import("node:fs/promises");
  expect((await readFile((await file.path())!)).subarray(0, 4).toString()).toBe(
    "%PDF",
  );
  await expect(page.getByRole("status").first()).toHaveText("Saved locally");
  await page.reload();
  await page.getByRole("button", { name: "Brand lab", exact: true }).click();
  await expect(page.locator(".ld-variant-grid article")).toHaveCount(4);
});

test("personal library saves editable selection and restores it after reload", async ({
  page,
}) => {
  await start(page);
  await page.getByRole("button", { name: "Add Circle", exact: true }).click();
  await page
    .getByRole("button", { name: "My personal library", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Saved mark name", exact: true })
    .fill("My circle");
  await page
    .getByRole("button", { name: "Save selection to my library", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Add saved mark My circle", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("status").first()).toHaveText("Saved locally");
  await page.reload();
  await page
    .getByRole("button", { name: "My personal library", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Add saved mark My circle", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Select Circle", exact: true }),
  ).toHaveCount(2);
});

test("mobile direct editing and preview mode work without losing the compact layout", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.addInitScript(() => {
    localStorage.setItem("logo-designer-tour", "done");
    localStorage.setItem("logo-designer-lang", "en");
  });
  await page.goto("/logo-designer/");
  await page.getByRole("button", { name: "Text", exact: true }).tap();
  await page.getByRole("button", { name: "Add brand name", exact: true }).tap();
  await page.getByRole("button", { name: "Close library", exact: true }).tap();
  await page
    .getByRole("button", { name: "Select Brand name", exact: true })
    .last()
    .tap();
  await page
    .getByRole("button", { name: "Select Brand name", exact: true })
    .last()
    .tap();
  await expect(
    page.getByRole("textbox", { name: "Edit text on canvas", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Edit text on canvas", exact: true })
    .fill("MOBILE MARK");
  await page.keyboard.press("Enter");
  await expect(
    page.locator(".ld-artboard text").filter({ hasText: "MOBILE MARK" }),
  ).toHaveCount(1);
  await page
    .getByRole("button", { name: "Full screen preview", exact: true })
    .tap();
  await expect(page.locator(".ld-rail")).toBeHidden();
  await page.getByRole("button", { name: "Show tools", exact: true }).tap();
  await expect(page.locator(".ld-rail")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  await context.close();
});

test("point anchors drag with one undo step and the edited SVG is downloadable", async ({
  page,
}) => {
  await start(page);
  await page.getByRole("button", { name: "Add Square", exact: true }).click();
  await page
    .getByRole("button", { name: "Convert to editable path", exact: true })
    .click();
  const editor = page.getByLabel("Path point editor"),
    path = editor.locator("path").first(),
    before = await path.getAttribute("d");
  const p = editor.getByRole("button", { name: "Point 1", exact: true });
  const box = (await p.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + 15, box.y + 18, { steps: 5 });
  await page.mouse.up();
  await expect(path).not.toHaveAttribute("d", before!);
  const edited = await path.getAttribute("d");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(path).toHaveAttribute("d", before!);
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await expect(path).toHaveAttribute("d", edited!);
  await page.getByRole("button", { name: "Export", exact: true }).click();
  await page.getByRole("button", { name: "SVG", exact: true }).click();
  const dl = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download file", exact: true })
    .click();
  const file = await dl;
  const { readFile } = await import("node:fs/promises");
  expect((await readFile((await file.path())!)).toString()).toContain(edited!);
});
