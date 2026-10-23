import type { RefObject } from 'react';
import { Upload, Loader2, FileText, Trash2, FileDown } from 'lucide-react';
import type { PdfPage } from '../types';

interface Props {
  lang: 'ar' | 'en';
  pdfFile: File | null;
  pages: PdfPage[];
  generating: boolean;
  error: string | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGenerate: () => void;
  onRemove: () => void;
}

export function UploadPanel({
  lang, pdfFile, pages, generating, error, fileInputRef, onFileUpload, onGenerate, onRemove,
}: Props) {
  return (
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
            onChange={onFileUpload}
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
            <button onClick={onRemove} className="p-1.5 hover:bg-red-500/20 rounded text-red-400 transition-colors">
              <Trash2 size={14} />
            </button>
          </div>

          <button
            onClick={onGenerate}
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
  );
}
