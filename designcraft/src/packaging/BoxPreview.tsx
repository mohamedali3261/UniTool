import type { CartonSize } from "./geometry";
export function BoxPreview({ size }: { size: CartonSize }) {
  const s = Math.min(145 / size.width, 155 / size.height, 60 / size.depth),
    w = size.width * s,
    h = size.height * s,
    dx = size.depth * s * 0.65,
    dy = size.depth * s * 0.4,
    x = (300 - w - dx) / 2,
    y = (220 - h + dy) / 2;
  return (
    <svg
      viewBox="0 0 300 250"
      direction="ltr"
      role="img"
      aria-label="Box proportions / تصور أبعاد العلبة"
    >
      <ellipse
        cx="155"
        cy={y + h + 8}
        rx={w * 0.7 + dx}
        ry="10"
        fill="#0000000d"
      />
      <path
        d={`M${x} ${y}l${dx} ${-dy}h${w}l${-dx} ${dy}Z`}
        fill="#eef1f8"
        stroke="#8e96ad"
      />
      <path
        d={`M${x + w} ${y}l${dx} ${-dy}v${h}l${-dx} ${dy}Z`}
        fill="#cbd2e4"
        stroke="#8e96ad"
      />
      <rect x={x} y={y} width={w} height={h} fill="#fff" stroke="#8e96ad" />
      <text
        x={x + w / 2}
        y={y + h + 27}
        textAnchor="middle"
        fill="#475569"
        fontSize="11"
      >
        {size.width} × {size.height} × {size.depth} mm
      </text>
    </svg>
  );
}
