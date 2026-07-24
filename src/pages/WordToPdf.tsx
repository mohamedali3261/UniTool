import { useState, useRef, useEffect } from 'react';
import { Upload, Download, Loader2, FileText, Trash2, FileDown } from 'lucide-react';
import mammoth from 'mammoth';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { cn } from '../lib/utils';

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
  const [mobileTab, setMobileTab] = useState<'upload' | 'preview' | 'export'>('upload');
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
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      
      if (result.value) {
        setHtmlContent(result.value);
        setMobileTab('preview');
      } else {
        setError(lang === 'ar' ? 'لم يتم استخراج محتوى' : 'No content extracted');
      }

      if (result.messages.length > 0) {
        console.log('Mammoth messages:', result.messages);
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
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      const pdf = new jsPDF({
        orientation: imgWidth > imgHeight ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const usableWidth = pdfWidth - margin * 2;
      const usableHeight = pdfHeight - margin * 2;

      const ratio = Math.min(usableWidth / imgWidth, usableHeight / imgHeight);
      const scaledWidth = imgWidth * ratio;
      const scaledHeight = imgHeight * ratio;

      const xOffset = margin + (usableWidth - scaledWidth) / 2;
      const yOffset = margin;

      if (scaledHeight <= usableHeight) {
        pdf.addImage(imgData, 'PNG', xOffset, yOffset, scaledWidth, scaledHeight);
      } else {
        const pageCanvasHeight = usableHeight / ratio;
        let sourceY = 0;
        let pageIdx = 0;

        while (sourceY < imgHeight) {
          if (pageIdx > 0) pdf.addPage();

          const sliceHeight = Math.min(pageCanvasHeight, imgHeight - sourceY);

          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = imgWidth;
          pageCanvas.height = sliceHeight;
          const ctx = pageCanvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, imgWidth, sliceHeight);
            ctx.drawImage(canvas, 0, sourceY, imgWidth, sliceHeight, 0, 0, imgWidth, sliceHeight);
          }

          const pageData = pageCanvas.toDataURL('image/png');
          pdf.addImage(pageData, 'PNG', margin, margin, usableWidth, sliceHeight * ratio);

          sourceY += sliceHeight;
          pageIdx++;
        }
      }

      const blob = pdf.output('blob');
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
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${wordFile.name.replace(/\.(docx?|DOCX?)$/, '')}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] bg-[#0F1115]/50 shrink-0 sm:px-4 sm:py-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/20 sm:w-8 sm:h-8">
          <FileText size={14} className="text-white" />
        </div>
        <div>
          <h1 className="text-xs font-bold text-white sm:text-sm">{lang === 'ar' ? 'Word إلى PDF' : 'Word to PDF'}</h1>
          <p className="text-[8px] text-gray-500 font-mono sm:text-[9px]">{lang === 'ar' ? 'تحويل مستند Word إلى ملف PDF' : 'Convert Word documents to PDF'}</p>
        </div>
      </div>

      {/* Mobile Tabs */}
      {wordFile && (
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
        {/* Left: Settings / Upload */}
        <aside className={cn(
          "w-full sm:w-80 max-h-[55vh] sm:max-h-none bg-[#14171C] border-r border-[#2D3139] flex flex-col shrink-0 overflow-y-auto settings-scroll",
          mobileTab === 'upload' ? "flex" : "hidden sm:flex"
        )}>
          <div className="p-3 space-y-3 sm:p-4">
            {!wordFile ? (
              <label className="group relative flex flex-col items-center justify-center gap-2 p-6 bg-[#0F1115] border-2 border-dashed border-[#2D3139] hover:border-blue-500/50 rounded-lg transition-all cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                  <Upload size={20} className="text-blue-500" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-xs text-gray-300 font-medium">
                    {lang === 'ar' ? 'انقر لاختيار ملف Word' : 'Click to select Word file'}
                  </p>
                  <p className="text-[8px] text-gray-500 font-mono uppercase">DOCX</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".docx,.doc"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="space-y-3">
                <div className="bg-[#0F1115] border border-[#2D3139] rounded-lg p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                    <FileText size={18} className="text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-white font-medium truncate">{wordFile.name}</p>
                    <p className="text-[8px] text-gray-500 font-mono">
                      {(wordFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button onClick={removeFile} className="p-1.5 hover:bg-red-500/20 rounded text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>

                <button
                  onClick={generatePdf}
                  disabled={!htmlContent || generating}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:from-gray-800 disabled:to-gray-800 text-white rounded-lg transition-all font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 disabled:shadow-none disabled:cursor-not-allowed"
                >
                  {generating ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      {lang === 'ar' ? 'جاري التحويل...' : 'Converting...'}
                    </>
                  ) : (
                    <>
                      <FileDown size={14} />
                      {lang === 'ar' ? 'تحويل إلى PDF' : 'Convert to PDF'}
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

        {/* Right: Preview */}
        <main className={cn(
          "flex-1 flex flex-col min-h-0 overflow-hidden",
          mobileTab === 'preview' || mobileTab === 'export' ? "flex" : "hidden sm:flex"
        )}>
          {htmlContent ? (
            <div className="flex-1 overflow-y-auto settings-scroll p-3 sm:p-4 space-y-3">
              {/* Preview */}
              <div className="bg-white rounded-lg overflow-hidden">
                <div
                  ref={previewRef}
                  className="p-6 text-sm text-gray-800 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
              </div>

              {/* Download Result */}
              {resultBlob && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileDown size={16} className="text-green-400" />
                    <div>
                      <p className="text-[10px] text-green-400 font-bold">
                        {lang === 'ar' ? 'جاهز للتحميل' : 'Ready to download'}
                      </p>
                      <p className="text-[8px] text-gray-500 font-mono">PDF</p>
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
                    ? (lang === 'ar' ? 'جاري قراءة ملف Word...' : 'Reading Word file...')
                    : (lang === 'ar' ? 'ارفع ملف Word للبدء' : 'Upload a Word file to get started')
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
