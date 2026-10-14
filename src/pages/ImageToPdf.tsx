import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Download, Loader2, Trash2, ImagePlus, FileDown, ArrowUp, ArrowDown, FileText, RotateCw, Copy, Eye, ArrowLeftRight, Palette, Settings2, FileCog } from 'lucide-react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { cn } from '../lib/utils';
import type { FileHandoff } from '../types/app';

interface Props {
  t: any;
  lang: 'ar' | 'en';
  fileHandoff: FileHandoff | null;
  onFileHandoffConsumed: (id: number) => void;
}

interface ImageItem {
  id: number;
  name: string;
  dataUrl: string;
  width: number;
  height: number;
  rotation: number; // 0 | 90 | 180 | 270
  sizeBytes: number;
}

type PageSizeKey = 'fit' | 'a5' | 'a4' | 'a3' | 'letter' | 'legal';
type FitMode = 'contain' | 'cover' | 'stretch';

const PAGE_SIZES: Record<Exclude<PageSizeKey, 'fit'>, { w: number; h: number }> = {
  a5: { w: 419.53, h: 595.28 },
  a4: { w: 595.28, h: 841.89 },
  a3: { w: 841.89, h: 1190.55 },
  letter: { w: 612, h: 792 },
  legal: { w: 612, h: 1008 },
};

const SETTINGS_KEY = 'unitool-img2pdf-settings';

export function ImageToPdf({ lang, fileHandoff, onFileHandoffConsumed }: Props) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // ---- PDF settings ----
  const [pageSize, setPageSize] = useState<PageSizeKey>('fit');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape' | 'auto'>('auto');
  const [fitMode, setFitMode] = useState<FitMode>('contain');
  const [margin, setMargin] = useState(20);
  const [imagesPerPage, setImagesPerPage] = useState<1 | 2 | 4>(1);
  const [quality, setQuality] = useState(0.92);
  const [imageFormat, setImageFormat] = useState<'auto' | 'jpeg' | 'png'>('auto');
  const [grayscale, setGrayscale] = useState(false);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [showPageNumbers, setShowPageNumbers] = useState(false);
  const [fileName, setFileName] = useState('images');
  const [pdfTitle, setPdfTitle] = useState('');
  const [pdfAuthor, setPdfAuthor] = useState('');

  const idRef = useRef(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastHandoffId = useRef<number | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [mobileTab, setMobileTab] = useState<'upload' | 'images' | 'export'>('upload');

  // load persisted settings
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s.pageSize) setPageSize(s.pageSize);
        if (s.orientation) setOrientation(s.orientation);
        if (s.fitMode) setFitMode(s.fitMode);
        if (typeof s.margin === 'number') setMargin(s.margin);
        if (s.imagesPerPage) setImagesPerPage(s.imagesPerPage);
        if (typeof s.quality === 'number') setQuality(s.quality);
        if (s.imageFormat) setImageFormat(s.imageFormat);
        if (typeof s.grayscale === 'boolean') setGrayscale(s.grayscale);
        if (s.bgColor) setBgColor(s.bgColor);
        if (typeof s.showPageNumbers === 'boolean') setShowPageNumbers(s.showPageNumbers);
        if (s.fileName) setFileName(s.fileName);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      pageSize, orientation, fitMode, margin, imagesPerPage, quality, imageFormat, grayscale, bgColor, showPageNumbers, fileName,
    }));
  }, [pageSize, orientation, fitMode, margin, imagesPerPage, quality, imageFormat, grayscale, bgColor, showPageNumbers, fileName]);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(null), 4000);
    return () => clearTimeout(t);
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
    // accept heic/heif by extension fallback
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

  // paste support
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

  // ---- list ops ----
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
      const t = direction === 'up' ? index - 1 : index + 1;
      if (t < 0 || t >= next.length) return prev;
      [next[index], next[t]] = [next[t], next[index]];
      return next;
    });
  };

  // HTML5 drag reorder
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

  // ---- PDF helpers ----
  const getPageSize = (imgW: number, imgH: number) => {
    if (pageSize === 'fit') return { width: imgW + margin * 2, height: imgH + margin * 2 };
    const base = PAGE_SIZES[pageSize];
    if (orientation === 'landscape') return { width: Math.max(base.w, base.h), height: Math.min(base.w, base.h) };
    if (orientation === 'portrait') return { width: Math.min(base.w, base.h), height: Math.max(base.w, base.h) };
    return imgW > imgH
      ? { width: Math.max(base.w, base.h), height: Math.min(base.w, base.h) }
      : { width: Math.min(base.w, base.h), height: Math.max(base.w, base.h) };
  };

  const hexToPdfRgb = (hex: string) => {
    const h = hex.replace('#', '');
    const v = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
    const n = parseInt(v, 16);
    return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
  };

  /** render image -> processed bytes (rotation + grayscale + bg + quality) */
  const processImageBytes = async (item: ImageItem): Promise<{ bytes: Uint8Array; isPng: boolean }> => {
    const img = new Image();
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error('decode'));
      img.src = item.dataUrl;
    });
    const rot = ((item.rotation % 360) + 360) % 360;
    const swap = rot === 90 || rot === 270;
    const w = swap ? img.naturalHeight : img.naturalWidth;
    const h = swap ? img.naturalWidth : img.naturalHeight;
    // downscale huge images to max 3000px to keep PDF small
    const MAX = 3000;
    const scale = Math.min(1, MAX / Math.max(w, h));
    const cw = Math.round(w * scale), ch = Math.round(h * scale);
    const canvas = document.createElement('canvas');
    canvas.width = cw; canvas.height = ch;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, cw, ch);
    if (grayscale) ctx.filter = 'grayscale(1)';
    ctx.save();
    ctx.translate(cw / 2, ch / 2);
    ctx.rotate((rot * Math.PI) / 180);
    const dw = (rot === 90 || rot === 270) ? ch : cw;
    const dh = (rot === 90 || rot === 270) ? cw : ch;
    ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();

    const wantPng = imageFormat === 'png' || (imageFormat === 'auto' && item.dataUrl.startsWith('data:image/png') && quality >= 0.95 && !grayscale);
    const mime = wantPng ? 'image/png' : 'image/jpeg';
    const dataUrl = canvas.toDataURL(mime, wantPng ? undefined : quality);
    const res = await fetch(dataUrl);
    const buf = new Uint8Array(await res.arrayBuffer());
    return { bytes: buf, isPng: wantPng };
  };

  const buildPdf = async (): Promise<Uint8Array> => {
    const pdfDoc = await PDFDocument.create();
    if (pdfTitle) pdfDoc.setTitle(pdfTitle);
    if (pdfAuthor) pdfDoc.setAuthor(pdfAuthor);
    pdfDoc.setCreator('UniTool');
    pdfDoc.setProducer('UniTool ImageToPDF');

    const font = showPageNumbers ? await pdfDoc.embedFont(StandardFonts.Helvetica) : null;
    let pageCounter = 0;

    const perPage = imagesPerPage;
    for (let i = 0; i < images.length; i += perPage) {
      const chunk = images.slice(i, i + perPage);
      // page size from first image (rotated dims)
      const first = chunk[0];
      const fSwap = first.rotation === 90 || first.rotation === 270;
      const fw = fSwap ? first.height : first.width;
      const fh = fSwap ? first.width : first.height;
      const { width: pageW, height: pageH } = getPageSize(fw, fh);
      const page = pdfDoc.addPage([pageW, pageH]);
      pageCounter++;
      // paint background
      page.drawRectangle({ x: 0, y: 0, width: pageW, height: pageH, color: hexToPdfRgb(bgColor) });

      // cell layout
      const cols = perPage === 1 ? 1 : 2;
      const rows = perPage === 1 ? 1 : perPage === 2 ? 2 : 2;
      const gap = Math.min(margin, 24);
      const cellW = (pageW - margin * 2 - gap * (cols - 1)) / cols;
      const cellH = (pageH - margin * 2 - gap * (rows - 1) - (showPageNumbers ? 22 : 0)) / rows;

      for (let c = 0; c < chunk.length; c++) {
        const item = chunk[c];
        const { bytes, isPng } = await processImageBytes(item);
        const embedded = isPng ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);
        const col = c % cols, row = Math.floor(c / cols);
        const cx = margin + col * (cellW + gap);
        // pdf y is bottom-origin -> flip rows
        const cyTop = margin + (rows - 1 - row) * (cellH + gap) + (showPageNumbers ? 22 : 0);
        const cy = cyTop;

        const iw = embedded.width, ih = embedded.height;
        let dw: number, dh: number, dx: number, dy: number;
        if (fitMode === 'stretch') {
          dw = cellW; dh = cellH; dx = cx; dy = cy;
        } else if (fitMode === 'cover') {
          const s = Math.max(cellW / iw, cellH / ih);
          dw = iw * s; dh = ih * s;
          dx = cx + (cellW - dw) / 2; dy = cy + (cellH - dh) / 2;
        } else {
          const s = Math.min(cellW / iw, cellH / ih);
          dw = iw * s; dh = ih * s;
          dx = cx + (cellW - dw) / 2; dy = cy + (cellH - dh) / 2;
        }
        page.drawImage(embedded, { x: dx, y: dy, width: dw, height: dh });
        setProgress(Math.round(((i + c + 1) / images.length) * 90));
      }

      if (showPageNumbers && font) {
        const label = `${pageCounter}`;
        const fs = 10;
        const tw = font.widthOfTextAtSize(label, fs);
        page.drawText(label, { x: (pageW - tw) / 2, y: 10, size: fs, font, color: rgb(0.45, 0.45, 0.45) });
      }
    }
    return pdfDoc.save();
  };

  const safeFileName = () => {
    const base = (fileName.trim() || 'images').replace(/[\\/:*?"<>|]/g, '-').slice(0, 80);
    return `${base}.pdf`;
  };

  const generatePdf = async (mode: 'download' | 'preview') => {
    if (images.length === 0 || generating) return;
    setGenerating(true);
    setProgress(5);
    setError(null);
    try {
      const bytes = await buildPdf();
      setProgress(100);
      const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      if (mode === 'preview') {
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      } else {
        const a = document.createElement('a');
        a.href = url;
        a.download = safeFileName();
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

  const totalBytes = images.reduce((s, i) => s + (i.sizeBytes || 0), 0);
  const estPdfMb = images.length === 0 ? 0 : (images.length * (imageFormat === 'png' ? 1.2 : quality) * 0.35);

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.min(sizes.length - 1, Math.floor(Math.log(bytes) / Math.log(k)));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

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
          <span className="text-[9px] font-mono text-gray-400 bg-white/5 border border-white/10 rounded-full px-2.5 py-1">{images.length} 📷 · {formatBytes(totalBytes)}</span>
        )}
      </div>

      {/* Mobile Tabs */}
      <div className="flex border-b border-[#2D3139] bg-[#14171C] sm:hidden shrink-0">
        {[
          { id: 'upload', label: lang === 'ar' ? 'رفع' : 'Upload', icon: Upload },
          { id: 'images', label: lang === 'ar' ? `صور (${images.length})` : `Images (${images.length})`, icon: ImagePlus },
          { id: 'export', label: lang === 'ar' ? 'تصدير' : 'Export', icon: FileDown },
        ].map(tab => (
          <button key={tab.id} onClick={() => setMobileTab(tab.id as any)}
            className={cn("flex-1 py-2.5 flex flex-col items-center gap-1 font-mono text-[7px] uppercase tracking-widest transition-colors", mobileTab === tab.id ? "text-red-500 bg-[#1A1D23]" : "text-gray-500")}>
            <tab.icon size={12} />
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
        {/* Sidebar */}
        <aside className={cn("w-full sm:w-80 bg-[#14171C] border-r border-[#2D3139] flex-col shrink-0 overflow-y-auto", mobileTab === 'upload' || mobileTab === 'export' ? "flex" : "hidden sm:flex")}>
          {/* Upload */}
          <div className={cn(mobileTab === 'upload' ? "block" : "hidden sm:block")}>
            <div className="p-3 border-b border-[#2D3139] sm:p-4">
              <label className={cn("flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed rounded-lg cursor-pointer transition-colors bg-[#0F1115]", dragOver ? "border-red-500 bg-red-500/5" : images.length > 0 ? "border-red-500/30 hover:border-red-500/60" : "border-[#2D3139] hover:border-red-500/50")}>
                <ImagePlus size={22} className={images.length > 0 ? "text-red-500" : "text-gray-500"} />
                <span className="text-[10px] font-mono text-gray-300 text-center leading-relaxed font-bold">
                  {images.length > 0 ? (lang === 'ar' ? 'إضافة المزيد (سحب / لصق / اختيار)' : 'Add more (drop / paste / browse)') : (lang === 'ar' ? 'اختر صور أو اسحبها هنا' : 'Select or drop images')}
                </span>
                <span className="text-[7px] font-mono text-gray-600">PNG · JPG · WEBP · BMP · GIF · AVIF</span>
                <input ref={fileInputRef} type="file" accept="image/*,.heic,.heif" multiple className="hidden" onChange={handleFiles} />
              </label>
              {error && <p className="text-[9px] text-red-400 mt-2 font-mono bg-red-500/10 border border-red-500/20 rounded p-2">{error}</p>}
              {success && <p className="text-[9px] text-green-400 mt-2 font-mono bg-green-500/10 border border-green-500/20 rounded p-2">✅ {success}</p>}
              {loading && (
                <div className="flex items-center gap-2 mt-3 text-[9px] text-gray-400 font-mono">
                  <Loader2 size={11} className="animate-spin" />
                  {lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                </div>
              )}
              {images.length > 0 && (
                <div className="flex gap-2 mt-3">
                  <button onClick={reverseOrder} title={lang === 'ar' ? 'عكس الترتيب' : 'Reverse'} className="flex-1 py-2 flex items-center justify-center gap-1.5 text-[9px] font-mono text-gray-300 hover:text-white border border-[#2D3139] hover:border-gray-500 rounded-md transition-all bg-[#0F1115]">
                    <ArrowLeftRight size={11} />{lang === 'ar' ? 'عكس' : 'Reverse'}
                  </button>
                  <button onClick={sortByName} className="flex-1 py-2 flex items-center justify-center gap-1.5 text-[9px] font-mono text-gray-300 hover:text-white border border-[#2D3139] hover:border-gray-500 rounded-md transition-all bg-[#0F1115]">
                    A-Z ↓
                  </button>
                  <button onClick={clearAll} className="flex-1 py-2 flex items-center justify-center gap-1.5 text-[9px] font-mono text-red-400 hover:text-red-300 border border-red-900/30 hover:border-red-500/50 rounded-md transition-all bg-red-950/20">
                    <Trash2 size={11} />{lang === 'ar' ? 'مسح' : 'Clear'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Settings */}
          <div className={cn("flex-col flex-1", mobileTab === 'export' ? "flex" : "hidden sm:flex")}>
            <div className="p-3 sm:p-4 space-y-4">
              {/* page */}
              <div className="bg-[#0F1115] border border-[#2D3139] rounded-lg p-3">
                <h3 className="text-[10px] font-bold text-gray-300 mb-2.5 flex items-center gap-1.5"><Settings2 size={12} className="text-red-500" />{lang === 'ar' ? 'الصفحة والتخطيط' : 'Page & Layout'}</h3>
                <label className="text-[9px] font-mono text-gray-500 uppercase">{lang === 'ar' ? 'حجم الصفحة' : 'Page Size'}</label>
                <div className="grid grid-cols-3 gap-1 mt-1.5">
                  {(['fit', 'a5', 'a4', 'a3', 'letter', 'legal'] as const).map(s => (
                    <button key={s} onClick={() => setPageSize(s)}
                      className={cn("py-2 text-[9px] font-mono uppercase rounded-md border transition-all",
                        pageSize === s ? "bg-red-600/20 border-red-500/40 text-red-400 font-bold" : "bg-[#14171C] border-[#2D3139] text-gray-500 hover:border-gray-500")}>
                      {s === 'fit' ? (lang === 'ar' ? 'ملائم' : 'Fit') : s.toUpperCase()}
                    </button>
                  ))}
                </div>
                {pageSize !== 'fit' && (
                  <div className="flex gap-1 mt-2">
                    {(['auto', 'portrait', 'landscape'] as const).map(o => (
                      <button key={o} onClick={() => setOrientation(o)}
                        className={cn("flex-1 py-1.5 text-[8px] font-mono rounded-md border transition-all",
                          orientation === o ? "bg-red-600/20 border-red-500/40 text-red-400" : "bg-[#14171C] border-[#2D3139] text-gray-500")}>
                        {o === 'auto' ? (lang === 'ar' ? 'تلقائي' : 'Auto') : o === 'portrait' ? (lang === 'ar' ? 'عمودي' : 'Portrait') : (lang === 'ar' ? 'أفقي' : 'Landscape')}
                      </button>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div>
                    <label className="text-[9px] font-mono text-gray-500 uppercase">{lang === 'ar' ? 'ملاءمة الصورة' : 'Fit mode'}</label>
                    <div className="flex gap-1 mt-1.5">
                      {(['contain', 'cover', 'stretch'] as const).map(f => (
                        <button key={f} onClick={() => setFitMode(f)} title={f}
                          className={cn("flex-1 py-1.5 text-[8px] font-mono rounded-md border",
                            fitMode === f ? "bg-red-600/20 border-red-500/40 text-red-400 font-bold" : "bg-[#14171C] border-[#2D3139] text-gray-500")}>
                          {f === 'contain' ? (lang === 'ar' ? 'احتواء' : 'Fit') : f === 'cover' ? (lang === 'ar' ? 'ملء' : 'Fill') : (lang === 'ar' ? 'تمدد' : 'Stretch')}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-mono text-gray-500 uppercase">{lang === 'ar' ? 'صور / صفحة' : 'Per page'}</label>
                    <div className="flex gap-1 mt-1.5">
                      {([1, 2, 4] as const).map(n => (
                        <button key={n} onClick={() => setImagesPerPage(n)}
                          className={cn("flex-1 py-1.5 text-[10px] font-mono rounded-md border font-bold",
                            imagesPerPage === n ? "bg-red-600/20 border-red-500/40 text-red-400" : "bg-[#14171C] border-[#2D3139] text-gray-500")}>
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <label className="text-[9px] font-mono text-gray-500 uppercase">{lang === 'ar' ? 'الهامش' : 'Margin'}: {margin}px</label>
                  <input type="range" min="0" max="100" step="2" value={margin} onChange={e => setMargin(+e.target.value)} className="w-full mt-1 accent-red-500" />
                </div>
              </div>

              {/* quality */}
              <div className="bg-[#0F1115] border border-[#2D3139] rounded-lg p-3">
                <h3 className="text-[10px] font-bold text-gray-300 mb-2.5 flex items-center gap-1.5"><Palette size={12} className="text-red-500" />{lang === 'ar' ? 'الجودة والألوان' : 'Quality & Color'}</h3>
                <label className="text-[9px] font-mono text-gray-500 uppercase">{lang === 'ar' ? 'جودة الضغط' : 'JPEG Quality'}: {Math.round(quality * 100)}%</label>
                <input type="range" min="0.3" max="1" step="0.02" value={quality} onChange={e => setQuality(+e.target.value)} className="w-full mt-1 accent-red-500" />
                <div className="flex justify-between text-[7px] font-mono text-gray-600"><span>{lang === 'ar' ? 'أصغر حجم' : 'Smaller'}</span><span>{lang === 'ar' ? 'أعلى جودة' : 'Best'}</span></div>
                <div className="flex gap-1 mt-2.5">
                  <label className="text-[9px] font-mono text-gray-500 uppercase self-center">{lang === 'ar' ? 'الصيغة' : 'Format'}:</label>
                  {(['auto', 'jpeg', 'png'] as const).map(f => (
                    <button key={f} onClick={() => setImageFormat(f)}
                      className={cn("flex-1 py-1.5 text-[8px] font-mono uppercase rounded-md border",
                        imageFormat === f ? "bg-red-600/20 border-red-500/40 text-red-400 font-bold" : "bg-[#14171C] border-[#2D3139] text-gray-500")}>
                      {f}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-2.5">
                  <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-8 h-7 rounded cursor-pointer bg-transparent border border-[#2D3139]" />
                  <span className="text-[9px] font-mono text-gray-400">{lang === 'ar' ? 'لون الخلفية' : 'Background'} {bgColor}</span>
                  <div className="flex gap-1 ms-auto">
                    {['#ffffff', '#000000', '#f3f4f6', '#fef3c7'].map(c => (
                      <button key={c} onClick={() => setBgColor(c)} className={cn("w-5 h-5 rounded-full border", bgColor === c ? "border-red-500 ring-1 ring-red-500" : "border-gray-600")} style={{ background: c }} />
                    ))}
                  </div>
                </div>
                <label className="flex items-center gap-2 mt-2.5 cursor-pointer">
                  <input type="checkbox" checked={grayscale} onChange={e => setGrayscale(e.target.checked)} className="accent-red-500 w-3.5 h-3.5" />
                  <span className="text-[9px] font-mono text-gray-400">{lang === 'ar' ? 'تحويل لأبيض وأسود' : 'Grayscale (B&W)'}</span>
                </label>
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <input type="checkbox" checked={showPageNumbers} onChange={e => setShowPageNumbers(e.target.checked)} className="accent-red-500 w-3.5 h-3.5" />
                  <span className="text-[9px] font-mono text-gray-400">{lang === 'ar' ? 'ترقيم الصفحات' : 'Page numbers'}</span>
                </label>
              </div>

              {/* meta */}
              <div className="bg-[#0F1115] border border-[#2D3139] rounded-lg p-3">
                <h3 className="text-[10px] font-bold text-gray-300 mb-2.5 flex items-center gap-1.5"><FileCog size={12} className="text-red-500" />{lang === 'ar' ? 'اسم الملف والبيانات' : 'File & Metadata'}</h3>
                <input value={fileName} onChange={e => setFileName(e.target.value)} placeholder={lang === 'ar' ? 'اسم الملف' : 'File name'}
                  className="w-full bg-[#14171C] border border-[#2D3139] rounded-md px-2.5 py-2 text-[10px] font-mono text-white placeholder:text-gray-600 focus:border-red-500/60 outline-none" />
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <input value={pdfTitle} onChange={e => setPdfTitle(e.target.value)} placeholder={lang === 'ar' ? 'عنوان PDF' : 'PDF title'}
                    className="bg-[#14171C] border border-[#2D3139] rounded-md px-2.5 py-2 text-[10px] font-mono text-white placeholder:text-gray-600 focus:border-red-500/60 outline-none" />
                  <input value={pdfAuthor} onChange={e => setPdfAuthor(e.target.value)} placeholder={lang === 'ar' ? 'المؤلف' : 'Author'}
                    className="bg-[#14171C] border border-[#2D3139] rounded-md px-2.5 py-2 text-[10px] font-mono text-white placeholder:text-gray-600 focus:border-red-500/60 outline-none" />
                </div>
              </div>

              {images.length > 0 && (
                <div className="bg-[#0F1115] border border-[#2D3139] rounded-lg p-3">
                  <div className="space-y-1.5 text-[9px] font-mono text-gray-500">
                    <div className="flex justify-between"><span>{lang === 'ar' ? 'الصور' : 'Images'}:</span><span className="text-white font-bold">{images.length}</span></div>
                    <div className="flex justify-between"><span>{lang === 'ar' ? 'الصفحات' : 'Pages'}:</span><span className="text-white font-bold">{Math.ceil(images.length / imagesPerPage)}</span></div>
                    <div className="flex justify-between"><span>{lang === 'ar' ? 'الحجم الأصلي' : 'Original'}:</span><span className="text-gray-300">{formatBytes(totalBytes)}</span></div>
                    <div className="flex justify-between"><span>{lang === 'ar' ? 'التقديري' : 'Est. PDF'}:</span><span className="text-green-400">~{estPdfMb.toFixed(1)} MB</span></div>
                  </div>
                </div>
              )}

              {generating && (
                <div className="bg-[#0F1115] border border-red-500/30 rounded-lg p-3">
                  <div className="flex justify-between text-[9px] font-mono text-red-400 mb-1.5"><span>{lang === 'ar' ? 'جاري الإنشاء...' : 'Building...'} {progress}%</span><Loader2 size={11} className="animate-spin" /></div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-red-600 to-rose-500 transition-all" style={{ width: `${progress}%` }} /></div>
                </div>
              )}

              <div className="flex gap-2 pb-2">
                <button onClick={() => generatePdf('download')} disabled={images.length === 0 || generating}
                  className={cn("flex-1 py-3 flex items-center justify-center gap-2 text-[10px] font-mono font-bold uppercase tracking-wider rounded-lg transition-all",
                    images.length > 0 ? "bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-500 hover:to-rose-500 shadow-lg shadow-red-500/20" : "bg-[#2D3139] text-gray-600 cursor-not-allowed")}>
                  {generating ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                  {generating ? `${progress}%` : (lang === 'ar' ? 'تحميل PDF' : 'Download PDF')}
                </button>
                <button onClick={() => generatePdf('preview')} disabled={images.length === 0 || generating} title={lang === 'ar' ? 'معاينة' : 'Preview'}
                  className="px-3.5 py-3 rounded-lg border border-[#2D3139] bg-[#0F1115] text-gray-300 hover:border-red-500/50 hover:text-white transition-all disabled:opacity-40">
                  <Eye size={14} />
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Images Grid */}
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
                <ImagePlus size={12} />
                <span>{images.length} {lang === 'ar' ? 'صورة' : 'images'}</span>
                <span className="text-gray-700">|</span>
                <span className="text-red-400/70">{pageSize.toUpperCase()} · {imagesPerPage}/{lang === 'ar' ? 'صفحة' : 'page'} · {fitMode}</span>
                <span className="text-gray-700">|</span>
                <span className="text-gray-600">{lang === 'ar' ? 'اسحب لإعادة الترتيب' : 'drag to reorder'}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {images.map((img, index) => (
                  <div key={img.id}
                    draggable
                    onDragStart={() => onDragStart(index)}
                    onDragOver={e => onDragOverCard(e, index)}
                    onDragEnd={() => setDragIndex(null)}
                    className={cn("relative rounded-lg overflow-hidden border group bg-[#1A1D23] cursor-grab active:cursor-grabbing transition-all",
                      dragIndex === index ? "border-red-500 opacity-50 scale-95" : "border-[#2D3139] hover:border-red-500/40")}>
                    <div className="relative aspect-[3/4] flex items-center justify-center overflow-hidden" style={{ background: bgColor }}>
                      <img src={img.dataUrl} alt={img.name} className="max-w-full max-h-full object-contain pointer-events-none" draggable={false}
                        style={{ transform: `rotate(${img.rotation}deg)`, filter: grayscale ? 'grayscale(1)' : undefined, maxWidth: img.rotation % 180 !== 0 ? '75%' : '100%' }} />
                      <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-[8px] font-mono font-bold text-white">#{index + 1}</div>
                      {img.rotation !== 0 && <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-blue-600/80 text-[7px] font-mono text-white">↻{img.rotation}°</div>}
                    </div>
                    <div className="p-2">
                      <input value={img.name} onChange={e => renameImage(img.id, e.target.value)}
                        className="w-full bg-transparent text-[9px] font-mono text-white truncate leading-tight outline-none focus:bg-black/40 rounded px-1 -mx-1 border border-transparent focus:border-red-500/40" />
                      <p className="text-[7px] font-mono text-gray-500 mt-0.5">{img.width}×{img.height} · {formatBytes(img.sizeBytes)}</p>
                    </div>
                    {/* actions */}
                    <div className="absolute bottom-9 right-1 flex gap-1 opacity-0 group-hover:opacity-100 max-sm:opacity-100 transition-opacity">
                      <button onClick={() => rotateImage(img.id)} title={lang === 'ar' ? 'تدوير' : 'Rotate'} className="w-6 h-6 rounded-full bg-black/70 hover:bg-blue-600 flex items-center justify-center transition-colors">
                        <RotateCw size={11} className="text-white" />
                      </button>
                      <button onClick={() => duplicateImage(img.id)} title={lang === 'ar' ? 'نسخ' : 'Duplicate'} className="w-6 h-6 rounded-full bg-black/70 hover:bg-green-600 flex items-center justify-center transition-colors">
                        <Copy size={11} className="text-white" />
                      </button>
                      <button onClick={() => removeImage(img.id)} title={lang === 'ar' ? 'حذف' : 'Delete'} className="w-6 h-6 rounded-full bg-black/70 hover:bg-red-600 flex items-center justify-center transition-colors">
                        <Trash2 size={11} className="text-white" />
                      </button>
                    </div>
                    <div className="absolute top-7 left-1 hidden group-hover:flex-col gap-1 group-hover:flex">
                      {index > 0 && (
                        <button onClick={() => moveImage(index, 'up')} className="w-5 h-5 rounded-full bg-black/70 hover:bg-red-500 flex items-center justify-center transition-colors">
                          <ArrowUp size={10} className="text-white" />
                        </button>
                      )}
                      {index < images.length - 1 && (
                        <button onClick={() => moveImage(index, 'down')} className="w-5 h-5 rounded-full bg-black/70 hover:bg-red-500 flex items-center justify-center transition-colors">
                          <ArrowDown size={10} className="text-white" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
