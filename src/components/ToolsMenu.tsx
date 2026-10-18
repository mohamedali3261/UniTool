import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ExternalLink, LayoutGrid, type LucideIcon } from 'lucide-react';
import { navItems } from '../config/navigation';

interface ToolsMenuProps {
  lang: 'ar' | 'en';
  labels: { allTools: string; toolsCount: string };
  /** Highlight style for the trigger while the menu is open */
  triggerClass?: string;
  /** Render the trigger element (typically the nav anchor) */
  children?: ReactNode;
}

const toolHref = (id: string) => `/app.html#${id}`;

/**
 * Floating mega-menu under the fixed navbar when hovering the "الأدوات" link.
 * Rendered through a portal to <body> so nothing clips it.
 */
export function ToolsMenu({ lang, labels, children }: ToolsMenuProps) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const cancelClose = () => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setOpen(false), 170);
  };
  const openNow = () => {
    cancelClose();
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  return (
    <div
      ref={wrapRef}
      onMouseEnter={openNow}
      onMouseLeave={scheduleClose}
      style={{ display: 'inline-flex', position: 'relative' }}
    >
      {children}
      <ChevronDown
        className="hidden md:block"
        style={{
          width: 12, height: 12, marginInlineStart: -4, color: open ? '#a5b4fc' : '#5d6070',
          transition: 'transform .25s', transform: open ? 'rotate(180deg)' : 'none',
        }}
      />

      {open && createPortal(
        <div
          dir={dir}
          className="tools-mega-menu"
          style={{
            position: 'fixed', top: 54, left: '50%', transform: 'translateX(-50%)',
            width: 'min(720px, calc(100vw - 24px))', zIndex: 90,
            direction: 'ltr',
            background: 'rgba(10,14,25,.97)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
            border: '1px solid #1e2028', borderRadius: 18,
            boxShadow: '0 24px 60px -12px rgba(0,0,0,.65), 0 0 0 1px rgba(99,102,241,.07)',
            overflow: 'hidden', fontFamily: 'inherit',
          }}
        >
          {/* Header row */}
          <div
            dir={dir}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', borderBottom: '1px solid #1e2028',
              background: 'rgba(99,102,241,.05)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 26, height: 26, borderRadius: 8, background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
              }}>
                <LayoutGrid style={{ width: 14, height: 14, color: '#fff' }} />
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#e4e6eb' }}>{labels.allTools}</span>
              <span style={{
                fontSize: 10, fontFamily: 'monospace', fontWeight: 700, color: '#818cf8',
                background: 'rgba(99,102,241,.12)', border: '1px solid rgba(99,102,241,.3)',
                padding: '2px 8px', borderRadius: 999,
              }}>
                {toolsCountLabel(labels.toolsCount, navItems.length)}
              </span>
            </div>
            <a
              href="/app.html"
              style={{ fontSize: 12, fontWeight: 600, color: '#818cf8', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, transition: 'color .2s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#c7d2fe'}
              onMouseLeave={e => e.currentTarget.style.color = '#818cf8'}
            >
              {lang === 'ar' ? 'فتح صفحة الأدوات' : 'Open Tools Page'}
              <ExternalLink style={{ width: 12, height: 12 }} />
            </a>
          </div>

          {/* Tools grid */}
          <div style={{ padding: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 6, direction: dir }}>
            {navItems.map(item => {
              const Icon = item.icon as LucideIcon;
              const label = lang === 'ar' ? item.labelAr : item.labelEn;
              return (
                <a
                  key={item.id}
                  href={toolHref(item.id)}
                  className="tools-menu-item"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px', borderRadius: 12, textDecoration: 'none',
                    background: 'transparent', transition: 'background .18s',
                  }}
                  onClick={() => setOpen(false)}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.05)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span
                    className={`bg-gradient-to-br ${item.color}`}
                    style={{
                      flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 30, height: 30, borderRadius: 9,
                    }}
                  >
                    <Icon style={{ width: 15, height: 15, color: '#fff' }} />
                  </span>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: '#cbd5e1', lineHeight: 1.35, transition: 'color .18s' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#ffffff'}
                    onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}
                  >
                    {label}
                  </span>
                </a>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function toolsCountLabel(template: string, count: number): string {
  if (template && template.includes('%')) return template.replace('%', String(count));
  return String(count);
}
