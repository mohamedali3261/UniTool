import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  BookDocument, 
  BookPage,
  BookChunk, 
  Bookmark, 
  DeviceVoice, 
  OCRJobState, 
  PlaybackState, 
  ReaderSettings, 
  UILanguage 
} from './types';
import { Navbar } from './components/Navbar';
import { FileUploader } from './components/FileUploader';
import { ReaderSidebar } from './components/ReaderSidebar';
import { MainReaderText } from './components/MainReaderText';
import { AudioPlayer } from './components/AudioPlayer';
import { VoiceSelectorModal } from './components/VoiceSelectorModal';
import { ReadingSettingsModal } from './components/ReadingSettingsModal';
import { OCRModal } from './components/OCRModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { AddPageModal } from './components/AddPageModal';
import { CreateBookModal } from './components/CreateBookModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { parseUploadedFile } from './utils/bookParser';
import { processTextIntoChunks } from './utils/textProcessor';
import { speechEngine } from './utils/speechEngine';
import { ocrProcessor } from './utils/ocrProcessor';
import { 
  loadSettings, 
  saveSettings, 
  loadRecentBooks, 
  saveRecentBooks, 
  loadBookmarks, 
  saveBookmarks, 
  saveBookProgress,
  DEFAULT_SETTINGS 
} from './utils/storage';
import { getTranslation } from './translations';
import { getThemeConfig } from './utils/theme';

export default function App() {
  // 1. Settings & UI Language
  const [settings, setSettings] = useState<ReaderSettings>(() => loadSettings());
  const [uiLang, setUiLang] = useState<UILanguage>(() => {
    const shared = localStorage.getItem('unitool-lang');
    if (shared === 'ar' || shared === 'en') return shared;
    return settings.uiLanguage || 'ar';
  });
  const t = getTranslation(uiLang);

  // 2. Active Book Document
  const [rawCurrentBook, setCurrentBook] = useState<BookDocument | null>(null);

  const currentBook = useMemo(() => {
    if (!rawCurrentBook) return null;
    const updatedPages = rawCurrentBook.pages.reduce((acc, p) => {
      // Skip empty text pages
      if (!p.isScannedImage && p.rawText.trim() === '') return acc;

      const fallbackLang = p.chunks[0]?.language || rawCurrentBook.detectedLanguage || 'ar';
      const chunks = processTextIntoChunks(p.rawText, p.pageNumber, fallbackLang, settings.readingMode);
      
      if (chunks.length === 0 && !p.isScannedImage) return acc;

      acc.push({ ...p, chunks });
      return acc;
    }, [] as typeof rawCurrentBook.pages);

    return { ...rawCurrentBook, pages: updatedPages };
  }, [rawCurrentBook, settings.readingMode]);

  const [recentBooks, setRecentBooks] = useState<BookDocument[]>(() => loadRecentBooks());
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [fileBufferCache, setFileBufferCache] = useState<ArrayBuffer | null>(null);

  // 3. File Parsing & OCR States
  const [isParsing, setIsParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState<{ current: number; total: number; message: string } | null>(null);
  const [ocrState, setOcrState] = useState<OCRJobState>({
    isActive: false,
    currentPage: 0,
    totalPages: 0,
    pageProgress: 0,
    overallProgress: 0,
    statusMessage: '',
    targetLang: 'ara+eng',
  });

  // 4. Voices State
  const [availableVoices, setAvailableVoices] = useState<DeviceVoice[]>([]);

  // 5. Playback State
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    status: 'idle',
    currentPage: 1,
    currentChunkIndex: 0,
    currentChunkId: null,
    currentWordIndex: 0,
    currentWordCharRange: null,
    totalChunksInBook: 0,
    globalChunkIndex: 0,
  });

  // 6. Modals & UI View States
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isOCRModalOpen, setIsOCRModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isAddPageModalOpen, setIsAddPageModalOpen] = useState(false);
  const [isCreateBookModalOpen, setIsCreateBookModalOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [sleepTimerLeft, setSleepTimerLeft] = useState<number | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Refs for current mutable state in speech callbacks
  const playbackStateRef = useRef(playbackState);
  playbackStateRef.current = playbackState;
  const currentBookRef = useRef(currentBook);
  currentBookRef.current = currentBook;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const playChunkRef = useRef<((pageNumber: number, chunkIndex: number) => void) | null>(null);

  // Toast helper
  const showToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync document direction and HTML lang with UI Language
  useEffect(() => {
    document.documentElement.lang = uiLang;
    document.documentElement.dir = uiLang === 'ar' ? 'rtl' : 'ltr';
  }, [uiLang]);

  // Load available system TTS voices on startup
  useEffect(() => {
    const fetchVoices = async () => {
      const voices = await speechEngine.getAvailableVoices();
      setAvailableVoices(voices);
    };
    fetchVoices();
  }, []);

  // Save settings whenever they change
  const handleUpdateSettings = useCallback((newSettings: Partial<ReaderSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      saveSettings(updated);

      // Automatically apply speed, volume, pitch, or voice changes immediately during active playback
      if (
        playbackStateRef.current.status === 'playing' && 
        ('speechRate' in newSettings || 'volume' in newSettings || 'pitch' in newSettings || 'selectedArabicVoiceURI' in newSettings || 'selectedEnglishVoiceURI' in newSettings)
      ) {
        setTimeout(() => {
          playChunkRef.current?.(playbackStateRef.current.currentPage, playbackStateRef.current.currentChunkIndex);
        }, 30);
      }

      return updated;
    });
  }, []);

  // Toggle Language
  const handleToggleLang = useCallback(() => {
    const nextLang: UILanguage = uiLang === 'ar' ? 'en' : 'ar';
    setUiLang(nextLang);
    localStorage.setItem('unitool-lang', nextLang);
    handleUpdateSettings({ uiLanguage: nextLang });
  }, [uiLang, handleUpdateSettings]);

  // Toggle Theme
  const handleToggleTheme = useCallback(() => {
    const order: ReaderSettings['theme'][] = ['dark', 'midnight', 'sepia', 'light'];
    const nextIndex = (order.indexOf(settings.theme) + 1) % order.length;
    handleUpdateSettings({ theme: order[nextIndex] });
  }, [settings.theme, handleUpdateSettings]);

  // Total Chunks across entire book calculation
  const allBookChunks = useMemo(() => {
    if (!currentBook) return [];
    const chunks: BookChunk[] = [];
    currentBook.pages.forEach((p) => {
      chunks.push(...p.chunks);
    });
    return chunks;
  }, [currentBook]);

  // Update total chunks count in playbackState
  useEffect(() => {
    setPlaybackState((prev) => ({
      ...prev,
      totalChunksInBook: allBookChunks.length,
    }));
  }, [allBookChunks]);

  // Load bookmarks when book changes
  useEffect(() => {
    if (currentBook) {
      setBookmarks(loadBookmarks(currentBook.id));
    }
  }, [currentBook]);

  // Active Chunk helper
  const getCurrentChunk = useCallback((): BookChunk | null => {
    if (!currentBook) return null;
    const page = currentBook.pages.find((p) => p.pageNumber === playbackState.currentPage);
    if (!page || !page.chunks || page.chunks.length === 0) return null;
    return page.chunks[playbackState.currentChunkIndex] || page.chunks[0] || null;
  }, [currentBook, playbackState.currentPage, playbackState.currentChunkIndex]);

  // Play a specific chunk
  const playChunk = useCallback((pageNumber: number, chunkIndex: number) => {
    const book = currentBookRef.current;
    if (!book) return;

    const page = book.pages.find((p) => p.pageNumber === pageNumber);
    if (!page || !page.chunks || page.chunks.length === 0) {
      // If page has no chunks, advance to next page if available
      if (pageNumber < book.totalPages) {
        playChunk(pageNumber + 1, 0);
      } else {
        // End of book!
        speechEngine.stop();
        setPlaybackState((prev) => ({ ...prev, status: 'ended' }));
        confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
        showToast(t.bookCompleted, 'success');
      }
      return;
    }

    const chunk = page.chunks[chunkIndex];
    if (!chunk) {
      // Chunk overflow, move to next page
      if (pageNumber < book.totalPages) {
        playChunk(pageNumber + 1, 0);
      } else {
        speechEngine.stop();
        setPlaybackState((prev) => ({ ...prev, status: 'ended' }));
        confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
        showToast(t.bookCompleted, 'success');
      }
      return;
    }

    // Calculate global chunk index
    let globalIndex = 0;
    for (let p = 0; p < book.pages.length; p++) {
      if (book.pages[p].pageNumber < pageNumber) {
        globalIndex += book.pages[p].chunks.length;
      } else if (book.pages[p].pageNumber === pageNumber) {
        globalIndex += chunkIndex;
        break;
      }
    }

    const totalWords = book.totalWords || 1;
    const progressPercent = Math.min(100, Math.round(((globalIndex + 1) / Math.max(1, allBookChunks.length)) * 100));

    setPlaybackState((prev) => ({
      ...prev,
      status: 'playing',
      currentPage: pageNumber,
      currentChunkIndex: chunkIndex,
      currentChunkId: chunk.id,
      globalChunkIndex: globalIndex,
      currentWordCharRange: null,
    }));

    // Save progress to storage
    saveBookProgress(book.id, pageNumber, chunkIndex, progressPercent);

    // Speak chunk via SpeechEngine
    speechEngine.speak(chunk, settingsRef.current, {
      onStart: () => {
        setPlaybackState((prev) => ({ ...prev, status: 'playing' }));
      },
      onEnd: () => {
        // Naturally advance to next chunk
        const nextChunkIdx = chunkIndex + 1;
        if (nextChunkIdx < page.chunks.length) {
          playChunk(pageNumber, nextChunkIdx);
        } else if (pageNumber < book.totalPages) {
          playChunk(pageNumber + 1, 0);
        } else {
          setPlaybackState((prev) => ({ ...prev, status: 'ended' }));
          confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
          showToast(t.bookCompleted, 'success');
        }
      },
      onError: (err) => {
        console.warn('Speech playback error:', err);
      },
      onWordBoundary: (charIndex, charLength) => {
        setPlaybackState((prev) => ({
          ...prev,
          currentWordCharRange: {
            start: charIndex,
            end: charIndex + charLength,
          },
        }));
      },
    });
  }, [allBookChunks, showToast, t.bookCompleted]);

  playChunkRef.current = playChunk;

  // Audio Player Controls
  const handlePlay = useCallback(() => {
    playChunk(playbackState.currentPage, playbackState.currentChunkIndex);
  }, [playChunk, playbackState.currentPage, playbackState.currentChunkIndex]);

  const handlePause = useCallback(() => {
    speechEngine.pause();
    setPlaybackState((prev) => ({ ...prev, status: 'paused' }));
  }, []);

  const handleResume = useCallback(() => {
    speechEngine.resume();
    setPlaybackState((prev) => ({ ...prev, status: 'playing' }));
  }, []);

  const handleStop = useCallback(() => {
    speechEngine.stop();
    setPlaybackState((prev) => ({ ...prev, status: 'idle', currentWordCharRange: null }));
  }, []);

  // Sleep Timer Countdown Effect
  useEffect(() => {
    if (sleepTimerLeft === null) return;
    if (playbackState.status !== 'playing') return;

    const interval = setInterval(() => {
      setSleepTimerLeft((prev) => {
        if (prev === null) {
          clearInterval(interval);
          return null;
        }
        if (prev <= 1) {
          clearInterval(interval);
          handlePause();
          showToast(
            uiLang === 'ar' 
              ? '⏰ تم إيقاف القراءة تلقائياً لتفعيل مؤقت النوم.' 
              : '⏰ Reading paused automatically by sleep timer.',
            'info'
          );
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sleepTimerLeft, playbackState.status, handlePause, showToast, uiLang]);

  const handleNextChunk = useCallback(() => {
    if (!currentBook) return;
    const page = currentBook.pages.find((p) => p.pageNumber === playbackState.currentPage);
    if (!page) return;

    if (playbackState.currentChunkIndex + 1 < page.chunks.length) {
      playChunk(playbackState.currentPage, playbackState.currentChunkIndex + 1);
    } else if (playbackState.currentPage < currentBook.totalPages) {
      playChunk(playbackState.currentPage + 1, 0);
    }
  }, [currentBook, playbackState.currentPage, playbackState.currentChunkIndex, playChunk]);

  const handlePrevChunk = useCallback(() => {
    if (!currentBook) return;

    if (playbackState.currentChunkIndex > 0) {
      playChunk(playbackState.currentPage, playbackState.currentChunkIndex - 1);
    } else if (playbackState.currentPage > 1) {
      const prevPage = currentBook.pages.find((p) => p.pageNumber === playbackState.currentPage - 1);
      const prevChunkIndex = prevPage && prevPage.chunks.length > 0 ? prevPage.chunks.length - 1 : 0;
      playChunk(playbackState.currentPage - 1, prevChunkIndex);
    }
  }, [currentBook, playbackState.currentPage, playbackState.currentChunkIndex, playChunk]);

  const handleSeekChunk = useCallback((targetGlobalIndex: number) => {
    if (!currentBook) return;
    let accumulated = 0;
    for (const page of currentBook.pages) {
      if (accumulated + page.chunks.length > targetGlobalIndex) {
        const chunkIdx = targetGlobalIndex - accumulated;
        playChunk(page.pageNumber, chunkIdx);
        return;
      }
      accumulated += page.chunks.length;
    }
  }, [currentBook, playChunk]);

  // Page selection navigation
  const handleSelectPage = useCallback((pageNumber: number) => {
    speechEngine.stop();
    setPlaybackState((prev) => ({
      ...prev,
      currentPage: pageNumber,
      currentChunkIndex: 0,
      status: 'idle',
      currentWordCharRange: null,
    }));
  }, []);

  // Chunk selection navigation
  const handleSelectChunk = useCallback((pageNumber: number, chunkIndex: number) => {
    playChunk(pageNumber, chunkIndex);
  }, [playChunk]);

  // Bookmark Toggle
  const handleToggleBookmark = useCallback(() => {
    if (!currentBook) return;
    const page = currentBook.pages.find((p) => p.pageNumber === playbackState.currentPage);
    const chunk = page?.chunks[playbackState.currentChunkIndex] || page?.chunks[0];
    const snippet = chunk?.text.substring(0, 80) || `الصفحة ${playbackState.currentPage}`;

    const existingIndex = bookmarks.findIndex(
      (bm) => bm.pageNumber === playbackState.currentPage && bm.chunkIndex === playbackState.currentChunkIndex
    );

    let updated: Bookmark[];
    if (existingIndex !== -1) {
      updated = bookmarks.filter((_, idx) => idx !== existingIndex);
      showToast(uiLang === 'ar' ? 'تمت إزالة الإشارة المرجعية' : 'Bookmark removed', 'info');
    } else {
      const newBm: Bookmark = {
        id: `bm-${Date.now()}`,
        bookId: currentBook.id,
        pageNumber: playbackState.currentPage,
        chunkIndex: playbackState.currentChunkIndex,
        snippet,
        createdAt: Date.now(),
      };
      updated = [newBm, ...bookmarks];
      showToast(t.bookmarked, 'success');
    }

    setBookmarks(updated);
    saveBookmarks(currentBook.id, updated);
  }, [currentBook, playbackState.currentPage, playbackState.currentChunkIndex, bookmarks, showToast, uiLang, t.bookmarked]);

  const handleDeleteBookmark = useCallback((bmId: string) => {
    if (!currentBook) return;
    const updated = bookmarks.filter((b) => b.id !== bmId);
    setBookmarks(updated);
    saveBookmarks(currentBook.id, updated);
  }, [currentBook, bookmarks]);

  // File Upload Handler
  const handleFileSelect = useCallback(async (file: File) => {
    setIsParsing(true);
    setParseProgress({ current: 0, total: 100, message: t.loadingDocument });

    try {
      const arrayBuffer = await file.arrayBuffer();
      setFileBufferCache(arrayBuffer);

      const parsedBook = await parseUploadedFile(file, (curr, tot, msg) => {
        setParseProgress({ current: curr, total: tot, message: msg });
      });

      setCurrentBook(parsedBook);
      speechEngine.stop();
      setPlaybackState({
        status: 'idle',
        currentPage: 1,
        currentChunkIndex: 0,
        currentChunkId: null,
        currentWordIndex: 0,
        currentWordCharRange: null,
        totalChunksInBook: 0,
        globalChunkIndex: 0,
      });

      // Update recent books
      const updatedRecents = [parsedBook, ...recentBooks.filter((b) => b.title !== parsedBook.title)];
      setRecentBooks(updatedRecents);
      saveRecentBooks(updatedRecents);

      showToast(uiLang === 'ar' ? 'تم تحميل المستند بنجاح!' : 'Document loaded successfully!', 'success');
    } catch (err: any) {
      console.error('Error parsing file:', err);
      showToast(t.errorLoading, 'error');
    } finally {
      setIsParsing(false);
      setParseProgress(null);
    }
  }, [recentBooks, showToast, t.loadingDocument, t.errorLoading, uiLang]);

  // Select Sample Book
  const handleSelectSampleBook = useCallback((sample: BookDocument) => {
    setCurrentBook(sample);
    speechEngine.stop();
    setPlaybackState({
      status: 'idle',
      currentPage: 1,
      currentChunkIndex: 0,
      currentChunkId: null,
      currentWordIndex: 0,
      currentWordCharRange: null,
      totalChunksInBook: 0,
      globalChunkIndex: 0,
    });
    showToast(uiLang === 'ar' ? 'تم فتح النموذج الجاهز للاستماع' : 'Sample loaded ready for listening', 'success');
  }, [showToast, uiLang]);

  // Select Recent Book
  const handleSelectRecentBook = useCallback((book: BookDocument) => {
    setCurrentBook(book);
    speechEngine.stop();
    setPlaybackState({
      status: 'idle',
      currentPage: book.lastReadPage || 1,
      currentChunkIndex: book.lastReadChunkIndex || 0,
      currentChunkId: null,
      currentWordIndex: 0,
      currentWordCharRange: null,
      totalChunksInBook: 0,
      globalChunkIndex: 0,
    });
    showToast(uiLang === 'ar' ? 'تمت استعادة موضع القراءة السابق' : 'Resumed previous reading spot', 'info');
  }, [showToast, uiLang]);

  const handleDeleteRecentBook = useCallback((bookId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentBooks.filter((b) => b.id !== bookId);
    setRecentBooks(updated);
    saveRecentBooks(updated);
  }, [recentBooks]);

  // Reset Book
  const handleResetBook = useCallback(() => {
    speechEngine.stop();
    setCurrentBook(null);
    setFileBufferCache(null);
    setPlaybackState({
      status: 'idle',
      currentPage: 1,
      currentChunkIndex: 0,
      currentChunkId: null,
      currentWordIndex: 0,
      currentWordCharRange: null,
      totalChunksInBook: 0,
      globalChunkIndex: 0,
    });
  }, []);

  // Update Page Text Handler
  const handleUpdatePageText = useCallback((pageNumber: number, newRawText: string) => {
    if (!rawCurrentBook) return;

    const updatedPages = rawCurrentBook.pages.map((p) => {
      if (p.pageNumber === pageNumber) {
        const words = newRawText.trim().split(/\s+/).filter(Boolean).length;
        return {
          ...p,
          rawText: newRawText,
          wordCount: words,
          isScannedImage: false,
        };
      }
      return p;
    });

    const totalWords = updatedPages.reduce((acc, p) => acc + p.wordCount, 0);

    const updatedBook: BookDocument = {
      ...rawCurrentBook,
      pages: updatedPages,
      totalWords,
    };

    setCurrentBook(updatedBook);

    const updatedRecents = recentBooks.map((b) => (b.id === updatedBook.id ? updatedBook : b));
    setRecentBooks(updatedRecents);
    saveRecentBooks(updatedRecents);

    speechEngine.stop();
    setPlaybackState((prev) => ({
      ...prev,
      status: 'idle',
      currentChunkIndex: 0,
      currentWordIndex: 0,
      currentWordCharRange: null,
    }));

    showToast(
      uiLang === 'ar' ? 'تم حفظ تعديلات الصفحة بنجاح وتحديث الصوتيات!' : 'Page edited successfully and audio updated!',
      'success'
    );
  }, [rawCurrentBook, recentBooks, showToast, uiLang]);

  // Add Page Handler
  const handleAddPage = useCallback((title: string, rawText: string) => {
    if (!rawCurrentBook) return;

    const words = rawText.trim().split(/\s+/).filter(Boolean).length;
    const newPageNumber = rawCurrentBook.pages.length + 1;

    const newPage = {
      pageNumber: newPageNumber,
      title,
      rawText,
      chunks: [],
      wordCount: words,
    };

    const updatedBook: BookDocument = {
      ...rawCurrentBook,
      pages: [...rawCurrentBook.pages, newPage],
      totalPages: newPageNumber,
      totalWords: rawCurrentBook.totalWords + words,
    };

    setCurrentBook(updatedBook);

    const updatedRecents = recentBooks.map((b) => (b.id === updatedBook.id ? updatedBook : b));
    setRecentBooks(updatedRecents);
    saveRecentBooks(updatedRecents);

    handleSelectPage(newPageNumber);

    showToast(
      uiLang === 'ar' ? `تم إضافة الصفحة ${newPageNumber} بنجاح!` : `Page ${newPageNumber} added successfully!`,
      'success'
    );
  }, [rawCurrentBook, recentBooks, showToast, uiLang, handleSelectPage]);

  // Create New Book Handler
  const handleCreateNewBook = useCallback((title: string, initialText: string) => {
    const fileId = `book-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const detectedLang = (initialText.match(/[\u0600-\u06FF]/g) || []).length > initialText.length * 0.3 ? 'ar' : 'en';

    let pages: BookPage[] = [];

    if (initialText.trim()) {
      const words = initialText.trim().split(/\s+/).filter(Boolean).length;
      pages = [{
        pageNumber: 1,
        title: t.page + ' 1',
        rawText: initialText.trim(),
        chunks: [],
        wordCount: words,
      }];
    }

    const newBook: BookDocument = {
      id: fileId,
      title,
      fileType: 'txt',
      fileSize: new TextEncoder().encode(initialText).length,
      totalPages: pages.length,
      totalWords: pages.reduce((acc, p) => acc + p.wordCount, 0),
      detectedLanguage: detectedLang,
      pages,
      dateAdded: Date.now(),
      lastReadPage: 1,
      lastReadChunkIndex: 0,
      progressPercentage: 0,
    };

    setCurrentBook(newBook);
    speechEngine.stop();
    setPlaybackState({
      status: 'idle',
      currentPage: 1,
      currentChunkIndex: 0,
      currentChunkId: null,
      currentWordIndex: 0,
      currentWordCharRange: null,
      totalChunksInBook: 0,
      globalChunkIndex: 0,
    });

    const updatedRecents = [newBook, ...recentBooks.filter((b) => b.id !== newBook.id)].slice(0, 5);
    setRecentBooks(updatedRecents);
    saveRecentBooks(updatedRecents);

    showToast(
      uiLang === 'ar' ? `تم إنشاء كتاب "${title}" بنجاح!` : `Book "${title}" created successfully!`,
      'success'
    );
  }, [recentBooks, showToast, uiLang, t]);

  // OCR Execution Handler
  const handleStartOCR = useCallback(async (lang: 'ara' | 'eng' | 'ara+eng', onlyEmptyPages: boolean) => {
    if (!currentBook || !fileBufferCache) {
      showToast(uiLang === 'ar' ? 'يرجى إعادة رفع الملف لتنفيذ OCR' : 'Please re-upload file to run OCR', 'error');
      return;
    }

    setOcrState({
      isActive: true,
      currentPage: 0,
      totalPages: currentBook.pages.length,
      pageProgress: 0,
      overallProgress: 0,
      statusMessage: 'جاري تهيئة محرك OCR...',
      targetLang: lang,
    });

    try {
      const updatedBook = await ocrProcessor.performOCR(currentBook, fileBufferCache, {
        lang,
        onlyEmptyPages,
        onProgress: (prog) => {
          setOcrState((prev) => ({
            ...prev,
            currentPage: prog.currentPage,
            totalPages: prog.totalPages,
            pageProgress: prog.pageProgress,
            overallProgress: prog.overallProgress,
            statusMessage: prog.statusMessage,
          }));
        },
      });

      setCurrentBook(updatedBook);
      setIsOCRModalOpen(false);
      showToast(t.ocrDone, 'success');
    } catch (err: any) {
      if (err.message !== 'OCR operation cancelled by user') {
        console.error('OCR error:', err);
        showToast(err.message || 'OCR processing failed', 'error');
      }
    } finally {
      setOcrState((prev) => ({ ...prev, isActive: false }));
    }
  }, [currentBook, fileBufferCache, showToast, t.ocrDone, uiLang]);

  const handleCancelOCR = useCallback(() => {
    ocrProcessor.cancel();
    setOcrState((prev) => ({ ...prev, isActive: false }));
    showToast(uiLang === 'ar' ? 'تم إلغاء عملية الـ OCR' : 'OCR canceled', 'info');
  }, [showToast, uiLang]);

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (playbackState.status === 'playing') {
          handlePause();
        } else if (playbackState.status === 'paused') {
          handleResume();
        } else {
          handlePlay();
        }
      } else if (e.code === 'ArrowRight' && !e.shiftKey) {
        e.preventDefault();
        uiLang === 'ar' ? handlePrevChunk() : handleNextChunk();
      } else if (e.code === 'ArrowLeft' && !e.shiftKey) {
        e.preventDefault();
        uiLang === 'ar' ? handleNextChunk() : handlePrevChunk();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        handleUpdateSettings({ volume: settings.volume > 0 ? 0 : 1.0 });
      } else if (e.code === 'KeyS' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setIsSettingsModalOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playbackState.status, handlePlay, handlePause, handleResume, handleNextChunk, handlePrevChunk, handleUpdateSettings, settings.volume, uiLang]);

  // Current page data
  const currentPageData = useMemo(() => {
    if (!currentBook) return null;
    return currentBook.pages.find((p) => p.pageNumber === playbackState.currentPage) || currentBook.pages[0];
  }, [currentBook, playbackState.currentPage]);

  // Active voice name
  const activeVoiceName = useMemo(() => {
    const currentChunk = getCurrentChunk();
    const isAr = currentChunk ? currentChunk.language === 'ar' : true;
    const uri = isAr ? settings.selectedArabicVoiceURI : settings.selectedEnglishVoiceURI;
    const voice = availableVoices.find((v) => v.voiceURI === uri);
    return voice?.name || (isAr ? 'صوت عربي تلقائي' : 'Default English Voice');
  }, [getCurrentChunk, settings.selectedArabicVoiceURI, settings.selectedEnglishVoiceURI, availableVoices]);

  // Total words remaining
  const wordsRemaining = useMemo(() => {
    if (!currentBook) return 0;
    let sum = 0;
    for (let i = playbackState.currentPage - 1; i < currentBook.pages.length; i++) {
      sum += currentBook.pages[i]?.wordCount || 0;
    }
    return sum;
  }, [currentBook, playbackState.currentPage]);

  const activeChunkText = getCurrentChunk()?.text || '';

  const isCurrentPageBookmarked = useMemo(() => {
    return bookmarks.some(
      (bm) => bm.pageNumber === playbackState.currentPage && bm.chunkIndex === playbackState.currentChunkIndex
    );
  }, [bookmarks, playbackState.currentPage, playbackState.currentChunkIndex]);

  const themeConfig = getThemeConfig(settings.theme);

  return (
    <div className={`min-h-screen flex flex-col font-cairo ${themeConfig.wrapper}`}>
      
      {/* Top Navigation */}
      <Navbar
        uiLang={uiLang}
        onToggleLang={handleToggleLang}
        hasBook={Boolean(currentBook)}
        bookTitle={currentBook?.title}
        isPlaying={playbackState.status === 'playing'}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
        onOpenVoiceSelector={() => setIsVoiceModalOpen(true)}
        onResetBook={handleResetBook}
        currentTheme={settings.theme}
        onToggleTheme={handleToggleTheme}
        onToggleMobileDrawer={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden pt-16">
        {currentBook && currentPageData ? (
          /* Reader Screen Layout */
          <div className="flex-1 flex w-full relative overflow-hidden">
            
            {/* Desktop Sidebar (Left/Right depending on RTL) */}
            <div className="hidden lg:block w-80 xl:w-96 shrink-0 h-screen">
              <ReaderSidebar
                uiLang={uiLang}
                book={currentBook}
                currentPage={playbackState.currentPage}
                currentChunkIndex={playbackState.currentChunkIndex}
                bookmarks={bookmarks}
                currentTheme={settings.theme}
                onSelectPage={handleSelectPage}
                onSelectChunk={handleSelectChunk}
                onDeleteBookmark={handleDeleteBookmark}
                onOpenOCRModal={() => setIsOCRModalOpen(true)}
                onOpenAddPageModal={() => setIsAddPageModalOpen(true)}
              />
            </div>

            {/* Mobile Drawer (Collapsible) */}
            {isMobileDrawerOpen && (
              <div className="fixed inset-0 z-40 lg:hidden flex">
                <div 
                  className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
                  onClick={() => setIsMobileDrawerOpen(false)}
                />
                <div className="relative z-50 w-4/5 max-w-sm h-full shadow-2xl">
                  <ReaderSidebar
                    uiLang={uiLang}
                    book={currentBook}
                    currentPage={playbackState.currentPage}
                    currentChunkIndex={playbackState.currentChunkIndex}
                    bookmarks={bookmarks}
                    currentTheme={settings.theme}
                    onSelectPage={handleSelectPage}
                    onSelectChunk={handleSelectChunk}
                    onDeleteBookmark={handleDeleteBookmark}
                    onOpenOCRModal={() => {
                      setIsOCRModalOpen(true);
                      setIsMobileDrawerOpen(false);
                    }}
                    onOpenAddPageModal={() => {
                      setIsAddPageModalOpen(true);
                      setIsMobileDrawerOpen(false);
                    }}
                    onCloseMobileDrawer={() => setIsMobileDrawerOpen(false)}
                  />
                </div>
              </div>
            )}

            {/* Main Reading Canvas */}
            <MainReaderText
              uiLang={uiLang}
              book={currentBook}
              currentPageData={currentPageData}
              currentPageNumber={playbackState.currentPage}
              currentChunkIndex={playbackState.currentChunkIndex}
              isPlaying={playbackState.status === 'playing'}
              activeWordRange={playbackState.currentWordCharRange}
              settings={settings}
              isBookmarked={isCurrentPageBookmarked}
              onToggleBookmark={handleToggleBookmark}
              onSelectChunk={(chunkIdx) => playChunk(playbackState.currentPage, chunkIdx)}
              onNextPage={() => {
                if (playbackState.currentPage < currentBook.totalPages) {
                  handleSelectPage(playbackState.currentPage + 1);
                }
              }}
              onPrevPage={() => {
                if (playbackState.currentPage > 1) {
                  handleSelectPage(playbackState.currentPage - 1);
                }
              }}
              onOpenOCRModal={() => setIsOCRModalOpen(true)}
              onIncreaseFontSize={() => handleUpdateSettings({ fontSize: Math.min(36, settings.fontSize + 1) })}
              onDecreaseFontSize={() => handleUpdateSettings({ fontSize: Math.max(14, settings.fontSize - 1) })}
              onUpdatePageText={handleUpdatePageText}
            />

          </div>
        ) : (
          /* Empty / Upload Hero Screen */
          <FileUploader
            uiLang={uiLang}
            onFileSelect={handleFileSelect}
            onCreateNewBook={() => setIsCreateBookModalOpen(true)}
            onSelectSampleBook={handleSelectSampleBook}
            recentBooks={recentBooks}
            onSelectRecentBook={handleSelectRecentBook}
            onDeleteRecentBook={handleDeleteRecentBook}
            isParsing={isParsing}
            parseProgress={parseProgress}
          />
        )}
      </main>

      {/* Sticky Bottom Audio Player Bar (only visible when book is open) */}
      {currentBook && (
        <AudioPlayer
          uiLang={uiLang}
          playbackState={playbackState}
          settings={settings}
          activeChunkText={activeChunkText}
          totalWordsRemaining={wordsRemaining}
          activeVoiceName={activeVoiceName}
          onPlay={handlePlay}
          onPause={handlePause}
          onResume={handleResume}
          onStop={handleStop}
          onNextChunk={handleNextChunk}
          onPrevChunk={handlePrevChunk}
          onSeekChunk={handleSeekChunk}
          onSpeedChange={(speed) => handleUpdateSettings({ speechRate: speed })}
          onPitchChange={(pitch) => handleUpdateSettings({ pitch })}
          onVolumeChange={(volume) => handleUpdateSettings({ volume })}
          onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
          onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
          sleepTimerLeft={sleepTimerLeft}
          onSetSleepTimer={(minutes: number | null) => setSleepTimerLeft(minutes !== null ? minutes * 60 : null)}
        />
      )}

      {/* Modals & Dialogs */}
      <VoiceSelectorModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        uiLang={uiLang}
        voices={availableVoices}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />

      <ReadingSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        uiLang={uiLang}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />

      {currentBook && (
        <OCRModal
          isOpen={isOCRModalOpen}
          onClose={() => setIsOCRModalOpen(false)}
          uiLang={uiLang}
          book={currentBook}
          ocrState={ocrState}
          onStartOCR={handleStartOCR}
          onCancelOCR={handleCancelOCR}
        />
      )}

      <ShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
        uiLang={uiLang}
      />

      {currentBook && (
        <AddPageModal
          isOpen={isAddPageModalOpen}
          onClose={() => setIsAddPageModalOpen(false)}
          onAddPage={handleAddPage}
          uiLang={uiLang}
          nextPageNumber={currentBook.pages.length + 1}
        />
      )}

      <CreateBookModal
        isOpen={isCreateBookModalOpen}
        onClose={() => setIsCreateBookModalOpen(false)}
        onCreateBook={handleCreateNewBook}
        uiLang={uiLang}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

    </div>
  );
}
