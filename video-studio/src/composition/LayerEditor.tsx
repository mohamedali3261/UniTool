import { useState } from "react";
import { StudioSelect } from "../components/StudioSelect";
import {
  uid,
  durationOf,
  type Asset,
  type Project,
  type OverlayLayer,
} from "../types";
export function LayerEditor({
  project,
  assets,
  onProject,
  getTime,
  onSeek,
  onImportLayer,
}: {
  project: Project;
  assets: Asset[];
  onProject: (p: Partial<Project>) => void;
  getTime: () => number;
  onImportLayer: () => void;
  onSeek: (t: number) => void;
}) {
  const [source, setSource] = useState("");
  const visual = assets.filter((a) => a.type !== "audio");
  const layers = project.overlays || [];
  const edit = (id: string, patch: Partial<OverlayLayer>) =>
    onProject({
      overlays: layers.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    });
  const move = (i: number, delta: number) => {
    const target = i + delta;
    if (target < 0 || target >= layers.length) return;
    const next = [...layers];
    [next[i], next[target]] = [next[target], next[i]];
    onProject({ overlays: next });
  };
  return (
    <details className="layer-editor" id="studio-layers">
      <summary>
        طبقات إضافية <span>{layers.length} / ٦</span>
      </summary>
      <p>
        صور ولوجو وفيديو داخل فيديو. آخر طبقة في القائمة تظهر فوق الباقي. النصوص
        فوق الطبقات العادية؛ فعّل «فوق النصوص» للصورة الشخصية.
      </p>
      <button
        className="secondary"
        disabled={!project.clips.length || layers.length >= 6}
        onClick={onImportLayer}
      >
        رفع ملف كطبقة فقط
      </button>
      {visual.length > 0 && (
        <StudioSelect
          label="مصدر الطبقة الجديدة"
          value={visual.some((a) => a.id === source) ? source : visual[0].id}
          onValueChange={setSource}
          options={visual.map((a) => ({ value: a.id, label: a.name }))}
        />
      )}
      <button
        className="secondary"
        disabled={!visual.length || !project.clips.length || layers.length >= 6}
        onClick={() => {
          const a = visual.find((a) => a.id === source) || visual[0];
          const at = Math.max(
            0,
            Math.min(getTime(), durationOf(project) - 0.1),
          );
          onProject({
            overlays: [
              ...layers,
              {
                id: uid(),
                assetId: a.id,
                at,
                start: 0,
                end: Math.min(
                  a.duration,
                  Math.max(0.1, durationOf(project) - at),
                ),
                x: 75,
                y: 28,
                width: 35,
                opacity: 1,
                rotation: 0,
                volume: 0,
              },
            ],
          });
        }}
      >
        ＋ إضافة طبقة عند المؤشر
      </button>
      {layers.map((l, i) => {
        const a = assets.find((a) => a.id === l.assetId);
        return (
          <details key={l.id} className="layer-properties" open>
            <summary>
              طبقة {i + 1} · {a?.name}
            </summary>
            <StudioSelect
              label={`مصدر الطبقة ${i + 1}`}
              value={l.assetId}
              options={visual.map((a) => ({ value: a.id, label: a.name }))}
              onValueChange={(assetId) => {
                const next = visual.find((a) => a.id === assetId)!;
                edit(l.id, {
                  assetId,
                  start: 0,
                  end:
                    next.type === "image"
                      ? l.end - l.start
                      : Math.min(l.end - l.start, next.duration),
                });
              }}
            />
            <label>
              <input
                type="checkbox"
                checked={!!l.foreground}
                onChange={(e) =>
                  edit(l.id, {
                    foreground: e.target.checked,
                    ...(e.target.checked ? { backgroundLayer: false } : {}),
                  })
                }
              />{" "}
              فوق النصوص والخلفيات التصميمية
            </label>
            <label>
              <input
                type="checkbox"
                checked={!!l.backgroundLayer}
                onChange={(e) =>
                  edit(l.id, {
                    backgroundLayer: e.target.checked,
                    ...(e.target.checked
                      ? {
                          foreground: false,
                          fit: "cover",
                          width: 100,
                          x: 50,
                          y: 50,
                        }
                      : {}),
                  })
                }
              />
              خلفية تحت العناصر
            </label>
            <div className="two-fields">
              {(
                [
                  ["at", "البداية (ث)", 0, 3600, 0.1],
                  ["x", "المكان الأفقي %", 0, 100, 1],
                  ["y", "المكان الرأسي %", 0, 100, 1],
                  ["width", "الحجم %", 10, 150, 1],
                  ["opacity", "الشفافية", 0, 1, 0.05],
                  ["volume", "الصوت", 0, 1, 0.05],
                ] as const
              ).map(([key, label, min, max, step]) => (
                <label key={key}>
                  {label}
                  <input
                    aria-label={`طبقة ${i + 1} ${label}`}
                    type="number"
                    min={min}
                    max={max}
                    step={step}
                    value={l[key]}
                    onChange={(e) =>
                      edit(l.id, {
                        [key]: Math.max(min, Math.min(max, +e.target.value)),
                      })
                    }
                  />
                </label>
              ))}
            </div>
            <label className="field-label">
              قص من المصدر (ث)
              <input
                aria-label={`قص مصدر الطبقة ${i + 1}`}
                type="number"
                min="0"
                max={
                  a?.type === "image"
                    ? 3600
                    : Math.max(0, (a?.duration || 1) - 0.1)
                }
                step=".1"
                value={l.start}
                onChange={(e) => {
                  const start = Math.max(
                    0,
                    Math.min(
                      (a?.type === "image" ? 3600 : a?.duration || 1) - 0.1,
                      +e.target.value,
                    ),
                  );
                  edit(l.id, { start, end: Math.max(start + 0.1, l.end) });
                }}
              />
            </label>
            <label className="field-label">
              مدة العرض (ث)
              <input
                aria-label={`مدة الطبقة ${i + 1}`}
                type="number"
                min=".1"
                max={(a?.type === "image" ? 3600 : a?.duration || 1) - l.start}
                step=".1"
                value={Math.round((l.end - l.start) * 100) / 100}
                onChange={(e) =>
                  edit(l.id, {
                    end:
                      l.start +
                      Math.max(
                        0.1,
                        Math.min(
                          (a?.type === "image" ? 3600 : a?.duration || 1) -
                            l.start,
                          +e.target.value,
                        ),
                      ),
                  })
                }
              />
            </label>
            <StudioSelect
              label={`تدوير الطبقة ${i + 1}`}
              value={l.rotation}
              onValueChange={(rotation) => edit(l.id, { rotation: +rotation })}
              options={[...new Set([0, 90, 180, 270, l.rotation])]
                .sort((a, b) => a - b)
                .map((v) => ({
                  value: v,
                  label: `${Math.round(v * 10) / 10}°`,
                }))}
            />
            <div className="layer-actions">
              <button
                disabled={i === layers.length - 1}
                onClick={() => move(i, 1)}
                aria-label={`رفع الطبقة ${i + 1}`}
              >
                ↑
              </button>
              <button
                disabled={!i}
                onClick={() => move(i, -1)}
                aria-label={`خفض الطبقة ${i + 1}`}
              >
                ↓
              </button>
              <button onClick={() => onSeek(l.at)}>عرض</button>
              <button
                className="danger-link"
                onClick={() =>
                  onProject({ overlays: layers.filter((x) => x.id !== l.id) })
                }
              >
                حذف الطبقة
              </button>
            </div>
          </details>
        );
      })}
    </details>
  );
}
