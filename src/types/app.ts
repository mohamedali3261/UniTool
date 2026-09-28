export type PageId =
  | 'compress'
  | 'splitter'
  | 'videoLogo'
  | 'imageCropper'
  | 'speechToText'
  | 'audioTranscriber'
  | 'videoSubtitles'
  | 'audioExtractor'
  | 'videoMerger'
  | 'pdfToImage'
  | 'imageCompressor'
  | 'imageTools'
  | 'officeCompressor'
  | 'compressionTools'
  | 'videoCompressor'
  | 'pdfCompressor'
  | 'qrCode'
  | 'videoToGif'
  | 'imageToPdf'
  | 'pdfToWord'
  | 'wordToPdf'
  | 'pdfTools'
  | 'pdfMerger'
  | 'pdfSplitter'
  | 'pdfUnlock'
  | 'pdfProtect';

export type FileHandoffTarget = 'imageCropper' | 'imageCompressor' | 'imageToPdf';

export interface FileHandoff {
  id: number;
  target: FileHandoffTarget;
  files: File[];
}
