import { useDesigner } from "./state";
import { arrangeSelection, type Arrangement } from "./selection-tools";
/** كل عملية محاذاة أو توزيع تدخل سجل التراجع كخطوة واحدة. */
export default function SelectionTools() {
  const s = useDesigner(),
    count = s.doc.nodes.filter(
      (n) => s.selected.includes(n.id) && !n.locked && !n.hidden,
    ).length;
  if (count < 2) return null;
  const operations: [Arrangement, string, string][] = [
    ["left", "يسار", "Align left"],
    ["center-x", "وسط أفقي", "Align horizontal centers"],
    ["right", "يمين", "Align right"],
    ["top", "أعلى", "Align top"],
    ["center-y", "وسط رأسي", "Align vertical centers"],
    ["bottom", "أسفل", "Align bottom"],
    ["space-x", "توزيع أفقي", "Distribute horizontally"],
    ["space-y", "توزيع رأسي", "Distribute vertically"],
    ["front", "للأمام", "Bring to front"],
    ["back", "للخلف", "Send to back"],
  ];
  return (
    <div className="ld-selection-tools">
      <h3>{s.t("ترتيب الاختيار", "Arrange selection")}</h3>
      <p>
        {s.t(
          "المحاذاة بالنسبة لحدود المجموعة؛ المقفول والمخفي ثابت.",
          "Align within the selection bounds. Locked and hidden layers stay fixed.",
        )}
      </p>
      <div>
        {operations.map(([id, ar, en]) => (
          <button
            key={id}
            disabled={id.startsWith("space") && count < 3}
            onClick={() => s.commit((p) => arrangeSelection(p, s.selected, id))}
          >
            {s.t(ar, en)}
          </button>
        ))}
      </div>
    </div>
  );
}
