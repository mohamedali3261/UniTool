import { test, expect } from "@playwright/test";
import fs from "node:fs/promises";
const base = process.env.STUDIO_QA_URL || "http://localhost:3000";
for (const mobile of [false, true])
  test(`56 sounds preview, mix, edit, delete and save ${mobile ? "mobile" : "desktop"}`, async ({
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
    await page.goto(`${base}/video-studio.html`);
    await page
      .getByRole("button", { name: "استخدم قالب NOVA ↗", exact: true })
      .click();
    await page.getByRole("button", { name: "الصوت", exact: true }).click();
    await expect(page.locator(".sound-card")).toHaveCount(56);
    await page
      .getByRole("button", { name: "اسمع مرور هوائي", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "اسمع مرور هوائي", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await page
      .getByRole("button", { name: "أضف مرور هوائي", exact: true })
      .click();
    await expect(page.locator(".sfx-timeline-cue")).toHaveCount(1);
    await page.getByRole("textbox", { name: "ابحث عن صوت" }).fill("جرس");
    await expect(page.locator(".sound-card")).toHaveCount(1);
    await page
      .getByRole("button", { name: "أضف جرس بلوري", exact: true })
      .click();
    await page
      .getByRole("spinbutton", { name: "توقيت المؤثر 2", exact: true })
      .fill("4");
    await page
      .getByRole("slider", { name: "مستوى المؤثر 2", exact: true })
      .fill("0.4");
    await page
      .getByRole("button", { name: "حذف المؤثر 1", exact: true })
      .click();
    await expect(page.locator(".sfx-timeline-cue")).toHaveCount(1);
    const download = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "حفظ المشروع", exact: true })
      .click();
    const data = JSON.parse(
      await fs.readFile(await (await download).path(), "utf8"),
    );
    expect(data.project.sounds).toHaveLength(1);
    expect(data.project.sounds[0].at).toBe(4);
    expect(data.project.sounds[0].volume).toBe(0.4);
    expect(
      data.assets.find((a: { id: string }) => a.id === data.project.audioId)
        .name,
    ).toContain("الموسيقى + أصوات الانتقال");
    expect(
      data.assets.some(
        (a: { id: string }) => a.id === data.project.sounds[0].assetId,
      ),
    ).toBe(true);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(mobile ? 390 : 1440);
    await context.close();
  });

for (const format of ["webm", "mp4"])
  test(`scheduled sound cue survives JSON reload and is audible at the right time in ${format}`, async ({
    page,
  }) => {
    test.setTimeout(90000);
    await page.goto(`${base}/video-studio.html`);
    await page
      .getByRole("button", { name: "استخدم قالب NOVA ↗", exact: true })
      .click();
    await page.getByRole("button", { name: "الصوت", exact: true }).click();
    await page
      .getByRole("button", { name: "أضف ضربة عميقة", exact: true })
      .click();
    await expect(page.locator(".sfx-timeline-cue")).toHaveCount(1);
    const saved = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "حفظ المشروع", exact: true })
      .click();
    const data = JSON.parse(
      await fs.readFile(await (await saved).path(), "utf8"),
    );
    data.project.clips = [{ ...data.project.clips[0], end: 3 }];
    data.project.texts = [];
    data.project.markers = [];
    data.project.audioId = null;
    data.project.sounds[0].at = 1;
    await page.locator('input[type=file][accept=".json"]').setInputFiles({
      name: "cue-test.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(data)),
    });
    await expect(page.locator(".timeline-clip")).toHaveCount(1);
    await expect(page.locator("audio[data-sound-cue]")).toHaveCount(1);
    await page.locator(".player-controls .play-button").click();
    await expect
      .poll(() =>
        page
          .locator("audio[data-sound-cue]")
          .evaluate((a: HTMLAudioElement) => a.currentTime),
      )
      .toBeGreaterThan(0.1);
    await page.locator(".player-controls .play-button").click();
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
    const exported = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "تصدير الفيديو", exact: true })
      .click();
    const bytes = await fs.readFile(await (await exported).path());
    const decoded = await page.evaluate(async (b64) => {
      const ctx = new AudioContext();
      try {
        const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
        const b = await ctx.decodeAudioData(bytes.buffer);
        const samples = b.getChannelData(0);
        const energy = (a: number, z: number) => {
          let sum = 0;
          for (
            let i = Math.floor(a * b.sampleRate);
            i < Math.min(samples.length, z * b.sampleRate);
            i++
          )
            sum += samples[i] ** 2;
          return sum / ((z - a) * b.sampleRate);
        };
        return {
          duration: b.duration,
          before: energy(0.1, 0.7),
          cue: energy(1, 1.5),
          after: energy(2, 2.7),
        };
      } finally {
        await ctx.close();
      }
    }, bytes.toString("base64"));
    expect(decoded.duration).toBeGreaterThan(2.7);
    expect(decoded.cue).toBeGreaterThan(0.0005);
    expect(decoded.before).toBeLessThan(decoded.cue / 20);
    expect(decoded.after).toBeLessThan(decoded.cue / 20);
  });
