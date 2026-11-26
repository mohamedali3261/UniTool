import { useState } from "react";
import type { Layer } from "../core/model";
export function RasterTools({
  item,
  change,
  ar,
}: {
  item: Layer;
  change: (p: Partial<Layer>) => void;
  ar: boolean;
}) {
  const [busy, setBusy] = useState(false),
    [status, setStatus] = useState("");
  async function run(
    mode: "invert" | "tint" | "halftone" | "trim" | "upscale",
  ) {
    setBusy(true);
    setStatus("");
    try {
      const { processRaster } = await import("../core/rasterEffects");
      const src = await processRaster(item.src, mode, item.color);
      change({ src, crop: undefined });
      setStatus(
        ar
          ? "تم التعديل؛ التراجع يعيد الصورة السابقة."
          : "Applied; undo restores the previous image.",
      );
    } catch (e) {
      setStatus(String(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="ps-raster-tools">
      <div className="ps-chip-grid">
        {(
          [
            { id: "invert", ar: "عكس ألوان الصورة", en: "Invert colors" },
            { id: "tint", ar: "تلوين الصورة", en: "Fill with color" },
            { id: "halftone", ar: "تنقيط Halftone", en: "Halftone dots" },
            {
              id: "trim",
              ar: "قص الحواف الشفافة",
              en: "Trim transparent edges",
            },
            { id: "upscale", ar: "تكبير الصورة ×2", en: "Upscale image ×2" },
          ] as const
        ).map((m) => (
          <button key={m.id} disabled={busy} onClick={() => run(m.id)}>
            {ar ? m.ar : m.en}
          </button>
        ))}
      </div>
      <label>
        {ar ? "لون التلوين والتنقيط" : "Tint and halftone color"}
        <input
          aria-label={ar ? "لون معالجة الصورة" : "Image processing color"}
          type="color"
          value={item.color}
          onChange={(e) => change({ color: e.target.value })}
        />
      </label>
      <small>
        {ar
          ? "التنقيط محلي مبسط يحتاج تجربة قبل DTF. التكبير إعادة تحجيم حتى 4096px وليس تحسين تفاصيل بالذكاء الاصطناعي."
          : "Basic local halftone: proof before DTF. Upscaling resamples up to 4096px, not AI detail reconstruction."}
      </small>
      {status && <p role="status">{status}</p>}
    </div>
  );
}
