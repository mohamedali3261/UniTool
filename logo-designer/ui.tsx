import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { useDesigner } from "./state";
export function Modal({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const s = useDesigner(),
    ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current,
      prev = document.activeElement as HTMLElement;
    el?.showModal();
    return () => {
      el?.close();
      prev?.focus?.();
    };
  }, []);
  return (
    <dialog
      className="ld-dialog"
      ref={ref}
      aria-label={title}
      onCancel={() => s.setModal(null)}
    >
      <header>
        <h2>{title}</h2>
        <button
          aria-label={s.t("إغلاق", "Close")}
          onClick={() => s.setModal(null)}
        >
          <X size={20} />
        </button>
      </header>
      {children}
    </dialog>
  );
}
export function NumberField({
  label,
  value,
  onChange,
  min = -8000,
  max = 8000,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <label className="ld-field">
      {label}
      <input
        type="number"
        aria-label={label}
        value={Math.round(value * 100) / 100}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          if (e.target.value !== "" && Number.isFinite(e.target.valueAsNumber))
            onChange(Math.max(min, Math.min(max, e.target.valueAsNumber)));
        }}
      />
    </label>
  );
}
