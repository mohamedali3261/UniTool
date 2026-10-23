import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface Props {
  lang: 'ar' | 'en';
  hasPages: boolean;
  loading: boolean;
  error: string | null;
  onFiles: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearAll: () => void;
}

export const ACCEPTED_TYPES = '.pdf,image/*';

export function UploadPanel({ lang, hasPages, loading, error, onFiles, onClearAll }: Props) {
  return (
    <div className="p-3 border-b border-[#2D3139] sm:p-4">
      <label className={cn(
        "flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-[#2D3139] rounded-lg cursor-pointer hover:border-orange-500/50 transition-colors bg-[#0F1115]",
        hasPages ? "border-orange-500/30" : ""
      )}>
        <ImagePlus size={20} className={hasPages ? "text-orange-500" : "text-gray-500"} />
        <span className="text-[9px] font-mono text-gray-400 text-center leading-relaxed">
          {hasPages
            ? (lang === 'ar' ? 'إضافة المزيد من الملفات' : 'Add more files')
            : (lang === 'ar' ? 'اختر صور أو ملف PDF' : 'Select images or PDF')}
        </span>
        <span className="text-[7px] font-mono text-gray-600">
          {lang === 'ar' ? 'يدعم PDF, PNG, JPG, WEBP, GIF, BMP' : 'Supports PDF, PNG, JPG, WEBP, GIF, BMP'}
        </span>
        <input type="file" accept={ACCEPTED_TYPES} multiple className="hidden" onChange={onFiles} />
      </label>
      {error && <p className="text-[8px] text-red-400 mt-2 font-mono">{error}</p>}
      {loading && (
        <div className="flex items-center gap-2 mt-3 text-[8px] text-gray-400 font-mono">
          <Loader2 size={10} className="animate-spin" />
          {lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}
        </div>
      )}
      {hasPages && (
        <button
          onClick={onClearAll}
          className="w-full mt-3 py-2 flex items-center justify-center gap-1.5 text-[8px] font-mono text-red-400 hover:text-red-300 border border-red-900/30 hover:border-red-500/50 rounded-md transition-all bg-red-950/20"
        >
          <Trash2 size={10} />
          {lang === 'ar' ? 'مسح الكل' : 'Clear all'}
        </button>
      )}
    </div>
  );
}
