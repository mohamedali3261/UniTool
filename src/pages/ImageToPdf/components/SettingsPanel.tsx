import { Download, Loader2, Eye, Palette, Settings2, FileCog } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { estimatePdfMb, formatBytes } from '../utils/pdf';
import type { PdfSettings } from '../types';

interface Props {
  lang: 'ar' | 'en';
  settings: PdfSettings;
  onChange: (patch: Partial<PdfSettings>) => void;
  imageCount: number;
  totalBytes: number;
  generating: boolean;
  progress: number;
  onDownload: () => void;
  onPreview: () => void;
}

export function SettingsPanel({
  lang, settings, onChange, imageCount, totalBytes, generating, progress, onDownload, onPreview,
}: Props) {
  const {
    pageSize, orientation, fitMode, margin, imagesPerPage,
    quality, imageFormat, grayscale, bgColor, showPageNumbers, fileName, pdfTitle, pdfAuthor,
  } = settings;

  return (
    <div className="p-3 sm:p-4 space-y-4">
      <div className="bg-[#0F1115] border border-[#2D3139] rounded-lg p-3">
        <h3 className="text-[10px] font-bold text-gray-300 mb-2.5 flex items-center gap-1.5"><Settings2 size={12} className="text-red-500" />{lang === 'ar' ? 'الصفحة والتخطيط' : 'Page & Layout'}</h3>
        <label className="text-[9px] font-mono text-gray-500 uppercase">{lang === 'ar' ? 'حجم الصفحة' : 'Page Size'}</label>
        <div className="grid grid-cols-3 gap-1 mt-1.5">
          {(['fit', 'a5', 'a4', 'a3', 'letter', 'legal'] as const).map(s => (
            <button key={s} onClick={() => onChange({ pageSize: s })}
              className={cn("py-2 text-[9px] font-mono uppercase rounded-md border transition-all",
                pageSize === s ? "bg-red-600/20 border-red-500/40 text-red-400 font-bold" : "bg-[#14171C] border-[#2D3139] text-gray-500 hover:border-gray-500")}>
              {s === 'fit' ? (lang === 'ar' ? 'ملائم' : 'Fit') : s.toUpperCase()}
            </button>
          ))}
        </div>
        {pageSize !== 'fit' && (
          <div className="flex gap-1 mt-2">
            {(['auto', 'portrait', 'landscape'] as const).map(o => (
              <button key={o} onClick={() => onChange({ orientation: o })}
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
                <button key={f} onClick={() => onChange({ fitMode: f })} title={f}
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
                <button key={n} onClick={() => onChange({ imagesPerPage: n })}
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
          <input type="range" min="0" max="100" step="2" value={margin} onChange={e => onChange({ margin: +e.target.value })} className="w-full mt-1 accent-red-500" />
        </div>
      </div>

      <div className="bg-[#0F1115] border border-[#2D3139] rounded-lg p-3">
        <h3 className="text-[10px] font-bold text-gray-300 mb-2.5 flex items-center gap-1.5"><Palette size={12} className="text-red-500" />{lang === 'ar' ? 'الجودة والألوان' : 'Quality & Color'}</h3>
        <label className="text-[9px] font-mono text-gray-500 uppercase">{lang === 'ar' ? 'جودة الضغط' : 'JPEG Quality'}: {Math.round(quality * 100)}%</label>
        <input type="range" min="0.3" max="1" step="0.02" value={quality} onChange={e => onChange({ quality: +e.target.value })} className="w-full mt-1 accent-red-500" />
        <div className="flex justify-between text-[7px] font-mono text-gray-600"><span>{lang === 'ar' ? 'أصغر حجم' : 'Smaller'}</span><span>{lang === 'ar' ? 'أعلى جودة' : 'Best'}</span></div>
        <div className="flex gap-1 mt-2.5">
          <label className="text-[9px] font-mono text-gray-500 uppercase self-center">{lang === 'ar' ? 'الصيغة' : 'Format'}:</label>
          {(['auto', 'jpeg', 'png'] as const).map(f => (
            <button key={f} onClick={() => onChange({ imageFormat: f })}
              className={cn("flex-1 py-1.5 text-[8px] font-mono uppercase rounded-md border",
                imageFormat === f ? "bg-red-600/20 border-red-500/40 text-red-400 font-bold" : "bg-[#14171C] border-[#2D3139] text-gray-500")}>
              {f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2.5">
          <input type="color" value={bgColor} onChange={e => onChange({ bgColor: e.target.value })} className="w-8 h-7 rounded cursor-pointer bg-transparent border border-[#2D3139]" />
          <span className="text-[9px] font-mono text-gray-400">{lang === 'ar' ? 'لون الخلفية' : 'Background'} {bgColor}</span>
          <div className="flex gap-1 ms-auto">
            {['#ffffff', '#000000', '#f3f4f6', '#fef3c7'].map(c => (
              <button key={c} onClick={() => onChange({ bgColor: c })} className={cn("w-5 h-5 rounded-full border", bgColor === c ? "border-red-500 ring-1 ring-red-500" : "border-gray-600")} style={{ background: c }} />
            ))}
          </div>
        </div>
        <label className="flex items-center gap-2 mt-2.5 cursor-pointer">
          <input type="checkbox" checked={grayscale} onChange={e => onChange({ grayscale: e.target.checked })} className="accent-red-500 w-3.5 h-3.5" />
          <span className="text-[9px] font-mono text-gray-400">{lang === 'ar' ? 'تحويل لأبيض وأسود' : 'Grayscale (B&W)'}</span>
        </label>
        <label className="flex items-center gap-2 mt-2 cursor-pointer">
          <input type="checkbox" checked={showPageNumbers} onChange={e => onChange({ showPageNumbers: e.target.checked })} className="accent-red-500 w-3.5 h-3.5" />
          <span className="text-[9px] font-mono text-gray-400">{lang === 'ar' ? 'ترقيم الصفحات' : 'Page numbers'}</span>
        </label>
      </div>

      <div className="bg-[#0F1115] border border-[#2D3139] rounded-lg p-3">
        <h3 className="text-[10px] font-bold text-gray-300 mb-2.5 flex items-center gap-1.5"><FileCog size={12} className="text-red-500" />{lang === 'ar' ? 'اسم الملف والبيانات' : 'File & Metadata'}</h3>
        <input value={fileName} onChange={e => onChange({ fileName: e.target.value })} placeholder={lang === 'ar' ? 'اسم الملف' : 'File name'}
          className="w-full bg-[#14171C] border border-[#2D3139] rounded-md px-2.5 py-2 text-[10px] font-mono text-white placeholder:text-gray-600 focus:border-red-500/60 outline-none" />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <input value={pdfTitle} onChange={e => onChange({ pdfTitle: e.target.value })} placeholder={lang === 'ar' ? 'عنوان PDF' : 'PDF title'}
            className="bg-[#14171C] border border-[#2D3139] rounded-md px-2.5 py-2 text-[10px] font-mono text-white placeholder:text-gray-600 focus:border-red-500/60 outline-none" />
          <input value={pdfAuthor} onChange={e => onChange({ pdfAuthor: e.target.value })} placeholder={lang === 'ar' ? 'المؤلف' : 'Author'}
            className="bg-[#14171C] border border-[#2D3139] rounded-md px-2.5 py-2 text-[10px] font-mono text-white placeholder:text-gray-600 focus:border-red-500/60 outline-none" />
        </div>
      </div>

      {imageCount > 0 && (
        <div className="bg-[#0F1115] border border-[#2D3139] rounded-lg p-3">
          <div className="space-y-1.5 text-[9px] font-mono text-gray-500">
            <div className="flex justify-between"><span>{lang === 'ar' ? 'الصور' : 'Images'}:</span><span className="text-white font-bold">{imageCount}</span></div>
            <div className="flex justify-between"><span>{lang === 'ar' ? 'الصفحات' : 'Pages'}:</span><span className="text-white font-bold">{Math.ceil(imageCount / imagesPerPage)}</span></div>
            <div className="flex justify-between"><span>{lang === 'ar' ? 'الحجم الأصلي' : 'Original'}:</span><span className="text-gray-300">{formatBytes(totalBytes)}</span></div>
            <div className="flex justify-between"><span>{lang === 'ar' ? 'التقديري' : 'Est. PDF'}:</span><span className="text-green-400">~{estimatePdfMb(imageCount, imageFormat, quality).toFixed(1)} MB</span></div>
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
        <button onClick={onDownload} disabled={imageCount === 0 || generating}
          className={cn("flex-1 py-3 flex items-center justify-center gap-2 text-[10px] font-mono font-bold uppercase tracking-wider rounded-lg transition-all",
            imageCount > 0 ? "bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-500 hover:to-rose-500 shadow-lg shadow-red-500/20" : "bg-[#2D3139] text-gray-600 cursor-not-allowed")}>
          {generating ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
          {generating ? `${progress}%` : (lang === 'ar' ? 'تحميل PDF' : 'Download PDF')}
        </button>
        <button onClick={onPreview} disabled={imageCount === 0 || generating} title={lang === 'ar' ? 'معاينة' : 'Preview'}
          className="px-3.5 py-3 rounded-lg border border-[#2D3139] bg-[#0F1115] text-gray-300 hover:border-red-500/50 hover:text-white transition-all disabled:opacity-40">
          <Eye size={14} />
        </button>
      </div>
    </div>
  );
}
