import { motions } from "./motions";
import { MotionGallery } from "./motions/MotionGallery";
import type { Asset, Clip, Project, MotionKeyframe } from "../types";
import { clipDuration, uid } from "../types";
import { StudioSelect } from "../components/StudioSelect";
import { clipStart } from "../lib/timeline";
import { motionAt } from "./evaluate";
export function CreativeTools({
  clip,
  project,
  assets,
  onClip,
  getTime,
  onPreview,
}: {
  clip: Clip;
  project: Project;
  assets: Asset[];
  onClip: (patch: Partial<Clip>) => void;
  getTime: () => number;
  onPreview: (time: number) => void;
}) {
  const first = project.clips[0]?.id === clip.id;
  const frames = clip.keyframes || [];
  const edit = (id: string, patch: Partial<MotionKeyframe>) =>
    onClip({
      keyframes: frames
        .map((f) => (f.id === id ? { ...f, ...patch } : f))
        .sort((a, b) => a.t - b.t),
    });
  return (
    <div className="creative-tools">
      <details open>
        <summary>انتقال إلى المقطع</summary>
        <label className="field-label">
          نوع الانتقال
          <StudioSelect
            label="نوع الانتقال"
            disabled={first}
            value={clip.transition?.kind || "none"}
            onValueChange={(kind) =>
              onClip({
                transition: {
                  kind: kind as NonNullable<Clip["transition"]>["kind"],
                  duration: clip.transition?.duration || 0.8,
                },
              })
            }
            options={[
              { value: "none", label: "بدون انتقال" },
              { value: "crossfade", label: "تلاشي متبادل" },
              { value: "slide", label: "سحب" },
              { value: "zoom", label: "زووم" },
              { value: "light", label: "وميض ضوئي" },
            ]}
          />
        </label>
        {first ? (
          <p>الانتقال يُضاف بين هذا المقطع والذي يسبقه.</p>
        ) : (
          clip.transition?.kind &&
          clip.transition.kind !== "none" && (
            <>
              <label className="field-label">
                مدة الانتقال (ث)
                <input
                  aria-label="مدة الانتقال"
                  type="number"
                  min=".1"
                  max="3"
                  step=".1"
                  value={clip.transition.duration}
                  onChange={(e) =>
                    onClip({
                      transition: {
                        ...clip.transition,
                        duration: Math.max(0.1, Math.min(3, +e.target.value)),
                      },
                    })
                  }
                />
              </label>
              <button
                className="secondary"
                onClick={() =>
                  onPreview(
                    Math.max(
                      0,
                      clipStart(project, clip.id) -
                        clip.transition.duration / 2,
                    ),
                  )
                }
              >
                ▶ معاينة الانتقال
              </button>
              <p>
                المدة تتقلّص تلقائيًا مع المقاطع القصيرة، دون تغيير طول المشروع.
              </p>
            </>
          )
        )}
      </details>
      <details>
        <summary>تحريك الصورة وKeyframes</summary>
        <label className="field-label">
          حركة جاهزة
          <StudioSelect
            label="حركة الصورة"
            value={clip.motion || "none"}
            onValueChange={(motion) =>
              onClip({ motion: motion as Clip["motion"] })
            }
            options={[
              { value: "none", label: "ثابت" },
              ...motions.map((m) => ({ value: m.id, label: m.name })),
            ]}
          />
        </label>
        <details>
          <summary>استعراض كروت الحركات ({motions.length})</summary>
          <MotionGallery
            value={clip.motion || "none"}
            onChange={(motion) => onClip({ motion })}
          />
        </details>
        <button
          className="secondary"
          onClick={() => onPreview(clipStart(project, clip.id))}
        >
          ▶ تشغيل الحركة في المعاينة
        </button>
        <button
          className="secondary"
          disabled={frames.length >= 20}
          onClick={() => {
            const t =
              Math.round(
                Math.max(
                  0,
                  Math.min(
                    clipDuration(clip),
                    getTime() - clipStart(project, clip.id),
                  ),
                ) * 100,
              ) / 100;
            if (frames.some((f) => Math.abs(f.t - t) < 0.01)) return;
            const value = motionAt({ ...clip, motion: "none" }, t);
            onClip({
              keyframes: [
                ...frames,
                {
                  id: uid(),
                  t,
                  x: value.x,
                  y: value.y,
                  scale: value.scale,
                  opacity: value.opacity,
                },
              ].sort((a, b) => a.t - b.t),
            });
          }}
        >
          ◇ أضف Keyframe عند المؤشر
        </button>
        <p>حتى ٢٠ نقطة. المكان كنسبة من الكادر، والاستيفاء خطّي بين النقاط.</p>
        {frames.map((f, i) => (
          <fieldset className="keyframe-fields" key={f.id}>
            <legend>◇ نقطة {i + 1}</legend>
            <div className="two-fields">
              {(
                [
                  ["t", "الوقت (ث)", 0, clipDuration(clip), 0.1],
                  ["x", "أفقي %", -100, 100, 1],
                  ["y", "رأسي %", -100, 100, 1],
                  ["scale", "الحجم ×", 0.25, 3, 0.05],
                  ["opacity", "الشفافية", 0, 1, 0.05],
                ] as const
              ).map(([key, label, min, max, step]) => (
                <label key={key}>
                  {label}
                  <input
                    aria-label={`Keyframe ${i + 1} ${label}`}
                    type="number"
                    min={min}
                    max={max}
                    step={step}
                    value={f[key]}
                    onChange={(e) =>
                      edit(f.id, {
                        [key]: Math.max(min, Math.min(max, +e.target.value)),
                      })
                    }
                  />
                </label>
              ))}
            </div>
            <button
              className="text-button"
              onClick={() => onPreview(clipStart(project, clip.id) + f.t)}
            >
              عرض النقطة
            </button>
            <button
              className="danger-link"
              onClick={() =>
                onClip({ keyframes: frames.filter((x) => x.id !== f.id) })
              }
            >
              حذف النقطة
            </button>
          </fieldset>
        ))}
      </details>
      <details>
        <summary>استبدال مصدر المقطع</summary>
        <StudioSelect
          label="استبدال مصدر المقطع"
          value={clip.assetId}
          options={assets
            .filter((a) => a.type !== "audio")
            .map((a) => ({ value: a.id, label: a.name }))}
          onValueChange={(id) => {
            const a = assets.find((a) => a.id === id)!;
            onClip({
              assetId: id,
              start: 0,
              end:
                a.type === "image"
                  ? clipDuration(clip) * clip.speed
                  : Math.min(a.duration, clipDuration(clip) * clip.speed),
            });
          }}
        />
        <p>بدّل خلفية القالب أو أي مقطع بملف من مكتبتك.</p>
      </details>
    </div>
  );
}
