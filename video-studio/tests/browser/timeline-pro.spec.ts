import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs/promises";
const base = process.env.STUDIO_QA_URL || "http://localhost:3000";
function wave() {
  const count = 8000,
    buffer = Buffer.alloc(44 + count * 2);
  buffer.write("RIFF");
  buffer.writeUInt32LE(buffer.length - 8, 4);
  buffer.write("WAVEfmt ", 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(8000, 24);
  buffer.writeUInt32LE(16000, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(count * 2, 40);
  for (let i = 0; i < count; i++)
    buffer.writeInt16LE(Math.round(Math.sin(i * 0.2) * 10000), 44 + i * 2);
  return `data:audio/wav;base64,${buffer.toString("base64")}`;
}
async function open(page: Page) {
  await page.goto(`${base}/video-studio.html`);
  const video = `data:video/mp4;base64,${(await fs.readFile("video-studio/tests/fixtures/stock-video.mp4")).toString("base64")}`;
  const image = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = 160;
    c.height = 90;
    const x = c.getContext("2d")!;
    x.fillStyle = "#275578";
    x.fillRect(0, 0, 160, 90);
    return c.toDataURL();
  });
  const clip = {
    id: "first",
    assetId: "video",
    start: 0,
    end: 2,
    speed: 1,
    volume: 1,
    filter: "original",
    brightness: 1,
    contrast: 1,
    saturation: 1,
  };
  const data = {
    version: 1,
    assets: [
      {
        id: "video",
        name: "video.mp4",
        type: "video",
        duration: 2,
        url: video,
      },
      {
        id: "image",
        name: "image.png",
        type: "image",
        duration: 5,
        url: image,
      },
      {
        id: "audio",
        name: "tone.wav",
        type: "audio",
        duration: 1,
        url: wave(),
      },
    ],
    project: {
      name: "Timeline Pro",
      ratio: "16:9",
      clips: [clip, { ...clip, id: "second", assetId: "image", end: 4 }],
      texts: [
        {
          id: "caption",
          text: "النص الجماعي",
          start: 2.5,
          end: 3.5,
          x: 50,
          y: 70,
          size: 52,
          color: "#ffffff",
        },
      ],
      overlays: [
        {
          id: "logo",
          assetId: "image",
          at: 0.4,
          start: 0,
          end: 1.5,
          x: 75,
          y: 25,
          width: 20,
          opacity: 1,
          rotation: 0,
          volume: 0,
        },
      ],
      audioId: "audio",
      audioVolume: 0.7,
      audioLoop: true,
      markers: [],
    },
  };
  await page.locator('input[type=file][accept=".json"]').setInputFiles({
    name: "timeline.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(data)),
  });
  await page.locator(".timeline-pro").waitFor();
}
async function save(page: Page) {
  const promise = page.waitForEvent("download");
  await page.getByRole("button", { name: "حفظ المشروع", exact: true }).click();
  return JSON.parse(await fs.readFile(await (await promise).path(), "utf8"));
}
async function clickTool(page: Page, name: string) {
  const button = page
    .locator(".timeline-toolbar, .timeline-settings")
    .getByRole("button", { name, exact: true });
  if (!(await button.count()))
    await page
      .getByRole("button", { name: "خيارات التايم لاين", exact: true })
      .click();
  await button.click();
}
async function drag(
  page: Page,
  locator: ReturnType<Page["locator"]>,
  dx: number,
  cancel = false,
) {
  await locator.scrollIntoViewIfNeeded();
  const b = (await locator.boundingBox())!;
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2 + dx, b.y + b.height / 2, {
    steps: 12,
  });
  if (cancel) await page.keyboard.press("Escape");
  await page.mouse.up();
}
async function seek(page: Page, time: number) {
  await page
    .getByRole("spinbutton", { name: "الانتقال إلى ثانية", exact: true })
    .fill(String(time));
}
test("overlay body and edges drag, Escape cancels, and one undo restores the entire gesture", async ({
  page,
}) => {
  await open(page);
  await clickTool(page, "الجذب المغناطيسي");
  await drag(page, page.locator(".overlay-timeline-track>button"), 27.5);
  let saved = await save(page);
  expect(saved.project.overlays[0].at).toBeCloseTo(0.9, 1);
  await page.keyboard.press("Control+z");
  expect((await save(page)).project.overlays[0].at).toBe(0.4);
  await drag(
    page,
    page.locator(".overlay-timeline-track .trim-handle.end"),
    27.5,
  );
  saved = await save(page);
  expect(saved.project.overlays[0].end).toBeCloseTo(2, 1);
  expect(saved.project.overlays[0].start).toBe(0);
  await drag(page, page.locator(".overlay-timeline-track>button"), 20, true);
  expect((await save(page)).project.overlays[0]).toEqual(
    saved.project.overlays[0],
  );
});
test("multi-select links text and overlay, moves relative offsets, duplicates atomically and unlinks", async ({
  page,
}) => {
  await open(page);
  await clickTool(page, "الجذب المغناطيسي");
  await clickTool(page, "تحديد متعدد");
  await page.locator(".timeline-text").click();
  await page.locator(".overlay-timeline-track>button").click();
  await clickTool(page, "تجميع وربط التحديد");
  const linked = (await save(page)).project;
  expect(linked.texts[0].groupId).toBe(linked.overlays[0].groupId);
  await clickTool(page, "تحديد متعدد");
  await drag(page, page.locator(".timeline-text"), 27.5);
  const moved = (await save(page)).project;
  expect(moved.texts[0].start).toBeCloseTo(3, 1);
  expect(moved.overlays[0].at).toBeCloseTo(0.9, 1);
  await page.locator(".tracks").focus();
  await page.keyboard.press("Control+d");
  const copied = (await save(page)).project;
  expect(copied.texts).toHaveLength(2);
  expect(copied.overlays).toHaveLength(2);
  expect(copied.texts[1].groupId).not.toBe(linked.texts[0].groupId);
  await clickTool(page, "فك ارتباط التحديد");
  expect((await save(page)).project.texts[0].groupId).toBeUndefined();
});
test("non-Ripple deletion leaves a gap; close gaps translates cues, and undo restores both", async ({
  page,
}) => {
  await open(page);
  await page.locator(".timeline-clip").first().click();
  await clickTool(page, "القص المتتابع Ripple");
  await clickTool(page, "حذف المقطع");
  let p = (await save(page)).project;
  expect(p.clips[0].gap).toBe(true);
  expect(p.texts[0].start).toBe(2.5);
  await clickTool(page, "حذف الفراغات");
  p = (await save(page)).project;
  expect(p.clips).toHaveLength(1);
  expect(p.texts[0].start).toBe(0.5);
  await page.keyboard.press("Control+z");
  p = (await save(page)).project;
  expect(p.clips[0].gap).toBe(true);
  await page.keyboard.press("Control+z");
  expect((await save(page)).project.clips[0].gap).toBeUndefined();
});
test("markers, draggable keyframes and easing persist alongside track controls", async ({
  page,
}) => {
  await open(page);
  await clickTool(page, "الجذب المغناطيسي");
  await seek(page, 0.5);
  await clickTool(page, "إضافة علامة عند المؤشر");
  await page
    .getByRole("textbox", { name: "اسم علامة التوقيت", exact: true })
    .fill("بداية الحركة");
  await seek(page, 1);
  await clickTool(page, "◇ Keyframe");
  await drag(page, page.locator(".timeline-keyframe"), 16.5);
  await page
    .getByRole("combobox", { name: "انسيابية نقطة الحركة", exact: true })
    .click();
  await page.getByRole("option", { name: "ناعمة", exact: true }).click();
  let p = (await save(page)).project;
  expect(p.markers[0].label).toBe("بداية الحركة");
  expect(p.clips[0].keyframes[0].t).toBeCloseTo(1.3, 1);
  expect(p.clips[0].keyframes[0].easing).toBe("ease-in-out");
  await page
    .getByRole("button", { name: "أدوات مسار الفيديو", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "اسم مسار الفيديو", exact: true })
    .fill("لقطات المنتج");
  await page
    .getByRole("button", { name: "قفل مسار الفيديو", exact: true })
    .click();
  await page
    .getByRole("button", { name: "إغلاق أدوات مسار الفيديو", exact: true })
    .click();
  const before = (await save(page)).project;
  await drag(page, page.locator(".timeline-clip .trim-handle.end").first(), 20);
  p = (await save(page)).project;
  expect(p.clips[0]).toEqual(before.clips[0]);
  expect(p.tracks.video.name).toBe("لقطات المنتج");
  expect(p.tracks.video.locked).toBe(true);
});
test("real thumbnails/waveform, context speed, detached audio and a frozen source frame work", async ({
  page,
}) => {
  await open(page);
  await expect(
    page.locator(".timeline-clip").first().locator(".timeline-thumbnails img"),
  ).toHaveCount(5, { timeout: 15000 });
  await expect(page.locator(".audio-track .real-waveform")).toBeVisible();
  await page.locator(".timeline-clip").first().click({ button: "right" });
  await page
    .getByRole("dialog", { name: "إجراءات الخط الزمني" })
    .getByRole("button", { name: "سرعة 2×", exact: true })
    .click();
  expect((await save(page)).project.clips[0].speed).toBe(2);
  await page.keyboard.press("Control+z");
  await page.locator(".timeline-clip").first().click({ button: "right" });
  page.once("dialog", (d) => d.accept());
  await page
    .getByRole("button", { name: "فصل صوت المقطع", exact: true })
    .click();
  let p = (await save(page)).project;
  expect(p.audioId).toBe("video");
  expect(p.clips[0].volume).toBe(0);
  expect(p.audioEnd).toBe(2);
  await seek(page, 0.5);
  await page.locator(".timeline-clip").first().click({ button: "right" });
  await page
    .getByRole("button", { name: "تجميد إطار لمدة ثانيتين", exact: true })
    .click();
  await expect(page.locator(".timeline-clip")).toHaveCount(4, {
    timeout: 15000,
  });
  const saved = await save(page);
  expect(saved.project.clips[1].end).toBe(2);
  expect(
    saved.assets.find((a: any) => a.id === saved.project.clips[1].assetId).type,
  ).toBe("image");
});
test("two-finger zoom and long-press menu work on mobile, with no page overflow", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await open(page);
  await page.locator(".ruler").scrollIntoViewIfNeeded();
  const client = await context.newCDPSession(page),
    r = (await page.locator(".timeline-scroll").boundingBox())!;
  const y = r.y + 15,
    x = r.x + r.width / 2;
  const touches = (distance: number) => [
    { id: 1, x: x - distance / 2, y },
    { id: 2, x: x + distance / 2, y },
  ];
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: touches(50),
  });
  for (let i = 1; i <= 5; i++)
    await client.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: touches(50 + i * 10),
    });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await clickTool(page, "خيارات التايم لاين");
  expect(
    Number(
      await page
        .getByRole("slider", { name: "تكبير الخط الزمني", exact: true })
        .inputValue(),
    ),
  ).toBeGreaterThan(90);
  await clickTool(page, "خيارات التايم لاين");
  // Pinch anchors the viewport under the fingers; expose the whole clip before holding its body (not a trim handle).
  await page.locator(".timeline-scroll").evaluate((el) => {
    el.scrollLeft = 0;
  });
  const clip = (await page.locator(".timeline-clip").first().boundingBox())!;
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: Math.max(r.x + 25, clip.x + 30), y: clip.y + 15 }],
  });
  await page.waitForTimeout(650);
  await client.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect(
    page.getByRole("dialog", { name: "إجراءات الخط الزمني", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("dialog", { name: "إجراءات الخط الزمني", exact: true })
    .getByRole("button", { name: "إغلاق", exact: true })
    .click();
  await clickTool(page, "خيارات التايم لاين");
  await clickTool(page, "وضع القص الدقيق");
  expect(
    await page
      .getByRole("slider", { name: "تكبير الخط الزمني", exact: true })
      .inputValue(),
  ).toBe("720");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await context.close();
});

test("edge hold auto-scrolls a captured drag; Escape cancels without deleting clips", async ({
  page,
}) => {
  await open(page);
  const slider = page.getByRole("slider", {
    name: "تكبير الخط الزمني",
    exact: true,
  });
  await slider.focus();
  await slider.press("End");
  await expect(slider).toHaveValue("720");
  const view = (await page.locator(".timeline-scroll").boundingBox())!,
    clip = (await page.locator(".timeline-clip").first().boundingBox())!;
  await page.mouse.move(view.x + 45, clip.y + 15);
  await page.mouse.down();
  await page.mouse.move(view.x + view.width - 10, clip.y + 15, { steps: 8 });
  await expect
    .poll(() =>
      page.locator(".timeline-scroll").evaluate((el) => el.scrollLeft),
    )
    .toBeGreaterThan(40);
  await page.keyboard.press("Escape");
  await page.mouse.up();
  const saved = (await save(page)).project;
  expect(saved.clips.map((c: any) => c.id)).toEqual(["first", "second"]);
});
