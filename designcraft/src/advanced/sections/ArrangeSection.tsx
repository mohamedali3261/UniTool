import { useEffect, useState } from "react";
import {
  arrange,
  groupSelection,
  ungroupSelection,
  transformSelection,
  type Alignment,
} from "../core/arrange";
import { MM_TO_PX } from "../../packaging/geometry";
import { Field, Note, t, type Props } from "./shared";
export function ArrangeSection({ canvas, project, ar, run, revision }: Props) {
  const [relative, setRelative] = useState<"canvas" | "selection">("selection"),
    [unit, setUnit] = useState("px"),
    [ratio, setRatio] = useState(true),
    [v, setV] = useState({ x: 0, y: 0, width: 100, height: 100, angle: 0 });
  const factor = unit === "mm" ? MM_TO_PX : 1;
  useEffect(() => {
    const o = canvas.getActiveObject();
    if (o) {
      const b = o.getBoundingRect(true, true);
      setV({
        x: Math.round((b.left / factor) * 100) / 100,
        y: Math.round((b.top / factor) * 100) / 100,
        width: Math.round((b.width / factor) * 100) / 100,
        height: Math.round((b.height / factor) * 100) / 100,
        angle: o.angle || 0,
      });
    }
  }, [canvas, revision, factor]);
  return (
    <>
      <Note>
        {t(
          ar,
          "حدّد عدة عناصر باستخدام Shift أو سحب إطار حولها. العناصر المقفولة وخطوط العلبة محمية.",
          "Select multiple objects with Shift or a marquee. Locked objects and manufacturing guides are protected.",
        )}
      </Note>
      <Field label={t(ar, "المحاذاة بالنسبة إلى", "Alignment reference")}>
        <select
          value={relative}
          onChange={(e) => setRelative(e.target.value as typeof relative)}
        >
          <option value="selection">
            {t(ar, "حدود العناصر المحددة", "Selection bounds")}
          </option>
          <option value="canvas">{t(ar, "الصفحة", "Canvas")}</option>
        </select>
      </Field>
      <div className="adv-grid">
        {(
          [
            ["left", "يسار", "Left"],
            ["center", "وسط أفقي", "Horizontal center"],
            ["right", "يمين", "Right"],
            ["top", "أعلى", "Top"],
            ["middle", "وسط رأسي", "Vertical center"],
            ["bottom", "أسفل", "Bottom"],
          ] as const
        ).map(([id, a, b]) => (
          <button
            key={id}
            onClick={() => run(() => arrange(canvas, id, relative))}
          >
            {t(ar, a, b)}
          </button>
        ))}
      </div>
      <div className="adv-grid">
        <button
          onClick={() => run(() => arrange(canvas, "distributeX", relative))}
        >
          {t(ar, "توزيع أفقي متساوٍ", "Equal horizontal gaps")}
        </button>
        <button
          onClick={() => run(() => arrange(canvas, "distributeY", relative))}
        >
          {t(ar, "توزيع رأسي متساوٍ", "Equal vertical gaps")}
        </button>
        <button onClick={() => run(() => groupSelection(canvas))}>
          {t(ar, "تجميع العناصر", "Group objects")}
        </button>
        <button onClick={() => run(() => ungroupSelection(canvas))}>
          {t(ar, "فك / تحرير المجموعة", "Ungroup / edit members")}
        </button>
      </div>
      <Note>
        {t(
          ar,
          "لفتح مجموعة للتعديل: فكّها، أغلق هذه النافذة وعدّل عناصرها، ثم حدّدها وجمّعها من جديد. التوزيع يثبت الطرفين، وقد يعطي فراغًا سالبًا لو العناصر مزدحمة.",
          "To edit members: ungroup, close this window, edit, then select and regroup. Distribution preserves the endpoints; crowded layouts can have negative gaps.",
        )}
      </Note>
      <h3>{t(ar, "موقع ومقاسات دقيقة", "Precise transform")}</h3>
      {project.packaging && (
        <Field label={t(ar, "وحدة المقاس", "Units")}>
          <select value={unit} onChange={(e) => setUnit(e.target.value)}>
            <option value="px">px</option>
            <option value="mm">mm</option>
          </select>
        </Field>
      )}
      <div className="adv-grid">
        {(["x", "y", "width", "height", "angle"] as const).map((key, i) => (
          <Field
            key={key}
            label={t(
              ar,
              ["الموقع X", "الموقع Y", "العرض", "الارتفاع", "الدوران"][i],
              ["X position", "Y position", "Width", "Height", "Rotation"][i],
            )}
          >
            <input
              type="number"
              step=".1"
              value={v[key]}
              onChange={(e) => setV({ ...v, [key]: e.target.valueAsNumber })}
            />
          </Field>
        ))}
      </div>
      <label>
        <input
          type="checkbox"
          checked={ratio}
          onChange={(e) => setRatio(e.target.checked)}
        />
        {t(
          ar,
          "قفل نسبة الأبعاد (يعتمد العرض)",
          "Lock aspect ratio (width-driven)",
        )}
      </label>
      <button
        onClick={() =>
          run(() =>
            transformSelection(
              canvas,
              {
                x: v.x * factor,
                y: v.y * factor,
                width: v.width * factor,
                height: v.height * factor,
                angle: v.angle,
              },
              ratio,
            ),
          )
        }
      >
        {t(ar, "تطبيق المقاسات", "Apply transform")}
      </button>
    </>
  );
}
