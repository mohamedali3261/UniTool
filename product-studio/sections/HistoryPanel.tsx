import type { Project } from "../core/model";
export function HistoryPanel({
  past,
  restore,
  ar,
}: {
  past: Project[];
  restore: (p: Project) => void;
  ar: boolean;
}) {
  return (
    <section className="ps-extra-panel">
      <h3>{ar ? "تاريخ التعديلات" : "Revision history"}</h3>
      <div
        style={{ display: "grid", gap: 5, maxHeight: 240, overflow: "auto" }}
      >
        {past
          .map((p, i) => ({ p, index: i + 1 }))
          .reverse()
          .map(({ p, index }) => (
            <button key={index} onClick={() => restore(p)}>
              {ar ? "استعادة" : "Restore"} #{index} · {p.name}
            </button>
          ))}
      </div>
      <small>
        {ar
          ? "آخر 40 خطوة في الجلسة؛ احفظ نسخًا بالمكتبة للاحتفاظ بها بعد الإغلاق."
          : "Last 40 session steps; library snapshots persist after closing."}
      </small>
    </section>
  );
}
