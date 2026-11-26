import { useRef } from "react";
import {
  gradientPositions,
  insertGradientStop,
  moveGradientStop,
  removeGradientStop,
  type Gradient,
} from "../core/materials";
export function GradientControl({
  value,
  change,
  ar,
  label,
  solid = "#496c50",
  radial = true,
}: {
  value?: Gradient;
  change: (g: Gradient | undefined) => void;
  ar: boolean;
  label: string;
  solid?: string;
  radial?: boolean;
}) {
  const track = useRef<HTMLDivElement>(null),
    drag = useRef<{ index: number; y: number } | null>(null),
    latest = useRef(value);
  latest.current = value;
  const offset = (x: number) => {
    const r = track.current!.getBoundingClientRect();
    return Math.max(0, Math.min(1, (x - r.left) / r.width));
  };
  const add = () => {
    if (!value) return;
    const ps = gradientPositions(value);
    let gap = -1,
      position = 0.5;
    const all = [0, ...ps, 1];
    for (let i = 0; i < all.length - 1; i++)
      if (all[i + 1] - all[i] > gap) {
        gap = all[i + 1] - all[i];
        position = (all[i + 1] + all[i]) / 2;
      }
    change(insertGradientStop(value, position, "#ffffff"));
  };
  return (
    <div className="ps-gradient-control">
      <label className="ps-check">
        <input
          aria-label={label}
          type="checkbox"
          checked={!!value}
          onChange={(e) =>
            change(
              e.target.checked
                ? { colors: [solid, "#eee8d6"], angle: 90 }
                : undefined,
            )
          }
        />
        {label}
      </label>
      {value && (
        <>
          <div
            className="ps-gradient-track"
            ref={track}
            aria-label={`${label} ${ar ? "شريط النقاط" : "stop track"}`}
            style={{
              background: `linear-gradient(90deg,${value.colors.map((c, i) => `${c} ${gradientPositions(value)[i] * 100}%`).join(",")})`,
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget)
                change(insertGradientStop(value, offset(e.clientX)));
            }}
            onPointerMove={(e) => {
              const d = drag.current,
                g = latest.current;
              if (d && g)
                change(moveGradientStop(g, d.index, offset(e.clientX)));
            }}
            onPointerUp={(e) => {
              const d = drag.current,
                g = latest.current;
              drag.current = null;
              if (d && g && Math.abs(e.clientY - d.y) > 40)
                change(removeGradientStop(g, d.index));
            }}
            onPointerCancel={() => {
              drag.current = null;
            }}
          >
            {value.colors.map((c, i) => (
              <button
                key={i}
                role="slider"
                aria-label={`${label} ${ar ? "نقطة" : "stop"} ${i + 1}`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(gradientPositions(value)[i] * 100)}
                style={{
                  left: `${gradientPositions(value)[i] * 100}%`,
                  background: c,
                }}
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  drag.current = { index: i, y: e.clientY };
                  e.currentTarget.setPointerCapture(e.pointerId);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Delete" || e.key === "Backspace") {
                    e.preventDefault();
                    e.stopPropagation();
                    change(removeGradientStop(value, i));
                  }
                  if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                    e.preventDefault();
                    e.stopPropagation();
                    change(
                      moveGradientStop(
                        value,
                        i,
                        gradientPositions(value)[i] +
                          (e.key === "ArrowLeft" ? -1 : 1) *
                            (e.shiftKey ? 0.1 : 0.01),
                      ),
                    );
                  }
                }}
              />
            ))}
          </div>
          <small>
            {ar
              ? "اضغط الشريط لإضافة نقطة، اسحب لتغيير مكانها، أو اسحب بعيدًا للحذف. الأسهم تحرك 1% وShift تحرك 10%."
              : "Click the bar to add a stop. Drag to position; drag away to delete. Arrows move 1%, Shift moves 10%."}
          </small>
          <div className="ps-chip-grid">
            {value.colors.map((c, i) => (
              <label key={i}>
                <input
                  aria-label={`${label} ${i + 1}`}
                  type="color"
                  value={c}
                  onChange={(e) =>
                    change({
                      ...value,
                      colors: value.colors.map((v, j) =>
                        j === i ? e.target.value : v,
                      ),
                    })
                  }
                />
                <input
                  aria-label={`${label} ${ar ? "موضع" : "position"} ${i + 1}`}
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={Math.round(gradientPositions(value)[i] * 100)}
                  onChange={(e) =>
                    change(moveGradientStop(value, i, +e.target.value / 100))
                  }
                />
                {value.colors.length > 2 && (
                  <button
                    aria-label={`${ar ? "حذف لون" : "Remove color"} ${i + 1}`}
                    onClick={() => change(removeGradientStop(value, i))}
                  >
                    ×
                  </button>
                )}
              </label>
            ))}
          </div>
          <button disabled={value.colors.length >= 5} onClick={add}>
            {ar ? "إضافة لون — حتى خمسة" : "Add color — up to five"}
          </button>
          <label>
            {ar ? "زاوية التدرج" : "Gradient angle"}
            <input
              aria-label={`${label} angle`}
              type="range"
              min="-180"
              max="180"
              value={value.angle}
              onChange={(e) => change({ ...value, angle: +e.target.value })}
            />
          </label>
          {radial && (
            <label className="ps-check">
              <input
                type="checkbox"
                checked={!!value.radial}
                onChange={(e) => change({ ...value, radial: e.target.checked })}
              />
              {ar ? "تدرج دائري" : "Radial gradient"}
            </label>
          )}
        </>
      )}
    </div>
  );
}
