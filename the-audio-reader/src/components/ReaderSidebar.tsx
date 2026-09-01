import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Search, 
  Bookmark as BookmarkIcon, 
  ListOrdered, 
  Sparkles, 
  Layers, 
  Clock, 
  X, 
  CheckCircle2, 
  Trash2,
  FileScan,
  FilePlus2
} from 'lucide-react';
import { BookDocument, Bookmark, UILanguage, ThemeMode } from '../types';
import { getTranslation } from '../translations';
import { calculateEstimatedTime } from '../utils/textProcessor';
import { getThemeConfig } from '../utils/theme';

interface ReaderSidebarProps {
  uiLang: UILanguage;
  book: BookDocument;
  currentPage: number;
  currentChunkIndex: number;
  bookmarks: Bookmark[];
  currentTheme?: ThemeMode;
  onSelectPage: (pageNumber: number) => void;
  onSelectChunk: (pageNumber: number, chunkIndex: number) => void;
  onDeleteBookmark: (bookmarkId: string) => void;
  onOpenOCRModal: () => void;
  onOpenAddPageModal: () => void;
  onCloseMobileDrawer?: () => void;
}

type TabType = 'toc' | 'search' | 'bookmarks';

export const ReaderSidebar: React.FC<ReaderSidebarProps> = ({
  uiLang,
  book,
  currentPage,
  currentChunkIndex,
  bookmarks,
  currentTheme = 'dark',
  onSelectPage,
  onSelectChunk,
  onDeleteBookmark,
  onOpenOCRModal,
  onOpenAddPageModal,
  onCloseMobileDrawer,
}) => {
  const t = getTranslation(uiLang);
  const themeConfig = getThemeConfig(currentTheme as ThemeMode);
  const [activeTab, setActiveTab] = useState<TabType>('toc');
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate stats
  const wordsRemaining = useMemo(() => {
    let remaining = 0;
    for (let p = currentPage - 1; p < book.pages.length; p++) {
      remaining += book.pages[p]?.wordCount || 0;
    }
    return remaining;
  }, [book, currentPage]);

  const estimatedTime = calculateEstimatedTime(wordsRemaining);
  const scannedPagesCount = useMemo(() => {
    return book.pages.filter(p => p.isScannedImage || p.wordCount < 4).length;
  }, [book]);

  // Search matches
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return [];
    const query = searchQuery.toLowerCase().trim();
    const results: { pageNumber: number; chunkIndex: number; text: string; matchPreview: string }[] = [];

    book.pages.forEach((page) => {
      page.chunks.forEach((chunk) => {
        const textLower = chunk.text.toLowerCase();
        const index = textLower.indexOf(query);
        if (index !== -1) {
          const start = Math.max(0, index - 35);
          const end = Math.min(chunk.text.length, index + query.length + 35);
          results.push({
            pageNumber: page.pageNumber,
            chunkIndex: chunk.chunkIndex,
            text: chunk.text,
            matchPreview: (start > 0 ? '...' : '') + chunk.text.substring(start, end) + (end < chunk.text.length ? '...' : ''),
          });
        }
      });
    });

    return results;
  }, [book, searchQuery]);

  return (
    <aside 
      className={`flex h-full w-full flex-col border-e backdrop-blur-xl ${themeConfig.sidebar}`}
      id="reader-sidebar"
    >
      {/* Sidebar Header & Book Metadata */}
      <div className={`border-b p-4 ${themeConfig.borderColor}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-500 border border-indigo-500/20">
                {book.fileType}
              </span>
              <span className={`text-[11px] font-medium ${themeConfig.textMuted}`}>
                {book.detectedLanguage === 'ar' ? 'العربية' : book.detectedLanguage === 'en' ? 'English' : 'مختلط'}
              </span>
            </div>
            <h2 className={`text-sm font-bold mt-1.5 truncate font-cairo ${themeConfig.textPrimary}`} title={book.title}>
              {book.title}
            </h2>
          </div>

          {onCloseMobileDrawer && (
            <button
              onClick={onCloseMobileDrawer}
              className={`lg:hidden rounded-lg p-1.5 transition ${themeConfig.buttonSecondary}`}
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Progress & Stat pill */}
        <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-950/60 p-2.5 border border-slate-800/60 text-xs">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Clock className="h-3.5 w-3.5 text-indigo-400" />
            <span>{estimatedTime.formatted}</span>
          </div>
          <div className="flex items-center gap-1 font-semibold text-indigo-400">
            <span>{book.progressPercentage || 0}%</span>
            <span className="text-slate-500 font-normal">{t.readingProgress}</span>
          </div>
        </div>

        {/* OCR Button Prompt if scanned pages exist */}
        {scannedPagesCount > 0 && (
          <button
            onClick={onOpenOCRModal}
            className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition"
            id="ocr-launch-sidebar-btn"
          >
            <FileScan className="h-3.5 w-3.5" />
            <span>{t.runOcrForBook} ({scannedPagesCount})</span>
          </button>
        )}
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-850 px-3 pt-2">
        <button
          onClick={() => setActiveTab('toc')}
          className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-semibold border-b-2 transition ${
            activeTab === 'toc'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
          id="tab-toc"
        >
          <ListOrdered className="h-3.5 w-3.5" />
          <span>{t.pages} ({book.totalPages})</span>
        </button>

        <button
          onClick={() => setActiveTab('search')}
          className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-semibold border-b-2 transition ${
            activeTab === 'search'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
          id="tab-search"
        >
          <Search className="h-3.5 w-3.5" />
          <span>{t.searchInBook}</span>
        </button>

        <button
          onClick={() => setActiveTab('bookmarks')}
          className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-semibold border-b-2 transition ${
            activeTab === 'bookmarks'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
          id="tab-bookmarks"
        >
          <BookmarkIcon className="h-3.5 w-3.5" />
          <span>{t.bookmarks} ({bookmarks.length})</span>
        </button>
      </div>

      {/* Tab Content Panes */}
      <div className="flex-1 overflow-y-auto p-3">
        
        {/* Table of Contents / Pages List */}
        {activeTab === 'toc' && (
          <div className="space-y-1.5">
            {book.pages.map((page) => {
              const isCurrent = page.pageNumber === currentPage;
              const isPassed = page.pageNumber < currentPage;

              return (
                <button
                  key={page.pageNumber}
                  onClick={() => {
                    onSelectPage(page.pageNumber);
                    onCloseMobileDrawer?.();
                  }}
                  className={`flex w-full items-center justify-between rounded-xl p-2.5 text-start text-xs transition ${
                    isCurrent
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 font-bold'
                      : isPassed
                      ? 'text-slate-300 hover:bg-slate-850/80'
                      : 'text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                  }`}
                  id={`page-item-${page.pageNumber}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold ${
                      isCurrent ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {page.pageNumber}
                    </span>
                    <span className="truncate">
                      {page.title || `${t.page} ${page.pageNumber}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-slate-500">
                      {page.wordCount} {t.wordsCount}
                    </span>
                    {isPassed && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500/80" />
                    )}
                  </div>
                </button>
              );
            })}
            
            {/* Add Page Button */}
            <button
              onClick={() => {
                onOpenAddPageModal();
                onCloseMobileDrawer?.();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700 p-2.5 text-xs text-slate-400 transition hover:border-indigo-500/50 hover:bg-indigo-500/5 hover:text-indigo-300"
              id="add-page-btn"
            >
              <FilePlus2 className="h-3.5 w-3.5" />
              <span>{uiLang === 'ar' ? 'إضافة صفحة جديدة' : 'Add New Page'}</span>
            </button>
          </div>
        )}

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute start-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 py-2 ps-9 pe-3 text-xs text-white placeholder:text-slate-500 focus-ring"
                id="search-input-sidebar"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute end-3 top-2.5 text-slate-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {searchQuery.trim().length >= 2 ? (
              searchResults.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold text-slate-400">
                    {searchResults.length} {uiLang === 'ar' ? 'نتيجة مطابقة' : 'matches found'}
                  </p>
                  {searchResults.map((res, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        onSelectChunk(res.pageNumber, res.chunkIndex);
                        onCloseMobileDrawer?.();
                      }}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950/50 p-2.5 text-start transition hover:border-indigo-500/40 hover:bg-slate-850"
                    >
                      <div className="flex items-center justify-between text-[10px] text-indigo-400 font-semibold mb-1">
                        <span>{t.page} {res.pageNumber}</span>
                        <span>#{res.chunkIndex + 1}</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                        {res.matchPreview}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-xs text-slate-500">
                  {t.noSearchResults}
                </p>
              )
            ) : (
              <p className="py-8 text-center text-xs text-slate-500">
                {uiLang === 'ar' ? 'أدخل حرفين أو أكثر للبحث في الكتاب' : 'Type 2 or more letters to search'}
              </p>
            )}
          </div>
        )}

        {/* Bookmarks Tab */}
        {activeTab === 'bookmarks' && (
          <div className="space-y-2">
            {bookmarks.length > 0 ? (
              bookmarks.map((bm) => (
                <div
                  key={bm.id}
                  className="group flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950/50 p-2.5 transition hover:border-slate-700 hover:bg-slate-850"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-indigo-400">
                      {t.page} {bm.pageNumber}
                    </span>
                    <button
                      onClick={() => onDeleteBookmark(bm.id)}
                      className="rounded p-1 text-slate-500 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400 transition"
                      title={t.deleteBook}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                  <p 
                    onClick={() => {
                      onSelectChunk(bm.pageNumber, bm.chunkIndex);
                      onCloseMobileDrawer?.();
                    }}
                    className="cursor-pointer text-xs text-slate-300 line-clamp-2 leading-relaxed hover:text-indigo-300"
                  >
                    {bm.snippet}
                  </p>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-xs text-slate-500 leading-relaxed px-4">
                {t.noBookmarksYet}
              </p>
            )}
          </div>
        )}

      </div>
    </aside>
  );
};
