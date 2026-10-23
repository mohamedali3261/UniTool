import type { RefObject } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface Props {
  lang: 'ar' | 'en';
  loading: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFiles: (files: FileList) => void;
}

export function UploadPanel({ lang, loading, fileInputRef, onFiles }: Props) {
  return (
    <>
      <input ref={fileInputRef} type="file" accept=".pdf" multiple className="hidden" onChange={e => e.target.files && onFiles(e.target.files)} />
      <button onClick={() => fileInputRef.current?.click()} disabled={loading} className={cn(
        "w-full p-6 rounded-xl border-2 border-dashed transition-all text-center",
        "border-white/10 hover:border-violet-500/40 hover:bg-violet-500/5",
        loading && 'opacity-50 cursor-wait'
      )}>
        {loading ? <Loader2 size={24} className="animate-spin text-violet-400 mx-auto mb-2" /> : <Upload size={24} className="text-gray-500 mx-auto mb-2" />}
        <p className="text-[10px] text-gray-400 font-mono">{lang === 'ar' ? 'اختر ملفات PDF' : 'Choose PDF files'}</p>
        <p className="text-[8px] text-gray-600 font-mono mt-1">{lang === 'ar' ? 'ارفع ملفات PDF متعددة' : 'Upload multiple PDF files'}</p>
      </button>
    </>
  );
}
