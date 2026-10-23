import { useState, useRef } from 'react';
import { cn } from '../../lib/utils';
import type { PdfFile, PdfMergerProps, PdfMergerTab } from './types';
import { readPdfFiles, mergePdfFiles } from './utils';
import { Header } from './components/Header';
import { UploadPanel } from './components/UploadPanel';
import { FileList } from './components/FileList';
import { MergePanel } from './components/MergePanel';

export function PdfMerger({ t, lang }: PdfMergerProps) {
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [merging, setMerging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextId, setNextId] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mobileTab, setMobileTab] = useState<PdfMergerTab>('upload');

  const addFiles = async (fileList: FileList) => {
    setLoading(true);
    setError(null);
    try {
      const newFiles = await readPdfFiles(fileList, nextId);
      setFiles(prev => [...prev, ...newFiles]);
      setNextId(prev => prev + newFiles.length);
    } catch {
      setError(lang === 'ar' ? 'خطأ في قراءة ملف PDF' : 'Error reading PDF file');
    }
    setLoading(false);
  };

  const removeFile = (id: number) => setFiles(prev => prev.filter(f => f.id !== id));

  const moveFile = (id: number, dir: -1 | 1) => {
    setFiles(prev => {
      const idx = prev.findIndex(f => f.id === id);
      if (idx === -1) return prev;
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const arr = [...prev];
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return arr;
    });
  };

  const merge = async () => {
    if (files.length < 2) return;
    setMerging(true);
    setError(null);
    try {
      await mergePdfFiles(files);
    } catch {
      setError(lang === 'ar' ? 'خطأ في دمج الملفات' : 'Error merging files');
    }
    setMerging(false);
  };

  const totalPages = files.reduce((sum, f) => sum + f.pageCount, 0);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <style>{`
        .pdf-merger-scroll { direction: ltr; overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.08) transparent; }
        .pdf-merger-scroll::-webkit-scrollbar { width: 4px; }
        .pdf-merger-scroll::-webkit-scrollbar-track { background: transparent; }
        .pdf-merger-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        .pdf-merger-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
        .pdf-merger-scroll > * { direction: ${lang === 'ar' ? 'rtl' : 'ltr'}; }
      `}</style>

      <Header lang={lang} fileCount={files.length} mobileTab={mobileTab} onTabChange={setMobileTab} />

      <div className="flex-1 pdf-merger-scroll">
        <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-4">
          <div className={cn("md:block", mobileTab !== 'upload' && 'hidden')}>
            <UploadPanel lang={lang} loading={loading} fileInputRef={fileInputRef} onFiles={addFiles} />
          </div>

          <div className={cn("md:block", mobileTab !== 'files' && 'hidden')}>
            <FileList lang={lang} files={files} totalPages={totalPages} onMove={moveFile} onRemove={removeFile} />
          </div>

          <div className={cn("md:block", mobileTab !== 'export' && 'hidden')}>
            <MergePanel lang={lang} fileCount={files.length} merging={merging} error={error} onMerge={merge} />
          </div>
        </div>
      </div>
    </div>
  );
}
