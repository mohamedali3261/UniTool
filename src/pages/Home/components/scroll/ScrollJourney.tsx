import type { CSSProperties } from "react";
import { ArrowUpLeft, ArrowDown, MoveDownRight } from "lucide-react";
import type { Language } from "../../data";
import { scrollChapters } from "./chapters";
import { ChapterArt } from "./ChapterArt";
import "./scroll.css";
export function ScrollJourney({ lang }: { lang: Language }) {
  const ar = lang === "ar";
  return (
    <section className="scroll-journey" aria-labelledby="journey-title">
      <div className="journey-intro home-container" data-scroll-scene>
        <span className="section-eyebrow">
          ONE SCROLL. EIGHT POSSIBILITIES.
        </span>
        <h2 id="journey-title">
          {ar
            ? "اسحب. وشوف فكرتك بتتكوّن."
            : "Scroll. Watch possibilities take shape."}
        </h2>
        <p>
          {ar
            ? "كل مساحة لها عالمها. اكتشفهم، حركة ورا حركة."
            : "Every workspace has a world of its own. Discover them, one movement at a time."}
        </p>
        <ArrowDown size={28} aria-hidden="true" />
      </div>
      <nav
        className="journey-nav"
        aria-label={ar ? "فصول رحلة الأدوات" : "Workspace journey chapters"}
      >
        {scrollChapters.map((s, i) => (
          <a
            key={s.id}
            href={`#journey-${s.id}`}
            style={{ "--chapter-ink": s.color } as CSSProperties}
          >
            <span>{String(i + 1).padStart(2, "0")}</span>
            {ar
              ? [
                  "الأدوات",
                  "PDF",
                  "الجداول",
                  "التصميم",
                  "الفيديو",
                  "SVG",
                  "الشعارات",
                  "الصوت",
                ][i]
              : [
                  "Tools",
                  "PDF",
                  "Sheets",
                  "Design",
                  "Video",
                  "SVG",
                  "Logos",
                  "Audio",
                ][i]}
          </a>
        ))}
      </nav>
      <div className="journey-chapters">
        {scrollChapters.map((s, i) => (
          <article
            key={s.id}
            id={`journey-${s.id}`}
            className={`journey-chapter chapter-${s.id}`}
            data-scroll-scene
            style={{ "--chapter-ink": s.color } as CSSProperties}
            aria-labelledby={`journey-heading-${s.id}`}
          >
            <div className="journey-stage">
              <div className="chapter-watermark" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className="journey-copy">
                <span className="journey-kicker">{s.tag}</span>
                <h2 id={`journey-heading-${s.id}`}>{ar ? s.ar : s.en}</h2>
                <p>{ar ? s.bodyAr : s.bodyEn}</p>
                <a className="journey-open" href={s.href}>
                  {ar ? s.actionAr : s.actionEn}
                  <ArrowUpLeft size={22} />
                </a>
                <span className="journey-next">
                  <MoveDownRight size={16} />
                  {ar
                    ? "كمّل السحب، الحكاية لسه بتبدأ."
                    : "Keep scrolling. There is more to create."}
                </span>
              </div>
              <div className="journey-visual">
                <ChapterArt kind={s.id} />
                <span className="journey-visual-label">
                  {String(i + 1).padStart(2, "0")} — BUILT FOR YOUR NEXT IDEA
                </span>
              </div>
              <div className="chapter-progress" aria-hidden="true">
                <i />
              </div>
              <span className="chapter-footnote" aria-hidden="true">
                UNITOOL / CREATIVE WORKSPACES / {String(i + 1).padStart(2, "0")}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
