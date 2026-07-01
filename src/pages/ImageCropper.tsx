import { useState, useRef, useEffect, ChangeEvent } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Download,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Scissors,
  Maximize2,
  Minimize2,
  Trash2,
  FolderDown,
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
}

const MIN_CROP_SIZE = 50;

export function ImageCropper({ t, lang }: ImageCropperProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageNaturalSize, setImageNaturalSize] = useState<DisplaySize | null>(null);
  const [cropBox, setCropBox] = useState<CropBox>({ x: 0, y: 0, width: 200, height: 200 });
  const [croppedItems, setCroppedItems] = useState<CroppedItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState('');
  const [displaySize, setDisplaySize] = useState<DisplaySize>({ width: 0, height: 0 });

  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragStartRef = useRef<{ x: number; y: number; box: CropBox }>({ x: 0, y: 0, box: { x: 0, y: 0, width: 0, height: 0 } });

  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      croppedItems.forEach(item => URL.revokeObjectURL(item.url));
    };
  }, [imageUrl, croppedItems]);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      croppedItems.forEach(item => URL.revokeObjectURL(item.url));
      setImageFile(file);
      setImageUrl(URL.createObjectURL(file));
      setCroppedItems([]);
      setError(null);
    }
  };

  const handleImageLoad = () => {
    if (!imageRef.current || !containerRef.current) return;
    const img = imageRef.current;
    const rect = img.getBoundingClientRect();
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);
    setDisplaySize({ width: w, height: h });
    setImageNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
    const cw = Math.round(w * 0.5);
    const ch = Math.round(h * 0.5);
    setCropBox({
      x: Math.round((w - cw) / 2),
      y: Math.round((h - ch) / 2),
      width: Math.max(MIN_CROP_SIZE, cw),
      height: Math.max(MIN_CROP_SIZE, ch),
    });
  };

  const handleMouseDown = (e: React.MouseEvent, type: 'move' | 'resize', handle: string = '') => {
    e.preventDefault();
    e.stopPropagation();
    if (type === 'move') {
      setIsDragging(true);
    } else {
      setIsResizing(true);
      setResizeHandle(handle);
    }
    dragStartRef.current = { x: e.clientX, y: e.clientY, box: { ...cropBox } };
  };

  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      if (!isDragging && !isResizing) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      const box = dragStartRef.current.box;

      if (isDragging) {
        setCropBox(prev => ({
          ...prev,
          x: Math.max(0, Math.min(displaySize.width - prev.width, box.x + dx)),
          y: Math.max(0, Math.min(displaySize.height - prev.height, box.y + dy)),
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

        if (newX < 0) { newX = 0; }
        if (newY < 0) { newY = 0; }
        if (newX + newW > displaySize.width) newW = displaySize.width - newX;
        if (newY + newH > displaySize.height) newH = displaySize.height - newY;

        setCropBox({ x: newX, y: newY, width: Math.max(MIN_CROP_SIZE, newW), height: Math.max(MIN_CROP_SIZE, newH) });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, resizeHandle, displaySize]);

  const processCrop = () => {
    if (!imageRef.current || !canvasRef.current || !imageNaturalSize) return;
    const img = imageRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setProcessing(true);

    const scaleX = imageNaturalSize.width / displaySize.width;
    const scaleY = imageNaturalSize.height / displaySize.height;

    const sx = Math.round(cropBox.x * scaleX);
    const sy = Math.round(cropBox.y * scaleY);
    const sw = Math.round(cropBox.width * scaleX);
    const sh = Math.round(cropBox.height * scaleY);

    canvas.width = sw;
    canvas.height = sh;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const newItem: CroppedItem = {
          id: Math.random().toString(36).substr(2, 9),
          blob,
          url,
          width: sw,
          height: sh,
        };
        setCroppedItems(prev => [newItem, ...prev]);
      }
      setProcessing(false);
    }, 'image/png');
  };

  const downloadItem = (item: CroppedItem) => {
    const a = document.createElement('a');
    a.href = item.url;
    a.download = `cropped_${item.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadAllAsZip = async () => {
    if (croppedItems.length === 0) return;
    const zip = new JSZip();
    croppedItems.forEach((item, i) => {
      zip.file(`cropped_${i + 1}_${item.width}x${item.height}.png`, item.blob);
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

  const removeImage = () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    clearAllItems();
    setImageFile(null);
    setImageUrl(null);
    setImageNaturalSize(null);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0A0C0F] overflow-hidden">
      {/* Page Header */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.06] bg-[#0F1115]/50 shrink-0 sm:px-6 sm:py-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <ImageIcon size={16} className="text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white sm:text-base">{lang === 'ar' ? 'قص الصور' : 'Image Cropper'}</h1>
          <p className="text-[9px] text-gray-500 font-mono">{lang === 'ar' ? 'قص وتدوير الصور بدقة مع معاينة مباشرة' : 'Crop and rotate images with live preview'}</p>
        </div>
      </div>
      <div className="flex-1 flex flex-col lg:flex-row gap-0">

        {/* Left Section: Image Preview */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Image Upload / Viewer */}
          <div className="flex-1 flex flex-col p-3 sm:p-4">
            {!imageFile ? (
              <label className="group relative flex flex-col items-center justify-center gap-2 flex-1 bg-[#14171C] border-2 border-dashed border-[#2D3139] hover:border-blue-500/50 rounded-lg transition-all cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                  <Upload size={20} className="text-blue-500" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm text-gray-300 font-medium">
                    {lang === 'ar' ? 'انقر لاختيار صورة' : 'Click to select image'}
                  </p>
                  <p className="text-[9px] text-gray-500 font-mono uppercase">PNG, JPG, WebP</p>
                </div>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            ) : (
              <div className="flex-1 flex flex-col gap-2 min-h-0">
                {/* Image info bar */}
                <div className="flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2 text-[9px] font-mono text-gray-400">
                    <ImageIcon size={12} className="text-blue-500" />
                    <span>{imageFile.name}</span>
                    {imageNaturalSize && (
                      <span className="text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded text-[8px]">
                        {imageNaturalSize.width} × {imageNaturalSize.height}
                      </span>
                    )}
                  </div>
                  <button onClick={removeImage} className="p-1 hover:bg-red-500/20 rounded-sm text-red-400 transition-colors">
                    <X size={14} />
                  </button>
                </div>

                {/* Image container */}
                <div
                  ref={containerRef}
                  className="relative flex-1 bg-[#14171C] rounded-lg overflow-hidden border border-[#2D3139] flex items-center justify-center"
                >
                  <div className="relative inline-block">
                    <img
                      ref={imageRef}
                      src={imageUrl!}
                      alt="Source"
                      className="block max-w-[80vw] max-h-[70vh] w-auto h-auto"
                      onLoad={handleImageLoad}
                      draggable={false}
                    />

                    {imageNaturalSize && displaySize.width > 0 && (
                      <>
                        <div
                          className="absolute inset-0 pointer-events-none bg-black/60"
                          style={{
                            clipPath: `inset(${cropBox.y}px ${displaySize.width - cropBox.x - cropBox.width}px ${displaySize.height - cropBox.y - cropBox.height}px ${cropBox.x}px)`
                          }}
                        />

                        <div
                          className="absolute cursor-move border-2 border-white/80"
                          style={{
                            left: cropBox.x,
                            top: cropBox.y,
                            width: cropBox.width,
                            height: cropBox.height,
                          }}
                          onMouseDown={(e) => handleMouseDown(e, 'move')}
                        >
                          <div className="absolute inset-0 opacity-20" style={{
                            backgroundImage: `linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)`,
                            backgroundSize: '33.33% 33.33%'
                          }} />

                          <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-blue-500 rounded-sm cursor-nw-resize z-10"
                            onMouseDown={(e) => handleMouseDown(e, 'resize', 'nw')} />
                          <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-blue-500 rounded-sm cursor-ne-resize z-10"
                            onMouseDown={(e) => handleMouseDown(e, 'resize', 'ne')} />
                          <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-blue-500 rounded-sm cursor-sw-resize z-10"
                            onMouseDown={(e) => handleMouseDown(e, 'resize', 'sw')} />
                          <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-blue-500 rounded-sm cursor-se-resize z-10"
                            onMouseDown={(e) => handleMouseDown(e, 'resize', 'se')} />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Instructions bar */}
                {imageNaturalSize && (
                  <div className="flex items-center shrink-0">
                    <div className="bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded text-[9px] text-gray-400 font-mono flex items-center gap-2">
                      <Scissors size={12} className="text-blue-400" />
                      {lang === 'ar' ? 'اسحب لتحديد • الزوايا لتغيير الحجم' : 'Drag to move • Corners to resize'}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Controls + Crops List */}
        <div className="lg:w-72 border-t lg:border-t-0 lg:border-l border-[#2D3139] bg-[#14171C] flex flex-col max-h-[50vh] lg:max-h-none">
          <div className="overflow-y-auto flex-1 p-3 space-y-3">
            {/* Crop Info */}
            {imageNaturalSize && (
              <div className="bg-[#0F1115] border border-[#2D3139] rounded-lg p-2.5 space-y-2">
                <h3 className="text-[9px] font-mono text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Maximize2 size={12} className="text-blue-500" />
                  {lang === 'ar' ? 'معلومات القص' : 'Crop Info'}
                </h3>
                <div className="space-y-1 text-[9px] font-mono">
                  <div className="flex justify-between">
                    <span className="text-gray-500">{lang === 'ar' ? 'الأصلي' : 'Original'}</span>
                    <span className="text-blue-400">{imageNaturalSize.width} × {imageNaturalSize.height}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{lang === 'ar' ? 'القص' : 'Crop'}</span>
                    <span className="text-purple-400">
                      {Math.round(cropBox.width * imageNaturalSize.width / displaySize.width)} × {Math.round(cropBox.height * imageNaturalSize.height / displaySize.height)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Crop Button */}
            {imageFile && (
              <button
                onClick={processCrop}
                disabled={processing}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-800 disabled:to-gray-800 text-white rounded-lg transition-all font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 disabled:shadow-none disabled:cursor-not-allowed"
              >
                {processing ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    {lang === 'ar' ? 'جاري القص...' : 'Cropping...'}
                  </>
                ) : (
                  <>
                    <Scissors size={14} />
                    {lang === 'ar' ? 'قص المنطقة' : 'Crop Area'}
                  </>
                )}
              </button>
            )}

            {/* Crops List */}
            {croppedItems.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-[9px] font-mono text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-green-500" />
                    {lang === 'ar' ? 'القصات' : 'Crops'} ({croppedItems.length})
                  </h3>
                  <div className="flex gap-1">
                    <button
                      onClick={downloadAllAsZip}
                      className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded text-[8px] font-bold uppercase transition-all"
                    >
                      <FolderDown size={10} />
                      ZIP
                    </button>
                    <button
                      onClick={clearAllItems}
                      className="flex items-center gap-1 px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-[8px] font-bold uppercase transition-all"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {croppedItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 bg-[#0F1115] border border-[#2D3139] rounded-lg p-1.5 group hover:border-blue-500/30 transition-colors"
                    >
                      <div className="w-10 h-10 rounded overflow-hidden bg-[#1A1D23] shrink-0 flex items-center justify-center">
                        <img src={item.url} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[8px] font-mono text-gray-400 truncate">
                          #{index + 1}
                        </div>
                        <div className="text-[7px] font-mono text-gray-600">
                          {item.width} × {item.height}
                        </div>
                      </div>
                      <button
                        onClick={() => downloadItem(item)}
                        className="p-1 bg-green-500/20 hover:bg-green-500/30 rounded text-green-400 transition-all"
                        title={lang === 'ar' ? 'تحميل' : 'Download'}
                      >
                        <Download size={12} />
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1 hover:bg-red-500/20 rounded text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Info box at bottom */}
          <div className="p-3 border-t border-[#2D3139] bg-[#0F1115] mt-auto">
            <div className="flex items-start gap-2">
              <AlertCircle size={10} className="text-blue-500 shrink-0 mt-0.5" />
              <p className="text-[7px] text-gray-500 leading-relaxed font-mono">
                {lang === 'ar'
                  ? 'معالجة في المتصفح • جودة عالية • يتم الحفظ بصيغة PNG'
                  : 'Browser processing • High quality • Saved as PNG'}
              </p>
            </div>
          </div>

          {/* Hidden canvas */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>
    </div>
  );
}
