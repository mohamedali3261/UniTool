import {
  Zap,
  Scissors,
  Plus,
  Film,
  LayoutGrid,
  FileText,
  MessageSquareText,
  FileAudio,
  Subtitles,
  QrCode,
  AudioLines,
  Combine,
  ScanLine,
  ScanQrCode,
  ArrowLeftRight,
  Images,
  FileSignature,
  LayoutDashboard,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type NavGroup = 'overview' | 'pdf' | 'images' | 'media' | 'more';

export interface NavItem {
  id: string;
  labelAr: string;
  labelEn: string;
  icon: LucideIcon;
  color: string;
  activeBg: string;
  group: NavGroup;
}

export const navGroupLabels: Record<NavGroup, { ar: string; en: string }> = {
  overview: { ar: 'نظرة عامة', en: 'Overview' },
  pdf: { ar: 'أدوات PDF', en: 'PDF Tools' },
  images: { ar: 'أدوات الصور', en: 'Image Tools' },
  media: { ar: 'الفيديو والصوت', en: 'Video & Audio' },
  more: { ar: 'أدوات أخرى', en: 'More Tools' },
};

export const navItems: NavItem[] = [
  { id: 'toolsHome', labelAr: 'كل الأدوات', labelEn: 'All Tools', icon: LayoutDashboard, color: 'from-indigo-600 to-violet-600', activeBg: 'bg-indigo-600/15 ring-1 ring-indigo-500/30', group: 'overview' },
  { id: 'pdfTools', labelAr: 'أدوات PDF', labelEn: 'PDF Tools', icon: FileText, color: 'from-red-600 to-rose-600', activeBg: 'bg-red-600/15 ring-1 ring-red-500/30', group: 'pdf' },
  { id: 'pdfSigner', labelAr: 'توقيع PDF', labelEn: 'PDF Signer', icon: FileSignature, color: 'from-lime-600 to-green-600', activeBg: 'bg-lime-600/15 ring-1 ring-lime-500/30', group: 'pdf' },
  { id: 'documentScanner', labelAr: 'سكانر المستندات', labelEn: 'Document Scanner', icon: ScanLine, color: 'from-teal-600 to-emerald-600', activeBg: 'bg-teal-600/15 ring-1 ring-teal-500/30', group: 'pdf' },
  { id: 'imageTools', labelAr: 'أدوات الصور', labelEn: 'Image Tools', icon: LayoutGrid, color: 'from-pink-600 to-rose-600', activeBg: 'bg-pink-600/15 ring-1 ring-pink-500/30', group: 'images' },
  { id: 'videoMerger', labelAr: 'دمج الفيديوهات', labelEn: 'Merge Videos', icon: Combine, color: 'from-sky-600 to-blue-600', activeBg: 'bg-sky-600/15 ring-1 ring-sky-500/30', group: 'media' },
  { id: 'videoToGif', labelAr: 'تحويل الفيديو لـ GIF', labelEn: 'Video to GIF', icon: Film, color: 'from-amber-600 to-orange-600', activeBg: 'bg-amber-600/15 ring-1 ring-amber-500/30', group: 'media' },
  { id: 'videoSubtitles', labelAr: 'ترجمة الفيديو', labelEn: 'Video Subtitles', icon: Subtitles, color: 'from-cyan-600 to-teal-600', activeBg: 'bg-cyan-600/15 ring-1 ring-cyan-500/30', group: 'media' },
  { id: 'videoLogo', labelAr: 'إضافة لوجو للفيديو', labelEn: 'Video Logo', icon: Plus, color: 'from-emerald-600 to-teal-600', activeBg: 'bg-emerald-600/15 ring-1 ring-emerald-500/30', group: 'media' },
  { id: 'videoFrames', labelAr: 'استخراج إطارات الفيديو', labelEn: 'Video Frame Extractor', icon: Images, color: 'from-rose-600 to-pink-600', activeBg: 'bg-rose-600/15 ring-1 ring-rose-500/30', group: 'media' },
  { id: 'audioExtractor', labelAr: 'استخراج الصوت من الفيديو', labelEn: 'Extract Audio from Video', icon: AudioLines, color: 'from-emerald-600 to-teal-600', activeBg: 'bg-emerald-600/15 ring-1 ring-emerald-500/30', group: 'media' },
  { id: 'splitter', labelAr: 'قص وتقسيم الصوت', labelEn: 'Audio Splitter', icon: Scissors, color: 'from-sky-600 to-blue-600', activeBg: 'bg-sky-600/15 ring-1 ring-sky-500/30', group: 'media' },
  { id: 'speechToText', labelAr: 'تحويل الكلام إلى نص', labelEn: 'Speech to Text', icon: MessageSquareText, color: 'from-purple-600 to-fuchsia-600', activeBg: 'bg-purple-600/15 ring-1 ring-purple-500/30', group: 'media' },
  { id: 'audioTranscriber', labelAr: 'تفريغ الصوت', labelEn: 'Audio Transcriber', icon: FileAudio, color: 'from-teal-600 to-cyan-600', activeBg: 'bg-teal-600/15 ring-1 ring-teal-500/30', group: 'media' },
  { id: 'compressionTools', labelAr: 'أدوات الضغط', labelEn: 'Compression Tools', icon: Zap, color: 'from-indigo-600 to-blue-600', activeBg: 'bg-indigo-600/15 ring-1 ring-indigo-500/30', group: 'more' },
  { id: 'qrCode', labelAr: 'مولد رمز QR', labelEn: 'QR Code Generator', icon: QrCode, color: 'from-cyan-600 to-blue-600', activeBg: 'bg-cyan-600/15 ring-1 ring-cyan-500/30', group: 'more' },
  { id: 'qrScanner', labelAr: 'قارئ رمز QR', labelEn: 'QR Code Scanner', icon: ScanQrCode, color: 'from-blue-600 to-indigo-600', activeBg: 'bg-blue-600/15 ring-1 ring-blue-500/30', group: 'more' },
  { id: 'formatConverter', labelAr: 'محول الصيغ', labelEn: 'Format Converter', icon: ArrowLeftRight, color: 'from-violet-600 to-purple-600', activeBg: 'bg-violet-600/15 ring-1 ring-violet-500/30', group: 'more' },
];
