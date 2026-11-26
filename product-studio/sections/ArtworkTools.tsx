import { VectorTracePanel } from "./VectorTracePanel";
import { ImageCropDialog } from "./ImageCropDialog";
import { useCallback } from "react";
import { RasterTools } from "./RasterTools";
import { GradientControl } from "./GradientControl";
import { useState } from "react";
import type { Layer } from "../core/model";
import { placements } from "../core/advanced";
import { editImage } from "../core/imageTools";
export function ArtworkTools({
  item,
  change,
  ar,
}: {
  item: Layer;
  change: (p: Partial<Layer>) => void;
  ar: boolean;
}) {
  const [cropOpen, setCropOpen] = useState(false);
  const closeCrop = useCallback(() => setCropOpen(false), []);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const slider = (
    key:
      | "brightness"
      | "contrast"
      | "saturation"
      | "hue"
      | "outline"
      | "shadow"
      | "curve",
    label: string,
    en: string,
    min: number,
    max: number,
    fallback: number,
  ) => (
    <label>
      {ar ? label : en}
      <output>{item[key] ?? fallback}</output>
      <input
        aria-label={ar ? label : en}
        type="range"
        min={min}
        max={max}
        value={item[key] ?? fallback}
        onChange={(e) => change({ [key]: +e.target.value })}
      />
    </label>
  );
  return (
    <div className="ps-advanced-artwork">
      <label className="ps-check">
        <input
          type="checkbox"
          checked={item.lockRatio !== false}
          onChange={(e) => change({ lockRatio: e.target.checked })}
        />
        {ar ? "قفل نسب الأبعاد" : "Lock aspect ratio"}
      </label>
      <div className="ps-input-grid">
        <button onClick={() => change({ flipX: !item.flipX })}>
          {ar ? "قلب أفقي" : "Flip horizontal"}
        </button>
        <button onClick={() => change({ flipY: !item.flipY })}>
          {ar ? "قلب رأسي" : "Flip vertical"}
        </button>
      </div>
      <h3>
        {ar ? "أماكن جاهزة داخل الجزء الحالي" : "Place within current panel"}
      </h3>
      <div className="ps-chip-grid">
        {placements.map((p) => (
          <button
            key={p.id}
            onClick={() => change({ x: p.x, y: p.y, w: p.w, h: p.h })}
          >
            {ar ? p.ar : p.en}
          </button>
        ))}
      </div>
      {item.kind !== "image" && (
        <GradientControl
          label={ar ? "تدرج العنصر" : "Artwork gradient"}
          value={item.gradient}
          change={(gradient) => change({ gradient })}
          solid={item.color}
          ar={ar}
        />
      )}
      {item.kind === "shape" && (
        <>
          <label className="ps-check">
            <input
              type="checkbox"
              checked={!!item.outlineOnly}
              onChange={(e) => change({ outlineOnly: e.target.checked })}
            />
            {ar ? "حدود الشكل فقط" : "Outline only"}
          </label>
          <label className="ps-check">
            <input
              type="checkbox"
              checked={!!item.dashed}
              onChange={(e) => change({ dashed: e.target.checked })}
            />
            {ar ? "خط متقطع" : "Dashed stroke"}
          </label>
          {slider("outline", "سمك الحدود", "Stroke width", 1, 30, 6)}
        </>
      )}
      {item.kind === "text" && (
        <>
          <label className="ps-check">
            <input
              type="checkbox"
              checked={!!item.italic}
              onChange={(e) => change({ italic: e.target.checked })}
            />
            {ar ? "خط مائل" : "Italic"}
          </label>
          <label>
            {ar ? "محاذاة الفقرة" : "Paragraph alignment"}
            <select
              value={item.align ?? "center"}
              onChange={(e) =>
                change({ align: e.target.value as Layer["align"] })
              }
            >
              <option value="left">{ar ? "يسار" : "Left"}</option>
              <option value="center">{ar ? "وسط" : "Center"}</option>
              <option value="right">{ar ? "يمين" : "Right"}</option>
            </select>
          </label>
          <label>
            {ar ? "تباعد الأسطر" : "Line height"}
            <input
              aria-label={ar ? "تباعد الأسطر" : "Line height"}
              type="range"
              min=".7"
              max="3"
              step=".05"
              value={item.lineHeight ?? 1.12}
              onChange={(e) => change({ lineHeight: +e.target.value })}
            />
          </label>
          <label>
            {ar ? "تباعد الحروف" : "Letter spacing"}
            <input
              aria-label={ar ? "تباعد الحروف" : "Letter spacing"}
              type="range"
              min="-5"
              max="30"
              step=".5"
              value={item.letterSpacing ?? 0}
              onChange={(e) => change({ letterSpacing: +e.target.value })}
            />
          </label>
          {slider("outline", "حدود النص", "Text outline", 0, 30, 0)}
          <label>
            {ar ? "لون الحدود" : "Outline color"}
            <input
              type="color"
              value={item.outlineColor ?? "#000000"}
              onChange={(e) => change({ outlineColor: e.target.value })}
            />
          </label>
          {slider("shadow", "ظل النص", "Text shadow", 0, 60, 0)}
          {slider("curve", "انحناء النص", "Text curve", -180, 180, 0)}
          <small>
            {ar
              ? "يُحنَى النص بعد تشكيله للحفاظ على اتصال الحروف العربية."
              : "Text is shaped before curving, preserving Arabic joining."}
          </small>
        </>
      )}
      {item.kind === "image" && (
        <>
          <button onClick={() => setCropOpen(true)}>
            {ar ? "قص الصورة بالسحب" : "Interactive crop"}
          </button>
          {cropOpen && (
            <ImageCropDialog
              key={item.id}
              item={item}
              close={closeCrop}
              apply={(crop) => {
                change({ crop });
                setCropOpen(false);
              }}
              ar={ar}
            />
          )}
          <RasterTools item={item} change={change} ar={ar} />
          <VectorTracePanel item={item} ar={ar} />
          {slider("brightness", "سطوع الصورة", "Brightness", 0, 200, 100)}
          {slider("contrast", "تباين الصورة", "Contrast", 0, 200, 100)}
          {slider("saturation", "تشبع الصورة", "Saturation", 0, 200, 100)}
          {slider("hue", "تدرج اللون", "Hue", -180, 180, 0)}
          <h3>{ar ? "قص الصورة بالنسبة المئوية" : "Crop image (%)"}</h3>
          <div className="ps-input-grid">
            {(["x", "y", "w", "h"] as const).map((key) => (
              <label key={key}>
                {key}
                <input
                  aria-label={`Crop ${key}`}
                  type="number"
                  min={key === "w" || key === "h" ? 1 : 0}
                  max="100"
                  value={Math.round(
                    (item.crop?.[key] ?? (key === "w" || key === "h" ? 1 : 0)) *
                      100,
                  )}
                  onChange={(e) => {
                    const c = { x: 0, y: 0, w: 1, h: 1, ...item.crop };
                    c[key] = Math.max(
                      key === "w" || key === "h" ? 0.01 : 0,
                      Math.min(1, +e.target.value / 100),
                    );
                    c.w = Math.min(c.w, 1 - c.x);
                    c.h = Math.min(c.h, 1 - c.y);
                    if (c.w > 0 && c.h > 0) change({ crop: c });
                  }}
                />
              </label>
            ))}
          </div>
          <button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                change({ src: await editImage(item.src, true) });
              } catch (e) {
                setError(String(e));
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy
              ? "…"
              : ar
                ? "إزالة خلفية متصلة بلون بسيط"
                : "Remove connected plain background"}
          </button>
          <small>
            {ar
              ? "إزالة محلية من الحواف للخلفيات البسيطة، وليست عزلًا بالذكاء الاصطناعي. التراجع يعيد الأصل."
              : "Local edge flood-fill, not AI segmentation. Undo restores original."}
          </small>
          <button
            onClick={() =>
              change({
                crop: undefined,
                brightness: 100,
                contrast: 100,
                saturation: 100,
                hue: 0,
              })
            }
          >
            {ar ? "إعادة ضبط الصورة" : "Reset image adjustments"}
          </button>
        </>
      )}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
