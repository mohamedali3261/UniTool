import { useEffect, useRef } from 'react';
import { Scissors, X, RotateCcw, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { cropImageElement, useCropBox } from './useCropBox';

export interface CropResult {
  dataUrl: string;
  width: number;
  height: number;
  sizeBytes: number;
}

interface Props {
  src: string;
  name?: string;
  lang: 'ar' | 'en';
  accent?: 'orange' | 'red';
  canRestore?: boolean;
  onApply: (result: CropResult) => void;
  onRestore?: () => void;
  onClose: () => void;
}

const ACCENTS = {
  orange: {
    iconBg: 'bg-orange-500/15',
    icon: 'text-orange-400',
    handle: 'border-orange-500',
    button: 'from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 shadow-orange-500/20',
  },
  red: {
    iconBg: 'bg-red-500/15',
    icon: 'text-red-400',
    handle: 'border-red-500',
    button: 'from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-red-500/20',
  },
} as const;

const HANDLES = [
  { id: 'nw', cls: '-top-2 -left-2 cursor-nwse-resize' },
  { id: 'ne', cls: '-top-2 -right-2 cursor-nesw-resize' },
  { id: 'sw', cls: '-bottom-2 -left-2 cursor-nesw-resize' },
  { id: 'se', cls: '-bottom-2 -right-2 cursor-nwse-resize' },
  { id: 'n', cls: '-top-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize' },
  { id: 's', cls: '-bottom-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize' },
  { id: 'w', cls: 'top-1/2 -left-1.5 -translate-y-1/2 cursor-ew-resize' },
  { id: 'e', cls: 'top-1/2 -right-1.5 -translate-y-1/2 cursor-ew-resize' },
] as const;

export function ImageCropModal({
  src,
  name,
  lang,
  accent = 'orange',
  canRestore = false,
  onApply,
  onRestore,
  onClose,
}: Props) {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const { box, displaySize, init, startDrag, outputSize, toSourceRect, reset } = useCropBox();
  const theme = ACCENTS[accent];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => { reset(); }, [src, reset]);

  const handleLoad = () => {
    const img = imageRef.current;
    if (!img) return;
    init(img.getBoundingClientRect());
  };

  const apply = () => {
    const img = imageRef.current;
    if (!img) return;
    const rect = toSourceRect(img.naturalWidth, img.naturalHeight);
    if (!rect) return;
    const result = cropImageElement(img, rect);
    if (!result) return;
    onApply({ ...result, width: rect.width, height: rect.height });
  };

  const output = imageRef.current
    ? outputSize(imageRef.current.naturalWidth, imageRef.current.naturalHeight)
    : { width: 0, height: 0 };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-6">
      <div className="bg-[#14171C] border border-[#2D3139] rounded-xl w-full max-w-3xl flex flex-col max-h-[94vh] overflow-hidden shadow-2xl">
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[#2D3139] shrink-0 sm:px-4">
          <div className={cn("w-6 h-6 rounded-md flex items-center justify-center shrink-0", theme.iconBg)}>
            <Scissors size={12} className={theme.icon} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-[11px] font-bold text-white truncate sm:text-xs">
              {lang === 'ar' ? 'قص الصورة' : 'Crop image'}
            </h2>
            <p className="text-[8px] font-mono text-gray-500 truncate">
              {name ? `${name} · ` : ''}{output.width}×{output.height} px
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            title={lang === 'ar' ? 'إغلاق' : 'Close'}
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-auto bg-[#0A0C0F] p-3 flex items-center justify-center sm:p-5">
          <div className="relative inline-block select-none">
            <img
              ref={imageRef}
              src={src}
              alt={name || 'crop'}
              onLoad={handleLoad}
              className="block max-w-full max-h-[60vh] w-auto h-auto"
              draggable={false}
            />
            {displaySize.width > 0 && (
              <>
                <div
                  className="absolute inset-0 pointer-events-none bg-black/60 z-10"
                  style={{ clipPath: `inset(${box.y}px ${displaySize.width - box.x - box.width}px ${displaySize.height - box.y - box.height}px ${box.x}px)` }}
                />
                <div
                  className="absolute cursor-move border-2 border-white/90 z-20"
                  style={{ left: box.x, top: box.y, width: box.width, height: box.height, touchAction: 'none' }}
                  onPointerDown={e => startDrag(e, 'move')}
                >
                  <div
                    className="absolute inset-0 opacity-25 pointer-events-none"
                    style={{ backgroundImage: 'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)', backgroundSize: '33.333% 33.333%' }}
                  />
                  {HANDLES.map(h => (
                    <div
                      key={h.id}
                      className={cn("absolute w-4 h-4 bg-white border rounded-sm z-10 shadow", theme.handle, h.cls)}
                      style={{ touchAction: 'none' }}
                      onPointerDown={e => startDrag(e, 'resize', h.id)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 px-3 py-2.5 border-t border-[#2D3139] shrink-0 sm:flex-row sm:items-center sm:px-4">
          <p className="text-[8px] font-mono text-gray-500 flex-1">
            {lang === 'ar' ? 'اسحب المربع لتحريكه، واسحب المقابض لتغيير الحجم' : 'Drag the box to move it, drag handles to resize'}
          </p>
          <div className="flex items-center gap-2 shrink-0">
            {canRestore && onRestore && (
              <button
                onClick={onRestore}
                className="px-2.5 py-2 flex items-center justify-center gap-1 text-[9px] font-mono rounded-md border border-[#2D3139] text-gray-300 hover:border-gray-500 hover:text-white transition-all"
              >
                <RotateCcw size={11} />
                {lang === 'ar' ? 'استعادة الأصل' : 'Restore original'}
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3 py-2 text-[9px] font-mono rounded-md border border-[#2D3139] text-gray-400 hover:text-white hover:border-gray-500 transition-all"
            >
              {lang === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              onClick={apply}
              disabled={displaySize.width === 0}
              className={cn(
                "px-3 py-2 flex items-center justify-center gap-1.5 text-[9px] font-mono rounded-md transition-all",
                displaySize.width > 0
                  ? cn("bg-gradient-to-r text-white shadow-lg", theme.button)
                  : "bg-[#2D3139] text-gray-600 cursor-not-allowed"
              )}
            >
              <Check size={12} />
              {lang === 'ar' ? 'تطبيق القص' : 'Apply crop'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
