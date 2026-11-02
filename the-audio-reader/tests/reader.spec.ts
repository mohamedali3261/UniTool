import { test, expect, type Page } from "@playwright/test";
const first = Array.from({ length: 180 }, (_, i) => `كَلِمَة${i}`).join(" "),
  second = "هذه نهاية الكتاب، نحافظ على جميع الكلمات والتشكيل.";
async function boot(
  page: Page,
  { book = true, missing = false, late = false } = {},
) {
  await page.addInitScript(
    ({ first, second, book, missing, late }) => {
      localStorage.clear();
      localStorage.setItem("unitool-lang", "ar");
      if (book) {
        const pages = [first, second, ""].map((rawText, i) => ({
          pageNumber: i + 1,
          rawText,
          chunks: [],
          wordCount: rawText.split(/\s+/).filter(Boolean).length,
          isScannedImage: i === 2,
        }));
        const b = {
          id: "qa",
          title: "اختبار القراءة العربية",
          fileType: "txt",
          totalPages: 3,
          totalWords: 190,
          detectedLanguage: "ar",
          pages,
          dateAdded: 1,
          lastReadPage: 1,
          lastReadChunkIndex: 0,
          progressPercentage: 0,
        };
        localStorage.setItem("sawti_recent_books_v1", JSON.stringify([b]));
        localStorage.setItem("sawti_last_active_book_id_v1", "qa");
      }
      const arabic = {
          name: "Arabic QA",
          lang: "ar-EG",
          voiceURI: "qa-ar",
          default: false,
          localService: true,
        },
        english = {
          name: "English QA",
          lang: "en-US",
          voiceURI: "qa-en",
          default: true,
          localService: true,
        };
      let voices = late ? [] : missing ? [english] : [arabic, english],
        current: any = null;
      const submitted: any[] = [];
      const synth = Object.assign(new EventTarget(), {
        speaking: false,
        paused: false,
        getVoices: () => voices,
        cancel() {
          const stale = current;
          current = null;
          this.speaking = false;
          if (stale)
            setTimeout(() => stale.onerror?.({ error: "canceled" }), 0);
        },
        speak(u: any) {
          current = u;
          submitted.push({ text: u.text, lang: u.lang });
          this.speaking = true;
          u.onstart?.({});
        },
        pause() {
          this.paused = true;
        },
        resume() {
          this.paused = false;
        },
      });
      Object.defineProperty(window, "speechSynthesis", {
        value: synth,
        configurable: true,
      });
      Object.defineProperty(window, "SpeechSynthesisUtterance", {
        value: class {
          constructor(public text: string) {}
        },
        configurable: true,
      });
      (window as any).__speech = {
        submitted,
        finish() {
          const u = current;
          current = null;
          synth.speaking = false;
          u?.onend?.({});
          return !!u;
        },
        voices() {
          voices = [arabic, english];
          synth.dispatchEvent(new Event("voiceschanged"));
        },
        error() {
          current?.onerror?.({ error: "network" });
        },
      };
    },
    { first, second, book, missing, late },
  );
  await page.goto("/the-audio-reader.html");
  await expect(page.locator(".reader-help-strip")).toBeVisible();
  if (book) {
    await page.locator("#recent-book-qa").click();
    await expect(page.locator("#main-play-pause-btn")).toBeVisible();
  }
}
async function outside(page: Page) {
  await page.mouse.click(2, 2);
  await expect(page.getByRole("dialog")).toHaveCount(0);
}
test("voice, settings, shortcuts: inside stays open, outside dismisses, Escape restores focus", async ({
  page,
}) => {
  await boot(page, { book: false });
  for (const title of [
    "اختيار الصوت",
    "إعدادات القراءة والمظهر",
    "اختصارات لوحة المفاتيح",
  ]) {
    const trigger = page.locator(`nav button[title="${title}"]`);
    await trigger.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.locator("h2").click();
    await expect(dialog).toBeVisible();
    await outside(page);
    await expect(trigger).toBeFocused();
    await trigger.click();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
  }
});
test("create dialog retains draft, traps focus and closes outside", async ({
  page,
}) => {
  await boot(page, { book: false });
  await page.locator("#create-new-book-btn").click();
  let dialog = page.getByRole("dialog");
  await dialog.locator("input").fill("مسودة");
  await dialog.locator("textarea").fill("نص عربي مُشَكّل");
  await dialog
    .getByRole("button", { name: "إنشاء الكتاب", exact: true })
    .focus();
  await page.keyboard.press("Tab");
  await expect(
    dialog.getByRole("button", { name: "Close / إغلاق" }),
  ).toBeFocused();
  await outside(page);
  await page.locator("#create-new-book-btn").click();
  await expect(page.getByRole("dialog").locator("input")).toHaveValue("مسودة");
  await page.getByRole("button", { name: "إنشاء الكتاب", exact: true }).click();
  await expect(page.locator("#reader-text-canvas")).toContainText(
    "نص عربي مُشَكّل".normalize("NFKC"),
  );
});
test("add page and OCR dialogs dismiss on outside and Escape", async ({
  page,
}) => {
  await boot(page);
  for (const id of ["add-page-btn", "ocr-launch-sidebar-btn"]) {
    await page.locator("#" + id).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await outside(page);
    await page.locator("#" + id).click();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  }
});
test("all player popovers and export close outside and Escape", async ({
  page,
}) => {
  await boot(page);
  for (const id of [
    "speed-menu-btn",
    "volume-menu-btn",
    "ambient-soundscape-btn",
    "sleep-timer-btn",
    "export-book-btn",
  ]) {
    const trigger = page.locator("#" + id);
    await trigger.click();
    await expect(trigger.locator("..").locator("div.absolute")).toBeVisible();
    await page.locator(".reader-help-strip > span").click();
    await expect(trigger.locator("..").locator("div.absolute")).toHaveCount(0);
    await trigger.click();
    await page.keyboard.press("Escape");
    await expect(trigger.locator("..").locator("div.absolute")).toHaveCount(0);
  }
});
test("Arabic continuous playback submits all words across pages with no page-effect cancellation", async ({
  page,
}) => {
  await boot(page);
  await page.locator("#main-play-pause-btn").click();
  for (let i = 0; i < 50; i++) {
    const continued = await page.evaluate(() =>
      (window as any).__speech.finish(),
    );
    if (!continued) break;
    await page.waitForTimeout(10);
  }
  const submitted = await page.evaluate(
    () => (window as any).__speech.submitted,
  );
  expect(submitted.map((u: any) => u.text).join(" ")).toBe(
    (first + " " + second).normalize("NFKC"),
  );
  expect(
    submitted.every((u: any) => u.lang === "ar-EG" && u.text.length <= 220),
  ).toBe(true);
  await expect(page.locator("#stop-playback-btn")).toHaveCount(0);
});
test("missing Arabic voice shows setup help instead of silent English fallback", async ({
  page,
}) => {
  await boot(page, { missing: true });
  await page.locator("#main-play-pause-btn").click();
  await expect(page.getByRole("alert")).toContainText("لا يوجد صوت عربي");
  expect(
    await page.evaluate(() => (window as any).__speech.submitted.length),
  ).toBe(0);
  await page.locator('nav button[title="اختيار الصوت"]').click();
  await expect(page.getByRole("note")).toContainText("أندرويد");
});
test("late voiceschanged updates the UI and reading can start", async ({
  page,
}) => {
  await boot(page, { late: true });
  await page.evaluate(() => (window as any).__speech.voices());
  await expect(page.locator(".reader-help-strip")).toContainText(
    "الصوت العربي متاح",
  );
  await page.locator("#main-play-pause-btn").click();
  await expect(page.locator("#stop-playback-btn")).toBeVisible();
});
test("preview explicitly stops narration, then closes without auto-advancing it", async ({
  page,
}) => {
  await boot(page);
  await page.locator("#main-play-pause-btn").click();
  await page.locator('nav button[title="اختيار الصوت"]').click();
  await page
    .getByRole("dialog")
    .locator('button[title="تجربة الصوت"]')
    .first()
    .click();
  await expect(page.locator("#stop-playback-btn")).toHaveCount(0);
  await outside(page);
  await page.waitForTimeout(50);
  expect(
    await page.evaluate(() => (window as any).__speech.submitted.length),
  ).toBe(2);
});
test("engine network error remains on current passage for retry", async ({
  page,
}) => {
  await boot(page);
  await page.locator("#main-play-pause-btn").click();
  await page.evaluate(() => (window as any).__speech.error());
  await expect(page.getByRole("alert")).toBeVisible();
  await page.locator("#main-play-pause-btn").click();
  const texts = await page.evaluate(() =>
    (window as any).__speech.submitted.map((u: any) => u.text),
  );
  expect(texts[1]).toBe(texts[0]);
});
test("mobile drawer, voice button and popovers fit and dismiss correctly", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await boot(page);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.locator('nav button[title="اختيار الصوت"]').click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await outside(page);
  await page.locator('nav button[title="القائمة الجانبية"]').click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await outside(page);
  await page.locator('nav button[title="القائمة الجانبية"]').click();
  await page.getByRole("dialog").locator("#page-item-2").click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.locator("#speed-menu-btn").click();
  const box = await page.locator("#speed-picker-dropdown").boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  await page.mouse.click(5, 200);
  await expect(page.locator("#speed-picker-dropdown")).toHaveCount(0);
  await page.screenshot({ path: ".cache/reader-mobile.png", fullPage: true });
});
test("desktop layout screenshot and no React runtime errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await boot(page);
  await page.screenshot({ path: ".cache/reader-desktop.png", fullPage: true });
  expect(errors).toEqual([]);
});

test("TXT upload keeps Arabic diacritics and mixed-language utterances", async ({
  page,
}) => {
  await boot(page, { book: false });
  const text = "بِسْمِ اللهِ مرحبًا بالعالم. Hello world! وهذه آخر الكلمات.";
  await page
    .locator("#file-upload-input")
    .setInputFiles({
      name: "arabic.txt",
      mimeType: "text/plain",
      buffer: Buffer.from(text),
    });
  await expect(page.locator("#main-play-pause-btn")).toBeVisible();
  await page.locator("#main-play-pause-btn").click();
  for (let i = 0; i < 20; i++) {
    if (!(await page.evaluate(() => (window as any).__speech.finish()))) break;
    await page.waitForTimeout(10);
  }
  const submitted = await page.evaluate(
    () => (window as any).__speech.submitted,
  );
  expect(submitted.map((u: any) => u.text).join(" ")).toBe(
    text.normalize("NFKC"),
  );
  expect(submitted.map((u: any) => u.lang)).toEqual([
    "ar-EG",
    "en-US",
    "ar-EG",
  ]);
});
