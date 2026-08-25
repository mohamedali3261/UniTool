import { BookDocument, Bookmark, ReaderSettings } from '../types';

const SETTINGS_KEY = 'sawti_reader_settings_v1';
const RECENT_BOOKS_KEY = 'sawti_recent_books_v1';
const BOOKMARKS_KEY = 'sawti_bookmarks_v1';
const LAST_ACTIVE_BOOK_ID_KEY = 'sawti_last_active_book_id_v1';

export const DEFAULT_SETTINGS: ReaderSettings = {
  fontSize: 19,
  lineHeight: 1.8,
  fontFamily: 'cairo',
  theme: 'dark',
  speechRate: 1.0,
  pitch: 1.0,
  volume: 1.0,
  selectedArabicVoiceURI: null,
  selectedEnglishVoiceURI: null,
  autoVoiceSelect: true,
  autoScroll: true,
  highlightMode: 'sentence',
  uiLanguage: 'ar',
};

export function loadSettings(): ReaderSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    console.warn('Failed to load settings from storage:', e);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: ReaderSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save settings to storage:', e);
  }
}

export function loadRecentBooks(): BookDocument[] {
  try {
    const raw = localStorage.getItem(RECENT_BOOKS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load recent books:', e);
    return [];
  }
}

export function saveRecentBooks(books: BookDocument[]): void {
  try {
    // Keep max 5 recent books to avoid exceeding localStorage limits
    const trimmed = books.slice(0, 5);
    localStorage.setItem(RECENT_BOOKS_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.warn('Failed to save recent books (possible quota exceeded):', e);
  }
}

export function saveBookProgress(
  bookId: string,
  pageNumber: number,
  chunkIndex: number,
  progressPercentage: number
): void {
  try {
    const books = loadRecentBooks();
    const index = books.findIndex((b) => b.id === bookId);
    if (index !== -1) {
      books[index].lastReadPage = pageNumber;
      books[index].lastReadChunkIndex = chunkIndex;
      books[index].progressPercentage = progressPercentage;
      saveRecentBooks(books);
    }
  } catch (e) {
    // ignore
  }
}

export function getLastActiveBookId(): string | null {
  return localStorage.getItem(LAST_ACTIVE_BOOK_ID_KEY);
}

export function setLastActiveBookId(bookId: string | null): void {
  if (bookId) {
    localStorage.setItem(LAST_ACTIVE_BOOK_ID_KEY, bookId);
  } else {
    localStorage.removeItem(LAST_ACTIVE_BOOK_ID_KEY);
  }
}

export function loadBookmarks(bookId: string): Bookmark[] {
  try {
    const raw = localStorage.getItem(`${BOOKMARKS_KEY}_${bookId}`);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export function saveBookmarks(bookId: string, bookmarks: Bookmark[]): void {
  try {
    localStorage.setItem(`${BOOKMARKS_KEY}_${bookId}`, JSON.stringify(bookmarks));
  } catch (e) {
    // ignore
  }
}
