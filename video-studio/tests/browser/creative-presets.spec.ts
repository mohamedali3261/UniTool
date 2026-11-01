import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs/promises";
import { loadElements } from "../../../src/pages/Elements/registry";
import { blankProject, newClip } from "../../src/types";
const base = process.env.STUDIO_QA_URL || "http://localhost:3000";
const elements = loadElements().filter((i) => i.id.startsWith("creative-"));
async function project(page: Page, presets = elements, length = 6) {
  await page.goto(base + "/video-studio.html");
  const asset = {
    id: "background",
    type: "image",
    name: "background.svg",
    url:
      "data:image/svg+xml;base64," +
      Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540"><rect width="960" height="540" fill="#223344"/><path d="M0 0 960 540 M960 0 0 540" stroke="#fff" stroke-width="50"/></svg>',
      ).toString("base64"),
    duration: presets.length * length,
    width: 960,
    height: 540,
  } as const;
  const p = {
    ...blankProject(),
    clips: [{ ...newClip(asset), end: presets.length * length }],
    texts: presets.map((item, i) => ({
      ...structuredClone(item.layer!),
      start: i * length,
      end: (i + 1) * length,
    })),
  };
  await page.locator('input[accept=".json"]').setInputFiles({
    name: "creative.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({ version: 1, project: p, assets: [asset] }),
    ),
  });
  await expect(page.locator(".editor-shell")).toBeVisible();
}
async function fingerprint(page: Page) {
  return page
    .locator(".canvas-stage canvas")
    .evaluate((c: HTMLCanvasElement) => {
      const s = document.createElement("canvas");
      s.width = 160;
      s.height = 90;
      const x = s.getContext("2d")!;
      x.drawImage(c, 0, 0, 160, 90);
      const d = x.getImageData(0, 0, 160, 90).data;
      let h = 2166136261;
      for (let i = 0; i < d.length; i++) h = Math.imul(h ^ d[i], 16777619);
      return h >>> 0;
    });
}
async function seek(page: Page, time: number) {
  const input = page.getByRole("spinbutton", {
    name: "الانتقال إلى ثانية",
    exact: true,
  });
  await input.fill(String(time));
  await input.press("Enter");
  await page.evaluate(
    () =>
      new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
  );
}
test("all 36 native creative presets render changing frames and rewind deterministically", async ({
  page,
}) => {
  test.setTimeout(180000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(() => {
    const w = window as Window & { creativeGLDraws?: number };
    const original = WebGL2RenderingContext.prototype.drawElements;
    WebGL2RenderingContext.prototype.drawElements = function (...args) {
      w.creativeGLDraws = (w.creativeGLDraws || 0) + 1;
      return Reflect.apply(original, this, args);
    };
  });
  await project(page);
  await expect
    .poll(() =>
      page.evaluate(() =>
        document.fonts.check("500 40px StudioVariable", "مرحبا Hello"),
      ),
    )
    .toBe(true);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          [...document.fonts].filter(
            (f) => f.family === "StudioVariable" && f.status === "loaded",
          ).length,
      ),
    )
    .toBe(2);
  for (let i = 0; i < elements.length; i++) {
    await seek(page, i * 6 + 0.15);
    const first = await fingerprint(page);
    await seek(page, i * 6 + 1.1);
    const second = await fingerprint(page);
    expect(second, `${elements[i].id} animates`).not.toBe(first);
    await seek(page, i * 6 + 0.15);
    expect(await fingerprint(page), `${elements[i].id} rewinds`).toBe(first);
  }
  expect(
    await page.evaluate(
      () =>
        (window as Window & { creativeGLDraws?: number }).creativeGLDraws || 0,
    ),
  ).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});
test("creative elements insert from the library, expose controls, and survive project save", async ({
  page,
}) => {
  await page.goto(base + "/video-studio.html#elements");
  await page
    .getByRole("button", { name: "حركات إبداعية · 36", exact: true })
    .click();
  await page
    .getByRole("searchbox", { name: "بحث في عناصر القوالب", exact: true })
    .fill("Highlight marker");
  await page
    .locator('.studio-elements-grid button[aria-label$="للتايم لاين"]')
    .click();
  await expect(
    page.getByRole("combobox", { name: "حركة النص الإبداعية", exact: true }),
  ).toHaveValue("marker");
  await page
    .getByRole("textbox", { name: "الكلمة المهمة", exact: true })
    .fill("أفكار");
  await page
    .getByRole("slider", { name: "سرعة الحركة الإبداعية", exact: true })
    .fill("1.7");
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "حفظ المشروع", exact: true }).click();
  const saved = JSON.parse(
    await fs.readFile((await (await pending).path())!, "utf8"),
  );
  expect(saved.project.texts[0].creative).toMatchObject({
    id: "marker",
    highlight: "أفكار",
    speed: 1.7,
  });
});
test("real Cmd K command palette searches and inserts a native animated asset", async ({
  page,
}) => {
  await page.goto(base + "/video-studio.html#elements");
  await page.keyboard.press("Control+k");
  const dialog = page.getByRole("dialog", {
    name: "البحث السريع عن العناصر",
    exact: true,
  });
  await expect(dialog).toBeVisible();
  await page
    .getByRole("searchbox", { name: "بحث سريع في العناصر", exact: true })
    .fill("Aurora");
  await dialog.getByRole("button", { name: /Aurora/ }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.locator(".timeline-clip")).toHaveCount(1);
  await expect(
    page.getByRole("slider", { name: "سرعة الحركة الإبداعية", exact: true }),
  ).toBeVisible();
});

test("five new clip transitions composite actual source images and preserve their colors", async ({
  page,
}) => {
  for (const kind of [
    "shared-card",
    "circle-reveal",
    "page-flip",
    "zoom-through",
    "liquid-wipe",
  ] as const) {
    await page.goto(base + "/video-studio.html");
    const assets = ["#ff0000", "#00ff00"].map(
      (color, i) =>
        ({
          id: `img-${i}`,
          type: "image",
          name: `${i}.svg`,
          url:
            "data:image/svg+xml;base64," +
            Buffer.from(
              `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540"><rect width="960" height="540" fill="${color}"/></svg>`,
            ).toString("base64"),
          duration: 4,
          width: 960,
          height: 540,
        }) as const,
    );
    const p = {
      ...blankProject(),
      clips: assets.map((a, i) => ({
        ...newClip(a),
        end: 2,
        ...(i ? { transition: { kind, duration: 1 } } : {}),
      })),
    };
    await page.locator('input[accept=".json"]').setInputFiles({
      name: "transition.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify({ version: 1, project: p, assets })),
    });
    await expect(page.locator(".timeline-clip")).toHaveCount(2);
    const pixel = () =>
      page
        .locator(".canvas-stage canvas")
        .evaluate((c: HTMLCanvasElement) =>
          Array.from(
            c
              .getContext("2d")!
              .getImageData(
                Math.floor(c.width * 0.5),
                Math.floor(c.height * 0.5),
                1,
                1,
              ).data,
          ),
        );
    await seek(page, 1.25);
    await expect.poll(pixel).toEqual([255, 0, 0, 255]);
    await seek(page, 2.75);
    await expect.poll(pixel).toEqual([0, 255, 0, 255]);
    await seek(page, 1.75);
    const before = await fingerprint(page);
    await seek(page, 2.25);
    const after = await fingerprint(page);
    expect(before, kind).not.toBe(after);
  }
});

for (const format of ["webm", "mp4"] as const)
  test(`creative motion and variable weight appear in a decoded ${format} export`, async ({
    page,
  }) => {
    test.setTimeout(90000);
    await project(
      page,
      [
        elements.find((i) => i.id === "creative-mesh")!,
        elements.find((i) => i.id === "creative-weight")!,
      ],
      1.4,
    );
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
    const bytes = await fs.readFile((await (await pending).path())!);
    expect(bytes.length).toBeGreaterThan(1000);
    const result = await page.evaluate(
      async ({ data, format }) => {
        const v = document.createElement("video");
        v.muted = true;
        v.playsInline = true;
        const url = URL.createObjectURL(
          new Blob([Uint8Array.from(atob(data), (ch) => ch.charCodeAt(0))], {
            type: `video/${format}`,
          }),
        );
        try {
          await new Promise<void>((resolve, reject) => {
            v.onloadeddata = () => resolve();
            v.onerror = () => reject(Error("decode failed"));
            v.src = url;
          });
          const c = document.createElement("canvas");
          c.width = 80;
          c.height = 45;
          const x = c.getContext("2d")!,
            hashes = new Set<number>();
          let frames = 0;
          if (format === "mp4") {
            for (const time of [0.1, 0.3, 0.5, 0.8, 1.1, 1.6, 2, 2.4]) {
              v.currentTime = time;
              await new Promise<void>((resolve, reject) => {
                const timer = setTimeout(
                  () => reject(Error("seek timeout")),
                  3000,
                );
                v.onseeked = () => {
                  clearTimeout(timer);
                  resolve();
                };
              });
              x.drawImage(v, 0, 0, 80, 45);
              const d = x.getImageData(0, 0, 80, 45).data;
              let h = 2166136261;
              for (let i = 0; i < d.length; i++)
                h = Math.imul(h ^ d[i], 16777619);
              hashes.add(h >>> 0);
              frames++;
            }
            return { frames, unique: hashes.size, height: v.videoHeight };
          }
          await new Promise<void>((resolve, reject) => {
            const timer = setTimeout(() => {
              v.pause();
              resolve();
            }, 10000);
            v.onended = () => {
              clearTimeout(timer);
              resolve();
            };
            v.onerror = () => {
              clearTimeout(timer);
              reject(Error("playback failed"));
            };
            const tick = () => {
              if (v.ended || v.paused) return;
              x.drawImage(v, 0, 0, 80, 45);
              const d = x.getImageData(0, 0, 80, 45).data;
              let h = 2166136261;
              for (let i = 0; i < d.length; i++)
                h = Math.imul(h ^ d[i], 16777619);
              hashes.add(h >>> 0);
              frames++;
              v.requestVideoFrameCallback(tick);
            };
            void v
              .play()
              .then(() => v.requestVideoFrameCallback(tick))
              .catch(reject);
          });
          return { frames, unique: hashes.size, height: v.videoHeight };
        } finally {
          v.pause();
          v.removeAttribute("src");
          v.load();
          URL.revokeObjectURL(url);
        }
      },
      { data: bytes.toString("base64"), format },
    );
    expect(result.height).toBe(480);
    expect(result.frames).toBeGreaterThan(5);
    expect(result.unique).toBeGreaterThan(3);
  });

test("creative controls remain usable on a 390px touch viewport and data edits persist", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base + "/video-studio.html#elements");
  await page
    .getByRole("button", { name: "حركات إبداعية · 36", exact: true })
    .click();
  await page
    .getByRole("searchbox", { name: "بحث في عناصر القوالب", exact: true })
    .fill("Radial progress");
  await page
    .locator('.studio-elements-grid button[aria-label$="للتايم لاين"]')
    .click();
  const progress = page.getByRole("slider", {
    name: "نسبة التقدم",
    exact: true,
  });
  await expect(progress).toBeVisible();
  await progress.fill("43");
  await expect(progress).toHaveValue("43");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "test-results/creative-mobile-390.png" });
  const pending = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "حفظ المشروع", exact: true })
    .first()
    .click();
  const saved = JSON.parse(
    await fs.readFile((await (await pending).path())!, "utf8"),
  );
  expect(saved.project.texts[0].creative.value).toBe(43);
});

test("chart datasets can be edited and survive project save", async ({
  page,
}) => {
  await page.goto(base + "/video-studio.html#elements");
  await page
    .getByRole("button", { name: "حركات إبداعية · 36", exact: true })
    .click();
  await page
    .getByRole("searchbox", { name: "بحث في عناصر القوالب", exact: true })
    .fill("Line draw");
  await page
    .locator('.studio-elements-grid button[aria-label$="للتايم لاين"]')
    .click();
  await page
    .getByRole("textbox", { name: "قيم الرسم البياني", exact: true })
    .fill("12, 35, 20, 60");
  await page
    .getByRole("button", { name: "تطبيق قيم الرسم", exact: true })
    .click();
  const pending = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "حفظ المشروع", exact: true })
    .first()
    .click();
  const saved = JSON.parse(
    await fs.readFile((await (await pending).path())!, "utf8"),
  );
  expect(saved.project.texts[0].creative.data).toEqual([12, 35, 20, 60]);
  await page.screenshot({ path: "test-results/creative-desktop-data.png" });
});
