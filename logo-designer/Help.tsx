/** جولة بداية قصيرة ودليل للاختصارات وإيماءات اللمس. */
import { useState } from "react";
import { useDesigner } from "./state";
import { Modal } from "./ui";
export default function Help() {
  const s = useDesigner(),
    [step, setStep] = useState(0);
  const steps = [
    [
      s.t("ابدأ بفكرة", "Start with an idea"),
      s.t(
        "اختار قالب قابل للتعديل أو ابني من مكتبة الرموز والأشكال.",
        "Choose an editable template or build from the symbol library.",
      ),
    ],
    [
      s.t("خلّيها بصمتك", "Make it yours"),
      s.t(
        "اسحب العناصر، حرّك مقبض الحجم، وعدّل النص والألوان من الأدوات والخصائص. Shift للاختيار المتعدد.",
        "Drag elements, resize with the handle, and adjust text and colors in the panels. Shift selects multiple items.",
      ),
    ],
    [
      s.t("خدها للعالم", "Take it to the world"),
      s.t(
        "جرّب النماذج. احفظ نسخة JSON؛ نزّل SVG بخطوط مضمّنة أو حزمة العلامة كاملة.",
        "Try the mockups. Back up JSON; download a font-embedded SVG or the complete brand kit.",
      ),
    ],
  ];
  return (
    <Modal
      title={s.t("دليل سريع لمساحة إبداعك", "A little guide to your workspace")}
    >
      <div className="ld-help">
        <p className="ld-eyebrow">{step + 1} / 3 — A GOOD PLACE TO START</p>
        <h3>{steps[step][0]}</h3>
        <p>{steps[step][1]}</p>
        <div className="ld-tour-dots">
          {steps.map((_, i) => (
            <button
              key={i}
              aria-label={s.t("خطوة ", "Step ") + (i + 1)}
              aria-pressed={i === step}
              onClick={() => setStep(i)}
            />
          ))}
        </div>
        <button
          className="ld-primary"
          onClick={() => {
            if (step < 2) setStep(step + 1);
            else {
              s.setModal(null);
              try {
                localStorage.setItem("logo-designer-tour", "done");
              } catch {}
            }
          }}
        >
          {step < 2 ? s.t("التالي", "Next") : s.t("يلا نصمّم", "Let’s design")}
        </button>
        <hr />
        <h3>{s.t("اختصارات مفيدة", "Useful shortcuts")}</h3>
        <dl>
          {[
            ["Ctrl / ⌘ + Z", s.t("تراجع", "Undo")],
            ["Ctrl / ⌘ + Shift + Z", s.t("إعادة", "Redo")],
            ["Ctrl / ⌘ + S", s.t("حفظ", "Save")],
            [
              "Ctrl / ⌘ + C / X / V",
              s.t("نسخ / قص / لصق داخل المحرر", "Copy / cut / paste in editor"),
            ],
            ["Shift + F10", s.t("قائمة العنصر", "Element context menu")],
            ["Ctrl / ⌘ + D", s.t("نسخ العناصر", "Duplicate selection")],
            ["Ctrl / ⌘ + A", s.t("تحديد الكل", "Select all")],
            [
              "Delete / Backspace",
              s.t("حذف بعد التأكيد", "Delete with confirmation"),
            ],
            [
              "↑ ↓ ← →",
              s.t("تحريك 1، مع Shift تحريك 10", "Nudge 1; Shift nudges 10"),
            ],
            ["H / V", s.t("تحريك اللوحة / اختيار", "Pan / select")],
            ["Escape", s.t("إلغاء التحديد", "Deselect")],
          ].map(([key, label]) => (
            <div key={key}>
              <dt>
                <kbd>{key}</kbd>
              </dt>
              <dd>{label}</dd>
            </div>
          ))}
        </dl>
        <p>
          {s.t(
            "العجلة لتحريك اللوحة، Ctrl مع العجلة للتكبير، أو بإصبعين على شاشة اللمس. الحفظ تلقائي محلي؛ لا يوجد رفع لبياناتك.",
            "Wheel to pan, Ctrl + wheel to zoom, or pinch on touch screens. Autosave is local; your data is not uploaded.",
          )}
        </p>
      </div>
    </Modal>
  );
}
