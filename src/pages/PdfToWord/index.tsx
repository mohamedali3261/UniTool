import { useState, useRef, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { MobileTab, PdfPage } from './types';
import { downloadBlob, extractPdfPages, generateWordBlob } from './utils/pdf';
import { MobileTabs } from './components/MobileTabs';
import { UploadPanel } from './components/UploadPanel';
import { PagesPreview } from './components/PagesPreview';

interface Props {
  t: any;
  lang: 'ar' | 'en';
}

export function PdfToWord({ t, lang }: Props) {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PdfPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>('upload');
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
      const extractedPages = await extractPdfPages(file);

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
      const blob = await generateWordBlob(pages, lang);
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
    downloadBlob(resultBlob, `${pdfFile.name.replace('.pdf', '')}.docx`);
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
        <MobileTabs lang={lang} mobileTab={mobileTab} onChange={setMobileTab} />
      )}

      <div className="flex flex-1 overflow-hidden">
        <aside className={cn(
          "w-full sm:w-80 max-h-[55vh] sm:max-h-none bg-[#14171C] border-r border-[#2D3139] flex flex-col shrink-0 overflow-y-auto settings-scroll",
          mobileTab === 'upload' ? "flex" : "hidden sm:flex"
        )}>
          <UploadPanel
            lang={lang}
            pdfFile={pdfFile}
            pages={pages}
            generating={generating}
            error={error}
            fileInputRef={fileInputRef}
            onFileUpload={handleFileUpload}
            onGenerate={generateWord}
            onRemove={removeFile}
          />
        </aside>

        <main className={cn(
          "flex-1 flex flex-col min-h-0 overflow-hidden",
          mobileTab === 'preview' || mobileTab === 'export' ? "flex" : "hidden sm:flex"
        )}>
          <PagesPreview
            lang={lang}
            pages={pages}
            loading={loading}
            resultBlob={resultBlob}
            onDownload={downloadResult}
          />
        </main>
      </div>
    </div>
  );
}
