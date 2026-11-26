import type { Layer, Project, Side } from "../core/model";
import {
  fromCm,
  toCm,
  selectionSize,
  type DisplayUnit,
} from "../core/measurements";
export function MeasurementPanel({
  project,
  side,
  item,
  patch,
  change,
  ar,
}: {
  project: Project;
  side: Side;
  item?: Layer;
  patch: (p: Partial<Project>) => void;
  change: (p: Partial<Layer>) => void;
  ar: boolean;
}) {
  const area = project.printAreas?.[side],
    unit = project.displayUnit ?? "mm";
  return (
    <section className="ps-extra-panel">
      <h3>{ar ? "مقاسات العنصر الحية" : "Live artwork dimensions"}</h3>
      <div className="ps-chip-grid">
        {(["mm", "cm", "in"] as const).map((u) => (
          <button
            aria-pressed={unit === u}
            key={u}
            onClick={() => patch({ displayUnit: u })}
          >
            {u}
          </button>
        ))}
      </div>
      {item && <output dir="ltr">{selectionSize(item, area, unit)}</output>}
      {!area ? (
        <>
          <p>
            {ar
              ? "أدخل مساحة الطباعة الفعلية لعرض المقاس بوحدات حقيقية؛ لا نفترض مقاسات للملابس."
              : "Set the actual print area to see real units. Garment dimensions are not assumed."}
          </p>
          <button
            onClick={() =>
              patch({
                printAreas: {
                  ...project.printAreas,
                  [side]: { width: 30, height: 30, dpi: 300, safe: 1 },
                },
              })
            }
          >
            {ar
              ? "ضبط مساحة الطباعة — مثال 30 × 30 سم"
              : "Set print area — example 30 × 30 cm"}
          </button>
        </>
      ) : (
        item && (
          <fieldset disabled={item.locked}>
            <div className="ps-input-grid">
              {(["w", "h", "x", "y"] as const).map((key) => (
                <label key={key}>
                  {
                    {
                      w: ar ? "عرض الطباعة" : "Print width",
                      h: ar ? "ارتفاع الطباعة" : "Print height",
                      x: "X",
                      y: "Y",
                    }[key]
                  }{" "}
                  ({unit})
                  <input
                    aria-label={`Measured ${key}`}
                    type="number"
                    step=".1"
                    value={
                      +fromCm(
                        (item[key] / 1024) *
                          (key === "w" || key === "x"
                            ? area.width
                            : area.height),
                        unit,
                      ).toFixed(2)
                    }
                    onChange={(e) => {
                      const value =
                        (toCm(+e.target.value, unit) /
                          (key === "w" || key === "x"
                            ? area.width
                            : area.height)) *
                        1024;
                      const p: Partial<Layer> = {
                        [key]: Math.max(
                          key === "w" || key === "h" ? 20 : -1024,
                          Math.min(2048, value),
                        ),
                      };
                      if (item.lockRatio !== false && key === "w")
                        p.h = Math.max(
                          20,
                          Math.min(2048, (item.h * p.w!) / item.w),
                        );
                      if (item.lockRatio !== false && key === "h")
                        p.w = Math.max(
                          20,
                          Math.min(2048, (item.w * p.h!) / item.h),
                        );
                      change(p);
                    }}
                  />
                </label>
              ))}
            </div>
          </fieldset>
        )
      )}
    </section>
  );
}
