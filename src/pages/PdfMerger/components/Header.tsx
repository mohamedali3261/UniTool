import { FileText } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { PdfMergerTab } from '../types';

interface Props {
  lang: 'ar' | 'en';
  fileCount: number;
  mobileTab: PdfMergerTab;
  onTabChange: (tab: PdfMergerTab) => void;
}

export function Header({ lang, fileCount, mobileTab, onTabChange }: Props) {
  return (
    <>
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] bg-[#0F1115]/50 shrink-0 sm:px-4 sm:py-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20 sm:w-8 sm:h-8">
          <FileText size={14} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xs font-bold text-white sm:text-sm">{lang === 'ar' ? 'دمج ملفات PDF' : 'Merge PDF Files'}</h1>
          <p className="text-[8px] text-gray-500 font-mono sm:text-[9px]">{lang === 'ar' ? 'دمج عدة ملفات PDF في ملف واحد' : 'Combine multiple PDF files into one'}</p>
        </div>
      </div>

      <div className="flex border-b border-white/[0.06] md:hidden shrink-0">
        {(['upload', 'files', 'export'] as const).map(tab => (
          <button key={tab} onClick={() => onTabChange(tab)} className={cn(
            "flex-1 py-2 text-[9px] font-mono uppercase tracking-wider transition-colors",
            mobileTab === tab ? 'text-white border-b-2 border-violet-500' : 'text-gray-500'
          )}>
            {tab === 'upload' ? (lang === 'ar' ? 'رفع' : 'Upload') : tab === 'files' ? (lang === 'ar' ? 'الملفات' : 'Files') : (lang === 'ar' ? 'دمج' : 'Merge')}
            {tab === 'files' && fileCount > 0 && <span className="ml-1 text-violet-400">({fileCount})</span>}
          </button>
        ))}
      </div>
    </>
  );
}
