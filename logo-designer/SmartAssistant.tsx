/** اقتراحات محلية صريحة؛ لا استدعاء لخدمة ذكاء اصطناعي. */
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useDesigner } from "./state";
import { templates, templateProject } from "./templates";
import { ProjectGraphic } from "./render";
import type { Project } from "./types";
export default function SmartAssistant() {
  const s = useDesigner(),
    [name, setName] = useState(""),
    [industry, setIndustry] = useState("tech"),
    [color, setColor] = useState("#6c5ce7"),
    [ideas, setIdeas] = useState<Project[]>([]);
  return (
    <section className="ld-section">
      <p className="ld-eyebrow">A CREATIVE SPARK</p>
      <h2>{s.t("خلّي الفكرة تبدأ.", "Find your direction.")}</h2>
      <p>
        {s.t(
          "مساعد اقتراحات محلي، من غير إرسال بيانات أو توليد صور خارجي. بيركّب رموز وخطوط وألوان قابلة للتعديل.",
          "A local design assistant, not a remote AI image generator. It pairs editable marks, typography and colors without uploading your data.",
        )}
      </p>
      <label className="ld-field">
        {s.t("اسم النشاط", "Business name")}
        <input
          value={name}
          maxLength={80}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <label className="ld-field">
        {s.t("المجال", "Industry")}
        <select value={industry} onChange={(e) => setIndustry(e.target.value)}>
          {[
            ["tech", "تقنية", "Technology"],
            ["food", "مطعم أو مقهى", "Food & coffee"],
            ["estate", "عقارات", "Real estate"],
            ["brand", "عطور وأزياء", "Lifestyle"],
            ["sport", "رياضة", "Sport"],
            ["nature", "طبيعة", "Nature"],
          ].map(([id, ar, en]) => (
            <option key={id} value={id}>
              {s.t(ar, en)}
            </option>
          ))}
        </select>
      </label>
      <label className="ld-field">
        {s.t("اللون المفضل", "Preferred color")}
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
      </label>
      <button
        className="ld-primary ld-full"
        disabled={!name.trim()}
        onClick={() =>
          setIdeas(
            templates
              .filter((t) => t.category === industry)
              .slice(0, 3)
              .map((t) =>
                templateProject(t, s.lang, name.trim(), [
                  "#1e293b",
                  color,
                  "#ffffff",
                ]),
              ),
          )
        }
      >
        <Sparkles size={17} />
        {s.t("اقترح 3 اتجاهات", "Suggest 3 directions")}
      </button>
      {ideas.map((p, i) => (
        <button
          className="ld-idea"
          key={i}
          onClick={() => {
            if (
              s.doc.nodes.length &&
              !confirm(
                s.t(
                  "تطبيق الاقتراح بدل التصميم الحالي؟",
                  "Apply this direction instead of the current design?",
                ),
              )
            )
              return;
            s.commit((old) => ({ ...structuredClone(p), id: old.id }));
            s.setSelected([]);
          }}
        >
          <svg viewBox="0 0 800 600">
            <ProjectGraphic project={p} prefix={`idea-${i}`} />
          </svg>
          <span>
            {s.t("استخدم الاتجاه", "Use direction")} {i + 1} ↗
          </span>
          <small>
            {p.nodes.find((n) => n.kind === "text")?.font} + {color}
          </small>
        </button>
      ))}
    </section>
  );
}
