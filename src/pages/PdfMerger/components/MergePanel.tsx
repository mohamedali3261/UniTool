import { Loader2, Plus } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface Props {
  lang: 'ar' | 'en';
  fileCount: number;
  merging: boolean;
  error: string | null;
  onMerge: () => void;
}

export function MergePanel({ lang, fileCount, merging, error, onMerge }: Props) {
  return (
    <>
      {error && <p className="text-[9px] text-red-400 font-mono text-center mb-2">{error}</p>}
      <button onClick={onMerge} disabled={fileCount < 2 || merging} className={cn(
        "w-full py-3 rounded-xl font-bold text-[11px] font-mono transition-all",
        fileCount >= 2 && !merging
          ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:shadow-lg hover:shadow-violet-500/20"
          : "bg-white/[0.06] text-gray-500 cursor-not-allowed"
      )}>
        {merging ? <Loader2 size={16} className="animate-spin mx-auto" /> : (
          <span className="flex items-center justify-center gap-2">
            <Plus size={14} />
            {lang === 'ar' ? `دمج ${fileCount} ملفات` : `Merge ${fileCount} files`}
          </span>
        )}
      </button>
    </>
  );
}
