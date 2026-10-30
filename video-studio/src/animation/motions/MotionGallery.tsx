import { memo, useEffect, useState } from "react";
import { Play, Pause, Check } from "lucide-react";
import { motions, motionCategories } from "./index";
import type { MotionDefinition } from "./types";
import { useStudioSettings } from "../../settings/StudioSettings";
import scene from "../../effects/assets/scene.svg";
const Card = memo(function Card({
  motion,
  selected,
  active,
  onApply,
  onPreview,
}: {
  motion: MotionDefinition;
  selected: boolean;
  active: boolean;
  onApply: (id: string) => void;
  onPreview: (id: string) => void;
}) {
  const [p, setP] = useState(0.45);
  const { animateCards } = useStudioSettings();
  useEffect(() => {
    if (!active || !animateCards) return;
    let raf = 0,
      last = 0;
    const start = performance.now();
    const tick = (now: number) => {
      if (!document.hidden && now - last > 1000 / 24) {
        setP(((now - start) / 3000) % 1);
        last = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, animateCards]);
  const value = motion.sample(active && animateCards ? p : 0.45);
  return (
    <article
      className={`motion-card ${selected ? "selected" : ""}`}
      data-motion-id={motion.id}
    >
      <button
        className="motion-picture"
        aria-label={`تطبيق حركة ${motion.name}`}
        aria-pressed={selected}
        onClick={() => onApply(motion.id)}
      >
        <img
          src={scene}
          alt=""
          loading="lazy"
          style={{
            transform: `translate(${value.x}%,${value.y}%) scale(${value.scale})`,
            opacity: value.opacity,
          }}
        />
        {selected && <Check size={14} />}
      </button>
      <div>
        <span title={motion.name}>{motion.name}</span>
        <button
          disabled={!animateCards}
          aria-label={`${active ? "إيقاف معاينة حركة" : "معاينة حركة"} ${motion.name}`}
          onClick={() => onPreview(motion.id)}
        >
          {active ? <Pause size={12} /> : <Play size={12} />}
        </button>
      </div>
    </article>
  );
});
export function MotionGallery({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const [category, setCategory] = useState("all"),
    [query, setQuery] = useState(""),
    [active, setActive] = useState<string | null>(null);
  const shown = motions.filter(
    (m) =>
      (category === "all" || m.category === category) &&
      m.name.includes(query.trim()),
  );
  return (
    <section className="motion-gallery" aria-label="مكتبة الحركات">
      <input
        aria-label="البحث في الحركات"
        value={query}
        placeholder={`ابحث في ${motions.length} حركة…`}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(null);
        }}
      />
      <div className="motion-categories">
        {[
          { id: "all", name: `الكل ${motions.length}` },
          ...motionCategories,
        ].map((c) => (
          <button
            key={c.id}
            aria-pressed={category === c.id}
            onClick={() => {
              setCategory(c.id);
              setActive(null);
            }}
          >
            {c.name}
          </button>
        ))}
      </div>
      <div className="motion-grid">
        {shown.map((m) => (
          <Card
            key={m.id}
            motion={m}
            selected={m.id === value}
            active={active === m.id}
            onApply={onChange}
            onPreview={(id) => setActive((a) => (a === id ? null : id))}
          />
        ))}
      </div>
      {!shown.length && <p>لا توجد حركة بهذا الاسم.</p>}
    </section>
  );
}
