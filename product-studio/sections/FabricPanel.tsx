import { fabricTypes } from "../core/materials";
import { GradientControl } from "./GradientControl";
import { SlidersHorizontal, RotateCcw } from "lucide-react";
import { defaultAppearance, type Appearance } from "../core/fabric";
import type { Project } from "../core/model";
export function FabricPanel({
  project,
  onChange,
  ar,
}: {
  project: Project;
  onChange: (a: Appearance) => void;
  ar: boolean;
}) {
  const a = project.appearance;
  function slider(
    key: "wrinkles" | "texture" | "roughness" | "lightPower" | "lightAngle",
    arLabel: string,
    enLabel: string,
    min: number,
    max: number,
    step: number,
  ) {
    return (
      <label key={key}>
        {ar ? arLabel : enLabel}
        <output>
          {key === "lightAngle" ? `${a[key]}°` : a[key].toFixed(2)}
        </output>
        <input
          aria-label={ar ? arLabel : enLabel}
          type="range"
          min={min}
          max={max}
          step={step}
          value={a[key]}
          onChange={(e) => onChange({ ...a, [key]: +e.target.value })}
        />
      </label>
    );
  }
  return (
    <section className="ps-fabric-panel">
      <div className="ps-section-head">
        <SlidersHorizontal size={15} />
        <h2>{ar ? "الخامة والإضاءة" : "Fabric & lighting"}</h2>
      </div>
      <label>
        {ar ? "دقة المعاينة أثناء العمل" : "Working preview quality"}
        <select
          aria-label={
            ar ? "دقة المعاينة أثناء العمل" : "Working preview quality"
          }
          value={a.previewQuality ?? "auto"}
          onChange={(e) =>
            onChange({
              ...a,
              previewQuality: e.target.value as Appearance["previewQuality"],
            })
          }
        >
          <option value="auto">
            {ar ? "تلقائي خفيف" : "Adaptive lightweight"}
          </option>
          <option value="full">{ar ? "كاملة" : "Full"}</option>
          <option value="half">{ar ? "نصف" : "Half"}</option>
          <option value="quarter">{ar ? "ربع" : "Quarter"}</option>
        </select>
      </label>
      <small>
        {ar
          ? "تؤثر على المعاينة فقط؛ التصدير يحتفظ بالدقة التي تختارها."
          : "Preview only; exports keep their selected resolution."}
      </small>
      <label>
        {ar ? "نوع النسيج" : "Fabric type"}
        <select
          aria-label={ar ? "نوع النسيج" : "Fabric type"}
          value={a.material ?? "cotton"}
          onChange={(e) =>
            onChange({
              ...a,
              material: e.target.value as Appearance["material"],
            })
          }
        >
          {fabricTypes.map((m) => (
            <option key={m.id} value={m.id}>
              {ar ? m.ar : m.en}
            </option>
          ))}
        </select>
      </label>
      <label>
        {ar ? "حجم الغرز" : "Knit size"}
        <input
          aria-label={ar ? "حجم الغرز" : "Knit size"}
          type="range"
          min=".25"
          max="4"
          step=".05"
          value={a.knitSize ?? 1}
          onChange={(e) => onChange({ ...a, knitSize: +e.target.value })}
        />
      </label>
      <label>
        {ar ? "سطوع القماش" : "Fabric brightness"}
        <input
          aria-label={ar ? "سطوع القماش" : "Fabric brightness"}
          type="range"
          min=".5"
          max="1.5"
          step=".01"
          value={a.brightness ?? 1}
          onChange={(e) => onChange({ ...a, brightness: +e.target.value })}
        />
      </label>
      <GradientControl
        label={ar ? "تدرج القماش" : "Fabric gradient"}
        value={a.gradient}
        change={(gradient) => onChange({ ...a, gradient })}
        solid={project.color}
        ar={ar}
        radial={false}
      />
      <label>
        {ar ? "خلفية الاستوديو" : "Studio backdrop"}
        <select
          aria-label={ar ? "خلفية الاستوديو" : "Studio backdrop"}
          value={a.backdrop}
          onChange={(e) =>
            onChange({
              ...a,
              backdrop: e.target.value as Appearance["backdrop"],
            })
          }
        >
          <option value="studio">
            {ar ? "استوديو ناعم" : "Soft-focus studio"}
          </option>
          <option value="window">
            {ar ? "نافذة — خلفية" : "Window backdrop"}
          </option>
          <option value="blinds">
            {ar ? "ستائر — خلفية" : "Blinds backdrop"}
          </option>
          <option value="beam">{ar ? "شعاع — خلفية" : "Beam backdrop"}</option>
          <option value="arch">{ar ? "قوس — خلفية" : "Arch backdrop"}</option>
          <option value="solid">{ar ? "لون سادة" : "Solid color"}</option>
        </select>
      </label>
      <label>
        {ar ? "قصة القطعة" : "Garment fit"}
        <select
          aria-label={ar ? "قصة القطعة" : "Garment fit"}
          disabled={project.product === "tote"}
          value={a.fit}
          onChange={(e) =>
            onChange({ ...a, fit: e.target.value as Appearance["fit"] })
          }
        >
          <option value="regular">{ar ? "عادية" : "Regular"}</option>
          <option value="oversized">
            {ar ? "واسعة — Oversized" : "Oversized"}
          </option>
        </select>
      </label>
      <div className="ps-material-presets">
        {[
          {
            ar: "قطن",
            en: "Cotton",
            texture: 0.5,
            roughness: 0.95,
            wrinkles: 0.4,
          },
          {
            ar: "قطن ثقيل",
            en: "Heavy cotton",
            texture: 0.7,
            roughness: 1,
            wrinkles: 0.25,
          },
          {
            ar: "رياضي",
            en: "Sport",
            texture: 0.15,
            roughness: 0.55,
            wrinkles: 0.3,
          },
        ].map((p) => (
          <button
            key={p.en}
            onClick={() =>
              onChange({
                ...a,
                texture: p.texture,
                roughness: p.roughness,
                wrinkles: p.wrinkles,
              })
            }
          >
            {ar ? p.ar : p.en}
          </button>
        ))}
      </div>
      <label>
        {ar ? "وضعية الأكمام" : "Sleeve pose"}
        <select
          aria-label={ar ? "وضعية الأكمام" : "Sleeve pose"}
          disabled={!["hoodie", "sweatshirt"].includes(project.product)}
          value={a.pose}
          onChange={(e) =>
            onChange({ ...a, pose: e.target.value as Appearance["pose"] })
          }
        >
          <option value="pockets">
            {ar ? "أكمام منحنية للداخل" : "Inward-bent sleeves"}
          </option>
          <option value="relaxed">
            {ar ? "وضعية مسترخية" : "Relaxed sleeves"}
          </option>
        </select>
      </label>
      {slider("wrinkles", "ثنيات القماش", "Fabric wrinkles", 0, 1, 0.01)}
      {slider("texture", "نسيج القماش", "Fabric texture", 0, 1, 0.01)}
      {slider("roughness", "خشونة الخامة", "Roughness", 0.2, 1, 0.01)}
      <div className="ps-subhead">
        <h3>{ar ? "الإضاءة الرئيسية" : "Key light"}</h3>
      </div>
      {slider("lightAngle", "زاوية الإضاءة", "Light angle", -180, 180, 1)}
      {slider("lightPower", "قوة الإضاءة", "Light power", 0.5, 5, 0.1)}
      <button
        className="ps-full-button"
        onClick={() => onChange({ ...defaultAppearance })}
      >
        <RotateCcw size={13} />
        {ar ? "إعدادات افتراضية" : "Reset appearance"}
      </button>
    </section>
  );
}
