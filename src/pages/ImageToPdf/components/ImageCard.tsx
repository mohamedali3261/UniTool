import { Scissors, RotateCw, Copy, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { formatBytes } from '../utils/pdf';
import type { ImageItem } from '../types';

interface Props {
  img: ImageItem;
  index: number;
  total: number;
  lang: 'ar' | 'en';
  bgColor: string;
  grayscale: boolean;
  isDragging: boolean;
  onCrop: () => void;
  onRotate: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onRename: (name: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}

export function ImageCard({
  img, index, total, lang, bgColor, grayscale, isDragging,
  onCrop, onRotate, onDuplicate, onRemove, onRename, onMoveUp, onMoveDown,
  onDragStart, onDragOver, onDragEnd,
}: Props) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      className={cn("relative rounded-lg overflow-hidden border group bg-[#1A1D23] cursor-grab active:cursor-grabbing transition-all",
        isDragging ? "border-red-500 opacity-50 scale-95" : "border-[#2D3139] hover:border-red-500/40")}>
      <div className="relative aspect-[3/4] flex items-center justify-center overflow-hidden" style={{ background: bgColor }}>
        <img src={img.dataUrl} alt={img.name} className="max-w-full max-h-full object-contain pointer-events-none" draggable={false}
          style={{ transform: `rotate(${img.rotation}deg)`, filter: grayscale ? 'grayscale(1)' : undefined, maxWidth: img.rotation % 180 !== 0 ? '75%' : '100%' }} />
        <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-[8px] font-mono font-bold text-white">#{index + 1}</div>
        {img.rotation !== 0 && <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-blue-600/80 text-[7px] font-mono text-white">↻{img.rotation}°</div>}
      </div>
      <div className="p-2">
        <input value={img.name} onChange={e => onRename(e.target.value)}
          className="w-full bg-transparent text-[9px] font-mono text-white truncate leading-tight outline-none focus:bg-black/40 rounded px-1 -mx-1 border border-transparent focus:border-red-500/40" />
        <div className="flex items-center gap-1 mt-0.5">
          <p className="text-[7px] font-mono text-gray-500">{img.width}×{img.height} · {formatBytes(img.sizeBytes)}</p>
          {img.originalDataUrl && (
            <span className="px-1 py-0.5 rounded bg-red-500/90 text-[6px] font-mono text-white shrink-0">
              {lang === 'ar' ? 'مقصوص' : 'Cropped'}
            </span>
          )}
        </div>
      </div>

      <div className="absolute bottom-9 right-1 flex gap-1 opacity-0 group-hover:opacity-100 max-sm:opacity-100 transition-opacity">
        <button onClick={onCrop} title={lang === 'ar' ? 'قص' : 'Crop'} className="w-6 h-6 rounded-full bg-black/70 hover:bg-red-500 flex items-center justify-center transition-colors">
          <Scissors size={11} className="text-white" />
        </button>
        <button onClick={onRotate} title={lang === 'ar' ? 'تدوير' : 'Rotate'} className="w-6 h-6 rounded-full bg-black/70 hover:bg-blue-600 flex items-center justify-center transition-colors">
          <RotateCw size={11} className="text-white" />
        </button>
        <button onClick={onDuplicate} title={lang === 'ar' ? 'نسخ' : 'Duplicate'} className="w-6 h-6 rounded-full bg-black/70 hover:bg-green-600 flex items-center justify-center transition-colors">
          <Copy size={11} className="text-white" />
        </button>
        <button onClick={onRemove} title={lang === 'ar' ? 'حذف' : 'Delete'} className="w-6 h-6 rounded-full bg-black/70 hover:bg-red-600 flex items-center justify-center transition-colors">
          <Trash2 size={11} className="text-white" />
        </button>
      </div>

      <div className="absolute top-7 left-1 hidden group-hover:flex-col gap-1 group-hover:flex">
        {index > 0 && (
          <button onClick={onMoveUp} className="w-5 h-5 rounded-full bg-black/70 hover:bg-red-500 flex items-center justify-center transition-colors">
            <ArrowUp size={10} className="text-white" />
          </button>
        )}
        {index < total - 1 && (
          <button onClick={onMoveDown} className="w-5 h-5 rounded-full bg-black/70 hover:bg-red-500 flex items-center justify-center transition-colors">
            <ArrowDown size={10} className="text-white" />
          </button>
        )}
      </div>
    </div>
  );
}
