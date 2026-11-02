import { SVGEditor } from "../../elements/SVGEditor";
import { interfaceScenes } from "../../templates/interface-flow/scenes";
import { CreativeTools } from "../../animation/CreativeTools";
import { LayerEditor } from "../../composition/LayerEditor";
import { StudioSelect } from "../../components/StudioSelect";
import { memo, useState } from "react";
import { ClipTools } from "./ClipTools";
import { ChevronLeft, ChevronRight, RotateCcw, Settings2 } from "lucide-react";
import { Asset, Clip, Project, clipDuration } from "../../types";
function InspectorView({
  mobileExpanded = false,
  onMobileClose,
  project,
  clip,
  assets,
  onClip,
  onProject,
  onMove,
  getTime,
  onImportLayer,
  onPreview,
  onRegisterAsset,
}: {
  onRegisterAsset: (a: Asset) => void;
  mobileExpanded?: boolean;
  onMobileClose?: () => void;
  project: Project;
  clip?: Clip;
  assets: Asset[];
  onClip: (p: Partial<Clip>) => void;
  onProject: (p: Partial<Project>) => void;
  onMove: (d: number) => void;
  onImportLayer: () => void;
  getTime: () => number;
  onPreview: (time: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isExpanded = expanded || mobileExpanded;
  const a = assets.find((a) => a.id === clip?.assetId);
  return (
    <aside
      className={`inspector ${isExpanded ? "is-expanded" : ""}`}
      id="studio-inspector"
    >
      <div className="panel-heading">
        <h3>خصائص المشروع</h3>
        <button
          className="inspector-mobile-toggle"
          aria-label="فتح أو طي خصائص المشروع"
          aria-expanded={isExpanded}
          onClick={() =>
            mobileExpanded ? onMobileClose?.() : setExpanded((v) => !v)
          }
        >
          <Settings2 size={17} />
          <span>{isExpanded ? "طيّ" : "تعديل"}</span>
        </button>
      </div>
      <label className="field-label">
        مقاس الفيديو
        <StudioSelect
          label="مقاس الفيديو"
          value={project.ratio}
          onValueChange={(ratio) => onProject({ ratio })}
          options={[
            {
              value: "16:9",
              label: "16:9 — يوتيوب",
              description: "أفقي • فيديوهات وشاشات واسعة",
            },
            {
              value: "9:16",
              label: "9:16 — ريلز وستوري",
              description: "رأسي • تيك توك وشورتس",
            },
            { value: "1:1", label: "1:1 — مربع" },
            { value: "4:5", label: "4:5 — بورتريه" },
          ]}
        />
      </label>
      {a?.source && (
        <div className="asset-source-credit">
          <small>مصدر اللقطة · Pexels</small>
          <a href={a.source.pageUrl} target="_blank" rel="noopener noreferrer">
            {a.source.author} ↗
          </a>
        </div>
      )}
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
            <StudioSelect
              label="سرعة المقطع"
              value={clip.speed}
              onValueChange={(speed) => onClip({ speed: +speed })}
              options={[0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 4].map((s) => ({
                value: s,
                label: `${s}x ${s === 1 ? "— عادي" : ""}`,
              }))}
            />
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
          {clip.designScene && (
            <section aria-label="تصميم الواجهة المتحركة">
              <label className="field-label">
                مشهد الواجهة
                <StudioSelect
                  label="مشهد الواجهة"
                  value={clip.designScene}
                  options={[
                    ...interfaceScenes.map((s) => ({
                      value: s.id,
                      label: s.name,
                    })),
                    { value: "off", label: "إيقاف رسم الواجهة" },
                  ]}
                  onValueChange={(v) =>
                    onClip({
                      designScene:
                        v === "off" ? undefined : (v as Clip["designScene"]),
                    })
                  }
                />
              </label>
              <label className="field-label">
                لون الواجهة
                <input
                  type="color"
                  aria-label="لون الواجهة"
                  value={clip.designAccent || "#4bdfc5"}
                  onChange={(e) => onClip({ designAccent: e.target.value })}
                />
              </label>
              <p className="inspector-note">
                الواجهة رسم توضيحي متحرك؛ العناوين واسم حسابك في قسم النصوص. لا
                يوجد اتصال MCP فعلي.
              </p>
            </section>
          )}
          <CreativeTools
            clip={clip}
            project={project}
            assets={assets}
            onClip={onClip}
            getTime={getTime}
            onPreview={onPreview}
          />
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
      <SVGEditor
        project={project}
        assets={assets}
        onProject={onProject}
        onRegisterAsset={onRegisterAsset}
      />
      <LayerEditor
        project={project}
        assets={assets}
        onProject={onProject}
        getTime={getTime}
        onImportLayer={onImportLayer}
        onSeek={onPreview}
      />
      <div className="inspector-note">✦ كل تعديل بيظهر فورًا في المعاينة.</div>
    </aside>
  );
}

export const Inspector = memo(
  InspectorView,
  (a, b) =>
    a.project === b.project &&
    a.clip === b.clip &&
    a.assets === b.assets &&
    a.mobileExpanded === b.mobileExpanded,
);
