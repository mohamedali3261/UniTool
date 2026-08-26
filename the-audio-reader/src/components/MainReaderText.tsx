import React, { useEffect, useRef, useState } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Bookmark, 
  BookmarkCheck, 
  ZoomIn, 
  ZoomOut, 
  FileScan,
  Edit,
  Save,
  X,
  FileDown,
  Search,
  RefreshCw,
  Heart,
  HelpCircle,
  Languages,
  Copy,
  Check,
  Globe,
  Volume2,
  VolumeX
} from 'lucide-react';
import { BookDocument, BookPage, ReaderSettings, UILanguage } from '../types';
import { getTranslation } from '../translations';
import { getThemeConfig } from '../utils/theme';
import { exportBook } from '../utils/exportUtils';
import { translateText } from '../utils/translationService';

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
  onUpdatePageText: (pageNumber: number, newRawText: string) => void;
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
  onUpdatePageText,
}) => {
  const t = getTranslation(uiLang);
  const activeChunkRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');

  // Find & Replace state
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');

  // Export dropdown state
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Translation state
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isSpeakingTranslation, setIsSpeakingTranslation] = useState(false);

  // Load active page text when it changes or when we enter edit mode
  useEffect(() => {
    setEditedText(currentPageData.rawText);
  }, [currentPageData.rawText, isEditing]);

  // Close menus, cancel active translation speech, and clear translation on page change
  useEffect(() => {
    setIsEditing(false);
    setShowFindReplace(false);
    setShowExportMenu(false);
    setTranslatedText(null);
    setTranslationError(null);
    setIsTranslating(false);
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeakingTranslation(false);
  }, [currentPageNumber]);

  // Cancel synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleSpeakTranslation = () => {
    if (isSpeakingTranslation) {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsSpeakingTranslation(false);
      return;
    }

    if (!translatedText) return;

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(translatedText);
      const isAr = /[\u0600-\u06FF]/.test(translatedText);
      utterance.lang = isAr ? 'ar-SA' : 'en-US';
      
      const voices = window.speechSynthesis.getVoices();
      const matchedVoice = voices.find((v) => {
        const l = v.lang.toLowerCase();
        return isAr ? (l.startsWith('ar') || v.name.toLowerCase().includes('arabic')) : (l.startsWith('en'));
      });
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.onend = () => {
        setIsSpeakingTranslation(false);
      };
      utterance.onerror = () => {
        setIsSpeakingTranslation(false);
      };

      setIsSpeakingTranslation(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleTranslatePage = async () => {
    if (isTranslating) return;
    setIsTranslating(true);
    setTranslationError(null);
    try {
      // Intelligently check if the current page has Arabic characters
      const hasArabic = /[\u0600-\u06FF]/.test(currentPageData.rawText);
      const targetLang = hasArabic ? 'en' : 'ar';
      
      const res = await translateText(currentPageData.rawText, targetLang);
      setTranslatedText(res);
    } catch (err: any) {
      setTranslationError(uiLang === 'ar' ? 'فشلت عملية الترجمة. يرجى التحقق من اتصالك بالإنترنت.' : 'Translation failed. Please check your internet connection.');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleCopyTranslation = () => {
    if (!translatedText) return;
    navigator.clipboard.writeText(translatedText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

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

  const handleSaveChanges = () => {
    onUpdatePageText(currentPageNumber, editedText);
    setIsEditing(false);
  };

  const handleFindReplace = () => {
    if (!findQuery) return;
    const regex = new RegExp(findQuery, 'g');
    const newText = editedText.replace(regex, replaceQuery);
    setEditedText(newText);
    // Realtime update or status
  };

  return (
    <div 
      ref={scrollContainerRef}
      className={`relative flex-1 overflow-y-auto pb-36 pt-3 sm:pt-4 transition-colors duration-300 ${themeStyle.wrapper}`}
      id="main-reader-scroll-container"
    >
      <div className="mx-auto max-w-4xl px-3 sm:px-6 lg:px-8">
        
        {/* Floating Top Controls Header */}
        <div className={`sticky top-0 z-20 mb-4 sm:mb-6 flex flex-col gap-2 rounded-2xl border p-2 sm:p-3 backdrop-blur-xl transition-all shadow-md ${themeStyle.controls}`}>
          <div className="flex items-center justify-between w-full">
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

            {/* Quick Font Size, Edit, Export & Bookmark Action */}
            <div className="flex items-center gap-1 sm:gap-1.5">
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

              {/* Edit Mode Toggle Button */}
              <button
                onClick={() => {
                  setIsEditing(!isEditing);
                  if (!isEditing) setShowFindReplace(false);
                }}
                className={`rounded-lg p-1.5 transition focus-ring ${
                  isEditing 
                    ? 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/20' 
                    : themeStyle.buttonSecondary
                }`}
                title={uiLang === 'ar' ? 'تعديل نصوص الصفحة' : 'Edit Page Text'}
                id="edit-page-toggle-btn"
              >
                <Edit className="h-4 w-4" />
              </button>

              {/* Export Book Options Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className={`rounded-lg p-1.5 transition focus-ring ${
                    showExportMenu 
                      ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' 
                      : themeStyle.buttonSecondary
                  }`}
                  title={uiLang === 'ar' ? 'تصدير الكتاب بعدة صيغ' : 'Export Book Formats'}
                  id="export-book-btn"
                >
                  <FileDown className="h-4 w-4" />
                </button>

                {showExportMenu && (
                  <div className="absolute top-full mt-2 ltr:right-0 ltr:left-auto rtl:left-0 rtl:right-auto w-52 rounded-xl border border-slate-800 bg-slate-900/95 p-2 shadow-2xl backdrop-blur-xl z-50 space-y-1">
                    <div className="px-2 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800/60 mb-1">
                      {uiLang === 'ar' ? 'صيغة التصدير المتاحة' : 'Export Format'}
                    </div>
                    {[
                      { key: 'html', label: uiLang === 'ar' ? '📄 قارئ ويب تفاعلي (HTML)' : 'HTML Interactive Web', color: 'hover:bg-indigo-500/10 hover:text-indigo-400' },
                      { key: 'txt', label: uiLang === 'ar' ? '📝 نص بسيط (TXT)' : 'Plain Text (TXT)', color: 'hover:bg-blue-500/10 hover:text-blue-400' },
                      { key: 'md', label: uiLang === 'ar' ? '📐 مستند مارك داون (MD)' : 'Markdown Document (MD)', color: 'hover:bg-emerald-500/10 hover:text-emerald-400' },
                      { key: 'json', label: uiLang === 'ar' ? '⚙️ نسخة هيكلية (JSON)' : 'Structured JSON (JSON)', color: 'hover:bg-amber-500/10 hover:text-amber-400' },
                    ].map((fmt) => (
                      <button
                        key={fmt.key}
                        onClick={() => {
                          exportBook(book, fmt.key as any);
                          setShowExportMenu(false);
                        }}
                        className={`w-full text-start text-xs rounded-lg px-2.5 py-2 font-medium text-slate-300 transition-all ${fmt.color}`}
                      >
                        {fmt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Translate Page Button */}
              <button
                onClick={handleTranslatePage}
                disabled={isTranslating}
                className={`rounded-lg p-1.5 transition focus-ring flex items-center justify-center ${
                  isTranslating 
                    ? 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/20' 
                    : themeStyle.buttonSecondary
                }`}
                title={uiLang === 'ar' ? 'ترجمة الصفحة الحالية فوراً' : 'Translate active page instantly'}
                id="translate-page-btn"
              >
                <Languages className={`h-4 w-4 ${isTranslating ? 'animate-spin' : ''}`} />
              </button>

              {/* Bookmark Toggle */}
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

          {/* Find & Replace Tools - Only visible in Edit Mode */}
          {isEditing && (
            <div className="w-full border-t border-slate-800/50 pt-2 sm:pt-2.5 flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                  <Search className="w-3.5 h-3.5 text-indigo-400" />
                  {uiLang === 'ar' ? 'أداة البحث والاستبدال السريع' : 'Fast Find & Replace'}
                </span>
                <button 
                  onClick={() => setShowFindReplace(!showFindReplace)}
                  className="text-[10px] font-semibold text-indigo-400 hover:underline"
                >
                  {showFindReplace ? (uiLang === 'ar' ? 'إخفاء الأداة' : 'Hide Tool') : (uiLang === 'ar' ? 'إظهار الأداة' : 'Show Tool')}
                </button>
              </div>

              {showFindReplace && (
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 p-1">
                  <input
                    type="text"
                    placeholder={uiLang === 'ar' ? 'البحث عن كلمة...' : 'Find text...'}
                    value={findQuery}
                    onChange={(e) => setFindQuery(e.target.value)}
                    className="sm:col-span-5 bg-slate-950/60 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <input
                    type="text"
                    placeholder={uiLang === 'ar' ? 'استبدال بـ...' : 'Replace with...'}
                    value={replaceQuery}
                    onChange={(e) => setReplaceQuery(e.target.value)}
                    className="sm:col-span-5 bg-slate-950/60 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={handleFindReplace}
                    className="sm:col-span-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg py-1.5 text-xs flex items-center justify-center gap-1 transition"
                  >
                    <RefreshCw className="w-3 h-3 animate-spin-slow" />
                    <span>{uiLang === 'ar' ? 'تطبيق' : 'Apply'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
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
          {isEditing ? (
            /* Editing Block View */
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-semibold text-indigo-400 bg-indigo-500/5 px-3.5 py-2 rounded-xl border border-indigo-500/10">
                <span>⚠️ {uiLang === 'ar' ? 'أنت الآن في وضع التعديل المباشر للمستند' : 'You are currently in live text edit mode'}</span>
                <span>{editedText.length} {uiLang === 'ar' ? 'حرف' : 'chars'}</span>
              </div>

              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                rows={12}
                className="w-full p-4 rounded-xl border border-slate-800 bg-slate-950/50 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 text-base leading-relaxed resize-y transition"
                dir="auto"
                style={getFontFamilyStyle()}
                title={uiLang === 'ar' ? 'حقل تعديل النص' : 'Editable text area'}
              />

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-xs font-bold rounded-lg text-slate-300 hover:bg-slate-800/60 border border-slate-800 transition flex items-center gap-1.5"
                >
                  <X className="w-4 h-4" />
                  <span>{uiLang === 'ar' ? 'إلغاء' : 'Cancel'}</span>
                </button>
                <button
                  onClick={handleSaveChanges}
                  className="px-4 py-2 text-xs font-extrabold rounded-lg text-white bg-emerald-600 hover:bg-emerald-500 transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/10 border border-emerald-500/30"
                >
                  <Save className="w-4 h-4 animate-pulse" />
                  <span>{uiLang === 'ar' ? 'حفظ التغييرات ومزامنة الصوت' : 'Save & Sync Audio'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Standard Chunk/Highlight Reading Canvas */
            <div className="text-start leading-relaxed sm:leading-loose select-text font-normal">
              <div className="w-full">
                {currentPageData.chunks.map((chunk, index) => {
                  const isActive = isPlaying && index === currentChunkIndex;
                  const isChunkRtl = isRtlLang(chunk.language);

                  const getHighlightClass = () => {
                    if (!isActive) return themeStyle.inactiveChunk;
                    
                    const isSepia = settings.theme === 'sepia';
                    const isLight = settings.theme === 'light'; // Light is Deep Emerald
                    
                    if (settings.highlightMode === 'sentence') {
                      if (isSepia) return `${themeStyle.activeChunk} bg-amber-500/15 border-r-2 border-l-2 border-amber-500 px-2 py-0.5 rounded shadow-sm text-white font-semibold`;
                      if (isLight) return `${themeStyle.activeChunk} bg-emerald-500/15 border-r-2 border-l-2 border-emerald-400 px-2 py-0.5 rounded shadow-sm text-white font-semibold`;
                      return `${themeStyle.activeChunk} bg-indigo-500/15 border-r-2 border-l-2 border-indigo-500 px-2 py-0.5 rounded shadow-sm text-white font-semibold`;
                    }
                    
                    if (settings.highlightMode === 'paragraph') {
                      if (isSepia) return `${themeStyle.activeChunk} bg-[#362e28]/60 px-3 py-2 rounded-xl border border-[#4d4036] block my-1.5 font-medium text-white`;
                      if (isLight) return `${themeStyle.activeChunk} bg-[#0b3d30]/60 px-3 py-2 rounded-xl border border-[#0f4d3d] block my-1.5 font-medium text-white`;
                      return `${themeStyle.activeChunk} bg-slate-800/50 px-3 py-2 rounded-xl border border-slate-700/60 block my-1.5 font-medium text-white`;
                    }
                    
                    if (settings.highlightMode === 'glow') {
                      if (isSepia) {
                        return `${themeStyle.activeChunk} bg-gradient-to-r from-amber-500/20 via-orange-500/10 to-amber-500/15 px-2.5 py-1 rounded-xl shadow-lg ring-1 ring-amber-500/30 animate-pulse font-bold text-amber-200`;
                      }
                      if (isLight) {
                        return `${themeStyle.activeChunk} bg-gradient-to-r from-emerald-500/20 via-teal-500/10 to-emerald-500/15 px-2.5 py-1 rounded-xl shadow-lg ring-1 ring-emerald-400/30 animate-pulse font-bold text-emerald-200`;
                      }
                      return `${themeStyle.activeChunk} bg-gradient-to-r from-indigo-500/20 via-purple-500/15 to-pink-500/10 px-2.5 py-1 rounded-xl shadow-lg ring-1 ring-indigo-500/30 animate-pulse font-semibold text-white`;
                    }
                    
                    if (settings.highlightMode === 'underline') {
                      if (isSepia) return `${themeStyle.activeChunk} border-b-2 border-dashed border-amber-500 bg-amber-500/5 px-1.5 py-0.5 rounded font-bold text-amber-300`;
                      if (isLight) return `${themeStyle.activeChunk} border-b-2 border-dashed border-emerald-400 bg-emerald-500/5 px-1.5 py-0.5 rounded font-bold text-emerald-300`;
                      return `${themeStyle.activeChunk} border-b-2 border-dashed border-indigo-400 bg-indigo-500/5 px-1.5 py-0.5 rounded font-bold text-indigo-300`;
                    }
                    
                    return themeStyle.activeChunk;
                  };

                  return (
                    <span
                      key={chunk.id}
                      ref={isActive ? activeChunkRef : null}
                      onClick={() => onSelectChunk(index)}
                      dir={isChunkRtl ? 'rtl' : 'ltr'}
                      className={`inline cursor-pointer transition-all duration-200 ${getHighlightClass()}`}
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
          )}

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

        {/* Translation Output Card */}
        {isTranslating && (
          <div className={`mt-6 rounded-2xl border p-5 sm:p-6 shadow-md backdrop-blur-sm animate-pulse ${themeStyle.canvas}`}>
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 animate-spin text-indigo-500" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3.5 bg-slate-800 rounded w-1/4"></div>
                <div className="h-3 bg-slate-800 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        )}

        {translationError && (
          <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-xs text-red-400">
            {translationError}
          </div>
        )}

        {translatedText && !isTranslating && (
          <div 
            className={`mt-6 rounded-2xl border p-6 sm:p-8 shadow-lg backdrop-blur-sm transition-all duration-300 relative ${themeStyle.canvas}`}
            style={{
              ...getFontFamilyStyle(),
              fontSize: `${Math.max(14, settings.fontSize - 1)}px`,
              lineHeight: settings.lineHeight,
            }}
          >
            {/* Translation Header */}
            <div className="flex items-center justify-between border-b pb-3 mb-4 border-slate-800/30">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-400" />
                <span className="text-xs sm:text-sm font-bold text-indigo-400">
                  {uiLang === 'ar' ? 'الترجمة الفورية للصفحة' : 'Instant Page Translation'}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSpeakTranslation}
                  className={`rounded-lg p-1.5 transition flex items-center gap-1.5 text-xs font-semibold ${
                    isSpeakingTranslation 
                      ? 'text-teal-400 bg-teal-500/10 border border-teal-500/20' 
                      : themeStyle.buttonSecondary
                  }`}
                  title={uiLang === 'ar' ? 'استماع للترجمة' : 'Listen to translation'}
                >
                  {isSpeakingTranslation ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
                      <span className="text-teal-400">{uiLang === 'ar' ? 'إيقاف الاستماع' : 'Stop Listening'}</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{uiLang === 'ar' ? 'استماع' : 'Listen'}</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleCopyTranslation}
                  className={`rounded-lg p-1.5 transition flex items-center gap-1.5 text-xs font-semibold ${themeStyle.buttonSecondary}`}
                  title={uiLang === 'ar' ? 'نسخ الترجمة' : 'Copy translation'}
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-500">{uiLang === 'ar' ? 'تم النسخ!' : 'Copied!'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{uiLang === 'ar' ? 'نسخ' : 'Copy'}</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => setTranslatedText(null)}
                  className={`rounded-lg p-1.5 transition ${themeStyle.buttonSecondary}`}
                  title={uiLang === 'ar' ? 'إغلاق الترجمة' : 'Close translation'}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Translated Content */}
            <div 
              dir={/[\u0600-\u06FF]/.test(translatedText) ? 'rtl' : 'ltr'}
              className="text-start leading-relaxed whitespace-pre-wrap select-text text-slate-300 font-normal"
            >
              {translatedText}
            </div>
          </div>
        )}



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
