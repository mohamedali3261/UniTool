import { PDFDocument } from 'pdf-lib';
import type { SplitFile, SplitMode } from './types';

export const readPdfFile = async (f: File): Promise<SplitFile> => {
  const data = new Uint8Array(await f.arrayBuffer());
  const doc = await PDFDocument.load(data);
  return { name: f.name.replace(/\.pdf$/i, ''), data, pageCount: doc.getPageCount() };
};

export const splitPdfFile = async (file: SplitFile, selectedPages: Set<number>, mode: SplitMode): Promise<boolean> => {
  const srcDoc = await PDFDocument.load(file.data);
  const newDoc = await PDFDocument.create();
  const pages = mode === 'extract'
    ? Array.from(selectedPages).sort((a, b) => a - b)
    : Array.from({ length: file.pageCount }, (_, i) => i + 1).filter(p => !selectedPages.has(p));

  if (pages.length === 0) {
    return false;
  }

  const copied = await newDoc.copyPages(srcDoc, pages.map(p => p - 1));
  copied.forEach(p => newDoc.addPage(p));
  const bytes = await newDoc.save();
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${file.name}_split.pdf`;
  a.click();
  URL.revokeObjectURL(url);
  return true;
};
