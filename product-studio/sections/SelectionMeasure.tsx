import type { Layer } from "../core/model";
import type { PrintArea } from "../core/advanced";
import {
  selectionSize,
  rotatedBounds,
  type DisplayUnit,
} from "../core/measurements";
export function SelectionMeasure({
  item,
  area,
  unit = "mm",
  box = { x: 0, y: 0, size: 1024 },
}: {
  item: Layer;
  area?: PrintArea;
  unit?: DisplayUnit;
  box?: { x: number; y: number; size: number };
}) {
  const label = selectionSize(item, area, unit),
    scale = box.size / 1024,
    font = box.size === 1024 ? 24 : 7.5,
    height = font * 1.8,
    width = label.length * font * 0.62 + font;
  const bounds = rotatedBounds(item),
    x = box.x + (item.x + item.w / 2) * scale,
    y = box.y + (bounds.y + bounds.h) * scale + font;
  return (
    <g
      className="ps-selection-measure"
      pointerEvents="none"
      data-unit={area ? unit : "px"}
    >
      <rect
        x={x - width / 2}
        y={y}
        width={width}
        height={height}
        rx={font * 0.35}
        fill="#618b75"
      />
      <text
        x={x}
        y={y + height * 0.7}
        textAnchor="middle"
        fill="white"
        fontSize={font}
        fontWeight="600"
        direction="ltr"
      >
        {label}
      </text>
    </g>
  );
}
