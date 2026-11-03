import React, { useEffect, useState, useRef } from 'react';
import { ToastMessage } from '../../types';
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useDcLang } from '../../hooks/useDcLang';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

/** One shared FIFO notification surface for every Design Studio message type. */
export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  const { lang, t } = useDcLang();
  const ar = lang === 'ar';
  const reduceMotion = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(() => document.hidden);
  const current = toasts[0];
  const card = useRef<HTMLElement | null>(null);
  useEffect(() => {
    setFocused(!!card.current?.contains(document.activeElement));
    if (!current) setHovered(false);
  }, [current?.id]);
  useEffect(() => {
    const update = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  useEffect(() => {
    if (!current || hovered || focused || hidden) return;
    const duration = current.type === 'error' ? 6500 : current.type === 'warning' ? 5500 : 3500;
    const timer = setTimeout(() => onDismiss(current.id), duration);
    return () => clearTimeout(timer);
  }, [current?.id, current?.count, current?.type, hovered, focused, hidden, onDismiss]);
  // Always mount the live region so assistive technology can announce updates.
  const tone = current?.type === 'success' ? 'border-emerald-500/50 text-emerald-100'
    : current?.type === 'error' ? 'border-rose-500/60 text-rose-100'
    : current?.type === 'warning' ? 'border-amber-500/60 text-amber-100'
    : 'border-sky-500/50 text-slate-100';
  const Icon = current?.type === 'success' ? CheckCircle2 : current?.type === 'error' ? AlertCircle : current?.type === 'warning' ? AlertTriangle : Info;
  const Next = ar ? ChevronLeft : ChevronRight;
  return <div id="toast-container" role="status" aria-live="polite" aria-atomic="true" dir={ar ? 'rtl' : 'ltr'}
    className="fixed left-1/2 -translate-x-1/2 sm:left-6 sm:translate-x-0 z-[300] w-[min(280px,calc(100vw-24px))] sm:w-[360px] pointer-events-none"
    style={{ bottom: 'max(80px, calc(env(safe-area-inset-bottom, 0px) + 16px))' }}>
    {current && <motion.section ref={card} data-testid="notification-card" data-type={current.type}
      initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .16 }}
      onPointerEnter={e => { if (e.pointerType === 'mouse') setHovered(true); }} onPointerLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)} onBlurCapture={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocused(false); }}
      className={`pointer-events-auto overflow-hidden rounded-2xl border bg-slate-950/95 shadow-[0_12px_40px_#0008] ${tone}`}>
      <div className="flex items-start gap-3 p-3">
        <span className="rounded-xl bg-white/5 p-2 shrink-0"><Icon className="h-5 w-5" aria-hidden="true" /></span>
        <div className="min-w-0 flex-1 py-0.5 break-words [overflow-wrap:anywhere]">
          <div className="text-xs font-bold">{current.title}</div>
          {current.message && <p className="mt-1 text-xs leading-relaxed opacity-80 max-h-32 overflow-y-auto">{current.message}</p>}
          {(current.count || 1) > 1 && <span data-testid="notification-repeat" className="mt-2 inline-block rounded-md bg-white/10 px-2 py-0.5 text-[10px]">{ar ? `تكررت ${current.count} مرات` : `Repeated ${current.count} times`}</span>}
        </div>
        <button type="button" onClick={() => onDismiss(current.id)} aria-label={t.close} title={t.close}
          className="flex min-h-9 min-w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400"><X className="h-4 w-4" /></button>
      </div>
      {toasts.length > 1 && <div className="flex items-center justify-between gap-2 border-t border-white/10 bg-white/[.03] px-3 py-1.5">
        <span data-testid="notification-pending" className="text-[11px] text-slate-400">{ar ? `${toasts.length - 1} رسائل تالية` : `${toasts.length - 1} messages waiting`}</span>
        <button type="button" onClick={() => onDismiss(current.id)} className="flex min-h-9 items-center gap-1 rounded-lg px-3 text-xs font-semibold hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400">{ar ? 'التالي' : 'Next'}<Next className="h-3.5 w-3.5" /></button>
      </div>}
    </motion.section>}
  </div>;
};
