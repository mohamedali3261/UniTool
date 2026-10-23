import { useState, useRef, useCallback, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { FileHandoff } from '../../types/app';
import { ImageCropModal } from '../../components/image-crop/ImageCropModal';
import type { CropResult } from '../../components/image-crop/ImageCropModal';
import type { ImageItem, PdfSettings, SettingsSnapshot } from './types';
import { buildPdf, safeFileName } from './utils/pdf';
import { UploadPanel } from './components/UploadPanel';
import { ImageCard } from './components/ImageCard';
import { SettingsPanel } from './components/SettingsPanel';

interface Props {
  t: any;
  lang: 'ar' | 'en';
  fileHandoff: FileHandoff | null;
  onFileHandoffConsumed: (id: number) => void;
}

const SETTINGS_KEY = 'unitool-img2pdf-settings';

const DEFAULT_SETTINGS: PdfSettings = {
  pageSize: 'fit',
  orientation: 'auto',
  fitMode: 'contain',
  margin: 20,
  imagesPerPage: 1,
  quality: 0.92,
  imageFormat: 'auto',
  grayscale: false,
  bgColor: '#ffffff',
  showPageNumbers: false,
  fileName: 'images',
  pdfTitle: '',
  pdfAuthor: '',
};

export function ImageToPdf({ lang, fileHandoff, onFileHandoffConsumed }: Props) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [settings, setSettings] = useState<PdfSettings>(DEFAULT_SETTINGS);
  const [mobileTab, setMobileTab] = useState<'upload' | 'images' | 'export'>('upload');
  const [cropTarget, setCropTarget] = useState<ImageItem | null>(null);

  const idRef = useRef(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastHandoffId = useRef<number | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const updateSettings = useCallback((patch: Partial<PdfSettings>) => {
    setSettings(prev => ({ ...prev, ...patch }));
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return;
      const s: SettingsSnapshot = JSON.parse(raw);
      const patch: Partial<PdfSettings> = {};
      if (s.pageSize) patch.pageSize = s.pageSize;
      if (s.orientation) patch.orientation = s.orientation;
      if (s.fitMode) patch.fitMode = s.fitMode;
      if (typeof s.margin === 'number') patch.margin = s.margin;
      if (s.imagesPerPage) patch.imagesPerPage = s.imagesPerPage;
      if (typeof s.quality === 'number') patch.quality = s.quality;
      if (s.imageFormat) patch.imageFormat = s.imageFormat;
      if (typeof s.grayscale === 'boolean') patch.grayscale = s.grayscale;
      if (s.bgColor) patch.bgColor = s.bgColor;
      if (typeof s.showPageNumbers === 'boolean') patch.showPageNumbers = s.showPageNumbers;
      if (s.fileName) patch.fileName = s.fileName;
      updateSettings(patch);
    } catch { /* ignore */ }
  }, [updateSettings]);

  useEffect(() => {
    try {
      const snapshot: SettingsSnapshot = {
        pageSize: settings.pageSize,
        orientation: settings.orientation,
        fitMode: settings.fitMode,
        margin: settings.margin,
        imagesPerPage: settings.imagesPerPage,
        quality: settings.quality,
        imageFormat: settings.imageFormat,
        grayscale: settings.grayscale,
        bgColor: settings.bgColor,
        showPageNumbers: settings.showPageNumbers,
        fileName: settings.fileName,
      };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(snapshot));
    } catch { /* ignore */ }
  }, [settings]);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(null), 4000);
    return () => clearTimeout(timer);
  }, [success]);

  const loadImage = (file: File): Promise<Omit<ImageItem, 'id'>> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          resolve({
            name: file.name.replace(/\.[^.]+$/, '') || `image_${Date.now()}`,
            dataUrl: reader.result as string,
            width: img.naturalWidth || img.width,
            height: img.naturalHeight || img.height,
            rotation: 0,
            sizeBytes: file.size,
          });
        };
        img.onerror = () => reject(new Error('bad image'));
        img.src = reader.result as string;
      };
      reader.onerror = () => reject(new Error('read failed'));
      reader.readAsDataURL(file);
    });
  };

  const importFiles = useCallback(async (files: File[]) => {
    const valid = files.filter(f => f.type.startsWith('image/'));
    const withExt = files.filter(f => !f.type.startsWith('image/') && /\.(png|jpe?g|webp|bmp|gif|avif)$/i.test(f.name));
    const all = [...valid, ...withExt];
    if (all.length === 0) {
      setError(lang === 'ar' ? 'لم يتم العثور على صور صالحة (PNG/JPG/WEBP/BMP/GIF)' : 'No valid images found (PNG/JPG/WEBP/BMP/GIF)');
      return;
    }
    if (images.length + all.length > 300) {
      setError(lang === 'ar' ? 'الحد الأقصى 300 صورة' : 'Max 300 images');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const newImages: ImageItem[] = [];
      for (const f of all.slice(0, 300 - images.length)) {
        try {
          const item = await loadImage(f);
          newImages.push({ ...item, id: idRef.current++ });
        } catch { /* skip corrupt */ }
      }
      if (newImages.length === 0) {
        setError(lang === 'ar' ? 'تعذر قراءة الصور' : 'Could not read images');
      } else {
        setImages(prev => [...prev, ...newImages]);
        setMobileTab('images');
      }
    } finally {
      setLoading(false);
    }
  }, [lang, images.length]);

  const handleFiles = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) void importFiles(Array.from(e.target.files));
    e.target.value = '';
  }, [importFiles]);

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const files: File[] = [];
      e.clipboardData?.items && Array.from(e.clipboardData.items).forEach(it => {
        if (it.type.startsWith('image/')) {
          const f = it.getAsFile();
          if (f) files.push(f);
        }
      });
      if (files.length > 0) void importFiles(files);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [importFiles]);

  useEffect(() => {
    if (!fileHandoff || lastHandoffId.current === fileHandoff.id) return;
    lastHandoffId.current = fileHandoff.id;
    void importFiles(fileHandoff.files).then(() => onFileHandoffConsumed(fileHandoff.id));
  }, [fileHandoff, importFiles, onFileHandoffConsumed]);

  const removeImage = (id: number) => setImages(prev => prev.filter(img => img.id !== id));

  const duplicateImage = (id: number) => {
    setImages(prev => {
      const idx = prev.findIndex(i => i.id === id);
      if (idx < 0) return prev;
      const copy = { ...prev[idx], id: idRef.current++, name: prev[idx].name + ' (copy)' };
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
  };

  const rotateImage = (id: number) => {
    setImages(prev => prev.map(i => i.id === id ? { ...i, rotation: (i.rotation + 90) % 360 } : i));
  };

  const renameImage = (id: number, name: string) => {
    setImages(prev => prev.map(i => i.id === id ? { ...i, name } : i));
  };

  const clearAll = () => { setImages([]); setError(null); };
  const reverseOrder = () => setImages(prev => [...prev].reverse());
  const sortByName = () => setImages(prev => [...prev].sort((a, b) => a.name.localeCompare(b.name, lang === 'ar' ? 'ar' : 'en')));

  const moveImage = (index: number, direction: 'up' | 'down') => {
    setImages(prev => {
      const next = [...prev];
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const onDragStart = (index: number) => setDragIndex(index);
  const onDragOverCard = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    setImages(prev => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(index, 0, moved);
      return next;
    });
    setDragIndex(index);
  };

  const openCrop = (image: ImageItem) => setCropTarget(image);

  const applyCrop = (result: CropResult) => {
    if (!cropTarget) return;
    setImages(prev => prev.map(item => item.id === cropTarget.id ? {
      ...item,
      dataUrl: result.dataUrl,
      width: result.width,
      height: result.height,
      sizeBytes: result.sizeBytes,
      originalDataUrl: item.originalDataUrl ?? item.dataUrl,
      originalWidth: item.originalWidth ?? item.width,
      originalHeight: item.originalHeight ?? item.height,
    } : item));
    setCropTarget(null);
  };

  const resetCrop = () => {
    if (!cropTarget?.originalDataUrl) return;
    setImages(prev => prev.map(item => item.id === cropTarget.id ? {
      ...item,
      dataUrl: cropTarget.originalDataUrl!,
      width: cropTarget.originalWidth ?? item.width,
      height: cropTarget.originalHeight ?? item.height,
      originalDataUrl: undefined,
      originalWidth: undefined,
      originalHeight: undefined,
    } : item));
    setCropTarget(null);
  };

  const generatePdf = async (mode: 'download' | 'preview') => {
    if (images.length === 0 || generating) return;
    setGenerating(true);
    setProgress(5);
    setError(null);
    try {
      const bytes = await buildPdf(images, settings, setProgress);
      setProgress(100);
      const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      if (mode === 'preview') {
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      } else {
        const a = document.createElement('a');
        a.href = url;
        a.download = safeFileName(settings.fileName);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      }
      setSuccess(lang === 'ar' ? `تم إنشاء PDF بنجاح (${images.length} صورة)` : `PDF created (${images.length} images)`);
    } catch (err) {
      console.error(err);
      setError(lang === 'ar' ? 'فشل إنشاء PDF — جرّب تقليل الجودة أو عدد الصور' : 'Failed to generate PDF — try lower quality or fewer images');
    } finally {
      setGenerating(false);
      setProgress(0);
    }
  };

  const totalBytes = images.reduce((sum, i) => sum + (i.sizeBytes || 0), 0);

  return (
    <div className="flex flex-col flex-1 overflow-hidden" ref={dropRef}
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => { e.preventDefault(); setDragOver(false); const f = Array.from(e.dataTransfer.files || []); if (f.length) void importFiles(f); }}
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] bg-[#0F1115]/50 shrink-0 sm:px-4 sm:py-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-600 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/20 sm:w-8 sm:h-8">
          <FileText size={14} className="text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-xs font-bold text-white sm:text-sm">{lang === 'ar' ? 'صور لـ PDF' : 'Image to PDF'}</h1>
          <p className="text-[8px] text-gray-500 font-mono sm:text-[9px]">{lang === 'ar' ? 'اسحب الصور هنا أو الصق (Ctrl+V) — رتّب، دوّر، خصّص ثم صدّر' : 'Drop images or paste (Ctrl+V) — arrange, rotate, customize, export'}</p>
        </div>
        {images.length > 0 && (
          <span className="text-[9px] font-mono text-gray-400 bg-white/5 border border-white/10 rounded-full px-2.5 py-1">
            {images.length} 🖼️ · {images.reduce((s, i) => s + i.sizeBytes, 0) > 0 ? `${Math.round(totalBytes / 1024)} KB` : '0 B'}
          </span>
        )}
      </div>

      <div className="flex border-b border-[#2D3139] bg-[#14171C] sm:hidden shrink-0">
        {[
          { id: 'upload', label: lang === 'ar' ? 'رفع' : 'Upload' },
          { id: 'images', label: lang === 'ar' ? `صور (${images.length})` : `Images (${images.length})` },
          { id: 'export', label: lang === 'ar' ? 'تصدير' : 'Export' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setMobileTab(tab.id as any)}
            className={cn("flex-1 py-2.5 font-mono text-[7px] uppercase tracking-widest transition-colors",
              mobileTab === tab.id ? "text-red-500 bg-[#1A1D23]" : "text-gray-500")}>
            {tab.label}
          </button>
        ))}
      </div>

      {dragOver && (
        <div className="absolute inset-0 z-50 bg-red-600/10 backdrop-blur-sm border-2 border-dashed border-red-500 m-3 rounded-2xl flex items-center justify-center pointer-events-none">
          <p className="text-red-400 font-bold text-sm">{lang === 'ar' ? 'أفلت الصور هنا 📥' : 'Drop images here 📥'}</p>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <aside className={cn("w-full sm:w-80 bg-[#14171C] border-r border-[#2D3139] flex-col shrink-0 overflow-y-auto", mobileTab === 'upload' || mobileTab === 'export' ? "flex" : "hidden sm:flex")}>
          <div className={cn(mobileTab === 'upload' ? "block" : "hidden sm:block")}>
            <UploadPanel
              lang={lang}
              imageCount={images.length}
              loading={loading}
              error={error}
              success={success}
              dragOver={dragOver}
              onFiles={handleFiles}
              onReverse={reverseOrder}
              onSortByName={sortByName}
              onClearAll={clearAll}
              fileInputRef={fileInputRef}
            />
          </div>

          <div className={cn("flex-col flex-1", mobileTab === 'export' ? "flex" : "hidden sm:flex")}>
            <SettingsPanel
              lang={lang}
              settings={settings}
              onChange={updateSettings}
              imageCount={images.length}
              totalBytes={totalBytes}
              generating={generating}
              progress={progress}
              onDownload={() => generatePdf('download')}
              onPreview={() => generatePdf('preview')}
            />
          </div>
        </aside>

        <section className={cn("flex-1 overflow-y-auto bg-[#0A0C0F]", mobileTab === 'images' ? "flex flex-col" : "hidden sm:flex sm:flex-col")}>
          {images.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center max-w-xs">
                <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                  <FileText size={26} className="text-red-500/60" />
                </div>
                <p className="text-[11px] font-bold text-gray-300 mb-1">{lang === 'ar' ? 'اسحب الصور هنا' : 'Drop images here'}</p>
                <p className="text-[9px] font-mono text-gray-600 leading-relaxed">{lang === 'ar' ? 'أو الصق من الحافظة (Ctrl+V) — يمكنك إعادة الترتيب بالسحب' : 'Or paste from clipboard (Ctrl+V) — drag to reorder'}</p>
                <button onClick={() => fileInputRef.current?.click()} className="mt-4 px-5 py-2.5 rounded-lg bg-red-600/20 border border-red-500/40 text-red-400 text-[10px] font-mono font-bold hover:bg-red-600/30 transition-all">
                  {lang === 'ar' ? '📁 اختر صور' : '📁 Browse images'}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-3 text-[9px] font-mono text-gray-500 flex-wrap">
                <span>{images.length} {lang === 'ar' ? 'صورة' : 'images'}</span>
                <span className="text-gray-700">|</span>
                <span className="text-red-400/70">{settings.pageSize.toUpperCase()} · {settings.imagesPerPage}/{lang === 'ar' ? 'صفحة' : 'page'} · {settings.fitMode}</span>
                <span className="text-gray-700">|</span>
                <span className="text-gray-600">{lang === 'ar' ? 'اسحب لإعادة الترتيب' : 'drag to reorder'}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {images.map((img, index) => (
                  <ImageCard
                    key={img.id}
                    img={img}
                    index={index}
                    total={images.length}
                    lang={lang}
                    bgColor={settings.bgColor}
                    grayscale={settings.grayscale}
                    isDragging={dragIndex === index}
                    onCrop={() => openCrop(img)}
                    onRotate={() => rotateImage(img.id)}
                    onDuplicate={() => duplicateImage(img.id)}
                    onRemove={() => removeImage(img.id)}
                    onRename={name => renameImage(img.id, name)}
                    onMoveUp={() => moveImage(index, 'up')}
                    onMoveDown={() => moveImage(index, 'down')}
                    onDragStart={() => onDragStart(index)}
                    onDragOver={e => onDragOverCard(e, index)}
                    onDragEnd={() => setDragIndex(null)}
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
          accent="red"
          canRestore={!!cropTarget.originalDataUrl}
          onApply={applyCrop}
          onRestore={resetCrop}
          onClose={() => setCropTarget(null)}
        />
      )}
    </div>
  );
}
