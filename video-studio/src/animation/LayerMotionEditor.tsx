import type { TextLayer, LayerFrame } from "../types";
import { frame } from "./layerFrames";
export function LayerMotionEditor({
  layer,
  onChange,
}: {
  layer: TextLayer;
  onChange: (patch: Partial<TextLayer>) => void;
}) {
  const editFrame = (i: number, key: keyof LayerFrame, value: number) => {
    const frames = layer.frames!.map((f, j) =>
      j === i ? { ...f, [key]: value } : f,
    );
    onChange({ frames });
  };
  const fields = [
    ["at", "الثانية", 0, 86400],
    ["x", "إزاحة X", -200, 200],
    ["y", "إزاحة Y", -200, 200],
    ["rotation", "دوران", -720, 720],
    ["scaleX", "حجم X", 0.001, 5],
    ["scaleY", "حجم Y", 0.001, 5],
    ["opacity", "شفافية", 0, 1],
    ["blur", "تمويه", 0, 24],
  ] as const;
  return (
    <details className="layer-motion-editor element-properties">
      <summary>حركة العنصر والعدّاد</summary>
      <p>
        الأزمنة من بداية العنصر. الموضع والدوران هنا إضافيان لموضعه الأساسي.
      </p>
      <button
        type="button"
        onClick={() =>
          onChange({
            frames: [
              ...(layer.frames || []),
              frame((layer.frames?.at(-1)?.at ?? -0.5) + 0.5),
            ],
          })
        }
        disabled={(layer.frames?.length || 0) >= 120}
      >
        + نقطة حركة
      </button>
      {layer.frames?.map((f, i) => (
        <details key={i}>
          <summary>
            نقطة {i + 1} · {f.at.toFixed(2)} ث
          </summary>
          <div className="field-row">
            {fields.map(([key, title, min, max]) => (
              <label key={key}>
                {title}
                <input
                  aria-label={`${title} نقطة ${i + 1}`}
                  type="number"
                  step=".01"
                  min={
                    key === "at"
                      ? Math.max(
                          0,
                          (layer.frames![i - 1]?.at ?? -0.001) + 0.001,
                        )
                      : min
                  }
                  max={
                    key === "at"
                      ? (layer.frames![i + 1]?.at ?? 86400) - 0.001
                      : max
                  }
                  value={f[key]}
                  onChange={(e) => {
                    const lo =
                      key === "at"
                        ? Math.max(
                            0,
                            (layer.frames![i - 1]?.at ?? -0.001) + 0.001,
                          )
                        : min;
                    const hi =
                      key === "at"
                        ? (layer.frames![i + 1]?.at ?? 86400) - 0.001
                        : max;
                    editFrame(
                      i,
                      key,
                      Math.max(lo, Math.min(hi, +e.target.value)),
                    );
                  }}
                />
              </label>
            ))}
          </div>
          <label>
            منحنى الحركة
            <select
              aria-label={`منحنى نقطة ${i + 1}`}
              value={f.easing || "linear"}
              onChange={(e) =>
                onChange({
                  frames: layer.frames!.map((v, j) =>
                    i === j
                      ? { ...v, easing: e.target.value as LayerFrame["easing"] }
                      : v,
                  ),
                })
              }
            >
              <option value="linear">خطي</option>
              <option value="smooth">ناعم</option>
              <option value="spring">ارتداد خفيف</option>
            </select>
          </label>
          <button
            className="danger-link"
            type="button"
            onClick={() =>
              onChange({ frames: layer.frames!.filter((_, j) => i !== j) })
            }
          >
            حذف نقطة {i + 1}
          </button>
        </details>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange({
            counter: layer.counter
              ? undefined
              : { from: 2.4, to: 0.3, duration: 2, decimals: 1, suffix: "s" },
          })
        }
      >
        {layer.counter ? "إزالة العدّاد" : "إضافة عدّاد"}
      </button>
      {layer.counter && (
        <>
          <div className="field-row">
            {(["from", "to", "duration", "decimals"] as const).map((key, i) => (
              <label key={key}>
                {["من", "إلى", "المدة", "كسور عشرية"][i]}
                <input
                  aria-label={`العدّاد ${key}`}
                  type="number"
                  value={layer.counter![key]}
                  min={
                    key === "duration"
                      ? 0.01
                      : key === "decimals"
                        ? 0
                        : -1000000
                  }
                  max={
                    key === "decimals"
                      ? 4
                      : key === "duration"
                        ? 86400
                        : 1000000
                  }
                  step={key === "decimals" ? 1 : 0.1}
                  onChange={(e) => {
                    let n = +e.target.value;
                    n =
                      key === "decimals"
                        ? Math.round(Math.max(0, Math.min(4, n)))
                        : key === "duration"
                          ? Math.max(0.01, Math.min(86400, n))
                          : Math.max(-1000000, Math.min(1000000, n));
                    onChange({ counter: { ...layer.counter!, [key]: n } });
                  }}
                />
              </label>
            ))}
          </div>
          <label>
            وحدة العدّاد
            <input
              aria-label="وحدة العدّاد"
              maxLength={40}
              value={layer.counter.suffix}
              onChange={(e) =>
                onChange({
                  counter: { ...layer.counter!, suffix: e.target.value },
                })
              }
            />
          </label>
        </>
      )}
    </details>
  );
}
