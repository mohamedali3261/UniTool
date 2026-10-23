import { Download, Trash2, Scissors, CheckSquare, Square } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { PageImage } from '../types';

interface Props {
  page: PageImage;
  selected: boolean;
  lang: 'ar' | 'en';
  onToggle: () => void;
  onRemove: () => void;
  onDownload: () => void;
  onCrop: () => void;
}

export function PageCard({ page, selected, lang, onToggle, onRemove, onDownload, onCrop }: Props) {
  return (
    <div
      onClick={onToggle}
      className={cn(
        "relative rounded-lg overflow-hidden border-2 cursor-pointer transition-all group bg-white",
        selected
          ? "border-orange-500 shadow-lg shadow-orange-500/20"
          : "border-[#2D3139] hover:border-gray-500"
      )}
    >
      <img
        src={page.dataUrl}
        alt={page.name}
        className="w-full h-auto"
        draggable={false}
      />
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
        <span className="text-[8px] font-mono text-white truncate block leading-tight">
          {page.name}
        </span>
      </div>
      <div className={cn(
        "absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center transition-all",
        selected
          ? "bg-orange-500"
          : "bg-black/40 group-hover:bg-black/60"
      )}>
        {selected ? (
          <CheckSquare size={12} className="text-white" />
        ) : (
          <Square size={12} className="text-white/60" />
        )}
      </div>

      <div className="absolute top-1.5 left-1.5 flex flex-col gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 transition-all">
        <button
          onClick={e => { e.stopPropagation(); onCrop(); }}
          className="w-5 h-5 rounded-full bg-black/40 hover:bg-orange-500 flex items-center justify-center transition-all"
          title={lang === 'ar' ? 'قص الصورة' : 'Crop image'}
        >
          <Scissors size={9} className="text-white" />
        </button>
        <button
          onClick={e => { e.stopPropagation(); onDownload(); }}
          className="w-5 h-5 rounded-full bg-black/40 hover:bg-orange-500 flex items-center justify-center transition-all"
          title={lang === 'ar' ? 'تحميل' : 'Download'}
        >
          <Download size={10} className="text-white" />
        </button>
        <button
          onClick={e => { e.stopPropagation(); onRemove(); }}
          className="w-5 h-5 rounded-full bg-black/40 hover:bg-red-500 flex items-center justify-center transition-all"
          title={lang === 'ar' ? 'حذف' : 'Remove'}
        >
          <Trash2 size={9} className="text-white" />
        </button>
      </div>

      {page.originalDataUrl && (
        <div className="absolute bottom-7 right-1.5 px-1 py-0.5 rounded bg-orange-500/90 text-[7px] font-mono text-white">
          {lang === 'ar' ? 'مقصوص' : 'Cropped'}
        </div>
      )}
    </div>
  );
}
