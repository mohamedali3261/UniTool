import { lazy, memo, Suspense, useState } from "react";
const PexelsLibrary = lazy(() => import("../../stock/PexelsLibrary"));
import { EffectsCatalog } from "../../effects/components/EffectsCatalog";
import {
  Sparkles,
  Upload,
  Plus,
  Film,
  Music2,
  Type,
  SlidersHorizontal,
  Layers,
  Smile,
  Trash2,
} from "lucide-react";
import { Asset, Project, TextLayer, Clip } from "../../types";
export type Tab =
  "media" | "audio" | "text" | "filters" | "effects" | "stickers";
export const tabs: { id: Tab; label: string; icon: typeof Film }[] = [
  { id: "media", label: "وسائط", icon: Film },
  { id: "audio", label: "الصوت", icon: Music2 },
  { id: "text", label: "النصوص", icon: Type },
  { id: "filters", label: "الفلاتر", icon: SlidersHorizontal },
  { id: "effects", label: "التأثيرات", icon: Sparkles },
  { id: "stickers", label: "ملصقات", icon: Smile },
];
function LibraryView({
  tab,
  clip,
  suspendPreviews,
  onEffect,
  onEffectSettings,
  assets,
  project,
  onImport,
  onAdd,
  onStockAsset,
  onText,
  onFilter,
  onAudio,
  updateText,
  removeText,
  onRemoveAudio,
}: {
  tab: Tab;
  clip?: Clip;
  suspendPreviews: boolean;
  onEffect: (id: string) => void;
  onEffectSettings: (patch: Partial<Clip>) => void;
  assets: Asset[];
  project: Project;
  onImport: () => void;
  onAdd: (a: Asset) => void;
  onStockAsset: (asset: Asset) => void;
  onText: (s: string) => void;
  onFilter: (s: string) => void;
  onAudio: (id: string) => void;
  updateText: (id: string, patch: Partial<TextLayer>) => void;
  removeText: (id: string) => void;
  onRemoveAudio: () => void;
}) {
  const [source, setSource] = useState<"local" | "pexels">("local");
  return (
    <aside
      className={`library-panel ${tab === "media" && source === "pexels" ? "is-stock" : ""} ${tab === "effects" || tab === "filters" ? "is-catalog" : ""}`}
      id="studio-library"
    >
      <div className="panel-heading">
        <h3>{tabs.find((t) => t.id === tab)?.label}</h3>
        <span>
          {tab === "media"
            ? `${assets.filter((a) => a.type !== "audio").length} ملفات`
            : "لمستك تصنع الفرق"}
        </span>
      </div>
      {tab === "media" && (
        <div
          className="studio-segmented media-sources"
          role="group"
          aria-label="مصدر الوسائط"
        >
          <button
            aria-pressed={source === "local"}
            onClick={() => setSource("local")}
          >
            <Upload size={15} />
            ملفاتي
          </button>
          <button
            aria-pressed={source === "pexels"}
            onClick={() => setSource("pexels")}
          >
            <Film size={15} />
            مكتبة Pexels
          </button>
        </div>
      )}
      {tab === "media" && source === "pexels" && (
        <Suspense
          fallback={
            <p className="panel-tip" role="status">
              جاري فتح مكتبة Pexels…
            </p>
          }
        >
          <PexelsLibrary
            assets={assets}
            onImported={onStockAsset}
            suspended={suspendPreviews}
          />
        </Suspense>
      )}
      {(tab === "audio" || (tab === "media" && source === "local")) && (
        <>
          <button className="upload-zone" onClick={onImport}>
            <div>
              <Upload size={22} />
            </div>
            <b>اضغط لرفع {tab === "audio" ? "صوت" : "ملفاتك"}</b>
            <span>
              {tab === "audio" ? "MP3, WAV, OGG…" : "MP4, WebM, MOV, JPG, PNG…"}
            </span>
            <small>من جهازك • ملفاتك تفضل عندك</small>
          </button>
          <div className="library-list">
            {assets
              .filter((a) =>
                tab === "audio" ? a.type === "audio" : a.type !== "audio",
              )
              .map((a) => (
                <button
                  className="asset-card"
                  key={a.id}
                  onClick={() => (tab === "audio" ? onAudio(a.id) : onAdd(a))}
                >
                  <div className="asset-thumb">
                    {a.type === "image" ? (
                      <img src={a.url} alt="" />
                    ) : a.type === "video" ? (
                      <video src={a.url} muted preload="metadata" />
                    ) : (
                      <Music2 size={26} />
                    )}
                    <span>{a.duration.toFixed(1)}s</span>
                    <i>
                      <Plus size={16} />
                    </i>
                  </div>
                  <p title={a.name}>{a.name}</p>
                  {a.source && (
                    <small className="asset-credit">
                      Pexels · {a.source.author}
                    </small>
                  )}
                </button>
              ))}
          </div>
          {tab === "audio" && project.audioId && (
            <button className="danger-link" onClick={onRemoveAudio}>
              <Trash2 size={15} /> إزالة الموسيقى
            </button>
          )}
          <div className="panel-tip">
            <Layers size={18} />
            <p>
              اضغط على أي ملف لإضافته إلى{" "}
              {tab === "audio" ? "مسار الصوت" : "الخط الزمني"}. يمكنك إضافة
              الملف أكثر من مرة.
            </p>
          </div>
        </>
      )}
      {(tab === "filters" || tab === "effects") && (
        <EffectsCatalog
          key={tab}
          kind={tab === "filters" ? "filter" : "effect"}
          suspended={suspendPreviews}
          clip={clip}
          onApply={tab === "filters" ? onFilter : onEffect}
          onSettings={onEffectSettings}
        />
      )}
      {tab === "stickers" && (
        <>
          <p className="muted panel-description">
            ملصقات بسيطة، تعبيرات كبيرة. اضغط لإضافتها.
          </p>
          <div className="stickers-grid">
            {[
              "✨",
              "❤️",
              "🔥",
              "⭐",
              "🎬",
              "🎉",
              "🌈",
              "💯",
              "😍",
              "👋",
              "📍",
              "💬",
              "🌸",
              "⚡",
              "☀️",
              "🎵",
            ].map((s) => (
              <button key={s} onClick={() => onText(s)}>
                {s}
              </button>
            ))}
          </div>
        </>
      )}
      {tab === "text" && (
        <>
          <button
            className="primary full-width"
            onClick={() => onText("اكتب حكايتك هنا")}
          >
            <Plus size={18} /> إضافة نص
          </button>
          <div className="text-presets">
            {[
              "عنوان يستاهل يتشاف",
              "لحظات ما تتنسيش ✨",
              "تابعني للمزيد ↗",
            ].map((s) => (
              <button key={s} onClick={() => onText(s)}>
                {s}
                <Plus size={15} />
              </button>
            ))}
          </div>
          <div className="text-layers">
            {project.texts.map((t) => (
              <div className="text-layer" key={t.id}>
                <div className="field-heading">
                  <b>طبقة نص</b>
                  <button
                    aria-label="حذف النص"
                    onClick={() => removeText(t.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <textarea
                  value={t.text}
                  onChange={(e) => updateText(t.id, { text: e.target.value })}
                  aria-label="محتوى النص"
                />
                <div className="two-fields">
                  <label>
                    اللون
                    <input
                      type="color"
                      value={t.color}
                      onChange={(e) =>
                        updateText(t.id, { color: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    الحجم
                    <input
                      type="number"
                      min="12"
                      max="180"
                      value={t.size}
                      onChange={(e) =>
                        updateText(t.id, {
                          size: Math.max(12, Math.min(180, +e.target.value)),
                        })
                      }
                    />
                  </label>
                </div>
                <div className="two-fields">
                  <label>
                    يبدأ (ث)
                    <input
                      type="number"
                      min="0"
                      step=".1"
                      max={t.end - 0.1}
                      value={t.start}
                      onChange={(e) =>
                        updateText(t.id, {
                          start: Math.max(
                            0,
                            Math.min(t.end - 0.1, +e.target.value),
                          ),
                        })
                      }
                    />
                  </label>
                  <label>
                    ينتهي (ث)
                    <input
                      type="number"
                      min={t.start + 0.1}
                      step=".1"
                      value={t.end}
                      onChange={(e) =>
                        updateText(t.id, {
                          end: Math.max(t.start + 0.1, +e.target.value),
                        })
                      }
                    />
                  </label>
                </div>
                <label className="slider-label">
                  موضع أفقي
                  <input
                    type="range"
                    min="5"
                    max="95"
                    value={t.x}
                    onChange={(e) => updateText(t.id, { x: +e.target.value })}
                  />
                </label>
                <label className="slider-label">
                  موضع رأسي
                  <input
                    type="range"
                    min="5"
                    max="95"
                    value={t.y}
                    onChange={(e) => updateText(t.id, { y: +e.target.value })}
                  />
                </label>
              </div>
            ))}
          </div>
        </>
      )}
    </aside>
  );
}

export const Library = memo(LibraryView);
