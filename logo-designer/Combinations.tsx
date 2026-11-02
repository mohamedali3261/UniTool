import { useMemo, useState } from "react";
import { useDesigner } from "./state";
import { compositions, compositionNodes } from "./compositions";
import { ElementGraphic } from "./render";
import { matchesSearch } from "./search";
/** معرض تركيبات قابل للتخصيص قبل الإضافة، بدون استبدال التصميم الحالي. */
export default function Combinations() {
  const s = useDesigner(),
    [query, setQuery] = useState(""),
    [primary, setPrimary] = useState("#235c4c"),
    [accent, setAccent] = useState("#c5a568"),
    [initial, setInitial] = useState("M"),
    [size, setSize] = useState(220),
    [grouped, setGrouped] = useState(true);
  const previews = useMemo(
    () =>
      new Map(
        compositions.map((c) => [
          c.id,
          compositionNodes(c, {
            x: 100,
            y: 100,
            size: 180,
            primary,
            accent,
            initial,
          }),
        ]),
      ),
    [primary, accent, initial],
  );
  const filtered = compositions.filter((c) => matchesSearch(query, c.ar, c.en));
  return (
    <div className="ld-combinations">
      <h3>{s.t("رمز واحد… وأجزاء بإيدك.", "One mark. Every part yours.")}</h3>
      <p>
        {s.t(
          "12 تركيب من أجزاء مستقلة. مش صورة أو دمج دائم: عدّل كل جزء من أزرار الأجزاء في الخصائص، أو فك المجموعة.",
          "12 layered compositions, not flattened images or permanent path unions. Pick individual parts in Inspector, or ungroup them.",
        )}
      </p>
      <label className="ld-field">
        {s.t("بحث في التركيبات", "Search combinations")}
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <div className="ld-two">
        <label className="ld-field">
          {s.t("اللون الأساسي", "Main color")}
          <input
            type="color"
            value={primary}
            onChange={(e) => setPrimary(e.target.value)}
          />
        </label>
        <label className="ld-field">
          {s.t("لون التفاصيل", "Detail color")}
          <input
            type="color"
            value={accent}
            onChange={(e) => setAccent(e.target.value)}
          />
        </label>
      </div>
      <label className="ld-field">
        {s.t("حرفك للدرع والسهم", "Your initial for shield / arrow")}
        <input
          maxLength={2}
          value={initial}
          onChange={(e) => setInitial(e.target.value)}
        />
      </label>
      <label className="ld-field">
        {s.t("مقاس التكوين", "Composition size")} · {size}px
        <input
          type="range"
          min={80}
          max={400}
          step={10}
          value={size}
          onChange={(e) => setSize(+e.target.value)}
        />
      </label>
      <label className="ld-check">
        <input
          type="checkbox"
          checked={grouped}
          onChange={(e) => setGrouped(e.target.checked)}
        />
        {s.t("إضافة كمجموعة قابلة للفك", "Add as an editable group")}
      </label>
      {s.selected.length > 0 && (
        <button
          className="ld-secondary"
          onClick={() => {
            s.setRightOpen(true);
            if (window.innerWidth < 851) s.setLeftOpen(false);
          }}
        >
          {s.t("افتح الخصائص لتعديل الأجزاء", "Open Inspector to edit parts")}
        </button>
      )}
      <div className="ld-composition-grid">
        {filtered.map((c) => (
          <button
            key={c.id}
            aria-label={
              s.t("إضافة تركيب ", "Add composition ") + s.t(c.ar, c.en)
            }
            onClick={() => {
              s.add(
                compositionNodes(c, {
                  x: s.doc.width / 2,
                  y: s.doc.height / 2,
                  size,
                  primary,
                  accent,
                  initial,
                  grouped,
                }),
              );
              s.setNotice(
                s.t(
                  "تمت الإضافة. اختار أي جزء من الخصائص لتعديله لوحده.",
                  "Added. Choose a part in Inspector to edit it independently.",
                ),
              );
            }}
          >
            <svg viewBox="0 0 200 200" aria-hidden="true">
              {previews.get(c.id)!.map((n) => (
                <ElementGraphic
                  key={n.id}
                  n={n}
                  prefix={"combination-" + c.id}
                />
              ))}
            </svg>
            <strong>{s.t(c.ar, c.en)}</strong>
            <small>
              {s.t(
                `${c.parts.length} أجزاء قابلة للتعديل`,
                `${c.parts.length} editable parts`,
              )}
            </small>
          </button>
        ))}
      </div>
      {!filtered.length && (
        <p className="ld-empty">
          {s.t(
            "مفيش تركيب بالاسم ده. جرّب كلمة تانية.",
            "No matching composition. Try another search.",
          )}
        </p>
      )}
    </div>
  );
}
