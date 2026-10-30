import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs/promises";
const base = process.env.STUDIO_QA_URL || "http://localhost:3000";
const fixture = await fs.readFile(
  "video-studio/tests/fixtures/stock-video.mp4",
);
async function start(page: Page) {
  await page.goto(`${base}/video-studio.html`);
  await page.getByRole("button", { name: /ابدأ مشروع جديد/ }).click();
}
async function input(
  page: Page,
  files: { name: string; mimeType: string; buffer: Buffer }[],
) {
  await page.locator('input[type="file"]').first().setInputFiles(files);
  await expect(page.locator(".busy-overlay")).toHaveCount(0, {
    timeout: 40000,
  });
}
for (const mobile of [true, false])
  test(`local video import opens populated timeline and selects appended clip ${mobile ? "mobile" : "desktop"}`, async ({
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
    await start(page);
    await input(page, [
      {
        name: "camera.MP4",
        mimeType: "application/octet-stream",
        buffer: fixture,
      },
    ]);
    await expect(page.locator(".timeline")).toBeVisible();
    await expect(page.locator(".timeline-clip")).toHaveCount(1);
    await expect(page.locator(".timeline-clip.selected")).toHaveCount(1);
    await expect
      .poll(() =>
        page.locator(".canvas-stage canvas").evaluate((c: HTMLCanvasElement) =>
          Array.from(
            c.getContext("2d")!.getImageData(c.width / 2, c.height / 2, 1, 1)
              .data,
          )
            .slice(0, 3)
            .some((v) => v > 40),
        ),
      )
      .toBe(true);
    await input(page, [
      {
        name: "broken.mkv",
        mimeType: "application/octet-stream",
        buffer: Buffer.from("broken"),
      },
      { name: "second.mp4", mimeType: "", buffer: fixture },
    ]);
    await expect(page.locator(".timeline-clip")).toHaveCount(2);
    await expect(page.locator(".timeline-clip.selected")).toContainText(
      "second.mp4",
    );
    await expect(page.locator(".import-issues")).toContainText("broken.mkv");
    const download = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "حفظ المشروع", exact: true })
      .click();
    const data = JSON.parse(
      await fs.readFile((await (await download).path())!, "utf8"),
    );
    expect(data.project.clips).toHaveLength(2);
    expect(data.assets).toHaveLength(2);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await context.close();
  });
test("unsupported metadata probe can be cancelled without blocking the editor", async ({
  page,
}) => {
  await start(page);
  // Hold the decoder callback to exercise cancellation deterministically, not a specific corrupt codec timeout.
  await page.evaluate(() => {
    const original = URL.createObjectURL.bind(URL);
    (window as any).__originalURL = original;
    URL.createObjectURL = () => "blob:held-import";
    const setter = Object.getOwnPropertyDescriptor(
      HTMLMediaElement.prototype,
      "src",
    )!;
    (window as any).__mediaSrc = setter;
    Object.defineProperty(HTMLMediaElement.prototype, "src", {
      configurable: true,
      get: setter.get,
      set() {},
    });
  });
  await page.locator('input[type="file"]').first().setInputFiles({
    name: "held.mp4",
    mimeType: "video/mp4",
    buffer: fixture,
  });
  await page
    .getByRole("button", { name: "إلغاء استيراد الوسائط", exact: true })
    .click();
  await expect(page.locator(".busy-overlay")).toHaveCount(0);
  await expect(page.locator(".timeline-clip")).toHaveCount(0);
  await page.evaluate(() => {
    URL.createObjectURL = (window as any).__originalURL;
    Object.defineProperty(
      HTMLMediaElement.prototype,
      "src",
      (window as any).__mediaSrc,
    );
  });
  await input(page, [
    { name: "retry.mp4", mimeType: "video/mp4", buffer: fixture },
  ]);
  await expect(page.locator(".timeline-clip")).toHaveCount(1);
});
test("300 MiB local video uses file-backed import, reduced preview and one thumbnail", async ({
  page,
}) => {
  test.setTimeout(60000);
  await start(page);
  await page.evaluate(
    ({ base64 }) => {
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const padding = new Blob([new Uint8Array(1024 * 1024)]);
      const file = new File([bytes, ...Array(300).fill(padding)], "large.mp4", {
        type: "video/mp4",
      });
      const transfer = new DataTransfer();
      transfer.items.add(file);
      const el = document.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;
      el.files = transfer.files;
      el.dispatchEvent(new Event("change", { bubbles: true }));
    },
    { base64: fixture.toString("base64") },
  );
  await expect(page.locator(".busy-overlay")).toHaveCount(0, {
    timeout: 45000,
  });
  await expect(page.locator(".timeline-clip")).toHaveCount(1);
  await expect(page.locator(".timeline")).toBeVisible();
  expect(await page.locator(".canvas-stage canvas").getAttribute("width")).toBe(
    "480",
  );
  await expect(page.locator(".timeline-thumbnails img")).toHaveCount(1, {
    timeout: 15000,
  });
  await page
    .getByRole("textbox", { name: "اسم المشروع", exact: true })
    .fill("ملف كبير قابل للتعديل");
  await expect(
    page.getByRole("textbox", { name: "اسم المشروع", exact: true }),
  ).toHaveValue("ملف كبير قابل للتعديل");
});
test("56 motion cards apply a trajectory that survives JSON save", async ({
  page,
}) => {
  await start(page);
  await input(page, [
    { name: "motion.mp4", mimeType: "video/mp4", buffer: fixture },
  ]);
  await page
    .locator(".creative-tools")
    .getByText("تحريك الصورة وKeyframes", { exact: true })
    .click();
  await page.getByText("استعراض كروت الحركات (56)", { exact: true }).click();
  await expect(page.locator(".motion-card")).toHaveCount(56);
  await page
    .getByRole("textbox", { name: "البحث في الحركات", exact: true })
    .fill("حلزون");
  await expect(page.locator(".motion-card")).toHaveCount(1);
  await page
    .getByRole("button", { name: "تطبيق حركة حلزون", exact: true })
    .click();
  await expect(
    page.getByRole("combobox", { name: "حركة الصورة", exact: true }),
  ).toContainText("حلزون");
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "حفظ المشروع", exact: true }).click();
  const saved = JSON.parse(
    await fs.readFile((await (await pending).path())!, "utf8"),
  );
  expect(saved.project.clips[0].motion).toBe("loop-spiral");
});

test("appending beyond the visible timeline scrolls to the newly imported clip", async ({
  page,
}) => {
  await start(page);
  const data = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = 16;
    c.height = 9;
    return c.toDataURL();
  });
  const project = {
    version: 1,
    assets: [
      {
        id: "long",
        name: "long.png",
        type: "image",
        duration: 7200,
        url: data,
      },
    ],
    project: {
      name: "Long timeline",
      ratio: "16:9",
      audioId: null,
      audioVolume: 0.7,
      texts: [],
      clips: [
        {
          id: "long-clip",
          assetId: "long",
          start: 0,
          end: 7200,
          speed: 1,
          volume: 1,
          filter: "original",
          brightness: 1,
          contrast: 1,
          saturation: 1,
        },
      ],
    },
  };
  await page
    .locator('input[accept=".json"]')
    .setInputFiles({
      name: "long.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(project)),
    });
  await input(page, [
    { name: "append.mp4", mimeType: "video/mp4", buffer: fixture },
  ]);
  await expect(page.locator(".timeline-clip.selected")).toContainText(
    "append.mp4",
  );
  await expect
    .poll(() =>
      page.locator(".timeline-scroll").evaluate((el) => el.scrollLeft),
    )
    .toBeGreaterThan(100000);
  const clip = (await page.locator(".timeline-clip.selected").boundingBox())!,
    view = (await page.locator(".timeline-scroll").boundingBox())!;
  expect(clip.x).toBeGreaterThanOrEqual(view.x);
  expect(clip.x).toBeLessThan(view.x + view.width);
  expect(await page.locator(".ruler > span").count()).toBeLessThan(100);
});
