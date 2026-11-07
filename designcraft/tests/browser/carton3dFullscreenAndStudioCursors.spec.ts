import { test, expect } from "@playwright/test";

const base = process.env.DESIGN_QA_URL || "http://localhost:3000";

test("3D carton preview supports fullscreen, immersive UI toggle, studio lighting/finishes/edges/pan, and PNG snapshot", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(base + "/designcraft.html#packaging");
  await expect(page.getByTestId("packaging-page")).toBeVisible();

  await page
    .getByRole("button", { name: "اختيار مكعب هدايا", exact: true })
    .click();
  await page
    .getByRole("button", { name: "إنشاء تصميم جديد بالقالب", exact: true })
    .click();
  await expect(page.locator("#editor-layout")).toBeVisible();

  await page
    .getByRole("button", { name: "معاينة ثلاثية الأبعاد 360°", exact: true })
    .click();

  const dialog = page.getByRole("dialog", {
    name: "معاينة العلبة ثلاثية الأبعاد",
  });
  const stage = page.getByTestId("carton-3d-stage");
  await expect(stage).toHaveAttribute("data-ready", "true", { timeout: 30000 });
  await expect(dialog).toHaveAttribute("data-fullscreen", "false");

  // Enter fullscreen via button -> fills 100% viewport
  await page.getByTestId("carton-3d-fullscreen-toggle").click();
  await expect(dialog).toHaveAttribute("data-fullscreen", "true");
  const fsBox = (await dialog.boundingBox())!;
  expect(Math.round(fsBox.width)).toBe(1280);
  expect(Math.round(fsBox.height)).toBe(800);

  // Hide controls (H) for unobstructed full-screen 3D view, then restore
  await page
    .getByRole("button", { name: "إخفاء أدوات التحكم", exact: true })
    .click();
  await expect(page.locator(".carton-3d-controls")).toHaveCount(0);
  await page
    .getByRole("button", { name: "إظهار أدوات التحكم", exact: true })
    .click();
  await expect(page.locator(".carton-3d-controls")).toHaveCount(1);

  // Escape exits fullscreen first without closing the 3D dialog
  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute("data-fullscreen", "false");

  // Rich studio controls: finishes, lighting, backdrop, edges, pan mode & snapshot
  await page
    .getByRole("combobox", { name: "خامة العلبة", exact: true })
    .selectOption("glossy");
  await page
    .getByRole("combobox", { name: "خامة العلبة", exact: true })
    .selectOption("kraft");
  await page
    .getByRole("combobox", { name: "إضاءة المعاينة", exact: true })
    .selectOption("warm");
  await expect(stage).toHaveAttribute("data-lighting", "warm");

  await page
    .getByRole("combobox", { name: "خلفية المعاينة", exact: true })
    .selectOption("dark");
  await expect(stage).toHaveAttribute("data-backdrop", "dark");

  await page
    .getByRole("button", { name: "إظهار خطوط الحواف والطي", exact: true })
    .click();
  await expect(stage).toHaveAttribute("data-edges", "true");

  await page
    .getByRole("button", { name: "وضع تحريك الكاميرا", exact: true })
    .click();
  await expect(stage).toHaveAttribute("data-mode", "pan");

  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "حفظ لقطة PNG", exact: true })
    .click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^carton-3d-.*\.png$/);

  // Escape in normal mode closes the dialog
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("solid green custom cursor and companion cursors apply to every visible element across DesignCraft studios", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(base + "/designcraft.html#packaging");
  await expect(page.getByTestId("packaging-page")).toBeVisible();

  const checkZeroMisses = async () =>
    page.evaluate(() => {
      const misses: string[] = [];
      for (const el of Array.from(document.querySelectorAll("*"))) {
        const r = el.getBoundingClientRect();
        if (r.width <= 0 || r.height <= 0) continue;
        const st = getComputedStyle(el);
        if (st.display === "none" || st.visibility === "hidden") continue;
        if (st.cursor === "none") continue;
        if (
          !st.cursor.includes("data:image/svg+xml") ||
          !st.cursor.includes("data:image/png;base64")
        ) {
          misses.push(`${el.tagName.toLowerCase()} => ${st.cursor}`);
        }
      }
      return misses;
    });

  expect(await checkZeroMisses()).toEqual([]);

  await page
    .getByRole("button", { name: "اختيار مكعب هدايا", exact: true })
    .click();
  await page
    .getByRole("button", { name: "إنشاء تصميم جديد بالقالب", exact: true })
    .click();
  await expect(page.locator("#editor-layout")).toBeVisible();
  expect(await checkZeroMisses()).toEqual([]);

  const upperCanvasCursor = await page
    .locator(".upper-canvas")
    .first()
    .evaluate((el) => getComputedStyle(el).cursor);
  expect(upperCanvasCursor).toContain("data:image/svg+xml");
  expect(upperCanvasCursor).toContain("data:image/png;base64");
});

test("designer unified navbar, compact floating delete pill, simplified properties dimensions, and smooth canvas zoom", async ({
  page,
}) => {
  const base = process.env.PREVIEW_URL || "http://127.0.0.1:4173";
  const pageErrors: string[] = [];
  page.on("pageerror", (err) => pageErrors.push(err.message));

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(base + "/designcraft.html#packaging");
  await page
    .getByRole("button", { name: "اختيار علبة مستحضرات", exact: true })
    .click();
  await page
    .getByRole("button", { name: "إنشاء تصميم جديد بالقالب", exact: true })
    .click();
  await expect(page.locator("#editor-layout")).toBeVisible();

  // 1. Unified single Designer navbar: carton/3D bar + export/file menu live together inside #editor-top-bar on a single compact row
  await expect(page.locator("#editor-design-tabs")).toHaveCount(0);
  await expect(page.locator("#editor-top-bar .carton-editor-bar")).toBeVisible();
  await expect(
    page.locator("#editor-top-bar").getByRole("button", { name: /استيراد \/ تصدير|Import \/ Export/ }),
  ).toBeVisible();
  await expect(
    page.locator("#editor-top-bar").getByRole("button", { name: "معاينة ثلاثية الأبعاد 360°" }),
  ).toBeVisible();
  const topBarBox = (await page.locator("#editor-top-bar").boundingBox())!;
  expect(topBarBox.height).toBeLessThanOrEqual(48);

  // 2. Simplified Properties artboard dimensions (rounded integers instead of long floats)
  await page.getByRole("button", { name: /إظهار الخصائص|إخفاء الخصائص/ }).click();
  const propsPanel = page.locator("#editor-properties-panel").first();
  await expect(propsPanel).toBeVisible();
  const dimBadge = await propsPanel.getByTestId("properties-canvas-dimensions").innerText();
  expect(dimBadge).toBe("801 × 771 px");
  expect(dimBadge).not.toContain(".");
  await expect(propsPanel.locator("input[type='number']").nth(0)).toHaveValue("801");
  await expect(propsPanel.locator("input[type='number']").nth(1)).toHaveValue("771");

  // 3. Compact floating canvas pill + Delete button deletes selected element
  const pill = page.locator("#floating-zoom-pill");
  const pillBox = (await pill.boundingBox())!;
  expect(pillBox.height).toBeLessThanOrEqual(38);

  const delBtn = page.getByTestId("floating-delete-btn");
  await expect(delBtn).toBeDisabled();

  // Add a text element via sidebar and delete it from the floating pill
  await page.getByRole("button", { name: /النصوص|Text/i }).first().click();
  const textForm = page.locator("form").filter({ has: page.locator("input[type='text']") }).first();
  await textForm.locator("input[type='text']").fill("عنصر تجريبي");
  await textForm.locator("button[type='submit']").click();
  await expect(delBtn).toBeEnabled();
  await delBtn.click();
  await expect(delBtn).toBeDisabled();

  // 4. Rapid wheel zoom stays smooth, responsive, and bounded (< 3200px backing store)
  const area = page.locator("#canvas-area-container");
  const areaBox = (await area.boundingBox())!;
  await page.mouse.move(areaBox.x + areaBox.width / 2, areaBox.y + areaBox.height / 2);
  const zoomBefore = await pill.innerText();
  const burstMs = await page.evaluate(
    ({ cx, cy }) => {
      const container = document.getElementById("canvas-area-container")!;
      const t0 = performance.now();
      for (let i = 0; i < 25; i++) {
        container.dispatchEvent(
          new WheelEvent("wheel", {
            deltaY: -80,
            clientX: cx,
            clientY: cy,
            bubbles: true,
            cancelable: true,
          }),
        );
      }
      return performance.now() - t0;
    },
    { cx: areaBox.x + areaBox.width / 2, cy: areaBox.y + areaBox.height / 2 },
  );
  expect(burstMs).toBeLessThan(250);
  await page.mouse.wheel(0, -90);
  await expect.poll(() => pill.innerText()).not.toBe(zoomBefore);

  // Wait for debounced backstore commit and verify backing canvas edge stays bounded
  await page.waitForTimeout(180);
  const maxCanvasEdge = await page.evaluate(() => {
    const canvases = Array.from(document.querySelectorAll("#fabric-canvas-artboard-wrapper canvas")) as HTMLCanvasElement[];
    return Math.max(...canvases.map((c) => Math.max(c.width, c.height)));
  });
  expect(maxCanvasEdge).toBeLessThanOrEqual(3200);
  expect(pageErrors).toEqual([]);
});

