export interface PdfSplitterProps {
  t: any;
  lang: 'ar' | 'en';
}

export interface SplitFile {
  name: string;
  data: Uint8Array;
  pageCount: number;
}

export type SplitMode = 'extract' | 'remove';

export type PdfSplitterTab = 'upload' | 'pages' | 'export';
