import { Scissors } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { PdfSplitterTab } from '../types';

interface Props {
  lang: 'ar' | 'en';
  mobileTab: PdfSplitterTab;
  onTabChange: (tab: PdfSplitterTab) => void;
}

export function Header({ lang, mobileTab, onTabChange }: Props) {
  return (
    <>
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] bg-[#0F1115]/50 shrink-0 sm:px-4 sm:py-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 sm:w-8 sm:h-8">
          <Scissors size={14} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xs font-bold text-white sm:text-sm">{lang === 'ar' ? 'تقسيم ملف PDF' : 'Split PDF File'}</h1>
          <p className="text-[8px] text-gray-500 font-mono sm:text-[9px]">{lang === 'ar' ? 'استخراج أو حذف صفحات محددة' : 'Extract or remove specific pages'}</p>
        </div>
      </div>

      <div className="flex border-b border-white/[0.06] md:hidden shrink-0">
        {(['upload', 'pages', 'export'] as const).map(tab => (
          <button key={tab} onClick={() => onTabChange(tab)} className={cn(
            "flex-1 py-2 text-[9px] font-mono uppercase tracking-wider transition-colors",
            mobileTab === tab ? 'text-white border-b-2 border-emerald-500' : 'text-gray-500'
          )}>
            {tab === 'upload' ? (lang === 'ar' ? 'رفع' : 'Upload') : tab === 'pages' ? (lang === 'ar' ? 'الصفحات' : 'Pages') : (lang === 'ar' ? 'تقسيم' : 'Split')}
          </button>
        ))}
      </div>
    </>
  );
}
