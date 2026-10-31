import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs/promises";
const base = process.env.STUDIO_QA_URL || "http://localhost:3000";
async function open(page: Page) {
  await page.goto(`${base}/video-studio.html`);
}
async function fixture(page: Page) {
  return await page.evaluate(() => {
    const image = (color: string) => {
      const c = document.createElement("canvas");
      c.width = 160;
      c.height = 90;
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 160, 90);
      return c.toDataURL("image/png");
    };
    const asset = (id: string, color: string) => ({
      id,
      name: `${id}.png`,
      type: "image",
      duration: 5,
      url: image(color),
    });
    const clip = (id: string, assetId: string) => ({
      id,
      assetId,
      start: 0,
      end: 1,
      speed: 1,
      volume: 1,
      filter: "original",
      brightness: 1,
      contrast: 1,
      saturation: 1,
    });
    return {
      version: 1,
      assets: [
        asset("red", "#ff0000"),
        asset("blue", "#0000ff"),
        asset("green", "#00ff00"),
      ],
      project: {
        name: "Creative QA",
        ratio: "16:9",
        clips: [
          clip("first", "red"),
          {
            ...clip("second", "blue"),
            transition: { kind: "crossfade", duration: 1 },
          },
        ],
        texts: [],
        audioId: null,
        audioVolume: 0.7,
        overlays: [
          {
            id: "logo",
            assetId: "green",
            at: 0,
            start: 0,
            end: 2,
            x: 50,
            y: 50,
            width: 35,
            opacity: 1,
            rotation: 0,
            volume: 0,
          },
        ],
      },
    };
  });
}
async function load(page: Page, data: unknown) {
  await page.locator('input[type=file][accept=".json"]').setInputFiles({
    name: "creative.unitool.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(data)),
  });
  await page.locator(".editor-shell").waitFor();
}
async function seek(page: Page, t: number) {
  await page
    .getByRole("spinbutton", { name: "الانتقال إلى ثانية", exact: true })
    .fill(String(t));
}
async function pixel(page: Page, x: number, y: number) {
  return page
    .locator(".canvas-stage canvas")
    .evaluate(
      (c: HTMLCanvasElement, { x, y }) =>
        Array.from(
          c
            .getContext("2d")!
            .getImageData(
              Math.floor(c.width * x),
              Math.floor(c.height * y),
              1,
              1,
            ).data,
        ),
      { x, y },
    );
}
async function save(page: Page) {
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "حفظ المشروع", exact: true }).click();
  return JSON.parse(await fs.readFile(await (await pending).path(), "utf8"));
}
test("templates, animation controls, keyframes and reload recovery", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await open(page);
  await expect(page.locator(".template-card")).toHaveCount(5);
  await page.locator(".template-card").first().click();
  await expect(page.locator(".timeline-clip")).toHaveCount(3);
  await page
    .getByRole("textbox", { name: "محتوى النص", exact: true })
    .first()
    .fill("عنواني الجديد");
  await page
    .locator(".creative-tools summary")
    .filter({ hasText: "تحريك الصورة" })
    .click();
  await page
    .getByRole("button", { name: "أضف Keyframe عند المؤشر", exact: false })
    .click();
  await expect(page.locator(".keyframe-fields")).toHaveCount(1);
  await seek(page, 2);
  await page
    .getByRole("button", { name: "أضف Keyframe عند المؤشر", exact: false })
    .click();
  await expect(page.locator(".keyframe-fields")).toHaveCount(2);
  await page
    .getByRole("spinbutton", { name: "Keyframe 2 أفقي %", exact: true })
    .fill("20");
  const saved = await save(page);
  expect(saved.project.clips[0].keyframes).toHaveLength(2);
  expect(saved.project.texts[0].text).toBe("عنواني الجديد");
  await expect(
    page.getByText("محفوظ على هذا الجهاز ✓", { exact: true }).first(),
  ).toBeVisible({ timeout: 10000 });
  await page.reload();
  await page
    .getByRole("button", { name: "استرجاع المشروع", exact: true })
    .first()
    .click();
  await expect(page.locator(".timeline-clip")).toHaveCount(3);
  const restored = await save(page);
  expect(restored.project).toEqual(saved.project);
  expect(restored.assets).toHaveLength(3);
  expect(errors).toEqual([]);
});
for (const format of ["webm", "mp4"] as const)
  test(`compositor blends scenes and overlays in decoded ${format}`, async ({
    page,
  }) => {
    test.setTimeout(60000);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await open(page);
    const data = await fixture(page);
    data.project.clips.forEach((c) => (c.end = 3));
    data.project.clips[1].transition.duration = 3;
    data.project.overlays[0].end = 6;
    await load(page, data);
    await seek(page, 3);
    await expect
      .poll(async () => {
        const p = await pixel(page, 0.9, 0.5);
        return p[0] > 110 && p[0] < 145 && p[2] > 110 && p[2] < 145;
      })
      .toBe(true);
    expect((await pixel(page, 0.5, 0.5)).slice(0, 3)).toEqual([0, 255, 0]);
    await page.getByRole("button", { name: /تصدير/ }).first().click();
    if (format === "webm") {
      await page
        .getByRole("combobox", { name: "صيغة التصدير", exact: true })
        .click();
      await page.getByRole("option", { name: "WebM", exact: true }).click();
    }
    await page
      .getByRole("combobox", { name: "دقة التصدير", exact: true })
      .click();
    await page
      .getByRole("option", { name: "480p — خفيف وسريع", exact: true })
      .click();
    const pending = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "تصدير الفيديو", exact: true })
      .click();
    const download = await pending;
    const bytes = await fs.readFile(await download.path());
    expect(bytes.length).toBeGreaterThan(1000);
    const decoded = await page.evaluate(
      async ({ data, format }) => {
        const v = document.createElement("video");
        v.muted = true;
        v.playbackRate = 0.5;
        v.preload = "auto";
        const url = URL.createObjectURL(
          new Blob([Uint8Array.from(atob(data), (c) => c.charCodeAt(0))], {
            type: `video/${format}`,
          }),
        );
        const samples: { center: number[]; edge: number[] }[] = [];
        try {
          await new Promise<void>((resolve, reject) => {
            v.onloadeddata = () => resolve();
            v.onerror = () => reject(new Error("decode failed"));
            v.src = url;
          });
          const canvas = document.createElement("canvas");
          canvas.width = v.videoWidth;
          canvas.height = v.videoHeight;
          const ctx = canvas.getContext("2d")!;
          await new Promise<void>((resolve, reject) => {
            const timer = setTimeout(() => {
              v.pause();
              resolve();
            }, 12000);
            v.onended = () => {
              clearTimeout(timer);
              resolve();
            };
            const sample = () => {
              ctx.drawImage(v, 0, 0);
              samples.push({
                center: Array.from(
                  ctx.getImageData(canvas.width / 2, canvas.height / 2, 1, 1)
                    .data,
                ),
                edge: Array.from(
                  ctx.getImageData(
                    canvas.width * 0.9,
                    canvas.height * 0.5,
                    1,
                    1,
                  ).data,
                ),
              });
              if (!v.ended) v.requestVideoFrameCallback(sample);
            };
            v.requestVideoFrameCallback(sample);
            void v.play().catch((error) => {
              clearTimeout(timer);
              reject(error);
            });
          });
          return {
            width: v.videoWidth,
            height: v.videoHeight,
            frames: samples.length,
            hasOverlay: samples.some(
              (s) => s.center[1] > 180 && s.center[0] < 30,
            ),
            hasBlend: samples.some((s) => s.edge[0] > 60 && s.edge[2] > 60),
          };
        } finally {
          v.pause();
          v.removeAttribute("src");
          v.load();
          URL.revokeObjectURL(url);
        }
      },
      { data: bytes.toString("base64"), format },
    );
    expect(decoded.frames).toBeGreaterThan(2);
    expect(decoded.hasOverlay).toBe(true);
    expect(decoded.hasBlend).toBe(true);
    expect(errors).toEqual([]);
  });
test("same video can play as base and a separately timed overlay", async ({
  page,
}) => {
  await open(page);
  const data = await fixture(page);
  const bytes = await fs.readFile(
    new URL("../fixtures/stock-video.mp4", import.meta.url),
  );
  const video = {
    id: "video",
    name: "fixture.mp4",
    type: "video",
    duration: 2,
    url: `data:video/mp4;base64,${bytes.toString("base64")}`,
  };
  await load(page, {
    ...data,
    assets: [...data.assets, video],
    project: {
      ...data.project,
      clips: [{ ...data.project.clips[0], assetId: "video", end: 2 }],
      overlays: [
        { ...data.project.overlays[0], assetId: "video", start: 0.5, end: 1.5 },
      ],
    },
  });
  await seek(page, 0.5);
  await expect
    .poll(async () => (await pixel(page, 0.5, 0.5))[1])
    .toBeGreaterThan(100);
  await page.getByRole("button", { name: "تشغيل", exact: true }).click();
  await page.waitForTimeout(350);
  await page.getByRole("button", { name: "إيقاف", exact: true }).click();
  expect((await pixel(page, 0.5, 0.5))[1]).toBeGreaterThan(100);
});
test("quota errors stay visible without blocking manual project backup", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (
      ...args: Parameters<typeof original>
    ) {
      if (this.name === "media")
        throw new DOMException("full", "QuotaExceededError");
      return original.apply(this, args);
    };
  });
  await open(page);
  await load(page, await fixture(page));
  await expect(
    page
      .getByText("المساحة ممتلئة — نزّل نسخة JSON الآن", { exact: true })
      .first(),
  ).toBeVisible({ timeout: 10000 });
  expect((await save(page)).project.overlays).toHaveLength(1);
});
for (const [width, height] of [
  [320, 740],
  [390, 844],
  [768, 1024],
  [844, 390],
])
  test(`creative tools on touch ${width}x${height}`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width, height },
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    await open(page);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.locator(".template-card").nth(2).click();
    await page
      .getByRole("button", { name: "لوحة الخصائص", exact: true })
      .click();
    await page.locator("#studio-layers > summary").click();
    await page
      .getByRole("button", { name: "إضافة طبقة عند المؤشر", exact: false })
      .click();
    await expect(page.locator(".overlay-timeline-track")).toHaveCount(1);
    await page
      .getByRole("spinbutton", { name: "طبقة 1 المكان الأفقي %", exact: true })
      .fill("60");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const saved = await save(page);
    expect(saved.project.overlays[0].x).toBe(60);
    expect(saved.assets.length).toBe(1);
    await context.close();
  });

test("layer-only upload does not append a base clip; transition controls persist", async ({
  page,
}) => {
  await open(page);
  const data = await fixture(page);
  await load(page, data);
  await page.locator(".timeline-clip").nth(1).click();
  await page
    .getByRole("combobox", { name: "نوع الانتقال", exact: true })
    .click();
  await page.getByRole("option", { name: "سحب", exact: true }).click();
  await page
    .getByRole("spinbutton", { name: "مدة الانتقال", exact: true })
    .fill("1.2");
  await page.locator("#studio-layers > summary").click();
  const chooser = page.waitForEvent("filechooser");
  await page
    .getByRole("button", { name: "رفع ملف كطبقة فقط", exact: true })
    .click();
  await (
    await chooser
  ).setFiles({
    name: "logo.png",
    mimeType: "image/png",
    buffer: Buffer.from(data.assets[2].url.split(",")[1], "base64"),
  });
  await expect(page.locator(".overlay-timeline-track")).toHaveCount(2);
  await expect(page.locator(".timeline-clip")).toHaveCount(2);
  const saved = await save(page);
  expect(saved.project.clips[1].transition).toEqual({
    kind: "slide",
    duration: 1.2,
  });
  expect(saved.project.overlays).toHaveLength(2);
});
test("deleting every base clip is autosaved, not restored as an older edit", async ({
  page,
}) => {
  await open(page);
  await load(page, await fixture(page));
  await expect(
    page.getByText("محفوظ على هذا الجهاز ✓", { exact: true }).first(),
  ).toBeVisible({ timeout: 10000 });
  await page.getByRole("button", { name: "حذف المقطع", exact: true }).click();
  await expect(page.locator(".timeline-clip")).toHaveCount(1);
  await page.getByRole("button", { name: "حذف المقطع", exact: true }).click();
  await expect(page.locator(".timeline-clip")).toHaveCount(0);
  await expect(
    page.getByText("محفوظ على هذا الجهاز ✓", { exact: true }).first(),
  ).toBeVisible({ timeout: 10000 });
  await page.reload();
  await page
    .getByRole("button", { name: "استرجاع المشروع", exact: true })
    .first()
    .click();
  await expect(page.locator(".timeline-clip")).toHaveCount(0);
});
