import { useState, useRef, useCallback } from 'react';
import { Upload, Download, Loader2, Grid3X3, Check, Image, Smartphone, Tablet, Tv, Watch, PackageOpen } from 'lucide-react';
import JSZip from 'jszip';
import { cn } from '../lib/utils';

interface Props {
  t: any;
  lang: 'ar' | 'en';
}

interface IconSize {
  name: string;
  nameAr: string;
  w: number;
  h: number;
  category: string;
}

const ICON_SIZES: IconSize[] = [
  { name: 'mdpi', nameAr: 'mdpi', w: 48, h: 48, category: 'launcher' },
  { name: 'hdpi', nameAr: 'hdpi', w: 72, h: 72, category: 'launcher' },
  { name: 'xhdpi', nameAr: 'xhdpi', w: 96, h: 96, category: 'launcher' },
  { name: 'xxhdpi', nameAr: 'xxhdpi', w: 144, h: 144, category: 'launcher' },
  { name: 'xxxhdpi', nameAr: 'xxxhdpi', w: 192, h: 192, category: 'launcher' },
  { name: 'play_store_512', nameAr: 'Play Store 512', w: 512, h: 512, category: 'store' },
  { name: 'play_store_1024', nameAr: 'Play Store 1024', w: 1024, h: 1024, category: 'store' },
  { name: 'feature_graphic', nameAr: 'Feature Graphic', w: 1024, h: 500, category: 'store' },
  { name: 'phone_screenshot', nameAr: 'هاتف', w: 1080, h: 1920, category: 'phone' },
  { name: 'tablet_7_screenshot', nameAr: 'تابلت 7"', w: 1080, h: 1920, category: 'tablet7' },
  { name: 'tablet_10_screenshot', nameAr: 'تابلت 10"', w: 1200, h: 1920, category: 'tablet10' },
  { name: 'tv_banner', nameAr: 'TV Banner', w: 320, h: 180, category: 'tv' },
  { name: 'tv_highres', nameAr: 'TV High-res', w: 1280, h: 720, category: 'tv' },
  { name: 'wear_round', nameAr: 'Wear Round', w: 320, h: 320, category: 'wear' },
  { name: 'wear_square', nameAr: 'Wear Square', w: 320, h: 320, category: 'wear' },
];

const CATEGORIES = [
  { id: 'launcher', labelAr: 'أيقونات التطبيقات', labelEn: 'Launcher Icons', icon: Smartphone, color: 'from-blue-500 to-cyan-500' },
  { id: 'store', labelAr: 'متجر Google Play', labelEn: 'Play Store', icon: PackageOpen, color: 'from-green-500 to-emerald-500' },
  { id: 'phone', labelAr: 'screenshots الهاتف', labelEn: 'Phone Screenshots', icon: Smartphone, color: 'from-purple-500 to-pink-500' },
  { id: 'tablet7', labelAr: 'تابلت 7 بوصة', labelEn: '7" Tablet', icon: Tablet, color: 'from-amber-500 to-orange-500' },
  { id: 'tablet10', labelAr: 'تابلت 10 بوصة', labelEn: '10" Tablet', icon: Tablet, color: 'from-rose-500 to-red-500' },
  { id: 'tv', labelAr: 'Android TV', labelEn: 'Android TV', icon: Tv, color: 'from-indigo-500 to-violet-500' },
  { id: 'wear', labelAr: 'Wear OS', labelEn: 'Wear OS', icon: Watch, color: 'from-teal-500 to-cyan-500' },
];

export function AppIconGenerator({ t, lang }: Props) {
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState('');
  const [generating, setGenerating] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set(CATEGORIES.map(c => c.id)));
  const [results, setResults] = useState<{ name: string; w: number; h: number; url: string; size: number }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    results.forEach(r => URL.revokeObjectURL(r.url));

    setSourceFile(file);
    setError(null);
    setResults([]);

    const url = URL.createObjectURL(file);
    setSourceUrl(url);

    const img = new window.Image();
    img.onload = () => setSourceImage(img);
    img.src = url;
  };

  const toggleCategory = (id: string) => {
    setSelectedCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const resizeImage = (img: HTMLImageElement, w: number, h: number): Promise<Blob> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      const srcAspect = img.naturalWidth / img.naturalHeight;
      const dstAspect = w / h;

      let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;

      if (srcAspect > dstAspect) {
        sw = img.naturalHeight * dstAspect;
        sx = (img.naturalWidth - sw) / 2;
      } else {
        sh = img.naturalWidth / dstAspect;
        sy = (img.naturalHeight - sh) / 2;
      }

      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
      canvas.toBlob((blob) => resolve(blob!), 'image/png');
    });
  };

  const generateAll = async () => {
    if (!sourceImage) return;
    setGenerating(true);
    setResults([]);
    setError(null);

    try {
      const sizes = ICON_SIZES.filter(s => selectedCategories.has(s.category));
      const newResults: typeof results = [];

      for (const size of sizes) {
        const blob = await resizeImage(sourceImage, size.w, size.h);
        const url = URL.createObjectURL(blob);
        newResults.push({ name: size.name, w: size.w, h: size.h, url, size: blob.size });
      }

      setResults(newResults);
    } catch (err) {
      console.error(err);
      setError(lang === 'ar' ? 'فشل توليد الصور' : 'Failed to generate images');
    } finally {
      setGenerating(false);
    }
  };

  const downloadSingle = (name: string, url: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadAllAsZip = async () => {
    if (results.length === 0) return;
    setGenerating(true);

    try {
      const zip = new JSZip();
      const folders: Record<string, typeof results> = {};

      for (const r of results) {
        const cat = ICON_SIZES.find(s => s.name === r.name)?.category || 'other';
        if (!folders[cat]) folders[cat] = [];
        folders[cat].push(r);
      }

      for (const [cat, items] of Object.entries(folders)) {
        for (const item of items) {
          const resp = await fetch(item.url);
          const blob = await resp.blob();
          zip.file(`${cat}/${item.name}.png`, blob);
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(content);
      a.download = 'app_icons.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
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
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] bg-[#0F1115]/50 shrink-0 sm:px-4 sm:py-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20 sm:w-8 sm:h-8">
          <Grid3X3 size={14} className="text-white" />
        </div>
        <div>
          <h1 className="text-xs font-bold text-white sm:text-sm">{lang === 'ar' ? 'أيقونات التطبيق' : 'App Icon Generator'}</h1>
          <p className="text-[8px] text-gray-500 font-mono sm:text-[9px]">{lang === 'ar' ? 'توليد جميع أحجام الصور المطلوبة لـ Google Play' : 'Generate all required Google Play image sizes'}</p>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
        {/* Left: Upload + Categories */}
        <div className="w-full lg:w-96 bg-[#14171C] border-r border-[#2D3139] flex flex-col shrink-0 overflow-y-auto settings-scroll">
          {/* Upload */}
          <div className="p-3 border-b border-[#2D3139] sm:p-4">
            {!sourceFile ? (
              <label
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-[#2D3139] rounded-lg cursor-pointer hover:border-green-500/50 transition-colors bg-[#0F1115]"
              >
                <Upload size={24} className="text-gray-500" />
                <span className="text-[9px] font-mono text-gray-400 text-center leading-relaxed">
                  {lang === 'ar' ? 'ارفع صورة الأيقونة (512x512 أو أعلى)' : 'Upload icon image (512x512 or higher)'}
                </span>
                <span className="text-[7px] font-mono text-gray-600">PNG, JPG, WebP</span>
              </label>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono text-gray-400 truncate max-w-[200px]">{sourceFile.name}</span>
                  <button onClick={() => {
                    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
                    results.forEach(r => URL.revokeObjectURL(r.url));
                    setSourceFile(null); setSourceUrl(''); setSourceImage(null); setResults([]);
                  }} className="text-[8px] font-mono text-red-400 hover:text-red-300">
                    {lang === 'ar' ? 'حذف' : 'Remove'}
                  </button>
                </div>
                <div className="flex gap-2 text-[8px] font-mono text-gray-500">
                  <span>{sourceImage?.naturalWidth}x{sourceImage?.naturalHeight}</span>
                  <span className="text-gray-700">|</span>
                  <span>{formatBytes(sourceFile.size)}</span>
                </div>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
            {error && <p className="text-[8px] text-red-400 mt-2 font-mono">{error}</p>}
          </div>

          {/* Categories */}
          {sourceFile && (
            <div className="p-3 space-y-2 sm:p-4">
              <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2 sm:text-[10px]">
                {lang === 'ar' ? 'اختر الفئات' : 'Select Categories'}
              </h3>
              {CATEGORIES.map(cat => {
                const count = ICON_SIZES.filter(s => s.category === cat.id).length;
                const active = selectedCategories.has(cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={cn(
                      "w-full flex items-center gap-2.5 p-2.5 rounded-lg border transition-all text-left",
                      active
                        ? "bg-green-600/10 border-green-500/30 text-green-400"
                        : "bg-[#0F1115] border-[#2D3139] text-gray-500 hover:border-gray-500"
                    )}
                  >
                    <div className={cn(
                      "w-7 h-7 rounded-md flex items-center justify-center shrink-0",
                      active ? "bg-green-600/20" : "bg-[#1A1D23]"
                    )}>
                      <cat.icon size={13} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[9px] font-mono block">{lang === 'ar' ? cat.labelAr : cat.labelEn}</span>
                      <span className="text-[7px] font-mono opacity-50">{count} {lang === 'ar' ? 'أحجام' : 'sizes'}</span>
                    </div>
                    {active && <Check size={12} className="text-green-400 shrink-0" />}
                  </button>
                );
              })}

              {/* Generate Button */}
              <button
                onClick={generateAll}
                disabled={generating || selectedCategories.size === 0}
                className="w-full py-3 mt-2 flex items-center justify-center gap-2 text-[9px] font-mono uppercase tracking-wider rounded-lg transition-all bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-500 hover:to-emerald-500 shadow-lg shadow-green-500/20 disabled:opacity-60"
              >
                {generating ? <Loader2 size={12} className="animate-spin" /> : <Grid3X3 size={12} />}
                {generating
                  ? (lang === 'ar' ? 'جاري التوليد...' : 'Generating...')
                  : (lang === 'ar' ? 'توليد الكل' : 'Generate All')}
              </button>
            </div>
          )}
        </div>

        {/* Right: Results */}
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto bg-[#0A0C0F]">
          {!sourceFile ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-xs">
                <Image size={40} className="text-gray-700 mx-auto mb-3" />
                <p className="text-[10px] font-mono text-gray-600">
                  {lang === 'ar' ? 'ارفع صورة الأيقونة للبدء' : 'Upload an icon image to start'}
                </p>
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-xs">
                <Grid3X3 size={40} className="text-gray-700 mx-auto mb-3" />
                <p className="text-[10px] font-mono text-gray-600">
                  {lang === 'ar' ? 'اختر الفئات واضغط توليد' : 'Select categories and click Generate'}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 sm:p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono text-green-400 uppercase tracking-widest">
                  {results.length} {lang === 'ar' ? 'صور تم توليدها' : 'images generated'}
                </span>
                <button
                  onClick={downloadAllAsZip}
                  disabled={generating}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[8px] font-mono uppercase tracking-wider rounded-md bg-green-600/20 border border-green-500/30 text-green-400 hover:bg-green-600/30 transition-all"
                >
                  <Download size={10} />
                  {lang === 'ar' ? 'تحميل الكل ZIP' : 'Download All ZIP'}
                </button>
              </div>

              {CATEGORIES.filter(c => selectedCategories.has(c.id)).map(cat => {
                const catResults = results.filter(r => {
                  const size = ICON_SIZES.find(s => s.name === r.name);
                  return size?.category === cat.id;
                });
                if (catResults.length === 0) return null;

                return (
                  <div key={cat.id} className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <cat.icon size={11} className="text-gray-500" />
                      <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">
                        {lang === 'ar' ? cat.labelAr : cat.labelEn}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {catResults.map(r => (
                        <div
                          key={r.name}
                          className="group relative bg-[#14171C] border border-[#2D3139] rounded-lg overflow-hidden hover:border-green-500/30 transition-all"
                        >
                          <div className="aspect-square flex items-center justify-center bg-[#0F1115] p-2">
                            <img
                              src={r.url}
                              alt={r.name}
                              className="max-w-full max-h-full object-contain"
                              style={{ imageRendering: r.w <= 192 ? 'pixelated' : 'auto' }}
                            />
                          </div>
                          <div className="p-2 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[8px] font-mono text-gray-400 truncate">{r.name}</span>
                              <button
                                onClick={() => downloadSingle(r.name, r.url)}
                                className="p-1 text-gray-500 hover:text-green-400 transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <Download size={10} />
                              </button>
                            </div>
                            <div className="flex items-center gap-1.5 text-[7px] font-mono text-gray-600">
                              <span>{r.w}x{r.h}</span>
                              <span className="text-gray-700">|</span>
                              <span>{formatBytes(r.size)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
