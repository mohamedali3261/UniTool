import { useState, useRef, useEffect } from 'react';
import { Upload, Download, Loader2, FileText, Copy, Check, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { cn } from '../lib/utils';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface Props {
  t: any;
  lang: 'ar' | 'en';
}

interface PageText {
  pageNum: number;
  text: string;
}

export function PdfToText({ t, lang }: Props) {
  const [pages, setPages] = useState<PageText[]>([]);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activePage, setActivePage] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mobileTab, setMobileTab] = useState<'upload' | 'preview' | 'export'>('upload');

  useEffect(() => {
    if (pages.length > 0 && !loading) {
      setMobileTab('preview');
    }
  }, [pages, loading]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setPages([]);
    setActivePage(0);
    setFileName(file.name.replace(/\.pdf$/i, ''));

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const extractedPages: PageText[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const text = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        extractedPages.push({ pageNum: i, text });
      }

      setPages(extractedPages);
      setLoading(false);
    } catch (err: any) {
      console.error('PDF text extraction error:', err);
      setError(lang === 'ar' ? `خطأ: ${err?.message || 'تحقق من الملف'}` : `Error: ${err?.message || 'Check the file'}`);
      setLoading(false);
    }

    e.target.value = '';
  };

  const fullText = pages.map(p => p.text).join('\n\n');
  const currentPageText = pages[activePage]?.text || '';

  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyAllText = async () => {
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadTxt = () => {
    let content = '';
    if (pages.length === 1) {
      content = pages[0].text;
    } else {
      content = pages.map(p => `--- Page ${p.pageNum} ---\n\n${p.text}`).join('\n\n\n');
    }
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <style>{`
        .pdf2text-scroll { direction: ltr; overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.08) transparent; }
        .pdf2text-scroll::-webkit-scrollbar { width: 4px; }
        .pdf2text-scroll::-webkit-scrollbar-track { background: transparent; }
        .pdf2text-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        .pdf2text-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
        .pdf2text-scroll > * { direction: ${lang === 'ar' ? 'rtl' : 'ltr'}; }
      `}</style>

      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] bg-[#0F1115]/50 shrink-0 sm:px-4 sm:py-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/20 sm:w-8 sm:h-8">
          <FileText size={14} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xs font-bold text-white sm:text-sm">{lang === 'ar' ? 'استخراج النص من PDF' : 'Extract Text from PDF'}</h1>
          <p className="text-[8px] text-gray-500 font-mono sm:text-[9px]">{lang === 'ar' ? 'تحويل محتوى PDF إلى نص عادي' : 'Convert PDF content to plain text'}</p>
        </div>
      </div>

      <div className="flex border-b border-white/[0.06] md:hidden shrink-0">
        {(['upload', 'preview', 'export'] as const).map(tab => (
          <button key={tab} onClick={() => setMobileTab(tab)} className={cn(
            "flex-1 py-2 text-[9px] font-mono uppercase tracking-wider transition-colors",
            mobileTab === tab ? 'text-white border-b-2 border-blue-500' : 'text-gray-500'
          )}>
            {tab === 'upload' ? (lang === 'ar' ? 'رفع' : 'Upload') : tab === 'preview' ? (lang === 'ar' ? 'النص' : 'Text') : (lang === 'ar' ? 'تحميل' : 'Download')}
          </button>
        ))}
      </div>

      <div className="flex-1 pdf2text-scroll">
        <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-4">
          {/* Upload */}
          <div className={cn("md:block", mobileTab !== 'upload' && 'hidden')}>
            <input ref={fileInputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={handleFileUpload} />

            {!loading && (
              <button onClick={() => fileInputRef.current?.click()} className="w-full p-6 rounded-xl border-2 border-dashed border-white/10 hover:border-blue-500/40 hover:bg-blue-500/5 transition-all text-center">
                <Upload size={24} className="text-gray-500 mx-auto mb-2" />
                <p className="text-[10px] text-gray-400 font-mono">{lang === 'ar' ? 'اختر ملف PDF' : 'Choose a PDF file'}</p>
              </button>
            )}

            {loading && (
              <div className="w-full p-6 rounded-xl border-2 border-blue-500/20 bg-blue-500/5 text-center">
                <Loader2 size={24} className="animate-spin text-blue-400 mx-auto mb-2" />
                <p className="text-[10px] text-blue-400 font-mono">{lang === 'ar' ? 'جاري استخراج النص...' : 'Extracting text...'}</p>
              </div>
            )}

            {pages.length > 0 && !loading && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                  <FileText size={16} className="text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-white font-bold truncate">{fileName}</p>
                  <p className="text-[8px] text-gray-500 font-mono">{pages.length} {lang === 'ar' ? 'صفحة' : 'pages'} • {fullText.length} {lang === 'ar' ? 'حرف' : 'chars'}</p>
                </div>
                <button onClick={() => { setPages([]); setFileName(''); setActivePage(0); }} className="p-1 rounded hover:bg-red-500/20">
                  <Trash2 size={12} className="text-red-400" />
                </button>
              </div>
            )}
          </div>

          {error && <p className="text-[9px] text-red-400 font-mono text-center">{error}</p>}

          {/* Page-by-page Text Preview */}
          {pages.length > 0 && !loading && (
            <div className={cn("md:block", mobileTab !== 'preview' && 'hidden')}>
              {/* Page Navigator */}
              {pages.length > 1 && (
                <div className="flex items-center justify-between mb-3 p-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <button
                    onClick={() => setActivePage(p => Math.max(0, p - 1))}
                    disabled={activePage === 0}
                    className="p-1.5 rounded-lg hover:bg-white/[0.08] disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={14} className="text-gray-400" />
                  </button>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-white font-bold">{activePage + 1}</span>
                    <span className="text-[10px] font-mono text-gray-500">/</span>
                    <span className="text-[10px] font-mono text-gray-400">{pages.length}</span>
                  </div>
                  <button
                    onClick={() => setActivePage(p => Math.min(pages.length - 1, p + 1))}
                    disabled={activePage === pages.length - 1}
                    className="p-1.5 rounded-lg hover:bg-white/[0.08] disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={14} className="text-gray-400" />
                  </button>
                </div>
              )}

              {/* Page Dots */}
              {pages.length > 1 && pages.length <= 20 && (
                <div className="flex items-center justify-center gap-1 mb-3 flex-wrap">
                  {pages.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActivePage(i)}
                      className={cn(
                        "w-2 h-2 rounded-full transition-all",
                        i === activePage ? "bg-blue-500 scale-125" : "bg-white/10 hover:bg-white/20"
                      )}
                    />
                  ))}
                </div>
              )}

              {/* Text Content */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-mono text-gray-400">
                  {pages.length > 1
                    ? `${lang === 'ar' ? 'صفحة' : 'Page'} ${activePage + 1} — ${currentPageText.length} ${lang === 'ar' ? 'حرف' : 'chars'}`
                    : `${currentPageText.length} ${lang === 'ar' ? 'حرف' : 'chars'}`
                  }
                </span>
                <button
                  onClick={() => copyText(pages.length > 1 ? currentPageText : fullText)}
                  className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-[8px] font-mono text-gray-400 transition-colors"
                >
                  {copied ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                  {copied ? (lang === 'ar' ? 'تم النسخ' : 'Copied') : (lang === 'ar' ? 'نسخ' : 'Copy')}
                </button>
              </div>
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 min-h-[16rem]">
                <pre className="text-[10px] text-gray-300 font-mono leading-relaxed whitespace-pre-wrap break-words">{currentPageText || (lang === 'ar' ? 'لا يوجد نص في هذه الصفحة' : 'No text on this page')}</pre>
              </div>
            </div>
          )}

          {/* Download */}
          {pages.length > 0 && !loading && (
            <div className={cn("md:block", mobileTab !== 'export' && 'hidden')}>
              <button onClick={downloadTxt} className="w-full py-3 rounded-xl font-bold text-[11px] font-mono bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:shadow-lg hover:shadow-blue-500/20 transition-all">
                <span className="flex items-center justify-center gap-2">
                  <Download size={14} />
                  {lang === 'ar' ? 'تحميل كملف نصي' : 'Download as Text File'}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
