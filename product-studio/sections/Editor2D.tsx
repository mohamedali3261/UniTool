import { gradientPositions } from "../core/materials";
import { SelectionMeasure } from "./SelectionMeasure";
import { TransformHandles } from "./TransformHandles";
import { snapPosition } from "../core/advanced";
import { useEffect, useRef, useState } from "react";
import type { Layer, Project, Side } from "../core/model";
import { drawArtwork } from "../core/artwork";
export function Editor2D({
  project,
  side,
  selected,
  select,
  change,
  ar,
}: {
  project: Project;
  side: Side;
  selected: string | null;
  select: (id: string | null) => void;
  change: (id: string, p: Partial<Layer>) => void;
  ar: boolean;
}) {
  const [url, setUrl] = useState(""),
    [error, setError] = useState("");
  const [guides, setGuides] = useState<{ gx?: number; gy?: number }>({});
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<{
    id: string;
    x: number;
    y: number;
    ox: number;
    oy: number;
    w: number;
    h: number;
    resize: boolean;
  } | null>(null);
  useEffect(() => {
    let active = true;
    drawArtwork(project.sides[side])
      .then((c) => {
        if (active) {
          setUrl(c.toDataURL());
          setError("");
        }
      })
      .catch(() => {
        if (active)
          setError(ar ? "تعذر عرض الصورة" : "Image could not be loaded");
      });
    return () => {
      active = false;
    };
  }, [project.sides, side, ar]);
  function point(e: React.PointerEvent) {
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(
      svg.current!.getScreenCTM()!.inverse(),
    );
    return p;
  }
  return (
    <div className="ps-editor-wrap">
      <div className="ps-paper">
        <div className="ps-print-label">
          {ar ? "مساحة التصميم · 1024 × 1024" : "ARTWORK AREA · 1024 × 1024"}
        </div>
        <svg
          ref={svg}
          viewBox="0 0 1024 1024"
          className="ps-editor"
          aria-label={ar ? "محرر التصميم ثنائي الأبعاد" : "2D artwork editor"}
          style={{
            background: project.appearance.gradient
              ? `linear-gradient(${90 - project.appearance.gradient.angle}deg,${project.appearance.gradient.colors.map((c, i) => `${c} ${gradientPositions(project.appearance.gradient!)[i] * 100}%`).join(",")})`
              : project.color,
          }}
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) select(null);
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            if (!d) return;
            const p = point(e);
            if (d.resize)
              change(d.id, {
                w: Math.max(32, Math.min(1600, d.w + (p.x - d.x))),
                h: Math.max(32, Math.min(1600, d.h + (p.y - d.y))),
              });
            else {
              const l = project.sides[side].find((l) => l.id === d.id)!;
              const snapped = snapPosition(
                l,
                d.ox + p.x - d.x,
                d.oy + p.y - d.y,
                project.sides[side],
              );
              setGuides(snapped);
              change(d.id, { x: snapped.x, y: snapped.y });
            }
          }}
          onPointerUp={() => {
            drag.current = null;
            setGuides({});
          }}
          onPointerCancel={() => {
            drag.current = null;
            setGuides({});
          }}
        >
          {url && (
            <image href={url} width="1024" height="1024" pointerEvents="none" />
          )}
          {project.sides[side]
            .filter((l) => l.visible)
            .map((l) => (
              <g
                key={l.id}
                transform={`rotate(${l.rotation} ${l.x + l.w / 2} ${l.y + l.h / 2})`}
              >
                <rect
                  className="ps-layer-hit"
                  x={l.x}
                  y={l.y}
                  width={l.w}
                  height={l.h}
                  fill="transparent"
                  stroke={selected === l.id ? "#236d53" : "transparent"}
                  strokeWidth="4"
                  strokeDasharray="10 6"
                  style={{ cursor: l.locked ? "not-allowed" : "move" }}
                  onDoubleClick={() => {
                    if (l.kind === "text" && !l.locked) {
                      select(l.id);
                      requestAnimationFrame(() =>
                        document
                          .querySelector<HTMLTextAreaElement>(
                            ".ps-inspector textarea",
                          )
                          ?.focus(),
                      );
                    }
                  }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    select(l.id);
                    if (l.locked) return;
                    const p = point(e);
                    drag.current = {
                      id: l.id,
                      x: p.x,
                      y: p.y,
                      ox: l.x,
                      oy: l.y,
                      w: l.w,
                      h: l.h,
                      resize: false,
                    };
                    e.currentTarget.setPointerCapture(e.pointerId);
                  }}
                />
              </g>
            ))}
          {project.sides[side]
            .filter((l) => l.id === selected && !l.locked)
            .map((l) => (
              <TransformHandles
                key={l.id}
                item={l}
                change={(p) => change(l.id, p)}
                ar={ar}
              />
            ))}
          {project.sides[side]
            .filter((l) => l.id === selected && l.visible)
            .map((l) => (
              <SelectionMeasure
                key={l.id}
                item={l}
                area={project.printAreas?.[side]}
                unit={project.displayUnit}
              />
            ))}
          {guides.gx !== undefined && (
            <line
              x1={guides.gx}
              x2={guides.gx}
              y1="0"
              y2="1024"
              stroke="#f1784c"
              strokeWidth="3"
            />
          )}
          {guides.gy !== undefined && (
            <line
              y1={guides.gy}
              y2={guides.gy}
              x1="0"
              x2="1024"
              stroke="#f1784c"
              strokeWidth="3"
            />
          )}
          {project.printAreas?.[side] && (
            <rect
              x={
                (project.printAreas[side]!.safe /
                  project.printAreas[side]!.width) *
                1024
              }
              y={
                (project.printAreas[side]!.safe /
                  project.printAreas[side]!.height) *
                1024
              }
              width={
                1024 -
                ((2 * project.printAreas[side]!.safe) /
                  project.printAreas[side]!.width) *
                  1024
              }
              height={
                1024 -
                ((2 * project.printAreas[side]!.safe) /
                  project.printAreas[side]!.height) *
                  1024
              }
              fill="none"
              stroke="#ffe4a5"
              strokeDasharray="12 8"
              strokeWidth="3"
              pointerEvents="none"
            />
          )}
        </svg>
        <p>
          {error ||
            (ar
              ? "اسحب لتحريك العنصر • المربع الصغير لتغيير الحجم"
              : "Drag to move • Drag the corner to resize")}
        </p>
      </div>
    </div>
  );
}
