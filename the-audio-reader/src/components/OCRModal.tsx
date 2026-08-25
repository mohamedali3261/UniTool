import React, { useState } from 'react';
import { 
  X, 
  FileScan, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Globe, 
  Loader2, 
  StopCircle 
} from 'lucide-react';
import { BookDocument, OCRJobState, UILanguage } from '../types';
import { getTranslation } from '../translations';

interface OCRModalProps {
  isOpen: boolean;
  onClose: () => void;
  uiLang: UILanguage;
  book: BookDocument;
  ocrState: OCRJobState;
  onStartOCR: (lang: 'ara' | 'eng' | 'ara+eng', onlyEmptyPages: boolean) => void;
  onCancelOCR: () => void;
}

export const OCRModal: React.FC<OCRModalProps> = ({
  isOpen,
  onClose,
  uiLang,
  book,
  ocrState,
  onStartOCR,
  onCancelOCR,
}) => {
  const t = getTranslation(uiLang);
  const [selectedLang, setSelectedLang] = useState<'ara' | 'eng' | 'ara+eng'>('ara+eng');
  const [onlyEmptyPages, setOnlyEmptyPages] = useState<boolean>(true);

  if (!isOpen) return null;

  const scannedCount = book.pages.filter(p => p.isScannedImage || p.wordCount < 4).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-md bg-slate-950/80 animate-fade-in">
      <div 
        className="relative flex h-auto max-h-[85vh] w-full max-w-lg flex-col rounded-3xl border border-slate-800 bg-slate-900/95 shadow-2xl backdrop-blur-2xl"
        id="ocr-dialog-modal"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-850 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <FileScan className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white font-cairo">
                {t.ocrTitle}
              </h2>
              <p className="text-xs text-slate-400">
                {scannedCount} {uiLang === 'ar' ? 'صفحة مصورة تم رصدها' : 'scanned pages detected'}
              </p>
            </div>
          </div>

          {!ocrState.isActive && (
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              id="close-ocr-modal-btn"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5">
          <p className="text-xs text-slate-300 leading-relaxed">
            {t.ocrDescription}
          </p>

          {ocrState.isActive ? (
            /* OCR in Progress State */
            <div className="space-y-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 text-center">
              <div className="flex items-center justify-center gap-2 text-amber-400">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-sm font-bold">{t.ocrInProgress}</span>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-300 font-medium">
                  <span>{ocrState.statusMessage}</span>
                  <span className="text-amber-400 font-bold">{ocrState.overallProgress}%</span>
                </div>
                
                {/* Overall Progress */}
                <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
                    style={{ width: `${ocrState.overallProgress}%` }}
                  />
                </div>

                <p className="text-[11px] text-slate-400 pt-1">
                  {t.page} {ocrState.currentPage} {t.of} {ocrState.totalPages}
                </p>
              </div>

              <button
                onClick={onCancelOCR}
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition"
              >
                <StopCircle className="h-4 w-4" />
                <span>{t.cancelOcr}</span>
              </button>
            </div>
          ) : (
            /* OCR Configuration Form */
            <div className="space-y-4">
              
              {/* Language Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-indigo-400" />
                  <span>{t.ocrLangOption}</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedLang('ara+eng')}
                    className={`rounded-xl border p-2.5 text-xs font-semibold transition ${
                      selectedLang === 'ara+eng'
                        ? 'border-indigo-500 bg-indigo-950/40 text-indigo-300'
                        : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {t.ocrArabicEng}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedLang('ara')}
                    className={`rounded-xl border p-2.5 text-xs font-semibold transition ${
                      selectedLang === 'ara'
                        ? 'border-indigo-500 bg-indigo-950/40 text-indigo-300'
                        : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {t.ocrArabicOnly}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedLang('eng')}
                    className={`rounded-xl border p-2.5 text-xs font-semibold transition ${
                      selectedLang === 'eng'
                        ? 'border-indigo-500 bg-indigo-950/40 text-indigo-300'
                        : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {t.ocrEngOnly}
                  </button>
                </div>
              </div>

              {/* Scope Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-amber-400" />
                  <span>{t.ocrScopeOption}</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOnlyEmptyPages(true)}
                    className={`rounded-xl border p-2.5 text-xs font-semibold transition ${
                      onlyEmptyPages
                        ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                        : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {t.ocrScopeEmptyOnly}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOnlyEmptyPages(false)}
                    className={`rounded-xl border p-2.5 text-xs font-semibold transition ${
                      !onlyEmptyPages
                        ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                        : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {t.ocrScopeAll}
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Modal Footer */}
        {!ocrState.isActive && (
          <div className="flex items-center justify-end gap-3 border-t border-slate-850 p-4 sm:p-5 bg-slate-950/40">
            <button
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
            >
              {t.close}
            </button>
            <button
              onClick={() => onStartOCR(selectedLang, onlyEmptyPages)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-orange-400 active:scale-95 transition"
              id="start-ocr-action-btn"
            >
              <Sparkles className="h-4 w-4" />
              <span>{t.startOcr}</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
