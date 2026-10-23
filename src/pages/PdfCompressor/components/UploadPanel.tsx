import { Upload, Trash2 } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface Props {
  lang: 'ar' | 'en';
  fileCount: number;
  quality: number;
  dpi: number;
  error: string | null;
  onFiles: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onQualityChange: (quality: number) => void;
  onDpiChange: (dpi: number) => void;
  onClearAll: () => void;
}

export function UploadPanel({ lang, fileCount, quality, dpi, error, onFiles, onQualityChange, onDpiChange, onClearAll }: Props) {
  return (
    <>
      <div className="p-3 border-b border-[#2D3139] sm:p-4">
        <label className={cn("flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-[#2D3139] rounded-lg cursor-pointer hover:border-red-500/50 transition-colors bg-[#0F1115]", fileCount > 0 ? "border-red-500/30" : "")}>
          <Upload size={20} className={fileCount > 0 ? "text-red-500" : "text-gray-500"} />
          <span className="text-[9px] font-mono text-gray-400 text-center leading-relaxed">{fileCount > 0 ? (lang === 'ar' ? 'إضافة ملفات PDF' : 'Add more PDFs') : (lang === 'ar' ? 'اختر ملفات PDF' : 'Select PDF files')}</span>
          <input type="file" accept=".pdf,application/pdf" multiple className="hidden" onChange={onFiles} />
        </label>
        {error && <p className="text-[8px] text-red-400 mt-2 font-mono">{error}</p>}
        {fileCount > 0 && (
          <button onClick={onClearAll} className="w-full mt-3 py-2 flex items-center justify-center gap-1.5 text-[8px] font-mono text-red-400 hover:text-red-300 border border-red-900/30 hover:border-red-500/50 rounded-md transition-all bg-red-950/20">
            <Trash2 size={10} />{lang === 'ar' ? 'مسح الكل' : 'Clear all'}
          </button>
        )}
      </div>

      <div className="p-3 border-b border-[#2D3139] sm:p-4">
        <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3 sm:text-[10px]">{lang === 'ar' ? 'جودة الضغط' : 'Compression quality'}</h3>
        <div className="space-y-4">
          <div>
            <label className="text-[8px] font-mono text-gray-500 uppercase tracking-wider sm:text-[9px]">JPEG: {quality}%</label>
            <input type="range" min="10" max="95" step="1" value={quality} onChange={e => onQualityChange(parseInt(e.target.value))} className="w-full mt-1.5 accent-red-500" />
            <div className="flex justify-between text-[7px] font-mono text-gray-600 mt-1">
              <span>{lang === 'ar' ? 'حجم صغير' : 'Small size'}</span>
              <span>{lang === 'ar' ? 'جودة عالية' : 'High quality'}</span>
            </div>
          </div>
          <div>
            <label className="text-[8px] font-mono text-gray-500 uppercase tracking-wider sm:text-[9px]">DPI: {dpi}</label>
            <input type="range" min="72" max="300" step="10" value={dpi} onChange={e => onDpiChange(parseInt(e.target.value))} className="w-full mt-1.5 accent-red-500" />
            <div className="flex justify-between text-[7px] font-mono text-gray-600 mt-1">
              <span>{lang === 'ar' ? 'منخفض' : 'Low'}</span>
              <span>{lang === 'ar' ? 'عالي' : 'High'}</span>
            </div>
          </div>
        </div>
        <p className="text-[7px] font-mono text-gray-700 mt-2 leading-relaxed">
          {lang === 'ar'
            ? 'جودة JPEG أقل + DPI أقل = حجم أصغر. النصوص تتحول لصور.'
            : 'Lower JPEG quality + lower DPI = smaller size. Text becomes images.'}
        </p>
      </div>

      <div className="p-3 border-b border-[#2D3139] sm:p-4">
        <div className="bg-[#0F1115] border border-[#2D3139] rounded-lg p-3">
          <p className="text-[8px] font-mono text-gray-500 leading-relaxed">
            {lang === 'ar'
              ? 'يتم تحويل كل صفحة PDF إلى صورة JPEG ثم إعادة بنائها، مما يقلل الحجم بشكل كبير.'
              : 'Each PDF page is converted to a JPEG image and rebuilt, significantly reducing size.'}
          </p>
        </div>
      </div>
    </>
  );
}
