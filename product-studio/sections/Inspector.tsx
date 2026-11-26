import { ArtworkTools } from "./ArtworkTools";
import type { Layer } from "../core/model";
export function Inspector({
  item,
  onChange,
  ar,
  fonts = [],
}: {
  item: Layer | undefined;
  onChange: (p: Partial<Layer>) => void;
  ar: boolean;
  fonts?: string[];
}) {
  if (!item)
    return (
      <section className="ps-inspector">
        <div className="ps-section-head">
          <span>03 /</span>
          <h2>{ar ? "العنصر المحدد" : "Selected item"}</h2>
        </div>
        <p className="ps-empty">
          {ar
            ? "اختر طبقة لتعديل تفاصيلها."
            : "Select a layer to edit its properties."}
        </p>
      </section>
    );
  const number = (
    key: "x" | "y" | "w" | "h" | "rotation",
    label: string,
    min: number,
    max: number,
  ) => (
    <label key={key}>
      {label}
      <input
        type="number"
        min={min}
        max={max}
        value={Math.round(item[key])}
        onChange={(e) => {
          if (e.target.value !== "") {
            const value = Math.min(max, Math.max(min, Number(e.target.value)));
            const patch: Partial<Layer> = { [key]: value };
            if (item.lockRatio !== false && key === "w")
              patch.h = Math.max(
                20,
                Math.min(2048, Math.round((item.h * value) / item.w)),
              );
            if (item.lockRatio !== false && key === "h")
              patch.w = Math.max(
                20,
                Math.min(2048, Math.round((item.w * value) / item.h)),
              );
            onChange(patch);
          }
        }}
      />
    </label>
  );
  return (
    <section className="ps-inspector">
      <div className="ps-section-head">
        <span>03 /</span>
        <h2>{ar ? "العنصر المحدد" : "Selected item"}</h2>
      </div>
      <fieldset disabled={item.locked}>
        <label>
          {ar ? "اسم الطبقة" : "Layer name"}
          <input
            value={item.name}
            maxLength={80}
            onChange={(e) => onChange({ name: e.target.value })}
          />
        </label>
        {item.kind === "text" && (
          <>
            <label>
              {ar ? "النص" : "Text"}
              <textarea
                aria-label={ar ? "النص" : "Text"}
                value={item.text}
                rows={3}
                maxLength={500}
                onChange={(e) => onChange({ text: e.target.value })}
              />
            </label>
            <div className="ps-input-grid">
              <label>
                {ar ? "الخط" : "Typeface"}
                <select
                  aria-label={ar ? "الخط" : "Typeface"}
                  value={item.font}
                  onChange={(e) => onChange({ font: e.target.value })}
                >
                  {["Arial", "Georgia", "monospace", "Tahoma", ...fonts].map(
                    (f) => (
                      <option key={f}>{f}</option>
                    ),
                  )}
                </select>
              </label>
              <label>
                {ar ? "الوزن" : "Weight"}
                <select
                  value={String(item.bold)}
                  onChange={(e) =>
                    onChange({ bold: e.target.value === "true" })
                  }
                >
                  <option value="true">Bold</option>
                  <option value="false">Regular</option>
                </select>
              </label>
            </div>
          </>
        )}
        {item.kind !== "image" && (
          <label className="ps-color-field">
            {ar ? "لون التصميم" : "Artwork color"}
            <input
              aria-label={ar ? "لون التصميم" : "Artwork color"}
              type="color"
              value={item.color}
              onChange={(e) => onChange({ color: e.target.value })}
            />
            <code>{item.color}</code>
          </label>
        )}
        <label>
          {ar ? "حجم العنصر" : "Item size"}
          <input
            aria-label={ar ? "حجم العنصر" : "Item size"}
            type="range"
            min="20"
            max="1500"
            value={item.w}
            onChange={(e) => {
              const w = +e.target.value;
              onChange({
                w,
                h: Math.max(
                  20,
                  Math.min(2048, Math.round((item.h * w) / item.w)),
                ),
              });
            }}
          />
        </label>
        <div className="ps-input-grid">
          {number("x", "X", -1024, 2048)}
          {number("y", "Y", -1024, 2048)}
          {number("w", ar ? "العرض" : "Width", 20, 2048)}
          {number("h", ar ? "الارتفاع" : "Height", 20, 2048)}
        </div>
        <label>
          {ar ? "الدوران" : "Rotation"} <output>{item.rotation}°</output>
          <input
            aria-label={ar ? "الدوران" : "Rotation"}
            type="range"
            min="-180"
            max="180"
            value={item.rotation}
            onChange={(e) => onChange({ rotation: +e.target.value })}
          />
        </label>
        <label>
          {ar ? "الشفافية" : "Opacity"}
          <output>{Math.round(item.opacity * 100)}%</output>
          <input
            aria-label={ar ? "الشفافية" : "Opacity"}
            type="range"
            min="0"
            max="1"
            step=".01"
            value={item.opacity}
            onChange={(e) => onChange({ opacity: +e.target.value })}
          />
        </label>
        <button
          className="ps-full-button"
          onClick={() =>
            onChange({ x: (1024 - item.w) / 2, y: (1024 - item.h) / 2 })
          }
        >
          {ar ? "توسيط في مساحة التصميم" : "Center in print area"}
        </button>
        <ArtworkTools item={item} change={onChange} ar={ar} />
      </fieldset>
      {item.locked && (
        <p className="ps-empty">
          {ar
            ? "الطبقة مقفولة. افتح القفل للتعديل."
            : "Unlock this layer to edit."}
        </p>
      )}
    </section>
  );
}
