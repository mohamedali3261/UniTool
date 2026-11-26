import { loadStudioFonts } from "./advanced";
import {
  printParts,
  partNames,
  type Project,
  type Side,
  type Layer,
} from "./model";
import { rotatedBounds } from "./measurements";
import { drawArtwork, getLayerRaster } from "./artwork";
export function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const b of bytes) {
    crc ^= b;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
export function pngWithDpi(png: Uint8Array, dpi: number) {
  const chunk = new Uint8Array(21),
    view = new DataView(chunk.buffer);
  view.setUint32(0, 9);
  chunk.set([112, 72, 89, 115], 4);
  view.setUint32(8, Math.round(dpi / 0.0254));
  view.setUint32(12, Math.round(dpi / 0.0254));
  chunk[16] = 1;
  view.setUint32(17, crc32(chunk.subarray(4, 17)));
  const parts: Uint8Array[] = [png.subarray(0, 8)];
  let offset = 8,
    inserted = false;
  while (offset + 12 <= png.length) {
    const n = new DataView(png.buffer, png.byteOffset + offset, 4).getUint32(0);
    if (offset + 12 + n > png.length) throw Error("Invalid PNG");
    const type = String.fromCharCode(...png.subarray(offset + 4, offset + 8));
    if (type !== "pHYs") parts.push(png.subarray(offset, offset + 12 + n));
    if (type === "IHDR") {
      parts.push(chunk);
      inserted = true;
    }
    offset += 12 + n;
  }
  if (!inserted) throw Error("Invalid PNG");
  const result = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let pos = 0;
  for (const p of parts) {
    result.set(p, pos);
    pos += p.length;
  }
  return result;
}
export function productionEntries(project: Project) {
  const entries: {
    part: Side;
    layer: Layer;
    widthCm: number;
    heightCm: number;
    xCm: number;
    yCm: number;
    dpi: number;
    bounds: ReturnType<typeof rotatedBounds>;
  }[] = [];
  for (const part of printParts) {
    const layers = project.sides[part].filter(
      (l) => l.visible && l.opacity > 0,
    );
    if (!layers.length) continue;
    const area = project.printAreas?.[part];
    if (!area) throw Error(`Set actual print-area measurements for ${part}`);
    for (const layer of layers) {
      const b = rotatedBounds(layer);
      entries.push({
        part,
        layer,
        bounds: b,
        widthCm: (b.w / 1024) * area.width,
        heightCm: (b.h / 1024) * area.height,
        xCm: (b.x / 1024) * area.width,
        yCm: (b.y / 1024) * area.height,
        dpi: area.dpi,
      });
    }
  }
  if (!entries.length) throw Error("No visible artwork to export");
  return entries;
}
async function pngBlob(c: HTMLCanvasElement) {
  return new Promise<Blob>((res, rej) =>
    c.toBlob((b) => (b ? res(b) : rej(Error("PNG failed")))),
  );
}
export async function specSheet(project: Project, ar: boolean) {
  await loadStudioFonts(project.fonts);
  const entries = productionEntries(project);
  const { PDFDocument } = await import("pdf-lib");
  const pdf = await PDFDocument.create();
  pdf.setTitle(project.name + " — print placement specification");
  pdf.setSubject(
    "Print-area measurements only; not a garment cutting pattern.",
  );
  for (const part of printParts) {
    const rows = entries.filter((e) => e.part === part);
    if (!rows.length) continue;
    for (let start = 0; start < rows.length; start += 8) {
      const c = document.createElement("canvas");
      c.width = 1240;
      c.height = 1754;
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = "#20392c";
      ctx.font = "bold 34px Tahoma";
      ctx.textAlign = ar ? "right" : "left";
      const tx = ar ? 1160 : 80;
      ctx.fillText(project.name.slice(0, 60), tx, 80);
      ctx.font = "26px Tahoma";
      ctx.fillText(
        partNames[part][ar ? "ar" : "en"] +
          " — " +
          (ar ? "مواصفات توزيع الطباعة" : "Print placement specification"),
        tx,
        135,
      );
      const area = project.printAreas![part]!;
      ctx.font = "21px Tahoma";
      ctx.fillText(
        `${area.width} × ${area.height} cm · ${area.dpi} DPI · ${project.color}`,
        tx,
        185,
      );
      ctx.font = "18px Tahoma";
      ctx.fillText(
        ar
          ? "القياسات من حدود مساحة الطباعة المُدخلة؛ ليست من حافة قطعة الملابس."
          : "Measured from the entered print area, not from garment edges.",
        tx,
        225,
      );
      const artwork = await drawArtwork(project.sides[part], 800);
      const scale = Math.min(900 / area.width, 650 / area.height),
        w = area.width * scale,
        h = area.height * scale,
        x = (1240 - w) / 2,
        y = 275;
      ctx.fillStyle = project.color;
      ctx.fillRect(x, y, w, h);
      ctx.drawImage(artwork, x, y, w, h);
      ctx.strokeStyle = "#20392c";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);
      ctx.strokeStyle = "#d67940";
      for (const e of rows) {
        ctx.strokeRect(
          x + (e.bounds.x / 1024) * w,
          y + (e.bounds.y / 1024) * h,
          (e.bounds.w / 1024) * w,
          (e.bounds.h / 1024) * h,
        );
      }
      let yy = 1000;
      ctx.textAlign = "left";
      ctx.direction = "ltr";
      ctx.fillStyle = "#20392c";
      ctx.font = "20px Tahoma";
      ctx.fillText(
        "ID / Artwork · Width × Height · X / Y from print-area origin · Rotation",
        80,
        yy,
      );
      yy += 45;
      for (const [i, e] of rows.slice(start, start + 8).entries()) {
        ctx.font = "20px Tahoma";
        ctx.fillText(`${start + i + 1}. ${e.layer.name.slice(0, 35)}`, 80, yy);
        ctx.font = "18px Tahoma";
        ctx.fillText(
          `${e.widthCm.toFixed(2)} × ${e.heightCm.toFixed(2)} cm    X ${e.xCm.toFixed(2)} / Y ${e.yCm.toFixed(2)} cm    ${e.layer.rotation}°`,
          80,
          yy + 29,
        );
        yy += 70;
      }
      ctx.font = "17px Tahoma";
      ctx.fillText(
        "Bounding-box sizes. Verify measurements, artwork rights, colors and printer requirements.",
        80,
        1690,
      );
      const page = pdf.addPage([595.28, 841.89]);
      const image = await pdf.embedPng(await (await pngBlob(c)).arrayBuffer());
      page.drawImage(image, { x: 0, y: 0, width: 595.28, height: 841.89 });
      c.width = c.height = 0;
    }
  }
  return new Blob([(await pdf.save()) as BlobPart], {
    type: "application/pdf",
  });
}
export async function printBundle(project: Project, ar: boolean) {
  await loadStudioFonts(project.fonts);
  const entries = productionEntries(project);
  let pixelBudget = 0;
  for (const e of entries) {
    const w = Math.max(1, Math.round((e.widthCm / 2.54) * e.dpi)),
      h = Math.max(1, Math.round((e.heightCm / 2.54) * e.dpi));
    pixelBudget += w * h;
    if (w * h > 32000000 || pixelBudget > 64000000 || Math.max(w, h) > 30000)
      throw Error(
        "Reduce DPI or split the project: 32MP per print / 64MP per ZIP",
      );
  }
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  for (const [i, e] of entries.entries()) {
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round((e.widthCm / 2.54) * e.dpi));
    c.height = Math.max(1, Math.round((e.heightCm / 2.54) * e.dpi));
    const ctx = c.getContext("2d")!;
    ctx.scale(c.width / e.bounds.w, c.height / e.bounds.h);
    ctx.translate(
      e.layer.x + e.layer.w / 2 - e.bounds.x,
      e.layer.y + e.layer.h / 2 - e.bounds.y,
    );
    ctx.rotate((e.layer.rotation * Math.PI) / 180);
    ctx.globalAlpha = e.layer.opacity;
    const r = await getLayerRaster(
      e.layer,
      Math.max(c.width / e.bounds.w, c.height / e.bounds.h),
    );
    ctx.drawImage(
      r.canvas,
      -e.layer.w / 2 - r.pad,
      -e.layer.h / 2 - r.pad,
      r.w,
      r.h,
    );
    const bytes = pngWithDpi(
      new Uint8Array(await (await pngBlob(c)).arrayBuffer()),
      e.dpi,
    );
    zip.file(
      `prints/${e.part}-${String(i + 1).padStart(3, "0")}-${e.widthCm.toFixed(2)}x${e.heightCm.toFixed(2)}cm.png`,
      bytes,
    );
    c.width = c.height = 0;
  }
  zip.file("spec-sheet.pdf", await specSheet(project, ar));
  zip.file(
    "measurements.json",
    JSON.stringify(
      entries.map(({ layer, bounds, ...e }) => ({
        ...e,
        name: layer.name,
        rotation: layer.rotation,
      })),
      null,
      2,
    ),
  );
  zip.file(
    "README.txt",
    "Prints are isolated visible layers, cropped to their rotated bounding boxes. Coordinates refer to the entered print area, NOT garment edges. PNG pHYs records target DPI. Confirm real measurements and production requirements with your printer. Effects outside item bounds are clipped. This is NOT a sewing/cutting pattern.",
  );
  return zip.generateAsync({ type: "blob", compression: "STORE" });
}
