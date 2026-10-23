export interface PageImage {
  id: number;
  dataUrl: string;
  width: number;
  height: number;
  name: string;
  originalDataUrl?: string;
  originalWidth?: number;
  originalHeight?: number;
}

export type ImageFormat = 'png' | 'jpeg';
