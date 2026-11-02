import { renderToStaticMarkup } from "react-dom/server";
import { symbolMap } from "./catalog";
import type { Element, Project } from "./types";
/** نفس مُرسِم SVG للوحة والمعاينة والتصدير، علشان النتيجة تفضل متطابقة. */
export function ElementGraphic({
  n,
  prefix = "canvas",
  mono = false,
}: {
  n: Element;
  prefix?: string;
  mono?: boolean;
}) {
  const id = `${prefix}-${n.id}`,
    fill = mono ? "#111111" : n.gradient ? `url(#${id}-gradient)` : n.fill;
  let shape: React.ReactNode;
  if (n.kind === "text") {
    const rtl = /[\u0600-\u06ff]/.test(n.text);
    const lines = n.text.split("\n"),
      x =
        (n.align === "start" ? -n.w / 2 : n.align === "end" ? n.w / 2 : 0) *
        (rtl ? -1 : 1);
    shape = (
      <g
        fill={fill}
        stroke={n.strokeWidth ? n.stroke : "none"}
        strokeWidth={n.strokeWidth}
        paintOrder="stroke"
        fontFamily={`${n.font}, cairo`}
        fontSize={n.fontSize}
        fontWeight={n.weight}
        letterSpacing={n.spacing}
        textAnchor={n.align}
        direction={/[\u0600-\u06ff]/.test(n.text) ? "rtl" : "ltr"}
      >
        {n.curve ? (
          <text>
            <textPath
              href={`#${id}-curve`}
              startOffset="50%"
              textAnchor="middle"
            >
              {n.text.replace(/\n/g, " ")}
            </textPath>
          </text>
        ) : (
          lines.map((line, i) => (
            <text
              key={i}
              x={x}
              y={(i - (lines.length - 1) / 2) * n.fontSize * n.lineHeight}
              dominantBaseline="central"
            >
              {line || " "}
            </text>
          ))
        )}
      </g>
    );
  } else if (n.kind === "icon") {
    const Icon = symbolMap.get(n.asset)?.icon;
    shape = Icon ? (
      <Icon
        x={-n.w / 2}
        y={-n.h / 2}
        width={n.w}
        height={n.h}
        color={fill}
        strokeWidth={Math.max(0.5, n.strokeWidth || 1.8)}
        absoluteStrokeWidth={false}
      />
    ) : null;
  } else if (n.kind === "image")
    shape = (
      <image
        x={-n.w / 2}
        y={-n.h / 2}
        width={n.w}
        height={n.h}
        href={n.asset}
        preserveAspectRatio="xMidYMid meet"
        style={mono ? { filter: "grayscale(1)" } : undefined}
      />
    );
  else if (n.kind === "vector")
    shape = (
      <svg
        x={-n.w / 2}
        y={-n.h / 2}
        width={n.w}
        height={n.h}
        viewBox="0 0 128 128"
        preserveAspectRatio="none"
      >
        {n.paths?.map((p, i) => (
          <path
            key={i}
            d={p.d}
            fill={mono ? "#111111" : n.recolor ? fill : p.fill}
            stroke={n.strokeWidth ? n.stroke : "none"}
            strokeWidth={n.strokeWidth}
          />
        ))}
      </svg>
    );
  else {
    const common = {
      fill,
      stroke: n.strokeWidth ? n.stroke : "none",
      strokeWidth: n.strokeWidth,
    };
    const polygon = (points: string) => <polygon points={points} {...common} />;
    const points = (count: number, inner = 1) =>
      Array.from({ length: inner === 1 ? count : count * 2 }, (_, i) => {
        const angle =
            -Math.PI / 2 +
            (i * Math.PI * 2) / (inner === 1 ? count : count * 2),
          radius = inner === 1 || i % 2 === 0 ? 1 : inner;
        return `${((Math.cos(angle) * n.w) / 2) * radius},${((Math.sin(angle) * n.h) / 2) * radius}`;
      }).join(" ");
    switch (n.asset) {
      case "circle":
        shape = <ellipse rx={n.w / 2} ry={n.h / 2} {...common} />;
        break;
      case "square":
        shape = (
          <rect
            x={-n.w / 2}
            y={-n.h / 2}
            width={n.w}
            height={n.h}
            rx={Math.min(n.radius, n.w / 2, n.h / 2)}
            {...common}
          />
        );
        break;
      case "ring":
        shape = (
          <ellipse
            rx={n.w / 2 - 3}
            ry={n.h / 2 - 3}
            fill="none"
            stroke={fill}
            strokeWidth={n.strokeWidth || 4}
          />
        );
        break;
      case "triangle":
        shape = polygon(points(3));
        break;
      case "diamond":
        shape = polygon(points(4));
        break;
      case "hexagon":
        shape = polygon(points(6));
        break;
      case "star":
        shape = polygon(points(5, 0.43));
        break;
      case "burst":
        shape = polygon(points(16, 0.85));
        break;
      default: {
        const paths: Record<string, string> = {
          shield: "M10 10L50 0L90 10V48Q90 78 50 100Q10 78 10 48Z",
          arch: "M0 100V50A50 50 0 0 1 100 50V100Z",
          wave: "M0 35Q25 0 50 35T100 35V70Q75 100 50 70T0 70Z",
          ribbon: "M0 0H100L85 50L100 100H0L15 50Z",
        };
        shape = (
          <svg
            x={-n.w / 2}
            y={-n.h / 2}
            width={n.w}
            height={n.h}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <path d={paths[n.asset] || paths.arch} {...common} />
          </svg>
        );
      }
    }
  }
  return (
    <g
      transform={`translate(${n.x} ${n.y}) rotate(${n.rotation}) scale(${n.flipX ? -1 : 1} ${n.flipY ? -1 : 1})`}
      opacity={n.opacity}
      filter={n.shadow || n.blur ? `url(#${id}-fx)` : undefined}
    >
      <defs>
        <linearGradient id={`${id}-gradient`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor={n.fill} />
          <stop offset="1" stopColor={n.fill2} />
        </linearGradient>
        <linearGradient id={`${id}-reflect`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="white" stopOpacity=".28" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <mask
          id={`${id}-mask`}
          maskUnits="userSpaceOnUse"
          x={-n.w}
          y={n.h / 2}
          width={n.w * 2}
          height={n.h + 10}
        >
          <rect
            x={-n.w}
            y={n.h / 2}
            width={n.w * 2}
            height={n.h + 10}
            fill={`url(#${id}-reflect)`}
          />
        </mask>
        <path
          id={`${id}-curve`}
          d={`M${-n.w / 2},0 Q0,${-n.curve * 2} ${n.w / 2},0`}
        />
        <filter id={`${id}-fx`} x="-100%" y="-100%" width="300%" height="300%">
          {n.blur > 0 && <feGaussianBlur stdDeviation={n.blur} />}
          <feDropShadow
            dx="0"
            dy={n.shadow * 0.3}
            stdDeviation={n.shadow * 0.3}
            floodColor="#000000"
            floodOpacity={n.shadow ? 0.28 : 0}
          />
        </filter>
      </defs>
      {shape}
      {n.reflection && (
        <g mask={`url(#${id}-mask)`}>
          <g transform={`translate(0 ${n.h + 8}) scale(1 -1)`}>{shape}</g>
        </g>
      )}
    </g>
  );
}
export function ProjectGraphic({
  project,
  prefix = "preview",
  mono = false,
}: {
  project: Project;
  prefix?: string;
  mono?: boolean;
}) {
  return (
    <>
      {project.background && (
        <rect
          width={project.width}
          height={project.height}
          fill={mono ? "#ffffff" : project.background}
        />
      )}{" "}
      {project.nodes
        .filter((n) => !n.hidden)
        .map((n) => (
          <ElementGraphic key={n.id} n={n} prefix={prefix} mono={mono} />
        ))}
    </>
  );
}
export function svgString(project: Project, css = "", mono = false) {
  return (
    '<?xml version="1.0" encoding="UTF-8"?>' +
    renderToStaticMarkup(
      <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        width={project.width}
        height={project.height}
        viewBox={`0 0 ${project.width} ${project.height}`}
      >
        <style>{css}</style>
        <ProjectGraphic project={project} prefix="export" mono={mono} />
      </svg>,
    )
  );
}
