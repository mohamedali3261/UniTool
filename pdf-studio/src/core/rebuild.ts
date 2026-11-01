import { PDFDocument } from "pdf-lib";
import { openPdf, pageCanvas } from "./pdf";
import { loadFonts } from "./annotations";
export interface RebuildRegion {
  x: number;
  y: number;
  w: number;
  h: number;
}
/** Explicitly destructive visual fallback: flatten only this page, never claim native editing. */
export async function rebuildTextRegion(
  bytes: Uint8Array,
  source: number,
  region: RebuildRegion,
  text: string,
  fontSize: number,
  foreground: string,
  background: string,
) {
  if (
    ![region.x, region.y, region.w, region.h, fontSize].every(
      Number.isFinite,
    ) ||
    region.w <= 0 ||
    region.h <= 0 ||
    fontSize < 6 ||
    fontSize > 144 ||
    text.length > 3000 ||
    !/^#[0-9a-f]{6}$/i.test(foreground) ||
    !/^#[0-9a-f]{6}$/i.test(background)
  )
    throw Error("Invalid rebuild settings");
  const { doc } = await openPdf(new File([bytes.slice().buffer], "source.pdf"));
  try {
    const page = await doc.getPage(source + 1),
      view = page.getViewport({ scale: 1 });
    if (
      region.x < 0 ||
      region.y < 0 ||
      region.x + region.w > view.width + 0.01 ||
      region.y + region.h > view.height + 0.01
    )
      throw Error("Region outside page");
    const canvas = await pageCanvas(doc, source, 3000),
      ctx = canvas.getContext("2d")!,
      scale = 3000 / Math.max(view.width, view.height);
    await loadFonts();
    ctx.save();
    ctx.scale(scale, scale);
    ctx.beginPath();
    ctx.rect(region.x, region.y, region.w, region.h);
    ctx.clip();
    ctx.fillStyle = background;
    ctx.fillRect(region.x, region.y, region.w, region.h);
    ctx.font = `${fontSize}px PDFAmiri`;
    ctx.textBaseline = "top";
    ctx.fillStyle = foreground;
    const rtl = /[\u0600-\u06ff]/.test(text);
    ctx.direction = rtl ? "rtl" : "ltr";
    ctx.textAlign = rtl ? "right" : "left";
    const lines = text.split("\n");
    if (
      text.length > 0 &&
      (lines.length * fontSize * 1.5 > region.h ||
        lines.some((line) => ctx.measureText(line).width > region.w))
    )
      throw Error(
        "النص لا يتسع داخل المنطقة. كبّر المنطقة أو قلّل حجم الخط. / Text does not fit the region.",
      );
    lines.forEach((line, i) =>
      ctx.fillText(
        line,
        region.x + (rtl ? region.w : 0),
        region.y + i * fontSize * 1.5,
      ),
    );
    ctx.restore();
    const original = await PDFDocument.load(bytes, { updateMetadata: false }),
      output = await PDFDocument.create();
    for (let i = 0; i < original.getPageCount(); i++) {
      if (i === source) {
        const rebuilt = output.addPage([view.width, view.height]),
          image = await output.embedPng(canvas.toDataURL("image/png"));
        rebuilt.drawImage(image, {
          x: 0,
          y: 0,
          width: view.width,
          height: view.height,
        });
      } else {
        const [copied] = await output.copyPages(original, [i]);
        output.addPage(copied);
      }
    }
    return output.save();
  } finally {
    await doc.destroy();
  }
}
