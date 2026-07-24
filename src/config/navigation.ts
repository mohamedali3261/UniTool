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
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  id: string;
  labelAr: string;
  labelEn: string;
  icon: LucideIcon;
}

export interface MobileNavItem extends NavItem {
  color: string;
  activeBg: string;
}

export const desktopNavItems: NavItem[] = [
  { id: 'compressionTools', labelAr: 'ضغط', labelEn: 'Compress', icon: Zap },
  { id: 'splitter', labelAr: 'قص', labelEn: 'Split', icon: Scissors },
  { id: 'videoLogo', labelAr: 'لوجو', labelEn: 'Logo', icon: Plus },
  { id: 'videoToGif', labelAr: 'GIF', labelEn: 'GIF', icon: Film },
  { id: 'imageTools', labelAr: 'صور', labelEn: 'Images', icon: LayoutGrid },
  { id: 'qrCode', labelAr: 'QR', labelEn: 'QR', icon: LayoutGrid },
  { id: 'pdfTools', labelAr: 'أدوات PDF', labelEn: 'PDF', icon: FileText },
  { id: 'speechToText', labelAr: 'نص', labelEn: 'STT', icon: MessageSquareText },
  { id: 'audioTranscriber', labelAr: 'تفريغ', labelEn: 'Transcribe', icon: FileAudio },
  { id: 'videoSubtitles', labelAr: 'ترجمة', labelEn: 'Subtitles', icon: Subtitles },
];

export const mobileNavItems: MobileNavItem[] = [
  { id: 'compressionTools', labelAr: 'ضغط', labelEn: 'Compress', icon: Zap, color: 'from-indigo-600 to-indigo-500', activeBg: 'bg-indigo-600/20 ring-1 ring-indigo-500/30' },
  { id: 'splitter', labelAr: 'قص', labelEn: 'Split', icon: Scissors, color: 'from-indigo-600 to-indigo-500', activeBg: 'bg-indigo-600/20 ring-1 ring-indigo-500/30' },
  { id: 'videoLogo', labelAr: 'لوجو', labelEn: 'Logo', icon: Plus, color: 'from-indigo-600 to-indigo-500', activeBg: 'bg-indigo-600/20 ring-1 ring-indigo-500/30' },
  { id: 'videoToGif', labelAr: 'GIF', labelEn: 'GIF', icon: Film, color: 'from-amber-600 to-orange-600', activeBg: 'bg-amber-600/20 ring-1 ring-amber-500/30' },
  { id: 'imageTools', labelAr: 'صور', labelEn: 'Images', icon: LayoutGrid, color: 'from-pink-600 to-rose-600', activeBg: 'bg-pink-600/20 ring-1 ring-pink-500/30' },
  { id: 'qrCode', labelAr: 'QR', labelEn: 'QR', icon: LayoutGrid, color: 'from-cyan-600 to-blue-600', activeBg: 'bg-cyan-600/20 ring-1 ring-cyan-500/30' },
  { id: 'pdfTools', labelAr: 'أدوات PDF', labelEn: 'PDF Tools', icon: FileText, color: 'from-red-600 to-rose-600', activeBg: 'bg-red-600/20 ring-1 ring-red-500/30' },
  { id: 'speechToText', labelAr: 'نص', labelEn: 'Speech', icon: MessageSquareText, color: 'from-purple-600 to-purple-500', activeBg: 'bg-purple-600/20 ring-1 ring-purple-500/30' },
  { id: 'audioTranscriber', labelAr: 'تفريغ', labelEn: 'Transcribe', icon: FileAudio, color: 'from-cyan-600 to-cyan-500', activeBg: 'bg-cyan-600/20 ring-1 ring-cyan-500/30' },
  { id: 'videoSubtitles', labelAr: 'ترجمة', labelEn: 'Subtitles', icon: Subtitles, color: 'from-cyan-600 to-cyan-500', activeBg: 'bg-cyan-600/20 ring-1 ring-cyan-500/30' },
];
