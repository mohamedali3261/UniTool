import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Download, Upload, Zap } from 'lucide-react';
import { useDcLang } from '../../hooks/useDcLang';

export function FileMenu({ onExport, onQuickDownload }: { onExport: () => void; onQuickDownload?: () => void }) {
  const { lang, t } = useDcLang();
  const ar = lang === 'ar';
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    const escape = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); setOpen(false); trigger.current?.focus(); } };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [open]);
  const choose = (action: () => void) => { setOpen(false); trigger.current?.focus(); action(); };
  return <div ref={root} className="relative shrink-0" dir={ar ? 'rtl' : 'ltr'} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false); }}>
    <button ref={trigger} type="button" aria-label={ar ? 'استيراد / تصدير' : 'Import / Export'} aria-expanded={open} aria-controls="designer-file-actions" onClick={() => setOpen(!open)} className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-600 px-2 sm:px-3 py-2 text-xs font-bold text-white">
      <Download className="h-3.5 w-3.5" /><span className="hidden sm:inline">{ar ? 'استيراد / تصدير' : 'Import / Export'}</span><span className="sm:hidden">{ar ? 'ملفات' : 'Files'}</span><ChevronDown className="h-3 w-3" />
    </button>
    {open && <div id="designer-file-actions" role="group" aria-label={ar ? 'خيارات الملفات' : 'File actions'} className="absolute end-0 top-full mt-2 w-56 max-w-[calc(100vw-24px)] rounded-xl border border-slate-600 bg-[#0B132B] p-1 shadow-2xl">
      <button type="button" className="flex w-full items-center gap-2 rounded-lg p-3 text-start text-xs text-white hover:bg-slate-700 focus:bg-slate-700" onClick={() => choose(() => document.getElementById('designer-project-input')?.click())}><Upload className="h-4 w-4" />{ar ? 'استيراد مشروع قابل للتعديل' : 'Import editable project'}</button>
      <button type="button" className="flex w-full items-center gap-2 rounded-lg p-3 text-start text-xs text-white hover:bg-slate-700 focus:bg-slate-700" onClick={() => choose(onExport)}><Download className="h-4 w-4" />{t.export}</button>
      {onQuickDownload && <button type="button" className="flex w-full items-center gap-2 rounded-lg p-3 text-start text-xs text-white hover:bg-slate-700 focus:bg-slate-700" onClick={() => choose(onQuickDownload)}><Zap className="h-4 w-4" />{ar ? 'تحميل PNG سريع' : 'Quick PNG download'}</button>}
    </div>}
  </div>;
}
