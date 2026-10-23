import { Download, Trash2, FileText, ArrowDownUp, CheckSquare, Square } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { formatBytes } from '../utils';
import type { PdfFile } from '../types';

interface Props {
  file: PdfFile;
  selected: boolean;
  lang: 'ar' | 'en';
  onToggle: () => void;
  onRemove: () => void;
  onDownload: () => void;
}

export function FileCard({ file, selected, lang, onToggle, onRemove, onDownload }: Props) {
  const savings = file.compressedSize ? ((1 - file.compressedSize / file.originalSize) * 100).toFixed(1) : null;

  return (
    <div onClick={onToggle}
      className={cn("relative rounded-lg overflow-hidden border-2 cursor-pointer transition-all group bg-[#1A1D23]", selected ? "border-red-500 shadow-lg shadow-red-500/20" : "border-[#2D3139] hover:border-gray-500")}>
      <div className="h-28 bg-gradient-to-br from-[#1A1D23] to-[#0A0C0F] flex items-center justify-center">
        <FileText size={36} className={selected ? "text-red-400" : "text-gray-600"} />
      </div>
      <div className="bg-[#1A1D23] p-2">
        <p className="text-[8px] font-mono text-white truncate leading-tight">{file.name}</p>
        <div className="flex items-center gap-2 text-[7px] font-mono text-gray-400 mt-0.5">
          <span>{formatBytes(file.originalSize)}</span>
          {file.compressedSize > 0 && (
            <>
              <ArrowDownUp size={8} className="text-red-500" />
              <span className="text-red-400">{formatBytes(file.compressedSize)}</span>
              {!file.keptOriginal && <span className="text-red-500 font-bold">-{savings}%</span>}
            </>
          )}
        </div>
        <div className="text-[6px] font-mono text-gray-600 mt-0.5">{file.pages} {lang === 'ar' ? 'صفحة' : 'page'}{file.pages !== 1 ? 's' : ''}</div>
        {file.keptOriginal && <p className="text-[6px] font-mono text-red-400 mt-0.5">{lang === 'ar' ? 'تم الاحتفاظ بالأصلي' : 'Original kept'}</p>}
      </div>
      <div className={cn("absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center transition-all", selected ? "bg-red-500" : "bg-black/40 group-hover:bg-black/60")}>
        {selected ? <CheckSquare size={12} className="text-white" /> : <Square size={12} className="text-white/60" />}
      </div>
      {file.compressedBlob && (
        <button onClick={e => { e.stopPropagation(); onDownload(); }} className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-black/40 hover:bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
          <Download size={10} className="text-white" />
        </button>
      )}
      <button onClick={e => { e.stopPropagation(); onRemove(); }} className="absolute top-8 left-1.5 w-5 h-5 rounded-full bg-black/40 hover:bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
        <Trash2 size={9} className="text-white" />
      </button>
    </div>
  );
}
