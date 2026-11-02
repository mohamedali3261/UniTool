import { useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';

export function popoverBounds(anchor: { left: number; right: number; top: number; bottom: number }, viewport: { left: number; top: number; width: number; height: number }, measuredHeight: number, desiredWidth = 304) {
  const width = Math.max(1, Math.min(desiredWidth, viewport.width - 16));
  const height = Math.max(1, Math.min(measuredHeight, viewport.height - 16));
  const left = Math.max(viewport.left + 8, Math.min(anchor.right - width, viewport.left + viewport.width - width - 8));
  const below = anchor.bottom + 6;
  const top = Math.max(viewport.top + 8, Math.min(below + height <= viewport.top + viewport.height - 8 ? below : anchor.top - height - 6, viewport.top + viewport.height - height - 8));
  return { left, top, width, maxHeight: Math.max(1, viewport.top + viewport.height - top - 8) };
}

/** Escape clipping/stacking contexts, including cards and mobile bottom sheets. */
export function FloatingPopover({ anchor, label, onClose, children, dir }: {
  anchor: RefObject<HTMLElement | null>; label: string; onClose: () => void; children: ReactNode; dir: 'rtl' | 'ltr';
}) {
  const panel = useRef<HTMLDivElement>(null);
  const close = useRef(onClose); close.current = onClose;
  const [bounds, setBounds] = useState({ left: 8, top: 8, width: 304, maxHeight: 400 });
  const host = anchor.current?.closest('dialog[open]') || document.body;
  useLayoutEffect(() => {
    const button = anchor.current;
    const place = () => {
      if (!button?.isConnected) { close.current(); return; }
      const view = window.visualViewport;
      setBounds(popoverBounds(button.getBoundingClientRect(), { left: view?.offsetLeft || 0, top: view?.offsetTop || 0, width: view?.width || innerWidth, height: view?.height || innerHeight }, panel.current?.scrollHeight || 400));
    };
    place();
    panel.current?.focus();
    const outside = (e: Event) => {
      const target = e.target as Node;
      if (!panel.current?.contains(target) && !button?.contains(target)) close.current();
    };
    document.addEventListener('pointerdown', outside, true);
    document.addEventListener('focusin', outside);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    window.visualViewport?.addEventListener('resize', place);
    window.visualViewport?.addEventListener('scroll', place);
    const observer = new ResizeObserver(place);
    if (panel.current) observer.observe(panel.current);
    return () => {
      observer.disconnect();
      document.removeEventListener('pointerdown', outside, true);
      document.removeEventListener('focusin', outside);
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
      window.visualViewport?.removeEventListener('resize', place);
      window.visualViewport?.removeEventListener('scroll', place);
    };
  }, [anchor]);
  return createPortal(<div ref={panel} tabIndex={-1} role="dialog" aria-label={label} aria-modal="false" dir={dir} data-color-popover style={{ ...bounds, position: 'fixed', zIndex: 400, overflowY: 'auto', overscrollBehavior: 'contain' }} className="rounded-2xl border border-slate-500/70 bg-[#101b32] p-3 text-slate-100 shadow-2xl outline-none" onKeyDown={e => { e.stopPropagation(); if (e.key === 'Escape') { e.preventDefault(); close.current(); anchor.current?.focus(); } }}>
    {children}
  </div>, host);
}
