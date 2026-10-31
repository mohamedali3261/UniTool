import { NovaShowcase } from "./nova/Showcase";
import "./nova/styles.css";
import { templates } from "./index";
import type { StudioTemplate } from "./types";
export function TemplateGallery({
  onUse,
  busy,
}: {
  onUse: (template: StudioTemplate) => void;
  busy: boolean;
}) {
  return (
    <section className="studio-template-gallery" aria-label="قوالب الفيديو">
      <div className="section-heading">
        <div>
          <span>ابدأ بفكرة جاهزة</span>
          <h2>قالب جاهز… ولمستك تكمله.</h2>
        </div>
      </div>
      <p className="muted">
        خلفيات تصميمية محلية ونصوص وانتقالات قابلة للتعديل. استبدل الخلفيات من
        خصائص المقطع بملفاتك أو لقطات Pexels.
      </p>
      <NovaShowcase onUse={onUse} busy={busy} />
      <div className="template-cards">
        {templates.map((t, i) => (
          <button
            disabled={busy}
            key={t.id}
            className={`template-card ${t.id === "nova" ? "template-nova" : ""}`}
            onClick={() => onUse(t)}
            style={{
              background: `linear-gradient(145deg,${t.colors[0]},#11171e)`,
              borderColor: t.colors[1] + "66",
            }}
          >
            <div className="template-art" style={{ color: t.colors[1] }}>
              <span>
                0{i + 1} / {t.ratio}
              </span>
              {t.id === "nova" && (
                <strong className="nova-wordmark">NOVA</strong>
              )}
              <b>{t.scenes[0].text}</b>
              <i>◇ ───── ◇</i>
            </div>
            {t.id === "nova" && (
              <div className="nova-features">
                ♫ موسيقى أصلية · انتقالات مسموعة · ٦ مشاهد
              </div>
            )}
            <h3>{t.name}</h3>
            <p>{t.description}</p>
            <span>استخدم القالب ↗</span>
          </button>
        ))}
      </div>
    </section>
  );
}
