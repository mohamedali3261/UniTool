import { useMemo, useRef, useState } from "react";
import { Download, BarChart3, TrendingUp } from "lucide-react";
import { useStudio } from "../../app/context";
import { address, colName } from "../../core/address";
import { download } from "../../core/io";
import type { Sheet, Result } from "../../core/types";
export function Chart({
  sheet,
  result,
  compact = false,
}: {
  sheet: Sheet;
  result: (ref: string) => Result;
  compact?: boolean;
}) {
  const { t, notice } = useStudio(),
    [column, setColumn] = useState(Math.min(sheet.cols - 1, 4)),
    [kind, setKind] = useState<"bar" | "line">("bar"),
    svg = useRef<SVGSVGElement>(null);
  const options = Array.from({ length: sheet.cols }, (_, c) => ({
    c,
    name: String(result(address(0, c)).value || colName(c)),
  }));
  const points = useMemo(
    () =>
      Array.from(
        { length: sheet.rows - (sheet.header ? 1 : 0) },
        (_, i) => i + (sheet.header ? 1 : 0),
      )
        .map((r) => ({
          name: String(result(address(r, 0)).value || r + 1),
          value: result(address(r, column)).value,
        }))
        .filter(
          (p) =>
            typeof p.value === "number" &&
            !/^(الإجمالي|اجمالي|total)$/i.test(p.name),
        )
        .slice(0, compact ? 5 : 16) as { name: string; value: number }[],
    [sheet, result, column, compact],
  );
  const max = Math.max(1, ...points.map((p) => Math.abs(p.value))),
    w = 600,
    h = 270,
    base = 200,
    pad = 40,
    gap = (w - 2 * pad) / Math.max(1, points.length);
  return (
    <section className={"xs-chart " + (compact ? "compact" : "")}>
      <header>
        <div>
          <span className="xs-section-label">
            {t("أرقامك بتحكي", "YOUR DATA AT A GLANCE")}
          </span>
          <h3>{t("نظرة سريعة", "Quick insights")}</h3>
        </div>
        <BarChart3 size={19} />
      </header>
      <div className="xs-chart-controls">
        <select
          aria-label={t("عمود الرسم", "Chart column")}
          value={column}
          onChange={(e) => setColumn(Number(e.target.value))}
        >
          {options.map((o) => (
            <option key={o.c} value={o.c}>
              {o.name}
            </option>
          ))}
        </select>
        <button
          className="xs-icon"
          aria-label={t("تبديل نوع الرسم", "Toggle chart type")}
          onClick={() => setKind(kind === "bar" ? "line" : "bar")}
        >
          <TrendingUp size={16} />
        </button>
        {!compact && (
          <button
            className="xs-icon"
            aria-label={t("تنزيل الرسم SVG", "Download chart SVG")}
            onClick={() => {
              if (svg.current)
                download(
                  new Blob([svg.current.outerHTML], { type: "image/svg+xml" }),
                  "chart.svg",
                );
            }}
          >
            <Download size={16} />
          </button>
        )}
      </div>
      {points.length ? (
        <svg
          ref={svg}
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label={t("رسم بياني للقيم الرقمية", "Chart of numeric values")}
          viewBox={`0 0 ${w} ${h}`}
        >
          <title>{sheet.name + " — " + options[column]?.name}</title>
          <rect width={w} height={h} fill="#ffffff" />
          {[0, 1, 2, 3].map((i) => (
            <line
              key={i}
              x1={pad}
              x2={w - pad}
              y1={base - i * 48}
              y2={base - i * 48}
              stroke="#e7eeea"
              strokeDasharray="4 4"
            />
          ))}
          {kind === "line" && (
            <polyline
              points={points
                .map(
                  (p, i) =>
                    `${pad + i * gap + gap / 2},${base - (Math.abs(p.value) / max) * 155}`,
                )
                .join(" ")}
              fill="none"
              stroke="#1c8d6b"
              strokeWidth="3"
            />
          )}
          {points.map((p, i) => (
            <g key={i}>
              <title>{p.name + ": " + p.value}</title>
              {kind === "bar" ? (
                <rect
                  x={pad + i * gap + gap * 0.2}
                  y={base - (Math.abs(p.value) / max) * 155}
                  width={gap * 0.6}
                  height={(Math.abs(p.value) / max) * 155}
                  rx="5"
                  fill={
                    p.value < 0
                      ? "#d56672"
                      : i === points.length - 1
                        ? "#b5d9cb"
                        : "#258368"
                  }
                />
              ) : (
                <circle
                  cx={pad + i * gap + gap / 2}
                  cy={base - (Math.abs(p.value) / max) * 155}
                  r="4"
                  fill="#258368"
                />
              )}
              <text
                x={pad + i * gap + gap / 2}
                y={base - (Math.abs(p.value) / max) * 155 - 8}
                textAnchor="middle"
                fontSize="12"
                fontFamily="Arial"
                fill="#50615c"
              >
                {Number(p.value.toFixed(1))}
              </text>
              <text
                x={pad + i * gap + gap / 2}
                y={base + 25}
                textAnchor="middle"
                fontSize="12"
                fontFamily="Arial"
                fill="#50615c"
              >
                {p.name.slice(0, compact ? 10 : 14)}
              </text>
            </g>
          ))}
        </svg>
      ) : (
        <div className="xs-chart-empty">
          {t(
            "اختار عمود فيه أرقام علشان يظهر الرسم.",
            "Choose a numeric column to see your chart.",
          )}
        </div>
      )}
      <p>
        {t(
          "أول عمود للتسميات. القيم السالبة بالأحمر وحجمها بالقيمة المطلقة.",
          "First column provides labels. Negative values are red, with absolute heights.",
        )}
      </p>
    </section>
  );
}
