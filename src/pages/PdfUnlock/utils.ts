import { PDFDocument } from 'pdf-lib';
import type { UnlockFile } from './types';

export class PdfPasswordRequiredError extends Error {}

export const readPdfFile = async (f: File): Promise<UnlockFile> => {
  const data = new Uint8Array(await f.arrayBuffer());
  return { name: f.name.replace(/\.pdf$/i, ''), data };
};

export const unlockPdfFile = async (file: UnlockFile, password: string): Promise<void> => {
  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(file.data);
  } catch {
    if (!password) throw new PdfPasswordRequiredError();
    doc = await PDFDocument.load(file.data, { password } as any);
  }
  const bytes = await doc.save();
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${file.name}_unlocked.pdf`;
  a.click();
  URL.revokeObjectURL(url);
};
