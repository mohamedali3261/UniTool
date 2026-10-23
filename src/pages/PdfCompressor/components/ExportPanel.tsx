import { Download, Loader2, CheckSquare, Square, ImageDown } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { formatBytes } from '../utils';

interface Props {
  lang: 'ar' | 'en';
  fileCount: number;
  selectedCount: number;
  totalOriginalSize: number;
  totalEffectiveSize: number;
  allCompressed: boolean;
  compressing: boolean;
  currentFile: string;
  pageProgress: string;
  onCompressAll: () => void;
  onToggleAll: () => void;
  onDownloadAll: () => void;
}

export function ExportPanel({
  lang, fileCount, selectedCount, totalOriginalSize, totalEffectiveSize, allCompressed,
  compressing, currentFile, pageProgress, onCompressAll, onToggleAll, onDownloadAll,
}: Props) {
  return (
    <>
      {allCompressed && (
        <div className="p-3 border-b border-[#2D3139] sm:p-4">
          <div className="space-y-2 text-[8px] font-mono text-gray-500">
            <div className="flex justify-between"><span>{lang === 'ar' ? 'الملفات' : 'Files'}:</span><span>{fileCount}</span></div>
            <div className="flex justify-between"><span>{lang === 'ar' ? 'الحجم الأصلي' : 'Original'}:</span><span className="text-gray-400">{formatBytes(totalOriginalSize)}</span></div>
            <div className="flex justify-between"><span>{lang === 'ar' ? 'بعد الضغط' : 'Result'}:</span><span className="text-red-400">{formatBytes(totalEffectiveSize)}</span></div>
            <div className="flex justify-between border-t border-[#2D3139] pt-2 mt-1">
              <span className="text-gray-400">{lang === 'ar' ? 'التوفير' : 'Saved'}:</span>
              <span className="text-red-400 font-bold">
                {totalEffectiveSize < totalOriginalSize ? `-${((1 - totalEffectiveSize / totalOriginalSize) * 100).toFixed(1)}%` : (lang === 'ar' ? 'بدون توفير' : 'No savings')}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="p-3 mt-auto space-y-2 sm:p-4">
        {!allCompressed && fileCount > 0 && (
          <button onClick={onCompressAll} disabled={compressing}
            className="w-full py-3 flex items-center justify-center gap-2 text-[9px] font-mono uppercase tracking-wider rounded-lg transition-all sm:py-3.5 bg-gradient-to-r from-red-600 to-orange-600 text-white hover:from-red-500 hover:to-orange-500 shadow-lg shadow-red-500/20 disabled:opacity-60">
            {compressing ? <Loader2 size={12} className="animate-spin" /> : <ImageDown size={12} />}
            {compressing ? (lang === 'ar' ? 'جاري الضغط...' : 'Compressing...') : (lang === 'ar' ? 'ضغط الكل' : 'Compress All')}
          </button>
        )}
        {compressing && (
          <div className="space-y-1 px-1">
            {currentFile && <p className="text-[7px] font-mono text-gray-500 truncate">{currentFile}</p>}
            {pageProgress && <p className="text-[7px] font-mono text-red-500/70">{pageProgress}</p>}
            <div className="h-1 bg-[#2D3139] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all duration-300 animate-pulse" style={{ width: '60%' }} />
            </div>
          </div>
        )}
        <div className="flex items-center justify-between text-[8px] font-mono text-gray-500">
          <span>{lang === 'ar' ? 'المحدد' : 'Selected'}: {selectedCount}/{fileCount}</span>
          <button onClick={onToggleAll} className="text-red-400 hover:text-red-300 flex items-center gap-1">
            {selectedCount === fileCount ? <Square size={10} /> : <CheckSquare size={10} />}
            {selectedCount === fileCount ? (lang === 'ar' ? 'إلغاء' : 'Deselect') : (lang === 'ar' ? 'الكل' : 'All')}
          </button>
        </div>
        <button onClick={onDownloadAll} disabled={selectedCount === 0 || !allCompressed}
          className={cn("w-full py-3 flex items-center justify-center gap-2 text-[9px] font-mono uppercase tracking-wider rounded-lg transition-all sm:py-3.5",
            selectedCount > 0 && allCompressed ? "bg-gradient-to-r from-red-600 to-orange-600 text-white hover:from-red-500 hover:to-orange-500 shadow-lg shadow-red-500/20" : "bg-[#2D3139] text-gray-600 cursor-not-allowed")}>
          <Download size={12} />{lang === 'ar' ? 'تحميل المحدد' : 'Download Selected'}
        </button>
      </div>
    </>
  );
}
