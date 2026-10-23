import { Loader2, Scissors } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { SplitMode } from '../types';

interface Props {
  lang: 'ar' | 'en';
  hasFile: boolean;
  selectedCount: number;
  effectiveCount: number;
  mode: SplitMode;
  splitting: boolean;
  error: string | null;
  onSplit: () => void;
}

export function SplitPanel({ lang, hasFile, selectedCount, effectiveCount, mode, splitting, error, onSplit }: Props) {
  return (
    <>
      {error && <p className="text-[9px] text-red-400 font-mono text-center mb-2">{error}</p>}
      <button onClick={onSplit} disabled={!hasFile || selectedCount === 0 || splitting} className={cn(
        "w-full py-3 rounded-xl font-bold text-[11px] font-mono transition-all",
        hasFile && selectedCount > 0 && !splitting
          ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:shadow-lg hover:shadow-emerald-500/20"
          : "bg-white/[0.06] text-gray-500 cursor-not-allowed"
      )}>
        {splitting ? <Loader2 size={16} className="animate-spin mx-auto" /> : (
          <span className="flex items-center justify-center gap-2">
            <Scissors size={14} />
            {mode === 'extract'
              ? (lang === 'ar' ? `استخراج ${effectiveCount} صفحة` : `Extract ${effectiveCount} pages`)
              : (lang === 'ar' ? `حذف ${selectedCount} صفحة` : `Remove ${selectedCount} pages`)
            }
          </span>
        )}
      </button>
    </>
  );
}
