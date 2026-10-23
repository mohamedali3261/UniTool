export interface PdfProtectProps {
  t: any;
  lang: 'ar' | 'en';
}

export interface ProtectFile {
  name: string;
  data: Uint8Array;
}

export type PdfProtectTab = 'upload' | 'settings' | 'export';
