import { useEffect, useRef } from "react";
export function ContextMenu({
  x,
  y,
  actions,
  onClose,
  touchOpening = false,
}: {
  touchOpening?: boolean;
  x: number;
  y: number;
  actions: { label: string; disabled?: boolean; run: () => void }[];
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const freshPointer = useRef(!touchOpening);
  useEffect(() => {
    const d = ref.current!;
    d.showModal();
    const r = d.getBoundingClientRect();
    d.style.left = `${Math.max(8, Math.min(x, innerWidth - r.width - 8))}px`;
    d.style.top = `${Math.max(8, Math.min(y, innerHeight - r.height - 8))}px`;
  }, []);
  return (
    <dialog
      className="timeline-context-menu"
      ref={ref}
      aria-label="إجراءات الخط الزمني"
      onCancel={onClose}
      onContextMenu={(e) => e.preventDefault()}
      onPointerDownCapture={() => {
        freshPointer.current = true;
      }}
      onKeyDownCapture={() => {
        freshPointer.current = true;
      }}
      onClickCapture={(e) => {
        if (!freshPointer.current) {
          e.preventDefault();
          e.stopPropagation();
          freshPointer.current = true;
        }
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      dir="rtl"
    >
      <b>إجراءات سريعة</b>
      {actions.map((a) => (
        <button
          key={a.label}
          disabled={a.disabled}
          onClick={() => {
            onClose();
            a.run();
          }}
        >
          {a.label}
        </button>
      ))}
      <button onClick={onClose}>إغلاق</button>
    </dialog>
  );
}
