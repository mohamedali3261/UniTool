import { useState } from "react";
import type { TextLayer } from "../types";
import { validPoints } from "./vectorPath";
export function VectorPathEditor({
  layer,
  onChange,
}: {
  layer: TextLayer;
  onChange: (patch: Partial<TextLayer>) => void;
}) {
  const [draft, setDraft] = useState(
      JSON.stringify(layer.box?.points || [], null, 2),
    ),
    [error, setError] = useState("");
  if (!layer.box?.points) return null;
  return (
    <details>
      <summary>نقاط الشكل المتجه</summary>
      <p>إحداثيات نسبية من −1 إلى 1 داخل حدود الشكل.</p>
      <textarea
        aria-label="نقاط الشكل"
        dir="ltr"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
      />
      <button
        type="button"
        onClick={() => {
          try {
            const points = JSON.parse(draft);
            if (!validPoints(points)) throw Error();
            onChange({ box: { ...layer.box!, points } });
            setError("");
          } catch {
            setError("اكتب من 3 إلى 64 نقطة صالحة، x وy بين -1 و1.");
          }
        }}
      >
        تطبيق نقاط الشكل
      </button>
      {error && <p role="alert">{error}</p>}
    </details>
  );
}
