import { useState, useRef } from 'react';
import { cn } from '../../lib/utils';
import type { PdfSplitterProps, PdfSplitterTab, SplitFile, SplitMode } from './types';
import { readPdfFile, splitPdfFile } from './utils';
import { Header } from './components/Header';
import { UploadPanel } from './components/UploadPanel';
import { PagesPanel } from './components/PagesPanel';
import { SplitPanel } from './components/SplitPanel';

export function PdfSplitter({ t, lang }: PdfSplitterProps) {
  const [file, setFile] = useState<SplitFile | null>(null);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [mode, setMode] = useState<SplitMode>('extract');
  const [loading, setLoading] = useState(false);
  const [splitting, setSplitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mobileTab, setMobileTab] = useState<PdfSplitterTab>('upload');

  const loadFile = async (f: File) => {
    setLoading(true);
    setError(null);
    try {
      const loaded = await readPdfFile(f);
      setFile(loaded);
      setSelectedPages(new Set());
    } catch {
      setError(lang === 'ar' ? 'خطأ في قراءة الملف' : 'Error reading file');
    }
    setLoading(false);
  };

  const togglePage = (page: number) => {
    setSelectedPages(prev => {
      const next = new Set(prev);
      next.has(page) ? next.delete(page) : next.add(page);
      return next;
    });
  };

  const selectRange = (from: number, to: number) => {
    const pages = new Set<number>();
    for (let i = from; i <= to; i++) pages.add(i);
    setSelectedPages(pages);
  };

  const split = async () => {
    if (!file || selectedPages.size === 0) return;
    setSplitting(true);
    setError(null);
    try {
      const ok = await splitPdfFile(file, selectedPages, mode);
      if (!ok) {
        setError(lang === 'ar' ? 'لا توجد صفحات محددة' : 'No pages selected');
        setSplitting(false);
        return;
      }
    } catch {
      setError(lang === 'ar' ? 'خطأ في تقسيم الملف' : 'Error splitting file');
    }
    setSplitting(false);
  };

  const pageCount = file?.pageCount || 0;
  const effectiveCount = mode === 'extract' ? selectedPages.size : pageCount - selectedPages.size;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <style>{`
        .pdf-splitter-scroll { direction: ltr; overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.08) transparent; }
        .pdf-splitter-scroll::-webkit-scrollbar { width: 4px; }
        .pdf-splitter-scroll::-webkit-scrollbar-track { background: transparent; }
        .pdf-splitter-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        .pdf-splitter-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
        .pdf-splitter-scroll > * { direction: ${lang === 'ar' ? 'rtl' : 'ltr'}; }
      `}</style>

      <Header lang={lang} mobileTab={mobileTab} onTabChange={setMobileTab} />

      <div className="flex-1 pdf-splitter-scroll">
        <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-4">
          <div className={cn("md:block", mobileTab !== 'upload' && 'hidden')}>
            <UploadPanel
              lang={lang}
              file={file}
              loading={loading}
              fileInputRef={fileInputRef}
              onLoad={loadFile}
              onRemove={() => { setFile(null); setSelectedPages(new Set()); }}
            />
          </div>

          {file && (
            <div className={cn("md:block", mobileTab !== 'pages' && 'hidden')}>
              <PagesPanel
                lang={lang}
                pageCount={pageCount}
                selectedPages={selectedPages}
                mode={mode}
                onModeChange={setMode}
                onTogglePage={togglePage}
                onSelectRange={selectRange}
                onClear={() => setSelectedPages(new Set())}
              />
            </div>
          )}

          <div className={cn("md:block", mobileTab !== 'export' && 'hidden')}>
            <SplitPanel
              lang={lang}
              hasFile={!!file}
              selectedCount={selectedPages.size}
              effectiveCount={effectiveCount}
              mode={mode}
              splitting={splitting}
              error={error}
              onSplit={split}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
