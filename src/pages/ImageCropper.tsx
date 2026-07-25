import { useState, useRef, useEffect, ChangeEvent } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Download,
  X,
  Loader2,
  CheckCircle2,
  Scissors,
  Maximize2,
  Trash2,
  FolderDown,
  Plus,
  Grid3X3,
  ArrowLeft,
  FolderOpen,
  HelpCircle,
  ArrowDown,
} from 'lucide-react';
import JSZip from 'jszip';
import { cn } from '../lib/utils';

interface ImageCropperProps {
  t: any;
  lang: 'ar' | 'en';
}

interface CropBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DisplaySize {
  width: number;
  height: number;
}

interface CroppedItem {
  id: string;
  blob: Blob;
  url: string;
  width: number;
  height: number;
  originalName: string;
  folderPath: string;
}

interface ImageEntry {
  file: File;
  url: string;
  naturalSize: DisplaySize | null;
  displaySize: DisplaySize | null;
  folderPath: string;
}

const MIN_CROP_SIZE = 50;
const CROP_STORAGE_KEY = 'unitool_image_cropper_size';
const GUIDE_STORAGE_KEY = 'unitool_image_cropper_guide_seen';

function getSavedCropRatio(): { rw: number; rh: number } | null {
  try {
    const saved = localStorage.getItem(CROP_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return null;
}

function saveCropRatio(rw: number, rh: number) {
  try { localStorage.setItem(CROP_STORAGE_KEY, JSON.stringify({ rw, rh })); } catch {}
}

function hasSeenGuide(): boolean {
  try { return localStorage.getItem(GUIDE_STORAGE_KEY) === 'true'; } catch {}
  return false;
}

function markGuideSeen() {
  try { localStorage.setItem(GUIDE_STORAGE_KEY, 'true'); } catch {}
}

export function ImageCropper({ t, lang }: ImageCropperProps) {
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [cropBox, setCropBox] = useState<CropBox>({ x: 0, y: 0, width: 200, height: 200 });
  const [croppedItems, setCroppedItems] = useState<CroppedItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState('');
  const [mobileTab, setMobileTab] = useState<'crop' | 'crops'>('crop');
  const [showGallery, setShowGallery] = useState(false);
  const [showGuide, setShowGuide] = useState(() => !hasSeenGuide());

  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragStartRef = useRef<{ x: number; y: number; box: CropBox }>({ x: 0, y: 0, box: { x: 0, y: 0, width: 0, height: 0 } });

  const active = images[activeIndex] || null;

  useEffect(() => {
    return () => {
      images.forEach(img => URL.revokeObjectURL(img.url));
      croppedItems.forEach(item => URL.revokeObjectURL(item.url));
    };
  }, []);

  useEffect(() => {
    if (active?.displaySize && active.displaySize.width > 0 && cropBox.width > 0 && cropBox.height > 0) {
      saveCropRatio(cropBox.width / active.displaySize.width, cropBox.height / active.displaySize.height);
    }
  }, [cropBox.width, cropBox.height, active?.displaySize]);

  const addImages = (files: FileList | File[]) => {
    const newEntries: ImageEntry[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i] as File & { webkitRelativePath?: string };
      if (file.type.startsWith('image/')) {
        const relativePath = file.webkitRelativePath || '';
        const folderPath = relativePath.includes('/') ? relativePath.substring(0, relativePath.lastIndexOf('/')) : '';
        newEntries.push({ file, url: URL.createObjectURL(file), naturalSize: null, displaySize: null, folderPath });
      }
    }
    if (newEntries.length > 0) {
      setImages(prev => {
        const updated = [...prev, ...newEntries];
        if (prev.length === 0) setActiveIndex(0);
        return updated;
      });
    }
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addImages(e.target.files);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) addImages(e.dataTransfer.files);
  };

  const handleImageLoad = () => {
    if (!imageRef.current || !containerRef.current) return;
    const img = imageRef.current;
    const rect = img.getBoundingClientRect();
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);
    const natW = img.naturalWidth;
    const natH = img.naturalHeight;

    setImages(prev => prev.map((entry, i) =>
      i === activeIndex ? { ...entry, displaySize: { width: w, height: h }, naturalSize: { width: natW, height: natH } } : entry
    ));

    if (images.length === 1 || (active && !active.naturalSize)) {
      const saved = getSavedCropRatio();
      let cw: number, ch: number;
      if (saved) {
        cw = Math.round(w * saved.rw);
        ch = Math.round(h * saved.rh);
      } else {
        cw = Math.round(w * 0.5);
        ch = Math.round(h * 0.5);
      }
      setCropBox({
        x: Math.round((w - cw) / 2),
        y: Math.round((h - ch) / 2),
        width: Math.max(MIN_CROP_SIZE, Math.min(cw, w)),
        height: Math.max(MIN_CROP_SIZE, Math.min(ch, h)),
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent, type: 'move' | 'resize', handle: string = '') => {
    e.preventDefault();
    e.stopPropagation();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    if (type === 'move') setIsDragging(true);
    else { setIsResizing(true); setResizeHandle(handle); }
    dragStartRef.current = { x: clientX, y: clientY, box: { ...cropBox } };
  };

  useEffect(() => {
    const handleMove = (clientX: number, clientY: number) => {
      if (!isDragging && !isResizing) return;
      if (!active?.displaySize) return;
      const dx = clientX - dragStartRef.current.x;
      const dy = clientY - dragStartRef.current.y;
      const box = dragStartRef.current.box;
      const ds = active.displaySize;

      if (isDragging) {
        setCropBox(prev => ({
          ...prev,
          x: Math.max(0, Math.min(ds.width - prev.width, box.x + dx)),
          y: Math.max(0, Math.min(ds.height - prev.height, box.y + dy)),
        }));
      } else if (isResizing) {
        let newX = box.x, newY = box.y, newW = box.width, newH = box.height;

        if (resizeHandle.includes('e')) newW = Math.max(MIN_CROP_SIZE, box.width + dx);
        if (resizeHandle.includes('w')) {
          newW = Math.max(MIN_CROP_SIZE, box.width - dx);
          newX = box.x + box.width - newW;
        }
        if (resizeHandle.includes('s')) newH = Math.max(MIN_CROP_SIZE, box.height + dy);
        if (resizeHandle.includes('n')) {
          newH = Math.max(MIN_CROP_SIZE, box.height - dy);
          newY = box.y + box.height - newH;
        }

        if (newX < 0) newX = 0;
        if (newY < 0) newY = 0;
        if (newX + newW > ds.width) newW = ds.width - newX;
        if (newY + newH > ds.height) newH = ds.height - newY;

        setCropBox({ x: newX, y: newY, width: Math.max(MIN_CROP_SIZE, newW), height: Math.max(MIN_CROP_SIZE, newH) });
      }
    };

    const handleMouseMove = (e: globalThis.MouseEvent) => handleMove(e.clientX, e.clientY);
    const handleTouchMove = (e: globalThis.TouchEvent) => {
      if (e.touches.length > 0) handleMove(e.touches[0].clientX, e.touches[0].clientY);
    };

    const handleEnd = () => { setIsDragging(false); setIsResizing(false); };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleEnd);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleEnd);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleEnd);
      };
    }
  }, [isDragging, isResizing, resizeHandle, active?.displaySize]);

  const cropOneImage = async (entry: ImageEntry): Promise<CroppedItem | null> => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const bitmap = await createImageBitmap(entry.file);
    const natW = bitmap.width;
    const natH = bitmap.height;

    let sx: number, sy: number, sw: number, sh: number;

    if (entry.displaySize && entry.naturalSize && entry.displaySize.width > 0) {
      const scaleX = entry.naturalSize.width / entry.displaySize.width;
      const scaleY = entry.naturalSize.height / entry.displaySize.height;
      sx = cropBox.x * scaleX;
      sy = cropBox.y * scaleY;
      sw = cropBox.width * scaleX;
      sh = cropBox.height * scaleY;
    } else {
      const ratioX = cropBox.width / (active?.displaySize?.width || 1);
      const ratioY = cropBox.height / (active?.displaySize?.height || 1);
      const activeNatW = active?.naturalSize?.width || natW;
      const activeNatH = active?.naturalSize?.height || natH;
      const offsetX = cropBox.x / (active?.displaySize?.width || 1);
      const offsetY = cropBox.y / (active?.displaySize?.height || 1);
      sx = offsetX * natW;
      sy = offsetY * natH;
      sw = ratioX * natW;
      sh = ratioY * natH;
    }

    sx = Math.max(0, Math.min(sx, natW));
    sy = Math.max(0, Math.min(sy, natH));
    sw = Math.min(sw, natW - sx);
    sh = Math.min(sh, natH - sy);

    canvas.width = Math.round(sw);
    canvas.height = Math.round(sh);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, Math.round(sw), Math.round(sh));
    bitmap.close();

    const mime = entry.file.type || 'image/png';
    const quality = mime === 'image/png' ? undefined : 0.92;

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve({
            id: Math.random().toString(36).substr(2, 9),
            blob,
            url: URL.createObjectURL(blob),
            width: Math.round(sw),
            height: Math.round(sh),
            originalName: entry.file.name.replace(/\.[^.]+$/, ''),
            folderPath: entry.folderPath,
          });
        } else {
          resolve(null);
        }
      }, mime, quality);
    });
  };

  const processCrop = async () => {
    if (images.length === 0) return;
    setProcessing(true);
    setProgress({ done: 0, total: images.length });

    const newItems: CroppedItem[] = [];
    for (let i = 0; i < images.length; i++) {
      const item = await cropOneImage(images[i]);
      if (item) newItems.push(item);
      setProgress({ done: i + 1, total: images.length });
    }

    setCroppedItems(prev => [...newItems.reverse(), ...prev]);
    setProcessing(false);
    setProgress({ done: 0, total: 0 });
  };

  const downloadItem = (item: CroppedItem) => {
    const ext = item.blob.type === 'image/webp' ? 'webp' : item.blob.type === 'image/jpeg' ? 'jpg' : 'png';
    const a = document.createElement('a');
    a.href = item.url;
    a.download = `${item.originalName}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadAllAsZip = async () => {
    if (croppedItems.length === 0) return;
    const zip = new JSZip();
    croppedItems.forEach((item) => {
      const ext = item.blob.type === 'image/webp' ? 'webp' : item.blob.type === 'image/jpeg' ? 'jpg' : 'png';
      const path = item.folderPath ? `${item.folderPath}/${item.originalName}.${ext}` : `${item.originalName}.${ext}`;
      zip.file(path, item.blob);
    });
    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cropped_images_${Date.now()}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const removeItem = (id: string) => {
    setCroppedItems(prev => {
      const item = prev.find(i => i.id === id);
      if (item) URL.revokeObjectURL(item.url);
      return prev.filter(i => i.id !== id);
    });
  };

  const clearAllItems = () => {
    croppedItems.forEach(item => URL.revokeObjectURL(item.url));
    setCroppedItems([]);
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      URL.revokeObjectURL(prev[index].url);
      const updated = prev.filter((_, i) => i !== index);
      if (activeIndex >= updated.length) setActiveIndex(Math.max(0, updated.length - 1));
      return updated;
    });
  };

  const removeAllImages = () => {
    images.forEach(img => URL.revokeObjectURL(img.url));
    setImages([]);
    setActiveIndex(0);
  };

  const switchImage = (index: number) => {
    setActiveIndex(index);
    setShowGallery(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0A0C0F] overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] bg-[#0F1115]/50 shrink-0 sm:px-6 sm:py-3">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <ImageIcon size={14} className="text-white sm:size-4" />
        </div>
        <div className="flex-1">
          <h1 className="text-xs sm:text-sm font-bold text-white sm:text-base">{lang === 'ar' ? 'قص الصور' : 'Image Cropper'}</h1>
          <p className="text-[8px] sm:text-[9px] text-gray-500 font-mono">{lang === 'ar' ? 'قص عدة صور في مرة واحدة' : 'Crop multiple images at once'}</p>
        </div>
        <button
          onClick={() => { setShowGuide(true); markGuideSeen(); }}
          className="relative flex items-center gap-1.5 px-2 py-1.5 hover:bg-blue-500/20 rounded-lg text-blue-400 transition-colors shrink-0"
          title={lang === 'ar' ? 'طريقة استخدام الأداة' : 'How to use'}
        >
          <HelpCircle size={14} />
          <span className="text-[9px] sm:text-[10px] font-mono hidden sm:inline">{lang === 'ar' ? 'طريقة الاستخدام' : 'How to Use'}</span>
          {!hasSeenGuide() && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 animate-bounce">
              <ArrowDown size={12} className="text-yellow-400" />
            </span>
          )}
        </button>
      </div>
      <div className="flex-1 flex flex-col lg:flex-row gap-0">

        {/* Mobile Tab Bar */}
        {images.length > 0 && (
          <div className="flex border-b border-[#2D3139] bg-[#14171C] shrink-0 lg:hidden">
            <button onClick={() => setMobileTab('crop')} className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 text-[10px] font-mono uppercase tracking-wider transition-all ${mobileTab === 'crop' ? 'text-blue-400 bg-[#1A1D23] border-b-2 border-blue-500' : 'text-gray-500'}`}>
              <Scissors size={14} />
              {lang === 'ar' ? 'قص' : 'Crop'}
            </button>
            <button onClick={() => setMobileTab('crops')} className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 text-[10px] font-mono uppercase tracking-wider transition-all ${mobileTab === 'crops' ? 'text-blue-400 bg-[#1A1D23] border-b-2 border-blue-500' : 'text-gray-500'}`}>
              <CheckCircle2 size={14} />
              {lang === 'ar' ? 'القصات' : 'Crops'}
              {croppedItems.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded text-[8px] font-bold">{croppedItems.length}</span>
              )}
            </button>
          </div>
        )}

        {/* Left Section: Image Preview */}
        <div className={`${images.length > 0 && mobileTab === 'crops' ? 'hidden lg:flex' : 'flex'} flex-1 flex-col min-h-0 overflow-hidden`}>
          <div className="flex-1 flex flex-col p-3 sm:p-4 min-h-0">
            {images.length === 0 ? (
              <label
                className="group relative flex flex-col items-center justify-center gap-2 flex-1 bg-[#14171C] border-2 border-dashed border-[#2D3139] hover:border-blue-500/50 rounded-lg transition-all cursor-pointer"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                  <Upload size={18} className="text-blue-500 sm:size-5" />
                </div>
                <div className="text-center space-y-0.5 sm:space-y-1">
                  <p className="text-xs sm:text-sm text-gray-300 font-medium">
                    {lang === 'ar' ? 'اسحب الصور هنا أو انقر لاختيارها' : 'Drag images here or click to select'}
                  </p>
                  <p className="text-[8px] sm:text-[9px] text-gray-500 font-mono uppercase">PNG, JPG, WebP · {lang === 'ar' ? 'عدة صور' : 'Multiple files'}</p>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
              </label>
            ) : (
              <div className="flex-1 flex flex-col gap-2 min-h-0">
                {/* Active image info */}
                {active && (
                  <div className="flex items-center justify-between shrink-0 gap-2">
                    <div className="flex items-center gap-1.5 sm:gap-2 text-[8px] sm:text-[9px] font-mono text-gray-400 min-w-0">
                      <ImageIcon size={10} className="text-blue-500 shrink-0 sm:size-3" />
                      <span className="truncate max-w-[120px] sm:max-w-none">{active.file.name}</span>
                      {active.naturalSize && (
                        <span className="text-blue-400 bg-blue-500/10 px-1 py-0.5 rounded text-[7px] sm:text-[8px] shrink-0">
                          {active.naturalSize.width}×{active.naturalSize.height}
                        </span>
                      )}
                    </div>
                    <span className="text-[8px] font-mono text-gray-600 shrink-0">{activeIndex + 1}/{images.length}</span>
                  </div>
                )}

                {/* Image container with crop overlay */}
                <div ref={containerRef} className="relative flex-1 bg-[#14171C] rounded-lg overflow-auto border border-[#2D3139] min-h-0">
                  <div className="flex justify-center items-center min-w-full min-h-full">
                    <div className="relative" style={{ width: active?.displaySize?.width || 'auto', height: active?.displaySize?.height || 'auto' }}>
                      {active && (
                        <img
                          ref={imageRef}
                          key={activeIndex}
                          src={active.url}
                          alt="Source"
                          className="block max-w-full max-h-[60vh] w-auto h-auto object-contain"
                          onLoad={handleImageLoad}
                          draggable={false}
                        />
                      )}

                      {active?.naturalSize && active.displaySize && active.displaySize.width > 0 && (
                        <>
                          <div
                            className="absolute inset-0 pointer-events-none bg-black/60"
                            style={{
                              clipPath: `inset(${cropBox.y}px ${active.displaySize.width - cropBox.x - cropBox.width}px ${active.displaySize.height - cropBox.y - cropBox.height}px ${cropBox.x}px)`
                            }}
                          />

                          <div
                            className="absolute cursor-move border-2 border-white/80"
                            style={{ left: cropBox.x, top: cropBox.y, width: cropBox.width, height: cropBox.height, touchAction: 'none' }}
                            onMouseDown={(e) => handleMouseDown(e, 'move')}
                            onTouchStart={(e) => handleMouseDown(e, 'move')}
                          >
                            <div className="absolute inset-0 opacity-20" style={{
                              backgroundImage: `linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)`,
                              backgroundSize: '33.33% 33.33%'
                            }} />

                            {['nw', 'ne', 'sw', 'se'].map(h => (
                              <div
                                key={h}
                                className={cn(
                                  "absolute w-5 h-5 sm:w-3 sm:h-3 bg-white border-2 sm:border border-blue-500 rounded-sm z-10",
                                  h === 'nw' && '-top-2 -left-2 sm:-top-1.5 sm:-left-1.5',
                                  h === 'ne' && '-top-2 -right-2 sm:-top-1.5 sm:-right-1.5',
                                  h === 'sw' && '-bottom-2 -left-2 sm:-bottom-1.5 sm:-left-1.5',
                                  h === 'se' && '-bottom-2 -right-2 sm:-bottom-1.5 sm:-right-1.5',
                                )}
                                style={{ touchAction: 'none' }}
                                onMouseDown={(e) => handleMouseDown(e, 'resize', h)}
                                onTouchStart={(e) => handleMouseDown(e, 'resize', h)}
                              />
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

        {/* Right Sidebar */}
        <div className={`${images.length > 0 && mobileTab === 'crop' ? 'hidden lg:block' : ''} lg:w-72 border-t lg:border-t-0 lg:border-l border-[#2D3139] bg-[#14171C] flex flex-col lg:max-h-none`}>
          <div className="overflow-y-auto flex-1 p-2 sm:p-3 space-y-2 sm:space-y-3">

            {showGallery ? (
              <>
                {/* Gallery header */}
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowGallery(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                    <ArrowLeft size={14} className={lang === 'ar' ? 'rotate-180' : ''} />
                  </button>
                  <h3 className="text-[9px] sm:text-[10px] font-mono text-gray-300 uppercase tracking-wider flex-1">
                    {lang === 'ar' ? 'كل الصور' : 'All Images'} ({images.length})
                  </h3>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1 hover:bg-blue-500/20 rounded-lg text-blue-400 transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Gallery grid */}
                <div className="grid grid-cols-3 gap-1.5">
                  {images.map((entry, i) => (
                    <button
                      key={i}
                      onClick={() => switchImage(i)}
                      className={cn(
                        "relative aspect-square rounded-lg overflow-hidden border-2 transition-all group/gal",
                        i === activeIndex ? 'border-blue-500 ring-1 ring-blue-500/50' : 'border-[#2D3139] hover:border-gray-500'
                      )}
                    >
                      <img src={entry.url} alt="" className="w-full h-full object-cover" />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-center text-[7px] text-white font-mono py-0.5 truncate px-0.5">
                        {entry.file.name}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                        className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/60 rounded-full flex items-center justify-center opacity-0 group/gal:opacity-100 transition-opacity"
                      >
                        <X size={8} className="text-white" />
                      </button>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                {/* Add Images button */}
                <label className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#1A1D23] hover:bg-[#1E2127] border border-[#2D3139] hover:border-blue-500/50 rounded-lg transition-all cursor-pointer">
                  <Plus size={14} className="text-blue-400" />
                  <span className="text-[10px] sm:text-xs font-mono text-gray-300">
                    {lang === 'ar' ? 'إضافة صور' : 'Add Images'}
                  </span>
                  <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                </label>

                {/* Add Folder button */}
                <label className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#1A1D23] hover:bg-[#1E2127] border border-[#2D3139] hover:border-purple-500/50 rounded-lg transition-all cursor-pointer">
                  <FolderOpen size={14} className="text-purple-400" />
                  <span className="text-[10px] sm:text-xs font-mono text-gray-300">
                    {lang === 'ar' ? 'إضافة فولدر' : 'Add Folder'}
                  </span>
                  <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" {...{ webkitdirectory: '', directory: '' }} />
                </label>

                {/* Remove All button */}
                {images.length > 0 && (
                  <button
                    onClick={removeAllImages}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 rounded-lg transition-all"
                  >
                    <Trash2 size={13} className="text-red-400" />
                    <span className="text-[10px] sm:text-xs font-mono text-red-400">
                      {lang === 'ar' ? 'حذف الكل' : 'Remove All'}
                    </span>
                  </button>
                )}

                {/* View All button */}
                {images.length > 1 && (
                  <button
                    onClick={() => setShowGallery(true)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#1A1D23] hover:bg-[#1E2127] border border-[#2D3139] hover:border-blue-500/50 rounded-lg transition-all"
                  >
                    <Grid3X3 size={14} className="text-purple-400" />
                    <span className="text-[10px] sm:text-xs font-mono text-gray-300">
                      {lang === 'ar' ? `عرض كل الصور (${images.length})` : `View All (${images.length})`}
                    </span>
                  </button>
                )}

                {/* Crop Button */}
                {images.length > 0 && (
                  <button
                    onClick={processCrop}
                    disabled={processing}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-800 disabled:to-gray-800 text-white rounded-lg transition-all font-bold text-[10px] sm:text-xs uppercase tracking-wider shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 disabled:shadow-none disabled:cursor-not-allowed"
                  >
                    {processing ? (
                      <>
                        <Loader2 size={12} className="animate-spin sm:size-[14px]" />
                        {lang === 'ar' ? `جاري القص ${progress.done}/${progress.total}...` : `Cropping ${progress.done}/${progress.total}...`}
                      </>
                    ) : (
                      <>
                        <Scissors size={12} className="sm:size-[14px]" />
                        {lang === 'ar' ? `قص الكل (${images.length})` : `Crop All (${images.length})`}
                      </>
                    )}
                  </button>
                )}

                {/* Crops List */}
                {croppedItems.length > 0 && (
                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[8px] sm:text-[9px] font-mono text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                        <CheckCircle2 size={10} className="text-green-500 sm:size-3" />
                        {lang === 'ar' ? 'القصات' : 'Crops'} ({croppedItems.length})
                      </h3>
                      <div className="flex gap-1">
                        <button onClick={downloadAllAsZip} className="flex items-center gap-1 px-1.5 sm:px-2 py-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded text-[7px] sm:text-[8px] font-bold uppercase transition-all">
                          <FolderDown size={8} className="sm:size-[10px]" />
                          ZIP
                        </button>
                        <button onClick={clearAllItems} className="flex items-center gap-1 px-1.5 sm:px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-[7px] sm:text-[8px] font-bold uppercase transition-all">
                          <Trash2 size={8} className="sm:size-[10px]" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1 sm:space-y-1.5 max-h-48 sm:max-h-64 overflow-y-auto">
                      {croppedItems.map((item, index) => (
                        <div key={item.id} className="flex items-center gap-1.5 sm:gap-2 bg-[#0F1115] border border-[#2D3139] rounded-lg p-1.5 group hover:border-blue-500/30 transition-colors">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded overflow-hidden bg-[#1A1D23] shrink-0 flex items-center justify-center">
                            <img src={item.url} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[7px] sm:text-[8px] font-mono text-gray-400 truncate">{item.originalName}</div>
                            <div className="text-[6px] sm:text-[7px] font-mono text-gray-600">{item.width}×{item.height}</div>
                          </div>
                          <button onClick={() => downloadItem(item)} className="p-1 sm:p-1.5 bg-green-500/20 hover:bg-green-500/30 rounded text-green-400 transition-all" title={lang === 'ar' ? 'تحميل' : 'Download'}>
                            <Download size={10} className="sm:size-3" />
                          </button>
                          <button onClick={() => removeItem(item.id)} className="p-1 sm:p-1.5 hover:bg-red-500/20 rounded text-gray-500 hover:text-red-400 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all">
                            <X size={10} className="sm:size-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Crop Info */}
                {active?.naturalSize && active.displaySize && (
                  <div className="bg-[#0F1115] border border-[#2D3139] rounded-lg p-2 sm:p-2.5 space-y-1.5 sm:space-y-2">
                    <h3 className="text-[8px] sm:text-[9px] font-mono text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Maximize2 size={10} className="text-blue-500 sm:size-3" />
                      {lang === 'ar' ? 'معلومات القص' : 'Crop Info'}
                    </h3>
                    <div className="space-y-0.5 sm:space-y-1 text-[8px] sm:text-[9px] font-mono">
                      <div className="flex justify-between">
                        <span className="text-gray-500">{lang === 'ar' ? 'الأصلي' : 'Original'}</span>
                        <span className="text-blue-400">{active.naturalSize.width}×{active.naturalSize.height}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">{lang === 'ar' ? 'القص' : 'Crop'}</span>
                        <span className="text-purple-400">
                          {Math.round(cropBox.width * active.naturalSize.width / active.displaySize.width)}×{Math.round(cropBox.height * active.naturalSize.height / active.displaySize.height)}
                        </span>
                      </div>
                      {images.length > 1 && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">{lang === 'ar' ? 'الصور' : 'Images'}</span>
                          <span className="text-green-400">{images.length} {lang === 'ar' ? 'صورة' : 'files'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>

      {/* Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setShowGuide(false)}>
          <div className="bg-[#14171C] border border-[#2D3139] rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <HelpCircle size={18} className="text-blue-400" />
                {lang === 'ar' ? 'طريقة استخدام الأداة' : 'How to Use'}
              </h2>
              <button onClick={() => setShowGuide(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                <X size={16} className="text-gray-400" />
              </button>
            </div>

            <div className="space-y-3 text-[10px] sm:text-xs text-gray-300 leading-relaxed">
              <div className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[9px] font-bold text-blue-400">1</span>
                </div>
                <div>
                  <p className="font-bold text-white mb-0.5">{lang === 'ar' ? 'ارفع الصور' : 'Upload Images'}</p>
                  <p className="text-gray-400">{lang === 'ar' ? 'ارفع صور فردية أو فولدر كله صور من القائمة الجانبية' : 'Upload individual images or a whole folder from the sidebar'}</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[9px] font-bold text-purple-400">2</span>
                </div>
                <div>
                  <p className="font-bold text-white mb-0.5">{lang === 'ar' ? 'حدد منطقة القص' : 'Select Crop Area'}</p>
                  <p className="text-gray-400">{lang === 'ar' ? 'اسحب الصندوق على الصورة وغيّر الحجم من الزوايا' : 'Drag the box on the image and resize from the corners'}</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[9px] font-bold text-green-400">3</span>
                </div>
                <div>
                  <p className="font-bold text-white mb-0.5">{lang === 'ar' ? 'قص الكل مرة واحدة' : 'Crop All at Once'}</p>
                  <p className="text-gray-400">{lang === 'ar' ? 'اضغط "قص الكل" لقص كل الصور بنفس المنطقة المحددة' : 'Click "Crop All" to crop every image with the same area'}</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[9px] font-bold text-emerald-400">4</span>
                </div>
                <div>
                  <p className="font-bold text-white mb-0.5">{lang === 'ar' ? 'حمّل النتائج' : 'Download Results'}</p>
                  <p className="text-gray-400">{lang === 'ar' ? 'حمّل صورة واحدة أو كلهم في ZIP بنفس الأسماء والفولدرات' : 'Download single image or all as ZIP preserving names and folders'}</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <p className="text-[9px] sm:text-[10px] text-blue-300 font-mono">
                {lang === 'ar' ? 'الحجم المحدد بيتحفظ تلقائي وبيتكرر على كل الصور. الصور بتتحفظ بنفس الصيغة والجودة الأصلية.' : 'Your crop size is saved and reused for all images. Images are saved in their original format and quality.'}
              </p>
            </div>

            <button
              onClick={() => { setShowGuide(false); markGuideSeen(); }}
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg font-bold text-xs transition-all"
            >
              {lang === 'ar' ? 'فهمت، يلا نبدأ' : "Got it, let's go"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
