import { useRef, useState } from "react";
import { useDesigner } from "./state";
import {
  entrances,
  holds,
  exits,
  trackFor,
  setTrack,
  sequenceTracks,
  type MotionTrack,
} from "./motion-tracks";
import { motionSettings } from "./motion";
import { NumberField } from "./ui";
import type { Project } from "./types";
export default function MotionTimeline({
  time,
  onSeek,
  expanded = true,
}: {
  expanded?: boolean;
  time: number;
  onSeek: (v: number) => void;
}) {
  const s = useDesigner(),
    duration = motionSettings(s.doc).duration;
  const elements = s.doc.nodes.filter((n) => !n.hidden),
    [chosen, setChosen] = useState("");
  const selected =
    elements.find((n) => n.id === chosen) ||
    elements.find((n) => s.selected.includes(n.id)) ||
    elements[0];
  const drag = useRef<{
    id: string;
    x: number;
    width: number;
    rtl: boolean;
    mode: "move" | "start" | "end";
    track: MotionTrack;
    doc: Project;
  } | null>(null);
  const patch = (value: Partial<MotionTrack>) => {
    if (selected) s.commit((p) => setTrack(p, selected.id, value));
  };
  function finish(cancel = false) {
    if (!drag.current) return;
    const source = drag.current.doc;
    drag.current = null;
    if (cancel) s.dispatch({ type: "live", fn: () => source });
    s.dispatch({ type: "end" });
  }
  return (
    <details className="ld-motion-timeline" open={expanded}>
      <summary>
        {s.t("الشريط الزمني وحركة العناصر", "Timeline & element motion")}
      </summary>
      <div className="ld-motion-timeline-body">
        <div className="ld-motion-timeline-tools">
          <button
            disabled={!elements.length}
            onClick={() => s.commit(sequenceTracks)}
          >
            {s.t(
              "ترتيب تلقائي: الرمز ← الاسم ← الوصف",
              "Auto-sequence: icon → name → details",
            )}
          </button>
          <span>
            {s.t(
              "اسحب الشريط أو طرفيه. الأسهم تحرّك العنصر المحدد زمنيًا.",
              "Drag a bar or its edges. Arrow keys shift the focused bar.",
            )}
          </span>
        </div>
        <label className="ld-motion-time-ruler">
          <span>0s</span>
          <input
            aria-label={s.t("فحص وقت الحركة", "Scrub timeline")}
            type="range"
            min="0"
            max="1000"
            value={Math.round(time * 1000)}
            onChange={(e) => onSeek(Number(e.target.value) / 1000)}
          />
          <span>{duration}s</span>
        </label>
        <div className="ld-motion-timeline-rows">
          {elements.map((n) => {
            const track = trackFor(s.doc, n);
            return (
              <div key={n.id} className="ld-motion-timeline-row">
                <button
                  className="ld-motion-layer-name"
                  title={n.name}
                  aria-pressed={selected?.id === n.id}
                  onClick={() => {
                    setChosen(n.id);
                    s.setSelected([n.id]);
                  }}
                >
                  {n.kind === "text" ? n.text || n.name : n.name}
                </button>
                <div
                  className="ld-motion-track-lane"
                  style={{ backgroundSize: `${100 / duration}% 100%` }}
                >
                  <div
                    className="ld-motion-playhead"
                    style={{ insetInlineStart: `${time * 100}%` }}
                  />
                  <div
                    role="slider"
                    tabIndex={0}
                    aria-label={s.t("توقيت ", "Timing ") + n.name}
                    aria-valuemin={0}
                    aria-valuemax={duration}
                    aria-valuenow={Number(track.start.toFixed(2))}
                    aria-valuetext={`${track.start.toFixed(1)}–${track.end.toFixed(1)}s`}
                    className="ld-motion-track-bar"
                    style={{
                      insetInlineStart: `${(track.start / duration) * 100}%`,
                      width: `${((track.end - track.start) / duration) * 100}%`,
                    }}
                    onKeyDown={(e) => {
                      if (!["ArrowLeft", "ArrowRight"].includes(e.key)) return;
                      e.preventDefault();
                      const sign =
                          (e.key === "ArrowRight" ? 1 : -1) *
                          (s.lang === "ar" ? -1 : 1),
                        span = track.end - track.start,
                        start = Math.max(
                          0,
                          Math.min(duration - span, track.start + sign * 0.1),
                        );
                      s.commit((p) =>
                        setTrack(p, n.id, { start, end: start + span }),
                      );
                    }}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.currentTarget.setPointerCapture(e.pointerId);
                      setChosen(n.id);
                      s.setSelected([n.id]);
                      s.dispatch({ type: "begin" });
                      const handle = (e.target as HTMLElement).dataset.edge as
                        "start" | "end" | undefined;
                      drag.current = {
                        id: n.id,
                        x: e.clientX,
                        width:
                          e.currentTarget.parentElement!.getBoundingClientRect()
                            .width,
                        rtl: s.lang === "ar",
                        mode: handle || "move",
                        track,
                        doc: s.doc,
                      };
                    }}
                    onPointerMove={(e) => {
                      const d = drag.current;
                      if (!d || d.id !== n.id) return;
                      const dt =
                          ((e.clientX - d.x) / d.width) *
                          duration *
                          (d.rtl ? -1 : 1),
                        t = d.track;
                      let patch: Partial<MotionTrack>;
                      if (d.mode === "start")
                        patch = {
                          start: Math.max(
                            0,
                            Math.min(t.end - 0.2, t.start + dt),
                          ),
                        };
                      else if (d.mode === "end")
                        patch = {
                          end: Math.max(
                            t.start + 0.2,
                            Math.min(duration, t.end + dt),
                          ),
                        };
                      else {
                        const start = Math.max(
                          0,
                          Math.min(duration - (t.end - t.start), t.start + dt),
                        );
                        patch = { start, end: start + t.end - t.start };
                      }
                      s.dispatch({
                        type: "live",
                        fn: (p) => setTrack(p, n.id, patch),
                      });
                    }}
                    onPointerUp={() => finish()}
                    onPointerCancel={() => finish(true)}
                    onLostPointerCapture={() => finish()}
                  >
                    <span
                      data-edge="start"
                      title={s.t("بداية الظهور", "Start time")}
                    />
                    <span
                      className="ld-motion-track-phases"
                      style={{
                        background: `linear-gradient(90deg,#ffffff55 ${(track.enterDuration / (track.end - track.start)) * 100}%,transparent 0,transparent ${100 - (track.exitDuration / (track.end - track.start)) * 100}%,#0003 0)`,
                      }}
                    />
                    <span
                      data-edge="end"
                      title={s.t("نهاية الظهور", "End time")}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {selected && (
          <div
            className="ld-motion-track-editor"
            aria-label={s.t("حركة العنصر المحدد", "Selected element motion")}
          >
            <label className="ld-field">
              {s.t("العنصر", "Element")}
              <select
                aria-label={s.t("عنصر الحركة", "Motion element")}
                value={selected.id}
                onChange={(e) => {
                  setChosen(e.target.value);
                  s.setSelected([e.target.value]);
                }}
              >
                {elements.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.kind === "text" ? n.text || n.name : n.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="ld-motion-track-fields">
              {(
                [
                  ["enter", entrances, s.t("حركة الدخول", "Entrance")],
                  ["hold", holds, s.t("حركة الثبات", "Hold effect")],
                  ["exit", exits, s.t("حركة الخروج", "Exit")],
                ] as const
              ).map(([key, options, label]) => (
                <label key={key} className="ld-field">
                  {label}
                  <select
                    aria-label={label}
                    value={trackFor(s.doc, selected)[key]}
                    onChange={(e) => patch({ [key]: e.target.value })}
                  >
                    {options.map(([id, ar, en]) => (
                      <option
                        key={id}
                        value={id}
                        disabled={
                          (id === "draw" &&
                            !["shape", "icon", "vector"].includes(
                              selected.kind,
                            )) ||
                          (id === "type" && selected.kind !== "text")
                        }
                      >
                        {s.t(ar, en)}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
              <NumberField
                label={s.t("بداية العنصر (ث)", "Element start (s)")}
                value={trackFor(s.doc, selected).start}
                min={0}
                max={trackFor(s.doc, selected).end - 0.2}
                step={0.1}
                onChange={(start) => patch({ start })}
              />
              <NumberField
                label={s.t("نهاية العنصر (ث)", "Element end (s)")}
                value={trackFor(s.doc, selected).end}
                min={trackFor(s.doc, selected).start + 0.2}
                max={duration}
                step={0.1}
                onChange={(end) => patch({ end })}
              />
              <NumberField
                label={s.t("مدة الدخول (ث)", "Entrance duration (s)")}
                value={trackFor(s.doc, selected).enterDuration}
                min={0.05}
                max={duration}
                step={0.1}
                onChange={(enterDuration) => patch({ enterDuration })}
              />
              <NumberField
                label={s.t("مدة الخروج (ث)", "Exit duration (s)")}
                value={trackFor(s.doc, selected).exitDuration}
                min={0.05}
                max={duration}
                step={0.1}
                onChange={(exitDuration) => patch({ exitDuration })}
              />
            </div>
            <p>
              {s.t(
                "الرسم للمسارات والأشكال والرموز فقط؛ الكتابة للنصوص وتراعي الحروف العربية المركبة.",
                "Drawing supports vectors, shapes and icons only; typing preserves Arabic grapheme clusters.",
              )}
            </p>
          </div>
        )}
      </div>
    </details>
  );
}
