import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs/promises";
const base = process.env.STUDIO_QA_URL || "http://localhost:3000";
async function save(page: Page) {
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "حفظ المشروع", exact: true }).click();
  return JSON.parse(await fs.readFile(await (await pending).path(), "utf8"));
}
for (const mobile of [false, true])
  for (const [id, name, scenes] of [
    ["orbit-launch", "ORBIT", 5],
    ["paper-stories", "PAPER", 6],
  ] as const) {
    test(`${id} is independently editable, portable and plays on ${mobile ? "mobile" : "desktop"}`, async ({
      browser,
    }, info) => {
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
      await page
        .locator(".template-card")
        .filter({ has: page.getByRole("heading", { name: new RegExp(name) }) })
        .click();
      await expect(page.locator(".timeline-clip")).toHaveCount(scenes);
      const original = await save(page);
      await fs.writeFile(
        info.outputPath(`${id}.json`),
        JSON.stringify(original, null, 2),
      );
      expect(original.project.texts.length).toBeGreaterThan(50);
      expect(original.assets).toHaveLength(1);
      expect(
        original.project.clips.every(
          (c: { designScene?: string }) => !c.designScene,
        ),
      ).toBe(true);
      await page.getByRole("button", { name: "النصوص", exact: true }).click();
      if (mobile) {
        await page
          .getByRole("combobox", { name: "اختيار النص للتعديل", exact: true })
          .click();
        await page
          .getByRole("option", {
            name: new RegExp(
              id === "orbit-launch" ? "لوحة الشعار" : "الورقة المرجانية",
            ),
          })
          .click();
      } else
        await page
          .locator(".text-object-name")
          .filter({
            hasText: id === "orbit-launch" ? "لوحة الشعار" : "الورقة المرجانية",
          })
          .click();
      await expect(
        page.getByRole("spinbutton", { name: "عرض الشكل", exact: true }),
      ).toBeVisible();
      await page
        .getByRole("spinbutton", { name: "عرض الشكل", exact: true })
        .fill("600");
      await page.getByLabel("لون الشكل", { exact: true }).fill("#125fa0");
      await page
        .getByRole("textbox", { name: "اسم العنصر", exact: true })
        .fill("كارت مخصص");
      const updated = await save(page);
      const layer = updated.project.texts.find(
        (t: { name: string }) => t.name === "كارت مخصص",
      );
      expect(layer.box.width).toBe(600);
      expect(layer.background).toBe("#125fa0");
      expect(
        updated.project.texts.filter((t: { id: string }) => t.id !== layer.id),
      ).toEqual(
        original.project.texts.filter((t: { id: string }) => t.id !== layer.id),
      );
      await page.locator('input[type=file][accept=".json"]').setInputFiles({
        name: `${id}.json`,
        mimeType: "application/json",
        buffer: Buffer.from(JSON.stringify(updated)),
      });
      await expect(page.locator(".timeline-clip")).toHaveCount(scenes);
      expect(
        (await save(page)).project.texts.find(
          (t: { id: string }) => t.id === layer.id,
        ).box.width,
      ).toBe(600);
      if (mobile)
        await page
          .getByRole("button", { name: "تم والعودة للتايم لاين", exact: true })
          .click();
      // The playhead moves smoothly between the throttled heavy-panel React updates.
      await page.getByRole("button", { name: "تشغيل", exact: true }).click();
      await expect(
        page.getByRole("button", { name: "إيقاف", exact: true }),
      ).toBeVisible();
      await page.waitForTimeout(650);
      const a = await page
        .locator(".playhead")
        .evaluate((el) => el.getBoundingClientRect().x);
      // Software rendering/parallel encoders can delay one presentation tick.
      // Wait for actual progress rather than assuming a frame within 90ms.
      await expect
        .poll(
          () =>
            page
              .locator(".playhead")
              .evaluate((el) => el.getBoundingClientRect().x),
          { timeout: 2000 },
        )
        .toBeGreaterThan(a);
      await page.getByRole("button", { name: "إيقاف", exact: true }).click();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      expect(errors).toEqual([]);
      await page.screenshot({
        path: info.outputPath(`${id}-${mobile ? "mobile" : "desktop"}.png`),
      });
      await context.close();
    });
  }
test("edited vector color and geometry survive real MP4 encoding", async ({
  page,
}) => {
  const data = JSON.parse(
    await fs.readFile(
      "public/video-studio-templates/orbit-launch.json",
      "utf8",
    ),
  );
  data.project.clips = [{ ...data.project.clips[0], end: 2 }];
  data.project.markers = [];
  data.project.texts = data.project.texts
    .filter((t: { start: number }) => t.start < 2)
    .map((t: { name: string; end: number }) => ({
      ...t,
      end: 2,
      ...(t.name === "لوحة الشعار" ? { background: "#125fa0" } : {}),
    }));
  await page.goto(`${base}/video-studio.html`);
  await page.locator('input[type=file][accept=".json"]').setInputFiles({
    name: "editable-export.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(data)),
  });
  await expect(page.locator(".timeline-clip")).toHaveCount(1);
  await page.getByRole("button", { name: /تصدير/ }).first().click();
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
  const bytes = await fs.readFile(await (await pending).path());
  const result = await page.evaluate(async (b64) => {
    const v = document.createElement("video");
    v.muted = true;
    v.playsInline = true;
    const url = URL.createObjectURL(
      new Blob([Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))], {
        type: "video/mp4",
      }),
    );
    try {
      await new Promise<void>((r, j) => {
        v.onloadeddata = () => r();
        v.onerror = () => j(Error("decode"));
        v.src = url;
      });
      await new Promise<void>((r) => {
        v.onseeked = () => r();
        v.currentTime = 1.4;
      });
      const c = document.createElement("canvas");
      c.width = v.videoWidth;
      c.height = v.videoHeight;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(v, 0, 0);
      return {
        pixel: [
          ...ctx.getImageData(
            Math.round(c.width * 0.5),
            Math.round(c.height * 0.7),
            1,
            1,
          ).data,
        ],
        h: v.videoHeight,
        duration: v.duration,
      };
    } finally {
      v.pause();
      v.removeAttribute("src");
      v.load();
      URL.revokeObjectURL(url);
    }
  }, bytes.toString("base64"));
  expect(result.h).toBe(480);
  expect(result.duration).toBeGreaterThan(1.8);
  expect(result.pixel[2]).toBeGreaterThan(result.pixel[0] + 90);
  expect(result.pixel[1]).toBeGreaterThan(65);
});
