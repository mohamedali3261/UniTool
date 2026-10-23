import { useState, useRef, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { MobileTab } from './types';
import { convertWordToHtml, downloadBlob, generatePdfBlob } from './utils/pdf';
import { MobileTabs } from './components/MobileTabs';
import { UploadPanel } from './components/UploadPanel';
import { PreviewPanel } from './components/PreviewPanel';

interface Props {
  t: any;
  lang: 'ar' | 'en';
}

export function WordToPdf({ t, lang }: Props) {
  const [wordFile, setWordFile] = useState<File | null>(null);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>('upload');
  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (resultBlob) URL.revokeObjectURL(URL.createObjectURL(resultBlob));
    };
  }, [resultBlob]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'docx' && ext !== 'doc') {
      setError(lang === 'ar' ? 'الرجاء اختيار ملف Word (.docx)' : 'Please select a Word file (.docx)');
      return;
    }

    setWordFile(file);
    setLoading(true);
    setError(null);
    setHtmlContent('');
    setResultBlob(null);

    try {
      const { html, messages } = await convertWordToHtml(file);

      if (html) {
        setHtmlContent(html);
        setMobileTab('preview');
      } else {
        setError(lang === 'ar' ? 'لم يتم استخراج محتوى' : 'No content extracted');
      }

      if (messages.length > 0) {
        console.log('Mammoth messages:', messages);
      }
    } catch (err) {
      console.error(err);
      setError(lang === 'ar' ? 'خطأ في قراءة ملف Word' : 'Error reading Word file');
    } finally {
      setLoading(false);
    }
  };

  const generatePdf = async () => {
    if (!previewRef.current) return;
    setGenerating(true);
    setError(null);

    try {
      const blob = await generatePdfBlob(previewRef.current);
      setResultBlob(blob);
      setMobileTab('export');
    } catch (err) {
      console.error(err);
      setError(lang === 'ar' ? 'فشل إنشاء ملف PDF' : 'Failed to generate PDF');
    } finally {
      setGenerating(false);
    }
  };

  const downloadResult = () => {
    if (!resultBlob || !wordFile) return;
    downloadBlob(resultBlob, `${wordFile.name.replace(/\.(docx?|DOCX?)$/, '')}.pdf`);
  };

  const removeFile = () => {
    setWordFile(null);
    setHtmlContent('');
    setResultBlob(null);
    setError(null);
    setMobileTab('upload');
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] bg-[#0F1115]/50 shrink-0 sm:px-4 sm:py-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/20 sm:w-8 sm:h-8">
          <FileText size={14} className="text-white" />
        </div>
        <div>
          <h1 className="text-xs font-bold text-white sm:text-sm">{lang === 'ar' ? 'Word إلى PDF' : 'Word to PDF'}</h1>
          <p className="text-[8px] text-gray-500 font-mono sm:text-[9px]">{lang === 'ar' ? 'تحويل مستند Word إلى ملف PDF' : 'Convert Word documents to PDF'}</p>
        </div>
      </div>

      {wordFile && (
        <MobileTabs lang={lang} mobileTab={mobileTab} onChange={setMobileTab} />
      )}

      <div className="flex flex-1 overflow-hidden">
        <aside className={cn(
          "w-full sm:w-80 max-h-[55vh] sm:max-h-none bg-[#14171C] border-r border-[#2D3139] flex flex-col shrink-0 overflow-y-auto settings-scroll",
          mobileTab === 'upload' ? "flex" : "hidden sm:flex"
        )}>
          <UploadPanel
            lang={lang}
            wordFile={wordFile}
            htmlContent={htmlContent}
            generating={generating}
            error={error}
            fileInputRef={fileInputRef}
            onFileUpload={handleFileUpload}
            onGenerate={generatePdf}
            onRemove={removeFile}
          />
        </aside>

        <main className={cn(
          "flex-1 flex flex-col min-h-0 overflow-hidden",
          mobileTab === 'preview' || mobileTab === 'export' ? "flex" : "hidden sm:flex"
        )}>
          <PreviewPanel
            lang={lang}
            htmlContent={htmlContent}
            loading={loading}
            resultBlob={resultBlob}
            previewRef={previewRef}
            onDownload={downloadResult}
          />
        </main>
      </div>
    </div>
  );
}
