import { useLayoutEffect, useRef, useState } from "react";
import {
  Scissors,
  Copy,
  ClipboardPaste,
  CopyPlus,
  Trash2,
  Group,
  Ungroup,
  LockKeyhole,
  Unlock,
  ArrowUpToLine,
  ArrowDownToLine,
  CheckCheck,
  Undo2,
  Redo2,
} from "lucide-react";
import { useDesigner } from "./state";
import { uid } from "./types";
export type MenuAnchor = {
  x: number;
  y: number;
  point: { x: number; y: number };
};
/** قائمة صغيرة: ضبط داخل الشاشة، تنقّل بالأسهم، وإغلاق خارجها مع استعادة التركيز. */
export default function ContextMenu({
  anchor,
  onClose,
}: {
  anchor: MenuAnchor;
  onClose: () => void;
}) {
  const s = useDesigner(),
    ref = useRef<HTMLDivElement>(null),
    [pos, setPos] = useState({ x: anchor.x, y: anchor.y }),
    nodes = s.doc.nodes.filter((n) => s.selected.includes(n.id)),
    editable = nodes.filter((n) => !n.locked),
    allLocked = nodes.length > 0 && nodes.every((n) => n.locked);
  const order = (front: boolean) =>
    s.commit((p) => {
      const ids = new Set(editable.map((n) => n.id)),
        chosen = p.nodes.filter((n) => ids.has(n.id)),
        rest = p.nodes.filter((n) => !ids.has(n.id));
      return {
        ...p,
        nodes: front ? [...rest, ...chosen] : [...chosen, ...rest],
      };
    });
  const items = [
    {
      ar: "قص",
      en: "Cut",
      icon: Scissors,
      key: "⌘/Ctrl X",
      disabled: !editable.length,
      run: s.cutSelection,
    },
    {
      ar: "نسخ",
      en: "Copy",
      icon: Copy,
      key: "⌘/Ctrl C",
      disabled: !nodes.length,
      run: s.copySelection,
    },
    {
      ar: "لصق هنا",
      en: "Paste here",
      icon: ClipboardPaste,
      key: "⌘/Ctrl V",
      disabled: !s.clipboard.length,
      run: () => s.pasteSelection(anchor.point),
    },
    {
      ar: "تكرار",
      en: "Duplicate",
      icon: CopyPlus,
      key: "⌘/Ctrl D",
      disabled: !nodes.length,
      run: s.duplicate,
    },
    {
      ar: "تجميع",
      en: "Group",
      icon: Group,
      divider: true,
      disabled: editable.length < 2,
      run: () => s.patch({ group: uid() }),
    },
    {
      ar: "فك التجميع",
      en: "Ungroup",
      icon: Ungroup,
      disabled: !editable.some((n) => n.group),
      run: () => s.patch({ group: undefined }),
    },
    {
      ar: allLocked ? "فتح القفل" : "قفل",
      en: allLocked ? "Unlock" : "Lock",
      icon: allLocked ? Unlock : LockKeyhole,
      disabled: !nodes.length,
      run: () =>
        s.commit((p) => ({
          ...p,
          nodes: p.nodes.map((n) =>
            s.selected.includes(n.id) ? { ...n, locked: !allLocked } : n,
          ),
        })),
    },
    {
      ar: "للأمام",
      en: "Bring to front",
      icon: ArrowUpToLine,
      divider: true,
      disabled: !editable.length,
      run: () => order(true),
    },
    {
      ar: "للخلف",
      en: "Send to back",
      icon: ArrowDownToLine,
      disabled: !editable.length,
      run: () => order(false),
    },
    {
      ar: "تحديد الكل",
      en: "Select all",
      icon: CheckCheck,
      disabled: !s.doc.nodes.some((n) => !n.hidden && !n.locked),
      run: () =>
        s.setSelected(
          s.doc.nodes.filter((n) => !n.hidden && !n.locked).map((n) => n.id),
        ),
    },
    {
      ar: "تراجع",
      en: "Undo",
      icon: Undo2,
      divider: true,
      disabled: !s.history.past.length,
      run: () => s.dispatch({ type: "undo" }),
    },
    {
      ar: "إعادة",
      en: "Redo",
      icon: Redo2,
      disabled: !s.history.future.length,
      run: () => s.dispatch({ type: "redo" }),
    },
    {
      ar: "حذف",
      en: "Delete",
      icon: Trash2,
      key: "Del",
      divider: true,
      danger: true,
      disabled: !editable.length,
      run: s.remove,
    },
  ];
  useLayoutEffect(() => {
    const el = ref.current!,
      previous = document.activeElement as HTMLElement;
    const r = el.getBoundingClientRect();
    setPos({
      x: Math.max(8, Math.min(anchor.x, window.innerWidth - r.width - 8)),
      y: Math.max(8, Math.min(anchor.y, window.innerHeight - r.height - 8)),
    });
    el.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus();
    const outside = (e: PointerEvent) => {
      if (!el.contains(e.target as Node)) onClose();
    };
    const dismiss = () => onClose();
    document.addEventListener("pointerdown", outside, true);
    window.addEventListener("resize", dismiss);
    window.addEventListener("blur", dismiss);
    const wheel = (e: WheelEvent) => {
      if (!el.contains(e.target as Node)) dismiss();
    };
    window.addEventListener("wheel", wheel, true);
    return () => {
      document.removeEventListener("pointerdown", outside, true);
      window.removeEventListener("resize", dismiss);
      window.removeEventListener("blur", dismiss);
      window.removeEventListener("wheel", wheel, true);
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, [anchor]);
  return (
    <div
      className="ld-context-menu"
      ref={ref}
      role="menu"
      aria-label={s.t("قائمة تحرير العناصر", "Element actions")}
      style={{ left: pos.x, top: pos.y }}
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (
          (e.ctrlKey || e.metaKey) &&
          ["x", "c", "v", "d", "z", "y"].includes(e.key.toLowerCase())
        ) {
          e.preventDefault();
          const key = e.key.toLowerCase(),
            action = items.find(
              (i) =>
                i.en ===
                (key === "x"
                  ? "Cut"
                  : key === "c"
                    ? "Copy"
                    : key === "v"
                      ? "Paste here"
                      : key === "d"
                        ? "Duplicate"
                        : key === "y" || e.shiftKey
                          ? "Redo"
                          : "Undo"),
            );
          if (action && !action.disabled) {
            onClose();
            action.run();
          }
          return;
        }
        if (e.key === "Delete" || e.key === "Backspace") {
          e.preventDefault();
          const action = items.at(-1)!;
          if (!action.disabled) {
            onClose();
            action.run();
          }
          return;
        }
        const buttons = [
            ...ref.current!.querySelectorAll<HTMLButtonElement>(
              "button:not(:disabled)",
            ),
          ],
          index = buttons.indexOf(document.activeElement as HTMLButtonElement);
        if (e.key === "Escape" || e.key === "Tab") {
          e.preventDefault();
          onClose();
        }
        if (["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) {
          e.preventDefault();
          buttons[
            e.key === "Home"
              ? 0
              : e.key === "End"
                ? buttons.length - 1
                : (index + (e.key === "ArrowDown" ? 1 : -1) + buttons.length) %
                  buttons.length
          ]?.focus();
        }
      }}
    >
      <div className="ld-context-title">
        {nodes.length
          ? s.t(`${nodes.length} عنصر محدد`, `${nodes.length} selected`)
          : s.t("مساحة العمل", "Artboard")}
      </div>
      {items.map((item) => (
        <button
          key={item.en}
          role="menuitem"
          aria-label={s.t(item.ar, item.en)}
          disabled={item.disabled}
          className={`${item.divider ? "ld-menu-divider " : ""}${item.danger ? "ld-menu-danger" : ""}`}
          onClick={() => {
            onClose();
            item.run();
          }}
        >
          <item.icon size={14} />
          <span>{s.t(item.ar, item.en)}</span>
          {item.key && <kbd>{item.key}</kbd>}
        </button>
      ))}
    </div>
  );
}
