import { useRef } from "react";
import type { Layer } from "../core/model";
import { resizeCorner } from "../core/transforms";
export function TransformHandles({
  item,
  change,
  scale = 1,
  offsetX = 0,
  offsetY = 0,
  ar,
}: {
  item: Layer;
  change: (p: Partial<Layer>) => void;
  scale?: number;
  offsetX?: number;
  offsetY?: number;
  ar: boolean;
}) {
  const drag = useRef<{
    item: Layer;
    x: number;
    y: number;
    sx: number;
    sy: number;
    rotate: boolean;
  } | null>(null);
  const point = (e: React.PointerEvent<SVGElement>) =>
    new DOMPoint(e.clientX, e.clientY).matrixTransform(
      e.currentTarget.ownerSVGElement!.getScreenCTM()!.inverse(),
    );
  const cx = offsetX + (item.x + item.w / 2) * scale,
    cy = offsetY + (item.y + item.h / 2) * scale,
    size = scale === 1 ? 24 : 8;
  const events = (sx: number, sy: number, rotate = false) => ({
    onClick: (e: React.MouseEvent) => e.stopPropagation(),
    onPointerDown: (e: React.PointerEvent<SVGElement>) => {
      e.stopPropagation();
      const p = point(e);
      drag.current = { item: { ...item }, x: p.x, y: p.y, sx, sy, rotate };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    onPointerMove: (e: React.PointerEvent<SVGElement>) => {
      if (!drag.current) return;
      e.stopPropagation();
      const d = drag.current,
        p = point(e);
      if (d.rotate) {
        const rotation = (Math.atan2(p.y - cy, p.x - cx) * 180) / Math.PI + 90;
        change({
          rotation:
            ((Math.round(e.shiftKey ? rotation / 15 : rotation) *
              (e.shiftKey ? 15 : 1) +
              540) %
              360) -
            180,
        });
      } else
        change(
          resizeCorner(
            d.item,
            (p.x - d.x) / scale,
            (p.y - d.y) / scale,
            d.sx,
            d.sy,
          ),
        );
    },
    onPointerUp: (e: React.PointerEvent) => {
      e.stopPropagation();
      drag.current = null;
    },
    onPointerCancel: () => {
      drag.current = null;
    },
  });
  return (
    <g transform={`rotate(${item.rotation} ${cx} ${cy})`}>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sy) => (
          <rect
            key={`${sx}${sy}`}
            aria-label={ar ? `تغيير الحجم ${sx} ${sy}` : `Resize ${sx} ${sy}`}
            x={cx + (sx * item.w * scale) / 2 - size / 2}
            y={cy + (sy * item.h * scale) / 2 - size / 2}
            width={size}
            height={size}
            fill="white"
            stroke="#236d53"
            strokeWidth={size / 8}
            style={{ cursor: "nwse-resize", touchAction: "none" }}
            {...events(sx, sy)}
          />
        )),
      )}
      <line
        x1={cx}
        x2={cx}
        y1={cy - (item.h * scale) / 2}
        y2={cy - (item.h * scale) / 2 - size * 3}
        stroke="#236d53"
        strokeWidth={size / 8}
      />
      <circle
        aria-label={ar ? "مقبض الدوران" : "Rotate handle"}
        cx={cx}
        cy={cy - (item.h * scale) / 2 - size * 3}
        r={size * 0.65}
        fill="#236d53"
        stroke="white"
        strokeWidth={size / 8}
        style={{ cursor: "grab", touchAction: "none" }}
        {...events(0, 0, true)}
      />
    </g>
  );
}
