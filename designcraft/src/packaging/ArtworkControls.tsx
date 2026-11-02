import { ART_STYLES, type ArtworkOptions } from "./artwork";
export function ArtworkControls({
  ar,
  value,
  onChange,
}: {
  ar: boolean;
  value: ArtworkOptions;
  onChange: (o: ArtworkOptions) => void;
}) {
  return (
    <section
      className="carton-art-controls"
      tabIndex={-1}
      aria-label={ar ? "تصميم القالب" : "Template artwork"}
    >
      <div className="carton-section-title">
        <span>02</span>
        <div>
          <h3>{ar ? "هوية تستحق الظهور" : "Make it unmistakable"}</h3>
          <p>
            {ar
              ? "اختر طابعًا، ثم اجعله علامتك الخاصة."
              : "Choose a look. Make it your own."}
          </p>
        </div>
      </div>
      <div className="carton-style-grid">
        {Object.entries(ART_STYLES).map(([key, t]) => (
          <button
            type="button"
            key={key}
            aria-pressed={value.style === key}
            className="carton-style-card"
            onClick={() =>
              onChange({
                ...value,
                style: key as keyof typeof ART_STYLES,
                accent: t.accent,
                product: t.product,
              })
            }
          >
            <span
              className="carton-mini-box"
              style={{
                background: t.background,
                color: t.accent,
                borderColor: t.accent,
              }}
              aria-hidden="true"
            >
              <i>✧</i>
              <b>MAISON</b>
              <em>{t.product}</em>
              <small>EAU DE PARFUM</small>
            </span>
            <strong>{ar ? t.ar : t.en}</strong>
            <small>
              {ar ? "عناصر قابلة للتعديل" : "Fully editable elements"}
            </small>
          </button>
        ))}
      </div>
      <button
        className="carton-blank"
        type="button"
        aria-pressed={value.style === "blank"}
        onClick={() => onChange({ ...value, style: "blank" })}
      >
        {ar ? "بدء بقالب فارغ" : "Start with a blank canvas"}{" "}
        {value.style === "blank" ? "✓" : ""}
      </button>
      {value.style !== "blank" && (
        <div className="carton-brand-fields">
          <label>
            {ar ? "اسم العلامة التجارية" : "Brand name"}
            <input
              maxLength={24}
              value={value.brand}
              onChange={(e) => onChange({ ...value, brand: e.target.value })}
            />
          </label>
          <label>
            {ar ? "اسم العطر" : "Fragrance name"}
            <input
              maxLength={32}
              value={value.product}
              onChange={(e) => onChange({ ...value, product: e.target.value })}
            />
          </label>
          <div className="carton-fields">
            <label>
              {ar ? "لون الزخارف" : "Accent color"}
              <input
                type="color"
                value={value.accent}
                onChange={(e) => onChange({ ...value, accent: e.target.value })}
              />
            </label>
            <label>
              {ar ? "السعة على التصميم" : "Printed capacity"}
              <select
                value={value.ml}
                onChange={(e) =>
                  onChange({ ...value, ml: Number(e.target.value) })
                }
              >
                {[30, 50, 100].map((n) => (
                  <option value={n} key={n}>
                    {n} ml
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="carton-new-note">
            {ar
              ? "الألوان محاكاة RGB وليست طباعة فويل. النصوص والزخارف والخلفية تفتح كطبقات مستقلة في المصمم."
              : "RGB color simulation, not metallic foil. Text, ornaments and background open as independent editable layers."}
          </p>
        </div>
      )}
    </section>
  );
}
