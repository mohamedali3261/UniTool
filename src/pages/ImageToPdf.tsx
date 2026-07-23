import { useState, useRef, useCallback } from 'react';
import { Upload, Download, Loader2, Trash2, GripVertical, ImagePlus, FileDown, ArrowUp, ArrowDown, FileText } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { cn } from '../lib/utils';

interface Props {
  t: any;
  lang: 'ar' | 'en';
}

interface ImageItem {
  id: number;
  name: string;
  dataUrl: string;
  width: number;
  height: number;
}

export function ImageToPdf({ t, lang }: Props) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<'a4' | 'letter' | 'fit'>('fit');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape' | 'auto'>('auto');
  const [margin, setMargin] = useState(20);
  const [nextId, setNextId] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mobileTab, setMobileTab] = useState<'upload' | 'images' | 'export'>('upload');

  const loadImage = (file: File): Promise<ImageItem> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          resolve({
            id: nextId,
            name: file.name.replace(/\.[^.]+$/, ''),
            dataUrl: reader.result as string,
            width: img.width,
            height: img.height,
          });
        };
        img.onerror = reject;
        img.src = reader.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setError(null);
    setLoading(true);

    try {
      let idCounter = nextId;
      const newImages: ImageItem[] = [];

      for (const f of Array.from(files)) {
        if (!f.type.startsWith('image/')) continue;
        const item = await loadImage(f);
        item.id = idCounter++;
        newImages.push(item);
      }

      if (newImages.length === 0) {
        setError(lang === 'ar' ? 'لم يتم العثور على صور' : 'No images found');
        setLoading(false);
        return;
      }

      setImages(prev => [...prev, ...newImages]);
      setNextId(idCounter);
    } catch {
      setError(lang === 'ar' ? 'فشل تحميل الصور' : 'Failed to load images');
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  }, [nextId, lang]);

  const removeImage = (id: number) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const clearAll = () => {
    setImages([]);
    setNextId(1);
    setError(null);
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    setImages(prev => {
      const newImages = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newImages.length) return prev;
      [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];
      return newImages;
    });
  };

  const getPageSize = (imgWidth: number, imgHeight: number) => {
    if (pageSize === 'fit') {
      const scale = margin * 2;
      return { width: imgWidth + scale, height: imgHeight + scale };
    }
    const sizes: Record<string, { width: number; height: number }> = {
      a4: { width: 595.28, height: 841.89 },
      letter: { width: 612, height: 792 },
    };
    const base = sizes[pageSize] || sizes.a4;
    if (orientation === 'landscape') {
      return { width: Math.max(base.width, base.height), height: Math.min(base.width, base.height) };
    }
    if (orientation === 'portrait') {
      return { width: Math.min(base.width, base.height), height: Math.max(base.width, base.height) };
    }
    return imgWidth > imgHeight
      ? { width: Math.max(base.width, base.height), height: Math.min(base.width, base.height) }
      : { width: Math.min(base.width, base.height), height: Math.max(base.width, base.height) };
  };

  const generatePdf = async () => {
    if (images.length === 0) return;
    setGenerating(true);
    setError(null);

    try {
      const pdfDoc = await PDFDocument.create();

      for (const img of images) {
        let pdfImage;
        if (img.dataUrl.includes('image/png')) {
          const bytes = Uint8Array.from(atob(img.dataUrl.split(',')[1]), c => c.charCodeAt(0));
          pdfImage = await pdfDoc.embedPng(bytes);
        } else {
          const bytes = Uint8Array.from(atob(img.dataUrl.split(',')[1]), c => c.charCodeAt(0));
          pdfImage = await pdfDoc.embedJpg(bytes);
        }

        const { width: pageW, height: pageH } = getPageSize(img.width, img.height);
        const page = pdfDoc.addPage([pageW, pageH]);

        const imgAspect = img.width / img.height;
        const pageAspect = (pageW - margin * 2) / (pageH - margin * 2);

        let drawW: number, drawH: number;
        if (imgAspect > pageAspect) {
          drawW = pageW - margin * 2;
          drawH = drawW / imgAspect;
        } else {
          drawH = pageH - margin * 2;
          drawW = drawH * imgAspect;
        }

        const x = (pageW - drawW) / 2;
        const y = (pageH - drawH) / 2;

        page.drawImage(pdfImage, { x, y, width: drawW, height: drawH });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `images_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF generation error:', err);
      setError(lang === 'ar' ? 'فشل إنشاء PDF' : 'Failed to generate PDF');
    } finally {
      setGenerating(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] bg-[#0F1115]/50 shrink-0 sm:px-4 sm:py-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-600 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/20 sm:w-8 sm:h-8">
          <FileText size={14} className="text-white" />
        </div>
        <div>
          <h1 className="text-xs font-bold text-white sm:text-sm">{lang === 'ar' ? 'صور لـ PDF' : 'Image to PDF'}</h1>
          <p className="text-[8px] text-gray-500 font-mono sm:text-[9px]">{lang === 'ar' ? 'دمج الصور في ملف PDF واحد' : 'Merge images into a single PDF file'}</p>
        </div>
      </div>

      {/* Mobile Tabs */}
      <div className="flex border-b border-[#2D3139] bg-[#14171C] sm:hidden shrink-0">
        {[
          { id: 'upload', label: lang === 'ar' ? 'رفع' : 'Upload', icon: Upload },
          { id: 'images', label: lang === 'ar' ? 'صور' : 'Images', icon: ImagePlus },
          { id: 'export', label: lang === 'ar' ? 'تصدير' : 'Export', icon: FileDown },
        ].map(tab => (
          <button key={tab.id} onClick={() => setMobileTab(tab.id as any)}
            className={cn("flex-1 py-2.5 flex flex-col items-center gap-1 font-mono text-[7px] uppercase tracking-widest transition-colors", mobileTab === tab.id ? "text-red-500 bg-[#1A1D23]" : "text-gray-500")}>
            <tab.icon size={12} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={cn("w-full sm:w-72 bg-[#14171C] border-r border-[#2D3139] flex flex-col shrink-0 overflow-y-auto", mobileTab === 'upload' || mobileTab === 'export' ? "flex" : "hidden sm:flex")}>
          {/* Upload */}
          <div className={cn(mobileTab === 'upload' ? "block" : "hidden sm:block")}>
            <div className="p-3 border-b border-[#2D3139] sm:p-4">
              <label className={cn("flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-[#2D3139] rounded-lg cursor-pointer hover:border-red-500/50 transition-colors bg-[#0F1115]", images.length > 0 ? "border-red-500/30" : "")}>
                <ImagePlus size={20} className={images.length > 0 ? "text-red-500" : "text-gray-500"} />
                <span className="text-[9px] font-mono text-gray-400 text-center leading-relaxed">
                  {images.length > 0 ? (lang === 'ar' ? 'إضافة المزيد من الصور' : 'Add more images') : (lang === 'ar' ? 'اختر صور' : 'Select images')}
                </span>
                <span className="text-[7px] font-mono text-gray-600">PNG, JPG, WEBP, BMP</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
              </label>
              {error && <p className="text-[8px] text-red-400 mt-2 font-mono">{error}</p>}
              {loading && (
                <div className="flex items-center gap-2 mt-3 text-[8px] text-gray-400 font-mono">
                  <Loader2 size={10} className="animate-spin" />
                  {lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                </div>
              )}
              {images.length > 0 && (
                <button onClick={clearAll} className="w-full mt-3 py-2 flex items-center justify-center gap-1.5 text-[8px] font-mono text-red-400 hover:text-red-300 border border-red-900/30 hover:border-red-500/50 rounded-md transition-all bg-red-950/20">
                  <Trash2 size={10} />{lang === 'ar' ? 'مسح الكل' : 'Clear all'}
                </button>
              )}
            </div>
          </div>

          {/* Settings */}
          <div className={cn("flex flex-col flex-1", mobileTab === 'export' ? "flex" : "hidden sm:flex")}>
            <div className="p-3 border-b border-[#2D3139] sm:p-4">
              <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3 sm:text-[10px]">{lang === 'ar' ? 'إعدادات PDF' : 'PDF Settings'}</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-[8px] font-mono text-gray-500 uppercase tracking-wider sm:text-[9px]">{lang === 'ar' ? 'حجم الصفحة' : 'Page Size'}</label>
                  <div className="flex gap-1 mt-1.5">
                    {(['fit', 'a4', 'letter'] as const).map(s => (
                      <button key={s} onClick={() => setPageSize(s)}
                        className={cn("flex-1 py-2 text-[9px] font-mono uppercase tracking-wider rounded-md border transition-all sm:py-2.5",
                          pageSize === s ? "bg-red-600/20 border-red-500/40 text-red-400" : "bg-[#0F1115] border-[#2D3139] text-gray-500 hover:border-gray-500"
                        )}>
                        {s === 'fit' ? (lang === 'ar' ? 'ملائم' : 'Fit') : s.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                {pageSize !== 'fit' && (
                  <div>
                    <label className="text-[8px] font-mono text-gray-500 uppercase tracking-wider sm:text-[9px]">{lang === 'ar' ? 'الاتجاه' : 'Orientation'}</label>
                    <div className="flex gap-1 mt-1.5">
                      {(['auto', 'portrait', 'landscape'] as const).map(o => (
                        <button key={o} onClick={() => setOrientation(o)}
                          className={cn("flex-1 py-2 text-[8px] font-mono uppercase tracking-wider rounded-md border transition-all",
                            orientation === o ? "bg-red-600/20 border-red-500/40 text-red-400" : "bg-[#0F1115] border-[#2D3139] text-gray-500 hover:border-gray-500"
                          )}>
                          {o === 'auto' ? (lang === 'ar' ? 'تلقائي' : 'Auto') : o === 'portrait' ? (lang === 'ar' ? 'عمودي' : 'Portrait') : (lang === 'ar' ? 'أفقي' : 'Landscape')}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-[8px] font-mono text-gray-500 uppercase tracking-wider sm:text-[9px]">{lang === 'ar' ? 'الهامش' : 'Margin'}: {margin}px</label>
                  <input type="range" min="0" max="50" step="5" value={margin} onChange={e => setMargin(parseInt(e.target.value))} className="w-full mt-1.5 accent-red-500" />
                  <div className="flex justify-between text-[7px] font-mono text-gray-600 mt-1">
                    <span>0px</span><span>50px</span>
                  </div>
                </div>
              </div>
            </div>

            {images.length > 0 && (
              <div className="p-3 border-b border-[#2D3139] sm:p-4">
                <div className="space-y-2 text-[8px] font-mono text-gray-500">
                  <div className="flex justify-between"><span>{lang === 'ar' ? 'الصور' : 'Images'}:</span><span>{images.length}</span></div>
                  <div className="flex justify-between"><span>{lang === 'ar' ? 'الحجم التقديري' : 'Est. Size'}:</span><span className="text-gray-400">~{(images.length * 0.1).toFixed(1)} MB</span></div>
                </div>
              </div>
            )}

            <div className="p-3 mt-auto sm:p-4">
              <button onClick={generatePdf} disabled={images.length === 0 || generating}
                className={cn("w-full py-3 flex items-center justify-center gap-2 text-[9px] font-mono uppercase tracking-wider rounded-lg transition-all sm:py-3.5",
                  images.length > 0 ? "bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-500 hover:to-rose-500 shadow-lg shadow-red-500/20" : "bg-[#2D3139] text-gray-600 cursor-not-allowed"
                )}>
                {generating ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                {generating ? (lang === 'ar' ? 'جاري الإنشاء...' : 'Generating...') : (lang === 'ar' ? 'إنشاء وتحميل PDF' : 'Generate & Download PDF')}
              </button>
            </div>
          </div>
        </aside>

        {/* Images Grid */}
        <section className={cn("flex-1 overflow-y-auto bg-[#0A0C0F]", mobileTab === 'images' ? "flex" : "hidden sm:flex")}>
          {images.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center max-w-xs">
                <FileText size={32} className="text-gray-700 mx-auto mb-3" />
                <p className="text-[10px] font-mono text-gray-600">{lang === 'ar' ? 'اختر صور لإنشاء PDF' : 'Select images to create PDF'}</p>
              </div>
            </div>
          ) : (
            <div className="p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-3 text-[9px] font-mono text-gray-500">
                <ImagePlus size={12} />
                <span>{images.length} {lang === 'ar' ? 'صورة' : 'image'}{images.length !== 1 ? 's' : ''}</span>
                <span className="text-gray-700 mx-1">|</span>
                <span className="text-red-400/70">{pageSize.toUpperCase()}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {images.map((img, index) => (
                  <div key={img.id} className="relative rounded-lg overflow-hidden border border-[#2D3139] group bg-[#1A1D23]">
                    <div className="relative aspect-[3/4] bg-[#0F1115] flex items-center justify-center overflow-hidden">
                      <img src={img.dataUrl} alt={img.name} className="w-full h-full object-contain" draggable={false} />
                      <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-black/60 text-[7px] font-mono text-white">
                        {index + 1}
                      </div>
                    </div>
                    <div className="p-2">
                      <p className="text-[8px] font-mono text-white truncate leading-tight">{img.name}</p>
                      <p className="text-[7px] font-mono text-gray-500 mt-0.5">{img.width}x{img.height}</p>
                    </div>
                    <div className="absolute top-1 left-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {index > 0 && (
                        <button onClick={() => moveImage(index, 'up')} className="w-5 h-5 rounded-full bg-black/60 hover:bg-red-500 flex items-center justify-center transition-colors">
                          <ArrowUp size={10} className="text-white" />
                        </button>
                      )}
                      {index < images.length - 1 && (
                        <button onClick={() => moveImage(index, 'down')} className="w-5 h-5 rounded-full bg-black/60 hover:bg-red-500 flex items-center justify-center transition-colors">
                          <ArrowDown size={10} className="text-white" />
                        </button>
                      )}
                    </div>
                    <button onClick={() => removeImage(img.id)} className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-black/60 hover:bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 size={9} className="text-white" />
                    </button>
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
