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
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  id: string;
  labelAr: string;
  labelEn: string;
  icon: LucideIcon;
  color: string;
  activeBg: string;
}

export const navItems: NavItem[] = [
  { id: 'audioExtractor', labelAr: 'استخراج الصوت من الفيديو', labelEn: 'Extract Audio from Video', icon: AudioLines, color: 'from-emerald-600 to-teal-600', activeBg: 'bg-emerald-600/15 ring-1 ring-emerald-500/30' },
  { id: 'videoMerger', labelAr: 'دمج الفيديوهات', labelEn: 'Merge Videos', icon: Combine, color: 'from-sky-600 to-blue-600', activeBg: 'bg-sky-600/15 ring-1 ring-sky-500/30' },
  { id: 'videoToGif', labelAr: 'تحويل الفيديو لـ GIF', labelEn: 'Video to GIF', icon: Film, color: 'from-amber-600 to-orange-600', activeBg: 'bg-amber-600/15 ring-1 ring-amber-500/30' },
  { id: 'videoSubtitles', labelAr: 'ترجمة الفيديو', labelEn: 'Video Subtitles', icon: Subtitles, color: 'from-cyan-600 to-teal-600', activeBg: 'bg-cyan-600/15 ring-1 ring-cyan-500/30' },
  { id: 'imageTools', labelAr: 'أدوات الصور', labelEn: 'Image Tools', icon: LayoutGrid, color: 'from-pink-600 to-rose-600', activeBg: 'bg-pink-600/15 ring-1 ring-pink-500/30' },
  { id: 'pdfTools', labelAr: 'أدوات PDF', labelEn: 'PDF Tools', icon: FileText, color: 'from-red-600 to-rose-600', activeBg: 'bg-red-600/15 ring-1 ring-red-500/30' },
  { id: 'compressionTools', labelAr: 'أدوات الضغط', labelEn: 'Compression Tools', icon: Zap, color: 'from-indigo-600 to-blue-600', activeBg: 'bg-indigo-600/15 ring-1 ring-indigo-500/30' },
  { id: 'splitter', labelAr: 'قص وتقسيم الصوت', labelEn: 'Audio Splitter', icon: Scissors, color: 'from-sky-600 to-blue-600', activeBg: 'bg-sky-600/15 ring-1 ring-sky-500/30' },
  { id: 'videoLogo', labelAr: 'إضافة لوجو للفيديو', labelEn: 'Video Logo', icon: Plus, color: 'from-emerald-600 to-teal-600', activeBg: 'bg-emerald-600/15 ring-1 ring-emerald-500/30' },
  { id: 'qrCode', labelAr: 'مولد رمز QR', labelEn: 'QR Code Generator', icon: QrCode, color: 'from-cyan-600 to-blue-600', activeBg: 'bg-cyan-600/15 ring-1 ring-cyan-500/30' },
  { id: 'speechToText', labelAr: 'تحويل الكلام إلى نص', labelEn: 'Speech to Text', icon: MessageSquareText, color: 'from-purple-600 to-fuchsia-600', activeBg: 'bg-purple-600/15 ring-1 ring-purple-500/30' },
  { id: 'audioTranscriber', labelAr: 'تفريغ الصوت', labelEn: 'Audio Transcriber', icon: FileAudio, color: 'from-teal-600 to-cyan-600', activeBg: 'bg-teal-600/15 ring-1 ring-teal-500/30' },
];
