/** ترتيب المصفوفة هو ترتيب الرسم؛ آخر عنصر هو الأعلى. */
import { useState } from "react";
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Copy,
  Trash2,
  Group,
  Ungroup,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useDesigner } from "./state";
import { uid } from "./types";
export default function Layers() {
  const s = useDesigner(),
    [drag, setDrag] = useState<string | null>(null);
  function reorder(id: string, before: string) {
    if (id === before) return;
    s.commit((p) => {
      const nodes = [...p.nodes],
        from = nodes.findIndex((n) => n.id === id),
        to = nodes.findIndex((n) => n.id === before);
      if (nodes[from]?.locked) return p;
      const [n] = nodes.splice(from, 1);
      nodes.splice(to, 0, n);
      return { ...p, nodes };
    });
  }
  return (
    <section className="ld-section">
      <p className="ld-eyebrow">EVERY DETAIL HAS ITS PLACE</p>
      <h2>{s.t("طبقات الفكرة.", "Layers of an idea.")}</h2>
      <div className="ld-toolbar">
        <button
          aria-label={s.t("نسخ العناصر", "Duplicate elements")}
          disabled={!s.selected.length}
          onClick={s.duplicate}
        >
          <Copy size={17} />
        </button>
        <button
          aria-label={s.t("حذف العناصر", "Delete elements")}
          disabled={!s.selected.length}
          onClick={s.remove}
        >
          <Trash2 size={17} />
        </button>
        <button
          aria-label={s.t("تجميع", "Group")}
          disabled={s.selected.length < 2}
          onClick={() => s.patch({ group: uid() })}
        >
          <Group size={18} />
        </button>
        <button
          aria-label={s.t("فك التجميع", "Ungroup")}
          disabled={!s.selected.length}
          onClick={() => s.patch({ group: undefined })}
        >
          <Ungroup size={18} />
        </button>
      </div>
      <p>
        {s.t(
          "أعلى القائمة فوق التصميم. اسحب لترتيب الطبقات، أو استخدم الأسهم. Shift لاختيار أكتر من عنصر.",
          "The top row is in front. Drag or use arrows to reorder. Shift selects multiple elements.",
        )}
      </p>
      <div className="ld-layers">
        {[...s.doc.nodes].reverse().map((n, i, all) => (
          <article
            key={n.id}
            draggable={!n.locked}
            onDragStart={() => setDrag(n.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (drag) reorder(drag, n.id);
              setDrag(null);
            }}
            className={s.selected.includes(n.id) ? "selected" : ""}
          >
            <button
              className="ld-layer-pick"
              onClick={(e) => s.choose(n.id, e.shiftKey)}
              aria-pressed={s.selected.includes(n.id)}
            >
              <span>
                {n.kind === "text" ? "T" : n.kind === "image" ? "▧" : "◇"}
              </span>
            </button>
            <input
              aria-label={s.t("اسم الطبقة ", "Layer name ") + n.name}
              value={n.name}
              maxLength={80}
              onFocus={() => s.setSelected([n.id])}
              onChange={(e) =>
                s.commit((p) => ({
                  ...p,
                  nodes: p.nodes.map((v) =>
                    v.id === n.id ? { ...v, name: e.target.value } : v,
                  ),
                }))
              }
            />
            <button
              aria-label={s.t("إظهار أو إخفاء ", "Show or hide ") + n.name}
              aria-pressed={!n.hidden}
              onClick={() =>
                s.commit((p) => ({
                  ...p,
                  nodes: p.nodes.map((v) =>
                    v.id === n.id ? { ...v, hidden: !v.hidden } : v,
                  ),
                }))
              }
            >
              {n.hidden ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
            <button
              aria-label={s.t("قفل أو فتح ", "Lock or unlock ") + n.name}
              aria-pressed={n.locked}
              onClick={() =>
                s.commit((p) => ({
                  ...p,
                  nodes: p.nodes.map((v) =>
                    v.id === n.id ? { ...v, locked: !v.locked } : v,
                  ),
                }))
              }
            >
              {n.locked ? <Lock size={14} /> : <Unlock size={14} />}
            </button>
            <div className="ld-layer-order">
              <button
                disabled={i === 0 || n.locked}
                aria-label={s.t("رفع ", "Raise ") + n.name}
                onClick={() => reorder(n.id, all[i - 1].id)}
              >
                <ArrowUp size={12} />
              </button>
              <button
                disabled={i === all.length - 1 || n.locked}
                aria-label={s.t("خفض ", "Lower ") + n.name}
                onClick={() => reorder(n.id, all[i + 1].id)}
              >
                <ArrowDown size={12} />
              </button>
            </div>
          </article>
        ))}
      </div>
      {!s.doc.nodes.length && (
        <p className="ld-empty">
          {s.t(
            "اللوحة فاضية. أضف أول عنصر.",
            "No layers yet. Add your first element.",
          )}
        </p>
      )}
    </section>
  );
}
