import { gradientPositions } from "../core/materials";
import { SelectionMeasure } from "./SelectionMeasure";
import { fromCm } from "../core/measurements";
import { PatternArtwork } from "./PatternArtwork";
import { TransformHandles } from "./TransformHandles";
import { snapPosition } from "../core/advanced";
import { Fragment, useId, useRef, useState } from "react";
import { Scissors, MoveUpRight } from "lucide-react";
import {
  printParts,
  partNames,
  type Project,
  type Side,
  type Layer,
} from "../core/model";
export function PatternDesk({
  project,
  side,
  setSide,
  selected,
  select,
  change,
  edit,
  ar,
  patch,
}: {
  patch: (p: Partial<Project>) => void;
  project: Project;
  side: Side;
  setSide: (s: Side) => void;
  selected: string | null;
  select: (s: string | null) => void;
  change: (side: Side, id: string, p: Partial<Layer>) => void;
  edit: () => void;
  ar: boolean;
}) {
  const [pan, setPan] = useState(false),
    [grid, setGrid] = useState(true);
  const scroller = useRef<HTMLDivElement>(null),
    panDrag = useRef<{
      x: number;
      y: number;
      left: number;
      top: number;
    } | null>(null);
  const [guides, setGuides] = useState<{
    part?: Side;
    gx?: number;
    gy?: number;
  }>({});
  const [zoom, setZoom] = useState(100);
  const uid = useId().replaceAll(":", "");
  const drag = useRef<{
    side: Side;
    id: string;
    resize?: boolean;
    w?: number;
    h?: number;
    startX: number;
    startY: number;
    x: number;
    y: number;
    scale: number;
    svg: SVGSVGElement;
  } | null>(null);
  const parts =
    project.product === "tote"
      ? printParts.slice(0, 2)
      : project.product === "hoodie"
        ? printParts
        : printParts.slice(0, 4);
  const body = "M38 35 L77 22 Q120 72 163 22 L202 35 L191 283 L49 283 Z";
  const sleeve = "M22 70 Q66 65 120 20 Q174 65 218 70 L175 280 L65 280 Z";
  const hood = "M30 280 L30 135 Q28 25 160 20 Q205 100 208 280 Z";
  return (
    <section className="ps-pattern-desk">
      <header>
        <div>
          <Scissors size={17} />
          <h2>{ar ? "خريطة أجزاء القطعة" : "Garment layout"}</h2>
          <span>2D / UV</span>
        </div>
        <button onClick={edit}>
          {ar ? "فتح المحرر" : "Open editor"}
          <MoveUpRight size={13} />
        </button>
      </header>
      <p>
        {ar
          ? "حدد الجزء، ثم اسحب التصميم عليه. الخريطة لتوزيع الرسومات وليست باترون قصّ بمقاسات تصنيع."
          : "Select a piece, then drag its artwork. This is a print layout, not a production cutting pattern."}
      </p>
      <div
        className="ps-pattern-scroll"
        ref={scroller}
        style={{
          backgroundImage: grid ? undefined : "none",
          cursor: pan ? "grab" : undefined,
          touchAction: pan ? "none" : undefined,
        }}
        onPointerDownCapture={(e) => {
          if (!pan) return;
          e.stopPropagation();
          e.preventDefault();
          const el = scroller.current!;
          panDrag.current = {
            x: e.clientX,
            y: e.clientY,
            left: el.scrollLeft,
            top: el.scrollTop,
          };
          el.setPointerCapture(e.pointerId);
        }}
        onPointerMoveCapture={(e) => {
          const d = panDrag.current;
          if (!d) return;
          e.stopPropagation();
          scroller.current!.scrollLeft = d.left - (e.clientX - d.x);
          scroller.current!.scrollTop = d.top - (e.clientY - d.y);
        }}
        onPointerUpCapture={() => {
          panDrag.current = null;
        }}
        onPointerCancelCapture={() => {
          panDrag.current = null;
        }}
      >
        <div className="ps-pattern-grid" style={{ width: `${zoom}%` }}>
          {parts.map((part, index) => {
            const isBody = part === "front" || part === "back",
              isSleeve = part.includes("Sleeve"),
              path = isBody
                ? part === "back"
                  ? body.replace("Q120 72", "Q120 42")
                  : body
                : isSleeve
                  ? project.product === "tee"
                    ? "M22 90 Q66 80 120 25 Q174 80 218 90 L210 165 L30 165 Z"
                    : sleeve
                  : hood;
            const box = isBody
              ? { x: 55, y: 84, size: 130 }
              : isSleeve
                ? { x: 22, y: 20, size: 196 }
                : { x: 30, y: 20, size: 190 };
            const active = side === part,
              clip = `${uid}-${part}`;
            return (
              <div
                key={part}
                className={`ps-pattern-card ${isSleeve ? "is-sleeve" : ""} ${active ? "active" : ""}`}
                role="button"
                tabIndex={0}
                aria-label={`${ar ? "تصميم" : "Design"} ${partNames[part][ar ? "ar" : "en"]}`}
                aria-pressed={active}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSide(part);
                    select(project.sides[part][0]?.id ?? null);
                  }
                }}
                onClick={() => {
                  setSide(part);
                  select(project.sides[part][0]?.id ?? null);
                }}
              >
                <div className="ps-pattern-caption">
                  <b>{partNames[part][ar ? "ar" : "en"]}</b>
                  <small>
                    {String(index + 1).padStart(2, "0")} / PRINT PANEL
                  </small>
                </div>
                <svg
                  viewBox={
                    isSleeve && project.product === "tee"
                      ? "0 0 240 190"
                      : "0 0 240 310"
                  }
                  aria-label={partNames[part][ar ? "ar" : "en"]}
                  onPointerMove={(e) => {
                    const d = drag.current;
                    if (!d) return;
                    const p = new DOMPoint(
                      e.clientX,
                      e.clientY,
                    ).matrixTransform(d.svg.getScreenCTM()!.inverse());
                    if (d.resize) {
                      const angle =
                        ((project.sides[d.side].find((l) => l.id === d.id)
                          ?.rotation ?? 0) *
                          Math.PI) /
                        180;
                      const dx = (p.x - d.startX) / d.scale,
                        dy = (p.y - d.startY) / d.scale;
                      const factor = Math.max(
                        20 / Math.min(d.w!, d.h!),
                        Math.min(
                          2048 / Math.max(d.w!, d.h!),
                          1 +
                            (dx * Math.cos(angle) + dy * Math.sin(angle)) /
                              d.w!,
                        ),
                      );
                      change(d.side, d.id, {
                        w: Math.round(d.w! * factor),
                        h: Math.round(d.h! * factor),
                      });
                    } else {
                      const snap = snapPosition(
                        project.sides[d.side].find((l) => l.id === d.id)!,
                        d.x + (p.x - d.startX) / d.scale,
                        d.y + (p.y - d.startY) / d.scale,
                        project.sides[d.side],
                      );
                      setGuides({ ...snap, part: d.side });
                      change(d.side, d.id, { x: snap.x, y: snap.y });
                    }
                  }}
                  onPointerUp={(e) => {
                    if (drag.current) {
                      e.stopPropagation();
                      drag.current = null;
                      setGuides({});
                    }
                  }}
                  onPointerCancel={() => {
                    drag.current = null;
                    setGuides({});
                  }}
                >
                  <defs>
                    {project.appearance.gradient && (
                      <linearGradient
                        id={`${clip}-fabric`}
                        x1={`${50 - Math.cos((project.appearance.gradient.angle * Math.PI) / 180) * 50}%`}
                        y1={`${50 + Math.sin((project.appearance.gradient.angle * Math.PI) / 180) * 50}%`}
                        x2={`${50 + Math.cos((project.appearance.gradient.angle * Math.PI) / 180) * 50}%`}
                        y2={`${50 - Math.sin((project.appearance.gradient.angle * Math.PI) / 180) * 50}%`}
                      >
                        {project.appearance.gradient.colors.map(
                          (c, i, colors) => (
                            <stop
                              key={i}
                              offset={`${gradientPositions(project.appearance.gradient!)[i] * 100}%`}
                              stopColor={c}
                            />
                          ),
                        )}
                      </linearGradient>
                    )}

                    <clipPath id={clip}>
                      <path d={path} />
                    </clipPath>
                  </defs>
                  <path
                    d={path}
                    fill={
                      project.appearance.gradient
                        ? `url(#${clip}-fabric)`
                        : project.color
                    }
                    stroke={active ? "#a8bb94" : "#818675"}
                    strokeWidth="1"
                  />
                  <path
                    d="M120 30 V290"
                    stroke="#5c655850"
                    strokeDasharray="3 3"
                    strokeWidth=".7"
                  />
                  <g clipPath={`url(#${clip})`}>
                    {project.sides[part]
                      .filter((l) => l.visible)
                      .map((l) => (
                        <Fragment key={l.id}>
                          <PatternArtwork item={l} box={box} />
                          <rect
                            data-layer-id={l.id}
                            x={box.x + (l.x / 1024) * box.size}
                            y={box.y + (l.y / 1024) * box.size}
                            width={(l.w / 1024) * box.size}
                            height={(l.h / 1024) * box.size}
                            transform={`rotate(${l.rotation} ${box.x + ((l.x + l.w / 2) / 1024) * box.size} ${box.y + ((l.y + l.h / 2) / 1024) * box.size})`}
                            fill="transparent"
                            stroke={
                              selected === l.id ? "#80ad86" : "transparent"
                            }
                            strokeWidth="1.3"
                            strokeDasharray="3 2"
                            style={{
                              cursor: l.locked ? "not-allowed" : "move",
                              touchAction: "none",
                            }}
                            onDoubleClick={() => {
                              if (l.kind === "text" && !l.locked)
                                requestAnimationFrame(() =>
                                  document
                                    .querySelector<HTMLTextAreaElement>(
                                      ".ps-inspector textarea",
                                    )
                                    ?.focus(),
                                );
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSide(part);
                              select(l.id);
                            }}
                            onPointerDown={(e) => {
                              e.stopPropagation();
                              setSide(part);
                              select(l.id);
                              if (l.locked) return;
                              const svg = e.currentTarget.ownerSVGElement!,
                                p = new DOMPoint(
                                  e.clientX,
                                  e.clientY,
                                ).matrixTransform(
                                  svg.getScreenCTM()!.inverse(),
                                );
                              drag.current = {
                                side: part,
                                id: l.id,
                                startX: p.x,
                                startY: p.y,
                                x: l.x,
                                y: l.y,
                                scale: box.size / 1024,
                                svg,
                              };
                              e.currentTarget.setPointerCapture(e.pointerId);
                            }}
                          />
                          {active && selected === l.id && !l.locked && (
                            <TransformHandles
                              item={l}
                              change={(p) => change(part, l.id, p)}
                              scale={box.size / 1024}
                              offsetX={box.x}
                              offsetY={box.y}
                              ar={ar}
                            />
                          )}
                        </Fragment>
                      ))}
                  </g>
                  {active &&
                    project.sides[part]
                      .filter((l) => l.id === selected && l.visible)
                      .map((l) => (
                        <SelectionMeasure
                          key={l.id}
                          item={l}
                          area={project.printAreas?.[part]}
                          unit={project.displayUnit}
                          box={box}
                        />
                      ))}
                  {project.printAreas?.[part] && (
                    <g
                      className="ps-measure-ruler"
                      fill="#c4d3bb"
                      fontSize="6"
                      pointerEvents="none"
                    >
                      {Array.from({ length: 5 }, (_, i) => {
                        const area = project.printAreas![part]!,
                          unit = project.displayUnit ?? "mm";
                        return (
                          <g key={i}>
                            <line
                              x1={box.x + (i / 4) * box.size}
                              x2={box.x + (i / 4) * box.size}
                              y1={box.y - 8}
                              y2={box.y - 4}
                              stroke="#94a592"
                            />
                            <text
                              x={box.x + (i / 4) * box.size}
                              y={box.y - 11}
                              textAnchor="middle"
                            >
                              {+fromCm((area.width * i) / 4, unit).toFixed(1)}
                            </text>
                          </g>
                        );
                      })}
                      <text x={box.x + box.size + 7} y={box.y - 11}>
                        {project.displayUnit ?? "mm"}
                      </text>
                    </g>
                  )}
                  {guides.part === part && guides.gx !== undefined && (
                    <line
                      x1={box.x + (guides.gx / 1024) * box.size}
                      x2={box.x + (guides.gx / 1024) * box.size}
                      y1="20"
                      y2="285"
                      stroke="#ef9f64"
                      strokeWidth="1"
                      pointerEvents="none"
                    />
                  )}
                  {guides.part === part && guides.gy !== undefined && (
                    <line
                      y1={box.y + (guides.gy / 1024) * box.size}
                      y2={box.y + (guides.gy / 1024) * box.size}
                      x1="25"
                      x2="215"
                      stroke="#ef9f64"
                      strokeWidth="1"
                      pointerEvents="none"
                    />
                  )}
                </svg>
                <span className="ps-pattern-count">
                  {project.sides[part].length} {ar ? "طبقة" : "layers"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="ps-pattern-controls">
        <button
          aria-pressed={pan}
          onClick={() => setPan(!pan)}
          aria-label={ar ? "أداة تحريك الخريطة" : "Pan layout"}
        >
          ✥
        </button>
        <button
          aria-pressed={grid}
          onClick={() => setGrid(!grid)}
          aria-label={ar ? "شبكة الخريطة" : "Layout grid"}
        >
          ⠿
        </button>
        {(["mm", "cm", "in"] as const).map((u) => (
          <button
            key={u}
            aria-label={`${ar ? "وحدة الخريطة" : "Layout unit"} ${u}`}
            aria-pressed={(project.displayUnit ?? "mm") === u}
            onClick={() => patch({ displayUnit: u })}
          >
            {u}
          </button>
        ))}
        <button
          aria-label={ar ? "تصغير الخريطة" : "Zoom out layout"}
          disabled={zoom <= 60}
          onClick={() => setZoom(Math.max(60, zoom - 20))}
        >
          −
        </button>
        <output>{zoom}%</output>
        <button
          aria-label={ar ? "تكبير الخريطة" : "Zoom in layout"}
          disabled={zoom >= 200}
          onClick={() => setZoom(Math.min(200, zoom + 20))}
        >
          +
        </button>
        <button onClick={() => setZoom(100)}>{ar ? "احتواء" : "Fit"}</button>
      </div>
    </section>
  );
}
