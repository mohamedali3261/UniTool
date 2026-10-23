import { useRef } from 'react';
import { ImagePlus, Loader2, ArrowLeftRight, Trash2 } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface Props {
  lang: 'ar' | 'en';
  imageCount: number;
  loading: boolean;
  error: string | null;
  success: string | null;
  dragOver: boolean;
  onFiles: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onReverse: () => void;
  onSortByName: () => void;
  onClearAll: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export function UploadPanel({
  lang, imageCount, loading, error, success, dragOver,
  onFiles, onReverse, onSortByName, onClearAll, fileInputRef,
}: Props) {
  const localRef = useRef<HTMLInputElement>(null);
  const inputRef = fileInputRef || localRef;

  return (
    <div className="p-3 border-b border-[#2D3139] sm:p-4">
      <label className={cn("flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed rounded-lg cursor-pointer transition-colors bg-[#0F1115]", dragOver ? "border-red-500 bg-red-500/5" : imageCount > 0 ? "border-red-500/30 hover:border-red-500/60" : "border-[#2D3139] hover:border-red-500/50")}>
        <ImagePlus size={22} className={imageCount > 0 ? "text-red-500" : "text-gray-500"} />
        <span className="text-[10px] font-mono text-gray-300 text-center leading-relaxed font-bold">
          {imageCount > 0 ? (lang === 'ar' ? 'إضافة المزيد (سحب / لصق / اختيار)' : 'Add more (drop / paste / browse)') : (lang === 'ar' ? 'اختر صور أو اسحبها هنا' : 'Select or drop images')}
        </span>
        <span className="text-[7px] font-mono text-gray-600">PNG · JPG · WEBP · BMP · GIF · AVIF</span>
        <input ref={inputRef} type="file" accept="image/*,.heic,.heif" multiple className="hidden" onChange={onFiles} />
      </label>
      {error && <p className="text-[9px] text-red-400 mt-2 font-mono bg-red-500/10 border border-red-500/20 rounded p-2">{error}</p>}
      {success && <p className="text-[9px] text-green-400 mt-2 font-mono bg-green-500/10 border border-green-500/20 rounded p-2">✅ {success}</p>}
      {loading && (
        <div className="flex items-center gap-2 mt-3 text-[9px] text-gray-400 font-mono">
          <Loader2 size={11} className="animate-spin" />
          {lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}
        </div>
      )}
      {imageCount > 0 && (
        <div className="flex gap-2 mt-3">
          <button onClick={onReverse} title={lang === 'ar' ? 'عكس الترتيب' : 'Reverse'} className="flex-1 py-2 flex items-center justify-center gap-1.5 text-[9px] font-mono text-gray-300 hover:text-white border border-[#2D3139] hover:border-gray-500 rounded-md transition-all bg-[#0F1115]">
            <ArrowLeftRight size={11} />{lang === 'ar' ? 'عكس' : 'Reverse'}
          </button>
          <button onClick={onSortByName} className="flex-1 py-2 flex items-center justify-center gap-1.5 text-[9px] font-mono text-gray-300 hover:text-white border border-[#2D3139] hover:border-gray-500 rounded-md transition-all bg-[#0F1115]">
            A-Z ↓
          </button>
          <button onClick={onClearAll} className="flex-1 py-2 flex items-center justify-center gap-1.5 text-[9px] font-mono text-red-400 hover:text-red-300 border border-red-900/30 hover:border-red-500/50 rounded-md transition-all bg-red-950/20">
            <Trash2 size={11} />{lang === 'ar' ? 'مسح' : 'Clear'}
          </button>
        </div>
      )}
    </div>
  );
}
