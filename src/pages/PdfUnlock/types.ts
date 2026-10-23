export interface PdfUnlockProps {
  t: any;
  lang: 'ar' | 'en';
}

export interface UnlockFile {
  name: string;
  data: Uint8Array;
}

export type PdfUnlockTab = 'upload' | 'settings' | 'export';
