import type { PageId } from '../types/app';
import type { CompressionSettings } from '../types';

import { AudioSplitter } from '../pages/AudioSplitter';
import { VideoLogo } from '../pages/VideoLogo';
import { ImageCropper } from '../pages/ImageCropper';
import { BackgroundRemover } from '../pages/BackgroundRemover';
import { SpeechToText } from '../pages/SpeechToText';
import { AudioTranscriber } from '../pages/AudioTranscriber';
import { VideoSubtitles } from '../pages/VideoSubtitles';
import { PdfToImage } from '../pages/PdfToImage';
import { ImageCompressor } from '../pages/ImageCompressor';
import { ImageTools } from '../pages/ImageTools';
import { QRCodeGenerator } from '../pages/QRCodeGenerator';
import { VideoToGif } from '../pages/VideoToGif';
import { ImageToPdf } from '../pages/ImageToPdf';
import { PdfToWord } from '../pages/PdfToWord';
import { WordToPdf } from '../pages/WordToPdf';
import { PdfTools } from '../pages/PdfTools';
import { CompressionTools } from '../pages/CompressionTools';
import { OfficeCompressor } from '../pages/OfficeCompressor';
import { VideoCompressor } from '../pages/VideoCompressor';
import { PdfCompressor } from '../pages/PdfCompressor';
import { PdfMerger } from '../pages/PdfMerger';
import { PdfSplitter } from '../pages/PdfSplitter';
import { PdfToText } from '../pages/PdfToText';
import { PdfUnlock } from '../pages/PdfUnlock';
import { PdfProtect } from '../pages/PdfProtect';

interface Props {
  currentPage: PageId;
  lang: 'ar' | 'en';
  t: any;
  onNavigate: (page: string) => void;
  // Audio workspace props
  files: any[];
  settings: CompressionSettings;
  onSettingsChange: (s: CompressionSettings) => void;
  activeTab: 'queue' | 'workstation' | 'settings';
  onActiveTabChange: (tab: 'queue' | 'workstation' | 'settings') => void;
  selectedFile: any;
  onSelectFile: (id: string) => void;
  onRemoveFile: (id: string) => void;
  onDownloadFile: (f: any) => void;
  onFilesAdded: (files: File[]) => void;
  onProcessAll: () => void;
  onClearFiles: () => void;
  onDownloadAllFiles: () => void;
  onDownloadAllAsZip: () => void;
  onTrimChange: (id: string, start: number, end: number) => void;
  isAnyProcessing: boolean;
  hasIdleFiles: boolean;
  hasCompletedFiles: boolean;
}

export function PageRouter({
  currentPage,
  lang,
  t,
  onNavigate,
  ...audioProps
}: Props) {
  const p = { t, lang };

  switch (currentPage) {
    case 'videoSubtitles':
      return <VideoSubtitles {...p} />;
    case 'audioTranscriber':
      return <AudioTranscriber {...p} />;
    case 'speechToText':
      return <SpeechToText {...p} />;
    case 'splitter':
      return <AudioSplitter {...p} />;
    case 'videoLogo':
      return <VideoLogo {...p} />;
    case 'imageCropper':
      return <ImageCropper {...p} />;
    case 'bgRemover':
      return <BackgroundRemover {...p} />;
    case 'pdfToImage':
      return <PdfToImage {...p} />;
    case 'imageCompressor':
      return <ImageCompressor {...p} />;
    case 'imageTools':
      return <ImageTools {...p} onNavigate={onNavigate} />;
    case 'officeCompressor':
      return <OfficeCompressor {...p} />;
    case 'videoCompressor':
      return <VideoCompressor {...p} />;
    case 'pdfCompressor':
      return <PdfCompressor {...p} />;
    case 'qrCode':
      return <QRCodeGenerator {...p} />;
    case 'videoToGif':
      return <VideoToGif {...p} />;
    case 'imageToPdf':
      return <ImageToPdf {...p} />;
    case 'pdfToWord':
      return <PdfToWord {...p} />;
    case 'wordToPdf':
      return <WordToPdf {...p} />;
    case 'pdfTools':
      return <PdfTools {...p} onNavigate={onNavigate} />;
    case 'pdfMerger':
      return <PdfMerger {...p} />;
    case 'pdfSplitter':
      return <PdfSplitter {...p} />;
    case 'pdfToText':
      return <PdfToText {...p} />;
    case 'pdfUnlock':
      return <PdfUnlock {...p} />;
    case 'pdfProtect':
      return <PdfProtect {...p} />;
    case 'compressionTools':
      return <CompressionTools {...p} onNavigate={onNavigate} />;
    default:
      return <AudioWorkspace {...audioProps} {...p} />;
  }
}

// Import AudioWorkspace inline to avoid circular dependency
import { AudioWorkspace } from './AudioWorkspace';
