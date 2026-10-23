import type { RefObject } from 'react';
import { Download, FileText, FileDown } from 'lucide-react';

interface Props {
  lang: 'ar' | 'en';
  htmlContent: string;
  loading: boolean;
  resultBlob: Blob | null;
  previewRef: RefObject<HTMLDivElement | null>;
  onDownload: () => void;
}

export function PreviewPanel({ lang, htmlContent, loading, resultBlob, previewRef, onDownload }: Props) {
  if (!htmlContent) {
    return (
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
    );
  }

  return (
    <div className="flex-1 overflow-y-auto settings-scroll p-3 sm:p-4 space-y-3">
      <div className="bg-white rounded-lg overflow-hidden">
        <div
          ref={previewRef}
          className="p-6 text-sm text-gray-800 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>

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
