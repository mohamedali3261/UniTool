import { useEffect, useRef, useState } from "react";
import type { LibraryElement } from "../../../src/pages/Elements/types";
/** Real editor command palette; the animated command element remains a separate video asset. */
export function CommandPalette({
  onAdd,
}: {
  onAdd: (item: LibraryElement) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    input = useRef<HTMLInputElement>(null),
    [open, setOpen] = useState(false),
    [query, setQuery] = useState(""),
    [items, setItems] = useState<LibraryElement[]>([]),
    [error, setError] = useState("");
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key.toLowerCase() === "k" &&
        !e.isComposing
      ) {
        e.preventDefault();
        e.stopImmediatePropagation();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", key, true);
    return () => window.removeEventListener("keydown", key, true);
  }, []);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    if (!open) {
      ref.current?.close();
      return;
    }
    ref.current?.showModal();
    input.current?.focus();
    let alive = true;
    void import("../../../src/pages/Elements/registry")
      .then((m) => {
        if (alive) setItems(m.loadElements());
      })
      .catch(() => {
        if (alive) setError("تعذر تحميل العناصر");
      });
    return () => {
      alive = false;
      ref.current?.close();
      previous?.isConnected && previous.focus();
    };
  }, [open]);
  const filtered = items
    .filter((i) =>
      `${i.name} ${i.sourceName}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
    )
    .slice(0, 30);
  if (!open) return null;
  return (
    <dialog
      className="creative-command"
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        setOpen(false);
      }}
      aria-label="البحث السريع عن العناصر"
    >
      <header>
        <strong>العناصر · Cmd / Ctrl + K</strong>
        <button onClick={() => setOpen(false)} aria-label="إغلاق البحث السريع">
          ✕
        </button>
      </header>
      <input
        ref={input}
        aria-label="بحث سريع في العناصر"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Scramble، Aurora، رسم بياني…"
      />
      {error && <p role="alert">{error}</p>}
      <div>
        {filtered.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              onAdd(item);
              setOpen(false);
            }}
          >
            {item.name}
            <small>{item.sourceName}</small>
          </button>
        ))}
      </div>
      {!filtered.length && <p role="status">لا توجد نتائج مطابقة</p>}
    </dialog>
  );
}
