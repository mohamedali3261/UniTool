/** إعدادات النص تُحدّث الطبقات الحقيقية مباشرة. */
import { Type, Plus } from "lucide-react";
import { useDesigner } from "./state";
import { fonts } from "./fonts";
import { NumberField } from "./ui";
export default function TextSection() {
  const s = useDesigner(),
    n = s.doc.nodes.find((n) => s.selected.includes(n.id) && n.kind === "text");
  return (
    <section className="ld-section">
      <p className="ld-eyebrow">WORDS WITH CHARACTER</p>
      <h2>{s.t("حروف ليها شخصية.", "Type with character.")}</h2>
      <button
        className="ld-add-type"
        onClick={() =>
          s.add([
            {
              kind: "text",
              name: s.t("اسم العلامة", "Brand name"),
              text: s.t("اسم علامتك", "YOUR BRAND"),
              w: 430,
              h: 95,
              fontSize: 60,
              fill: "#263e48",
            },
          ])
        }
      >
        <Type size={26} />
        {s.t("أضف اسم الشركة", "Add brand name")}
        <Plus size={16} />
      </button>
      <button
        className="ld-secondary"
        onClick={() =>
          s.add([
            {
              kind: "text",
              name: s.t("الشعار اللفظي", "Tagline"),
              text: s.t("حكايتك تبدأ هنا", "YOUR STORY STARTS HERE"),
              fontSize: 24,
              w: 400,
              h: 50,
              y: s.doc.height / 2 + 100,
              fill: "#588778",
            },
          ])
        }
      >
        {s.t("＋ أضف الشعار اللفظي", "＋ Add a tagline")}
      </button>
      {n ? (
        <>
          <label className="ld-field">
            {s.t("النص", "Content")}
            <textarea
              aria-label={s.t("محتوى النص", "Text content")}
              value={n.text}
              maxLength={3000}
              onChange={(e) => s.patch({ text: e.target.value })}
            />
          </label>
          <label className="ld-field">
            {s.t("الخط", "Font")}
            <select
              aria-label={s.t("الخط", "Font")}
              value={n.font}
              onChange={(e) => s.patch({ font: e.target.value })}
            >
              {fonts.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>
          <div className="ld-two">
            <NumberField
              label={s.t("حجم الخط", "Font size")}
              min={4}
              max={600}
              value={n.fontSize}
              onChange={(fontSize) => s.patch({ fontSize })}
            />
            <label className="ld-field">
              {s.t("الوزن", "Weight")}
              <select
                value={n.weight}
                onChange={(e) => s.patch({ weight: +e.target.value })}
              >
                {[400, 700].map((w) => (
                  <option key={w}>{w}</option>
                ))}
              </select>
            </label>
            <NumberField
              label={s.t("تباعد الحروف", "Letter spacing")}
              value={n.spacing}
              min={-20}
              max={80}
              step={0.5}
              onChange={(spacing) => s.patch({ spacing })}
            />
            <NumberField
              label={s.t("ارتفاع السطر", "Line height")}
              value={n.lineHeight}
              min={0.5}
              max={4}
              step={0.1}
              onChange={(lineHeight) => s.patch({ lineHeight })}
            />
          </div>
          <label className="ld-field">
            {s.t("محاذاة النص", "Text alignment")}
            <select
              value={n.align}
              onChange={(e) =>
                s.patch({ align: e.target.value as typeof n.align })
              }
            >
              <option value="start">{s.t("بداية", "Start")}</option>
              <option value="middle">{s.t("وسط", "Center")}</option>
              <option value="end">{s.t("نهاية", "End")}</option>
            </select>
          </label>
          <NumberField
            label={s.t("انحناء النص على مسار", "Text curve")}
            value={n.curve}
            min={-100}
            max={100}
            onChange={(curve) => s.patch({ curve })}
          />
          <p>
            {s.t(
              "الظل والحدود والتدرجات من الألوان والخصائص. الانحناء مناسب لسطر واحد.",
              "Shadow, outline and gradients live in Colors and Properties. Curved text uses a single line.",
            )}
          </p>
        </>
      ) : (
        <p className="ld-empty">
          {s.t(
            "اختار طبقة نص لتعديل خطها وتأثيراتها.",
            "Select a text layer to edit its typography.",
          )}
        </p>
      )}
      <div className="ld-font-samples">
        {fonts.map((f) => (
          <button
            key={f.id}
            style={{ fontFamily: f.id }}
            onClick={() =>
              n
                ? s.patch({ font: f.id })
                : s.add([
                    {
                      kind: "text",
                      font: f.id,
                      name: f.name,
                      text: s.t("علامة تستحق", "Make a mark"),
                      w: 430,
                      h: 90,
                      fill: "#263e48",
                    },
                  ])
            }
          >
            {f.name}
            <span>{s.t("حروف تصنع الفرق", "Make your mark")}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
