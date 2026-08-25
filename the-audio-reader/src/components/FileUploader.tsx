import React, { useState, useRef, useCallback } from 'react';
import { 
  UploadCloud, 
  FileText, 
  FileCheck, 
  Sparkles, 
  Clock, 
  BookOpen, 
  Layers, 
  ShieldCheck, 
  Cpu, 
  Trash2,
  HelpCircle,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { BookDocument, UILanguage } from '../types';
import { getTranslation } from '../translations';
import { getSampleBooks } from '../constants/sampleBooks';

interface FileUploaderProps {
  uiLang: UILanguage;
  onFileSelect: (file: File) => void;
  onSelectSampleBook: (book: BookDocument) => void;
  recentBooks: BookDocument[];
  onSelectRecentBook: (book: BookDocument) => void;
  onDeleteRecentBook: (bookId: string, e: React.MouseEvent) => void;
  isParsing: boolean;
  parseProgress: { current: number; total: number; message: string } | null;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  uiLang,
  onFileSelect,
  onSelectSampleBook,
  recentBooks,
  onSelectRecentBook,
  onDeleteRecentBook,
  isParsing,
  parseProgress,
}) => {
  const t = getTranslation(uiLang);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sampleBooks = getSampleBooks();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  const isRtl = uiLang === 'ar';
  const NextIcon = isRtl ? ArrowLeft : ArrowRight;

  return (
    <div className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-14 lg:px-8">
      
      {/* Background ambient glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center overflow-hidden">
        <div className="h-[450px] w-[650px] rounded-full bg-gradient-to-tr from-indigo-600/15 via-purple-600/10 to-pink-600/5 blur-[120px]" />
      </div>

      {/* Hero Section */}
      <div className="text-center space-y-4 mb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3.5 py-1 text-xs font-medium text-indigo-300 shadow-sm backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          <span>{uiLang === 'ar' ? 'خصوصية 100% • أصوات المتصفح الأصلية' : '100% Client-Side Private • Native TTS'}</span>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-white font-cairo">
          {t.heroHeading}
        </h1>

        <p className="mx-auto max-w-2xl text-sm sm:text-base text-slate-400 leading-relaxed">
          {t.heroDescription}
        </p>
      </div>

      {/* Drag and Drop Zone */}
      <div className="relative">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isParsing && fileInputRef.current?.click()}
          className={`group relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 ${
            isDragOver
              ? 'border-indigo-400 bg-indigo-950/40 shadow-2xl shadow-indigo-500/20 scale-[1.01]'
              : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/90 shadow-xl'
          } backdrop-blur-xl`}
          id="file-dropzone"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.epub,.docx,application/pdf,text/plain,application/epub+zip,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileInputChange}
            className="hidden"
            id="file-upload-input"
          />

          {isParsing ? (
            /* Loading State */
            <div className="flex flex-col items-center space-y-4 py-6">
              <div className="relative flex h-16 w-16 items-center justify-center">
                <div className="absolute h-full w-full animate-spin rounded-full border-4 border-indigo-500/20 border-t-indigo-500" />
                <BookOpen className="h-7 w-7 text-indigo-400" />
              </div>
              <div className="space-y-1 text-center">
                <p className="text-base font-semibold text-white">
                  {parseProgress?.message || t.loadingDocument}
                </p>
                {parseProgress && parseProgress.total > 0 && (
                  <p className="text-xs text-slate-400">
                    {parseProgress.current} {t.of} {parseProgress.total} ({Math.round((parseProgress.current / parseProgress.total) * 100)}%)
                  </p>
                )}
              </div>
              {parseProgress && parseProgress.total > 0 && (
                <div className="w-64 h-1.5 rounded-full bg-slate-800 overflow-hidden mt-2">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                    style={{ width: `${(parseProgress.current / parseProgress.total) * 100}%` }}
                  />
                </div>
              )}
            </div>
          ) : (
            /* Idle Drag State */
            <>
              <div className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-600/10 text-indigo-400 ring-8 ring-indigo-500/5 group-hover:scale-105 group-hover:bg-indigo-600/20 transition-all duration-300">
                <UploadCloud className="h-10 w-10 transition-transform duration-300 group-hover:-translate-y-1" />
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-white mb-2">
                {t.dropZoneTitle}
              </h2>

              <p className="text-xs sm:text-sm text-slate-400 mb-6">
                {t.dropZoneSub}
              </p>

              {/* Supported Format Pills */}
              <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
                <span className="rounded-md bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-400 border border-red-500/20">
                  PDF & OCR
                </span>
                <span className="rounded-md bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-400 border border-blue-500/20">
                  TXT
                </span>
                <span className="rounded-md bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                  EPUB
                </span>
                <span className="rounded-md bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-400 border border-amber-500/20">
                  DOCX
                </span>
              </div>

              {/* Browse Button */}
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:from-indigo-500 hover:to-purple-500 hover:shadow-indigo-500/35 active:scale-95 focus-ring"
                id="browse-files-btn"
              >
                <FileText className="h-4 w-4" />
                <span>{t.browseFiles}</span>
              </button>

              <span className="mt-4 text-[11px] text-slate-500 font-medium">
                {t.maxSizeNotice}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Instant 1-Click Samples */}
      <div className="mt-10 rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 sm:p-6 backdrop-blur-md">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <h2 className="text-sm font-semibold text-slate-200">
            {t.orTrySample}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sampleBooks.map((sample) => (
            <button
              key={sample.id}
              onClick={() => onSelectSampleBook(sample)}
              className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-850/80 p-4 text-start transition hover:border-indigo-500/50 hover:bg-slate-800 group focus-ring"
              id={`sample-book-${sample.id}`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-100 group-hover:text-indigo-300">
                    {sample.title}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {sample.totalPages} {t.pageCount} • {sample.totalWords} {t.wordsCount}
                  </p>
                </div>
              </div>
              <NextIcon className="h-4 w-4 text-slate-500 transition-transform group-hover:text-indigo-400 group-hover:translate-x-1" />
            </button>
          ))}
        </div>
      </div>

      {/* Recent Books Shelf */}
      {recentBooks.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400" />
              <span>{t.recentBooks}</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentBooks.map((book) => (
              <div
                key={book.id}
                onClick={() => onSelectRecentBook(book)}
                className="group relative flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-4 hover:border-slate-700 hover:bg-slate-850/90 transition cursor-pointer"
                id={`recent-book-${book.id}`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                      {book.fileType}
                    </span>
                    <button
                      onClick={(e) => onDeleteRecentBook(book.id, e)}
                      className="rounded p-1 text-slate-500 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400 transition"
                      title={t.deleteBook}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <p className="text-sm font-semibold text-slate-100 mt-2 line-clamp-1 group-hover:text-indigo-300">
                    {book.title}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {book.totalPages} {t.pageCount} • {book.totalWords} {t.wordsCount}
                  </p>
                </div>

                {/* Progress bar */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{book.progressPercentage || 0}% {t.readingProgress}</span>
                  <span className="text-indigo-400 group-hover:underline font-medium">
                    {t.openBook}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feature Highlights Grid */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div className="rounded-2xl border border-slate-850 bg-slate-900/40 p-5 backdrop-blur-sm">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
            <Cpu className="h-5 w-5" />
          </div>
          <h2 className="text-sm font-bold text-slate-200">
            {uiLang === 'ar' ? 'أصوات جهازك الأصلية' : 'Zero API Keys Needed'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {uiLang === 'ar' ? 'قراءة فورية مجانية بدون استهلاك رصيد أو اشتراكات خارجية' : 'Uses your native system TTS voices completely free and unlimited.'}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-850 bg-slate-900/40 p-5 backdrop-blur-sm">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h2 className="text-sm font-bold text-slate-200">
            {uiLang === 'ar' ? 'أمان وخصوصية تامة' : '100% Private & Offline'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {uiLang === 'ar' ? 'مستنداتك لا تغادر جهازك أبداً وتتم معالجتها محلياً بالكامل' : 'Your books never leave your device. All parsing and OCR runs locally.'}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-850 bg-slate-900/40 p-5 backdrop-blur-sm">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
            <Layers className="h-5 w-5" />
          </div>
          <h2 className="text-sm font-bold text-slate-200">
            {uiLang === 'ar' ? 'OCR للكتب الممسوحة' : 'Smart OCR Engine'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {uiLang === 'ar' ? 'استخراج النصوص من صفحات الـ PDF المصورة بنقرة زر' : 'Extract text from scanned image PDFs with client-side OCR.'}
          </p>
        </div>
      </div>

    </div>
  );
};
