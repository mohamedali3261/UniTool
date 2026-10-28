import { StudioSelect } from "../../components/StudioSelect";
import {
  RotateCw,
  FlipHorizontal2,
  FlipVertical2,
  RotateCcw,
} from "lucide-react";
import { Clip, clipDuration } from "../../types";
export function ClipTools({
  clip,
  onClip,
}: {
  clip: Clip;
  onClip: (p: Partial<Clip>) => void;
}) {
  const maxFade = Math.min(5, clipDuration(clip) / 2);
  return (
    <>
      <div className="inspector-divider" />
      <div className="field-heading">
        <b>تحويل ومقاس</b>
        <button
          aria-label="إعادة ضبط التحويل"
          title="إعادة ضبط التحويل"
          onClick={() =>
            onClip({
              rotation: 0,
              flipX: false,
              flipY: false,
              zoom: 1,
              fit: "contain",
            })
          }
        >
          <RotateCcw size={14} />
        </button>
      </div>
      <div className="transform-buttons">
        <button
          aria-label="تدوير 90 درجة"
          onClick={() =>
            onClip({ rotation: ((clip.rotation || 0) + 90) % 360 })
          }
        >
          <RotateCw size={17} />
          <span>{clip.rotation || 0}°</span>
        </button>
        <button
          aria-label="عكس أفقي"
          aria-pressed={!!clip.flipX}
          onClick={() => onClip({ flipX: !clip.flipX })}
        >
          <FlipHorizontal2 size={17} />
        </button>
        <button
          aria-label="عكس رأسي"
          aria-pressed={!!clip.flipY}
          onClick={() => onClip({ flipY: !clip.flipY })}
        >
          <FlipVertical2 size={17} />
        </button>
      </div>
      <label className="field-label">
        ملاءمة الكادر
        <StudioSelect
          label="ملاءمة الكادر"
          value={clip.fit || "contain"}
          onValueChange={(fit) => onClip({ fit: fit as "contain" | "cover" })}
          options={[
            {
              value: "contain",
              label: "احتواء",
              description: "عرض المحتوى كاملًا دون قص",
            },
            {
              value: "cover",
              label: "ملء الكادر",
              description: "قص الأطراف الزائدة لملء الشاشة",
            },
          ]}
        />
      </label>
      <label className="slider-label">
        تكبير الصورة<span>{Math.round((clip.zoom ?? 1) * 100)}%</span>
        <input
          aria-label="تكبير الصورة"
          type="range"
          min=".25"
          max="3"
          step=".05"
          value={clip.zoom ?? 1}
          onChange={(e) => onClip({ zoom: +e.target.value })}
        />
      </label>
      <div className="inspector-divider" />
      <div className="field-heading">
        <b>تلاشي الصورة والصوت</b>
      </div>
      <p className="tool-help">
        تدرّج من وإلى الأسود، وليس تداخلًا بين مقطعين.
      </p>
      <div className="two-fields">
        <label>
          دخول (ث)
          <input
            aria-label="تلاشي الدخول"
            type="number"
            min="0"
            max={maxFade}
            step=".1"
            value={clip.fadeIn || 0}
            onChange={(e) =>
              onClip({
                fadeIn: Math.max(0, Math.min(maxFade, +e.target.value)),
              })
            }
          />
        </label>
        <label>
          خروج (ث)
          <input
            aria-label="تلاشي الخروج"
            type="number"
            min="0"
            max={maxFade}
            step=".1"
            value={clip.fadeOut || 0}
            onChange={(e) =>
              onClip({
                fadeOut: Math.max(0, Math.min(maxFade, +e.target.value)),
              })
            }
          />
        </label>
      </div>
    </>
  );
}
