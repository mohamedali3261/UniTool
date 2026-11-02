import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal, X } from "lucide-react";

/** A small permanent toolbar; advanced tools live in a dismissible, top-layer panel. */
export function TimelineToolbar({
  primary,
  zoom,
  editing,
  view,
  search,
  open,
  onToggle,
}: {
  search: ReactNode;
  primary: ReactNode;
  zoom: ReactNode;
  editing: ReactNode;
  view: ReactNode;
  open: boolean;
  onToggle: (open: boolean) => void;
}) {
  const id = useId();
  const bar = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => {
    if (!open) return;
    const position = () => {
      const r = bar.current?.getBoundingClientRect(),
        el = panel.current;
      if (!r || !el) return;
      const width = Math.min(480, innerWidth - 16);
      el.style.width = `${width}px`;
      el.style.left = `${Math.max(8, Math.min(r.right - width, innerWidth - width - 8))}px`;
      el.style.bottom = `${Math.max(8, innerHeight - r.top + 6)}px`;
      el.style.maxHeight = `${Math.max(100, Math.min(360, r.top - 16))}px`;
    };
    position();
    panel.current?.focus({ preventScroll: true });
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    return () => {
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
    };
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => {
      const node = e.target as Node;
      if (
        !bar.current?.contains(node) &&
        !panel.current?.contains(node) &&
        !(e.target as HTMLElement).closest(
          "[data-radix-popper-content-wrapper]",
        )
      )
        onToggle(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open, onToggle]);
  const close = () => {
    onToggle(false);
    toggle.current?.focus({ preventScroll: true });
  };
  return (
    <>
      <div className="timeline-toolbar" ref={bar} dir="rtl">
        <div className="timeline-primary">{primary}</div>
        <div className="timeline-zoom">{zoom}</div>
        <button
          ref={toggle}
          className="timeline-options-toggle"
          aria-label="خيارات التايم لاين"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => onToggle(!open)}
        >
          <MoreHorizontal size={18} />
          <span>المزيد</span>
        </button>
      </div>
      {open &&
        createPortal(
          <div
            id={id}
            ref={panel}
            className="timeline-settings"
            role="region"
            aria-label="خيارات التايم لاين"
            tabIndex={-1}
            dir="rtl"
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                close();
              }
            }}
          >
            <header>
              <b>أدوات التايم لاين</b>
              <button aria-label="إغلاق خيارات التايم لاين" onClick={close}>
                <X size={18} />
              </button>
            </header>
            {search}
            <fieldset>
              <legend>التعديل والتنظيم</legend>
              <div className="timeline-settings-actions">{editing}</div>
            </fieldset>
            <fieldset>
              <legend>العرض والتنقّل</legend>
              <div className="timeline-settings-actions">{view}</div>
            </fieldset>
            <p>
              اسحب الحواف للقص · Shift لتحديد مجموعة · ضغطة مطوّلة للإجراءات
            </p>
          </div>,
          document.body,
        )}
    </>
  );
}
