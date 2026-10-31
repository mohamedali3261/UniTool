import { useRef } from "react";
import { clipDuration, timeLabel, type Project } from "../../../types";
import { overviewTime } from "./navigation";

/** A bounded overview: no media decoding, one node per clip, pointer + keyboard navigation. */
export function TimelineOverview({
  project,
  duration,
  time,
  viewport,
  onSeek,
}: {
  project: Project;
  duration: number;
  time: number;
  viewport: { left: number; width: number; total: number };
  onSeek: (time: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  if (duration <= 0 || viewport.total <= viewport.width + 1) return null;
  const seek = (clientX: number) => {
    const r = ref.current!.getBoundingClientRect();
    onSeek(overviewTime(clientX, r.left, r.width, duration));
  };
  let start = 0;
  return (
    <div className="timeline-overview-wrap" dir="ltr">
      <span>خريطة المشروع</span>
      <div
        ref={ref}
        className="timeline-overview"
        role="slider"
        tabIndex={0}
        aria-label="التنقل في خريطة المشروع"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={Number(time.toFixed(3))}
        aria-valuetext={timeLabel(time)}
        title="اضغط أو اسحب للانتقال إلى أي جزء من المشروع"
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          e.preventDefault();
          e.currentTarget.focus({ preventScroll: true });
          e.currentTarget.setPointerCapture(e.pointerId);
          seek(e.clientX);
        }}
        onPointerMove={(e) => {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) seek(e.clientX);
        }}
        onPointerUp={(e) => {
          if (e.currentTarget.hasPointerCapture(e.pointerId))
            e.currentTarget.releasePointerCapture(e.pointerId);
        }}
        onLostPointerCapture={() => {}}
        onKeyDown={(e) => {
          const step = e.shiftKey ? 1 : 1 / 30;
          if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
            e.preventDefault();
            e.stopPropagation();
            onSeek(
              e.key === "Home"
                ? 0
                : e.key === "End"
                  ? duration
                  : Math.max(0, Math.min(duration, time + (e.key === "ArrowRight" ? step : -step))),
            );
          }
        }}
      >
        {project.clips.map((c) => {
          const left = (start / duration) * 100;
          start += clipDuration(c);
          return (
            <i
              key={c.id}
              className={`overview-clip ${c.gap ? "is-gap" : ""}`}
              style={{ left: `${left}%`, width: `${(clipDuration(c) / duration) * 100}%` }}
            />
          );
        })}
        {project.markers?.map((m) => (
          <b key={m.id} className="overview-marker" style={{ left: `${(m.time / duration) * 100}%`, color: m.color }} />
        ))}
        <span
          className="overview-viewport"
          style={{
            left: `${(viewport.left / viewport.total) * 100}%`,
            width: `${Math.min(100, (viewport.width / viewport.total) * 100)}%`,
          }}
        />
        <span className="overview-playhead" style={{ left: `${(time / duration) * 100}%` }} />
      </div>
    </div>
  );
}
