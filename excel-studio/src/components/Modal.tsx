import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
/** نافذة أصلية: تركيز محبوس، Escape، وإغلاق آمن خارج البطاقة. */
export function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    titleId = useId(),
    close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const d = ref.current!,
      before = document.activeElement as HTMLElement;
    d.showModal();
    const cancel = (e: Event) => {
      e.preventDefault();
      close.current();
    };
    d.addEventListener("cancel", cancel);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      d.removeEventListener("cancel", cancel);
      d.close();
      document.body.style.overflow = overflow;
      before?.isConnected && before.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={"xs-modal " + (wide ? "wide" : "")}
      aria-labelledby={titleId}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const r = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose();
        }
      }}
    >
      <header>
        <h2 id={titleId}>{title}</h2>
        <button
          className="xs-icon"
          aria-label="إغلاق / Close"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </header>
      <div className="xs-modal-body">{children}</div>
    </dialog>
  );
}
