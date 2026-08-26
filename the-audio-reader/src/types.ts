export type FileType = 'pdf' | 'txt' | 'epub' | 'docx' | 'ocr' | 'sample';
export type DetectedLanguage = 'ar' | 'en' | 'mixed';
export type UILanguage = 'ar' | 'en';
export type ThemeMode = 'dark' | 'midnight' | 'sepia' | 'light';
export type FontFamily = 'cairo' | 'amiri' | 'tajawal' | 'sans' | 'serif';
export type HighlightMode = 'sentence' | 'word' | 'paragraph' | 'glow' | 'underline';

export interface BookChunk {
  id: string;
  pageNumber: number;
  chunkIndex: number;
  text: string;
  language: 'ar' | 'en';
  startChar: number;
  endChar: number;
  isHeading?: boolean;
}

export interface BookPage {
  pageNumber: number;
  title?: string;
  rawText: string;
  chunks: BookChunk[];
  wordCount: number;
  isScannedImage?: boolean;
}

export interface BookDocument {
  id: string;
  title: string;
  author?: string;
  fileType: FileType;
  fileSize?: number;
  totalPages: number;
  totalWords: number;
  detectedLanguage: DetectedLanguage;
  pages: BookPage[];
  dateAdded: number;
  lastReadPage: number;
  lastReadChunkIndex: number;
  progressPercentage: number;
  hasOcrProcessed?: boolean;
}

export type ReadingMode = 'page' | 'sentence';

export interface ReaderSettings {
  fontSize: number; // 14 to 32
  lineHeight: number; // 1.5 to 2.4
  fontFamily: FontFamily;
  theme: ThemeMode;
  speechRate: number; // 0.5 to 2.0
  pitch: number; // 0.5 to 1.5
  volume: number; // 0.0 to 1.0
  selectedArabicVoiceURI: string | null;
  selectedEnglishVoiceURI: string | null;
  autoVoiceSelect: boolean;
  autoScroll: boolean;
  autoScrollSpeed: number;
  highlightMode: HighlightMode;
  uiLanguage: UILanguage;
  readingMode: ReadingMode;
}

export interface DeviceVoice {
  voiceURI: string;
  name: string;
  lang: string;
  isDefault: boolean;
  isArabic: boolean;
  isEnglish: boolean;
  localService: boolean;
}

export type PlaybackStatus = 'idle' | 'playing' | 'paused' | 'ended' | 'error';

export interface PlaybackState {
  status: PlaybackStatus;
  currentPage: number;
  currentChunkIndex: number;
  currentChunkId: string | null;
  currentWordIndex: number; // for word-level highlighting
  currentWordCharRange: { start: number; end: number } | null;
  totalChunksInBook: number;
  globalChunkIndex: number;
  errorMessage?: string;
}

export interface OCRJobState {
  isActive: boolean;
  currentPage: number;
  totalPages: number;
  pageProgress: number; // 0 to 100
  overallProgress: number; // 0 to 100
  statusMessage: string;
  targetLang: 'ara' | 'eng' | 'ara+eng';
}

export interface Bookmark {
  id: string;
  bookId: string;
  pageNumber: number;
  chunkIndex: number;
  snippet: string;
  createdAt: number;
}
