import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs/promises";
const base = process.env.STUDIO_QA_URL || "http://localhost:3000";
async function fingerprint(page: Page) {
  return page
    .locator(".canvas-stage canvas")
    .evaluate((c: HTMLCanvasElement) => {
      const sample = document.createElement("canvas");
      sample.width = 72;
      sample.height = 128;
      const ctx = sample.getContext("2d")!;
      ctx.drawImage(c, 0, 0, 72, 128);
      const d = ctx.getImageData(0, 0, 72, 128).data;
      let h = 2166136261;
      for (let i = 0; i < d.length; i++) h = Math.imul(h ^ d[i], 16777619);
      return h >>> 0;
    });
}
async function save(page: Page) {
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "حفظ المشروع", exact: true }).click();
  return JSON.parse(await fs.readFile(await (await pending).path(), "utf8"));
}
for (const mobile of [false, true])
  test(`interface template builds seven animated scenes and portable editable titles ${mobile ? "mobile" : "desktop"}`, async ({
    browser,
  }) => {
    const ctx = await browser.newContext({
      viewport: mobile
        ? { width: 390, height: 844 }
        : { width: 1440, height: 1000 },
      isMobile: mobile,
      hasTouch: mobile,
    });
    const page = await ctx.newPage();
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`${base}/video-studio.html`);
    await page
      .getByRole("button", {
        name: "استخدم قالب الأدوات الخمسة ↗",
        exact: true,
      })
      .click();
    await expect(page.locator(".timeline-clip")).toHaveCount(7, {
      timeout: 20000,
    });
    const original = await save(page);
    expect(original.project.ratio).toBe("9:16");
    expect(
      original.project.clips.reduce(
        (n: number, c: { end: number; start: number }) => n + c.end - c.start,
        0,
      ),
    ).toBe(70);
    expect(original.project.texts).toHaveLength(16);
    expect(original.project.sounds).toHaveLength(13);
    expect(
      original.project.texts.some(
        (t: { text: string }) => t.text === "@yourname",
      ),
    ).toBe(true);
    if (!mobile) {
      let start = 0;
      for (const clip of original.project.clips) {
        await page
          .getByRole("spinbutton", { name: "الانتقال إلى ثانية", exact: true })
          .fill(String(start + 0.9));
        let first = 0;
        await expect
          .poll(async () => {
            first = await fingerprint(page);
            return first;
          })
          .not.toBe(0);
        await page
          .getByRole("spinbutton", { name: "الانتقال إلى ثانية", exact: true })
          .fill(String(start + 4.5));
        await expect.poll(() => fingerprint(page)).not.toBe(first);
        start += clip.end - clip.start;
      }
    }
    await page.locator('input[type=file][accept=".json"]').setInputFiles({
      name: "interface-flow.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(original)),
    });
    await expect(page.locator(".preview-area audio").last()).toHaveAttribute(
      "src",
      /^data:audio/,
      { timeout: 20000 },
    );
    await expect(page.locator(".timeline-clip")).toHaveCount(7);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(mobile ? 390 : 1440);
    expect(errors).toEqual([]);
    await ctx.close();
  });
test("portrait 720 × 1280 export keeps actual animated UI frames", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.goto(`${base}/video-studio.html`);
  await page
    .getByRole("button", { name: "استخدم قالب الأدوات الخمسة ↗", exact: true })
    .click();
  await expect(page.locator(".timeline-clip")).toHaveCount(7);
  const data = await save(page);
  data.project.clips = [{ ...data.project.clips[3], start: 0, end: 3 }];
  data.project.texts = [];
  data.project.markers = [];
  data.project.sounds = [];
  data.project.audioId = null;
  await page.locator('input[type=file][accept=".json"]').setInputFiles({
    name: "magic.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(data)),
  });
  await expect(page.locator(".timeline-clip")).toHaveCount(1);
  await page.getByRole("button", { name: /تصدير/ }).first().click();
  await page
    .getByRole("combobox", { name: "دقة التصدير", exact: true })
    .click();
  await page
    .getByRole("option", { name: "ريل 720 × 1280 — عمودي", exact: true })
    .click();
  const pending = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "تصدير الفيديو", exact: true })
    .click();
  const bytes = await fs.readFile(await (await pending).path());
  const result = await page.evaluate(async (b64) => {
    const v = document.createElement("video");
    v.muted = true;
    v.playsInline = true;
    v.playbackRate = 0.5;
    v.style.cssText =
      "position:fixed;left:0;top:0;width:72px;height:128px;z-index:99999";
    document.body.appendChild(v);
    const u = URL.createObjectURL(
      new Blob([Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))], {
        type: "video/mp4",
      }),
    );
    try {
      await new Promise<void>((r, j) => {
        v.onloadeddata = () => r();
        v.onerror = () => j(Error("decode"));
        v.src = u;
      });
      const c = document.createElement("canvas");
      c.width = 72;
      c.height = 128;
      const ctx = c.getContext("2d")!;
      const frames = new Set<number>();
      const green: number[] = [];
      for (const time of [0.2, 0.9, 1.5, 2.6]) {
        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(() => {
            v.onseeked = null;
            reject(Error("seek timed out"));
          }, 5000);
          v.onseeked = () => {
            clearTimeout(timer);
            resolve();
          };
          v.currentTime = time;
        });
        ctx.drawImage(v, 0, 0, 72, 128);
        const d = ctx.getImageData(0, 0, 72, 128).data;
        let hash = 2166136261;
        for (const byte of d) hash = Math.imul(hash ^ byte, 16777619);
        frames.add(hash);
        green.push(ctx.getImageData(40, 97, 1, 1).data[1]);
      }
      return {
        w: v.videoWidth,
        h: v.videoHeight,
        frames: frames.size,
        switchChange: green.at(-1)! - green[0],
      };
    } finally {
      v.pause();
      v.removeAttribute("src");
      v.load();
      URL.revokeObjectURL(u);
      v.remove();
    }
  }, bytes.toString("base64"));
  expect(result.w).toBe(720);
  expect(result.h).toBe(1280);
  expect(result.frames).toBeGreaterThan(2);
  expect(result.switchChange).toBeGreaterThan(80);
});
