import { test, expect } from "@playwright/test";
const base = process.env.STUDIO_QA_URL || "http://localhost:3000";
test.use({
  launchOptions: {
    executablePath: process.env.STUDIO_CHROMIUM_PATH || undefined,
    args: [
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--autoplay-policy=user-gesture-required",
    ],
  },
});
for (const mobile of [false, true])
  test(`timeline does not activate preview transforms; canvas click does ${mobile ? "touch" : "desktop"}`, async ({
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
    await page.locator(".template-card").first().click();
    await page.locator(".timeline-clip").first().click();
    await expect(page.locator(".preview-selection")).toHaveCount(0);
    const target = page.locator(".preview-interaction");
    await target.click({ position: { x: 30, y: 30 } });
    await expect(page.locator(".preview-selection")).toHaveCount(1);
    await page.locator(".timeline-clip").nth(1).click();
    await expect(page.locator(".preview-selection")).toHaveCount(0);
    await target.click({ position: { x: 30, y: 30 } });
    await expect(page.locator(".preview-selection")).toHaveCount(1);
    await target.press("Escape");
    await expect(page.locator(".preview-selection")).toHaveCount(0);
    await context.close();
  });
test("strict autoplay: primary music and future cue start from Play and Space, and pause together", async ({
  page,
}) => {
  await page.goto(`${base}/video-studio.html`);
  await page
    .getByRole("button", { name: "استخدم قالب NOVA ↗", exact: true })
    .click();
  await page.getByRole("button", { name: "الصوت", exact: true }).click();
  await page
    .getByRole("button", { name: "أضف جرس بلوري", exact: true })
    .click();
  await expect(page.locator(".sfx-timeline-cue")).toHaveCount(1);
  await page
    .getByRole("spinbutton", { name: "توقيت المؤثر 1", exact: true })
    .fill("1");
  const cue = page.locator("audio[data-sound-cue]"),
    music = page.locator(".preview-area audio").last();
  await page.locator(".player-controls .play-button").click();
  await expect
    .poll(() =>
      music.evaluate(
        (a: HTMLAudioElement) =>
          !a.paused && a.volume > 0 && a.currentTime > 0.2,
      ),
    )
    .toBe(true);
  await expect
    .poll(
      () =>
        cue.evaluate(
          (a: HTMLAudioElement) =>
            !a.paused && a.volume > 0 && a.currentTime > 0.05,
        ),
      { timeout: 5000 },
    )
    .toBe(true);
  await page.locator(".player-controls .play-button").click();
  await expect
    .poll(() => cue.evaluate((a: HTMLAudioElement) => a.paused))
    .toBe(true);
  await expect
    .poll(() => music.evaluate((a: HTMLAudioElement) => a.paused))
    .toBe(true);
  await page.locator(".player-controls .play-button").focus();
  await page.keyboard.press("Tab");
  await page.locator(".editor-shell").click({ position: { x: 2, y: 2 } });
  await page.keyboard.press("Space");
  await expect
    .poll(() => music.evaluate((a: HTMLAudioElement) => !a.paused))
    .toBe(true);
  await page.keyboard.press("Space");
  await expect
    .poll(() => music.evaluate((a: HTMLAudioElement) => a.paused))
    .toBe(true);
  await expect(page.getByRole("alert")).toHaveCount(0);
});
test("blocked audio has an actionable error and can recover on retry", async ({
  page,
}) => {
  await page.goto(`${base}/video-studio.html`);
  await page
    .getByRole("button", { name: "استخدم قالب NOVA ↗", exact: true })
    .click();
  await page.evaluate(() => {
    const original = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      if (!this.dataset.blockedOnce) {
        this.dataset.blockedOnce = "1";
        return Promise.reject(new DOMException("blocked", "NotAllowedError"));
      }
      return original.call(this);
    };
  });
  await page.locator(".player-controls .play-button").click();
  await expect(page.getByRole("alert")).toContainText("المتصفح منع الصوت");
  await page
    .getByRole("button", { name: "إعادة تفعيل الصوت", exact: true })
    .click();
  await expect
    .poll(() =>
      page
        .locator(".preview-area audio")
        .last()
        .evaluate((a: HTMLAudioElement) => !a.paused && a.currentTime > 0.1),
    )
    .toBe(true);
  await expect(page.getByRole("alert")).toHaveCount(0);
});
