import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { ImageItem, PdfSettings, PageSizeKey, Orientation } from '../types';

export const PAGE_SIZES: Record<Exclude<PageSizeKey, 'fit'>, { w: number; h: number }> = {
  a5: { w: 419.53, h: 595.28 },
  a4: { w: 595.28, h: 841.89 },
  a3: { w: 841.89, h: 1190.55 },
  letter: { w: 612, h: 792 },
  legal: { w: 612, h: 1008 },
};

export const getPageSize = (
  pageSize: PageSizeKey,
  orientation: Orientation,
  imgW: number,
  imgH: number,
  margin: number,
) => {
  if (pageSize === 'fit') return { width: imgW + margin * 2, height: imgH + margin * 2 };
  const base = PAGE_SIZES[pageSize];
  if (orientation === 'landscape') return { width: Math.max(base.w, base.h), height: Math.min(base.w, base.h) };
  if (orientation === 'portrait') return { width: Math.min(base.w, base.h), height: Math.max(base.w, base.h) };
  return imgW > imgH
    ? { width: Math.max(base.w, base.h), height: Math.min(base.w, base.h) }
    : { width: Math.min(base.w, base.h), height: Math.max(base.w, base.h) };
};

export const hexToPdfRgb = (hex: string) => {
  const h = hex.replace('#', '');
  const v = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const n = parseInt(v, 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};

/** render image -> processed bytes (rotation + grayscale + bg + quality) */
export const processImageBytes = async (
  item: ImageItem,
  settings: Pick<PdfSettings, 'bgColor' | 'grayscale' | 'quality' | 'imageFormat'>,
): Promise<{ bytes: Uint8Array; isPng: boolean }> => {
  const img = new Image();
  await new Promise<void>((res, rej) => {
    img.onload = () => res();
    img.onerror = () => rej(new Error('decode'));
    img.src = item.dataUrl;
  });
  const rot = ((item.rotation % 360) + 360) % 360;
  const swap = rot === 90 || rot === 270;
  const w = swap ? img.naturalHeight : img.naturalWidth;
  const h = swap ? img.naturalWidth : img.naturalHeight;
  const MAX = 3000;
  const scale = Math.min(1, MAX / Math.max(w, h));
  const cw = Math.round(w * scale), ch = Math.round(h * scale);
  const canvas = document.createElement('canvas');
  canvas.width = cw; canvas.height = ch;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = settings.bgColor;
  ctx.fillRect(0, 0, cw, ch);
  if (settings.grayscale) ctx.filter = 'grayscale(1)';
  ctx.save();
  ctx.translate(cw / 2, ch / 2);
  ctx.rotate((rot * Math.PI) / 180);
  const dw = (rot === 90 || rot === 270) ? ch : cw;
  const dh = (rot === 90 || rot === 270) ? cw : ch;
  ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
  ctx.restore();

  const wantPng = settings.imageFormat === 'png'
    || (settings.imageFormat === 'auto' && item.dataUrl.startsWith('data:image/png') && settings.quality >= 0.95 && !settings.grayscale);
  const mime = wantPng ? 'image/png' : 'image/jpeg';
  const dataUrl = canvas.toDataURL(mime, wantPng ? undefined : settings.quality);
  const res = await fetch(dataUrl);
  const buf = new Uint8Array(await res.arrayBuffer());
  return { bytes: buf, isPng: wantPng };
};

export const buildPdf = async (
  images: ImageItem[],
  settings: PdfSettings,
  onProgress: (percent: number) => void,
): Promise<Uint8Array> => {
  const pdfDoc = await PDFDocument.create();
  if (settings.pdfTitle) pdfDoc.setTitle(settings.pdfTitle);
  if (settings.pdfAuthor) pdfDoc.setAuthor(settings.pdfAuthor);
  pdfDoc.setCreator('UniTool');
  pdfDoc.setProducer('UniTool ImageToPDF');

  const font = settings.showPageNumbers ? await pdfDoc.embedFont(StandardFonts.Helvetica) : null;
  let pageCounter = 0;

  const perPage = settings.imagesPerPage;
  for (let i = 0; i < images.length; i += perPage) {
    const chunk = images.slice(i, i + perPage);
    const first = chunk[0];
    const fSwap = first.rotation === 90 || first.rotation === 270;
    const fw = fSwap ? first.height : first.width;
    const fh = fSwap ? first.width : first.height;
    const { width: pageW, height: pageH } = getPageSize(settings.pageSize, settings.orientation, fw, fh, settings.margin);
    const page = pdfDoc.addPage([pageW, pageH]);
    pageCounter++;
    page.drawRectangle({ x: 0, y: 0, width: pageW, height: pageH, color: hexToPdfRgb(settings.bgColor) });

    const cols = perPage === 1 ? 1 : 2;
    const rows = perPage === 1 ? 1 : 2;
    const gap = Math.min(settings.margin, 24);
    const cellW = (pageW - settings.margin * 2 - gap * (cols - 1)) / cols;
    const cellH = (pageH - settings.margin * 2 - gap * (rows - 1) - (settings.showPageNumbers ? 22 : 0)) / rows;

    for (let c = 0; c < chunk.length; c++) {
      const item = chunk[c];
      const { bytes, isPng } = await processImageBytes(item, settings);
      const embedded = isPng ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);
      const col = c % cols, row = Math.floor(c / cols);
      const cx = settings.margin + col * (cellW + gap);
      const cy = settings.margin + (rows - 1 - row) * (cellH + gap) + (settings.showPageNumbers ? 22 : 0);

      const iw = embedded.width, ih = embedded.height;
      let dw: number, dh: number, dx: number, dy: number;
      if (settings.fitMode === 'stretch') {
        dw = cellW; dh = cellH; dx = cx; dy = cy;
      } else if (settings.fitMode === 'cover') {
        const s = Math.max(cellW / iw, cellH / ih);
        dw = iw * s; dh = ih * s;
        dx = cx + (cellW - dw) / 2; dy = cy + (cellH - dh) / 2;
      } else {
        const s = Math.min(cellW / iw, cellH / ih);
        dw = iw * s; dh = ih * s;
        dx = cx + (cellW - dw) / 2; dy = cy + (cellH - dh) / 2;
      }
      page.drawImage(embedded, { x: dx, y: dy, width: dw, height: dh });
      onProgress(Math.round(((i + c + 1) / images.length) * 90));
    }

    if (settings.showPageNumbers && font) {
      const label = `${pageCounter}`;
      const fs = 10;
      const tw = font.widthOfTextAtSize(label, fs);
      page.drawText(label, { x: (pageW - tw) / 2, y: 10, size: fs, font, color: rgb(0.45, 0.45, 0.45) });
    }
  }
  return pdfDoc.save();
};

export const safeFileName = (fileName: string) => {
  const base = (fileName.trim() || 'images').replace(/[\\/:*?"<>|]/g, '-').slice(0, 80);
  return `${base}.pdf`;
};

export const formatBytes = (bytes: number) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(sizes.length - 1, Math.floor(Math.log(bytes) / Math.log(k)));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const estimatePdfMb = (count: number, imageFormat: string, quality: number) =>
  count === 0 ? 0 : (count * (imageFormat === 'png' ? 1.2 : quality) * 0.35);
