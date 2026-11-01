import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    id = useId(),
    close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const d = ref.current!,
      previous = document.activeElement as HTMLElement;
    d.showModal();
    return () => {
      d.close();
      previous?.isConnected && previous.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="ps-modal"
      aria-labelledby={id}
      onCancel={(e) => {
        e.preventDefault();
        close.current();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const r = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            close.current();
        }
      }}
    >
      <header>
        <h2 id={id}>{title}</h2>
        <button onClick={onClose} aria-label="إغلاق / Close">
          <X size={18} />
        </button>
      </header>
      <div>{children}</div>
    </dialog>
  );
}
