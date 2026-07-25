import { useState, useRef, useEffect, ChangeEvent } from 'react';
import {
  Upload, Image as ImageIcon, Download, X, Loader2, CheckCircle2,
  Scissors, Maximize2, Trash2, FolderDown, Plus, Grid3X3, ArrowLeft,
  FolderOpen, HelpCircle, ArrowDown, RefreshCw, RotateCw, Sliders, Type,
  FlipHorizontal, FlipVertical, Lock, Unlock,
} from 'lucide-react';
import JSZip from 'jszip';
import { cn } from '../lib/utils';

interface ImageCropperProps { t: any; lang: 'ar' | 'en'; }

type ToolMode = 'crop' | 'resize' | 'convert' | 'rotate' | 'filters' | 'text';
interface CropBox { x: number; y: number; width: number; height: number; }
interface DisplaySize { width: number; height: number; }
interface CroppedItem { id: string; blob: Blob; url: string; width: number; height: number; originalName: string; folderPath: string; }
interface ImageEntry { file: File; url: string; naturalSize: DisplaySize | null; displaySize: DisplaySize | null; folderPath: string; }
interface ResizeState { width: number; height: number; lockAspect: boolean; aspectRatio: number; }
interface ConvertState { format: 'image/png' | 'image/jpeg' | 'image/webp'; quality: number; }
interface RotateState { degree: number; flipH: boolean; flipV: boolean; }
interface FiltersState { brightness: number; contrast: number; saturation: number; hue: number; blur: number; }
interface TextState { text: string; fontSize: number; color: string; x: number; y: number; }

const MIN_CROP_SIZE = 50;
const CROP_KEY = 'unitool_ic_crop';
const GUIDE_KEY = 'unitool_ic_guide';

function getSavedCrop() { try { const s = localStorage.getItem(CROP_KEY); return s ? JSON.parse(s) : null; } catch { return null; } }
function saveCrop(rw: number, rh: number) { try { localStorage.setItem(CROP_KEY, JSON.stringify({ rw, rh })); } catch {} }
function seenGuide() { try { return localStorage.getItem(GUIDE_KEY) === 'true'; } catch { return false; } }
function markGuide() { try { localStorage.setItem(GUIDE_KEY, 'true'); } catch {} }

const modeConfig: { id: ToolMode; icon: any; ar: string; en: string }[] = [
  { id: 'crop', icon: Scissors, ar: 'قص', en: 'Crop' },
  { id: 'resize', icon: Maximize2, ar: 'الحجم', en: 'Size' },
  { id: 'convert', icon: RefreshCw, ar: 'الصيغة', en: 'Format' },
  { id: 'rotate', icon: RotateCw, ar: 'الدوران', en: 'Rotate' },
  { id: 'filters', icon: Sliders, ar: 'الفلاتر', en: 'Filters' },
  { id: 'text', icon: Type, ar: 'النص', en: 'Text' },
];

async function processOneImage(entry: ImageEntry, state: {
  mode: ToolMode; cropBox: CropBox; displaySize: DisplaySize | null;
  resize: ResizeState; convert: ConvertState; rotate: RotateState;
  filters: FiltersState; text: TextState;
}): Promise<CroppedItem | null> {
  try {
    const bitmap = await createImageBitmap(entry.file);
    let srcW = bitmap.width, srcH = bitmap.height;

    if (state.mode === 'crop' && entry.displaySize && entry.naturalSize) {
      const sx = state.cropBox.x * (entry.naturalSize.width / entry.displaySize.width);
      const sy = state.cropBox.y * (entry.naturalSize.height / entry.displaySize.height);
      const sw = state.cropBox.width * (entry.naturalSize.width / entry.displaySize.width);
      const sh = state.cropBox.height * (entry.naturalSize.height / entry.displaySize.height);
      const c = document.createElement('canvas');
      c.width = Math.round(sw); c.height = Math.round(sh);
      const ctx = c.getContext('2d')!;
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, Math.round(sw), Math.round(sh));
      bitmap.close();
      return finalizeCanvas(c, entry, state.convert);
    }

    const angle = ((state.rotate.degree % 360) + 360) % 360;
    const swapped = angle === 90 || angle === 270;

    let outW: number, outH: number;
    if (state.mode === 'resize') {
      outW = state.resize.width; outH = state.resize.height;
    } else {
      outW = swapped ? srcH : srcH; outH = swapped ? srcW : srcH;
      if (swapped) { outW = srcH; outH = srcW; } else { outW = srcW; outH = srcH; }
    }

    const c = document.createElement('canvas');
    c.width = outW; c.height = outH;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';

    ctx.save();
    ctx.translate(outW / 2, outH / 2);
    if (state.rotate.flipH) ctx.scale(-1, 1);
    if (state.rotate.flipV) ctx.scale(1, -1);
    ctx.rotate(state.rotate.degree * Math.PI / 180);
    ctx.translate(-outW / 2, -outH / 2);

    if (state.mode === 'filters') {
      ctx.filter = `brightness(${state.filters.brightness}%) contrast(${state.filters.contrast}%) saturate(${state.filters.saturation}%) hue-rotate(${state.filters.hue}deg) blur(${state.filters.blur}px)`;
    }

    ctx.drawImage(bitmap, 0, 0, outW, outH);
    ctx.restore();
    bitmap.close();

    if (state.mode === 'text' && state.text.text) {
      ctx.font = `bold ${state.text.fontSize}px sans-serif`;
      ctx.fillStyle = state.text.color;
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText(state.text.text, outW * state.text.x / 100, outH * state.text.y / 100);
    }

    return finalizeCanvas(c, entry, state.convert);
  } catch { return null; }
}

function finalizeCanvas(c: HTMLCanvasElement, entry: ImageEntry, convert: ConvertState): CroppedItem {
  const mime = convert.format;
  const quality = mime === 'image/png' ? undefined : convert.quality;
  return new Promise<CroppedItem>((resolve) => {
    c.toBlob((blob) => {
      resolve(blob ? {
        id: Math.random().toString(36).substr(2, 9), blob,
        url: URL.createObjectURL(blob), width: c.width, height: c.height,
        originalName: entry.file.name.replace(/\.[^.]+$/, ''), folderPath: entry.folderPath,
      } : null!);
    }, mime, quality);
  }) as any;
}

export function ImageCropper({ t, lang }: ImageCropperProps) {
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [mode, setMode] = useState<ToolMode>('crop');
  const [cropBox, setCropBox] = useState<CropBox>({ x: 0, y: 0, width: 200, height: 200 });
  const [resize, setResize] = useState<ResizeState>({ width: 800, height: 600, lockAspect: true, aspectRatio: 4 / 3 });
  const [convert, setConvert] = useState<ConvertState>({ format: 'image/png', quality: 0.92 });
  const [rotate, setRotate] = useState<RotateState>({ degree: 0, flipH: false, flipV: false });
  const [filters, setFilters] = useState<FiltersState>({ brightness: 100, contrast: 100, saturation: 100, hue: 0, blur: 0 });
  const [text, setText] = useState<TextState>({ text: '', fontSize: 32, color: '#ffffff', x: 50, y: 90 });
  const [croppedItems, setCroppedItems] = useState<CroppedItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState('');
  const [mobileTab, setMobileTab] = useState<'crop' | 'crops'>('crop');
  const [showGallery, setShowGallery] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [guideSeen, setGuideSeen] = useState(() => seenGuide());

  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragStartRef = useRef<{ x: number; y: number; box: CropBox }>({ x: 0, y: 0, box: { x: 0, y: 0, width: 0, height: 0 } });

  const active = images[activeIndex] || null;

  useEffect(() => { return () => { images.forEach(i => URL.revokeObjectURL(i.url)); croppedItems.forEach(i => URL.revokeObjectURL(i.url)); }; }, []);

  useEffect(() => {
    if (active?.displaySize && active.displaySize.width > 0 && cropBox.width > 0 && cropBox.height > 0) {
      saveCrop(cropBox.width / active.displaySize.width, cropBox.height / active.displaySize.height);
    }
  }, [cropBox.width, cropBox.height, active?.displaySize]);

  useEffect(() => {
    if (active?.naturalSize && active.naturalSize.width > 0) {
      const r = active.naturalSize.width / active.naturalSize.height;
      setResize(prev => ({ ...prev, aspectRatio: r, width: Math.round(prev.height * r) }));
    }
  }, [activeIndex]);

  const addImages = (files: FileList | File[]) => {
    const entries: ImageEntry[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i] as File & { webkitRelativePath?: string };
      if (file.type.startsWith('image/')) {
        const rp = file.webkitRelativePath || '';
        const fp = rp.includes('/') ? rp.substring(0, rp.lastIndexOf('/')) : '';
        entries.push({ file, url: URL.createObjectURL(file), naturalSize: null, displaySize: null, folderPath: fp });
      }
    }
    if (entries.length > 0) setImages(prev => { const u = [...prev, ...entries]; if (prev.length === 0) setActiveIndex(0); return u; });
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => { if (e.target.files) addImages(e.target.files); e.target.value = ''; };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); if (e.dataTransfer.files) addImages(e.dataTransfer.files); };

  const handleImageLoad = () => {
    if (!imageRef.current || !containerRef.current) return;
    const img = imageRef.current;
    const w = Math.round(img.getBoundingClientRect().width);
    const h = Math.round(img.getBoundingClientRect().height);
    setImages(prev => prev.map((e, i) => i === activeIndex ? { ...e, displaySize: { width: w, height: h }, naturalSize: { width: img.naturalWidth, height: img.naturalHeight } } : e));
    const saved = getSavedCrop();
    const cw = saved ? Math.round(w * saved.rw) : Math.round(w * 0.5);
    const ch = saved ? Math.round(h * saved.rh) : Math.round(h * 0.5);
    setCropBox({ x: Math.round((w - cw) / 2), y: Math.round((h - ch) / 2), width: Math.max(MIN_CROP_SIZE, Math.min(cw, w)), height: Math.max(MIN_CROP_SIZE, Math.min(ch, h)) });
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent, type: 'move' | 'resize', handle: string = '') => {
    e.preventDefault(); e.stopPropagation();
    const cx = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const cy = 'touches' in e ? e.touches[0].clientY : e.clientY;
    if (type === 'move') setIsDragging(true);
    else { setIsResizing(true); setResizeHandle(handle); }
    dragStartRef.current = { x: cx, y: cy, box: { ...cropBox } };
  };

  useEffect(() => {
    const onMove = (cx: number, cy: number) => {
      if (!isDragging && !isResizing) return;
      if (!active?.displaySize) return;
      const dx = cx - dragStartRef.current.x, dy = cy - dragStartRef.current.y;
      const b = dragStartRef.current.box, ds = active.displaySize;
      if (isDragging) {
        setCropBox(p => ({ ...p, x: Math.max(0, Math.min(ds.width - p.width, b.x + dx)), y: Math.max(0, Math.min(ds.height - p.height, b.y + dy)) }));
      } else if (isResizing) {
        let nx = b.x, ny = b.y, nw = b.width, nh = b.height;
        if (resizeHandle.includes('e')) nw = Math.max(MIN_CROP_SIZE, b.width + dx);
        if (resizeHandle.includes('w')) { nw = Math.max(MIN_CROP_SIZE, b.width - dx); nx = b.x + b.width - nw; }
        if (resizeHandle.includes('s')) nh = Math.max(MIN_CROP_SIZE, b.height + dy);
        if (resizeHandle.includes('n')) { nh = Math.max(MIN_CROP_SIZE, b.height - dy); ny = b.y + b.height - nh; }
        if (nx < 0) nx = 0; if (ny < 0) ny = 0;
        if (nx + nw > ds.width) nw = ds.width - nx;
        if (ny + nh > ds.height) nh = ds.height - ny;
        setCropBox({ x: nx, y: ny, width: Math.max(MIN_CROP_SIZE, nw), height: Math.max(MIN_CROP_SIZE, nh) });
      }
    };
    const mm = (e: globalThis.MouseEvent) => onMove(e.clientX, e.clientY);
    const tm = (e: globalThis.TouchEvent) => { if (e.touches.length > 0) onMove(e.touches[0].clientX, e.touches[0].clientY); };
    const end = () => { setIsDragging(false); setIsResizing(false); };
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', mm); window.addEventListener('mouseup', end);
      window.addEventListener('touchmove', tm, { passive: false }); window.addEventListener('touchend', end);
      return () => { window.removeEventListener('mousemove', mm); window.removeEventListener('mouseup', end); window.removeEventListener('touchmove', tm); window.removeEventListener('touchend', end); };
    }
  }, [isDragging, isResizing, resizeHandle, active?.displaySize]);

  const processAll = async () => {
    if (images.length === 0) return;
    setProcessing(true); setProgress({ done: 0, total: images.length });
    const state = { mode, cropBox, displaySize: active?.displaySize || null, resize, convert, rotate, filters, text };
    const results: CroppedItem[] = [];
    for (let i = 0; i < images.length; i++) {
      const item = await processOneImage(images[i], state);
      if (item) results.push(item);
      setProgress({ done: i + 1, total: images.length });
    }
    setCroppedItems(prev => [...results.reverse(), ...prev]);
    setProcessing(false); setProgress({ done: 0, total: 0 });
  };

  const downloadItem = (item: CroppedItem) => {
    const ext = item.blob.type === 'image/webp' ? 'webp' : item.blob.type === 'image/jpeg' ? 'jpg' : 'png';
    const a = document.createElement('a'); a.href = item.url; a.download = `${item.originalName}.${ext}`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const downloadAllAsZip = async () => {
    if (croppedItems.length === 0) return;
    const zip = new JSZip();
    croppedItems.forEach(item => {
      const ext = item.blob.type === 'image/webp' ? 'webp' : item.blob.type === 'image/jpeg' ? 'jpg' : 'png';
      zip.file(item.folderPath ? `${item.folderPath}/${item.originalName}.${ext}` : `${item.originalName}.${ext}`, item.blob);
    });
    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a'); a.href = url; a.download = `edited_${Date.now()}.zip`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const removeItem = (id: string) => { setCroppedItems(prev => { const item = prev.find(i => i.id === id); if (item) URL.revokeObjectURL(item.url); return prev.filter(i => i.id !== id); }); };
  const clearAllItems = () => { croppedItems.forEach(i => URL.revokeObjectURL(i.url)); setCroppedItems([]); };
  const removeImage = (index: number) => { setImages(prev => { URL.revokeObjectURL(prev[index].url); const u = prev.filter((_, i) => i !== index); if (activeIndex >= u.length) setActiveIndex(Math.max(0, u.length - 1)); return u; }); };
  const removeAllImages = () => { images.forEach(i => URL.revokeObjectURL(i.url)); setImages([]); setActiveIndex(0); };
  const switchImage = (index: number) => { setActiveIndex(index); setShowGallery(false); };

  const imgTransform = mode !== 'crop' ? {
    transform: `rotate(${rotate.degree}deg) scaleX(${rotate.flipH ? -1 : 1}) scaleY(${rotate.flipV ? -1 : 1})`,
    filter: mode === 'filters' ? `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%) hue-rotate(${filters.hue}deg) blur(${filters.blur}px)` : undefined,
  } : {};

  return (
    <div className="flex-1 flex flex-col bg-[#0A0C0F] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] bg-[#0F1115]/50 shrink-0 sm:px-6 sm:py-3">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <ImageIcon size={14} className="text-white sm:size-4" />
        </div>
        <div className="flex-1">
          <h1 className="text-xs sm:text-sm font-bold text-white sm:text-base">{lang === 'ar' ? 'محرر الصور' : 'Image Editor'}</h1>
          <p className="text-[8px] sm:text-[9px] text-gray-500 font-mono">{lang === 'ar' ? 'قص وتعديل وتحويل عدة صور' : 'Crop, edit & convert multiple images'}</p>
        </div>
        <button onClick={() => { setShowGuide(true); markGuide(); setGuideSeen(true); }} className="relative flex items-center gap-1.5 px-2 py-1.5 hover:bg-blue-500/20 rounded-lg text-blue-400 transition-colors shrink-0">
          <HelpCircle size={14} />
          <span className="text-[9px] sm:text-[10px] font-mono hidden sm:inline">{lang === 'ar' ? 'طريقة الاستخدام' : 'How to Use'}</span>
          {!guideSeen && <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 animate-bounce"><ArrowDown size={14} className="text-yellow-400 drop-shadow-[0_0_4px_rgba(250,204,21,0.6)]" /></span>}
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-0">
        {/* Mobile Tabs */}
        {images.length > 0 && (
          <div className="flex border-b border-[#2D3139] bg-[#14171C] shrink-0 lg:hidden">
            <button onClick={() => setMobileTab('crop')} className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 text-[10px] font-mono uppercase tracking-wider transition-all ${mobileTab === 'crop' ? 'text-blue-400 bg-[#1A1D23] border-b-2 border-blue-500' : 'text-gray-500'}`}>
              <Scissors size={14} /> {lang === 'ar' ? 'التعديل' : 'Edit'}
            </button>
            <button onClick={() => setMobileTab('crops')} className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 text-[10px] font-mono uppercase tracking-wider transition-all ${mobileTab === 'crops' ? 'text-blue-400 bg-[#1A1D23] border-b-2 border-blue-500' : 'text-gray-500'}`}>
              <CheckCircle2 size={14} /> {lang === 'ar' ? 'النتائج' : 'Results'}
              {croppedItems.length > 0 && <span className="ml-1 px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded text-[8px] font-bold">{croppedItems.length}</span>}
            </button>
          </div>
        )}

        {/* Preview */}
        <div className={`${images.length > 0 && mobileTab === 'crops' ? 'hidden lg:flex' : 'flex'} flex-1 flex-col min-h-0 overflow-hidden`}>
          <div className="flex-1 flex flex-col p-3 sm:p-4 min-h-0">
            {images.length === 0 ? (
              <label className="group relative flex flex-col items-center justify-center gap-2 flex-1 bg-[#14171C] border-2 border-dashed border-[#2D3139] hover:border-blue-500/50 rounded-lg transition-all cursor-pointer" onDragOver={e => e.preventDefault()} onDrop={handleDrop}>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                  <Upload size={18} className="text-blue-500 sm:size-5" />
                </div>
                <div className="text-center space-y-0.5 sm:space-y-1">
                  <p className="text-xs sm:text-sm text-gray-300 font-medium">{lang === 'ar' ? 'اسحب الصور هنا أو انقر لاختيارها' : 'Drag images here or click to select'}</p>
                  <p className="text-[8px] sm:text-[9px] text-gray-500 font-mono uppercase">PNG, JPG, WebP · {lang === 'ar' ? 'عدة صور أو فولدرات' : 'Multiple files or folders'}</p>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
              </label>
            ) : (
              <div className="flex-1 flex flex-col gap-2 min-h-0">
                {active && (
                  <div className="flex items-center justify-between shrink-0 gap-2">
                    <div className="flex items-center gap-1.5 sm:gap-2 text-[8px] sm:text-[9px] font-mono text-gray-400 min-w-0">
                      <ImageIcon size={10} className="text-blue-500 shrink-0 sm:size-3" />
                      <span className="truncate max-w-[120px] sm:max-w-none">{active.file.name}</span>
                      {active.naturalSize && <span className="text-blue-400 bg-blue-500/10 px-1 py-0.5 rounded text-[7px] sm:text-[8px] shrink-0">{active.naturalSize.width}×{active.naturalSize.height}</span>}
                    </div>
                    <span className="text-[8px] font-mono text-gray-600 shrink-0">{activeIndex + 1}/{images.length}</span>
                  </div>
                )}

                <div ref={containerRef} className="relative flex-1 bg-[#14171C] rounded-lg overflow-auto border border-[#2D3139] min-h-0">
                  <div className="flex justify-center items-center min-w-full min-h-full">
                    <div className="relative" style={{ width: active?.displaySize?.width || 'auto', height: active?.displaySize?.height || 'auto' }}>
                      {active && (
                        <img ref={imageRef} key={activeIndex} src={active.url} alt="Source" className="block max-w-full max-h-[60vh] w-auto h-auto object-contain transition-all duration-200" style={imgTransform} onLoad={handleImageLoad} draggable={false} />
                      )}

                      {/* Text overlay preview */}
                      {mode === 'text' && text.text && active?.displaySize && (
                        <div className="absolute pointer-events-none select-none z-20" style={{ left: `${text.x}%`, top: `${text.y}%`, transform: 'translate(-50%, -50%)', fontSize: `${text.fontSize}px`, color: text.color, fontWeight: 'bold', textShadow: '0 0 6px rgba(0,0,0,0.9), 0 2px 8px rgba(0,0,0,0.5)', whiteSpace: 'nowrap' }}>
                          {text.text}
                        </div>
                      )}

                      {/* Crop overlay */}
                      {mode === 'crop' && active?.naturalSize && active.displaySize && active.displaySize.width > 0 && (
                        <>
                          <div className="absolute inset-0 pointer-events-none bg-black/60 z-10" style={{ clipPath: `inset(${cropBox.y}px ${active.displaySize.width - cropBox.x - cropBox.width}px ${active.displaySize.height - cropBox.y - cropBox.height}px ${cropBox.x}px)` }} />
                          <div className="absolute cursor-move border-2 border-white/80 z-20" style={{ left: cropBox.x, top: cropBox.y, width: cropBox.width, height: cropBox.height, touchAction: 'none' }} onMouseDown={e => handleMouseDown(e, 'move')} onTouchStart={e => handleMouseDown(e, 'move')}>
                            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)', backgroundSize: '33.33% 33.33%' }} />
                            {['nw', 'ne', 'sw', 'se'].map(h => (
                              <div key={h} className={cn("absolute w-5 h-5 sm:w-3 sm:h-3 bg-white border-2 sm:border border-blue-500 rounded-sm z-10", h === 'nw' && '-top-2 -left-2 sm:-top-1.5 sm:-left-1.5', h === 'ne' && '-top-2 -right-2 sm:-top-1.5 sm:-right-1.5', h === 'sw' && '-bottom-2 -left-2 sm:-bottom-1.5 sm:-left-1.5', h === 'se' && '-bottom-2 -right-2 sm:-bottom-1.5 sm:-right-1.5')} style={{ touchAction: 'none' }} onMouseDown={e => handleMouseDown(e, 'resize', h)} onTouchStart={e => handleMouseDown(e, 'resize', h)} />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className={`${images.length > 0 && mobileTab === 'crop' ? 'hidden lg:block' : ''} lg:w-80 border-t lg:border-t-0 lg:border-l border-[#2D3139] bg-[#14171C] flex flex-col lg:max-h-none`}>
          <div className="overflow-y-auto flex-1 p-2 sm:p-3 space-y-2 sm:space-y-3 settings-scroll">

            {/* Mode Tabs */}
            <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
              {modeConfig.map(m => (
                <button key={m.id} onClick={() => setMode(m.id)} className={cn("flex items-center gap-1 px-2 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-mono whitespace-nowrap transition-all shrink-0", mode === m.id ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-gray-500 hover:bg-white/5 border border-transparent')}>
                  <m.icon size={12} />
                  <span className="hidden sm:inline">{lang === 'ar' ? m.ar : m.en}</span>
                </button>
              ))}
            </div>

            {/* Mode Controls */}
            <div className="bg-[#0F1115] border border-[#2D3139] rounded-lg p-2 sm:p-2.5 space-y-2">
              {/* RESIZE */}
              {mode === 'resize' && (
                <>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-mono text-gray-400 uppercase">{lang === 'ar' ? 'الأبعاد' : 'Dimensions'}</span>
                    <button onClick={() => setResize(p => ({ ...p, lockAspect: !p.lockAspect }))} className="p-1 rounded hover:bg-white/10 transition-colors" title={resize.lockAspect ? 'Unlock' : 'Lock'}>
                      {resize.lockAspect ? <Lock size={12} className="text-green-400" /> : <Unlock size={12} className="text-gray-500" />}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[7px] font-mono text-gray-500 block mb-0.5">W (px)</label>
                      <input type="number" value={resize.width} onChange={e => { const w = parseInt(e.target.value) || 0; setResize(p => ({ ...p, width: w, height: p.lockAspect ? Math.round(w / p.aspectRatio) : p.height })); }} className="w-full bg-[#1A1D23] border border-[#2D3139] rounded px-2 py-1.5 text-[10px] font-mono text-white focus:border-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="text-[7px] font-mono text-gray-500 block mb-0.5">H (px)</label>
                      <input type="number" value={resize.height} onChange={e => { const h = parseInt(e.target.value) || 0; setResize(p => ({ ...p, height: h, width: p.lockAspect ? Math.round(h * p.aspectRatio) : p.width })); }} className="w-full bg-[#1A1D23] border border-[#2D3139] rounded px-2 py-1.5 text-[10px] font-mono text-white focus:border-blue-500 outline-none" />
                    </div>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {[25, 50, 75, 150, 200].map(pct => (
                      <button key={pct} onClick={() => { if (active?.naturalSize) { const w = Math.round(active.naturalSize.width * pct / 100); const h = Math.round(active.naturalSize.height * pct / 100); setResize(p => ({ ...p, width: w, height: h })); } }} className="px-2 py-0.5 bg-[#1A1D23] border border-[#2D3139] rounded text-[8px] font-mono text-gray-400 hover:text-white hover:border-blue-500/50 transition-all">{pct}%</button>
                    ))}
                  </div>
                </>
              )}

              {/* CONVERT */}
              {mode === 'convert' && (
                <>
                  <span className="text-[9px] font-mono text-gray-400 uppercase block mb-1">{lang === 'ar' ? 'صيغة الإخراج' : 'Output Format'}</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {([['image/png', 'PNG'], ['image/jpeg', 'JPG'], ['image/webp', 'WebP']] as const).map(([fmt, label]) => (
                      <button key={fmt} onClick={() => setConvert(p => ({ ...p, format: fmt }))} className={cn("py-2 rounded-lg text-[10px] font-mono font-bold transition-all border", convert.format === fmt ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'text-gray-500 border-[#2D3139] hover:border-gray-500')}>
                        {label}
                      </button>
                    ))}
                  </div>
                  {convert.format !== 'image/png' && (
                    <div>
                      <div className="flex justify-between mb-0.5">
                        <span className="text-[7px] font-mono text-gray-500">{lang === 'ar' ? 'الجودة' : 'Quality'}</span>
                        <span className="text-[8px] font-mono text-blue-400">{Math.round(convert.quality * 100)}%</span>
                      </div>
                      <input type="range" min="0.1" max="1" step="0.05" value={convert.quality} onChange={e => setConvert(p => ({ ...p, quality: parseFloat(e.target.value) }))} className="w-full h-1 accent-blue-500" />
                    </div>
                  )}
                </>
              )}

              {/* ROTATE */}
              {mode === 'rotate' && (
                <>
                  <span className="text-[9px] font-mono text-gray-400 uppercase block mb-1">{lang === 'ar' ? 'الدرجة' : 'Degree'}</span>
                  <input type="range" min="-180" max="180" step="1" value={rotate.degree} onChange={e => setRotate(p => ({ ...p, degree: parseInt(e.target.value) }))} className="w-full h-1 accent-blue-500" />
                  <div className="flex justify-between text-[8px] font-mono text-gray-500"><span>-180°</span><span className="text-blue-400">{rotate.degree}°</span><span>180°</span></div>
                  <div className="flex gap-1.5 flex-wrap mt-1">
                    {[-90, -45, 0, 45, 90].map(d => (
                      <button key={d} onClick={() => setRotate(p => ({ ...p, degree: d }))} className={cn("px-2 py-1 rounded text-[9px] font-mono border transition-all", rotate.degree === d ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'text-gray-500 border-[#2D3139] hover:border-gray-500')}>{d}°</button>
                    ))}
                  </div>
                  <div className="flex gap-1.5 mt-1">
                    <button onClick={() => setRotate(p => ({ ...p, flipH: !p.flipH }))} className={cn("flex-1 flex items-center justify-center gap-1 py-1.5 rounded border text-[9px] font-mono transition-all", rotate.flipH ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'text-gray-500 border-[#2D3139] hover:border-gray-500')}>
                      <FlipHorizontal size={12} /> {lang === 'ar' ? 'أفقي' : 'H'}
                    </button>
                    <button onClick={() => setRotate(p => ({ ...p, flipV: !p.flipV }))} className={cn("flex-1 flex items-center justify-center gap-1 py-1.5 rounded border text-[9px] font-mono transition-all", rotate.flipV ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'text-gray-500 border-[#2D3139] hover:border-gray-500')}>
                      <FlipVertical size={12} /> {lang === 'ar' ? 'عمودي' : 'V'}
                    </button>
                  </div>
                </>
              )}

              {/* FILTERS */}
              {mode === 'filters' && (
                <>
                  {([['brightness', 'السطوع', 'Brightness', 100, 200], ['contrast', 'التباين', 'Contrast', 100, 200], ['saturation', 'التشبع', 'Saturation', 100, 200], ['hue', 'لون', 'Hue', 0, 360], ['blur', 'التمويه', 'Blur', 0, 10]] as const).map(([key, ar, en, min, max]) => (
                    <div key={key}>
                      <div className="flex justify-between mb-0.5">
                        <span className="text-[8px] font-mono text-gray-400">{lang === 'ar' ? ar : en}</span>
                        <span className="text-[8px] font-mono text-blue-400">{filters[key as keyof FiltersState]}{key === 'hue' ? '°' : key === 'blur' ? 'px' : '%'}</span>
                      </div>
                      <input type="range" min={min} max={max} step={key === 'blur' ? 0.5 : 1} value={filters[key as keyof FiltersState]} onChange={e => setFilters(p => ({ ...p, [key]: parseFloat(e.target.value) }))} className="w-full h-1 accent-blue-500" />
                    </div>
                  ))}
                  <button onClick={() => setFilters({ brightness: 100, contrast: 100, saturation: 100, hue: 0, blur: 0 })} className="w-full py-1 bg-[#1A1D23] border border-[#2D3139] rounded text-[8px] font-mono text-gray-400 hover:text-white transition-all">
                    {lang === 'ar' ? 'إعادة ضبط' : 'Reset'}
                  </button>
                </>
              )}

              {/* TEXT */}
              {mode === 'text' && (
                <>
                  <div>
                    <label className="text-[8px] font-mono text-gray-400 block mb-0.5">{lang === 'ar' ? 'النص' : 'Text'}</label>
                    <input type="text" value={text.text} onChange={e => setText(p => ({ ...p, text: e.target.value }))} placeholder={lang === 'ar' ? 'اكتب النص هنا...' : 'Type text here...'} className="w-full bg-[#1A1D23] border border-[#2D3139] rounded px-2 py-1.5 text-[10px] font-mono text-white focus:border-blue-500 outline-none" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-[8px] font-mono text-gray-400">{lang === 'ar' ? 'الحجم' : 'Size'}</span>
                      <span className="text-[8px] font-mono text-blue-400">{text.fontSize}px</span>
                    </div>
                    <input type="range" min="12" max="200" value={text.fontSize} onChange={e => setText(p => ({ ...p, fontSize: parseInt(e.target.value) }))} className="w-full h-1 accent-blue-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[7px] font-mono text-gray-500 block mb-0.5">X %</label>
                      <input type="range" min="0" max="100" value={text.x} onChange={e => setText(p => ({ ...p, x: parseInt(e.target.value) }))} className="w-full h-1 accent-blue-500" />
                    </div>
                    <div>
                      <label className="text-[7px] font-mono text-gray-500 block mb-0.5">Y %</label>
                      <input type="range" min="0" max="100" value={text.y} onChange={e => setText(p => ({ ...p, y: parseInt(e.target.value) }))} className="w-full h-1 accent-blue-500" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[7px] font-mono text-gray-500 block mb-0.5">{lang === 'ar' ? 'اللون' : 'Color'}</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {['#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'].map(c => (
                        <button key={c} onClick={() => setText(p => ({ ...p, color: c }))} className={cn("w-6 h-6 rounded border-2 transition-all", text.color === c ? 'border-blue-500 scale-110' : 'border-[#2D3139]')} style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Apply Button */}
            {images.length > 0 && (
              <button onClick={processAll} disabled={processing || (mode === 'text' && !text.text)} className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-800 disabled:to-gray-800 text-white rounded-lg transition-all font-bold text-[10px] sm:text-xs uppercase tracking-wider shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 disabled:shadow-none disabled:cursor-not-allowed">
                {processing ? (
                  <><Loader2 size={12} className="animate-spin sm:size-[14px]" /> {lang === 'ar' ? `جاري المعالجة ${progress.done}/${progress.total}...` : `Processing ${progress.done}/${progress.total}...`}</>
                ) : (
                  <><Scissors size={12} className="sm:size-[14px]" /> {lang === 'ar' ? `تطبيق على الكل (${images.length})` : `Apply to All (${images.length})`}</>
                )}
              </button>
            )}

            {/* Results */}
            {croppedItems.length > 0 && (
              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-[8px] sm:text-[9px] font-mono text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    <CheckCircle2 size={10} className="text-green-500 sm:size-3" /> {lang === 'ar' ? 'النتائج' : 'Results'} ({croppedItems.length})
                  </h3>
                  <div className="flex gap-1">
                    <button onClick={downloadAllAsZip} className="flex items-center gap-1 px-1.5 sm:px-2 py-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded text-[7px] sm:text-[8px] font-bold uppercase transition-all"><FolderDown size={8} className="sm:size-[10px]" /> ZIP</button>
                    <button onClick={clearAllItems} className="flex items-center gap-1 px-1.5 sm:px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-[7px] sm:text-[8px] font-bold uppercase transition-all"><Trash2 size={8} className="sm:size-[10px]" /></button>
                  </div>
                </div>
                <div className="space-y-1 sm:space-y-1.5 max-h-48 sm:max-h-64 overflow-y-auto">
                  {croppedItems.map((item, index) => (
                    <div key={item.id} className="flex items-center gap-1.5 sm:gap-2 bg-[#0F1115] border border-[#2D3139] rounded-lg p-1.5 group hover:border-blue-500/30 transition-colors">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded overflow-hidden bg-[#1A1D23] shrink-0 flex items-center justify-center"><img src={item.url} alt="" className="w-full h-full object-cover" /></div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[7px] sm:text-[8px] font-mono text-gray-400 truncate">{item.originalName}</div>
                        <div className="text-[6px] sm:text-[7px] font-mono text-gray-600">{item.width}×{item.height}</div>
                      </div>
                      <button onClick={() => downloadItem(item)} className="p-1 sm:p-1.5 bg-green-500/20 hover:bg-green-500/30 rounded text-green-400 transition-all"><Download size={10} className="sm:size-3" /></button>
                      <button onClick={() => removeItem(item.id)} className="p-1 sm:p-1.5 hover:bg-red-500/20 rounded text-gray-500 hover:text-red-400 transition-all"><X size={10} className="sm:size-3" /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add/View/Remove buttons */}
            <div className="space-y-1.5">
              <label className="w-full flex items-center justify-center gap-2 py-2 bg-[#1A1D23] hover:bg-[#1E2127] border border-[#2D3139] hover:border-blue-500/50 rounded-lg transition-all cursor-pointer">
                <Plus size={14} className="text-blue-400" />
                <span className="text-[10px] sm:text-xs font-mono text-gray-300">{lang === 'ar' ? 'إضافة صور' : 'Add Images'}</span>
                <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
              </label>
              <label className="w-full flex items-center justify-center gap-2 py-2 bg-[#1A1D23] hover:bg-[#1E2127] border border-[#2D3139] hover:border-purple-500/50 rounded-lg transition-all cursor-pointer">
                <FolderOpen size={14} className="text-purple-400" />
                <span className="text-[10px] sm:text-xs font-mono text-gray-300">{lang === 'ar' ? 'إضافة فولدر' : 'Add Folder'}</span>
                <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" {...{ webkitdirectory: '', directory: '' }} />
              </label>
              {images.length > 1 && <button onClick={() => setShowGallery(true)} className="w-full flex items-center justify-center gap-2 py-2 bg-[#1A1D23] hover:bg-[#1E2127] border border-[#2D3139] hover:border-blue-500/50 rounded-lg transition-all">
                <Grid3X3 size={14} className="text-purple-400" />
                <span className="text-[10px] sm:text-xs font-mono text-gray-300">{lang === 'ar' ? `عرض كل الصور (${images.length})` : `View All (${images.length})`}</span>
              </button>}
              {images.length > 0 && <button onClick={removeAllImages} className="w-full flex items-center justify-center gap-2 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 rounded-lg transition-all">
                <Trash2 size={13} className="text-red-400" />
                <span className="text-[10px] sm:text-xs font-mono text-red-400">{lang === 'ar' ? 'حذف الكل' : 'Remove All'}</span>
              </button>}
            </div>

          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>

      {/* Gallery Modal */}
      {showGallery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setShowGallery(false)}>
          <div className="bg-[#14171C] border border-[#2D3139] rounded-2xl max-w-lg w-full max-h-[80vh] flex flex-col p-4 space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowGallery(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors"><ArrowLeft size={14} className={lang === 'ar' ? 'rotate-180' : ''} /></button>
              <h3 className="text-[10px] sm:text-xs font-mono text-gray-300 uppercase flex-1">{lang === 'ar' ? 'كل الصور' : 'All Images'} ({images.length})</h3>
              <button onClick={() => { setShowGallery(false); fileInputRef.current?.click(); }} className="p-1 hover:bg-blue-500/20 rounded-lg text-blue-400 transition-colors"><Plus size={14} /></button>
            </div>
            <div className="grid grid-cols-3 gap-1.5 overflow-y-auto flex-1">
              {images.map((entry, i) => (
                <button key={i} onClick={() => switchImage(i)} className={cn("relative aspect-square rounded-lg overflow-hidden border-2 transition-all group/gal", i === activeIndex ? 'border-blue-500' : 'border-[#2D3139] hover:border-gray-500')}>
                  <img src={entry.url} alt="" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-center text-[7px] text-white font-mono py-0.5 truncate px-0.5">{entry.file.name}</div>
                  <button onClick={e => { e.stopPropagation(); removeImage(i); }} className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/60 rounded-full flex items-center justify-center opacity-0 group/gal:opacity-100 transition-opacity"><X size={8} className="text-white" /></button>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setShowGuide(false)}>
          <div className="bg-[#14171C] border border-[#2D3139] rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2"><HelpCircle size={18} className="text-blue-400" /> {lang === 'ar' ? 'طريقة استخدام المحرر' : 'How to Use'}</h2>
              <button onClick={() => setShowGuide(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors"><X size={16} className="text-gray-400" /></button>
            </div>

            <div className="space-y-3 text-[10px] sm:text-xs text-gray-300 leading-relaxed">
              {[
                ['1', 'blue', 'ارفع الصور', 'Upload Images', 'ارفع صور فردية أو فولدر كله صور من القائمة الجانبية'],
                ['2', 'purple', 'اختر الأداة', 'Choose Tool', 'اختر من 6 أدوات: قص، تغيير حجم، تحويل صيغة، تدوير وقلب، فلاتر، نص'],
                ['3', 'green', 'عدّل الصور', 'Edit Images', 'غيّر الإعدادات وشوف النتيجة مباشرة على الصورة المعروضة'],
                ['4', 'emerald', 'طبّق على الكل', 'Apply to All', 'اضغط "تطبيق على الكل" لتنفيذ التعديل على كل الصور مرة واحدة'],
                ['5', 'yellow', 'حمّل النتائج', 'Download', 'حمّل صورة واحدة أو كلهم في ZIP بنفس الأسماء والفولدرات'],
              ].map(([n, c, ar, en, desc]) => (
                <div key={n} className="flex gap-3 items-start">
                  <div className={`w-6 h-6 rounded-full bg-${c}-500/20 flex items-center justify-center shrink-0 mt-0.5`}><span className={`text-[9px] font-bold text-${c}-400`}>{n}</span></div>
                  <div><p className="font-bold text-white mb-0.5">{lang === 'ar' ? ar : en}</p><p className="text-gray-400">{lang === 'ar' ? desc : ''}</p></div>
                </div>
              ))}
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <p className="text-[9px] sm:text-[10px] text-blue-300 font-mono">{lang === 'ar' ? 'كل التعديلات بتحفظ بنفس الصيغة والجودة الأصلية. حجم القص بيتحفظ تلقائي.' : 'All edits keep original format and quality. Crop size is saved automatically.'}</p>
            </div>

            <button onClick={() => { setShowGuide(false); markGuide(); setGuideSeen(true); }} className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg font-bold text-xs transition-all">
              {lang === 'ar' ? 'فهمت، يلا نبدأ' : "Got it, let's go"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
