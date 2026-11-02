import { ART_STYLES, type ArtworkOptions } from "./artwork";
import type { CartonSize } from "./geometry";
export function BoxPreview({
  size,
  artwork,
}: {
  size: CartonSize;
  artwork?: ArtworkOptions;
}) {
  const theme =
    artwork && artwork.style !== "blank" ? ART_STYLES[artwork.style] : null;
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
        fill={theme?.background || "#eef1f8"}
        stroke="#8e96ad"
      />
      <path
        d={`M${x + w} ${y}l${dx} ${-dy}v${h}l${-dx} ${dy}Z`}
        fill={theme?.background || "#cbd2e4"}
        stroke="#8e96ad"
      />
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        fill={theme?.background || "#fff"}
        stroke="#8e96ad"
      />
      {theme && artwork && (
        <g>
          <rect
            x={x + 4}
            y={y + 4}
            width={w - 8}
            height={h - 8}
            fill="none"
            stroke={artwork.accent}
            strokeWidth=".7"
          />
          <text
            x={x + w / 2}
            y={y + h * 0.31}
            textAnchor="middle"
            fill={artwork.accent}
            fontSize={Math.min(w * 0.14, 16)}
          >
            ✧
          </text>
          <text
            x={x + w / 2}
            y={y + h * 0.46}
            textAnchor="middle"
            fill={theme.ink}
            fontFamily="Arial"
            fontSize={Math.min(
              w * 0.11,
              ((w * 0.8) / Math.max(artwork.brand.length, 6)) * 1.5,
            )}
          >
            {artwork.brand}
          </text>
          <text
            x={x + w / 2}
            y={y + h * 0.58}
            textAnchor="middle"
            fill={artwork.accent}
            fontFamily="Georgia"
            fontSize={Math.min(
              w * 0.08,
              ((w * 0.8) / Math.max(artwork.product.length, 8)) * 1.5,
            )}
          >
            {artwork.product}
          </text>
          <text
            x={x + w / 2}
            y={y + h * 0.85}
            textAnchor="middle"
            fill={artwork.accent}
            fontSize={w * 0.07}
          >
            {artwork.ml} ml
          </text>
        </g>
      )}
      <text
        x={x + w / 2}
        y={y + h + 27}
        textAnchor="middle"
        fill="#475569"
        fontSize="11"
      >
        {size.height} × {size.width} × {size.depth} mm
      </text>
    </svg>
  );
}
