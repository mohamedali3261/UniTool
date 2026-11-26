import { useState } from "react";
import type { Layer } from "../core/model";
import { downloadBlob } from "../../src/utils/download";
export function VectorTracePanel({ item, ar }: { item: Layer; ar: boolean }) {
  const [threshold, setThreshold] = useState(160),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <div className="ps-vector-trace">
      <h3>{ar ? "تتبع محلي أحادي اللون" : "Local monochrome vector trace"}</h3>
      <label>
        {ar ? "عتبة التتبع" : "Trace threshold"}
        <input
          aria-label={ar ? "عتبة التتبع" : "Trace threshold"}
          type="range"
          min="1"
          max="255"
          value={threshold}
          onChange={(e) => setThreshold(+e.target.value)}
        />
      </label>
      <button
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            const { traceRasterToSvg } = await import("../core/vectorTrace");
            const svg = await traceRasterToSvg(
              item.src,
              item.color,
              threshold,
              item.crop,
            );
            downloadBlob(
              new Blob([svg], { type: "image/svg+xml" }),
              `${item.name}-trace.svg`,
              { silent: true },
            );
          } catch (e) {
            setError(String(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "…" : ar ? "تصدير SVG أحادي اللون" : "Export monochrome SVG"}
      </button>
      <small>
        {ar
          ? "تتبع للبكسلات الداكنة في الصورة بعد القص، بلون المعالجة المختار وحتى 512px. الناتج مسارات متجهة بخطوط بكسلية، وليس تتبعًا ناعمًا أو متعدد الألوان بالذكاء الاصطناعي. لا يغيّر الصورة الأصلية."
          : "Traces dark pixels after cropping using the chosen processing color, at up to 512px. Output contains pixel-run vector paths, not smooth multi-color AI tracing. Original stays unchanged."}
      </small>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
