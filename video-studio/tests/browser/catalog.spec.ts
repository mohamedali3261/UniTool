import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs/promises";
const base = process.env.STUDIO_QA_URL || "http://localhost:3000";
const rail = (p: Page, name: string) =>
  p
    .getByRole("navigation", { name: "أقسام التحرير", exact: true })
    .getByRole("button", { name, exact: true });
async function save(page: Page) {
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "حفظ المشروع", exact: true }).click();
  return JSON.parse(
    await fs.readFile((await (await download).path())!, "utf8"),
  );
}
async function open(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${base}/video-studio.html`);
  await page.locator(".template-card").first().click();
  await expect(page.locator(".editor-shell")).toBeVisible();
}
test("all 62 effect and 62 filter cards render different real preview pixels", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await open(page);
  for (const section of ["التأثيرات", "الفلاتر"]) {
    await rail(page, section).click();
    const cards = page.locator(".live-effect-card");
    await expect(cards).toHaveCount(62);
    const hashes = new Map<string, string>();
    for (let i = 0; i < 62; i++) {
      const card = cards.nth(i),
        canvas = card.locator("canvas");
      await card.scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          canvas.evaluate((c) =>
            Array.from(
              (c as HTMLCanvasElement)
                .getContext("2d")!
                .getImageData(0, 0, 240, 158).data,
            ).some((v, i) => i % 4 === 3 && v > 0),
          ),
        )
        .toBe(true);
      const hash = await canvas.evaluate((c) => {
        const data = (c as HTMLCanvasElement)
          .getContext("2d")!
          .getImageData(0, 0, 240, 158).data;
        let h = 2166136261;
        for (const v of data) h = Math.imul(h ^ v, 16777619);
        return String(h >>> 0);
      });
      const id = (await card.getAttribute("data-effect-id"))!;
      expect(
        hashes.has(hash),
        `${section}: ${id} duplicates ${hashes.get(hash)}`,
      ).toBe(false);
      hashes.set(hash, id);
    }
    expect(hashes.size).toBe(62);
  }
});
for (const mobile of [false, true])
  test(`text preset discovery, application and portable styles ${mobile ? "mobile" : "desktop"}`, async ({
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
    await open(page);
    await rail(page, "النصوص").click();
    await page.getByRole("button", { name: /قوالب جاهزة/ }).click();
    await expect(page.locator(".text-preset-card")).toHaveCount(60);
    await page
      .getByRole("group", { name: "تصنيفات النصوص" })
      .getByRole("button", { name: /منتجات وعروض/ })
      .click();
    await expect(page.locator(".text-preset-card")).toHaveCount(10);
    await page
      .getByRole("textbox", { name: "البحث في قوالب النصوص" })
      .fill("توصيل");
    await expect(page.locator(".text-preset-card")).toHaveCount(1);
    const canvas = page.locator(".text-preset-picture canvas");
    await canvas.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        canvas.evaluate((c) =>
          Array.from(
            (c as HTMLCanvasElement)
              .getContext("2d")!
              .getImageData(0, 0, 320, 190).data,
          ).some((v, i) => i % 4 !== 3 && v > 40),
        ),
      )
      .toBe(true);
    await page
      .getByRole("button", { name: "إضافة قالب توصيل مجاني", exact: true })
      .click();
    await expect(
      page.getByRole("textbox", { name: "محتوى النص", exact: true }),
    ).toHaveValue("توصيل مجاني");
    await page
      .getByRole("textbox", { name: "محتوى النص", exact: true })
      .fill("توصيل لكل المحافظات");
    const data = await save(page),
      text = data.project.texts.at(-1);
    expect(text.text).toBe("توصيل لكل المحافظات");
    expect(text.background).toBe("#ffd48b");
    expect(text.color).toBe("#101820");
    expect(text.animationIn).toBe("none");
    expect(text.size).toBe(58);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (mobile) {
      await page
        .getByRole("button", { name: "تم والعودة للتايم لاين", exact: true })
        .click();
      await rail(page, "التأثيرات").click();
    } else await rail(page, "التأثيرات").click();
    await page
      .getByRole("textbox", { name: "البحث في التأثيرات", exact: true })
      .fill("مطر");
    await page
      .getByRole("button", { name: "تطبيق ستار المطر", exact: true })
      .click();
    expect((await save(page)).project.clips[0].effect).toBe("rain-curtain");
    await context.close();
  });
