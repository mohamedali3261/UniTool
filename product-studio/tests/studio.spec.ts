import { expect, test } from "@playwright/test";
import fs from "node:fs/promises";
test.beforeEach(async ({ page }) => {
  await page.goto("/product-studio/");
  await expect(
    page.getByRole("heading", { name: "استوديو المنتجات" }),
  ).toBeVisible();
});
test("real WebGL, products, color, front/back and orbit render without errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await expect(page.locator(".ps-three canvas")).toBeVisible();
  for (const name of ["هودي", "حقيبة قماش", "سويت شيرت", "تيشيرت كلاسيك"]) {
    await page.getByRole("button", { name: new RegExp(name) }).click();
    await expect(
      page.getByRole("button", { name: new RegExp(name) }),
    ).toHaveAttribute("aria-pressed", "true");
  }
  await page.getByRole("button", { name: "لون #252e2a", exact: true }).click();
  await expect(page.locator(".ps-subhead code").first()).toHaveText("#252E2A");
  await page.getByRole("button", { name: "الوجه الخلفي", exact: true }).click();
  await expect(page.locator(".ps-layers")).toContainText("صفحة جديدة");
  await page
    .getByRole("button", { name: "الوجه الأمامي", exact: true })
    .click();
  await expect(page.locator(".ps-layer")).toHaveCount(2);
  const box = (await page.locator(".ps-three canvas").boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    box.x + box.width / 2 + 80,
    box.y + box.height / 2 + 20,
    { steps: 5 },
  );
  await page.mouse.up();
  expect(errors).toEqual([]);
});
test("text editing, 2D dragging, undo, lock, visibility and resizing", async ({
  page,
}) => {
  await page.getByRole("button", { name: "2D تصميم" }).click();
  await expect(page.locator(".ps-editor")).toBeVisible();
  await page.getByLabel("النص", { exact: true }).fill("HELLO\nCAIRO");
  await expect(page.getByLabel("النص", { exact: true })).toHaveValue(
    "HELLO\nCAIRO",
  );
  const x = page.getByLabel("X", { exact: true }),
    before = await x.inputValue();
  const rect = page.locator(".ps-layer-hit").first(),
    box = (await rect.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    box.x + box.width / 2 + 25,
    box.y + box.height / 2 + 20,
    { steps: 5 },
  );
  await page.mouse.up();
  await expect(x).not.toHaveValue(before);
  await page.getByTitle("تراجع Ctrl+Z").click();
  await expect(x).toHaveValue(before);
  await page
    .locator(".ps-layer")
    .last()
    .getByRole("button", { name: "قفل الطبقة" })
    .click();
  await expect(page.getByLabel("النص", { exact: true })).toBeDisabled();
  await page
    .locator(".ps-layer")
    .last()
    .getByRole("button", { name: "قفل الطبقة" })
    .click();
  await page.getByLabel("العرض", { exact: true }).fill("600");
  await expect(rect).toHaveAttribute("width", "600");
  await page
    .locator(".ps-layer")
    .last()
    .getByRole("button", { name: "إظهار أو إخفاء الطبقة" })
    .click();
  await expect(page.locator(".ps-layer-hit")).toHaveCount(1);
});
test("upload raster, duplicate, reorder and delete", async ({ page }) => {
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jC1kAAAAASUVORK5CYII=",
    "base64",
  );
  await page
    .locator('input[type=file][accept^="image/"]')
    .setInputFiles({ name: "logo.png", mimeType: "image/png", buffer: png });
  await expect(page.locator(".ps-layer")).toHaveCount(3);
  await expect(page.locator(".ps-editor image")).toHaveAttribute(
    "href",
    /^data:image/,
  );
  await page.getByTitle("تكرار", { exact: true }).click();
  await expect(page.locator(".ps-layer")).toHaveCount(4);
  await page.getByTitle("للخلف", { exact: true }).click();
  await page.getByTitle("حذف", { exact: true }).click();
  await expect(page.locator(".ps-layer")).toHaveCount(3);
});
test("PNG artwork and 3D exports have exact pixel dimensions, alpha and visible pixels", async ({
  page,
}) => {
  // DPR=2 catches accidental double-resolution renderer exports.
  await expect(page.locator(".ps-three canvas")).toBeVisible();
  await page
    .getByRole("button", { name: "تصدير التصميم", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("نوع الملف").selectOption("artwork");
  await dialog.getByLabel("الدقة بالبكسل").selectOption("1024");
  for (const [kind, size] of [
    ["artwork", 1024],
    ["mockup", 1024],
    ["artwork", 4096],
    ["mockup", 2048],
  ] as const) {
    await dialog.getByLabel("الدقة بالبكسل").selectOption(String(size));
    await dialog.getByLabel("نوع الملف").selectOption(kind);
    if (kind === "mockup") await dialog.getByLabel("خلفية شفافة").check();
    const event = page.waitForEvent("download");
    await dialog
      .getByRole("button", { name: "تنزيل PNG", exact: true })
      .click();
    const d = await event;
    const bytes = await fs.readFile((await d.path())!);
    expect(bytes.readUInt32BE(16)).toBe(size);
    expect(bytes.readUInt32BE(20)).toBe(size);
    expect(bytes.length).toBeGreaterThan(5000);
    const info = await page.evaluate(async (data) => {
      const image = new Image();
      image.src = "data:image/png;base64," + data;
      await image.decode();
      const c = document.createElement("canvas");
      c.width = c.height = 1024;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(image, 0, 0, 1024, 1024);
      const pixels = ctx.getImageData(0, 0, 1024, 1024).data;
      let opaque = 0;
      for (let i = 3; i < pixels.length; i += 4) if (pixels[i] > 128) opaque++;
      return { corner: pixels[3], opaque };
    }, bytes.toString("base64"));
    expect(info.corner).toBe(0);
    expect(info.opaque).toBeGreaterThan(1000);
  }
});
test("project save, reload, import and invalid import", async ({ page }) => {
  await page.getByLabel("اسم المشروع", { exact: true }).fill("CAIRO STUDIO");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("unitool.product-studio.v1") || "{}")
            .name,
      ),
    )
    .toBe("CAIRO STUDIO");
  await page.reload();
  await expect(page.getByLabel("اسم المشروع", { exact: true })).toHaveValue(
    "CAIRO STUDIO",
  );
  const event = page.waitForEvent("download");
  await page.getByTitle("حفظ ملف المشروع").click();
  const bytes = await fs.readFile((await (await event).path())!);
  expect(JSON.parse(bytes.toString()).name).toBe("CAIRO STUDIO");
  await page.getByLabel("اسم المشروع", { exact: true }).fill("CHANGED");
  await page
    .locator('input[type=file][accept^="application/json"]')
    .setInputFiles({
      name: "project.json",
      mimeType: "application/json",
      buffer: bytes,
    });
  await expect(page.getByLabel("اسم المشروع", { exact: true })).toHaveValue(
    "CAIRO STUDIO",
  );
  await page
    .locator('input[type=file][accept^="application/json"]')
    .setInputFiles({
      name: "bad.json",
      mimeType: "application/json",
      buffer: Buffer.from("{}"),
    });
  await expect(page.locator(".ps-toast")).toContainText("تعذر فتح المشروع");
});
test("mobile layout, English, theme and no horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "إضافة نجمة" }).click();
  await expect(page.locator(".ps-editor")).toBeVisible();
  await expect(page.locator(".ps-layer")).toHaveCount(3);
  await page.getByTitle("تغيير المظهر").click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-site-theme",
    "light",
  );
  await page
    .getByRole("button", { name: "Switch to English", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Product Studio" }),
  ).toBeVisible();
  await expect(page.locator(".ps-app")).toHaveAttribute("dir", "ltr");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("WebGL fallback keeps the 2D editor usable", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      type: string,
      ...args: any[]
    ) {
      if (type.includes("webgl")) return null;
      return original.apply(this, [type, ...args] as any);
    } as typeof original;
  });
  await page.reload();
  await expect(page.locator(".ps-webgl-error")).toContainText("لا يدعم WebGL");
  await page.getByRole("button", { name: "2D تصميم" }).click();
  await page.getByRole("button", { name: "إضافة دائرة" }).click();
  await expect(page.locator(".ps-editor")).toBeVisible();
  await expect(page.locator(".ps-layer")).toHaveCount(3);
});

test("artwork reaches the 3D surface and the back stays independent", async ({
  page,
}) => {
  const canvas = page.locator(".ps-three canvas");
  await expect(canvas).toBeVisible();
  await page.waitForTimeout(300);
  const before = await canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL());
  await page.getByRole("button", { name: "2D تصميم" }).click();
  await page.getByLabel("النص", { exact: true }).fill("A DIFFERENT DESIGN");
  await page.getByRole("button", { name: "3D معاينة" }).click();
  await expect
    .poll(() =>
      page
        .locator(".ps-three canvas")
        .evaluate((c: HTMLCanvasElement) => c.toDataURL()),
    )
    .not.toBe(before);
  await page.getByRole("button", { name: "الوجه الخلفي", exact: true }).click();
  await page.getByRole("button", { name: "كتابة", exact: true }).click();
  await page.getByLabel("النص", { exact: true }).fill("تصميم الظهر");
  await expect(page.locator(".ps-layer")).toHaveCount(1);
  await page
    .getByRole("button", { name: "الوجه الأمامي", exact: true })
    .click();
  await expect(page.locator(".ps-layer")).toHaveCount(2);
  await page.locator(".ps-layer").last().locator(".ps-layer-main").click();
  await expect(page.getByLabel("النص", { exact: true })).toHaveValue(
    "A DIFFERENT DESIGN",
  );
});

test("six print panels, sleeve design, live material controls and saved settings", async ({
  page,
}) => {
  await page.getByRole("button", { name: /^هودي/ }).click();
  await expect(page.locator(".ps-pattern-card")).toHaveCount(6);
  await page
    .getByRole("button", { name: "تصميم الكم الأيسر", exact: true })
    .click();
  await expect(page.locator(".ps-layers")).toContainText("صفحة جديدة");
  await page.getByRole("button", { name: "إضافة نجمة" }).click();
  await expect(page.locator(".ps-layer")).toHaveCount(1);
  await page.getByRole("button", { name: "3D معاينة" }).click();
  await expect(page.locator(".ps-three canvas")).toBeVisible();
  await page.getByLabel("ثنيات القماش", { exact: true }).fill("0.2");
  await page.getByLabel("زاوية الإضاءة", { exact: true }).fill("25");
  await page
    .getByLabel("وضعية الأكمام", { exact: true })
    .selectOption("relaxed");
  await expect
    .poll(() =>
      page.evaluate(() => {
        const p = JSON.parse(
          localStorage.getItem("unitool.product-studio.v1") || "{}",
        );
        return {
          wrinkles: p.appearance?.wrinkles,
          pose: p.appearance?.pose,
          angle: p.appearance?.lightAngle,
          layers: p.sides?.leftSleeve?.length,
        };
      }),
    )
    .toEqual({ wrinkles: 0.2, pose: "relaxed", angle: 25, layers: 1 });
  await page.getByRole("button", { name: "عرض مقسوم", exact: true }).click();
  await page
    .getByRole("button", { name: "تصميم الكابيشون الأيمن", exact: true })
    .click();
  await expect(page.locator(".ps-layer")).toHaveCount(0);
  await page
    .getByRole("button", { name: "تصميم الكم الأيسر", exact: true })
    .click();
  await expect(page.locator(".ps-layer")).toHaveCount(1);
});

test("dragging artwork on the layout moves it in the shared 2D document", async ({
  page,
}) => {
  const panel = page.locator(".ps-pattern-card.active");
  await panel.scrollIntoViewIfNeeded();
  const rect = panel.locator("rect").first(),
    box = (await rect.boundingBox())!;
  const before = await page.getByLabel("X", { exact: true }).inputValue();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    box.x + box.width / 2 + 12,
    box.y + box.height / 2 + 8,
    { steps: 3 },
  );
  await page.mouse.up();
  await expect(page.getByLabel("X", { exact: true })).not.toHaveValue(before);
  await page.getByTitle("تراجع Ctrl+Z").click();
  await expect(page.getByLabel("X", { exact: true })).toHaveValue(before);
});

test("on-person photo preserves the model, colors the shirt, compares original and exports a clean portrait", async ({
  page,
}) => {
  await page.getByRole("button", { name: "على شخص 2D", exact: true }).click();
  const image = page.locator(".ps-tryon-preview image");
  await expect(image).toHaveAttribute("href", /^data:image\/jpeg/);
  const after = await image.getAttribute("href");
  await page.getByRole("button", { name: "قبل / بعد", exact: true }).click();
  await expect.poll(() => image.getAttribute("href")).not.toBe(after);
  const original = await image.getAttribute("href");
  await page.getByRole("button", { name: "قبل / بعد", exact: true }).click();
  await expect.poll(() => image.getAttribute("href")).not.toBe(original);
  await expect(
    page.getByRole("button", { name: "عارضة 02", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "عارض 01", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "عارض 01", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("unitool.product-studio.v1") || "{}")
            .tryOn?.source,
      ),
    )
    .toBe("man");
  await page
    .getByRole("button", { name: "تصدير التصميم", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByLabel("نوع الملف")).toHaveValue("person");
  await dialog.getByLabel("الدقة بالبكسل").selectOption("1024");
  const event = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "تنزيل PNG", exact: true }).click();
  const bytes = await fs.readFile((await (await event).path())!);
  expect(bytes.readUInt32BE(16)).toBe(768);
  expect(bytes.readUInt32BE(20)).toBe(1024);
  expect(bytes.length).toBeGreaterThan(100000);
  // Final output contains photograph + print, not SVG controls or guide handles.
  const pixels = await page.evaluate(async (data) => {
    const im = new Image();
    im.src = "data:image/png;base64," + data;
    await im.decode();
    const c = document.createElement("canvas");
    c.width = 768;
    c.height = 1024;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(im, 0, 0);
    return {
      corner: [...ctx.getImageData(0, 0, 1, 1).data],
      center: [...ctx.getImageData(380, 500, 1, 1).data],
    };
  }, bytes.toString("base64"));
  expect(pixels.corner[3]).toBe(255);
  expect(pixels.center).not.toEqual(pixels.corner);
});

test("photo calibration can be dragged, undone and restored with a custom uploaded photo", async ({
  page,
}) => {
  await page.getByRole("button", { name: "على شخص 2D", exact: true }).click();
  await expect(page.locator(".ps-tryon-preview image")).toHaveAttribute(
    "href",
    /^data:/,
  );
  const corner = page.locator(".ps-tryon-preview circle").first(),
    box = (await corner.boundingBox())!;
  const original = await corner.getAttribute("cx");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    box.x + box.width / 2 + 12,
    box.y + box.height / 2 + 6,
    { steps: 3 },
  );
  await page.mouse.up();
  await expect(corner).not.toHaveAttribute("cx", original!);
  await page.getByTitle("تراجع Ctrl+Z").click();
  await expect(corner).toHaveAttribute("cx", original!);
  await page
    .locator(".ps-tryon input[type=file]")
    .setInputFiles("product-studio/assets/model-man.jpg");
  await expect(
    page.getByLabel("تعديل حدود تلوين الملابس", { exact: true }),
  ).toBeChecked();
  await expect(page.locator(".ps-tryon-preview circle")).toHaveCount(19);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("unitool.product-studio.v1") || "{}")
            .tryOn?.source,
      ),
    )
    .toBe("custom");
  await page.getByLabel("تعديل حدود تلوين الملابس", { exact: true }).uncheck();
  await page.getByRole("button", { name: "تكبير الرسم", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(page.locator(".ps-tryon-preview")).toBeVisible();
});

test("camera presets, oversized fit, material presets and copying the opposite panel work", async ({
  page,
}) => {
  await page
    .getByLabel("قصة القطعة", { exact: true })
    .selectOption("oversized");
  await page.getByRole("button", { name: "قطن ثقيل", exact: true }).click();
  await page
    .getByLabel("زاوية التصوير", { exact: true })
    .selectOption("quarter");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("unitool.product-studio.v1") || "{}")
            .appearance?.fit,
      ),
    )
    .toBe("oversized");
  await page
    .getByRole("button", { name: "نسخ التصميم للجزء المقابل", exact: true })
    .click();
  await page.getByRole("button", { name: "الوجه الخلفي", exact: true }).click();
  await expect(page.locator(".ps-layer")).toHaveCount(2);
  await page.getByRole("button", { name: "2D تصميم" }).click();
  await expect(page.locator(".ps-editor image")).toHaveAttribute(
    "href",
    /^data:image/,
  );
});

test("desktop starts in side-by-side split view, can zoom the layout, and toggle staging", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(
    page.getByRole("button", { name: "عرض مقسوم", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  const pattern = (await page.locator(".ps-pattern-desk").boundingBox())!,
    stage = (await page.locator(".ps-stage").boundingBox())!,
    tools = (await page.locator(".ps-tools").boundingBox())!;
  expect(pattern.x + pattern.width).toBeLessThanOrEqual(stage.x + 2);
  expect(stage.x + stage.width).toBeLessThanOrEqual(tools.x + 2);
  expect(Math.abs(pattern.y - stage.y)).toBeLessThan(55);
  expect(stage.height).toBeGreaterThan(500);
  await page
    .getByRole("button", { name: "تكبير الخريطة", exact: true })
    .click();
  await expect(page.locator(".ps-pattern-controls output")).toHaveText("120%");
  await page.getByRole("button", { name: "احتواء", exact: true }).click();
  await expect(page.locator(".ps-pattern-controls output")).toHaveText("100%");
  await page
    .getByRole("button", { name: "الخامة والمشهد", exact: true })
    .click();
  await expect(
    page.getByLabel("عرض القطعة على شماعة", { exact: true }),
  ).toHaveCount(0);
  await page
    .getByLabel("خلفية الاستوديو", { exact: true })
    .selectOption("solid");
  await expect
    .poll(() =>
      page.evaluate(() => {
        const p = JSON.parse(
          localStorage.getItem("unitool.product-studio.v1") || "{}",
        );
        return {
          hanger: p.appearance?.hanger,
          backdrop: p.appearance?.backdrop,
        };
      }),
    )
    .toEqual({ hanger: false, backdrop: "solid" });
  await page.getByRole("button", { name: "3D معاينة", exact: true }).click();
  await expect(page.locator(".ps-pattern-desk")).toHaveCount(0);
  await expect(page.locator(".ps-three canvas")).toBeVisible();
  await page.getByRole("button", { name: "عرض مقسوم", exact: true }).click();
  await expect(page.locator(".ps-pattern-desk")).toBeVisible();
});

test("focus workspace enlarges the canvas and can restore site navigation", async ({
  page,
}) => {
  const before = (await page.locator(".ps-workspace").boundingBox())!;
  await page.getByTitle("وضع التركيز", { exact: true }).click();
  await expect(page.locator(".ut-site-nav")).toBeHidden();
  const after = (await page.locator(".ps-workspace").boundingBox())!;
  expect(after.height).toBeGreaterThan(before.height);
  await page.getByTitle("وضع التركيز", { exact: true }).click();
  await expect(page.locator(".ut-site-nav")).toBeVisible();
});

test("selecting artwork reveals its contextual inspector and corner resizing persists", async ({
  page,
}) => {
  const rect = page
    .locator(".ps-pattern-card.active rect[data-layer-id]")
    .first();
  await rect.click({ force: true });
  await expect(
    page.getByRole("heading", { name: "العنصر المحدد", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("النص", { exact: true })).toBeVisible();
  const size = page.getByLabel("حجم العنصر", { exact: true });
  await size.fill("600");
  await expect(size).toHaveValue("600");
  const handle = page.getByLabel("تغيير الحجم 1 1", { exact: true });
  const box = (await handle.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    box.x + box.width / 2 + 12,
    box.y + box.height / 2 + 5,
    { steps: 5 },
  );
  await page.mouse.up();
  expect(Number(await size.inputValue())).toBeGreaterThan(600);
  await expect(
    page.getByLabel("عرض القطعة على شماعة", { exact: true }),
  ).toHaveCount(0);
});

test("advanced text transforms, placements, font embedding and double click editing", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.getByRole("button", { name: "2D تصميم", exact: true }).click();
  await page.locator(".ps-layer-hit").first().dblclick();
  await expect(page.getByLabel("النص", { exact: true })).toBeFocused();
  await page.getByRole("button", { name: "شعار صغير", exact: true }).click();
  await expect(page.getByLabel("العرض", { exact: true })).toHaveValue("200");
  await page.getByLabel("حدود النص", { exact: true }).fill("5");
  await page.getByLabel("ظل النص", { exact: true }).fill("10");
  await page.getByLabel("انحناء النص", { exact: true }).fill("35");
  await page.getByRole("button", { name: "قلب أفقي", exact: true }).click();
  await page
    .getByLabel("رفع خط", { exact: true })
    .setInputFiles("excel-studio/assets/cairo-arabic-400-normal.woff2");
  await expect(
    page.getByLabel("الخط", { exact: true }).locator("option"),
  ).toHaveCount(5);
  const font =
    (await page
      .getByLabel("الخط", { exact: true })
      .locator("option")
      .last()
      .getAttribute("value")) ??
    (await page
      .getByLabel("الخط", { exact: true })
      .locator("option")
      .last()
      .textContent());
  await page.getByLabel("الخط", { exact: true }).selectOption(font!);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("unitool.product-studio.v1") || "{}")
            .fonts?.length,
      ),
    )
    .toBe(1);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("unitool.product-studio.v1") || "{}")
            .sides?.front?.[0]?.font,
      ),
    )
    .toBe(font!);
  await page.reload();
  await page
    .getByRole("button", { name: "2D تصميم", exact: true })
    .click({ timeout: 60000 });
  await expect(page.getByLabel("حدود النص", { exact: true })).toHaveValue("5");
  await expect(page.getByLabel("الخط", { exact: true })).toHaveValue(font!);
  await expect(
    page.locator('.ps-editor [aria-label^="تغيير الحجم"]'),
  ).toHaveCount(4);
  const handle = page
    .locator(".ps-editor")
    .getByLabel("مقبض الدوران", { exact: true });
  const box = (await handle.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + 50, box.y + 25, { steps: 5 });
  await page.mouse.up();
  await expect(page.getByLabel("الدوران", { exact: true })).not.toHaveValue(
    "0",
  );
});

test("local image removal, crop and adjustments render and survive undo", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "رفع صورة", exact: true })
    .count()
    .catch(() => 0);
  const result = await page.evaluate(async () => {
    const { editImage } = await import(
      String("/product-studio/core/imageTools.ts")
    );
    const { drawArtwork } = await import(
      String("/product-studio/core/artwork.ts")
    );
    const { layer } = await import(String("/product-studio/core/model.ts"));
    const c = document.createElement("canvas");
    c.width = c.height = 40;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, 40, 40);
    ctx.fillStyle = "#ff0000";
    ctx.fillRect(10, 10, 20, 20);
    const src = await editImage(c.toDataURL(), true);
    const l = layer("image", { src, x: 0, y: 0, w: 1024, h: 1024 });
    const out = await drawArtwork([l], 40);
    const data = out.getContext("2d")!;
    const before = Array.from(data.getImageData(20, 20, 1, 1).data);
    const corner = Array.from(data.getImageData(0, 0, 1, 1).data);
    const dark = await drawArtwork([{ ...l, brightness: 0 }], 40);
    return {
      before,
      corner,
      dark: Array.from(dark.getContext("2d")!.getImageData(20, 20, 1, 1).data),
    };
  });
  expect(result.corner[3]).toBe(0);
  expect(result.before[0]).toBe(255);
  expect(result.before[3]).toBe(255);
  expect(result.dark[0]).toBe(0);
  await page
    .locator('.ps-tools input[type=file][accept^="image/"]')
    .setInputFiles("product-studio/assets/model-man.jpg");
  await page.getByLabel("سطوع الصورة", { exact: true }).fill("130");
  await page.getByLabel("Crop w", { exact: true }).fill("80");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(
            localStorage.getItem("unitool.product-studio.v1") || "{}",
          ).sides?.front?.at(-1)?.crop?.w,
      ),
    )
    .toBe(0.8);
  await page
    .getByRole("button", { name: "إعادة ضبط الصورة", exact: true })
    .click();
  await expect(page.getByLabel("سطوع الصورة", { exact: true })).toHaveValue(
    "100",
  );
  await page.getByTitle("تراجع Ctrl+Z").click();
  await expect(page.getByLabel("سطوع الصورة", { exact: true })).toHaveValue(
    "130",
  );
});

test("print dimensions produce transparent exact-size panel export", async ({
  page,
}) => {
  await page.getByLabel("تحديد مساحة الطباعة الفعلية", { exact: true }).check();
  await page.getByLabel("Print width", { exact: true }).fill("10");
  await page.getByLabel("Print height", { exact: true }).fill("15");
  await page.getByLabel("Print dpi", { exact: true }).fill("100");
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "تصدير الأجزاء PNG شفافة", exact: true })
    .click();
  const d = await download;
  const data = await fs.readFile((await d.path())!);
  expect(data.readUInt32BE(16)).toBe(394);
  expect(data.readUInt32BE(20)).toBe(591);
  await page.getByRole("button", { name: "2D تصميم", exact: true }).click();
  await expect(page.locator('.ps-editor rect[stroke="#ffe4a5"]')).toBeVisible();
});

test("project library snapshots and color variants persist after reload", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "حفظ نسخة بالمكتبة", exact: true })
    .click();
  await expect(page.locator(".ps-library-grid article")).toHaveCount(1);
  await page
    .getByRole("button", { name: "نسخة بلون آخر", exact: true })
    .click();
  await expect(page.locator(".ps-library-grid article")).toHaveCount(2, {
    timeout: 30000,
  });
  await page.reload();
  await expect(page.locator(".ps-library-grid article")).toHaveCount(2, {
    timeout: 30000,
  });
  await page
    .locator(".ps-library-grid article")
    .last()
    .locator("button")
    .first()
    .click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("unitool.product-studio.v1") || "{}")
            .color,
      ),
    )
    .toBe("#496c50");
});

function fixtureGlb() {
  const positions = new Float32Array([-0.8, -1.2, 0, 0.8, -1.2, 0, 0, 1.2, 0]),
    uv = new Float32Array([0, 0, 1, 0, 0.5, 1]);
  const bin = Buffer.concat([
    Buffer.from(positions.buffer),
    Buffer.from(uv.buffer),
  ]);
  const json = {
    asset: { version: "2.0" },
    scene: 0,
    scenes: [{ nodes: [0, 1] }],
    nodes: [
      { name: "front", mesh: 0, translation: [0, 0, 0.1] },
      {
        name: "back",
        mesh: 0,
        translation: [0, 0, -0.1],
        rotation: [0, 1, 0, 0],
      },
    ],
    meshes: [{ primitives: [{ attributes: { POSITION: 0, TEXCOORD_0: 1 } }] }],
    buffers: [{ byteLength: bin.length }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: 36 },
      { buffer: 0, byteOffset: 36, byteLength: 24 },
    ],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: 3,
        type: "VEC3",
        min: [-0.8, -1.2, 0],
        max: [0.8, 1.2, 0],
      },
      { bufferView: 1, componentType: 5126, count: 3, type: "VEC2" },
    ],
  };
  const text = Buffer.from(JSON.stringify(json));
  const padded = Buffer.alloc(Math.ceil(text.length / 4) * 4, 32);
  text.copy(padded);
  const out = Buffer.alloc(12 + 8 + padded.length + 8 + bin.length);
  out.writeUInt32LE(0x46546c67, 0);
  out.writeUInt32LE(2, 4);
  out.writeUInt32LE(out.length, 8);
  out.writeUInt32LE(padded.length, 12);
  out.writeUInt32LE(0x4e4f534a, 16);
  padded.copy(out, 20);
  const o = 20 + padded.length;
  out.writeUInt32LE(bin.length, o);
  out.writeUInt32LE(0x004e4942, o + 4);
  bin.copy(out, o + 8);
  return out;
}
test("self-contained UV GLB imports, renders and can return to original", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page
    .getByRole("button", { name: "الخامة والمشهد", exact: true })
    .click();
  await page.getByLabel("Import GLB", { exact: true }).setInputFiles({
    name: "test.glb",
    mimeType: "model/gltf-binary",
    buffer: fixtureGlb(),
  });
  await expect(
    page.getByRole("button", { name: "العودة للمجسم الأصلي", exact: true }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() =>
        JSON.parse(
          localStorage.getItem("unitool.product-studio.v1") || "{}",
        ).customModel?.startsWith("data:model/gltf-binary"),
      ),
    )
    .toBe(true);
  await page
    .getByRole("button", { name: "تقريب على التصميم", exact: true })
    .click();
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "تصدير التصميم", exact: true })
    .click();
  await page.getByRole("button", { name: "تنزيل PNG", exact: true }).click();
  await download;
  await page.getByRole("button", { name: "إغلاق", exact: true }).click();
  await page
    .getByRole("button", { name: "العودة للمجسم الأصلي", exact: true })
    .click();
  expect(errors).toEqual([]);
});

test("Arabic curved text rasterizes and batch camera export downloads distinct views", async ({
  page,
}) => {
  const results = await page.evaluate(async () => {
    const { drawArtwork } = await import(
      String("/product-studio/core/artwork.ts")
    );
    const { layer } = await import(String("/product-studio/core/model.ts"));
    const result = [];
    for (const curve of [-90, 90]) {
      const c = await drawArtwork(
        [
          layer("text", {
            text: "صُنع بشغف",
            font: "Tahoma",
            curve,
            w: 800,
            h: 400,
            x: 112,
            y: 200,
          }),
        ],
        256,
        384,
      );
      const d = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data;
      let alpha = 0;
      for (let i = 3; i < d.length; i += 4) if (d[i]) alpha++;
      result.push({ width: c.width, height: c.height, alpha });
    }
    return result;
  });
  for (const r of results) {
    expect(r.width).toBe(256);
    expect(r.height).toBe(384);
    expect(r.alpha).toBeGreaterThan(100);
  }
  const downloads: string[] = [];
  page.on("download", (d) => downloads.push(d.suggestedFilename()));
  await page
    .getByRole("button", { name: "الخامة والمشهد", exact: true })
    .click();
  await page
    .getByRole("button", { name: "تصدير الأمام والخلف والجنب", exact: true })
    .click();
  await expect.poll(() => downloads.length, { timeout: 30000 }).toBe(3);
  expect(downloads.some((n) => n.endsWith("-front.png"))).toBeTruthy();
  expect(downloads.some((n) => n.endsWith("-back.png"))).toBeTruthy();
  expect(downloads.some((n) => n.endsWith("-side.png"))).toBeTruthy();
});

test("sustained layout dragging reuses pixels, updates during movement and undoes as one gesture", async ({
  page,
}) => {
  const hit = page
    .locator(".ps-pattern-card.active rect[data-layer-id]")
    .first();
  await hit.scrollIntoViewIfNeeded();
  const art = page
    .locator(".ps-pattern-card.active image[data-artwork-id]")
    .first();
  await expect(art).toHaveAttribute("href", /^data:image/);
  const href = await art.getAttribute("href"),
    xBefore = await page.getByLabel("X", { exact: true }).inputValue();
  const generation = await art.getAttribute("data-raster-generation");
  const box = (await hit.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(
    box.x + box.width * 0.5 + 26,
    box.y + box.height * 0.5 + 17,
    { steps: 45 },
  );
  await expect(page.getByLabel("X", { exact: true })).not.toHaveValue(xBefore);
  await expect(art).toHaveAttribute("href", href!);
  await page.mouse.up();
  await expect(art).toHaveAttribute("data-raster-generation", generation!);
  await page.getByTitle("تراجع Ctrl+Z").click();
  await expect(page.getByLabel("X", { exact: true })).toHaveValue(xBefore);
});

test("live size badge uses calibrated mm cm and inch measurements and edits real width", async ({
  page,
}) => {
  await expect(
    page.locator(".ps-pattern-card.active .ps-selection-measure"),
  ).toHaveAttribute("data-unit", "px");
  await page.getByLabel("تحديد مساحة الطباعة الفعلية", { exact: true }).check();
  await page.getByLabel("Print width", { exact: true }).fill("52");
  await page.getByLabel("Print height", { exact: true }).fill("91.6");
  await page.getByLabel("Measured w", { exact: true }).fill("260");
  await page.getByLabel("قفل نسب الأبعاد", { exact: true }).uncheck();
  await page.getByLabel("Measured h", { exact: true }).fill("229");
  await expect(
    page.locator(".ps-pattern-card.active .ps-selection-measure text"),
  ).toHaveText("260 × 229 mm");
  await page.getByRole("button", { name: "cm", exact: true }).click();
  await expect(
    page.locator(".ps-pattern-card.active .ps-selection-measure text"),
  ).toHaveText("26 × 22.90 cm");
  await page.getByRole("button", { name: "in", exact: true }).click();
  await expect(
    page.locator(".ps-pattern-card.active .ps-selection-measure text"),
  ).toHaveText("10.24 × 9.02 in");
  await expect(
    page.locator(".ps-pattern-card.active .ps-measure-ruler"),
  ).toBeVisible();
});

test("nine fabric types, knit scale and five-color gradient render without shader errors", async ({
  page,
}) => {
  const shaderErrors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") shaderErrors.push(m.text());
  });
  const before = await page.locator(".ps-three canvas").screenshot();
  await page
    .getByRole("button", { name: "الخامة والمشهد", exact: true })
    .click();
  await expect(
    page.getByLabel("نوع النسيج", { exact: true }).locator("option"),
  ).toHaveCount(9);
  await page.getByLabel("نوع النسيج", { exact: true }).selectOption("waffle");
  await page.getByLabel("حجم الغرز", { exact: true }).fill("2");
  await page.getByLabel("سطوع القماش", { exact: true }).fill("1.2");
  await page.getByLabel("تدرج القماش", { exact: true }).check();
  for (let i = 0; i < 3; i++)
    await page
      .getByRole("button", { name: "إضافة لون — حتى خمسة", exact: true })
      .click();
  await expect(
    page.getByRole("button", { name: "إضافة لون — حتى خمسة", exact: true }),
  ).toBeDisabled();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("unitool.product-studio.v1") || "{}")
            .appearance?.gradient?.colors?.length,
      ),
    )
    .toBe(5);
  expect(
    (await page.locator(".ps-three canvas").screenshot()).equals(before),
  ).toBeFalsy();
  expect(shaderErrors.filter((e) => /shader|WebGLProgram/i.test(e))).toEqual(
    [],
  );
});

test("print ZIP contains separate DPI-tagged PNGs, measurements and a real PDF spec sheet", async ({
  page,
}) => {
  await page.getByLabel("تحديد مساحة الطباعة الفعلية", { exact: true }).check();
  await page.getByLabel("Print width", { exact: true }).fill("10");
  await page.getByLabel("Print height", { exact: true }).fill("10");
  await page.getByLabel("Print dpi", { exact: true }).fill("100");
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "تنزيل حزمة ZIP + PDF", exact: true })
    .click();
  const d = await download;
  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(await fs.readFile((await d.path())!));
  const pngs = Object.keys(zip.files).filter((n) => n.endsWith(".png"));
  expect(pngs).toHaveLength(2);
  const png = await zip.file(pngs[0])!.async("nodebuffer");
  expect(png.readUInt32BE(16)).toBe(295);
  expect(png.indexOf("pHYs")).toBeGreaterThan(0);
  const offset = png.indexOf("pHYs");
  expect(png.readUInt32BE(offset + 4)).toBe(3937);
  const { PDFDocument } = await import("pdf-lib");
  const pdf = await PDFDocument.load(
    await zip.file("spec-sheet.pdf")!.async("uint8array"),
  );
  expect(pdf.getPageCount()).toBe(1);
  const manifest = JSON.parse(
    await zip.file("measurements.json")!.async("string"),
  );
  expect(manifest[0].widthCm).toBe(7.5);
  expect(manifest[0].xCm).toBe(1.25);
});

test("local raster commands preserve alpha, trim borders, tint, invert and resample", async ({
  page,
}) => {
  const result = await page.evaluate(async () => {
    const { processRaster } = await import(
      String("/product-studio/core/rasterEffects.ts")
    );
    const c = document.createElement("canvas");
    c.width = c.height = 20;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "red";
    ctx.fillRect(5, 5, 10, 10);
    const src = c.toDataURL();
    const out: Record<string, { w: number; h: number; pixel: number[] }> = {};
    for (const mode of [
      "trim",
      "invert",
      "tint",
      "upscale",
      "halftone",
    ] as const) {
      const image = new Image();
      image.src = await processRaster(src, mode, "#00ff00");
      await image.decode();
      const d = document.createElement("canvas");
      d.width = image.width;
      d.height = image.height;
      d.getContext("2d")!.drawImage(image, 0, 0);
      out[mode] = {
        w: d.width,
        h: d.height,
        pixel: Array.from(
          d.getContext("2d")!.getImageData(d.width / 2, d.height / 2, 1, 1)
            .data,
        ),
      };
    }
    return out;
  });
  expect(result.trim.w).toBe(10);
  expect(result.trim.h).toBe(10);
  expect(result.upscale.w).toBe(40);
  expect(result.invert.pixel.slice(0, 3)).toEqual([0, 255, 255]);
  expect(result.tint.pixel.slice(0, 3)).toEqual([0, 255, 0]);
  await page.getByRole("button", { name: "إضافة دائرة", exact: true }).click();
  await page.getByLabel("تدرج العنصر", { exact: true }).check();
  await page.getByLabel("حدود الشكل فقط", { exact: true }).check();
  await page.getByLabel("خط متقطع", { exact: true }).check();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(
            localStorage.getItem("unitool.product-studio.v1") || "{}",
          ).sides?.front?.at(-1)?.dashed,
      ),
    )
    .toBe(true);
});

test("layout navigation and preview quality settings remain usable", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "أداة تحريك الخريطة", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "أداة تحريك الخريطة", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("button", { name: "أداة تحريك الخريطة", exact: true })
    .click();
  await page.getByRole("button", { name: "شبكة الخريطة", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "شبكة الخريطة", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  await page
    .getByRole("button", { name: "وحدة الخريطة cm", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "وحدة الخريطة cm", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("button", { name: "الخامة والمشهد", exact: true })
    .click();
  await page
    .getByLabel("دقة المعاينة أثناء العمل", { exact: true })
    .selectOption("quarter");
  await page
    .getByLabel("خلفية الاستوديو", { exact: true })
    .selectOption("blinds");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("unitool.product-studio.v1") || "{}")
            .appearance?.previewQuality,
      ),
    )
    .toBe("quarter");
  const canvas = page.locator(".ps-three canvas");
  expect(
    await canvas.evaluate(
      (c: HTMLCanvasElement) => c.width / c.getBoundingClientRect().width,
    ),
  ).toBeLessThanOrEqual(0.51);
});

test("interactive crop supports draft resizing, keyboard motion, cancel, apply and undo", async ({
  page,
}) => {
  await page
    .locator('.ps-tools input[type=file][accept^="image/"]')
    .setInputFiles("product-studio/assets/model-man.jpg");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(
            localStorage.getItem("unitool.product-studio.v1") || "{}",
          ).sides?.front?.at(-1)?.src,
      ),
    )
    .toMatch(/^data:image/);
  const source = await page.evaluate(
    () =>
      JSON.parse(
        localStorage.getItem("unitool.product-studio.v1")!,
      ).sides.front.at(-1).src,
  );
  await page
    .getByRole("button", { name: "قص الصورة بالسحب", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "قص الصورة بالسحب",
    exact: true,
  });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "1:1", exact: true }).click();
  const window = dialog.getByTestId("crop-window"),
    before = Number(await window.getAttribute("width"));
  const handle = dialog.getByLabel("Crop handle 1 1", { exact: true });
  const box = (await handle.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x - 35, box.y - 30, { steps: 4 });
  await page.mouse.up();
  expect(Number(await window.getAttribute("width"))).toBeLessThan(before);
  const svg = dialog.getByRole("application");
  await svg.focus();
  const xBefore = Number(await window.getAttribute("x"));
  await svg.press("Shift+ArrowRight");
  expect(Number(await window.getAttribute("x"))).toBeGreaterThan(xBefore);
  await svg.press("Delete");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "إلغاء القص", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByLabel("Crop w", { exact: true })).toHaveValue("100");
  await page
    .getByRole("button", { name: "قص الصورة بالسحب", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "16:9", exact: true })
    .click();
  await page.getByRole("button", { name: "تطبيق القص", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByLabel("Crop h", { exact: true })).not.toHaveValue(
    "100",
  );
  expect(
    Number(await page.getByLabel("Crop h", { exact: true }).inputValue()),
  ).toBeLessThan(100);
  await page.getByTitle("تراجع Ctrl+Z").click();
  await expect(page.getByLabel("Crop h", { exact: true })).toHaveValue("100");
  await page
    .getByRole("button", { name: "قص الصورة بالسحب", exact: true })
    .click();
  await page.getByRole("dialog").getByRole("application").press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "قص الصورة بالسحب", exact: true }),
  ).toBeFocused();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(
            localStorage.getItem("unitool.product-studio.v1") || "{}",
          ).sides?.front?.at(-1)?.src,
      ),
    )
    .toBe(source);
});

test("gradient stops can be added on the ramp, dragged, keyboard edited and removed safely", async ({
  page,
}) => {
  await page.getByRole("button", { name: "إضافة دائرة", exact: true }).click();
  await page.getByLabel("تدرج العنصر", { exact: true }).check();
  const ramp = page.getByLabel("تدرج العنصر شريط النقاط", { exact: true });
  const box = (await ramp.boundingBox())!;
  await ramp.click({ position: { x: box.width * 0.4, y: 5 } });
  await expect(
    page.getByRole("slider", { name: /تدرج العنصر نقطة/ }),
  ).toHaveCount(3);
  const marker = page.getByRole("slider", {
    name: "تدرج العنصر نقطة 2",
    exact: true,
  });
  const m = (await marker.boundingBox())!;
  await page.mouse.move(m.x + m.width / 2, m.y + m.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.6, m.y + m.height / 2, {
    steps: 4,
  });
  await page.mouse.up();
  expect(Number(await marker.getAttribute("aria-valuenow"))).toBeGreaterThan(
    50,
  );
  await page.getByLabel("تدرج العنصر موضع 2", { exact: true }).fill("60");
  await expect(marker).toHaveAttribute("aria-valuenow", "60");
  await marker.press("Shift+ArrowLeft");
  await expect(marker).toHaveAttribute("aria-valuenow", "50");
  await marker.press("Delete");
  await expect(
    page.getByRole("slider", { name: /تدرج العنصر نقطة/ }),
  ).toHaveCount(2);
  await expect(page.locator(".ps-layer")).toHaveCount(3);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(
            localStorage.getItem("unitool.product-studio.v1") || "{}",
          ).sides?.front?.at(-1)?.gradient?.positions,
      ),
    )
    .toEqual([0, 1]);
});

test("non-uniform fabric stop positions render and persist without shader errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error" && /shader|WebGLProgram/i.test(m.text()))
      errors.push(m.text());
  });
  await page
    .getByRole("button", { name: "الخامة والمشهد", exact: true })
    .click();
  await page.getByLabel("تدرج القماش", { exact: true }).check();
  await page.getByLabel("تدرج القماش موضع 1", { exact: true }).fill("20");
  await page.getByLabel("تدرج القماش موضع 2", { exact: true }).fill("70");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("unitool.product-studio.v1") || "{}")
            .appearance?.gradient?.positions,
      ),
    )
    .toEqual([0.2, 0.7]);
  await page.locator(".ps-three canvas").screenshot();
  expect(errors).toEqual([]);
});

test("monochrome tracing downloads actual SVG paths without replacing the original image", async ({
  page,
}) => {
  const png = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 32;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "black";
    ctx.fillRect(5, 5, 20, 20);
    ctx.clearRect(10, 10, 10, 10);
    return c.toDataURL().split(",")[1];
  });
  await page
    .locator('.ps-tools input[type=file][accept^="image/"]')
    .setInputFiles({
      name: "logo.png",
      mimeType: "image/png",
      buffer: Buffer.from(png, "base64"),
    });
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(
            localStorage.getItem("unitool.product-studio.v1") || "{}",
          ).sides?.front?.at(-1)?.src,
      ),
    )
    .toContain(png);
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "تصدير SVG أحادي اللون", exact: true })
    .click();
  const d = await download;
  const svg = await fs.readFile((await d.path())!, "utf8");
  expect(svg).toContain("<path");
  expect(svg).not.toMatch(/<image|href|<script|foreignObject/);
  const valid = await page.evaluate(async (text) => {
    const image = new Image();
    image.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(text);
    await image.decode();
    return image.naturalWidth > 0;
  }, svg);
  expect(valid).toBeTruthy();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(
            localStorage.getItem("unitool.product-studio.v1") || "{}",
          ).sides?.front?.at(-1)?.src,
      ),
    )
    .toContain(png);
});

test("seven tee cuts render, preserve artwork, persist and undo", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error" && /shader|WebGLProgram/i.test(m.text()))
      errors.push(m.text());
  });
  await expect(page.locator(".ps-tee-grid button")).toHaveCount(7);
  const original = await page.evaluate(() =>
    JSON.stringify(
      JSON.parse(localStorage.getItem("unitool.product-studio.v1") || "{}")
        .sides,
    ),
  );
  for (const [name, id] of [
    ["بوكسي — عريض وقصير", "boxy"],
    ["سليم فيت", "slim"],
    ["لونج لاين — طويل", "longline"],
    ["دروب شولدر", "drop"],
    ["رقبة V", "vneck"],
    ["تيشيرت كم طويل", "longsleeve"],
  ]) {
    await page.getByRole("button", { name, exact: true }).click();
    await expect(
      page.getByRole("button", { name, exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            JSON.parse(
              localStorage.getItem("unitool.product-studio.v1") || "{}",
            ).appearance?.teeStyle,
        ),
      )
      .toBe(id);
    await page.locator(".ps-three canvas").screenshot();
  }
  expect(
    await page.evaluate(() =>
      JSON.stringify(
        JSON.parse(localStorage.getItem("unitool.product-studio.v1") || "{}")
          .sides,
      ),
    ),
  ).toBe(original);
  await page.getByTitle("تراجع Ctrl+Z").click();
  await expect(
    page.getByRole("button", { name: "رقبة V", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("unitool.product-studio.v1") || "{}")
            .appearance?.teeStyle,
      ),
    )
    .toBe("vneck");
  await page.reload();
  await expect(
    page.getByRole("button", { name: "رقبة V", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "الوجه الخلفي", exact: true }).click();
  await page.locator(".ps-three canvas").screenshot();
  expect(errors).toEqual([]);
});
