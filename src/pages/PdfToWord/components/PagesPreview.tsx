import { Download, FileText, FileDown } from 'lucide-react';
import type { PdfPage } from '../types';

interface Props {
  lang: 'ar' | 'en';
  pages: PdfPage[];
  loading: boolean;
  resultBlob: Blob | null;
  onDownload: () => void;
}

export function PagesPreview({ lang, pages, loading, resultBlob, onDownload }: Props) {
  if (pages.length === 0) {
    return (
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
    );
  }

  return (
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
            onClick={onDownload}
            className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg text-[9px] font-bold uppercase transition-all"
          >
            <Download size={12} />
            {lang === 'ar' ? 'تحميل' : 'Download'}
          </button>
        </div>
      )}
    </div>
  );
}
