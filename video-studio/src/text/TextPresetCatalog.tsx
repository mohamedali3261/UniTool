import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Search, Play, Pause, Plus } from "lucide-react";
import { drawFrame } from "../lib/media";
import { blankProject } from "../types";
import { useStudioSettings } from "../settings/StudioSettings";
import { textPresets, textCategories } from "./presets";
import type { TextPreset } from "./presets/types";

const PresetCard = memo(function PresetCard({
  preset,
  active,
  disabled,
  canAnimate,
  onPreview,
  onAdd,
}: {
  preset: TextPreset;
  active: boolean;
  disabled: boolean;
  canAnimate: boolean;
  onPreview: (id: string) => void;
  onAdd: (preset: TextPreset) => void;
}) {
  const root = useRef<HTMLElement>(null),
    canvas = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => setVisible(e.isIntersecting),
      { rootMargin: "40px" },
    );
    if (root.current) observer.observe(root.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!visible) return;
    let frame = 0,
      last = 0;
    const started = performance.now();
    const paint = (t: number) => {
      const ctx = canvas.current?.getContext("2d");
      if (!ctx) return;
      drawFrame(
        ctx,
        null,
        {
          ...blankProject(),
          texts: [
            {
              id: preset.id,
              text: preset.text,
              start: 0,
              end: 4,
              ...preset.style,
              // A thumbnail is a type specimen, not a miniature full video frame.
              size: Math.min(160, preset.style.size * 2.3),
              x: 50,
              y: 45,
            },
          ],
        },
        t,
      );
    };
    const tick = (now: number) => {
      if (now - last > 1000 / 24) {
        paint(((now - started) / 1000) % 4);
        last = now;
      }
      frame = requestAnimationFrame(tick);
    };
    const start = () => {
      cancelAnimationFrame(frame);
      paint(1.8);
      if (active && canAnimate && !document.hidden)
        frame = requestAnimationFrame(tick);
    };
    start();
    document.addEventListener("visibilitychange", start);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", start);
    };
  }, [visible, active, canAnimate, preset]);
  return (
    <article
      ref={root}
      className={`text-preset-card ${active ? "is-playing" : ""}`}
      data-text-preset={preset.id}
      style={{ "--preset-accent": preset.style.color } as React.CSSProperties}
    >
      <button
        className="text-preset-picture"
        onClick={() => onAdd(preset)}
        disabled={disabled}
        aria-label={`إضافة قالب ${preset.name}`}
        title={preset.text}
      >
        <canvas ref={canvas} width={320} height={190} aria-hidden="true" />
        <span className="text-preset-motion">
          {preset.style.animationIn === "none" ? "ثابت" : "متحرك"}
        </span>
      </button>
      <div className="text-preset-caption">
        <button
          onClick={() => onAdd(preset)}
          disabled={disabled}
          aria-label={`اختيار قالب ${preset.name}`}
        >
          <span>{preset.name}</span>
          <Plus size={13} />
        </button>
        <button
          className="text-preset-preview"
          disabled={!canAnimate}
          aria-label={`${active ? "إيقاف معاينة" : "معاينة قالب"} ${preset.name}`}
          aria-pressed={active}
          onClick={() => onPreview(preset.id)}
        >
          {active ? <Pause size={13} /> : <Play size={13} />}
        </button>
      </div>
    </article>
  );
});
export function TextPresetCatalog({
  disabled,
  suspended = false,
  onAdd,
}: {
  disabled: boolean;
  suspended?: boolean;
  onAdd: (preset: TextPreset) => void;
}) {
  const { animateCards } = useStudioSettings();
  const canAnimate = animateCards && !suspended;
  const preview = useCallback(
    (id: string) => setActive((current) => (current === id ? null : id)),
    [],
  );
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState("all"),
    [active, setActive] = useState<string | null>(null);
  const displayed = textPresets.filter(
    (p) =>
      (category === "all" || p.category === category) &&
      `${p.name} ${p.text}`.includes(query.trim()),
  );
  return (
    <section className="text-preset-catalog" aria-label="مكتبة قوالب النصوص">
      <div className="text-preset-search">
        <Search size={14} />
        <input
          aria-label="البحث في قوالب النصوص"
          placeholder="ابحث عن عنوان أو فكرة…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div
        className="text-preset-categories"
        role="group"
        aria-label="تصنيفات النصوص"
      >
        {[{ id: "all", name: "الكل" }, ...textCategories].map((c) => (
          <button
            key={c.id}
            aria-pressed={category === c.id}
            onClick={() => {
              setCategory(c.id);
              setActive(null);
            }}
          >
            {c.name}
            <small>
              {c.id === "all"
                ? textPresets.length
                : textPresets.filter((p) => p.category === c.id).length}
            </small>
          </button>
        ))}
      </div>
      <p className="text-preset-count" role="status">
        {displayed.length} قالب مختلف · النص والتنسيق والحركة قابلة للتعديل
      </p>
      <div className="text-preset-grid">
        {displayed.map((p) => (
          <PresetCard
            key={p.id}
            preset={p}
            active={active === p.id && canAnimate}
            canAnimate={canAnimate}
            disabled={disabled}
            onAdd={onAdd}
            onPreview={preview}
          />
        ))}
      </div>
      {!displayed.length && (
        <div className="text-preset-empty">
          مفيش قوالب بالبحث ده.
          <button
            onClick={() => {
              setQuery("");
              setCategory("all");
            }}
          >
            عرض كل القوالب
          </button>
        </div>
      )}
    </section>
  );
}
