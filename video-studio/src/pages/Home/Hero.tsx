import { m } from "motion/react";
import { Plus, ArrowLeft, Scissors, Sparkles } from "lucide-react";
export function Hero({ onNew }: { onNew: (ratio?: string) => void }) {
  return (
    <m.section
      className="hero"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="hero-copy">
        <span className="eyebrow">
          <span /> من الفكرة… لآخر فريم
        </span>
        <h1>
          حكايتك تستاهل
          <br />
          <em>تتعمل صح.</em>
        </h1>
        <p>
          قص، ركّب، لوّن وضيف صوتك. استوديو متكامل
          <br className="desktop-only" /> يحوّل لحظاتك لفيديوهات تستاهل تتشاف.
        </p>
        <button className="primary large" onClick={() => onNew()}>
          <Plus size={20} /> ابدأ مشروع جديد <ArrowLeft size={18} />
        </button>
        <span className="hero-note">مجاني • بدون تسجيل • بدون علامة مائية</span>
      </div>
      <div className="hero-art" aria-hidden="true">
        <div className="art-orbit" />
        <div className="art-frame">
          <div className="mini-dots">
            <i />
            <i />
            <i />
            <span>YOUR NEXT STORY</span>
          </div>
          <div className="landscape">
            <div className="sun" />
            <div className="mountain m1" />
            <div className="mountain m2" />
            <div className="mountain m3" />
            <span>
              MAKE
              <br />
              <b>IT YOURS.</b>
            </span>
            <div className="landscape-caption">
              A LITTLE MOMENT. A BIG STORY.
            </div>
          </div>
          <div className="mini-timeline">
            <div />
            <div />
            <div />
            <div />
          </div>
        </div>
        <div className="float-label float-one">
          <Scissors size={16} /> كل فريم بيفرق
        </div>
        <div className="float-label float-two">
          <Sparkles size={16} /> مساحة لإبداعك
        </div>
        <div className="art-star">✳</div>
      </div>
    </m.section>
  );
}
