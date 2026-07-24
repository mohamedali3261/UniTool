import { useState, useRef } from 'react';
import { Upload, Download, Loader2, Trash2, FileText, Scissors, Check } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { cn } from '../lib/utils';

interface Props {
  t: any;
  lang: 'ar' | 'en';
}

export function PdfSplitter({ t, lang }: Props) {
  const [file, setFile] = useState<{ name: string; data: Uint8Array; pageCount: number } | null>(null);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [mode, setMode] = useState<'extract' | 'remove'>('extract');
  const [loading, setLoading] = useState(false);
  const [splitting, setSplitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mobileTab, setMobileTab] = useState<'upload' | 'pages' | 'export'>('upload');

  const loadFile = async (f: File) => {
    setLoading(true);
    setError(null);
    try {
      const data = new Uint8Array(await f.arrayBuffer());
      const doc = await PDFDocument.load(data);
      setFile({ name: f.name.replace(/\.pdf$/i, ''), data, pageCount: doc.getPageCount() });
      setSelectedPages(new Set());
    } catch {
      setError(lang === 'ar' ? 'خطأ في قراءة الملف' : 'Error reading file');
    }
    setLoading(false);
  };

  const togglePage = (page: number) => {
    setSelectedPages(prev => {
      const next = new Set(prev);
      next.has(page) ? next.delete(page) : next.add(page);
      return next;
    });
  };

  const selectRange = (from: number, to: number) => {
    const pages = new Set<number>();
    for (let i = from; i <= to; i++) pages.add(i);
    setSelectedPages(pages);
  };

  const split = async () => {
    if (!file || selectedPages.size === 0) return;
    setSplitting(true);
    setError(null);
    try {
      const srcDoc = await PDFDocument.load(file.data);
      const newDoc = await PDFDocument.create();
      const pages = mode === 'extract'
        ? Array.from(selectedPages).sort((a, b) => a - b)
        : Array.from({ length: file.pageCount }, (_, i) => i + 1).filter(p => !selectedPages.has(p));

      if (pages.length === 0) {
        setError(lang === 'ar' ? 'لا توجد صفحات محددة' : 'No pages selected');
        setSplitting(false);
        return;
      }

      const copied = await newDoc.copyPages(srcDoc, pages.map(p => p - 1));
      copied.forEach(p => newDoc.addPage(p));
      const bytes = await newDoc.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.name}_split.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError(lang === 'ar' ? 'خطأ في تقسيم الملف' : 'Error splitting file');
    }
    setSplitting(false);
  };

  const pageCount = file?.pageCount || 0;
  const effectiveCount = mode === 'extract' ? selectedPages.size : pageCount - selectedPages.size;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <style>{`
        .pdf-splitter-scroll { direction: ltr; overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.08) transparent; }
        .pdf-splitter-scroll::-webkit-scrollbar { width: 4px; }
        .pdf-splitter-scroll::-webkit-scrollbar-track { background: transparent; }
        .pdf-splitter-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        .pdf-splitter-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
        .pdf-splitter-scroll > * { direction: ${lang === 'ar' ? 'rtl' : 'ltr'}; }
      `}</style>

      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] bg-[#0F1115]/50 shrink-0 sm:px-4 sm:py-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 sm:w-8 sm:h-8">
          <Scissors size={14} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xs font-bold text-white sm:text-sm">{lang === 'ar' ? 'تقسيم ملف PDF' : 'Split PDF File'}</h1>
          <p className="text-[8px] text-gray-500 font-mono sm:text-[9px]">{lang === 'ar' ? 'استخراج أو حذف صفحات محددة' : 'Extract or remove specific pages'}</p>
        </div>
      </div>

      <div className="flex border-b border-white/[0.06] md:hidden shrink-0">
        {(['upload', 'pages', 'export'] as const).map(tab => (
          <button key={tab} onClick={() => setMobileTab(tab)} className={cn(
            "flex-1 py-2 text-[9px] font-mono uppercase tracking-wider transition-colors",
            mobileTab === tab ? 'text-white border-b-2 border-emerald-500' : 'text-gray-500'
          )}>
            {tab === 'upload' ? (lang === 'ar' ? 'رفع' : 'Upload') : tab === 'pages' ? (lang === 'ar' ? 'الصفحات' : 'Pages') : (lang === 'ar' ? 'تقسيم' : 'Split')}
          </button>
        ))}
      </div>

      <div className="flex-1 pdf-splitter-scroll">
        <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-4">
          {/* Upload */}
          <div className={cn("md:block", mobileTab !== 'upload' && 'hidden')}>
            <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={e => e.target.files?.[0] && loadFile(e.target.files[0])} />
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
                <button onClick={() => { setFile(null); setSelectedPages(new Set()); }} className="p-1 rounded hover:bg-red-500/20"><Trash2 size={12} className="text-red-400" /></button>
              </div>
            )}
          </div>

          {/* Pages Grid + Mode Toggle */}
          {file && (
            <div className={cn("md:block", mobileTab !== 'pages' && 'hidden')}>
              <div className="flex items-center gap-2 mb-3">
                <button onClick={() => setMode('extract')} className={cn(
                  "flex-1 py-1.5 rounded-lg text-[9px] font-mono transition-all",
                  mode === 'extract' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/[0.04] text-gray-500 border border-white/[0.06]'
                )}>
                  {lang === 'ar' ? 'استخراج' : 'Extract'}
                </button>
                <button onClick={() => setMode('remove')} className={cn(
                  "flex-1 py-1.5 rounded-lg text-[9px] font-mono transition-all",
                  mode === 'remove' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/[0.04] text-gray-500 border border-white/[0.06]'
                )}>
                  {lang === 'ar' ? 'حذف' : 'Remove'}
                </button>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <button onClick={() => selectRange(1, Math.ceil(pageCount / 2))} className="px-2 py-1 rounded-md bg-white/[0.04] text-[8px] font-mono text-gray-400 hover:bg-white/[0.08]">
                  {lang === 'ar' ? 'النصف الأول' : 'First half'}
                </button>
                <button onClick={() => selectRange(Math.ceil(pageCount / 2) + 1, pageCount)} className="px-2 py-1 rounded-md bg-white/[0.04] text-[8px] font-mono text-gray-400 hover:bg-white/[0.08]">
                  {lang === 'ar' ? 'النصف الثاني' : 'Second half'}
                </button>
                <button onClick={() => setSelectedPages(new Set())} className="px-2 py-1 rounded-md bg-white/[0.04] text-[8px] font-mono text-gray-400 hover:bg-white/[0.08]">
                  {lang === 'ar' ? 'مسح' : 'Clear'}
                </button>
              </div>

              <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
                {Array.from({ length: pageCount }, (_, i) => i + 1).map(page => (
                  <button key={page} onClick={() => togglePage(page)} className={cn(
                    "aspect-square rounded-lg text-[10px] font-mono font-bold transition-all border",
                    selectedPages.has(page)
                      ? mode === 'extract' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-red-500/20 border-red-500/40 text-red-400'
                      : 'bg-white/[0.03] border-white/[0.06] text-gray-500 hover:bg-white/[0.06]'
                  )}>
                    {page}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Split Button */}
          <div className={cn("md:block", mobileTab !== 'export' && 'hidden')}>
            {error && <p className="text-[9px] text-red-400 font-mono text-center mb-2">{error}</p>}
            <button onClick={split} disabled={!file || selectedPages.size === 0 || splitting} className={cn(
              "w-full py-3 rounded-xl font-bold text-[11px] font-mono transition-all",
              file && selectedPages.size > 0 && !splitting
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:shadow-lg hover:shadow-emerald-500/20"
                : "bg-white/[0.06] text-gray-500 cursor-not-allowed"
            )}>
              {splitting ? <Loader2 size={16} className="animate-spin mx-auto" /> : (
                <span className="flex items-center justify-center gap-2">
                  <Scissors size={14} />
                  {mode === 'extract'
                    ? (lang === 'ar' ? `استخراج ${effectiveCount} صفحة` : `Extract ${effectiveCount} pages`)
                    : (lang === 'ar' ? `حذف ${selectedPages.size} صفحة` : `Remove ${selectedPages.size} pages`)
                  }
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
