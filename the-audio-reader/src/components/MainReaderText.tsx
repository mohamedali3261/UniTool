import React, { useEffect, useRef } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Bookmark, 
  BookmarkCheck, 
  Scan, 
  ZoomIn, 
  ZoomOut, 
  MousePointerClick,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Volume2,
  FileScan
} from 'lucide-react';
import { BookDocument, BookPage, BookChunk, ReaderSettings, UILanguage, ThemeMode } from '../types';
import { getTranslation } from '../translations';
import { getThemeConfig } from '../utils/theme';

interface MainReaderTextProps {
  uiLang: UILanguage;
  book: BookDocument;
  currentPageData: BookPage;
  currentPageNumber: number;
  currentChunkIndex: number;
  isPlaying: boolean;
  activeWordRange: { start: number; end: number } | null;
  settings: ReaderSettings;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  onSelectChunk: (chunkIndex: number) => void;
  onNextPage: () => void;
  onPrevPage: () => void;
  onOpenOCRModal: () => void;
  onIncreaseFontSize: () => void;
  onDecreaseFontSize: () => void;
}

export const MainReaderText: React.FC<MainReaderTextProps> = ({
  uiLang,
  book,
  currentPageData,
  currentPageNumber,
  currentChunkIndex,
  isPlaying,
  activeWordRange,
  settings,
  isBookmarked,
  onToggleBookmark,
  onSelectChunk,
  onNextPage,
  onPrevPage,
  onOpenOCRModal,
  onIncreaseFontSize,
  onDecreaseFontSize,
}) => {
  const t = getTranslation(uiLang);
  const activeChunkRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active sentence/chunk smoothly when playing
  useEffect(() => {
    if (settings.autoScroll && isPlaying && activeChunkRef.current) {
      activeChunkRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentChunkIndex, isPlaying, settings.autoScroll]);

  // Determine theme styles
  const themeStyle = getThemeConfig(settings.theme);

  // Determine font family style
  const getFontFamilyStyle = () => {
    switch (settings.fontFamily) {
      case 'amiri':
        return { fontFamily: 'var(--font-amiri)' };
      case 'tajawal':
        return { fontFamily: 'var(--font-tajawal)' };
      case 'sans':
        return { fontFamily: 'var(--font-sans)' };
      case 'serif':
        return { fontFamily: 'var(--font-serif)' };
      case 'cairo':
      default:
        return { fontFamily: 'var(--font-cairo)' };
    }
  };

  const isRtlLang = (lang: string) => lang === 'ar';

  // Get active chunk when playing audio
  const activeChunk = currentPageData.chunks[currentChunkIndex] || currentPageData.chunks[0];
  const totalChunksOnPage = currentPageData.chunks.length;

  return (
    <div 
      ref={scrollContainerRef}
      className={`relative flex-1 overflow-y-auto pb-36 pt-3 sm:pt-4 transition-colors duration-300 ${themeStyle.wrapper}`}
      id="main-reader-scroll-container"
    >
      <div className="mx-auto max-w-4xl px-3 sm:px-6 lg:px-8">
        
        {/* Floating Top Controls Header */}
        <div className={`sticky top-0 z-20 mb-4 sm:mb-6 flex items-center justify-between rounded-2xl border p-2 sm:p-3 backdrop-blur-xl transition-all shadow-md ${themeStyle.controls}`}>
          
          {/* Page Switcher */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={onPrevPage}
              disabled={currentPageNumber <= 1}
              className={`rounded-lg p-1.5 transition disabled:opacity-30 disabled:cursor-not-allowed ${themeStyle.buttonSecondary}`}
              title="الصفحة السابقة"
              id="prev-page-btn"
            >
              <ChevronRight className="h-5 w-5 rtl:rotate-0 ltr:rotate-180" />
            </button>

            <span className="text-xs sm:text-sm font-bold tracking-tight px-1 sm:px-2">
              {t.page} <span className="text-indigo-500 font-extrabold">{currentPageNumber}</span> {t.of} {book.totalPages}
            </span>

            <button
              onClick={onNextPage}
              disabled={currentPageNumber >= book.totalPages}
              className={`rounded-lg p-1.5 transition disabled:opacity-30 disabled:cursor-not-allowed ${themeStyle.buttonSecondary}`}
              title="الصفحة التالية"
              id="next-page-btn"
            >
              <ChevronLeft className="h-5 w-5 rtl:rotate-0 ltr:rotate-180" />
            </button>
          </div>

          {/* Quick Font Size & Bookmark Action */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={onDecreaseFontSize}
              className={`rounded-lg p-1.5 transition ${themeStyle.buttonSecondary}`}
              title={t.decreaseFont}
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className={`text-xs font-semibold min-w-[28px] text-center ${themeStyle.textMuted}`}>
              {settings.fontSize}px
            </span>
            <button
              onClick={onIncreaseFontSize}
              className={`rounded-lg p-1.5 transition ${themeStyle.buttonSecondary}`}
              title={t.increaseFont}
            >
              <ZoomIn className="h-4 w-4" />
            </button>

            <div className={`h-4 w-px mx-0.5 sm:mx-1 ${themeStyle.borderColor}`} />

            <button
              onClick={onToggleBookmark}
              className={`rounded-lg p-1.5 transition focus-ring ${
                isBookmarked
                  ? 'text-amber-500 bg-amber-500/10 border border-amber-500/20'
                  : themeStyle.buttonSecondary
              }`}
              title={isBookmarked ? t.bookmarked : t.bookmarkPage}
              id="bookmark-toggle-btn"
            >
              {isBookmarked ? (
                <BookmarkCheck className="h-4 w-4 fill-amber-500 text-amber-500" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
            </button>
          </div>

        </div>

        {/* Reading Content Canvas */}
        <div 
          className={`rounded-2xl sm:rounded-3xl border p-5 sm:p-8 lg:p-10 shadow-xl backdrop-blur-sm transition-all duration-300 ${themeStyle.canvas}`}
          style={{
            ...getFontFamilyStyle(),
            fontSize: `${settings.fontSize}px`,
            lineHeight: settings.lineHeight,
          }}
          id="reader-text-canvas"
        >
          {/* Full Page Text Canvas */}
          <div className="text-start leading-relaxed sm:leading-loose select-text font-normal">
            <div className="w-full">
              {currentPageData.chunks.map((chunk, index) => {
                const isActive = isPlaying && index === currentChunkIndex;
                const isChunkRtl = isRtlLang(chunk.language);

                return (
                  <span
                    key={chunk.id}
                    ref={isActive ? activeChunkRef : null}
                    onClick={() => onSelectChunk(index)}
                    dir={isChunkRtl ? 'rtl' : 'ltr'}
                    className={`inline cursor-pointer transition-all duration-200 ${
                      isActive
                        ? `${themeStyle.activeChunk}`
                        : `${themeStyle.inactiveChunk}`
                    }`}
                    id={`chunk-${chunk.id}`}
                    title={uiLang === 'ar' ? 'انقر للاستماع للصفحة' : 'Click to listen to page'}
                  >
                    {isActive && settings.highlightMode === 'word' && activeWordRange ? (
                      <HighlightedChunkText
                        chunkText={chunk.text}
                        activeRange={activeWordRange}
                        wordHighlightClass={themeStyle.wordHighlight}
                      />
                    ) : (
                      <span>{chunk.text}</span>
                    )}
                    {' '}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Page Footer navigation buttons inside canvas */}
          <div className={`mt-8 sm:mt-10 flex items-center justify-between border-t pt-4 text-xs ${themeStyle.borderColor} ${themeStyle.textMuted}`}>
            <button
              onClick={onPrevPage}
              disabled={currentPageNumber <= 1}
              className="flex items-center gap-1.5 font-semibold hover:text-indigo-500 disabled:opacity-25 disabled:hover:text-inherit transition"
            >
              <ChevronRight className="h-4 w-4 rtl:rotate-0 ltr:rotate-180" />
              <span>{uiLang === 'ar' ? 'الصفحة السابقة' : 'Previous Page'}</span>
            </button>

            <span className="text-[11px] font-medium">
              {currentPageData.wordCount} {t.wordsCount}
            </span>

            <button
              onClick={onNextPage}
              disabled={currentPageNumber >= book.totalPages}
              className="flex items-center gap-1.5 font-semibold hover:text-indigo-500 disabled:opacity-25 disabled:hover:text-inherit transition"
            >
              <span>{uiLang === 'ar' ? 'الصفحة التالية' : 'Next Page'}</span>
              <ChevronLeft className="h-4 w-4 rtl:rotate-0 ltr:rotate-180" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

/**
 * Word-level highlighting renderer component
 */
interface HighlightedChunkTextProps {
  chunkText: string;
  activeRange: { start: number; end: number };
  wordHighlightClass: string;
}

const HighlightedChunkText: React.FC<HighlightedChunkTextProps> = ({
  chunkText,
  activeRange,
  wordHighlightClass,
}) => {
  const { start, end } = activeRange;
  const before = chunkText.substring(0, start);
  const highlighted = chunkText.substring(start, end);
  const after = chunkText.substring(end);

  return (
    <span className="select-text leading-relaxed">
      <span>{before}</span>
      <span className={`inline-block rounded px-1 transition-all ${wordHighlightClass}`}>
        {highlighted}
      </span>
      <span>{after}</span>
    </span>
  );
};
