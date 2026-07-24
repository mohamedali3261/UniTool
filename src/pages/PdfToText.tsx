import { useState, useRef } from 'react';
import { Upload, Download, Loader2, FileText, Copy, Check } from 'lucide-react';
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

export function PdfToText({ t, lang }: Props) {
  const [text, setText] = useState<string>('');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mobileTab, setMobileTab] = useState<'upload' | 'preview' | 'export'>('upload');

  const handleFile = async (f: File) => {
    setLoading(true);
    setError(null);
    setText('');
    setFileName(f.name.replace(/\.pdf$/i, ''));
    try {
      const arrayBuffer = await f.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n\n';
      }
      setText(fullText.trim());
    } catch {
      setError(lang === 'ar' ? 'خطأ في استخراج النص' : 'Error extracting text');
    }
    setLoading(false);
  };

  const copyText = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadTxt = () => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
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
            <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            <button onClick={() => fileInputRef.current?.click()} disabled={loading} className={cn(
              "w-full p-6 rounded-xl border-2 border-dashed transition-all text-center",
              "border-white/10 hover:border-blue-500/40 hover:bg-blue-500/5",
              loading && 'opacity-50 cursor-wait'
            )}>
              {loading ? <Loader2 size={24} className="animate-spin text-blue-400 mx-auto mb-2" /> : <Upload size={24} className="text-gray-500 mx-auto mb-2" />}
              <p className="text-[10px] text-gray-400 font-mono">{lang === 'ar' ? 'اختر ملف PDF' : 'Choose a PDF file'}</p>
            </button>
          </div>

          {/* Text Preview */}
          {text && (
            <div className={cn("md:block", mobileTab !== 'preview' && 'hidden')}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-mono text-gray-400">{text.length} {lang === 'ar' ? 'حرف' : 'characters'}</span>
                <button onClick={copyText} className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-[8px] font-mono text-gray-400 transition-colors">
                  {copied ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                  {copied ? (lang === 'ar' ? 'تم النسخ' : 'Copied') : (lang === 'ar' ? 'نسخ' : 'Copy')}
                </button>
              </div>
              <textarea readOnly value={text} className="w-full h-64 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-[10px] text-gray-300 font-mono leading-relaxed resize-none focus:outline-none focus:border-white/[0.12]" />
            </div>
          )}

          {error && <p className="text-[9px] text-red-400 font-mono text-center">{error}</p>}

          {/* Download */}
          {text && (
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
