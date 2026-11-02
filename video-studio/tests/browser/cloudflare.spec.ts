import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs/promises";
const base = process.env.STUDIO_QA_URL || "http://localhost:3000";
async function save(page: Page) {
  const d = page.waitForEvent("download");
  await page.getByRole("button", { name: "حفظ المشروع", exact: true }).click();
  return JSON.parse(await fs.readFile(await (await d).path(), "utf8"));
}
async function hash(page: Page, selector = ".canvas-stage canvas") {
  return page.locator(selector).evaluate((c: HTMLCanvasElement) => {
    const s = document.createElement("canvas");
    s.width = 72;
    s.height = 128;
    const ctx = s.getContext("2d")!;
    ctx.drawImage(c, 0, 0, 72, 128);
    let h = 2166136261;
    for (const n of ctx.getImageData(0, 0, 72, 128).data)
      h = Math.imul(h ^ n, 16777619);
    return h >>> 0;
  });
}
for (const mobile of [false, true])
  test(`Cloudflare editable reel builds all scenes and persists on ${mobile ? "mobile" : "desktop"}`, async ({
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
      .getByRole("button", { name: "استخدم قالب Cloudflare ↗", exact: true })
      .click();
    await expect(page.locator(".timeline-clip")).toHaveCount(7);
    const original = await save(page);
    expect(original.project.texts).toHaveLength(215);
    expect(original.project.overlays).toHaveLength(2);
    expect(
      original.project.markers.map((m: { time: number }) => m.time),
    ).toEqual([0, 4, 16, 28, 40, 52, 60]);
    if (!mobile)
      for (const [a, b] of [
        [0.7, 2.8],
        [4.8, 8.2],
        [16.8, 18.2],
        [28.7, 31],
        [41, 46.8],
        [54.7, 58.8],
        [61.1, 65.1],
      ]) {
        await page
          .getByRole("spinbutton", { name: "الانتقال إلى ثانية", exact: true })
          .fill(String(a));
        await page.waitForTimeout(80);
        const first = await hash(page);
        await page
          .getByRole("spinbutton", { name: "الانتقال إلى ثانية", exact: true })
          .fill(String(b));
        await expect.poll(() => hash(page)).not.toBe(first);
      }
    await page.getByRole("button", { name: "النصوص", exact: true }).click();
    if (mobile) {
      await page
        .getByRole("combobox", { name: "اختيار النص للتعديل", exact: true })
        .click();
      await page.getByRole("option", { name: /اسم حسابك الثابت/ }).click();
    } else
      await page
        .locator(".text-object-name")
        .filter({ hasText: "اسم حسابك الثابت" })
        .click();
    await page
      .getByRole("textbox", { name: "محتوى النص", exact: true })
      .fill("@mybrand");
    const changed = await save(page);
    expect(
      changed.project.texts.find(
        (t: { name: string }) => t.name === "اسم حسابك الثابت",
      ).text,
    ).toBe("@mybrand");
    await page
      .locator('input[type=file][accept=".json"]')
      .setInputFiles({
        name: "cloudflare.json",
        mimeType: "application/json",
        buffer: Buffer.from(JSON.stringify(changed)),
      });
    await expect(page.locator(".timeline-clip")).toHaveCount(7);
    expect(
      (await save(page)).project.overlays.every(
        (l: { foreground: boolean }) => l.foreground,
      ),
    ).toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(errors).toEqual([]);
    await page.screenshot({
      path: info.outputPath(`cloudflare-${mobile ? "mobile" : "desktop"}.png`),
    });
    await context.close();
  });
test("standalone HTML edits identity, counter motion and photo without external requests", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const external: string[] = [];
  page.on("request", (r) => {
    if (
      !r.url().startsWith(base) &&
      !r.url().startsWith("data:") &&
      !r.url().startsWith("blob:")
    )
      external.push(r.url());
  });
  await page.goto(`${base}/video-studio-templates/cloudflare-checklist.html`);
  await page
    .getByRole("textbox", { name: "اسم الحساب", exact: true })
    .fill("@creator");
  const portrait = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 80;
    const x = c.getContext("2d")!;
    x.fillStyle = "#f6821f";
    x.fillRect(0, 0, 80, 80);
    return c.toDataURL("image/png").split(",")[1];
  });
  await page
    .getByLabel("صورتك", { exact: true })
    .setInputFiles({
      name: "portrait.png",
      mimeType: "image/png",
      buffer: Buffer.from(portrait, "base64"),
    });
  const counterId = await page
    .locator("#layer option")
    .filter({ hasText: "عدّاد الاستجابة" })
    .getAttribute("value");
  await page.locator("#layer").selectOption(counterId!);
  await page.getByText("نقاط الحركة والعدّاد (JSON)", { exact: true }).click();
  await page
    .getByRole("textbox", { name: "نقاط الحركة", exact: true })
    .fill(
      JSON.stringify({
        counter: { from: 2.4, to: 0.2, duration: 2, decimals: 1, suffix: "s" },
      }),
    );
  await page.getByRole("button", { name: "تطبيق الحركة", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("تم تطبيق الحركة");
  await page.getByRole("button", { name: "Cache", exact: true }).click();
  const a = await hash(page, "#video");
  await page.locator("#seek").evaluate((e: HTMLInputElement) => {
    e.value = "31";
    e.dispatchEvent(new Event("input"));
  });
  expect(await hash(page, "#video")).not.toBe(a);
  const d = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "تنزيل مشروع التعديل JSON", exact: true })
    .click();
  const json = JSON.parse(await fs.readFile(await (await d).path(), "utf8"));
  expect(
    json.project.texts
      .filter((t: { name: string }) =>
        ["اسم حسابك الثابت", "اسم الحساب الختامي"].includes(t.name),
      )
      .every((t: { text: string }) => t.text === "@creator"),
  ).toBe(true);
  expect(json.assets[1].url).toMatch(/^data:image\/png/);
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
  for (const [name, time] of [
    ["hook", 2.8],
    ["database", 9],
    ["secrets", 22.5],
    ["cache", 32],
    ["preview", 47],
    ["monitor", 55.4],
    ["cta", 65],
  ] as const) {
    await page.locator("#seek").evaluate((e: HTMLInputElement, t) => {
      e.value = String(t);
      e.dispatchEvent(new Event("input"));
    }, time);
    await page
      .locator("#video")
      .screenshot({ path: info.outputPath(`${name}.png`) });
  }
});
test("standalone renders full 66s MP4 at 720x1280 with changing decoded scenes", async ({
  page,
}) => {
  test.setTimeout(160000);
  await page.goto(`${base}/video-studio-templates/cloudflare-checklist.html`);
  const pending = page.waitForEvent("download", { timeout: 140000 });
  await page.getByRole("button", { name: "تصدير MP4", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("جارٍ التصدير");
  const file = await pending;
  await file.saveAs("/home/user/cloudflare-checklist.mp4");
  const bytes = await fs.readFile(await file.path());
  const result = await page.evaluate(async (b64) => {
    const v = document.createElement("video");
    v.muted = true;
    v.playsInline = true;
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
      const hashes = new Set<number>();
      for (const t of [1, 3, 8, 20, 31, 47, 55, 62, 65]) {
        await new Promise<void>((r, j) => {
          const timer = setTimeout(() => j(Error("seek timeout")), 5000);
          v.onseeked = () => {
            clearTimeout(timer);
            r();
          };
          v.currentTime = t;
        });
        ctx.drawImage(v, 0, 0, 72, 128);
        let h = 2166136261;
        for (const n of ctx.getImageData(0, 0, 72, 128).data)
          h = Math.imul(h ^ n, 16777619);
        hashes.add(h);
      }
      return {
        w: v.videoWidth,
        h: v.videoHeight,
        d: v.duration,
        unique: hashes.size,
      };
    } finally {
      v.removeAttribute("src");
      v.load();
      URL.revokeObjectURL(u);
    }
  }, bytes.toString("base64"));
  expect(result.w).toBe(720);
  expect(result.h).toBe(1280);
  expect(result.d).toBeGreaterThan(65);
  expect(result.d).toBeLessThan(68);
  expect(result.unique).toBe(9);
});
test("editor MP4 preserves foreground avatar over editable gradient and UI layers", async ({
  page,
}) => {
  const data = JSON.parse(
    await fs.readFile(
      "public/video-studio-templates/cloudflare-checklist.json",
      "utf8",
    ),
  );
  data.project.clips = [{ ...data.project.clips[0], end: 2 }];
  data.project.markers = [];
  data.project.texts = data.project.texts
    .filter((t: { start: number }) => t.start < 2)
    .map((t: { end: number }) => ({ ...t, end: Math.min(t.end, 2) }));
  data.project.overlays = [{ ...data.project.overlays[0], end: 2 }];
  await page.goto(`${base}/video-studio.html`);
  await page
    .locator('input[type=file][accept=".json"]')
    .setInputFiles({
      name: "cloudflare-short.json",
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
  const pixel = await page.evaluate(async (b64) => {
    const v = document.createElement("video");
    v.muted = true;
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
      await new Promise<void>((r) => {
        v.onseeked = () => r();
        v.currentTime = 1;
      });
      const c = document.createElement("canvas");
      c.width = v.videoWidth;
      c.height = v.videoHeight;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(v, 0, 0);
      return [
        ...ctx.getImageData(
          Math.round(c.width * 0.19),
          Math.round(c.height * 0.92),
          1,
          1,
        ).data,
      ];
    } finally {
      v.removeAttribute("src");
      v.load();
      URL.revokeObjectURL(u);
    }
  }, bytes.toString("base64"));
  expect(pixel[0]).toBeGreaterThan(100);
  expect(pixel[1]).toBeGreaterThan(100);
  expect(pixel[2]).toBeGreaterThan(100);
});
