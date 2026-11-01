import { useEffect, useRef, type ReactNode } from "react";
/** كل النوافذ تُغلق خارج البطاقة وEscape، مع حبس التركيز واستعادته. */
export function DialogBackdrop({
  children,
  className,
  onClose,
  label,
}: {
  children: ReactNode;
  className: string;
  onClose: () => void;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null),
    close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const root = ref.current!,
      panel = root.firstElementChild as HTMLElement,
      previous = document.activeElement as HTMLElement,
      overflow = document.body.style.overflow;
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-label", label);
    panel.tabIndex = -1;
    document.body.style.overflow = "hidden";
    const firstClose = panel.querySelector("button");
    if (
      firstClose &&
      !firstClose.textContent?.trim() &&
      !firstClose.hasAttribute("aria-label")
    )
      firstClose.setAttribute("aria-label", "Close / إغلاق");
    const focusables = () =>
      [
        ...panel.querySelectorAll<HTMLElement>(
          'button:not(:disabled),input:not(:disabled),textarea:not(:disabled),select:not(:disabled),a[href],[tabindex="0"]',
        ),
      ].filter((n) => n.getClientRects().length > 0);
    (focusables()[0] || panel).focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        close.current();
      }
      if (e.key === "Tab") {
        const items = focusables(),
          first = items[0],
          last = items.at(-1);
        if (!first) {
          e.preventDefault();
          panel.focus();
        } else if (
          e.shiftKey &&
          (document.activeElement === first || document.activeElement === panel)
        ) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    root.addEventListener("keydown", key);
    return () => {
      root.removeEventListener("keydown", key);
      document.body.style.overflow = overflow;
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, [label]);
  return (
    <div
      ref={ref}
      className={"reader-dialog-backdrop " + className}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {children}
    </div>
  );
}
