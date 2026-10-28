import { memo, useState } from "react";
import { ClipTools } from "./ClipTools";
import { ChevronLeft, ChevronRight, RotateCcw, Settings2 } from "lucide-react";
import { Asset, Clip, Project, clipDuration } from "../../types";
function InspectorView({
  project,
  clip,
  assets,
  onClip,
  onProject,
  onMove,
}: {
  project: Project;
  clip?: Clip;
  assets: Asset[];
  onClip: (p: Partial<Clip>) => void;
  onProject: (p: Partial<Project>) => void;
  onMove: (d: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const a = assets.find((a) => a.id === clip?.assetId);
  return (
    <aside
      className={`inspector ${expanded ? "is-expanded" : ""}`}
      id="studio-inspector"
    >
      <div className="panel-heading">
        <h3>خصائص المشروع</h3>
        <button
          className="inspector-mobile-toggle"
          aria-label="فتح أو طي خصائص المشروع"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
        >
          <Settings2 size={17} />
          <span>{expanded ? "طيّ" : "تعديل"}</span>
        </button>
      </div>
      <label className="field-label">
        مقاس الفيديو
        <select
          value={project.ratio}
          onChange={(e) => onProject({ ratio: e.target.value })}
        >
          <option value="16:9">16:9 — يوتيوب</option>
          <option value="9:16">9:16 — ريلز وستوري</option>
          <option value="1:1">1:1 — مربع</option>
          <option value="4:5">4:5 — بورتريه</option>
        </select>
      </label>
      {project.audioId && (
        <label className="slider-label">
          صوت الموسيقى <span>{Math.round(project.audioVolume * 100)}%</span>
          <input
            type="range"
            min="0"
            max="1"
            step=".01"
            value={project.audioVolume}
            onChange={(e) => onProject({ audioVolume: +e.target.value })}
          />
        </label>
      )}
      {project.audioId && (
        <div className="audio-properties">
          <div className="two-fields">
            <label>
              بداية الموسيقى (ث)
              <input
                aria-label="بداية الموسيقى"
                type="number"
                min="0"
                max={project.clips.reduce((s, c) => s + clipDuration(c), 0)}
                step=".1"
                value={project.audioStart || 0}
                onChange={(e) =>
                  onProject({ audioStart: Math.max(0, +e.target.value) })
                }
              />
            </label>
            <label>
              قص من الصوت (ث)
              <input
                aria-label="قص بداية الصوت"
                type="number"
                min="0"
                max={Math.max(
                  0,
                  (assets.find((a) => a.id === project.audioId)?.duration ||
                    0) - 0.1,
                )}
                step=".1"
                value={project.audioOffset || 0}
                onChange={(e) =>
                  onProject({
                    audioOffset: Math.max(
                      0,
                      Math.min(
                        (assets.find((a) => a.id === project.audioId)
                          ?.duration || 0) - 0.1,
                        +e.target.value,
                      ),
                    ),
                  })
                }
              />
            </label>
          </div>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={project.audioLoop !== false}
              onChange={(e) => onProject({ audioLoop: e.target.checked })}
            />
            تكرار الموسيقى لنهاية المشروع
          </label>
        </div>
      )}
      <div className="inspector-divider" />
      {clip ? (
        <>
          <div className="field-heading">
            <b>المقطع المحدد</b>
            <span>{clipDuration(clip).toFixed(1)} ثانية</span>
          </div>
          <p className="clip-name" title={a?.name}>
            {a?.name}
          </p>
          <div className="two-fields">
            <label>
              بداية القص (ث)
              <input
                type="number"
                min="0"
                max={clip.end - 0.1}
                step=".1"
                value={clip.start}
                onChange={(e) =>
                  onClip({
                    start: Math.max(
                      0,
                      Math.min(clip.end - 0.1, +e.target.value),
                    ),
                  })
                }
              />
            </label>
            <label>
              نهاية القص (ث)
              <input
                type="number"
                min={clip.start + 0.1}
                max={a?.type === "image" ? 3600 : a?.duration}
                step=".1"
                value={clip.end}
                onChange={(e) =>
                  onClip({
                    end: Math.min(
                      a?.type === "image" ? 3600 : a?.duration || clip.end,
                      Math.max(clip.start + 0.1, +e.target.value),
                    ),
                  })
                }
              />
            </label>
          </div>
          <label className="field-label">
            سرعة المقطع
            <select
              value={clip.speed}
              onChange={(e) => onClip({ speed: +e.target.value })}
            >
              {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 4].map((s) => (
                <option key={s} value={s}>
                  {s}x {s === 1 ? "— عادي" : ""}
                </option>
              ))}
            </select>
          </label>
          {a?.type === "video" && (
            <label className="slider-label">
              صوت المقطع <span>{Math.round(clip.volume * 100)}%</span>
              <input
                type="range"
                min="0"
                max="1"
                step=".01"
                value={clip.volume}
                onChange={(e) => onClip({ volume: +e.target.value })}
              />
            </label>
          )}
          <div className="inspector-divider" />
          <div className="field-heading">
            <b>ضبط الألوان</b>
            <button
              title="إعادة ضبط"
              aria-label="إعادة ضبط الألوان"
              onClick={() =>
                onClip({
                  brightness: 1,
                  contrast: 1,
                  saturation: 1,
                  filter: "original",
                })
              }
            >
              <RotateCcw size={14} />
            </button>
          </div>
          {[
            ["brightness", "الإضاءة"],
            ["contrast", "التباين"],
            ["saturation", "التشبع"],
          ].map(([key, label]) => (
            <label key={key} className="slider-label">
              {label}
              <span>{Math.round(clip[key as "brightness"] * 100)}%</span>
              <input
                type="range"
                min="0"
                max="2"
                step=".01"
                value={clip[key as "brightness"]}
                onChange={(e) => onClip({ [key]: +e.target.value })}
              />
            </label>
          ))}
          <ClipTools clip={clip} onClip={onClip} />
          <div className="inspector-divider" />
          <div className="field-heading">
            <b>ترتيب المقطع</b>
          </div>
          <div className="move-buttons">
            <button onClick={() => onMove(-1)}>
              <ChevronRight size={15} />
              قبل
            </button>
            <button onClick={() => onMove(1)}>
              بعد
              <ChevronLeft size={15} />
            </button>
          </div>
        </>
      ) : (
        <div className="inspector-empty">
          <Settings2 size={28} />
          <p>
            اختار مقطع من الخط الزمني
            <br />
            لتعديل خصائصه وألوانه.
          </p>
        </div>
      )}
      <div className="inspector-note">✦ كل تعديل بيظهر فورًا في المعاينة.</div>
    </aside>
  );
}

export const Inspector = memo(
  InspectorView,
  (a, b) =>
    a.project === b.project && a.clip === b.clip && a.assets === b.assets,
);
