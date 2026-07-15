export interface PDFElement {
  id: string;
  type: 'text' | 'image' | 'rectangle' | 'ellipse' | 'line';
  x: number;
  y: number;
  width: number;
  height: number;
  pageIndex: number;
  content?: string;
  fontSize?: number;
  color?: string;
  fontWeight?: string;
  src?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  rotation?: number;
  opacity?: number;
  filter?: string;
}

export interface PDFFileState {
  file: File | null;
  numPages: number;
  currentPage: number;
  elements: PDFElement[];
  selectedElementId: string | null;
  loading: boolean;
  error: string | null;
  pageRotations: Record<number, number>;
  pageWidth?: number;
  pageHeight?: number;
}
