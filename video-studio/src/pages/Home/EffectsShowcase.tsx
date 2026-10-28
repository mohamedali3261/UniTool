import { m } from "motion/react";
import { ArrowUpLeft, Sparkles } from "lucide-react";
import sceneURL from "../../effects/assets/scene.svg";
import { effects } from "../../effects/registry";
export function EffectsShowcase({ onBrowse }: { onBrowse: () => void }) {
  return (
    <section className="home-section effects-showcase">
      <div className="section-heading">
        <div>
          <span className="eyebrow">
            <Sparkles size={13} /> THE FINISHING TOUCH
          </span>
          <h2>مش نفس المشهد. نفس حكايتك.</h2>
        </div>
        <button className="browse-effects" onClick={onBrowse}>
          {effects.length} فلتر وتأثير <ArrowUpLeft size={15} />
        </button>
      </div>
      <div className="showcase-grid">
        {[
          {
            id: "cinema",
            name: "روح السينما",
            tag: "CINEMATIC",
            css: "contrast(1.2) saturate(.75)",
            color: "#b4a0ed",
          },
          {
            id: "warm",
            name: "لحظة ذهبية",
            tag: "COLOR STORIES",
            css: "sepia(.35) saturate(1.3)",
            color: "#f7cf91",
          },
          {
            id: "mono",
            name: "أقل لون. أكثر إحساس.",
            tag: "MONOCHROME",
            css: "grayscale(1)",
            color: "#b9d5df",
          },
        ].map((item) => (
          <m.button
            key={item.id}
            className="showcase-card"
            onClick={onBrowse}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.985 }}
          >
            <img
              src={sceneURL}
              alt=""
              loading="lazy"
              decoding="async"
              style={{ filter: item.css }}
            />
            <span className="showcase-overlay" />
            <span className="showcase-tag" style={{ color: item.color }}>
              {item.tag}
            </span>
            <span className="showcase-info">
              <b>{item.name}</b>
              <span>
                اكتشف المكتبة <ArrowUpLeft size={15} />
              </span>
            </span>
          </m.button>
        ))}
      </div>
    </section>
  );
}
