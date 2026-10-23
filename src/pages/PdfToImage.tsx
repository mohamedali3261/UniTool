import { useState, useCallback, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Upload, Download, Loader2, FileImage, CheckSquare, Square, FileType2, FileDown, Trash2, ImagePlus, Scissors, Percent, FileText, X, RotateCcw, Check } from 'lucide-react';
import JSZip from 'jszip';
import { cn } from '../lib/utils';
import type { FileHandoffTarget } from '../types/app';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface Props {
  t: any;
  lang: 'ar' | 'en';
  onSendFilesToTool: (target: FileHandoffTarget, files: File[]) => void;
}

interface PageImage {
  id: number;
  dataUrl: string;
  width: number;
  height: number;
  name: string;
  originalDataUrl?: string;
  originalWidth?: number;
  originalHeight?: number;
}

interface CropBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

const MIN_CROP_SIZE = 20;

export function PdfToImage({ t, lang, onSendFilesToTool }: Props) {
  const [pages, setPages] = useState<PageImage[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [format, setFormat] = useState<'png' | 'jpeg'>('png');
  const [quality, setQuality] = useState(0.92);
  const [loading, setLoading] = useState(false);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'upload' | 'pages' | 'export'>('upload');
  const [nextId, setNextId] = useState(1);
  const [sendingToTool, setSendingToTool] = useState(false);

  const [cropTarget, setCropTarget] = useState<PageImage | null>(null);
  const [cropBox, setCropBox] = useState<CropBox>({ x: 0, y: 0, width: 0, height: 0 });
  const [cropDisplaySize, setCropDisplaySize] = useState({ width: 0, height: 0 });
  const [cropDrag, setCropDrag] = useState<{ type: 'move' | 'resize'; handle: string } | null>(null);
  const cropImgRef = useRef<HTMLImageElement | null>(null);
  const cropDragRef = useRef<{ startX: number; startY: number; box: CropBox } | null>(null);

  const loadImageAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const loadImageToCanvas = (dataUrl: string): Promise<{ dataUrl: string; width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.width;
        c.height = img.height;
        const ctx = c.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        resolve({ dataUrl: c.toDataURL('image/png'), width: img.width, height: img.height });
      };
      img.onerror = reject;
      img.src = dataUrl;
    });
  };

  const loadPdfPages = async (file: File): Promise<PageImage[]> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
    const result: PageImage[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await (page.render as any)({ canvas, canvasContext: ctx, viewport }).promise;
      result.push({
        id: 0,
        dataUrl: canvas.toDataURL('image/png'),
        width: viewport.width,
        height: viewport.height,
        name: `${file.name.replace(/\.pdf$/i, '')}_page_${i}`,
      });
    }
    return result;
  };

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
    } catch (err) {
      setError(lang === 'ar' ? 'فشل تحميل الملف' : 'Failed to load file');
    } finally {
      setLoading(false);
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

  const openCrop = (page: PageImage) => {
    setCropTarget(page);
    setCropDisplaySize({ width: 0, height: 0 });
    setCropBox({ x: 0, y: 0, width: 0, height: 0 });
  };

  const closeCrop = () => {
    setCropTarget(null);
    setCropDrag(null);
    cropDragRef.current = null;
  };

  const handleCropImageLoad = () => {
    const img = cropImgRef.current;
    if (!img) return;
    const rect = img.getBoundingClientRect();
    const width = Math.round(rect.width);
    const height = Math.round(rect.height);
    if (width === 0 || height === 0) return;
    setCropDisplaySize({ width, height });
    setCropBox({
      x: Math.round(width * 0.08),
      y: Math.round(height * 0.08),
      width: Math.round(width * 0.84),
      height: Math.round(height * 0.84),
    });
  };

  const startCropDrag = (e: React.PointerEvent, type: 'move' | 'resize', handle = '') => {
    if (cropDisplaySize.width === 0) return;
    e.preventDefault();
    e.stopPropagation();
    cropDragRef.current = { startX: e.clientX, startY: e.clientY, box: { ...cropBox } };
    setCropDrag({ type, handle });
  };

  useEffect(() => {
    if (!cropDrag) return;
    const move = (e: PointerEvent) => {
      const start = cropDragRef.current;
      if (!start) return;
      const { width: dsW, height: dsH } = cropDisplaySize;
      if (dsW === 0 || dsH === 0) return;
      const dx = e.clientX - start.startX;
      const dy = e.clientY - start.startY;
      const b = start.box;
      const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

      if (cropDrag.type === 'move') {
        setCropBox({
          ...b,
          x: clamp(b.x + dx, 0, dsW - b.width),
          y: clamp(b.y + dy, 0, dsH - b.height),
        });
        return;
      }

      let nx = b.x;
      let ny = b.y;
      let nw = b.width;
      let nh = b.height;
      const h = cropDrag.handle;
      if (h.includes('e')) nw = clamp(b.width + dx, MIN_CROP_SIZE, dsW - b.x);
      if (h.includes('s')) nh = clamp(b.height + dy, MIN_CROP_SIZE, dsH - b.y);
      if (h.includes('w')) {
        nw = clamp(b.width - dx, MIN_CROP_SIZE, b.x + b.width);
        nx = b.x + b.width - nw;
      }
      if (h.includes('n')) {
        nh = clamp(b.height - dy, MIN_CROP_SIZE, b.y + b.height);
        ny = b.y + b.height - nh;
      }
      setCropBox({ x: nx, y: ny, width: nw, height: nh });
    };
    const end = () => setCropDrag(null);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
    };
  }, [cropDrag, cropDisplaySize]);

  useEffect(() => {
    if (!cropTarget) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeCrop(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cropTarget]);

  const applyCrop = () => {
    const page = cropTarget;
    const img = cropImgRef.current;
    if (!page || !img || cropDisplaySize.width === 0) return;

    const scaleX = page.width / cropDisplaySize.width;
    const scaleY = page.height / cropDisplaySize.height;
    const sx = Math.max(0, Math.round(cropBox.x * scaleX));
    const sy = Math.max(0, Math.round(cropBox.y * scaleY));
    const sw = Math.min(page.width - sx, Math.max(1, Math.round(cropBox.width * scaleX)));
    const sh = Math.min(page.height - sy, Math.max(1, Math.round(cropBox.height * scaleY)));

    const c = document.createElement('canvas');
    c.width = sw;
    c.height = sh;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    const dataUrl = c.toDataURL('image/png');

    setPages(prev => prev.map(p => p.id === page.id ? {
      ...p,
      dataUrl,
      width: sw,
      height: sh,
      originalDataUrl: p.originalDataUrl ?? p.dataUrl,
      originalWidth: p.originalWidth ?? p.width,
      originalHeight: p.originalHeight ?? p.height,
    } : p));
    closeCrop();
  };

  const resetCrop = () => {
    const page = cropTarget;
    if (!page || !page.originalDataUrl) return;
    setPages(prev => prev.map(p => p.id === page.id ? {
      ...p,
      dataUrl: page.originalDataUrl!,
      width: page.originalWidth ?? p.width,
      height: page.originalHeight ?? p.height,
      originalDataUrl: undefined,
      originalWidth: undefined,
      originalHeight: undefined,
    } : p));
    closeCrop();
  };

  const canvasToBlob = (dataUrl: string): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.width;
        c.height = img.height;
        const ctx = c.getContext('2d')!;
        if (format === 'jpeg') {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, c.width, c.height);
        }
        ctx.drawImage(img, 0, 0);
        c.toBlob(blob => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to convert'));
        }, `image/${format === 'jpeg' ? 'jpeg' : 'png'}`, format === 'jpeg' ? quality : undefined);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = dataUrl;
    });
  };

  const downloadSingle = async (page: PageImage) => {
    const blob = await canvasToBlob(page.dataUrl);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${page.name}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
        const blob = await canvasToBlob(page.dataUrl);
        zip.file(`${page.name}.${format}`, blob);
      }
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `converted_images.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
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
        const blob = await canvasToBlob(page.dataUrl);
        return new File([blob], `${page.name}.${extension}`, { type: mime });
      }));
      onSendFilesToTool(target, files);
    } catch {
      setError(lang === 'ar' ? 'فشل تجهيز الصور للأداة التالية' : 'Failed to prepare images for the next tool');
    } finally {
      setSendingToTool(false);
    }
  };

  const acceptedTypes = '.pdf,image/*';
  const cropOutputWidth = cropTarget && cropDisplaySize.width > 0
    ? Math.max(1, Math.round(cropBox.width * cropTarget.width / cropDisplaySize.width))
    : 0;
  const cropOutputHeight = cropTarget && cropDisplaySize.height > 0
    ? Math.max(1, Math.round(cropBox.height * cropTarget.height / cropDisplaySize.height))
    : 0;

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

      {/* Mobile Tabs */}
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
        {/* Upload / Settings */}
        <aside className={cn(
          "w-full sm:w-64 bg-[#14171C] border-r border-[#2D3139] flex flex-col shrink-0 overflow-y-auto",
          mobileTab === 'upload' || mobileTab === 'export' ? "flex" : "hidden sm:flex"
        )}>
          {/* Upload */}
          <div className={cn(mobileTab === 'upload' ? "block" : "hidden sm:block")}>
            <div className="p-3 border-b border-[#2D3139] sm:p-4">
              <label className={cn(
                "flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-[#2D3139] rounded-lg cursor-pointer hover:border-orange-500/50 transition-colors bg-[#0F1115]",
                pages.length > 0 ? "border-orange-500/30" : ""
              )}>
                <ImagePlus size={20} className={pages.length > 0 ? "text-orange-500" : "text-gray-500"} />
                <span className="text-[9px] font-mono text-gray-400 text-center leading-relaxed">
                  {pages.length > 0
                    ? (lang === 'ar' ? 'إضافة المزيد من الملفات' : 'Add more files')
                    : (lang === 'ar' ? 'اختر صور أو ملف PDF' : 'Select images or PDF')}
                </span>
                <span className="text-[7px] font-mono text-gray-600">
                  {lang === 'ar' ? 'يدعم PDF, PNG, JPG, WEBP, GIF, BMP' : 'Supports PDF, PNG, JPG, WEBP, GIF, BMP'}
                </span>
                <input type="file" accept={acceptedTypes} multiple className="hidden" onChange={handleFiles} />
              </label>
              {error && <p className="text-[8px] text-red-400 mt-2 font-mono">{error}</p>}
              {loading && (
                <div className="flex items-center gap-2 mt-3 text-[8px] text-gray-400 font-mono">
                  <Loader2 size={10} className="animate-spin" />
                  {lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                </div>
              )}
              {pages.length > 0 && (
                <button
                  onClick={clearAll}
                  className="w-full mt-3 py-2 flex items-center justify-center gap-1.5 text-[8px] font-mono text-red-400 hover:text-red-300 border border-red-900/30 hover:border-red-500/50 rounded-md transition-all bg-red-950/20"
                >
                  <Trash2 size={10} />
                  {lang === 'ar' ? 'مسح الكل' : 'Clear all'}
                </button>
              )}
            </div>
          </div>

          {/* Export Settings */}
          <div className={cn("flex flex-col flex-1", mobileTab === 'export' ? "flex" : "hidden sm:flex")}>
            <div className="p-3 border-b border-[#2D3139] sm:p-4">
              <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3 sm:text-[10px]">
                {lang === 'ar' ? 'الإعدادات' : 'Settings'}
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-[8px] font-mono text-gray-500 uppercase tracking-wider sm:text-[9px]">
                    {lang === 'ar' ? 'الصيغة' : 'Format'}
                  </label>
                  <div className="flex gap-1 mt-1.5">
                    {(['png', 'jpeg'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setFormat(f)}
                        className={cn(
                          "flex-1 py-2 text-[9px] font-mono uppercase tracking-wider rounded-md border transition-all sm:py-2.5",
                          format === f
                            ? "bg-orange-600/20 border-orange-500/40 text-orange-400"
                            : "bg-[#0F1115] border-[#2D3139] text-gray-500 hover:border-gray-500"
                        )}
                      >
                        {f.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                {format === 'jpeg' && (
                  <div>
                    <label className="text-[8px] font-mono text-gray-500 uppercase tracking-wider sm:text-[9px]">
                      {lang === 'ar' ? 'الجودة' : 'Quality'}: {Math.round(quality * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.02"
                      value={quality}
                      onChange={e => setQuality(parseFloat(e.target.value))}
                      className="w-full mt-1.5 accent-orange-500"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Download */}
            <div className="p-3 mt-auto border-t border-[#2D3139] sm:p-4">
              <div className="flex items-center justify-between mb-2 text-[8px] font-mono text-gray-500 sm:text-[9px]">
                <span>{lang === 'ar' ? 'المحدد' : 'Selected'}: {selectedIds.size}/{pages.length}</span>
                <button onClick={toggleAll} className="text-orange-400 hover:text-orange-300 flex items-center gap-1">
                  {selectedIds.size === pages.length ? <Square size={10} /> : <CheckSquare size={10} />}
                  {selectedIds.size === pages.length
                    ? (lang === 'ar' ? 'إلغاء الكل' : 'Deselect')
                    : (lang === 'ar' ? 'تحديد الكل' : 'All')}
                </button>
              </div>
              <button
                onClick={downloadAll}
                disabled={selectedIds.size === 0 || converting || sendingToTool}
                className={cn(
                  "w-full py-3 flex items-center justify-center gap-2 text-[9px] font-mono uppercase tracking-wider rounded-lg transition-all sm:py-3.5",
                  selectedIds.size > 0
                    ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white hover:from-orange-500 hover:to-amber-500 shadow-lg shadow-orange-500/20"
                    : "bg-[#2D3139] text-gray-600 cursor-not-allowed"
                )}
              >
                {converting ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                {converting
                  ? (lang === 'ar' ? 'جاري التصدير...' : 'Exporting...')
                  : (lang === 'ar' ? 'تصدير' : 'Export')}
              </button>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  onClick={() => sendSelectedToTool('imageCropper')}
                  disabled={selectedIds.size === 0 || converting || sendingToTool}
                  className="py-2 flex items-center justify-center gap-1.5 text-[8px] font-mono rounded-md border border-blue-500/30 text-blue-300 hover:bg-blue-500/10 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Scissors size={11} />
                  {lang === 'ar' ? 'قص المحدد' : 'Crop selected'}
                </button>
                <button
                  onClick={() => sendSelectedToTool('imageCompressor')}
                  disabled={selectedIds.size === 0 || converting || sendingToTool}
                  className="py-2 flex items-center justify-center gap-1.5 text-[8px] font-mono rounded-md border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {sendingToTool ? <Loader2 size={11} className="animate-spin" /> : <Percent size={11} />}
                  {lang === 'ar' ? 'ضغط المحدد' : 'Compress selected'}
                </button>
                <button
                  onClick={() => sendSelectedToTool('imageToPdf')}
                  disabled={selectedIds.size === 0 || converting || sendingToTool}
                  className="col-span-2 py-2 flex items-center justify-center gap-1.5 text-[8px] font-mono rounded-md border border-rose-500/30 text-rose-300 hover:bg-rose-500/10 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <FileText size={11} />
                  {lang === 'ar' ? 'إنشاء PDF من المحدد' : 'Create PDF from selected'}
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Pages Grid */}
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
                  <div
                    key={page.id}
                    onClick={() => togglePage(page.id)}
                    className={cn(
                      "relative rounded-lg overflow-hidden border-2 cursor-pointer transition-all group bg-white",
                      selectedIds.has(page.id)
                        ? "border-orange-500 shadow-lg shadow-orange-500/20"
                        : "border-[#2D3139] hover:border-gray-500"
                    )}
                  >
                    <img
                      src={page.dataUrl}
                      alt={page.name}
                      className="w-full h-auto"
                      draggable={false}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
                      <span className="text-[8px] font-mono text-white truncate block leading-tight">
                        {page.name}
                      </span>
                    </div>
                    <div className={cn(
                      "absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center transition-all",
                      selectedIds.has(page.id)
                        ? "bg-orange-500"
                        : "bg-black/40 group-hover:bg-black/60"
                    )}>
                      {selectedIds.has(page.id) ? (
                        <CheckSquare size={12} className="text-white" />
                      ) : (
                        <Square size={12} className="text-white/60" />
                      )}
                    </div>
                    {/* Quick actions */}
                    <div className="absolute top-1.5 left-1.5 flex flex-col gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 transition-all">
                      <button
                        onClick={e => { e.stopPropagation(); openCrop(page); }}
                        className="w-5 h-5 rounded-full bg-black/40 hover:bg-orange-500 flex items-center justify-center transition-all"
                        title={lang === 'ar' ? 'قص الصورة' : 'Crop image'}
                      >
                        <Scissors size={9} className="text-white" />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); downloadSingle(page); }}
                        className="w-5 h-5 rounded-full bg-black/40 hover:bg-orange-500 flex items-center justify-center transition-all"
                        title={lang === 'ar' ? 'تحميل' : 'Download'}
                      >
                        <Download size={10} className="text-white" />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); removePage(page.id); }}
                        className="w-5 h-5 rounded-full bg-black/40 hover:bg-red-500 flex items-center justify-center transition-all"
                        title={lang === 'ar' ? 'حذف' : 'Remove'}
                      >
                        <Trash2 size={9} className="text-white" />
                      </button>
                    </div>
                    {page.originalDataUrl && (
                      <div className="absolute bottom-7 right-1.5 px-1 py-0.5 rounded bg-orange-500/90 text-[7px] font-mono text-white">
                        {lang === 'ar' ? 'مقصوص' : 'Cropped'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Crop Modal */}
      {cropTarget && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-6">
          <div className="bg-[#14171C] border border-[#2D3139] rounded-xl w-full max-w-3xl flex flex-col max-h-[94vh] overflow-hidden shadow-2xl">
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[#2D3139] shrink-0 sm:px-4">
              <div className="w-6 h-6 rounded-md bg-orange-500/15 flex items-center justify-center shrink-0">
                <Scissors size={12} className="text-orange-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-[11px] font-bold text-white truncate sm:text-xs">
                  {lang === 'ar' ? 'قص الصورة' : 'Crop image'}
                </h2>
                <p className="text-[8px] font-mono text-gray-500 truncate">
                  {cropTarget.name} · {cropOutputWidth}×{cropOutputHeight} px
                </p>
              </div>
              <button
                onClick={closeCrop}
                className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                title={lang === 'ar' ? 'إغلاق' : 'Close'}
              >
                <X size={14} />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-auto bg-[#0A0C0F] p-3 flex items-center justify-center sm:p-5">
              <div className="relative inline-block select-none">
                <img
                  ref={cropImgRef}
                  src={cropTarget.dataUrl}
                  alt={cropTarget.name}
                  onLoad={handleCropImageLoad}
                  className="block max-w-full max-h-[60vh] w-auto h-auto"
                  draggable={false}
                />
                {cropDisplaySize.width > 0 && (
                  <>
                    <div
                      className="absolute inset-0 pointer-events-none bg-black/60 z-10"
                      style={{ clipPath: `inset(${cropBox.y}px ${cropDisplaySize.width - cropBox.x - cropBox.width}px ${cropDisplaySize.height - cropBox.y - cropBox.height}px ${cropBox.x}px)` }}
                    />
                    <div
                      className="absolute cursor-move border-2 border-white/90 z-20"
                      style={{ left: cropBox.x, top: cropBox.y, width: cropBox.width, height: cropBox.height, touchAction: 'none' }}
                      onPointerDown={e => startCropDrag(e, 'move')}
                    >
                      <div
                        className="absolute inset-0 opacity-25 pointer-events-none"
                        style={{ backgroundImage: 'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)', backgroundSize: '33.333% 33.333%' }}
                      />
                      {[
                        { id: 'nw', cls: '-top-2 -left-2 cursor-nwse-resize' },
                        { id: 'ne', cls: '-top-2 -right-2 cursor-nesw-resize' },
                        { id: 'sw', cls: '-bottom-2 -left-2 cursor-nesw-resize' },
                        { id: 'se', cls: '-bottom-2 -right-2 cursor-nwse-resize' },
                        { id: 'n', cls: '-top-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize' },
                        { id: 's', cls: '-bottom-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize' },
                        { id: 'w', cls: 'top-1/2 -left-1.5 -translate-y-1/2 cursor-ew-resize' },
                        { id: 'e', cls: 'top-1/2 -right-1.5 -translate-y-1/2 cursor-ew-resize' },
                      ].map(h => (
                        <div
                          key={h.id}
                          className={cn("absolute w-4 h-4 bg-white border border-orange-500 rounded-sm z-10 shadow", h.cls)}
                          style={{ touchAction: 'none' }}
                          onPointerDown={e => startCropDrag(e, 'resize', h.id)}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 px-3 py-2.5 border-t border-[#2D3139] shrink-0 sm:flex-row sm:items-center sm:px-4">
              <p className="text-[8px] font-mono text-gray-500 flex-1">
                {lang === 'ar' ? 'اسحب المربع لتحريكه، واسحب المقابض لتغيير الحجم' : 'Drag the box to move it, drag handles to resize'}
              </p>
              <div className="flex items-center gap-2 shrink-0">
                {cropTarget.originalDataUrl && (
                  <button
                    onClick={resetCrop}
                    className="px-2.5 py-2 flex items-center justify-center gap-1 text-[9px] font-mono rounded-md border border-[#2D3139] text-gray-300 hover:border-gray-500 hover:text-white transition-all"
                  >
                    <RotateCcw size={11} />
                    {lang === 'ar' ? 'استعادة الأصل' : 'Restore original'}
                  </button>
                )}
                <button
                  onClick={closeCrop}
                  className="px-3 py-2 text-[9px] font-mono rounded-md border border-[#2D3139] text-gray-400 hover:text-white hover:border-gray-500 transition-all"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  onClick={applyCrop}
                  disabled={cropDisplaySize.width === 0}
                  className={cn(
                    "px-3 py-2 flex items-center justify-center gap-1.5 text-[9px] font-mono rounded-md transition-all",
                    cropDisplaySize.width > 0
                      ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white hover:from-orange-500 hover:to-amber-500 shadow-lg shadow-orange-500/20"
                      : "bg-[#2D3139] text-gray-600 cursor-not-allowed"
                  )}
                >
                  <Check size={12} />
                  {lang === 'ar' ? 'تطبيق القص' : 'Apply crop'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
