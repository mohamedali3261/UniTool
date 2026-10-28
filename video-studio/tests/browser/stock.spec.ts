import { test, type Browser } from "@playwright/test";
import fs from "node:fs/promises";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

// Generated solid-colour, silent 2-second H.264 fixture, with no third-party content.
const video = readFileSync(
  new URL("../fixtures/stock-video.mp4", import.meta.url),
);
let browser: Browser;
test.beforeAll(async ({ browser: instance }) => {
  browser = instance;
});
const errors = [];
const requests = [];
let ratelimit = 0;
let downloads = 0;
const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Authorization",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Cross-Origin-Resource-Policy": "cross-origin",
};
async function setup(width = 1440, height = 1000, touch = false) {
  const context = await browser.newContext({
    viewport: { width, height },
    hasTouch: touch,
    isMobile: touch,
    deviceScaleFactor: 1,
    acceptDownloads: true,
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(
    new URL(
      "/video-studio.html",
      process.env.STUDIO_QA_URL || "http://localhost:3000",
    ).href,
  );
  const data = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#88be77";
    ctx.fillRect(0, 0, 640, 360);
    ctx.fillStyle = "#153d22";
    ctx.fillRect(140, 80, 180, 180);
    return canvas.toDataURL("image/png").split(",")[1];
  });
  const png = Buffer.from(data, "base64");
  await context.route("https://api.pexels.com/**", async (route) => {
    const req = route.request();
    if (req.method() === "OPTIONS")
      return route.fulfill({ status: 204, headers });
    assert.ok(req.headers().authorization);
    const url = new URL(req.url());
    const query = url.searchParams.get("query") || "";
    const pageNo = +(url.searchParams.get("page") || 1);
    requests.push({
      query,
      page: pageNo,
      path: url.pathname,
      orientation: url.searchParams.get("orientation"),
    });
    if (query === "ratelimit" && ratelimit++ === 0)
      return route.fulfill({ status: 429, headers, body: "{}" });
    if (query === "slow") await new Promise((r) => setTimeout(r, 500));
    const isVideo = url.pathname.startsWith("/videos");
    const entries =
      query === "empty"
        ? []
        : Array.from({ length: 12 }, (_, i) => {
            const id =
              (isVideo ? 20000 : 10000) +
              pageNo * 100 +
              i +
              (query === "cancel" ? 1000 : 0);
            const photo = {
              id,
              width: 4000,
              height: 2250,
              url: `https://www.pexels.com/photo/${id}/`,
              photographer: "Test Artist",
              photographer_url: "https://www.pexels.com/@test-artist/",
              alt: `${query || "curated"} photo ${i}`,
              src: {
                medium: `https://images.pexels.com/photos/${id}/thumb.png`,
                original: `https://images.pexels.com/photos/${id}/original${query === "cancel" ? "-delayed" : ""}.png`,
              },
            };
            return isVideo
              ? {
                  id,
                  width: 640,
                  height: 360,
                  url: `https://www.pexels.com/video/${id}/`,
                  user: {
                    name: "Test Director",
                    url: "https://www.pexels.com/@test-director/",
                  },
                  image: photo.src.medium,
                  duration: 2,
                  video_files: [
                    {
                      file_type: "video/mp4",
                      width: 640,
                      height: 360,
                      link: `https://videos.pexels.com/video/${id}.mp4`,
                    },
                  ],
                }
              : photo;
          });
    await route.fulfill({
      status: 200,
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        [isVideo ? "videos" : "photos"]: entries,
        page: pageNo,
        total_results: 36,
        ...(entries.length && pageNo < 3
          ? { next_page: `https://api.pexels.com/test?page=${pageNo + 1}` }
          : {}),
      }),
    });
  });
  await context.route("https://images.pexels.com/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.includes("original")) downloads++;
    if (url.pathname.includes("delayed"))
      await new Promise((r) => setTimeout(r, 8000));
    await route
      .fulfill({
        status: 200,
        headers: {
          ...headers,
          "Content-Type": "image/png",
          "Content-Length": String(png.length),
        },
        body: png,
      })
      .catch(() => {});
  });
  await context.route("https://videos.pexels.com/**", async (route) => {
    downloads++;
    await route.fulfill({
      status: 200,
      headers: {
        ...headers,
        "Content-Type": "video/mp4",
        "Content-Length": String(video.length),
      },
      body: video,
    });
  });
  await page.getByRole("button", { name: /ابدأ مشروع جديد/ }).click();
  await page.getByRole("button", { name: "مكتبة Pexels", exact: true }).click();
  await page.locator(".stock-card").first().waitFor();
  return { page, context };
}
async function waitCards(page, n = 12) {
  await page.waitForFunction(
    (n) => document.querySelectorAll(".stock-card").length === n,
    n,
  );
}
async function search(page, value) {
  await page.getByRole("textbox", { name: "ابحث في Pexels" }).fill(value);
  await page
    .getByRole("button", { name: "بحث في المكتبة", exact: true })
    .click();
}
async function save(page) {
  const event = page.waitForEvent("download");
  await page.getByRole("button", { name: "حفظ المشروع", exact: true }).click();
  const file = await event;
  return JSON.parse(await fs.readFile(await file.path(), "utf8"));
}
test.afterEach(() => {
  assert.deepEqual(errors, []);
});
// All API/CDN requests are mocked. These tests do not validate the live Pexels key.
test("stock search, previews, image + MP4 import, reuse, keyboard, and portable roundtrip", async () => {
  const { page, context } = await setup();
  await waitCards(page);
  await page.getByRole("button", { name: "عرض لقطات أكثر" }).click();
  await waitCards(page, 24);
  await search(page, "empty");
  await page.getByText("مفيش نتائج لسه", { exact: true }).waitFor();
  await search(page, "ratelimit");
  await page.getByRole("alert").waitFor();
  assert.match(await page.getByRole("alert").innerText(), /حد طلبات/);
  await page.getByRole("button", { name: "أعد المحاولة" }).click();
  await waitCards(page);
  await search(page, "slow");
  await search(page, "fast");
  await waitCards(page);
  await page.waitForTimeout(650);
  assert.ok(
    (
      await page
        .locator(".stock-card-preview")
        .first()
        .getAttribute("aria-label")
    ).includes("fast"),
  );
  await page.getByLabel("إعدادات الأداء", { exact: true }).click();
  await page
    .getByRole("combobox", { name: "جودة المعاينة", exact: true })
    .click();
  await page
    .getByRole("option", { name: "خفيف — 480 بكسل", exact: true })
    .click();
  assert.equal(
    await page.locator(".performance-menu").getAttribute("open"),
    "",
  );
  await page.getByLabel("إعدادات الأداء", { exact: true }).click();
  await page.locator(".stock-card-preview").first().focus();
  await page.keyboard.press("Space");
  await page.locator("dialog").waitFor();
  await page.waitForFunction(
    () => document.querySelector("dialog img")?.naturalWidth > 0,
  );
  await page.keyboard.press("Escape");
  await page.locator("dialog").waitFor({ state: "detached" });
  await page.locator(".stock-card-footer button").first().click();
  await page
    .getByText("تمت الإضافة للخط الزمني — جاهز للتعديل والحفظ والتصدير.", {
      exact: false,
    })
    .waitFor();
  let saved = await save(page);
  assert.equal(saved.project.clips.length, 1);
  assert.equal(saved.assets.length, 1);
  assert.ok(saved.assets[0].url.startsWith("data:image/png"));
  assert.equal(saved.assets[0].source.author, "Test Artist");
  const before = downloads;
  await page.locator(".stock-card-footer button").first().click();
  saved = await save(page);
  assert.equal(saved.project.clips.length, 2);
  assert.equal(saved.assets.length, 1);
  assert.equal(downloads, before);
  await page
    .getByRole("combobox", { name: "مقاس الفيديو", exact: true })
    .click();
  await page.getByRole("option", { name: /9:16/ }).click();
  await page
    .getByRole("combobox", { name: "سرعة المقطع", exact: true })
    .click();
  await page.keyboard.press("s");
  await page.keyboard.press("Escape");
  saved = await save(page);
  assert.equal(saved.project.clips.length, 2);
  assert.equal(saved.project.ratio, "9:16");
  await page.getByRole("button", { name: "فيديوهات", exact: true }).click();
  await waitCards(page);
  await page.locator(".stock-card-preview").first().click();
  await page.waitForFunction(
    () => document.querySelector("dialog video")?.readyState >= 1,
  );
  assert.equal(
    await page.locator("dialog video").evaluate((el) => el.duration),
    2,
  );
  await page
    .getByRole("button", { name: "إضافة للخط الزمني", exact: true })
    .click();
  await page
    .getByRole("button", { name: "إلغاء التنزيل", exact: false })
    .waitFor({ state: "detached" });
  await page.getByRole("button", { name: "إغلاق المعاينة" }).click();
  saved = await save(page);
  assert.equal(saved.project.clips.length, 3);
  assert.ok(
    saved.assets
      .find((a) => a.type === "video")
      .url.startsWith("data:video/mp4"),
  );
  assert.equal(saved.assets.find((a) => a.type === "video").duration, 2);
  await page.getByRole("button", { name: /تصدير/ }).first().click();
  await page
    .getByRole("combobox", { name: "صيغة التصدير", exact: true })
    .click();
  await page.getByRole("option", { name: "WebM", exact: true }).click();
  await page
    .locator(".export-dialog")
    .getByRole("button", { name: "إغلاق", exact: true })
    .click();
  // Reopen the portable project while all Pexels traffic is blocked.
  await context.unroute("https://api.pexels.com/**");
  await context.route("https://api.pexels.com/**", (route) => route.abort());
  await context.unroute("https://images.pexels.com/**");
  await context.route("https://images.pexels.com/**", (route) => route.abort());
  await context.unroute("https://videos.pexels.com/**");
  await context.route("https://videos.pexels.com/**", (route) => route.abort());
  await page
    .locator('input[type=file][accept=".json"]')
    .setInputFiles({
      name: "roundtrip.unitool.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(saved)),
    });
  await page.getByText("تم فتح المشروع بكل ملفاته", { exact: false }).waitFor();
  await context.close();
});
for (const [width, height] of [
  [320, 740],
  [390, 844],
  [768, 1024],
  [844, 390],
]) {
  test(`touch ${width}x${height}: responsive menus, preview and cancellation`, async () => {
    const { page, context } = await setup(width, height, true);
    await waitCards(page);
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `overflow ${width}`,
    );
    await page
      .getByRole("combobox", { name: "اتجاه لقطة Pexels", exact: true })
      .click();
    const box = await page.getByRole("listbox").boundingBox();
    assert.ok(
      box.x >= 0 &&
        box.x + box.width <= width + 1 &&
        box.y >= 0 &&
        box.y + box.height <= height + 1,
      `dropdown outside viewport ${width}: ${JSON.stringify(box)}`,
    );
    await page.getByRole("option", { name: "رأسي", exact: true }).click();
    await waitCards(page);
    await page.locator(".stock-card-preview").first().click();
    const dialogBox = await page.locator("dialog").boundingBox();
    assert.ok(dialogBox.width <= width - 20);
    await page.getByRole("button", { name: "إغلاق المعاينة" }).click();
    if (width === 390) {
      await page
        .getByRole("combobox", { name: "جودة إضافة Pexels", exact: true })
        .click();
      await page.getByRole("option", { name: "Full HD", exact: true }).click();
      await page.locator(".stock-card-footer button").first().click();
      await page
        .getByText("تمت الإضافة للخط الزمني — جاهز للتعديل والحفظ والتصدير.", {
          exact: false,
        })
        .waitFor();
      await search(page, "cancel");
      await waitCards(page);
      await page.locator(".stock-card-footer button").first().click();
      await page
        .getByRole("button", { name: "إلغاء تنزيل Pexels", exact: true })
        .click();
      await page
        .getByText("تم إلغاء التنزيل؛ لم يتغير مشروعك.", { exact: false })
        .waitFor();
      const project = await save(page);
      assert.equal(project.project.clips.length, 1);
      assert.equal(project.assets[0].source.quality, "fullhd");
      await page
        .getByRole("button", { name: "طبيعة", exact: true })
        .count()
        .then(async (n) => {
          if (n)
            await page
              .getByRole("button", { name: "طبيعة", exact: true })
              .click();
        });
    }
    await context.close();
  });
}
