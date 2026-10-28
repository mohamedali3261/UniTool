import { StudioSelect } from "../components/StudioSelect";
import type { TextLayer } from "../types";
const options = [
  { value: "none", label: "بدون حركة" },
  { value: "fade", label: "تلاشي" },
  { value: "slide", label: "دخول/خروج من أسفل" },
  { value: "pop", label: "ظهور بحجم متغيّر" },
];
export function TextMotionControls({
  layer,
  onChange,
}: {
  layer: TextLayer;
  onChange: (patch: Partial<TextLayer>) => void;
}) {
  return (
    <details className="text-motion-controls">
      <summary>تحريك النص</summary>
      <label className="field-label">
        دخول النص
        <StudioSelect
          label="دخول النص"
          value={layer.animationIn || "none"}
          onValueChange={(value) =>
            onChange({ animationIn: value as TextLayer["animationIn"] })
          }
          options={[...options, { value: "typewriter", label: "آلة كاتبة" }]}
        />
      </label>
      <label className="field-label">
        خروج النص
        <StudioSelect
          label="خروج النص"
          value={layer.animationOut || "none"}
          onValueChange={(value) =>
            onChange({ animationOut: value as TextLayer["animationOut"] })
          }
          options={options}
        />
      </label>
      <label className="field-label">
        زمن الحركة (ث)
        <input
          aria-label="زمن حركة النص"
          type="number"
          min=".1"
          max="3"
          step=".1"
          value={layer.animationDuration ?? 0.5}
          onChange={(e) =>
            onChange({
              animationDuration: Math.max(0.1, Math.min(3, +e.target.value)),
            })
          }
        />
      </label>
    </details>
  );
}
