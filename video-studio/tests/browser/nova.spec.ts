import { test, expect } from "@playwright/test";
import fs from "node:fs/promises";
const base = process.env.STUDIO_QA_URL || "http://localhost:3000";
for (const mobile of [false, true])
  test(`NOVA preview and editable audiovisual project ${mobile ? "mobile" : "desktop"}`, async ({
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
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`${base}/video-studio.html`);
    await page.getByRole("button", { name: "اسمع موسيقى القالب" }).click();
    await expect(
      page.getByRole("button", { name: "إيقاف العينة مؤقتًا" }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect
      .poll(() => page.locator(".nova-demo time").textContent())
      .not.toContain("00:00 /");
    await page.getByRole("button", { name: "إيقاف العينة مؤقتًا" }).click();
    await page
      .getByRole("button", { name: "استخدم قالب NOVA ↗", exact: true })
      .click();
    await expect(page.locator(".editor-shell")).toBeVisible({ timeout: 20000 });
    await expect(page.locator(".timeline-clip")).toHaveCount(6);
    const audio = page.locator(".preview-area audio");
    await expect(audio).toHaveAttribute("src", /^blob:/);
    await page.locator(".player-controls .play-button").click();
    await expect
      .poll(() => audio.evaluate((a: HTMLAudioElement) => a.currentTime))
      .toBeGreaterThan(0.25);
    await page.locator(".player-controls .play-button").click();
    if (mobile) await page.locator(".toast button").click();
    await page.getByRole("button", { name: "الصوت", exact: true }).click();
    await expect(page.locator(".library-panel .asset-card")).toHaveCount(3);
    const pending = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "حفظ المشروع", exact: true })
      .click();
    const data = JSON.parse(
      await fs.readFile(await (await pending).path(), "utf8"),
    );
    expect(data.project.clips).toHaveLength(6);
    expect(data.project.texts).toHaveLength(12);
    expect(data.project.ratio).toBe("16:9");
    expect(
      data.assets.filter((a: { type: string }) => a.type === "audio"),
    ).toHaveLength(1);
    expect(
      data.assets.find((a: { id: string }) => a.id === data.project.audioId)
        .duration,
    ).toBeCloseTo(24, 0);
    expect(
      data.project.clips
        .slice(1)
        .every(
          (c: { transition?: { kind: string } }) =>
            c.transition?.kind !== "none",
        ),
    ).toBe(true);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(mobile ? 390 : 1440);
    await page.locator('input[type=file][accept=".json"]').setInputFiles({
      name: "nova-roundtrip.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(data)),
    });
    await expect(page.locator(".preview-area audio").last()).toHaveAttribute(
      "src",
      /^data:audio/,
      { timeout: 20000 },
    );
    await expect(page.locator(".timeline-clip")).toHaveCount(6);
    expect(errors).toEqual([]);
    await context.close();
  });
