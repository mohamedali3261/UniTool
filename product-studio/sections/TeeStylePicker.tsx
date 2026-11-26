import { flatTeeShape } from "../core/flatTee";
import { teePoint, teeStyles, type TeeStyle } from "../core/teeStyles";
const points = flatTeeShape().getPoints(22);
export function TeeStylePicker({
  value = "classic",
  color,
  ar,
  change,
}: {
  value?: TeeStyle;
  color: string;
  ar: boolean;
  change: (style: TeeStyle) => void;
}) {
  return (
    <div className="ps-tee-picker">
      <div className="ps-subhead">
        <h3>{ar ? "قصّات التيشيرت — 7 موديلات" : "T-shirt cuts — 7 styles"}</h3>
      </div>
      <div className="ps-tee-grid">
        {teeStyles.map((style) => {
          const path =
            points
              .map((p, i) => {
                const v = teePoint(p.x, p.y, 0.1, style.id);
                return `${i ? "L" : "M"}${v.x * 30 + 65} ${48 - v.y * 30}`;
              })
              .join(" ") + " Z";
          return (
            <button
              key={style.id}
              aria-pressed={value === style.id}
              aria-label={ar ? style.ar : style.en}
              title={ar ? style.detail : style.description}
              onClick={() => change(style.id)}
            >
              <svg viewBox="0 0 130 110" aria-hidden="true">
                <defs>
                  <linearGradient id={`tee-${style.id}`} x1="0" x2="1">
                    <stop stopColor="#000" stopOpacity=".3" />
                    <stop offset=".35" stopColor="#fff" stopOpacity=".15" />
                    <stop offset=".7" stopColor="#000" stopOpacity=".1" />
                    <stop offset="1" stopColor="#fff" stopOpacity=".1" />
                  </linearGradient>
                </defs>
                <path d={path} fill={color} />
                <path
                  d={path}
                  fill={`url(#tee-${style.id})`}
                  stroke="currentColor"
                  strokeOpacity=".25"
                  strokeWidth=".6"
                />
              </svg>
              <strong>{ar ? style.ar : style.en}</strong>
              <small>{ar ? style.detail : style.description}</small>
            </button>
          );
        })}
      </div>
      <p className="ps-tee-hint">
        {ar
          ? "المعاينة مجسّمة بخامة وثنيات وفتحات حقيقية عند الياقة والأكمام. يتم الاحتفاظ بالتصميم عند تبديل القصة؛ راجع مقاسات الطباعة لكل قطعة قبل الإنتاج."
          : "Volumetric cloth with folds and open neck and sleeve edges. Switching cuts preserves artwork; verify print measurements for each garment before production."}
      </p>
    </div>
  );
}
