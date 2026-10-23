import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import type { PdfFile } from './types';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const compressPdfFile = async (
  originalFile: File,
  file: PdfFile,
  quality: number,
  dpi: number,
  isAborted: () => boolean,
  onPage: (label: string) => void,
  pageLabel: (page: number, total: number) => string,
): Promise<PdfFile> => {
  try {
    const arrayBuffer = await originalFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
    const numPages = pdf.numPages;
    const scale = dpi / 72;
    const jpegQuality = quality / 100;

    const newDoc = await PDFDocument.create();

    for (let i = 1; i <= numPages; i++) {
      if (isAborted()) { pdf.destroy(); throw new Error('aborted'); }
      onPage(pageLabel(i, numPages));

      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d')!;

      await (page.render as any)({ canvas, viewport }).promise;

      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', jpegQuality));
      if (!blob) { pdf.destroy(); throw new Error('Canvas conversion failed'); }
      const imgBytes = new Uint8Array(await blob.arrayBuffer());

      const img = await newDoc.embedJpg(imgBytes);
      const pageDims = img.scale(1);
      const newPage = newDoc.addPage([pageDims.width, pageDims.height]);
      newPage.drawImage(img, { x: 0, y: 0, width: pageDims.width, height: pageDims.height });
    }

    pdf.destroy();

    const pdfBytes = await newDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const keptOriginal = blob.size >= file.originalSize;
    return { ...file, compressedSize: blob.size, compressedBlob: keptOriginal ? null : blob, keptOriginal, pages: numPages };
  } catch (err: any) {
    if (err?.message !== 'aborted') console.error('PDF compression error:', err);
    return { ...file, keptOriginal: true };
  }
};
