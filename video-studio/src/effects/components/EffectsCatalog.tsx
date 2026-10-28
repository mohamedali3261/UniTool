import { useCallback, useMemo, useState, useEffect } from "react";
import {
  Search,
  Eye,
  Heart,
  Sparkles,
  X,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";
import { effects, categories, effectById } from "../registry";
import { useStudioSettings } from "../../settings/StudioSettings";
import { LiveEffectCard } from "./LiveEffectCard";
import type { Clip } from "../../types";
import type { EffectCategory } from "../types";
function readFavorites(): string[] {
  try {
    const v = JSON.parse(
      localStorage.getItem("unitool.studio.favorites") || "[]",
    );
    return Array.isArray(v)
      ? v.filter((id) => typeof id === "string" && effectById.has(id))
      : [];
  } catch {
    return [];
  }
}
export function EffectsCatalog({
  kind,
  suspended = false,
  clip,
  onApply,
  onSettings,
}: {
  kind: "filter" | "effect";
  suspended?: boolean;
  clip?: Clip;
  onApply: (id: string) => void;
  onSettings: (p: Partial<Clip>) => void;
}) {
  const [category, setCategory] = useState<
    EffectCategory | "all" | "favorites"
  >("all");
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string | null>(
    () => effects.find((e) => e.kind === kind)?.id || null,
  );
  const [favorites, setFavorites] = useState(readFavorites);
  const { animateCards: allowAnimation } = useStudioSettings();
  const animateCards = allowAnimation && !suspended;
  const favorite = useCallback((id: string) => {
    setFavorites((p) => {
      const next = p.includes(id) ? p.filter((x) => x !== id) : [...p, id];
      try {
        localStorage.setItem("unitool.studio.favorites", JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);
  const preview = useCallback(
    (id: string) => setActive((p) => (p === id ? null : id)),
    [],
  );
  const available = effects.filter((e) => e.kind === kind);
  const displayed = useMemo(
    () =>
      available.filter(
        (e) =>
          (category === "all" ||
            (category === "favorites" && favorites.includes(e.id)) ||
            e.category === category) &&
          `${e.name} ${e.description} ${e.id}`
            .toLowerCase()
            .includes(query.trim().toLowerCase()),
      ),
    [kind, category, query, favorites],
  );
  useEffect(() => {
    setActive((current) =>
      displayed.some((e) => e.id === current)
        ? current
        : displayed[0]?.id || null,
    );
  }, [displayed]);
  const selected = clip
    ? kind === "filter"
      ? clip.filter
      : clip.effect
    : undefined;
  const [showControls, setShowControls] = useState(false);
  return (
    <section
      className="effects-catalog"
      aria-label={kind === "filter" ? "مكتبة الفلاتر" : "مكتبة التأثيرات"}
    >
      <div className="effects-intro">
        <span className="effects-kicker">
          <Sparkles size={12} /> THE FINISHING TOUCH
        </span>
        <h3>
          {kind === "filter"
            ? "لون المشهد. غيّر إحساسه."
            : "تفاصيل صغيرة. تأثير كبير."}
        </h3>
        <p>
          معاينات حيّة. تعديل بضغطة.{" "}
          <span>
            {available.length} {kind === "filter" ? "فلتر" : "تأثير"} جاهز.
          </span>
        </p>
      </div>
      <button
        className="back-to-preview"
        onClick={() =>
          document.querySelector(".center-workspace")?.scrollIntoView({
            behavior: window.matchMedia("(prefers-reduced-motion:reduce)")
              .matches
              ? "auto"
              : "smooth",
            block: "start",
          })
        }
      >
        ↗ العودة للمعاينة
      </button>
      <div className="catalog-sticky">
        <div className="effect-search">
          <Search size={15} />
          <input
            aria-label="البحث في التأثيرات"
            placeholder="دور على إحساسك…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button aria-label="مسح البحث" onClick={() => setQuery("")}>
              <X size={14} />
            </button>
          )}
        </div>
        <div
          className="effect-categories"
          role="group"
          aria-label="أقسام التأثيرات"
        >
          <button
            aria-pressed={category === "all"}
            onClick={() => setCategory("all")}
          >
            الكل <small>{available.length}</small>
          </button>
          {categories
            .filter((c) => available.some((e) => e.category === c.id))
            .map((c) => (
              <button
                key={c.id}
                aria-pressed={category === c.id}
                onClick={() => setCategory(c.id)}
              >
                {c.name}
              </button>
            ))}
          <button
            aria-label="التأثيرات المفضلة"
            aria-pressed={category === "favorites"}
            onClick={() => setCategory("favorites")}
          >
            <Heart size={13} />
            المفضلة
          </button>
        </div>
      </div>
      <div className={`effect-current ${clip ? "" : "no-selection"}`}>
        <span className="effect-status-dot" />
        <span>
          {clip
            ? selected
              ? effectById.get(selected)?.name || "الأصلي"
              : "بدون تأثير حركي"
            : "اختار مقطعًا من التايم لاين للتطبيق"}
        </span>
        {clip && (
          <button
            aria-label={kind === "filter" ? "إزالة الفلتر" : "إزالة التأثير"}
            onClick={() =>
              kind === "filter"
                ? onApply("original")
                : onSettings({ effect: "", effectIntensity: 1, effectSpeed: 1 })
            }
          >
            <RotateCcw size={13} />
          </button>
        )}
        {kind === "effect" && !!clip?.effect && (
          <button
            aria-label="ضبط التأثير"
            aria-expanded={showControls}
            onClick={() => setShowControls((s) => !s)}
          >
            <SlidersHorizontal size={14} />
            <ChevronDown size={12} />
          </button>
        )}
      </div>
      {kind === "effect" && !!clip?.effect && showControls && (
        <div className="effect-adjustments">
          <label>
            شدة التأثير{" "}
            <output>{Math.round((clip.effectIntensity ?? 1) * 100)}%</output>
            <input
              aria-label="شدة التأثير"
              type="range"
              min="0"
              max="1"
              step=".05"
              value={clip.effectIntensity ?? 1}
              onChange={(e) => onSettings({ effectIntensity: +e.target.value })}
            />
          </label>
          {effectById.get(clip.effect)?.animated !== false && (
            <label>
              سرعة الحركة <output>{clip.effectSpeed ?? 1}×</output>
              <input
                aria-label="سرعة التأثير"
                type="range"
                min=".25"
                max="2"
                step=".05"
                value={clip.effectSpeed ?? 1}
                onChange={(e) => onSettings({ effectSpeed: +e.target.value })}
              />
            </label>
          )}
        </div>
      )}
      <div className="effect-results-count">
        <span>
          {category === "favorites"
            ? "اختياراتك المفضلة"
            : "مختار بعناية لإبداعك"}
        </span>
        <b>{displayed.length} نتيجة</b>
      </div>
      <div className="live-effects-grid">
        {displayed.map((e) => (
          <LiveEffectCard
            key={e.id}
            effect={e}
            active={active === e.id}
            selected={selected === e.id}
            favorite={favorites.includes(e.id)}
            canAnimate={animateCards}
            onApply={onApply}
            onPreview={preview}
            onFavorite={favorite}
          />
        ))}
      </div>
      {!displayed.length && (
        <div className="effects-empty">
          <Search size={25} />
          <b>
            {category === "favorites"
              ? "مفضلتك لسه فاضية"
              : "مفيش نتائج بالاسم ده"}
          </b>
          <p>
            {category === "favorites"
              ? "اضغط القلب على أي كارت وارجعله هنا."
              : "جرّب اسم تاني أو ارجع لكل الأقسام."}
          </p>
          <button
            onClick={() => {
              setQuery("");
              setCategory("all");
            }}
          >
            عرض الكل
          </button>
        </div>
      )}
      <div className="catalog-footnote">
        <span className={animateCards ? "live-indicator" : ""} />
        {animateCards
          ? "شغّل كارت واحد للمعاينة • التطبيق منفصل عن المعاينة"
          : "معاينات ثابتة لتقليل الحمل والحركة"}
      </div>
    </section>
  );
}
