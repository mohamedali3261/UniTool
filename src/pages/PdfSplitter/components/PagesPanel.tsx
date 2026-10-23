import { cn } from '../../../lib/utils';
import type { SplitMode } from '../types';

interface Props {
  lang: 'ar' | 'en';
  pageCount: number;
  selectedPages: Set<number>;
  mode: SplitMode;
  onModeChange: (mode: SplitMode) => void;
  onTogglePage: (page: number) => void;
  onSelectRange: (from: number, to: number) => void;
  onClear: () => void;
}

export function PagesPanel({ lang, pageCount, selectedPages, mode, onModeChange, onTogglePage, onSelectRange, onClear }: Props) {
  return (
    <>
      <div className="flex items-center gap-2 mb-3">
        <button onClick={() => onModeChange('extract')} className={cn(
          "flex-1 py-1.5 rounded-lg text-[9px] font-mono transition-all",
          mode === 'extract' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/[0.04] text-gray-500 border border-white/[0.06]'
        )}>
          {lang === 'ar' ? 'استخراج' : 'Extract'}
        </button>
        <button onClick={() => onModeChange('remove')} className={cn(
          "flex-1 py-1.5 rounded-lg text-[9px] font-mono transition-all",
          mode === 'remove' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/[0.04] text-gray-500 border border-white/[0.06]'
        )}>
          {lang === 'ar' ? 'حذف' : 'Remove'}
        </button>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <button onClick={() => onSelectRange(1, Math.ceil(pageCount / 2))} className="px-2 py-1 rounded-md bg-white/[0.04] text-[8px] font-mono text-gray-400 hover:bg-white/[0.08]">
          {lang === 'ar' ? 'النصف الأول' : 'First half'}
        </button>
        <button onClick={() => onSelectRange(Math.ceil(pageCount / 2) + 1, pageCount)} className="px-2 py-1 rounded-md bg-white/[0.04] text-[8px] font-mono text-gray-400 hover:bg-white/[0.08]">
          {lang === 'ar' ? 'النصف الثاني' : 'Second half'}
        </button>
        <button onClick={onClear} className="px-2 py-1 rounded-md bg-white/[0.04] text-[8px] font-mono text-gray-400 hover:bg-white/[0.08]">
          {lang === 'ar' ? 'مسح' : 'Clear'}
        </button>
      </div>

      <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
        {Array.from({ length: pageCount }, (_, i) => i + 1).map(page => (
          <button key={page} onClick={() => onTogglePage(page)} className={cn(
            "aspect-square rounded-lg text-[10px] font-mono font-bold transition-all border",
            selectedPages.has(page)
              ? mode === 'extract' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-red-500/20 border-red-500/40 text-red-400'
              : 'bg-white/[0.03] border-white/[0.06] text-gray-500 hover:bg-white/[0.06]'
          )}>
            {page}
          </button>
        ))}
      </div>
    </>
  );
}
