import { ArrowUpLeft, Film } from "lucide-react";
export function FormatGallery({ onNew }: { onNew: (ratio?: string) => void }) {
  return (
    <section className="home-section" id="formats">
      <div className="section-heading">
        <div>
          <span className="eyebrow">مظبوط على مقاس فكرتك</span>
          <h2>منصتك، مقاسك.</h2>
        </div>
        <span>اختار المقاس وابدأ على طول</span>
      </div>
      <div className="format-grid">
        {[
          {
            r: "9:16",
            name: "ريلز وستوري",
            sub: "Instagram · TikTok",
            class: "portrait",
            color: "peach",
          },
          {
            r: "16:9",
            name: "فيديو يوتيوب",
            sub: "YouTube · Presentations",
            class: "wide",
            color: "lavender",
          },
          {
            r: "1:1",
            name: "بوست سوشيال",
            sub: "Instagram · Facebook",
            class: "square",
            color: "green",
          },
          {
            r: "4:5",
            name: "فيديو بورتريه",
            sub: "Portrait · Social ads",
            class: "tall",
            color: "blue",
          },
        ].map((f) => (
          <button
            className={`format-card ${f.color}`}
            key={f.r}
            onClick={() => onNew(f.r)}
          >
            <div className="format-top">
              <span>{f.r}</span>
              <ArrowUpLeft size={18} />
            </div>
            <div className={`format-illustration ${f.class}`}>
              <Film size={24} />
              <div />
            </div>
            <h3>{f.name}</h3>
            <p>{f.sub}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
