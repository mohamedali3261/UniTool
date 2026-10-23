import { Download, Loader2, CheckSquare, Square, Scissors, Percent, FileText } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { FileHandoffTarget } from '../../../types/app';
import type { ImageFormat } from '../types';

interface Props {
  lang: 'ar' | 'en';
  format: ImageFormat;
  quality: number;
  selectedCount: number;
  totalCount: number;
  converting: boolean;
  sendingToTool: boolean;
  onFormatChange: (format: ImageFormat) => void;
  onQualityChange: (quality: number) => void;
  onExport: () => void;
  onToggleAll: () => void;
  onSendToTool: (target: FileHandoffTarget) => void;
}

export function ExportPanel({
  lang, format, quality, selectedCount, totalCount, converting, sendingToTool,
  onFormatChange, onQualityChange, onExport, onToggleAll, onSendToTool,
}: Props) {
  const hasSelection = selectedCount > 0;

  return (
    <>
      <div className="p-3 border-b border-[#2D3139] sm:p-4">
        <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3 sm:text-[10px]">
          {lang === 'ar' ? 'الإعدادات' : 'Settings'}
        </h3>
        <div className="space-y-3">
          <div>
            <label className="text-[8px] font-mono text-gray-500 uppercase tracking-wider sm:text-[9px]">
              {lang === 'ar' ? 'الصيغة' : 'Format'}
            </label>
            <div className="flex gap-1 mt-1.5">
              {(['png', 'jpeg'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => onFormatChange(f)}
                  className={cn(
                    "flex-1 py-2 text-[9px] font-mono uppercase tracking-wider rounded-md border transition-all sm:py-2.5",
                    format === f
                      ? "bg-orange-600/20 border-orange-500/40 text-orange-400"
                      : "bg-[#0F1115] border-[#2D3139] text-gray-500 hover:border-gray-500"
                  )}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          {format === 'jpeg' && (
            <div>
              <label className="text-[8px] font-mono text-gray-500 uppercase tracking-wider sm:text-[9px]">
                {lang === 'ar' ? 'الجودة' : 'Quality'}: {Math.round(quality * 100)}%
              </label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.02"
                value={quality}
                onChange={e => onQualityChange(parseFloat(e.target.value))}
                className="w-full mt-1.5 accent-orange-500"
              />
            </div>
          )}
        </div>
      </div>

      <div className="p-3 mt-auto border-t border-[#2D3139] sm:p-4">
        <div className="flex items-center justify-between mb-2 text-[8px] font-mono text-gray-500 sm:text-[9px]">
          <span>{lang === 'ar' ? 'المحدد' : 'Selected'}: {selectedCount}/{totalCount}</span>
          <button onClick={onToggleAll} className="text-orange-400 hover:text-orange-300 flex items-center gap-1">
            {selectedCount === totalCount ? <Square size={10} /> : <CheckSquare size={10} />}
            {selectedCount === totalCount
              ? (lang === 'ar' ? 'إلغاء الكل' : 'Deselect')
              : (lang === 'ar' ? 'تحديد الكل' : 'All')}
          </button>
        </div>
        <button
          onClick={onExport}
          disabled={!hasSelection || converting || sendingToTool}
          className={cn(
            "w-full py-3 flex items-center justify-center gap-2 text-[9px] font-mono uppercase tracking-wider rounded-lg transition-all sm:py-3.5",
            hasSelection
              ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white hover:from-orange-500 hover:to-amber-500 shadow-lg shadow-orange-500/20"
              : "bg-[#2D3139] text-gray-600 cursor-not-allowed"
          )}
        >
          {converting ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
          {converting
            ? (lang === 'ar' ? 'جاري التصدير...' : 'Exporting...')
            : (lang === 'ar' ? 'تصدير' : 'Export')}
        </button>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <button
            onClick={() => onSendToTool('imageCropper')}
            disabled={!hasSelection || converting || sendingToTool}
            className="py-2 flex items-center justify-center gap-1.5 text-[8px] font-mono rounded-md border border-blue-500/30 text-blue-300 hover:bg-blue-500/10 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Scissors size={11} />
            {lang === 'ar' ? 'قص المحدد' : 'Crop selected'}
          </button>
          <button
            onClick={() => onSendToTool('imageCompressor')}
            disabled={!hasSelection || converting || sendingToTool}
            className="py-2 flex items-center justify-center gap-1.5 text-[8px] font-mono rounded-md border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {sendingToTool ? <Loader2 size={11} className="animate-spin" /> : <Percent size={11} />}
            {lang === 'ar' ? 'ضغط المحدد' : 'Compress selected'}
          </button>
          <button
            onClick={() => onSendToTool('imageToPdf')}
            disabled={!hasSelection || converting || sendingToTool}
            className="col-span-2 py-2 flex items-center justify-center gap-1.5 text-[8px] font-mono rounded-md border border-rose-500/30 text-rose-300 hover:bg-rose-500/10 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FileText size={11} />
            {lang === 'ar' ? 'إنشاء PDF من المحدد' : 'Create PDF from selected'}
          </button>
        </div>
      </div>
    </>
  );
}
