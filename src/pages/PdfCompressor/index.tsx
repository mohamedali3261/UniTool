import { useState, useCallback, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Upload, FileType2, FileDown } from 'lucide-react';
import JSZip from 'jszip';
import { cn } from '../../lib/utils';
import type { PdfFile } from './types';
import { compressPdfFile } from './utils';
import { UploadPanel } from './components/UploadPanel';
import { ExportPanel } from './components/ExportPanel';
import { FileCard } from './components/FileCard';

interface Props {
  t: any;
  lang: 'ar' | 'en';
}

export function PdfCompressor({ lang }: Props) {
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [quality, setQuality] = useState(65);
  const [dpi, setDpi] = useState(150);
  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'upload' | 'files' | 'export'>('upload');
  const [nextId, setNextId] = useState(1);
  const [fileMap] = useState(() => new Map<number, File>());
  const [currentFile, setCurrentFile] = useState('');
  const [pageProgress, setPageProgress] = useState('');
  const abortRef = useRef(false);

  const handleFiles = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputFiles = e.target.files;
    if (!inputFiles || inputFiles.length === 0) return;
    setError(null);
    setLoading(true);

    try {
      let idCounter = nextId;
      const newFiles: PdfFile[] = [];

      for (const f of Array.from(inputFiles)) {
        if (f.type !== 'application/pdf') continue;
        const id = idCounter++;
        fileMap.set(id, f);
        const arrayBuffer = await f.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
        newFiles.push({
          id,
          name: f.name.replace(/\.pdf$/i, ''),
          originalSize: f.size,
          compressedSize: 0,
          compressedBlob: null,
          keptOriginal: false,
          pages: pdf.numPages,
        });
        pdf.destroy();
      }

      if (newFiles.length === 0) {
        setError(lang === 'ar' ? 'لم يتم العثور على ملفات PDF' : 'No PDF files found');
        setLoading(false);
        return;
      }

      setFiles(prev => [...prev, ...newFiles]);
      setNextId(idCounter);
      setSelectedIds(prev => {
        const next = new Set(prev);
        newFiles.forEach(f => next.add(f.id));
        return next;
      });
    } catch {
      setError(lang === 'ar' ? 'فشل تحميل الملفات' : 'Failed to load files');
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  }, [nextId, fileMap, lang]);

  const compressAll = async () => {
    if (files.length === 0) return;
    setCompressing(true);
    setCurrentFile('');
    setPageProgress('');
    try {
      for (const f of files) {
        if (f.compressedBlob || f.keptOriginal) continue;
        const originalFile = fileMap.get(f.id);
        if (!originalFile) continue;
        setCurrentFile(f.name);
        setPageProgress('');
        abortRef.current = false;
        const updated = await compressPdfFile(
          originalFile,
          f,
          quality,
          dpi,
          () => abortRef.current,
          setPageProgress,
          (page, total) => `${lang === 'ar' ? 'صفحة' : 'Page'} ${page}/${total}`,
        );
        setFiles(prev => prev.map(p => p.id === f.id ? updated : p));
      }
    } catch {
      setError(lang === 'ar' ? 'فشل الضغط' : 'Compression failed');
    } finally {
      setCompressing(false);
      setCurrentFile('');
      setPageProgress('');
    }
  };

  const toggleFile = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === files.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(files.map(f => f.id)));
  };

  const removeFile = (id: number) => {
    fileMap.delete(id);
    setFiles(prev => prev.filter(f => f.id !== id));
    setSelectedIds(prev => { const next = new Set(prev); next.delete(id); return next; });
  };

  const clearAll = () => {
    fileMap.clear();
    setFiles([]);
    setSelectedIds(new Set());
    setNextId(1);
    setError(null);
  };

  const downloadSingle = (file: PdfFile) => {
    const blob = file.keptOriginal ? fileMap.get(file.id) : file.compressedBlob;
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file.name}_compressed.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAll = async () => {
    const selected = files.filter(f => selectedIds.has(f.id) && (f.compressedBlob || f.keptOriginal));
    if (selected.length === 0) return;
    if (selected.length === 1) { downloadSingle(selected[0]); return; }
    const zip = new JSZip();
    for (const f of selected) {
      const blob = f.keptOriginal ? fileMap.get(f.id) : f.compressedBlob;
      if (!blob) continue;
      zip.file(`${f.name}_compressed.pdf`, blob);
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(await zip.generateAsync({ type: 'blob' }));
    a.download = 'compressed_pdfs.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const totalOriginalSize = files.reduce((s, f) => s + f.originalSize, 0);
  const totalEffectiveSize = files.reduce((s, f) => f.keptOriginal ? s + f.originalSize : s + f.compressedSize, 0);
  const allCompressed = files.length > 0 && files.every(f => f.compressedBlob || f.keptOriginal);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] bg-[#0F1115]/50 shrink-0 sm:px-4 sm:py-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center shadow-lg shadow-red-500/20 sm:w-8 sm:h-8">
          <FileType2 size={14} className="text-white" />
        </div>
        <div>
          <h1 className="text-xs font-bold text-white sm:text-sm">{lang === 'ar' ? 'ضغط PDF' : 'PDF Compressor'}</h1>
          <p className="text-[8px] text-gray-500 font-mono sm:text-[9px]">{lang === 'ar' ? 'ضغط فعال بإعادة ترميز الصفحات' : 'Effective compression by re-encoding pages'}</p>
        </div>
      </div>

      <div className="flex border-b border-[#2D3139] bg-[#14171C] sm:hidden shrink-0">
        {[
          { id: 'upload', label: lang === 'ar' ? 'رفع' : 'Upload', icon: Upload },
          { id: 'files', label: 'PDF', icon: FileType2 },
          { id: 'export', label: lang === 'ar' ? 'تصدير' : 'Export', icon: FileDown },
        ].map(tab => (
          <button key={tab.id} onClick={() => setMobileTab(tab.id as any)}
            className={cn("flex-1 py-2.5 flex flex-col items-center gap-1 font-mono text-[7px] uppercase tracking-widest transition-colors", mobileTab === tab.id ? "text-red-500 bg-[#1A1D23]" : "text-gray-500")}>
            <tab.icon size={12} />{tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside className={cn("w-full sm:w-64 bg-[#14171C] border-r border-[#2D3139] flex flex-col shrink-0 overflow-y-auto", mobileTab === 'upload' || mobileTab === 'export' ? "flex" : "hidden sm:flex")}>
          <div className={cn(mobileTab === 'upload' ? "block" : "hidden sm:block")}>
            <UploadPanel
              lang={lang}
              fileCount={files.length}
              quality={quality}
              dpi={dpi}
              error={error}
              onFiles={handleFiles}
              onQualityChange={setQuality}
              onDpiChange={setDpi}
              onClearAll={clearAll}
            />
          </div>

          <div className={cn("flex flex-col flex-1", mobileTab === 'export' ? "flex" : "hidden sm:flex")}>
            <ExportPanel
              lang={lang}
              fileCount={files.length}
              selectedCount={selectedIds.size}
              totalOriginalSize={totalOriginalSize}
              totalEffectiveSize={totalEffectiveSize}
              allCompressed={allCompressed}
              compressing={compressing}
              currentFile={currentFile}
              pageProgress={pageProgress}
              onCompressAll={compressAll}
              onToggleAll={toggleAll}
              onDownloadAll={downloadAll}
            />
          </div>
        </aside>

        <section className={cn("flex-1 overflow-y-auto bg-[#0A0C0F]", mobileTab === 'files' ? "flex" : "hidden sm:flex")}>
          {files.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center max-w-xs">
                <FileType2 size={32} className="text-gray-700 mx-auto mb-3" />
                <p className="text-[10px] font-mono text-gray-600">{lang === 'ar' ? 'اختر ملفات PDF للبدء' : 'Select PDF files to start'}</p>
              </div>
            </div>
          ) : (
            <div className="p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-3 text-[9px] font-mono text-gray-500">
                <FileType2 size={12} />
                <span>{files.length} {lang === 'ar' ? 'ملف' : 'file'}{files.length !== 1 ? 's' : ''}</span>
                <span className="text-gray-700 mx-1">|</span>
                <span className="text-red-400/70">JPEG {quality}% @ {dpi}DPI</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {files.map(f => (
                  <FileCard
                    key={f.id}
                    file={f}
                    selected={selectedIds.has(f.id)}
                    lang={lang}
                    onToggle={() => toggleFile(f.id)}
                    onRemove={() => removeFile(f.id)}
                    onDownload={() => downloadSingle(f)}
                  />
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
