export interface ImageItem {
  id: number;
  name: string;
  dataUrl: string;
  width: number;
  height: number;
  rotation: number;
  sizeBytes: number;
  originalDataUrl?: string;
  originalWidth?: number;
  originalHeight?: number;
}

export type PageSizeKey = 'fit' | 'a5' | 'a4' | 'a3' | 'letter' | 'legal';
export type FitMode = 'contain' | 'cover' | 'stretch';
export type Orientation = 'portrait' | 'landscape' | 'auto';
export type ImageFormat = 'auto' | 'jpeg' | 'png';

export interface PdfSettings {
  pageSize: PageSizeKey;
  orientation: Orientation;
  fitMode: FitMode;
  margin: number;
  imagesPerPage: 1 | 2 | 4;
  quality: number;
  imageFormat: ImageFormat;
  grayscale: boolean;
  bgColor: string;
  showPageNumbers: boolean;
  fileName: string;
  pdfTitle: string;
  pdfAuthor: string;
}

export interface SettingsSnapshot {
  pageSize?: PageSizeKey;
  orientation?: Orientation;
  fitMode?: FitMode;
  margin?: number;
  imagesPerPage?: 1 | 2 | 4;
  quality?: number;
  imageFormat?: ImageFormat;
  grayscale?: boolean;
  bgColor?: string;
  showPageNumbers?: boolean;
  fileName?: string;
}
