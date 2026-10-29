import { memo, useEffect, useRef, useState } from "react";
import { m } from "motion/react";
import { Heart, Play, Pause, Check, Plus } from "lucide-react";
import type { EffectDefinition } from "../types";
import { categories } from "../registry";
import { drawFrame } from "../../lib/media";
import { blankProject, type Clip } from "../../types";
import sceneURL from "../assets/scene.svg";
let sample: Promise<HTMLImageElement> | undefined;
function scene() {
  return (sample ??= new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => {
      sample = undefined;
      reject(new Error("sample unavailable"));
    };
    image.src = sceneURL;
  }));
}
type Props = {
  effect: EffectDefinition;
  active: boolean;
  selected: boolean;
  favorite: boolean;
  canAnimate: boolean;
  onApply: (id: string) => void;
  onPreview: (id: string) => void;
  onFavorite: (id: string) => void;
};
export const LiveEffectCard = memo(function LiveEffectCard({
  effect,
  active,
  selected,
  favorite,
  canAnimate,
  onApply,
  onPreview,
  onFavorite,
}: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const root = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!root.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "40px" },
    );
    observer.observe(root.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!visible) return;
    let frame = 0;
    let disposed = false;
    let image: HTMLImageElement | undefined;
    const started = performance.now();
    let last = 0;
    const paint = (seconds: number) => {
      const ctx = canvas.current?.getContext("2d");
      if (!ctx || !image) return;
      const clip: Clip = {
        id: "sample",
        assetId: "sample",
        start: 0,
        end: 5,
        speed: 1,
        brightness: 1,
        contrast: 1,
        saturation: 1,
        volume: 0,
        zoom: 1.045 + Math.sin(seconds * 0.7) * 0.02,
        filter: effect.kind === "filter" ? effect.id : "original",
        effect: effect.kind === "effect" ? effect.id : undefined,
      };
      const p = { ...blankProject(), clips: [clip] };
      const phase = seconds % 10;
      drawFrame(ctx, image, p, phase <= 5 ? phase : 10 - phase, clip);
    };
    const tick = (now: number) => {
      if (disposed) return;
      if (!document.hidden && now - last >= 1000 / 24) {
        last = now;
        paint((now - started) / 1000);
      }
      frame = requestAnimationFrame(tick);
    };
    const start = () => {
      cancelAnimationFrame(frame);
      paint(1.8);
      if (active && canAnimate && !document.hidden)
        frame = requestAnimationFrame(tick);
    };
    void scene()
      .then((img) => {
        if (disposed) return;
        image = img;
        start();
      })
      .catch(() => {});
    document.addEventListener("visibilitychange", start);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", start);
    };
  }, [effect, active, visible, canAnimate]);
  const category = categories.find((c) => c.id === effect.category)!;
  return (
    <m.article
      ref={root}
      data-effect-id={effect.id}
      title={`${effect.name} — ${effect.description}`}
      className={`live-effect-card ${selected ? "is-selected" : ""} ${active && canAnimate ? "is-playing" : ""}`}
      style={{ "--effect-accent": category.color } as React.CSSProperties}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="effect-picture">
        <button
          className="effect-apply-picture"
          aria-label={`تطبيق ${effect.name}`}
          aria-pressed={selected}
          onClick={() => onApply(effect.id)}
        >
          <canvas ref={canvas} width={240} height={158} aria-hidden="true" />
          <span className="effect-picture-shade" />
          <span className="effect-category-tag">{category.en}</span>
          {selected && (
            <span className="effect-check">
              <Check size={13} />
            </span>
          )}
        </button>
        <button
          className={`effect-favorite ${favorite ? "is-favorite" : ""}`}
          aria-label={`${favorite ? "إزالة" : "إضافة"} ${effect.name} ${favorite ? "من" : "إلى"} المفضلة`}
          aria-pressed={favorite}
          onClick={() => onFavorite(effect.id)}
        >
          <Heart size={14} fill={favorite ? "currentColor" : "none"} />
        </button>
        <button
          className="effect-preview-button"
          aria-label={`${active ? "إيقاف معاينة" : "معاينة"} ${effect.name}`}
          aria-pressed={active}
          disabled={!canAnimate}
          title={
            canAnimate ? "معاينة متحركة" : "فعّل حركة الكروت من إعدادات الأداء"
          }
          onClick={() => onPreview(effect.id)}
        >
          {active && canAnimate ? <Pause size={13} /> : <Play size={13} />}
          <span>{active && canAnimate ? "حيّ" : "معاينة"}</span>
        </button>
      </div>
      <button
        className="effect-card-info"
        onClick={() => onApply(effect.id)}
        aria-label={`اختيار تأثير ${effect.name}`}
      >
        <span>
          <b>{effect.name}</b>
          <small>{effect.description}</small>
        </span>
        {selected ? <Check size={14} /> : <Plus size={14} />}
      </button>
    </m.article>
  );
});
