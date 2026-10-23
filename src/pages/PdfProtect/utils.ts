import { PDFDocument } from 'pdf-lib';
import type { ProtectFile } from './types';

export const readPdfFile = async (f: File): Promise<ProtectFile> => {
  const data = new Uint8Array(await f.arrayBuffer());
  return { name: f.name.replace(/\.pdf$/i, ''), data };
};

export const protectPdfFile = async (file: ProtectFile): Promise<void> => {
  const doc = await PDFDocument.load(file.data);
  const protectedBytes = await doc.save();
  const blob = new Blob([protectedBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${file.name}_protected.pdf`;
  a.click();
  URL.revokeObjectURL(url);
};
