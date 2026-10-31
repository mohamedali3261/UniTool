/** نماذج توضيحية تعرض نفس عناصر المشروع الحالي. */
import { useState } from "react";
import { useDesigner } from "./state";
import { ProjectGraphic } from "./render";
import { kitVariant } from "./export-tools";
const scenes = [
  ["card", "كارت عمل", "Business card"],
  ["sign", "لافتة", "Store sign"],
  ["mug", "مج", "Coffee mug"],
  ["shirt", "تيشيرت", "T-shirt"],
  ["bag", "شنطة", "Shopping bag"],
  ["box", "علبة منتج", "Product box"],
  ["social", "غلاف اجتماعي", "Social cover"],
];
export default function Mockups() {
  const s = useDesigner(),
    [scene, setScene] = useState("card"),
    [surface, setSurface] = useState("#f8f6ef"),
    p = kitVariant(s.doc, "square");
  return (
    <section className="ld-section">
      <p className="ld-eyebrow">OUT OF THE CANVAS</p>
      <h2>{s.t("تخيّلها في الحقيقة.", "Picture it out there.")}</h2>
      <p>
        {s.t(
          "نماذج توضيحية متجهة تعرض تصميمك الحالي مباشرة، وليست صورًا فوتوغرافية.",
          "Illustrative vector mockups update with your actual design. Not photographic renders.",
        )}
      </p>
      <div className="ld-chips">
        {scenes.map(([id, ar, en]) => (
          <button
            key={id}
            aria-pressed={scene === id}
            onClick={() => setScene(id)}
          >
            {s.t(ar, en)}
          </button>
        ))}
      </div>
      <div className={"ld-mockup ld-mockup-" + scene}>
        <div className="ld-mockup-object" style={{ background: surface }}>
          {scene === "shirt" && <span className="ld-neck" />}
          <svg viewBox={`0 0 ${p.width} ${p.height}`}>
            <ProjectGraphic project={p} prefix={"mockup-" + scene} />
          </svg>
          {scene === "card" && (
            <div className="ld-card-info">
              HELLO@YOURBRAND.COM
              <br />
              YOURBRAND.COM
            </div>
          )}
        </div>
      </div>
      <label className="ld-field">
        {s.t("لون الخامة", "Surface color")}
        <input
          type="color"
          value={surface}
          onChange={(e) => setSurface(e.target.value)}
        />
      </label>
      <p>
        {s.t(
          "لتنزيل الشعار أو نسخ استخدامه المختلفة، افتح التصدير من الشريط العلوي.",
          "Open Export in the top bar for logo downloads and layout variants.",
        )}
      </p>
    </section>
  );
}
