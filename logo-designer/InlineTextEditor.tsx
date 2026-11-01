import { useEffect, useRef, useState } from "react";
import { useDesigner } from "./state";
/** الكتابة فوق اللوحة مع اعتماد واحد للتراجع؛ Escape يلغي المسودة. */
export default function InlineTextEditor() {
  const s = useDesigner(),
    n = s.doc.nodes.find(
      (n) => n.id === s.textEditing && n.kind === "text" && !n.locked,
    ),
    [draft, setDraft] = useState(n?.text || ""),
    ref = useRef<HTMLTextAreaElement>(null),
    done = useRef(false);
  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);
  if (!n) return null;
  function finish(save: boolean) {
    if (done.current) return;
    done.current = true;
    if (save && draft !== n!.text) s.patch({ text: draft }, [n!.id]);
    s.setTextEditing(null);
  }
  return (
    <div className="ld-inline-text" onPointerDown={(e) => e.stopPropagation()}>
      <textarea
        ref={ref}
        aria-label={s.t("تحرير النص على اللوحة", "Edit text on canvas")}
        dir="auto"
        value={draft}
        maxLength={3000}
        style={{ fontFamily: n.font }}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => finish(true)}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Escape") {
            e.preventDefault();
            finish(false);
          }
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            finish(true);
          }
        }}
      />
      <small>
        {s.t(
          "Enter للحفظ · Shift+Enter سطر جديد · Esc إلغاء",
          "Enter saves · Shift+Enter new line · Esc cancels",
        )}
      </small>
    </div>
  );
}
