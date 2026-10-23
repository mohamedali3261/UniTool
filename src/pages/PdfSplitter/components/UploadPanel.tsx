import type { RefObject } from 'react';
import { Upload, Loader2, Trash2, FileText } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { SplitFile } from '../types';

interface Props {
  lang: 'ar' | 'en';
  file: SplitFile | null;
  loading: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onLoad: (file: File) => void;
  onRemove: () => void;
}

export function UploadPanel({ lang, file, loading, fileInputRef, onLoad, onRemove }: Props) {
  return (
    <>
      <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={e => e.target.files?.[0] && onLoad(e.target.files[0])} />
      {!file ? (
        <button onClick={() => fileInputRef.current?.click()} disabled={loading} className={cn(
          "w-full p-6 rounded-xl border-2 border-dashed transition-all text-center",
          "border-white/10 hover:border-emerald-500/40 hover:bg-emerald-500/5",
          loading && 'opacity-50 cursor-wait'
        )}>
          {loading ? <Loader2 size={24} className="animate-spin text-emerald-400 mx-auto mb-2" /> : <Upload size={24} className="text-gray-500 mx-auto mb-2" />}
          <p className="text-[10px] text-gray-400 font-mono">{lang === 'ar' ? 'اختر ملف PDF' : 'Choose a PDF file'}</p>
        </button>
      ) : (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
            <FileText size={16} className="text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-white font-bold truncate">{file.name}</p>
            <p className="text-[8px] text-gray-500 font-mono">{file.pageCount} {lang === 'ar' ? 'صفحة' : 'pages'}</p>
          </div>
          <button onClick={onRemove} className="p-1 rounded hover:bg-red-500/20"><Trash2 size={12} className="text-red-400" /></button>
        </div>
      )}
    </>
  );
}
