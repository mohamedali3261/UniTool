import { faces, offsetCut, type PrintSettings } from "./core/faces";
import { MM_TO_PX, type CartonSize } from "../packaging/geometry";
export function CanvasOverlays({
  size,
  settings,
  width,
  height,
  selected,
  ar,
}: {
  size: CartonSize;
  settings: PrintSettings;
  width: number;
  height: number;
  selected: number | null;
  ar: boolean;
}) {
  if (!settings.showGuides && selected === null) return null;
  const all = faces(size);
  return (
    <svg
      data-testid="print-guides-overlay"
      viewBox={`0 0 ${width} ${height}`}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 5,
      }}
      aria-hidden="true"
    >
      <g transform={`scale(${MM_TO_PX})`}>
        {settings.showGuides && (
          <>
            <path
              d={offsetCut(size, settings.bleedMm)}
              fill="none"
              stroke="#fb7185"
              strokeWidth=".35"
              strokeDasharray="2 1"
            />
            <path
              d={offsetCut(size, -settings.safeMm)}
              fill="none"
              stroke="#4ade80"
              strokeWidth=".3"
              strokeDasharray="1 1"
            />
          </>
        )}
        {all.map((face, i) => (
          <g key={face.id}>
            {(settings.showGuides || selected === i) && (
              <rect
                x={face.x}
                y={face.y}
                width={face.width}
                height={face.height}
                fill={selected === i ? "#38bdf822" : "none"}
                stroke="#38bdf8"
                strokeWidth=".3"
                strokeDasharray="2 1"
              />
            )}
            {settings.showGuides && (
              <>
                <rect
                  x={face.x + settings.safeMm}
                  y={face.y + settings.safeMm}
                  width={Math.max(0, face.width - 2 * settings.safeMm)}
                  height={Math.max(0, face.height - 2 * settings.safeMm)}
                  fill="none"
                  stroke="#4ade80"
                  strokeWidth=".2"
                />
                <text
                  x={face.x + face.width / 2}
                  y={face.y + 5}
                  textAnchor="middle"
                  fontSize="3.2"
                  fill="#0ea5e9"
                >
                  {ar ? face.ar : face.en}
                </text>
              </>
            )}
          </g>
        ))}
      </g>
    </svg>
  );
}
