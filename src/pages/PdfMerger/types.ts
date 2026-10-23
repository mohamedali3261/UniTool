export interface PdfMergerProps {
  t: any;
  lang: 'ar' | 'en';
}

export interface PdfFile {
  id: number;
  name: string;
  size: number;
  data: Uint8Array;
  pageCount: number;
}

export type PdfMergerTab = 'upload' | 'files' | 'export';
