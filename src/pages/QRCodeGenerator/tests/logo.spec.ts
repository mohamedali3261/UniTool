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
  await page.getByRole("slider", { name: /حجم اللوجو/ }).press("End");
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
