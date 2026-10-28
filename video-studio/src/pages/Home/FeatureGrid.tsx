import { Scissors, Type, SlidersHorizontal, Music2 } from "lucide-react";
export function FeatureGrid({ onNew }: { onNew: (ratio?: string) => void }) {
  return (
    <section className="home-section">
      <div className="section-heading">
        <h2>كل أدواتك، في استوديو واحد.</h2>
        <span>بسيط في الاستخدام. كبير في الإمكانيات.</span>
      </div>
      <div className="features-row">
        {[
          [Scissors, "قص وتقسيم", "تحكم في كل ثانية"],
          [Type, "نصوص وملصقات", "ضيف لمستك الخاصة"],
          [SlidersHorizontal, "ألوان وفلاتر", "غيّر إحساس الصورة"],
          [Music2, "موسيقى وصوت", "خلّي لحظتك تتسمع"],
        ].map(([Icon, title, sub]: any) => (
          <button key={title} onClick={() => onNew()}>
            <Icon size={23} />
            <b>{title}</b>
            <span>{sub}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
