import { series, type BIRow } from "../../core/analytics";
import type { BIWidget } from "../../core/analyticsTypes";
const palette = [
  "#29836c",
  "#74b49b",
  "#b1ccb5",
  "#ddb564",
  "#748db3",
  "#b17a9b",
  "#73aeb5",
  "#9caa6c",
];
/** SVG فعلي من بيانات الشيت، بمحور يدعم السالب وبجدول بديل قابل للقراءة. */
export function VisualChart({
  rows,
  widget,
  onSelect,
}: {
  rows: BIRow[];
  widget: BIWidget;
  onSelect: (label: string) => void;
}) {
  const points = series(rows, widget),
    w = 640,
    h = 290,
    left = 52,
    right = 20,
    bottom = 54,
    top = 28,
    plotH = h - top - bottom,
    plotW = w - left - right,
    min = Math.min(0, ...points.map((p) => p.value)),
    max = Math.max(1, ...points.map((p) => p.value)),
    y = (n: number) => top + ((max - n) / (max - min)) * plotH,
    baseline = y(0),
    step = plotW / Math.max(1, points.length),
    fmt = (n: number) =>
      new Intl.NumberFormat("en", {
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(n);
  if (!points.length)
    return (
      <div className="bi-chart-empty">
        ∅<p>لا توجد قيم رقمية مطابقة / No matching numeric values</p>
      </div>
    );
  if (widget.type === "donut") {
    const usable = points.filter((p) => p.value > 0),
      sum = usable.reduce((a, p) => a + p.value, 0);
    let offset = 0;
    return (
      <div className="bi-donut-wrap">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 260 230"
          role="img"
          aria-label={widget.title}
        >
          <title>{widget.title}</title>
          <circle
            cx="130"
            cy="110"
            r="76"
            fill="none"
            stroke="#f0f3ee"
            strokeWidth="29"
          />
          {usable.map((p, i) => {
            const length = (p.value / sum) * 477.52,
              start = offset;
            offset += length;
            return (
              <circle
                key={p.label}
                cx="130"
                cy="110"
                r="76"
                fill="none"
                stroke={palette[i % palette.length]}
                strokeWidth="29"
                strokeDasharray={`${length} ${477.52 - length}`}
                strokeDashoffset={-start}
                transform="rotate(-90 130 110)"
                tabIndex={0}
                role="button"
                aria-label={`${p.label}: ${p.value}`}
                onClick={() => onSelect(p.label)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(p.label);
                  }
                }}
              >
                <title>{p.label + ": " + p.value}</title>
              </circle>
            );
          })}
          <text
            x="130"
            y="110"
            textAnchor="middle"
            fontSize="27"
            fontFamily="Arial"
            fontWeight="bold"
            fill="#234b3c"
          >
            {fmt(sum)}
          </text>
          <text
            x="130"
            y="131"
            textAnchor="middle"
            fontSize="10"
            fill="#809584"
          >
            POSITIVE TOTAL
          </text>
        </svg>
        <div className="bi-legend">
          {usable.map((p, i) => (
            <button key={p.label} onClick={() => onSelect(p.label)}>
              <i style={{ background: palette[i % palette.length] }} />
              <span>{p.label}</span>
              <b>{((p.value / sum) * 100).toFixed(1)}%</b>
            </button>
          ))}
          {points.some((p) => p.value <= 0) && (
            <small>
              السالب والصفر لا يظهران في الدائري / Non-positive values omitted
            </small>
          )}
        </div>
      </div>
    );
  }
  if (widget.type === "scatter") {
    const scatter = rows
      .map((r) => ({
        x: r.values[widget.metric],
        y: r.values[widget.secondary || widget.metric],
        label: String(r.values[widget.dimension] ?? r.row),
      }))
      .filter(
        (p): p is { x: number; y: number; label: string } =>
          typeof p.x === "number" && typeof p.y === "number",
      )
      .slice(0, 300);
    if (!scatter.length)
      return (
        <div className="bi-chart-empty">
          No numeric pairs / لا توجد أزواج رقمية
        </div>
      );
    const lowX = Math.min(0, ...scatter.map((p) => p.x)),
      highX = Math.max(1, ...scatter.map((p) => p.x)),
      lowY = Math.min(0, ...scatter.map((p) => p.y)),
      highY = Math.max(1, ...scatter.map((p) => p.y));
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={widget.title}
        viewBox={`0 0 ${w} ${h}`}
      >
        <title>{widget.title}</title>
        <path
          d={`M${left} ${top}V${h - bottom}H${w - right}`}
          fill="none"
          stroke="#cbd9cd"
        />
        {scatter.map((p, i) => (
          <circle
            key={i}
            cx={left + ((p.x - lowX) / (highX - lowX)) * plotW}
            cy={top + ((highY - p.y) / (highY - lowY)) * plotH}
            r="5"
            fill={widget.color}
            opacity=".7"
            role="button"
            tabIndex={0}
            aria-label={`${p.label}: ${p.x}, ${p.y}`}
            onClick={() => onSelect(p.label)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSelect(p.label);
            }}
          >
            <title>{`${p.label}: ${p.x}, ${p.y}`}</title>
          </circle>
        ))}
        <text x={left} y={h - 20} fontSize="11" fill="#718473">
          {fmt(lowX)}
        </text>
        <text
          x={w - right}
          y={h - 20}
          textAnchor="end"
          fontSize="11"
          fill="#718473"
        >
          {fmt(highX)}
        </text>
        <text x="5" y={top + 10} fontSize="11" fill="#718473">
          {fmt(highY)}
        </text>
        <text x="5" y={h - bottom} fontSize="11" fill="#718473">
          {fmt(lowY)}
        </text>
      </svg>
    );
  }
  const path = points
    .map(
      (p, i) => `${i ? "L" : "M"}${left + step * i + step / 2} ${y(p.value)}`,
    )
    .join(" ");
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={widget.title}
      viewBox={`0 0 ${w} ${h}`}
    >
      <title>{widget.title}</title>
      {Array.from({ length: 5 }, (_, i) => max - ((max - min) * i) / 4).map(
        (v, i) => (
          <g key={i}>
            <line
              x1={left}
              x2={w - right}
              y1={y(v)}
              y2={y(v)}
              stroke="#e5ece3"
              strokeDasharray="3 4"
            />
            <text
              x={left - 8}
              y={y(v) + 3}
              textAnchor="end"
              fontSize="10"
              fill="#81967e"
              fontFamily="Arial"
            >
              {fmt(v)}
            </text>
          </g>
        ),
      )}
      <line
        x1={left}
        x2={w - right}
        y1={baseline}
        y2={baseline}
        stroke="#b6c9b6"
      />
      {widget.type === "area" && (
        <path
          d={`${path} L${left + step * (points.length - 1) + step / 2} ${baseline} L${left + step / 2} ${baseline} Z`}
          fill={widget.color}
          opacity=".14"
        />
      )}
      {["line", "area"].includes(widget.type) && (
        <path
          d={path}
          stroke={widget.color}
          strokeWidth="3"
          fill="none"
          strokeLinejoin="round"
        />
      )}
      {points.map((p, i) => (
        <g
          key={p.label}
          role="button"
          tabIndex={0}
          aria-label={`${p.label}: ${p.value}`}
          onClick={() => onSelect(p.label)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelect(p.label);
            }
          }}
          className="bi-chart-point"
        >
          <title>{`${p.label}: ${p.value}`}</title>
          {widget.type === "bar" ? (
            <rect
              x={left + step * i + step * 0.18}
              y={Math.min(y(p.value), baseline)}
              width={step * 0.64}
              height={Math.max(1, Math.abs(y(p.value) - baseline))}
              fill={p.value < 0 ? "#c56573" : widget.color}
              rx="4"
            />
          ) : (
            <circle
              cx={left + step * i + step / 2}
              cy={y(p.value)}
              r="4"
              fill={widget.color}
            />
          )}
          <text
            x={left + step * i + step / 2}
            y={p.value >= 0 ? y(p.value) - 7 : y(p.value) + 14}
            textAnchor="middle"
            fontSize="10"
            fontFamily="Arial"
            fill="#60795e"
          >
            {fmt(p.value)}
          </text>
          <text
            x={left + step * i + step / 2}
            y={h - bottom + 20}
            textAnchor="middle"
            fontSize="10"
            fontFamily="Arial"
            fill="#738b6e"
          >
            {p.label.slice(0, 14)}
          </text>
        </g>
      ))}
    </svg>
  );
}
