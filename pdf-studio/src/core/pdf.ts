import * as pdfjs from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import type { PageText, TextRun } from "./types";
import { LIMITS } from "./types";
import { buildText } from "./text";
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
export type PdfDoc = pdfjs.PDFDocumentProxy;
export async function openPdf(file: File) {
  if (file.size > LIMITS.bytes)
    throw Error("الحد الأقصى 25 MB / Maximum file size is 25 MB");
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!new TextDecoder().decode(bytes.slice(0, 1024)).includes("%PDF-"))
    throw Error("الملف ليس PDF صالحًا / Not a valid PDF");
  const { PDFDocument } = await import("pdf-lib");
  const check = await PDFDocument.load(bytes, { updateMetadata: false });
  if (check.getPageCount() > LIMITS.pages)
    throw Error("الحد الأقصى 100 صفحة / Maximum 100 pages");
  const task = pdfjs.getDocument({
    data: bytes.slice(),
    cMapUrl: "/pdf-studio/vendor/cmaps/",
    cMapPacked: true,
    standardFontDataUrl: "/pdf-studio/vendor/standard_fonts/",
    isEvalSupported: false,
    enableXfa: false,
  });
  const doc = await task.promise;
  for (let i = 0; i < check.getPageCount(); i++) {
    const box = check.getPage(i).getCropBox();
    if (
      box.width <= 0 ||
      box.height <= 0 ||
      box.width > 5000 ||
      box.height > 5000
    ) {
      await doc.destroy();
      throw Error(
        "أبعاد الصفحة تتجاوز الحدود الآمنة / Page dimensions exceed safe limits",
      );
    }
  }
  return { doc, bytes };
}
export async function extractPage(
  doc: PdfDoc,
  index: number,
): Promise<PageText> {
  const page = await doc.getPage(index + 1),
    viewport = page.getViewport({ scale: 1 }),
    reading = page.getViewport({ scale: 1, rotation: 0 }),
    content = await page.getTextContent();
  const runs: TextRun[] = [];
  let chars = 0,
    truncated = false;
  for (const item of content.items) {
    if (!("str" in item)) continue;
    if (runs.length >= 10000 || chars + item.str.length > 200000) {
      truncated = true;
      break;
    }
    chars += item.str.length;
    const tx = pdfjs.Util.transform(viewport.transform, item.transform),
      rt = pdfjs.Util.transform(reading.transform, item.transform),
      h = Math.hypot(tx[2], tx[3]) || item.height || 12,
      len = Math.hypot(tx[0], tx[1]) || 1,
      dx = (tx[0] / len) * item.width,
      dy = (tx[1] / len) * item.width,
      xs = [tx[4], tx[4] + dx, tx[4] + tx[2], tx[4] + dx + tx[2]],
      ys = [tx[5], tx[5] + dy, tx[5] + tx[3], tx[5] + dy + tx[3]],
      rh = Math.hypot(rt[2], rt[3]) || 12;
    runs.push({
      str: item.str,
      dir: item.dir,
      x: Math.min(...xs),
      y: Math.min(...ys),
      w: Math.max(...xs) - Math.min(...xs),
      h: Math.max(...ys) - Math.min(...ys) || h,
      end: item.hasEOL,
      read: { x: rt[4], y: rt[5] - rh, w: item.width, h: rh },
    });
  }
  const result = buildText(runs);
  if (truncated) result.warnings.push("truncated");
  return result;
}
export async function pageCanvas(
  doc: PdfDoc,
  index: number,
  maxEdge = 2200,
  rotation = 0,
) {
  const page = await doc.getPage(index + 1),
    base = page.getViewport({
      scale: 1,
      rotation: (page.rotate + rotation) % 360,
    }),
    scale = Math.min(
      maxEdge / Math.max(base.width, base.height),
      Math.sqrt(LIMITS.pixels / (base.width * base.height)),
    ),
    viewport = page.getViewport({
      scale,
      rotation: (page.rotate + rotation) % 360,
    });
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  await page.render({
    canvasContext: canvas.getContext("2d")!,
    viewport,
    background: "#ffffff",
  }).promise;
  return canvas;
}
export function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
export async function fingerprint(bytes: Uint8Array) {
  const digest = await crypto.subtle.digest("SHA-256", bytes.slice().buffer);
  return [...new Uint8Array(digest)]
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("");
}
