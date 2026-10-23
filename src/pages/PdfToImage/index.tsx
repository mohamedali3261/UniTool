import { useState, useCallback } from 'react';
import { Upload, FileImage, FileType2, FileDown } from 'lucide-react';
import JSZip from 'jszip';
import { cn } from '../../lib/utils';
import type { FileHandoffTarget } from '../../types/app';
import { ImageCropModal } from '../../components/image-crop/ImageCropModal';
import type { CropResult } from '../../components/image-crop/ImageCropModal';
import type { ImageFormat, PageImage } from './types';
import {
  canvasToBlob,
  downloadUrl,
  loadImageAsDataUrl,
  loadImageToCanvas,
  loadPdfPages,
} from './utils';
import { PageCard } from './components/PageCard';
import { UploadPanel } from './components/UploadPanel';
import { ExportPanel } from './components/ExportPanel';

interface Props {
  t: any;
  lang: 'ar' | 'en';
  onSendFilesToTool: (target: FileHandoffTarget, files: File[]) => void;
}

export function PdfToImage({ lang, onSendFilesToTool }: Props) {
  const [pages, setPages] = useState<PageImage[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [format, setFormat] = useState<ImageFormat>('png');
  const [quality, setQuality] = useState(0.92);
  const [loading, setLoading] = useState(false);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'upload' | 'pages' | 'export'>('upload');
  const [nextId, setNextId] = useState(1);
  const [sendingToTool, setSendingToTool] = useState(false);
  const [cropTarget, setCropTarget] = useState<PageImage | null>(null);

  const handleFiles = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setError(null);
    setLoading(true);

    try {
      const newPages: PageImage[] = [];
      let idCounter = nextId;

      for (const f of Array.from(files)) {
        if (f.type === 'application/pdf') {
          const pdfPages = await loadPdfPages(f);
          pdfPages.forEach(p => { p.id = idCounter++; newPages.push(p); });
        } else if (f.type.startsWith('image/')) {
          const rawDataUrl = await loadImageAsDataUrl(f);
          const { dataUrl, width, height } = await loadImageToCanvas(rawDataUrl);
          newPages.push({ id: idCounter++, dataUrl, width, height, name: f.name.replace(/\.[^.]+$/, '') });
        }
      }

      if (newPages.length === 0) {
        setError(lang === 'ar' ? 'يرجى اختيار صور أو ملف PDF' : 'Please select images or a PDF file');
        setLoading(false);
        return;
      }

      setPages(prev => [...prev, ...newPages]);
      setNextId(idCounter);
      setSelectedIds(prev => {
        const next = new Set(prev);
        newPages.forEach(p => next.add(p.id));
        return next;
      });
    } catch {
      setError(lang === 'ar' ? 'فشل تحميل الملف' : 'Failed to load file');
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  }, [nextId, lang]);

  const clearAll = () => {
    setPages([]);
    setSelectedIds(new Set());
    setNextId(1);
    setError(null);
  };

  const removePage = (id: number) => {
    setPages(prev => prev.filter(p => p.id !== id));
    setSelectedIds(prev => { const next = new Set(prev); next.delete(id); return next; });
  };

  const togglePage = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === pages.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pages.map(p => p.id)));
    }
  };

  const applyCrop = (result: CropResult) => {
    if (!cropTarget) return;
    setPages(prev => prev.map(p => p.id === cropTarget.id ? {
      ...p,
      dataUrl: result.dataUrl,
      width: result.width,
      height: result.height,
      originalDataUrl: p.originalDataUrl ?? p.dataUrl,
      originalWidth: p.originalWidth ?? p.width,
      originalHeight: p.originalHeight ?? p.height,
    } : p));
    setCropTarget(null);
  };

  const resetCrop = () => {
    if (!cropTarget?.originalDataUrl) return;
    setPages(prev => prev.map(p => p.id === cropTarget.id ? {
      ...p,
      dataUrl: cropTarget.originalDataUrl!,
      width: cropTarget.originalWidth ?? p.width,
      height: cropTarget.originalHeight ?? p.height,
      originalDataUrl: undefined,
      originalWidth: undefined,
      originalHeight: undefined,
    } : p));
    setCropTarget(null);
  };

  const downloadSingle = async (page: PageImage) => {
    const blob = await canvasToBlob(page.dataUrl, format, quality);
    const url = URL.createObjectURL(blob);
    downloadUrl(url, `${page.name}.${format}`);
    URL.revokeObjectURL(url);
  };

  const downloadAll = async () => {
    if (selectedIds.size === 0) return;
    setConverting(true);
    try {
      const selected = pages.filter(p => selectedIds.has(p.id));
      if (selected.length === 1) {
        await downloadSingle(selected[0]);
        setConverting(false);
        return;
      }
      const zip = new JSZip();
      for (const page of selected) {
        const blob = await canvasToBlob(page.dataUrl, format, quality);
        zip.file(`${page.name}.${format}`, blob);
      }
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      downloadUrl(url, 'converted_images.zip');
      URL.revokeObjectURL(url);
    } catch {
      setError(lang === 'ar' ? 'فشل التصدير' : 'Failed to export');
    } finally {
      setConverting(false);
    }
  };

  const sendSelectedToTool = async (target: FileHandoffTarget) => {
    const selected = pages.filter(page => selectedIds.has(page.id));
    if (selected.length === 0) return;

    setSendingToTool(true);
    setError(null);
    try {
      const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
      const extension = format === 'jpeg' ? 'jpg' : 'png';
      const files = await Promise.all(selected.map(async page => {
        const blob = await canvasToBlob(page.dataUrl, format, quality);
        return new File([blob], `${page.name}.${extension}`, { type: mime });
      }));
      onSendFilesToTool(target, files);
    } catch {
      setError(lang === 'ar' ? 'فشل تجهيز الصور للأداة التالية' : 'Failed to prepare images for the next tool');
    } finally {
      setSendingToTool(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] bg-[#0F1115]/50 shrink-0 sm:px-4 sm:py-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-600 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/20 sm:w-8 sm:h-8">
          <FileType2 size={14} className="text-white" />
        </div>
        <div>
          <h1 className="text-xs font-bold text-white sm:text-sm">{lang === 'ar' ? 'تحويل الوسائط' : 'Media Converter'}</h1>
          <p className="text-[8px] text-gray-500 font-mono sm:text-[9px]">{lang === 'ar' ? 'تحويل PDF والصور إلى PNG أو JPG' : 'Convert PDF & images to PNG or JPG'}</p>
        </div>
      </div>

      <div className="flex border-b border-[#2D3139] bg-[#14171C] sm:hidden shrink-0">
        {[
          { id: 'upload', label: lang === 'ar' ? 'رفع' : 'Upload', icon: Upload },
          { id: 'pages', label: lang === 'ar' ? 'ملفات' : 'Files', icon: FileImage },
          { id: 'export', label: lang === 'ar' ? 'تصدير' : 'Export', icon: FileDown },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setMobileTab(tab.id as any)}
            className={cn(
              "flex-1 py-2.5 flex flex-col items-center gap-1 font-mono text-[7px] uppercase tracking-widest transition-colors",
              mobileTab === tab.id ? "text-orange-500 bg-[#1A1D23]" : "text-gray-500"
            )}
          >
            <tab.icon size={12} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside className={cn(
          "w-full sm:w-64 bg-[#14171C] border-r border-[#2D3139] flex flex-col shrink-0 overflow-y-auto",
          mobileTab === 'upload' || mobileTab === 'export' ? "flex" : "hidden sm:flex"
        )}>
          <div className={cn(mobileTab === 'upload' ? "block" : "hidden sm:block")}>
            <UploadPanel
              lang={lang}
              hasPages={pages.length > 0}
              loading={loading}
              error={error}
              onFiles={handleFiles}
              onClearAll={clearAll}
            />
          </div>

          <div className={cn("flex flex-col flex-1", mobileTab === 'export' ? "flex" : "hidden sm:flex")}>
            <ExportPanel
              lang={lang}
              format={format}
              quality={quality}
              selectedCount={selectedIds.size}
              totalCount={pages.length}
              converting={converting}
              sendingToTool={sendingToTool}
              onFormatChange={setFormat}
              onQualityChange={setQuality}
              onExport={downloadAll}
              onToggleAll={toggleAll}
              onSendToTool={sendSelectedToTool}
            />
          </div>
        </aside>

        <section className={cn(
          "flex-1 overflow-y-auto bg-[#0A0C0F]",
          mobileTab === 'pages' ? "flex" : "hidden sm:flex"
        )}>
          {pages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center max-w-xs">
                <FileType2 size={32} className="text-gray-700 mx-auto mb-3" />
                <p className="text-[10px] font-mono text-gray-600">
                  {lang === 'ar' ? 'اختر صور أو ملف PDF للبدء' : 'Select images or a PDF to start'}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-3 text-[9px] font-mono text-gray-500">
                <FileImage size={12} />
                <span>{pages.length} {lang === 'ar' ? 'ملف' : 'file'}{pages.length !== 1 ? 's' : ''}</span>
                <span className="text-gray-700 mx-1">|</span>
                <span className="text-orange-400/70">
                  {format === 'jpeg' ? 'JPG' : 'PNG'} ({Math.round(quality * 100)}%)
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {pages.map(page => (
                  <PageCard
                    key={page.id}
                    page={page}
                    selected={selectedIds.has(page.id)}
                    lang={lang}
                    onToggle={() => togglePage(page.id)}
                    onRemove={() => removePage(page.id)}
                    onDownload={() => downloadSingle(page)}
                    onCrop={() => setCropTarget(page)}
                  />
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      {cropTarget && (
        <ImageCropModal
          src={cropTarget.dataUrl}
          name={cropTarget.name}
          lang={lang}
          accent="orange"
          canRestore={!!cropTarget.originalDataUrl}
          onApply={applyCrop}
          onRestore={resetCrop}
          onClose={() => setCropTarget(null)}
        />
      )}
    </div>
  );
}
