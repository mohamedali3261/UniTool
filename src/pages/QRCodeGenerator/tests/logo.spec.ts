import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs/promises";
import { createRequire } from "node:module";
import jsQR from "jsqr";
const { PNG } = createRequire(import.meta.url)("pngjs");
const payload = "https://example.com/unitool-logo";
async function open(page: Page) {
  await page.addInitScript(() => localStorage.setItem("unitool-lang", "ar"));
  await page.goto("/app.html#qrCode");
  await page.getByPlaceholder("https://example.com").fill(payload);
  await expect(
    page.getByRole("button", { name: "تحميل PNG", exact: true }),
  ).toBeEnabled();
}
async function upload(page: Page) {
  const png = new PNG({ width: 100, height: 60 });
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = 0;
    png.data[i + 1] = 100;
    png.data[i + 2] = 255;
    png.data[i + 3] = 255;
  }
  await page.locator("input[type=file]").setInputFiles({
    name: "brand.png",
    mimeType: "image/png",
    buffer: PNG.sync.write(png),
  });
  await expect(
    page.getByRole("img", { name: "اللوجو المختار", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "تحميل PNG", exact: true }),
  ).toBeEnabled();
}
async function download(page: Page, name: string) {
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name, exact: true }).click();
  return fs.readFile((await (await pending).path())!);
}
function decode(bytes: Buffer) {
  const png = PNG.sync.read(bytes);
  return {
    png,
    result: jsQR(new Uint8ClampedArray(png.data), png.width, png.height)?.data,
  };
}
test("logo is in the downloaded PNG, QR still decodes and removal restores a readable QR", async ({
  page,
}) => {
  await open(page);
  await upload(page);
  const { png, result } = decode(await download(page, "تحميل PNG"));
  expect(result).toBe(payload);
  const i =
    (Math.floor((png.width - 32) / 2 + 16) * png.width +
      Math.floor((png.width - 32) / 2 + 16)) *
    4;
  expect(Array.from(png.data.slice(i, i + 4))).toEqual([0, 100, 255, 255]);
  await page.getByRole("button", { name: "إزالة اللوجو", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "تحميل PNG", exact: true }),
  ).toBeEnabled();
  expect(decode(await download(page, "تحميل PNG")).result).toBe(payload);
});
test("SVG is valid, self-contained and rasterizes to a scannable code with the logo", async ({
  page,
}) => {
  await open(page);
  await upload(page);
  const svg = (await download(page, "SVG")).toString();
  const pixels = await page.evaluate(async (svg) => {
    const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
    if (doc.querySelector("parsererror")) throw Error("Invalid SVG");
    if (doc.querySelectorAll("image").length !== 1) throw Error("Missing logo");
    const image = new Image();
    image.src =
      "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));
    await image.decode();
    const c = document.createElement("canvas");
    c.width = image.width;
    c.height = image.height;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(image, 0, 0);
    return {
      width: c.width,
      height: c.height,
      data: Array.from(ctx.getImageData(0, 0, c.width, c.height).data),
    };
  }, svg);
  expect(
    jsQR(new Uint8ClampedArray(pixels.data), pixels.width, pixels.height)?.data,
  ).toBe(payload);
});
test("invalid logo is rejected and clearing content disables stale downloads", async ({
  page,
}) => {
  await open(page);
  await page.locator("input[type=file]").setInputFiles({
    name: "bad.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from("<svg/>"),
  });
  await expect(page.getByRole("alert")).toBeVisible();
  await page.getByPlaceholder("https://example.com").fill("");
  await expect(
    page.getByRole("button", { name: "تحميل PNG", exact: true }),
  ).toBeDisabled();
});
test("copy includes the logo and size control updates the rendered QR", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        write: async (items: ClipboardItem[]) => {
          const blob = await items[0].getType("image/png");
          const bytes = new Uint8Array(await blob.arrayBuffer());
          (window as any).__qrCopied = btoa(
            Array.from(bytes, (b) => String.fromCharCode(b)).join(""),
          );
        },
      },
      configurable: true,
    });
  });
  await open(page);
  await upload(page);
  await page.getByRole("slider", { name: /حجم اللوجو/ }).press("Home");
  for (let i = 0; i < 10; i++)
    await page.getByRole("slider", { name: /حجم اللوجو/ }).press("ArrowRight");
  await expect(
    page.getByRole("button", { name: "تحميل PNG", exact: true }),
  ).toBeEnabled();
  expect(decode(await download(page, "تحميل PNG")).result).toBe(payload);
  await page.getByRole("button", { name: "نسخ", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "تم النسخ", exact: true }),
  ).toBeVisible();
  const data = await page.evaluate(() => (window as any).__qrCopied);
  expect(decode(Buffer.from(data, "base64")).result).toBe(payload);
});
test("transparent holes retain QR modules and transparent margins do not waste logo size", async ({
  page,
}) => {
  await open(page);
  const baseline = decode(await download(page, "تحميل PNG")).png;
  const logo = new PNG({ width: 100, height: 100 });
  logo.data.fill(0);
  for (let y = 20; y < 80; y++)
    for (let x = 20; x < 80; x++)
      if (x < 32 || x >= 68 || y < 32 || y >= 68) {
        const i = (y * 100 + x) * 4;
        logo.data[i] = 0;
        logo.data[i + 1] = 100;
        logo.data[i + 2] = 255;
        logo.data[i + 3] = 255;
      }
  await page.locator("input[type=file]").setInputFiles({
    name: "transparent.png",
    mimeType: "image/png",
    buffer: PNG.sync.write(logo),
  });
  const preview = page.getByRole("img", {
    name: "اللوجو المختار",
    exact: true,
  });
  await expect(preview).toBeVisible();
  expect(await preview.evaluate((e: HTMLImageElement) => e.naturalWidth)).toBe(
    60,
  );
  await expect(
    page.getByRole("button", { name: "تحميل PNG", exact: true }),
  ).toBeEnabled();
  const rendered = decode(await download(page, "تحميل PNG")).png,
    center = rendered.width / 2;
  let dark = 0;
  for (let y = center - 7; y < center + 7; y++)
    for (let x = center - 7; x < center + 7; x++) {
      const i = (y * rendered.width + x) * 4;
      expect(Array.from(rendered.data.slice(i, i + 4))).toEqual(
        Array.from(baseline.data.slice(i, i + 4)),
      );
      if (baseline.data[i] === 0) dark++;
    }
  expect(dark).toBeGreaterThan(0);
  const svg = (await download(page, "SVG")).toString();
  expect(
    await page.evaluate((s) => {
      const d = new DOMParser().parseFromString(s, "image/svg+xml");
      return d.querySelector("g")?.querySelectorAll(":scope > rect").length;
    }, svg),
  ).toBe(0);
});
test("enlarging to 30 percent grows the actual logo and shows a scan warning", async ({
  page,
}) => {
  await open(page);
  await upload(page);
  await page.getByRole("slider", { name: /حجم اللوجو/ }).press("End");
  await expect(page.getByRole("status")).toContainText("اللوجو الكبير");
  await expect(
    page.getByRole("button", { name: "تحميل PNG", exact: true }),
  ).toBeEnabled();
  const { png } = decode(await download(page, "تحميل PNG")),
    center = png.width / 2,
    i = (center * png.width + center + 30) * 4;
  expect(Array.from(png.data.slice(i, i + 4))).toEqual([0, 100, 255, 255]);
});
test("upload has an accessible custom chooser and optional background appears in PNG and SVG", async ({
  page,
}) => {
  await open(page);
  const chooser = page.waitForEvent("filechooser");
  await page
    .getByRole("button", { name: "اختيار صورة اللوجو", exact: true })
    .click();
  await chooser;
  await upload(page);
  await expect(page.getByText("brand.png", { exact: true })).toBeVisible();
  await page
    .getByRole("checkbox", { name: "إضافة خلفية خلف اللوجو", exact: true })
    .check();
  const color = page.getByLabel("لون خلفية اللوجو", { exact: true });
  await color.fill("#ffcc00");
  await expect(
    page.getByRole("button", { name: "تحميل PNG", exact: true }),
  ).toBeEnabled();
  const { png } = decode(await download(page, "تحميل PNG")),
    c = png.width / 2,
    i = ((c - 18) * png.width + c) * 4;
  expect(Array.from(png.data.slice(i, i + 4))).toEqual([255, 204, 0, 255]);
  const svg = (await download(page, "SVG")).toString();
  expect(svg).toContain('fill="#ffcc00"');
  await page
    .getByRole("checkbox", { name: "إضافة خلفية خلف اللوجو", exact: true })
    .uncheck();
  await expect(
    page.getByRole("button", { name: "تحميل PNG", exact: true }),
  ).toBeEnabled();
  expect((await download(page, "SVG")).toString()).not.toContain(
    'fill="#ffcc00"',
  );
});
for (const [name, position] of [
  ["فوق QR", "above"],
  ["تحت QR", "below"],
] as const)
  test(`${position} logo adds room and the exported QR remains readable`, async ({
    page,
  }) => {
    await open(page);
    await upload(page);
    const baseline = decode(await download(page, "تحميل PNG")).png;
    await page.getByRole("button", { name, exact: true }).click();
    await expect(
      page.getByRole("button", { name, exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.getByRole("button", { name: "تحميل PNG", exact: true }),
    ).toBeEnabled();
    const { png, result } = decode(await download(page, "تحميل PNG"));
    expect(result).toBe(payload);
    expect(png.width).toBe(baseline.width);
    expect(png.height).toBeGreaterThan(baseline.height);
    const svg = (await download(page, "SVG")).toString();
    const placement = await page.evaluate((s) => {
      const doc = new DOMParser().parseFromString(s, "image/svg+xml");
      if (doc.querySelector("parsererror")) throw Error("Invalid SVG");
      return {
        logoY: Number(doc.querySelector("image")?.getAttribute("y")),
        qrY: Number(doc.querySelector("g > svg")?.getAttribute("y")),
        height: Number(doc.documentElement.getAttribute("height")),
      };
    }, svg);
    expect(placement.height).toBe(png.height);
    if (position === "above")
      expect(placement.qrY).toBeGreaterThan(placement.logoY);
    else expect(placement.logoY).toBeGreaterThan(256);
  });
test("English mobile controls expose background and outside positions", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.setItem("unitool-lang", "en"));
  await page.goto("/app.html#qrCode");
  await page.getByPlaceholder("https://example.com").fill(payload);
  const png = new PNG({ width: 20, height: 20 });
  png.data.fill(255);
  await page
    .locator("input[type=file]")
    .setInputFiles({
      name: "mobile.png",
      mimeType: "image/png",
      buffer: PNG.sync.write(png),
    });
  await expect(
    page.getByRole("button", { name: "Change logo image", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Above QR", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Above QR", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("checkbox", { name: "Add logo background", exact: true })
    .check();
  await expect(
    page.getByLabel("Logo background color", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Download PNG", exact: true }),
  ).toBeEnabled();
});
