import React, { useState } from 'react';
import { X, FilePlus2 } from 'lucide-react';
import { UILanguage } from '../types';
import { getTranslation } from '../translations';

interface AddPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPage: (title: string, rawText: string) => void;
  uiLang: UILanguage;
  nextPageNumber: number;
}

export const AddPageModal: React.FC<AddPageModalProps> = ({
  isOpen,
  onClose,
  onAddPage,
  uiLang,
  nextPageNumber,
}) => {
  const t = getTranslation(uiLang);
  const [title, setTitle] = useState('');
  const [rawText, setRawText] = useState('');

  if (!isOpen) return null;

  const handleAdd = () => {
    const trimmed = rawText.trim();
    if (!trimmed) return;

    const pageTitle = title.trim() || `${t.page} ${nextPageNumber}`;
    onAddPage(pageTitle, trimmed);
    setTitle('');
    setRawText('');
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

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
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
              <FilePlus2 className="h-5 w-5" />
            </div>
            <h2 className="text-base font-bold text-white">
              {uiLang === 'ar' ? 'إضافة صفحة جديدة' : 'Add New Page'}
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
          {/* Title Input */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">
              {uiLang === 'ar' ? 'عنوان الصفحة (اختياري)' : 'Page Title (optional)'}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`${t.page} ${nextPageNumber}`}
              className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
            />
          </div>

          {/* Textarea */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">
              {uiLang === 'ar' ? 'محتوى الصفحة' : 'Page Content'}
            </label>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={uiLang === 'ar' ? 'اكتب أو الصق نص الصفحة هنا...' : 'Type or paste page text here...'}
              rows={8}
              className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 leading-relaxed"
              autoFocus
            />
            <p className="mt-1 text-[11px] text-slate-500">
              {rawText.trim().split(/\s+/).filter(Boolean).length} {t.wordsCount}
            </p>
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
            onClick={handleAdd}
            disabled={!rawText.trim()}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
          >
            {uiLang === 'ar' ? 'إضافة الصفحة' : 'Add Page'}
          </button>
        </div>
      </div>
    </div>
  );
};
