import { useMemo, useRef, useState } from "react";
import { useDesigner } from "./state";
import {
  booleanNodes,
  canPath,
  convertPath,
  readPoints,
  changePoint,
  type PathPoint,
} from "./path-engine";
import { NumberField } from "./ui";
/** تعديل نقاط ومنحنيات فعلي؛ السحب خطوة تراجع واحدة. */
export default function PathTools() {
  const s = useDesigner(),
    items = s.doc.nodes.filter((n) => s.selected.includes(n.id)),
    n = items.length === 1 ? items[0] : undefined,
    [pathIndex, setPathIndex] = useState(0),
    [pointIndex, setPointIndex] = useState(0),
    drag = useRef<{ point: PathPoint; kind: "anchor" | "in" | "out" } | null>(
      null,
    );
  const index = Math.min(pathIndex, Math.max(0, (n?.paths?.length || 1) - 1)),
    d = n?.paths?.[index]?.d || "",
    points = useMemo(() => (d ? readPoints(d) : []), [d]),
    pt = points[Math.min(pointIndex, points.length - 1)];
  function update(change: Partial<PathPoint> | "delete", live = false) {
    if (!n?.paths || !pt) return;
    try {
      const paths = n.paths.map((p, i) =>
        i === index
          ? { ...p, d: changePoint(p.d, pt.contour, pt.index, change) }
          : p,
      );
      if (live)
        s.dispatch({
          type: "live",
          fn: (p) => ({
            ...p,
            nodes: p.nodes.map((v) => (v.id === n.id ? { ...v, paths } : v)),
          }),
        });
      else s.patch({ paths });
    } catch (e) {
      s.setNotice((e as Error).message);
    }
  }
  function merge(op: "unite" | "subtract" | "intersect") {
    try {
      const result = booleanNodes(items, op);
      s.commit((p) => ({
        ...p,
        nodes: p.nodes.filter((v) => !s.selected.includes(v.id)).concat(result),
      }));
      s.setSelected([result.id]);
    } catch (e) {
      s.setNotice(
        s.t(
          "اختار أشكالًا ممتلئة أو مسارات متقاطعة غير مقفولة. النتيجة الفارغة لا تُطبق.",
          "Choose unlocked filled shapes/vectors. Empty results are not applied.",
        ),
      );
    }
  }
  if (!items.length) return null;
  return (
    <section className="ld-feature-block">
      <h3>{s.t("المسارات ودمج الأشكال", "Paths & Boolean shapes")}</h3>
      <p>
        {s.t(
          "الطرح يخصم الطبقات الأعلى من أول طبقة. الرموز الخطية والنصوص والصور ليست مساحات ممتلئة.",
          "Subtract removes upper layers from the bottom layer. Line icons, text and images are not filled areas.",
        )}
      </p>
      <div className="ld-mini-grid">
        {(["unite", "subtract", "intersect"] as const).map((op, i) => (
          <button
            key={op}
            disabled={items.length < 2 || items.some((v) => !canPath(v))}
            onClick={() => merge(op)}
          >
            {s.t(
              ["دمج", "طرح", "تقاطع"][i],
              ["Union", "Subtract", "Intersect"][i],
            )}
          </button>
        ))}
      </div>
      {n && canPath(n) && n.kind !== "vector" && (
        <button
          className="ld-secondary"
          onClick={() => {
            const result = convertPath(n);
            s.commit((p) => ({
              ...p,
              nodes: p.nodes.map((v) => (v.id === n.id ? result : v)),
            }));
          }}
        >
          {s.t("تحويل إلى مسار قابل للتحرير", "Convert to editable path")}
        </button>
      )}
      {n?.kind === "vector" && !n.locked && (
        <>
          <label className="ld-field">
            {s.t("المسار", "Contour path")}
            <select
              value={index}
              onChange={(e) => {
                setPathIndex(+e.target.value);
                setPointIndex(0);
              }}
            >
              {n.paths?.map((_, i) => (
                <option key={i} value={i}>
                  {i + 1}
                </option>
              ))}
            </select>
          </label>
          <NumberField
            label={s.t("رقم النقطة", "Point number")}
            value={Math.min(pointIndex, Math.max(0, points.length - 1)) + 1}
            min={1}
            max={Math.max(1, points.length)}
            onChange={(v) => setPointIndex(v - 1)}
          />
          <svg
            className="ld-path-editor"
            viewBox="-16 -16 160 160"
            aria-label={s.t("محرر نقاط المسار", "Path point editor")}
            onPointerMove={(e) => {
              if (!drag.current || !pt) return;
              const r = e.currentTarget.getBoundingClientRect(),
                x = ((e.clientX - r.left) / r.width) * 160 - 16,
                y = ((e.clientY - r.top) / r.height) * 160 - 16;
              const change =
                drag.current.kind === "anchor"
                  ? { x, y }
                  : drag.current.kind === "in"
                    ? { inX: x - pt.x, inY: y - pt.y }
                    : { outX: x - pt.x, outY: y - pt.y };
              update(change, true);
            }}
            onPointerUp={() => {
              drag.current = null;
              s.dispatch({ type: "end" });
            }}
            onPointerCancel={() => {
              drag.current = null;
              s.dispatch({ type: "end" });
            }}
          >
            <path
              d={d}
              fill={n.fill}
              fillOpacity=".15"
              stroke={n.fill}
              strokeWidth="1"
            />
            {pt && (
              <>
                <path
                  d={`M${pt.x + pt.inX} ${pt.y + pt.inY}L${pt.x} ${pt.y}L${pt.x + pt.outX} ${pt.y + pt.outY}`}
                  stroke="#af744b"
                  fill="none"
                />
                {(["in", "out"] as const).map((kind) => (
                  <circle
                    key={kind}
                    cx={pt.x + (kind === "in" ? pt.inX : pt.outX)}
                    cy={pt.y + (kind === "in" ? pt.inY : pt.outY)}
                    r="3"
                    fill="#af744b"
                    onPointerDown={(e) => {
                      e.currentTarget.setPointerCapture(e.pointerId);
                      s.dispatch({ type: "begin" });
                      drag.current = { point: pt, kind };
                    }}
                  />
                ))}
              </>
            )}
            {points.map((p, i) => (
              <circle
                key={i}
                role="button"
                tabIndex={0}
                aria-label={`Point ${i + 1}`}
                cx={p.x}
                cy={p.y}
                r={i === Math.min(pointIndex, points.length - 1) ? 4 : 3}
                fill={
                  i === Math.min(pointIndex, points.length - 1)
                    ? "#7c5ce5"
                    : "#fff"
                }
                stroke="#435f54"
                strokeWidth="1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") setPointIndex(i);
                }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.currentTarget.setPointerCapture(e.pointerId);
                  setPointIndex(i);
                  s.dispatch({ type: "begin" });
                  drag.current = { point: p, kind: "anchor" };
                }}
              />
            ))}
          </svg>
          {pt && (
            <>
              <div className="ld-two">
                <NumberField
                  label="Point X"
                  value={pt.x}
                  onChange={(x) => update({ x })}
                />
                <NumberField
                  label="Point Y"
                  value={pt.y}
                  onChange={(y) => update({ y })}
                />
                <NumberField
                  label="Handle in X"
                  value={pt.inX}
                  onChange={(inX) => update({ inX })}
                />
                <NumberField
                  label="Handle in Y"
                  value={pt.inY}
                  onChange={(inY) => update({ inY })}
                />
                <NumberField
                  label="Handle out X"
                  value={pt.outX}
                  onChange={(outX) => update({ outX })}
                />
                <NumberField
                  label="Handle out Y"
                  value={pt.outY}
                  onChange={(outY) => update({ outY })}
                />
              </div>
              <button
                className="ld-secondary"
                onClick={() => update({ inX: -12, inY: 0, outX: 12, outY: 0 })}
              >
                {s.t("إضافة مقابض انحناء", "Add curve handles")}
              </button>
              <button
                className="ld-secondary"
                onClick={() => {
                  if (confirm(s.t("حذف النقطة؟", "Delete this point?")))
                    update("delete");
                }}
              >
                {s.t("حذف النقطة", "Delete point")}
              </button>
            </>
          )}
        </>
      )}
    </section>
  );
}
