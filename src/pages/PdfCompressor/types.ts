export interface PdfFile {
  id: number;
  name: string;
  originalSize: number;
  compressedSize: number;
  compressedBlob: Blob | null;
  keptOriginal: boolean;
  pages: number;
}
