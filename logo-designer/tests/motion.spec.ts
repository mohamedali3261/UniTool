import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
async function start(page: Page, lang = "en") {
  await page.addInitScript((lang) => {
    localStorage.setItem("logo-designer-tour", "done");
    localStorage.setItem("logo-designer-lang", lang);
  }, lang);
  await page.goto("/logo-designer/");
  await expect(page.getByRole("status").first()).toHaveText(
    lang === "en" ? "Saved locally" : "محفوظ على الجهاز",
    { timeout: 15000 },
  );
}
async function template(page: Page) {
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Templates", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Animated logo templates" }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Apply animated template: Build in sequence",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("region", { name: "Animated logo preview" }),
  ).toBeVisible();
}
test("editable motion template, deterministic scrubbing, duration, persistence and undo", async ({
  page,
}) => {
  await start(page);
  await template(page);
  await page
    .getByRole("button", { name: "Pause preview", exact: true })
    .click();
  const svg = page.locator(".ld-motion-screen svg[role=img]");
  await page.getByRole("slider", { name: "Animation position" }).fill("100");
  const early = await svg.innerHTML();
  await page.getByRole("slider", { name: "Animation position" }).fill("600");
  const held = await svg.innerHTML();
  expect(early).not.toEqual(held);
  await page.getByRole("slider", { name: "Animation position" }).fill("100");
  expect(await svg.innerHTML()).toEqual(early);
  await page
    .getByLabel("Animation duration", { exact: true })
    .selectOption("5");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(
    page.getByLabel("Animation duration", { exact: true }),
  ).toHaveValue("3");
  await page
    .getByLabel("Animation duration", { exact: true })
    .selectOption("4");
  await expect(page.getByRole("status").first()).toHaveText("Saved locally");
  await page.reload();
  await page.getByRole("button", { name: "Motion", exact: true }).click();
  await expect(
    page.getByLabel("Animation duration", { exact: true }),
  ).toHaveValue("4");
  await page.getByRole("button", { name: "Elements", exact: true }).click();
  await expect(page.locator(".ld-artboard>svg")).toBeVisible();
  expect(await page.locator(".ld-artboard>svg text").count()).toBeGreaterThan(
    0,
  );
});
test("real GIF and browser video downloads; JSON retains editable motion", async ({
  page,
}, info) => {
  test.setTimeout(120000);
  await start(page);
  await template(page);
  await page
    .getByLabel("Animation duration", { exact: true })
    .selectOption("2");
  await page
    .getByRole("button", { name: "Export GIF or video", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Animation size", { exact: true })
    .selectOption("256");
  let promised = page.waitForEvent("download");
  await dialog
    .getByRole("button", { name: "Download animated logo", exact: true })
    .click();
  const gif = await promised;
  expect(gif.suggestedFilename()).toMatch(/-animated\.gif$/);
  await gif.saveAs(info.outputPath("logo.gif"));
  const bytes = await readFile(info.outputPath("logo.gif"));
  expect(bytes.subarray(0, 6).toString()).toBe("GIF89a");
  expect(bytes.length).toBeGreaterThan(3000);
  const videoOption = dialog.locator('option[value="video"]');
  expect(await videoOption.isDisabled()).toBe(false);
  await expect(dialog.getByRole("status").last()).toHaveText(
    "Animated logo downloaded.",
  );
  await dialog
    .getByLabel("Animation format", { exact: true })
    .selectOption("video");
  await dialog
    .getByLabel("Animation size", { exact: true })
    .selectOption("256");
  promised = page.waitForEvent("download");
  await dialog
    .getByRole("button", { name: "Download animated logo", exact: true })
    .click();
  const video = await promised;
  expect(video.suggestedFilename()).toMatch(/-animated\.(mp4|webm)$/);
  const extension = video.suggestedFilename().split(".").pop();
  await video.saveAs(info.outputPath(`logo.${extension}`));
  expect(
    (await readFile(info.outputPath(`logo.${extension}`))).length,
  ).toBeGreaterThan(3000);
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("button", { name: "Export", exact: true }).click();
  await page.getByRole("button", { name: "JSON", exact: true }).click();
  promised = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download file", exact: true })
    .click();
  const json = await promised;
  const p = JSON.parse(await readFile((await json.path())!, "utf8"));
  expect(p.motion).toEqual({ preset: "assemble", duration: 2 });
  expect(p.nodes.some((n: { kind: string }) => n.kind === "text")).toBe(true);
});
test("cancel export and close dialog cleanly; video unsupported keeps GIF available", async ({
  page,
}) => {
  await start(page);
  await template(page);
  await page
    .getByRole("button", { name: "Export GIF or video", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByRole("button", { name: "Download animated logo", exact: true })
    .click();
  await dialog
    .getByRole("button", { name: "Cancel export", exact: true })
    .click();
  await expect(dialog.getByRole("status").last()).toHaveText(
    "Export cancelled.",
  );
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await page.evaluate(() => {
    Object.defineProperty(window, "MediaRecorder", {
      value: undefined,
      configurable: true,
    });
  });
  await page
    .getByRole("button", { name: "Export GIF or video", exact: true })
    .click();
  await expect(
    page.getByRole("dialog").locator('option[value="video"]'),
  ).toHaveAttribute("disabled", "");
  await expect(
    page
      .getByRole("dialog")
      .getByRole("button", { name: "Download animated logo", exact: true }),
  ).toBeEnabled();
});
for (const [width, lang] of [
  [390, "ar"],
  [1440, "en"],
] as const)
  test(`motion guide and responsive preview ${width} ${lang}`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await start(page, lang);
    await page
      .getByRole("button", {
        name: lang === "ar" ? "حركة" : "Motion",
        exact: true,
      })
      .click();
    await expect(
      page.getByRole("button", {
        name: lang === "ar" ? "تشغيل المعاينة" : "Play preview",
        exact: true,
      }),
    ).toBeVisible();
    await page
      .getByText(
        lang === "ar"
          ? "شرح متحرك: من الفكرة إلى التصدير"
          : "Motion guide: from idea to export",
        { exact: true },
      )
      .click();
    const guide = page.locator(".ld-motion-lesson");
    await guide
      .getByRole("button", {
        name: lang === "ar" ? "تشغيل الشرح" : "Play guide",
        exact: true,
      })
      .click();
    await expect(
      guide.getByRole("button", {
        name: lang === "ar" ? "إيقاف الشرح" : "Pause guide",
        exact: true,
      }),
    ).toBeVisible();
    await guide
      .getByRole("button", {
        name: lang === "ar" ? "صدّر وشارك" : "Export and share",
        exact: true,
      })
      .click();
    await expect(
      guide.getByRole("heading", {
        name: lang === "ar" ? "صدّر وشارك" : "Export and share",
        exact: true,
      }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({ path: info.outputPath("motion.png") });
  });
test("video falls back to a real WebM when MP4 is unavailable", async ({
  page,
}, info) => {
  await start(page);
  await template(page);
  await page.evaluate(() => {
    const supported = MediaRecorder.isTypeSupported.bind(MediaRecorder);
    MediaRecorder.isTypeSupported = (mime) =>
      !mime.startsWith("video/mp4") && supported(mime);
  });
  await page
    .getByLabel("Animation duration", { exact: true })
    .selectOption("2");
  await page
    .getByRole("button", { name: "Export GIF or video", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Animation format", { exact: true })
    .selectOption("video");
  await dialog
    .getByLabel("Animation size", { exact: true })
    .selectOption("256");
  const promised = page.waitForEvent("download");
  await dialog
    .getByRole("button", { name: "Download animated logo", exact: true })
    .click();
  const video = await promised;
  expect(video.suggestedFilename()).toMatch(/\.webm$/);
  await video.saveAs(info.outputPath("fallback.webm"));
  expect(
    (await readFile(info.outputPath("fallback.webm")))
      .subarray(0, 4)
      .toString("hex"),
  ).toBe("1a45dfa3");
});

test("320px Arabic dark: animated template opens full preview and standard export exposes GIF/video", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 320, height: 850 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() =>
    localStorage.setItem("logo-designer-theme", "dark"),
  );
  await start(page, "ar");
  await page.getByRole("button", { name: "قوالب", exact: true }).click();
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "تطبيق قالب متحرك: تنفّس مستمر", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "معاينة الشعار المتحرك" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "تشغيل المعاينة", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: info.outputPath("motion-dark-ar-320.png") });
  await page.getByRole("button", { name: "تصدير", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "GIF/VIDEO", exact: true }).click();
  await expect(
    dialog.getByRole("button", { name: "تنزيل الشعار المتحرك", exact: true }),
  ).toBeVisible();
  expect(
    await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
  ).toBe(true);
});
