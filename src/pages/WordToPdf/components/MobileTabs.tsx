import { Upload, FileText, FileDown } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { MobileTab } from '../types';

interface Props {
  lang: 'ar' | 'en';
  mobileTab: MobileTab;
  onChange: (tab: MobileTab) => void;
}

export function MobileTabs({ lang, mobileTab, onChange }: Props) {
  return (
    <div className="flex border-b border-[#2D3139] bg-[#14171C] sm:hidden shrink-0">
      {[
        { id: 'upload', label: lang === 'ar' ? 'رفع' : 'Upload', icon: Upload },
        { id: 'preview', label: lang === 'ar' ? 'معاينة' : 'Preview', icon: FileText },
        { id: 'export', label: lang === 'ar' ? 'تصدير' : 'Export', icon: FileDown },
      ].map(tab => (
        <button key={tab.id} onClick={() => onChange(tab.id as MobileTab)}
          className={cn("flex-1 py-2.5 flex flex-col items-center gap-1 font-mono text-[7px] uppercase tracking-widest transition-colors", mobileTab === tab.id ? "text-blue-500 bg-[#1A1D23]" : "text-gray-500")}>
          <tab.icon size={12} />
          {tab.label}
        </button>
      ))}
    </div>
  );
}
