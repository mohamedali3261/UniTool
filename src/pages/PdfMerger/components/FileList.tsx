import { FileText, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { formatSize } from '../utils';
import type { PdfFile } from '../types';

interface Props {
  lang: 'ar' | 'en';
  files: PdfFile[];
  totalPages: number;
  onMove: (id: number, dir: -1 | 1) => void;
  onRemove: (id: number) => void;
}

export function FileList({ lang, files, totalPages, onMove, onRemove }: Props) {
  if (files.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] font-mono text-gray-400">
          {files.length} {lang === 'ar' ? 'ملف' : 'files'} • {totalPages} {lang === 'ar' ? 'صفحة' : 'pages'}
        </span>
      </div>
      {files.map((file, i) => (
        <div key={file.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
            <FileText size={16} className="text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-white font-bold truncate">{file.name}</p>
            <p className="text-[8px] text-gray-500 font-mono">{formatSize(file.size)} • {file.pageCount} {lang === 'ar' ? 'صفحة' : 'pages'}</p>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => onMove(file.id, -1)} disabled={i === 0} className="p-1 rounded hover:bg-white/10 disabled:opacity-20"><ArrowUp size={12} className="text-gray-400" /></button>
            <button onClick={() => onMove(file.id, 1)} disabled={i === files.length - 1} className="p-1 rounded hover:bg-white/10 disabled:opacity-20"><ArrowDown size={12} className="text-gray-400" /></button>
            <button onClick={() => onRemove(file.id)} className="p-1 rounded hover:bg-red-500/20"><Trash2 size={12} className="text-red-400" /></button>
          </div>
        </div>
      ))}
    </div>
  );
}
