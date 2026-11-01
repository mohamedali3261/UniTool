import { useEffect, useRef, type ReactNode } from "react";
/** يشمل الزر والقائمة حتى لا يعيد الضغط على زر الفتح فتحها بعد الإغلاق. */
export function DismissiblePopover({
  open,
  onClose,
  className,
  children,
}: {
  open: boolean;
  onClose: () => void;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null),
    close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) close.current();
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close.current();
        ref.current?.querySelector("button")?.focus();
      }
    };
    document.addEventListener("pointerdown", outside, true);
    const el = ref.current;
    el?.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", outside, true);
      el?.removeEventListener("keydown", key);
    };
  }, [open]);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
