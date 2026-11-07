import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Download, Upload, Zap } from 'lucide-react';
import { useDcLang } from '../../hooks/useDcLang';

export function FileMenu({ onExport, onQuickDownload }: { onExport: () => void; onQuickDownload?: () => void }) {
  const { lang, t } = useDcLang();
  const ar = lang === 'ar';
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ left: 8, top: 8, width: 224, maxHeight: 320 });
  const focusOnOpen = useRef(false);
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const contains = (node: Node | null) => !!node && (!!root.current?.contains(node) || !!panel.current?.contains(node));
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = trigger.current?.getBoundingClientRect();
      if (!rect) return;
      const view = window.visualViewport;
      const x = view?.offsetLeft || 0, y = view?.offsetTop || 0;
      const w = view?.width || window.innerWidth, h = view?.height || window.innerHeight;
      const width = Math.min(224, Math.max(1, w - 16));
      const left = Math.max(x + 8, Math.min(ar ? rect.left : rect.right - width, x + w - width - 8));
      const height = Math.min(panel.current?.scrollHeight || 180, 320, Math.max(1, h - 16));
      const top = Math.max(y + 8, Math.min(rect.bottom + 6 + height <= y + h - 8 ? rect.bottom + 6 : rect.top - height - 6, y + h - height - 8));
      setPosition({ left, top, width, maxHeight: Math.max(1, y + h - top - 8) });
    };
    place();
    // Do not move focus during a touch click: mobile browsers may emit a
    // blur with no relatedTarget before the compatibility click completes.
    if (focusOnOpen.current) panel.current?.querySelector<HTMLButtonElement>('button')?.focus();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    window.visualViewport?.addEventListener('resize', place);
    window.visualViewport?.addEventListener('scroll', place);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
      window.visualViewport?.removeEventListener('resize', place);
      window.visualViewport?.removeEventListener('scroll', place);
    };
  }, [open, ar]);
  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => { if (!contains(e.target as Node)) setOpen(false); };
    const focusOutside = (e: FocusEvent) => { if (!contains(e.target as Node)) setOpen(false); };
    const escape = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); setOpen(false); trigger.current?.focus(); } };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    document.addEventListener('focusin', focusOutside);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); document.removeEventListener('focusin', focusOutside); };
  }, [open]);
  const choose = (action: () => void) => { setOpen(false); trigger.current?.focus(); action(); };
  return <div ref={root} className="relative shrink-0" dir={ar ? 'rtl' : 'ltr'}>
    <button data-studio-button="primary" ref={trigger} type="button" aria-label={ar ? 'استيراد / تصدير' : 'Import / Export'} aria-expanded={open} aria-controls="designer-file-actions" onClick={e => { focusOnOpen.current = e.detail === 0; setOpen(value => !value); }} onKeyDown={e => { if (e.key === 'ArrowDown') { e.preventDefault(); focusOnOpen.current = true; setOpen(true); } }} className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-600 px-2 sm:px-2.5 h-7 text-[11px] font-bold text-white leading-none">
      <Download className="h-3.5 w-3.5" /><span className="hidden sm:inline">{ar ? 'استيراد / تصدير' : 'Import / Export'}</span><span className="sm:hidden">{ar ? 'ملفات' : 'Files'}</span><ChevronDown className="h-3 w-3" />
    </button>
    {open && createPortal(<div ref={panel} id="designer-file-actions" role="group" dir={ar ? 'rtl' : 'ltr'} aria-label={ar ? 'خيارات الملفات' : 'File actions'} style={{ ...position, position: 'fixed', zIndex: 250, overflowY: 'auto' }} className="rounded-xl border border-slate-600 bg-[#0B132B] p-1 shadow-2xl">
      <button type="button" className="flex w-full items-center gap-2 rounded-lg p-3 text-start text-xs text-white hover:bg-slate-700 focus:bg-slate-700" onClick={() => choose(() => document.getElementById('designer-project-input')?.click())}><Upload className="h-4 w-4" />{ar ? 'استيراد مشروع قابل للتعديل' : 'Import editable project'}</button>
      <button type="button" className="flex w-full items-center gap-2 rounded-lg p-3 text-start text-xs text-white hover:bg-slate-700 focus:bg-slate-700" onClick={() => choose(onExport)}><Download className="h-4 w-4" />{t.export}</button>
      {onQuickDownload && <button type="button" className="flex w-full items-center gap-2 rounded-lg p-3 text-start text-xs text-white hover:bg-slate-700 focus:bg-slate-700" onClick={() => choose(onQuickDownload)}><Zap className="h-4 w-4" />{ar ? 'تحميل PNG سريع' : 'Quick PNG download'}</button>}
    </div>, document.body)}
  </div>;
}
