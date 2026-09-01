import React, { useState } from 'react';
import { X, BookPlus } from 'lucide-react';
import { UILanguage } from '../types';
import { getTranslation } from '../translations';

interface CreateBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateBook: (title: string, initialText: string) => void;
  uiLang: UILanguage;
}

export const CreateBookModal: React.FC<CreateBookModalProps> = ({
  isOpen,
  onClose,
  onCreateBook,
  uiLang,
}) => {
  const t = getTranslation(uiLang);
  const [bookTitle, setBookTitle] = useState('');
  const [initialText, setInitialText] = useState('');

  if (!isOpen) return null;

  const handleCreate = () => {
    const trimmedTitle = bookTitle.trim();
    const trimmedText = initialText.trim();
    if (!trimmedTitle) return;

    onCreateBook(trimmedTitle, trimmedText);
    setBookTitle('');
    setInitialText('');
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  const wordCount = initialText.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border border-slate-700/60 bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <BookPlus className="h-5 w-5" />
            </div>
            <h2 className="text-base font-bold text-white">
              {uiLang === 'ar' ? 'إنشاء كتاب جديد' : 'Create New Book'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Book Title */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">
              {uiLang === 'ar' ? 'اسم الكتاب' : 'Book Title'}
            </label>
            <input
              type="text"
              value={bookTitle}
              onChange={(e) => setBookTitle(e.target.value)}
              placeholder={uiLang === 'ar' ? 'أدخل اسم الكتاب...' : 'Enter book title...'}
              className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
              autoFocus
            />
          </div>

          {/* Initial Page Text */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">
              {uiLang === 'ar' ? 'النص الأولي (صفحة 1) — اختياري' : 'Initial Text (Page 1) — optional'}
            </label>
            <textarea
              value={initialText}
              onChange={(e) => setInitialText(e.target.value)}
              placeholder={uiLang === 'ar' ? 'يمكنك البدء بكتابة أول صفحة الآن، أو إضافة الصفحات لاحقاً...' : 'Start writing the first page now, or add pages later...'}
              rows={6}
              className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 leading-relaxed"
            />
            {initialText.trim() && (
              <p className="mt-1 text-[11px] text-slate-500">
                {wordCount} {t.wordsCount}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-800 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            {t.close}
          </button>
          <button
            onClick={handleCreate}
            disabled={!bookTitle.trim()}
            className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
          >
            {uiLang === 'ar' ? 'إنشاء الكتاب' : 'Create Book'}
          </button>
        </div>
      </div>
    </div>
  );
};
