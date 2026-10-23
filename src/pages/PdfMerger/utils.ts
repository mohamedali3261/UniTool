import { PDFDocument } from 'pdf-lib';
import type { PdfFile } from './types';

export const formatSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

export const readPdfFiles = async (fileList: FileList, startId: number): Promise<PdfFile[]> => {
  const newFiles: PdfFile[] = [];
  for (const file of Array.from(fileList)) {
    if (file.type !== 'application/pdf') continue;
    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    const doc = await PDFDocument.load(data);
    newFiles.push({
      id: startId + newFiles.length,
      name: file.name.replace(/\.pdf$/i, ''),
      size: file.size,
      data,
      pageCount: doc.getPageCount(),
    });
  }
  return newFiles;
};

export const mergePdfFiles = async (files: PdfFile[]) => {
  const merged = await PDFDocument.create();
  for (const file of files) {
    const doc = await PDFDocument.load(file.data);
    const pages = await merged.copyPages(doc, doc.getPageIndices());
    pages.forEach(p => merged.addPage(p));
  }
  const bytes = await merged.save();
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'merged.pdf';
  a.click();
  URL.revokeObjectURL(url);
};
