import { CreativeDataControl } from "./CreativeDataControl";
import type { TextLayer } from "../types";
import { creativeCatalog, textCreativeIds, type CreativeId } from "./catalog";
export function CreativeControls({
  layer,
  onChange,
}: {
  layer: TextLayer;
  onChange: (p: Partial<TextLayer>) => void;
}) {
  const value = layer.creative;
  return (
    <fieldset className="creative-controls">
      <legend>الحركات الإبداعية</legend>
      {!value || textCreativeIds.has(value.id) ? (
        <label>
          حركة النص
          <select
            aria-label="حركة النص الإبداعية"
            value={value?.id || "none"}
            onChange={(e) =>
              onChange({
                creative:
                  e.target.value === "none"
                    ? undefined
                    : {
                        id: e.target.value as CreativeId,
                        speed: 1,
                        strength: 1,
                        pointerX: 50,
                        pointerY: 50,
                      },
              })
            }
          >
            <option value="none">بدون حركة إبداعية</option>
            {creativeCatalog
              .filter((item) => textCreativeIds.has(item[0]))
              .map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
          </select>
        </label>
      ) : (
        <p>{creativeCatalog.find((entry) => entry[0] === value.id)?.[1]}</p>
      )}
      {value && (
        <>
          <label>
            سرعة الحركة
            <input
              aria-label="سرعة الحركة الإبداعية"
              type="range"
              min="0.1"
              max="4"
              step="0.1"
              value={value.speed}
              onChange={(e) =>
                onChange({
                  creative: { ...value, speed: Number(e.target.value) },
                })
              }
            />
            <output>{value.speed}×</output>
          </label>
          {value.id === "marker" && (
            <label>
              الكلمة المهمة
              <input
                aria-label="الكلمة المهمة"
                maxLength={100}
                value={
                  value.highlight ?? layer.text.trim().split(/\s+/).at(-1) ?? ""
                }
                onChange={(e) =>
                  onChange({
                    creative: { ...value, highlight: e.target.value },
                  })
                }
              />
            </label>
          )}
          {value.id === "grain" && (
            <label>
              كثافة الحبيبات
              <input
                aria-label="كثافة الحبيبات"
                type="range"
                min="0.1"
                max="2"
                step="0.1"
                value={value.strength}
                onChange={(e) =>
                  onChange({
                    creative: { ...value, strength: Number(e.target.value) },
                  })
                }
              />
            </label>
          )}
          {value.id === "donut" && (
            <label>
              نسبة التقدم
              <input
                aria-label="نسبة التقدم"
                type="range"
                min="0"
                max="100"
                value={value.value ?? 86}
                onChange={(e) =>
                  onChange({
                    creative: { ...value, value: Number(e.target.value) },
                  })
                }
              />
              <output>{value.value ?? 86}%</output>
            </label>
          )}
          {["line", "sparkline", "heatmap"].includes(value.id) && (
            <CreativeDataControl
              value={value}
              change={(creative) => onChange({ creative })}
            />
          )}
          {["grid", "cursor", "magnet"].includes(value.id) && (
            <>
              {(["pointerX", "pointerY"] as const).map((key, i) => (
                <label key={key}>
                  {i ? "موضع المؤشر الرأسي" : "موضع المؤشر الأفقي"}
                  <input
                    aria-label={i ? "المؤشر الرأسي" : "المؤشر الأفقي"}
                    type="range"
                    min="0"
                    max="100"
                    value={value[key]}
                    onChange={(e) =>
                      onChange({
                        creative: { ...value, [key]: Number(e.target.value) },
                      })
                    }
                  />
                </label>
              ))}
            </>
          )}
          <small>
            الحركة محسوبة من وقت التايم لاين وتُحفظ مع المشروع. واجهات ومؤشرات
            مصممة للفيديو، وليست صفحات ويب تفاعلية. الانتقالات في مكتبة العناصر
            عروض مرئية بين مشهدين مصممين.
          </small>
          {value.id === "odometer" && (
            <small>
              اكتب أرقامًا إنجليزية أو عربية في محتوى النص؛ الرموز والفواصل تبقى
              ثابتة.
            </small>
          )}
          {value.id === "three" && (
            <small>
              Three.js / WebGL؛ يظهر بديل 2D واضح عند عدم توافر WebGL.
            </small>
          )}
        </>
      )}
    </fieldset>
  );
}
