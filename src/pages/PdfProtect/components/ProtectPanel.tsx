import { Loader2, Lock } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface Props {
  lang: 'ar' | 'en';
  protecting: boolean;
  error: string | null;
  success: boolean;
  canProtect: boolean;
  onProtect: () => void;
}

export function ProtectPanel({ lang, protecting, error, success, canProtect, onProtect }: Props) {
  return (
    <>
      {error && <p className="text-[9px] text-red-400 font-mono text-center mb-2">{error}</p>}
      {success && <p className="text-[9px] text-emerald-400 font-mono text-center mb-2">{lang === 'ar' ? 'تم حماية الملف بنجاح' : 'File protected successfully'}</p>}
      <button onClick={onProtect} disabled={!canProtect || protecting} className={cn(
        "w-full py-3 rounded-xl font-bold text-[11px] font-mono transition-all",
        canProtect && !protecting
          ? "bg-gradient-to-r from-rose-600 to-pink-600 text-white hover:shadow-lg hover:shadow-rose-500/20"
          : "bg-white/[0.06] text-gray-500 cursor-not-allowed"
      )}>
        {protecting ? <Loader2 size={16} className="animate-spin mx-auto" /> : (
          <span className="flex items-center justify-center gap-2">
            <Lock size={14} />
            {lang === 'ar' ? 'حماية وتحميل' : 'Protect & Download'}
          </span>
        )}
      </button>
    </>
  );
}
