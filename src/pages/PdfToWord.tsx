import { useState, useRef, useEffect } from 'react';
import { Upload, Download, Loader2, FileText, Trash2, FileDown } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { cn } from '../lib/utils';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface Props {
  t: any;
  lang: 'ar' | 'en';
}

interface PdfPage {
  pageNum: number;
  text: string;
}

export function PdfToWord({ t, lang }: Props) {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PdfPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [mobileTab, setMobileTab] = useState<'upload' | 'preview' | 'export'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (resultBlob) URL.revokeObjectURL(URL.createObjectURL(resultBlob));
    };
  }, [resultBlob]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      setError(lang === 'ar' ? 'الرجاء اختيار ملف PDF' : 'Please select a PDF file');
      return;
    }

    setPdfFile(file);
    setLoading(true);
    setError(null);
    setPages([]);
    setResultBlob(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const extractedPages: PdfPage[] = [];

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
      if (extractedPages.length > 0) {
        setMobileTab('preview');
      }
    } catch (err) {
      console.error(err);
      setError(lang === 'ar' ? 'خطأ في قراءة ملف PDF' : 'Error reading PDF file');
      setLoading(false);
    }
  };

  const generateWord = async () => {
    if (pages.length === 0) return;
    setGenerating(true);

    try {
      const paragraphs: Paragraph[] = [];

      pages.forEach((page, idx) => {
        if (idx > 0) {
          paragraphs.push(new Paragraph({ text: '' }));
        }

        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: lang === 'ar' ? `صفحة ${page.pageNum}` : `Page ${page.pageNum}`,
                bold: true,
                size: 28,
                color: '4472C4',
              }),
            ],
            spacing: { after: 200 },
          })
        );

        if (page.text.trim()) {
          const lines = page.text.split(/\s+/);
          const lineChunks: string[] = [];
          for (let i = 0; i < lines.length; i += 20) {
            lineChunks.push(lines.slice(i, i + 20).join(' '));
          }

          lineChunks.forEach(chunk => {
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: chunk,
                    size: 24,
                  }),
                ],
                spacing: { after: 120 },
              })
            );
          });
        } else {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: lang === 'ar' ? '[صفحة فارغة]' : '[Empty page]',
                  italics: true,
                  size: 22,
                  color: '999999',
                }),
              ],
            })
          );
        }
      });

      const doc = new Document({
        sections: [{
          properties: {},
          children: paragraphs,
        }],
      });

      const blob = await Packer.toBlob(doc);
      setResultBlob(blob);
      setMobileTab('export');
    } catch (err) {
      console.error(err);
      setError(lang === 'ar' ? 'فشل إنشاء ملف Word' : 'Failed to generate Word file');
    } finally {
      setGenerating(false);
    }
  };

  const downloadResult = () => {
    if (!resultBlob || !pdfFile) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pdfFile.name.replace('.pdf', '')}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const removeFile = () => {
    setPdfFile(null);
    setPages([]);
    setResultBlob(null);
    setError(null);
    setMobileTab('upload');
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] bg-[#0F1115]/50 shrink-0 sm:px-4 sm:py-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 sm:w-8 sm:h-8">
          <FileText size={14} className="text-white" />
        </div>
        <div>
          <h1 className="text-xs font-bold text-white sm:text-sm">{lang === 'ar' ? 'PDF إلى Word' : 'PDF to Word'}</h1>
          <p className="text-[8px] text-gray-500 font-mono sm:text-[9px]">{lang === 'ar' ? 'تحويل ملف PDF إلى مستند Word' : 'Convert PDF files to Word documents'}</p>
        </div>
      </div>

      {pdfFile && (
        <div className="flex border-b border-[#2D3139] bg-[#14171C] sm:hidden shrink-0">
          {[
            { id: 'upload', label: lang === 'ar' ? 'رفع' : 'Upload', icon: Upload },
            { id: 'preview', label: lang === 'ar' ? 'معاينة' : 'Preview', icon: FileText },
            { id: 'export', label: lang === 'ar' ? 'تصدير' : 'Export', icon: FileDown },
          ].map(tab => (
            <button key={tab.id} onClick={() => setMobileTab(tab.id as any)}
              className={cn("flex-1 py-2.5 flex flex-col items-center gap-1 font-mono text-[7px] uppercase tracking-widest transition-colors", mobileTab === tab.id ? "text-blue-500 bg-[#1A1D23]" : "text-gray-500")}>
              <tab.icon size={12} />
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <aside className={cn(
          "w-full sm:w-80 max-h-[55vh] sm:max-h-none bg-[#14171C] border-r border-[#2D3139] flex flex-col shrink-0 overflow-y-auto settings-scroll",
          mobileTab === 'upload' ? "flex" : "hidden sm:flex"
        )}>
          <div className="p-3 space-y-3 sm:p-4">
            {!pdfFile ? (
              <label className="group relative flex flex-col items-center justify-center gap-2 p-6 bg-[#0F1115] border-2 border-dashed border-[#2D3139] hover:border-blue-500/50 rounded-lg transition-all cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                  <Upload size={20} className="text-blue-500" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-xs text-gray-300 font-medium">
                    {lang === 'ar' ? 'انقر لاختيار ملف PDF' : 'Click to select PDF'}
                  </p>
                  <p className="text-[8px] text-gray-500 font-mono uppercase">PDF</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="space-y-3">
                <div className="bg-[#0F1115] border border-[#2D3139] rounded-lg p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                    <FileText size={18} className="text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-white font-medium truncate">{pdfFile.name}</p>
                    <p className="text-[8px] text-gray-500 font-mono">
                      {(pdfFile.size / 1024).toFixed(1)} KB · {pages.length} {lang === 'ar' ? 'صفحة' : 'pages'}
                    </p>
                  </div>
                  <button onClick={removeFile} className="p-1.5 hover:bg-red-500/20 rounded text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>

                <button
                  onClick={generateWord}
                  disabled={pages.length === 0 || generating}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-gray-800 disabled:to-gray-800 text-white rounded-lg transition-all font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 disabled:shadow-none disabled:cursor-not-allowed"
                >
                  {generating ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      {lang === 'ar' ? 'جاري التحويل...' : 'Converting...'}
                    </>
                  ) : (
                    <>
                      <FileDown size={14} />
                      {lang === 'ar' ? 'تحويل إلى Word' : 'Convert to Word'}
                    </>
                  )}
                </button>

                {error && (
                  <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-[9px] text-red-400 font-mono">{error}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>

        <main className={cn(
          "flex-1 flex flex-col min-h-0 overflow-hidden",
          mobileTab === 'preview' || mobileTab === 'export' ? "flex" : "hidden sm:flex"
        )}>
          {pages.length > 0 ? (
            <div className="flex-1 overflow-y-auto settings-scroll p-3 sm:p-4 space-y-3">
              {pages.map(page => (
                <div key={page.pageNum} className="bg-[#14171C] border border-[#2D3139] rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-[#2D3139]">
                    <span className="text-[9px] font-mono text-blue-400 font-bold">
                      {lang === 'ar' ? `صفحة ${page.pageNum}` : `Page ${page.pageNum}`}
                    </span>
                    <span className="text-[8px] font-mono text-gray-600">
                      {page.text.length} {lang === 'ar' ? 'حرف' : 'chars'}
                    </span>
                  </div>
                  <div className="p-3">
                    {page.text.trim() ? (
                      <p className="text-[10px] text-gray-300 font-mono leading-relaxed whitespace-pre-wrap break-words">
                        {page.text}
                      </p>
                    ) : (
                      <p className="text-[9px] text-gray-600 italic">
                        {lang === 'ar' ? 'صفحة فارغة' : 'Empty page'}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {resultBlob && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileDown size={16} className="text-green-400" />
                    <div>
                      <p className="text-[10px] text-green-400 font-bold">
                        {lang === 'ar' ? 'جاهز للتحميل' : 'Ready to download'}
                      </p>
                      <p className="text-[8px] text-gray-500 font-mono">
                        {pages.length} {lang === 'ar' ? 'صفحة' : 'pages'} · DOCX
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={downloadResult}
                    className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg text-[9px] font-bold uppercase transition-all"
                  >
                    <Download size={12} />
                    {lang === 'ar' ? 'تحميل' : 'Download'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-2">
                <FileText size={32} className="text-gray-700 mx-auto" />
                <p className="text-[10px] text-gray-600 font-mono">
                  {loading
                    ? (lang === 'ar' ? 'جاري تحليل ملف PDF...' : 'Analyzing PDF...')
                    : (lang === 'ar' ? 'ارفع ملف PDF للبدء' : 'Upload a PDF to get started')
                  }
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
