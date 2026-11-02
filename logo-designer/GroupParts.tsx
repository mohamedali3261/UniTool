import { useDesigner } from "./state";
/** تعديل جزء داخل المجموعة من غير إجبار المستخدم يفكها؛ المجموعة لا تمنع التحرير الفردي. */
export default function GroupParts() {
  const s = useDesigner(),
    groups = new Set(
      s.doc.nodes
        .filter((n) => s.selected.includes(n.id) && n.group)
        .map((n) => n.group),
    );
  if (groups.size !== 1) return null;
  const group = [...groups][0],
    parts = s.doc.nodes.filter((n) => n.group === group),
    editable = parts.filter((n) => !n.locked);
  return (
    <div className="ld-group-parts">
      <h3>{s.t("أجزاء الأيقونة", "Icon parts")}</h3>
      <p>
        {s.t(
          "اختار جزء لتغيير لونه ومكانه ومقاسه لوحده.",
          "Choose a part to change its color, position and size independently.",
        )}
      </p>
      <div className="ld-part-list">
        {parts.map((n, i) => (
          <button
            key={n.id}
            disabled={n.locked}
            aria-pressed={s.selected.length === 1 && s.selected[0] === n.id}
            onClick={() => s.setSelected([n.id])}
          >
            {s.t("جزء ", "Part ")}
            {i + 1} · {n.name}
            {n.hidden ? s.t(" (مخفي)", " (hidden)") : ""}
          </button>
        ))}
      </div>
      <button
        className="ld-secondary"
        onClick={() => s.setSelected(editable.map((n) => n.id))}
      >
        {s.t("تحديد الأيقونة كلها", "Select whole icon")}
      </button>
      <button
        className="ld-secondary"
        onClick={() =>
          s.patch(
            { group: undefined },
            editable.map((n) => n.id),
          )
        }
      >
        {s.t("فك الأجزاء للتعديل الحر", "Ungroup for free editing")}
      </button>
    </div>
  );
}
