import { Loader2, Unlock } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface Props {
  lang: 'ar' | 'en';
  unlocking: boolean;
  error: string | null;
  success: boolean;
  onUnlock: () => void;
}

export function UnlockPanel({ lang, unlocking, error, success, onUnlock }: Props) {
  return (
    <>
      {error && <p className="text-[9px] text-red-400 font-mono text-center mb-2">{error}</p>}
      {success && <p className="text-[9px] text-emerald-400 font-mono text-center mb-2">{lang === 'ar' ? 'تم فتح الملف بنجاح' : 'File unlocked successfully'}</p>}
      <button onClick={onUnlock} disabled={unlocking} className={cn(
        "w-full py-3 rounded-xl font-bold text-[11px] font-mono transition-all",
        !unlocking
          ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:shadow-lg hover:shadow-amber-500/20"
          : "bg-white/[0.06] text-gray-500 cursor-wait"
      )}>
        {unlocking ? <Loader2 size={16} className="animate-spin mx-auto" /> : (
          <span className="flex items-center justify-center gap-2">
            <Unlock size={14} />
            {lang === 'ar' ? 'فتح القفل وتحميل' : 'Unlock & Download'}
          </span>
        )}
      </button>
    </>
  );
}
