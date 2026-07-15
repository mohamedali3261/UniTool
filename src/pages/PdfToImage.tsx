import { useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Upload, Download, Loader2, FileImage, CheckSquare, Square, FileType2, FileDown, Trash2, ImagePlus } from 'lucide-react';
import JSZip from 'jszip';
import { cn } from '../lib/utils';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface Props {
  t: any;
  lang: 'ar' | 'en';
}

interface PageImage {
  id: number;
  dataUrl: string;
  width: number;
  height: number;
  name: string;
}

export function PdfToImage({ t, lang }: Props) {
  const [pages, setPages] = useState<PageImage[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [format, setFormat] = useState<'png' | 'jpeg'>('png');
  const [quality, setQuality] = useState(0.92);
  const [loading, setLoading] = useState(false);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'upload' | 'pages' | 'export'>('upload');
  const [nextId, setNextId] = useState(1);

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
      await page.render({ canvas, canvasContext: ctx, viewport }).promise;
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

  const acceptedTypes = '.pdf,image/*';

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
                disabled={selectedIds.size === 0 || converting}
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
                    {/* Download single */}
                    <button
                      onClick={e => { e.stopPropagation(); downloadSingle(page); }}
                      className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-black/40 hover:bg-orange-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                      title={lang === 'ar' ? 'تحميل' : 'Download'}
                    >
                      <Download size={10} className="text-white" />
                    </button>
                    {/* Remove single */}
                    <button
                      onClick={e => { e.stopPropagation(); removePage(page.id); }}
                      className="absolute top-8 left-1.5 w-5 h-5 rounded-full bg-black/40 hover:bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                      title={lang === 'ar' ? 'حذف' : 'Remove'}
                    >
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
