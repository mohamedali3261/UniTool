import { useState, useRef } from 'react';
import { Upload, Download, Loader2, Trash2, FileText, GripVertical, ArrowUp, ArrowDown, Plus } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { cn } from '../lib/utils';

interface Props {
  t: any;
  lang: 'ar' | 'en';
}

interface PdfFile {
  id: number;
  name: string;
  size: number;
  data: Uint8Array;
  pageCount: number;
}

export function PdfMerger({ t, lang }: Props) {
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [merging, setMerging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextId, setNextId] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mobileTab, setMobileTab] = useState<'upload' | 'files' | 'export'>('upload');

  const addFiles = async (fileList: FileList) => {
    setLoading(true);
    setError(null);
    try {
      const newFiles: PdfFile[] = [];
      for (const file of Array.from(fileList)) {
        if (file.type !== 'application/pdf') continue;
        const arrayBuffer = await file.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);
        const doc = await PDFDocument.load(data);
        newFiles.push({
          id: nextId + newFiles.length,
          name: file.name.replace(/\.pdf$/i, ''),
          size: file.size,
          data,
          pageCount: doc.getPageCount(),
        });
      }
      setFiles(prev => [...prev, ...newFiles]);
      setNextId(prev => prev + newFiles.length);
    } catch {
      setError(lang === 'ar' ? 'خطأ في قراءة ملف PDF' : 'Error reading PDF file');
    }
    setLoading(false);
  };

  const removeFile = (id: number) => setFiles(prev => prev.filter(f => f.id !== id));

  const moveFile = (id: number, dir: -1 | 1) => {
    setFiles(prev => {
      const idx = prev.findIndex(f => f.id === id);
      if (idx === -1) return prev;
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const arr = [...prev];
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return arr;
    });
  };

  const merge = async () => {
    if (files.length < 2) return;
    setMerging(true);
    setError(null);
    try {
      const merged = await PDFDocument.create();
      for (const file of files) {
        const doc = await PDFDocument.load(file.data);
        const pages = await merged.copyPages(doc, doc.getPageIndices());
        pages.forEach(p => merged.addPage(p));
      }
      const bytes = await merged.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'merged.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError(lang === 'ar' ? 'خطأ في دمج الملفات' : 'Error merging files');
    }
    setMerging(false);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const totalPages = files.reduce((sum, f) => sum + f.pageCount, 0);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <style>{`
        .pdf-merger-scroll { direction: ltr; overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.08) transparent; }
        .pdf-merger-scroll::-webkit-scrollbar { width: 4px; }
        .pdf-merger-scroll::-webkit-scrollbar-track { background: transparent; }
        .pdf-merger-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        .pdf-merger-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
        .pdf-merger-scroll > * { direction: ${lang === 'ar' ? 'rtl' : 'ltr'}; }
      `}</style>

      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] bg-[#0F1115]/50 shrink-0 sm:px-4 sm:py-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20 sm:w-8 sm:h-8">
          <FileText size={14} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xs font-bold text-white sm:text-sm">{lang === 'ar' ? 'دمج ملفات PDF' : 'Merge PDF Files'}</h1>
          <p className="text-[8px] text-gray-500 font-mono sm:text-[9px]">{lang === 'ar' ? 'دمج عدة ملفات PDF في ملف واحد' : 'Combine multiple PDF files into one'}</p>
        </div>
      </div>

      {/* Mobile Tabs */}
      <div className="flex border-b border-white/[0.06] md:hidden shrink-0">
        {(['upload', 'files', 'export'] as const).map(tab => (
          <button key={tab} onClick={() => setMobileTab(tab)} className={cn(
            "flex-1 py-2 text-[9px] font-mono uppercase tracking-wider transition-colors",
            mobileTab === tab ? 'text-white border-b-2 border-violet-500' : 'text-gray-500'
          )}>
            {tab === 'upload' ? (lang === 'ar' ? 'رفع' : 'Upload') : tab === 'files' ? (lang === 'ar' ? 'الملفات' : 'Files') : (lang === 'ar' ? 'دمج' : 'Merge')}
            {tab === 'files' && files.length > 0 && <span className="ml-1 text-violet-400">({files.length})</span>}
          </button>
        ))}
      </div>

      <div className="flex-1 pdf-merger-scroll">
        <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-4">
          {/* Upload Section */}
          <div className={cn("md:block", mobileTab !== 'upload' && 'hidden')}>
            <input ref={fileInputRef} type="file" accept=".pdf" multiple className="hidden" onChange={e => e.target.files && addFiles(e.target.files)} />
            <button onClick={() => fileInputRef.current?.click()} disabled={loading} className={cn(
              "w-full p-6 rounded-xl border-2 border-dashed transition-all text-center",
              "border-white/10 hover:border-violet-500/40 hover:bg-violet-500/5",
              loading && 'opacity-50 cursor-wait'
            )}>
              {loading ? <Loader2 size={24} className="animate-spin text-violet-400 mx-auto mb-2" /> : <Upload size={24} className="text-gray-500 mx-auto mb-2" />}
              <p className="text-[10px] text-gray-400 font-mono">{lang === 'ar' ? 'اختر ملفات PDF' : 'Choose PDF files'}</p>
              <p className="text-[8px] text-gray-600 font-mono mt-1">{lang === 'ar' ? 'ارفع ملفات PDF متعددة' : 'Upload multiple PDF files'}</p>
            </button>
          </div>

          {/* Files List */}
          <div className={cn("md:block", mobileTab !== 'files' && 'hidden')}>
            {files.length > 0 && (
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
                      <button onClick={() => moveFile(file.id, -1)} disabled={i === 0} className="p-1 rounded hover:bg-white/10 disabled:opacity-20"><ArrowUp size={12} className="text-gray-400" /></button>
                      <button onClick={() => moveFile(file.id, 1)} disabled={i === files.length - 1} className="p-1 rounded hover:bg-white/10 disabled:opacity-20"><ArrowDown size={12} className="text-gray-400" /></button>
                      <button onClick={() => removeFile(file.id)} className="p-1 rounded hover:bg-red-500/20"><Trash2 size={12} className="text-red-400" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Merge Button */}
          <div className={cn("md:block", mobileTab !== 'export' && 'hidden')}>
            {error && <p className="text-[9px] text-red-400 font-mono text-center mb-2">{error}</p>}
            <button onClick={merge} disabled={files.length < 2 || merging} className={cn(
              "w-full py-3 rounded-xl font-bold text-[11px] font-mono transition-all",
              files.length >= 2 && !merging
                ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:shadow-lg hover:shadow-violet-500/20"
                : "bg-white/[0.06] text-gray-500 cursor-not-allowed"
            )}>
              {merging ? <Loader2 size={16} className="animate-spin mx-auto" /> : (
                <span className="flex items-center justify-center gap-2">
                  <Plus size={14} />
                  {lang === 'ar' ? `دمج ${files.length} ملفات` : `Merge ${files.length} files`}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
