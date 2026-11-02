/** ألوان العناصر ومفضلة محلية مع لوحة مشتقة من لون أساس. */
import { useState } from "react";
import { useDesigner } from "./state";
import { palettes } from "./catalog";
export function generatePalette(hex: string) {
  const rgb = hex
    .slice(1)
    .match(/../g)!
    .map((v) => parseInt(v, 16));
  const color = (v: number[]) =>
    "#" + v.map((x) => Math.round(x).toString(16).padStart(2, "0")).join("");
  return [
    hex,
    ...[0.3, 0.65].map((t) => color(rgb.map((v) => v + (255 - v) * t))),
    color(rgb.map((v) => v * 0.25)),
    color(rgb.map((v) => 255 - v)),
  ];
}
export default function Colors() {
  const s = useDesigner(),
    n = s.doc.nodes.find((n) => s.selected.includes(n.id)),
    [base, setBase] = useState("#71e3bf"),
    [favorites, setFavorites] = useState<string[]>(() => {
      try {
        const a = JSON.parse(
          localStorage.getItem("logo-designer-colors") || "[]",
        );
        return Array.isArray(a)
          ? a.filter((v) => /^#[0-9a-f]{6}$/i.test(v)).slice(0, 30)
          : [];
      } catch {
        return [];
      }
    });
  function save() {
    const next = [...new Set([...favorites, base])].slice(-30);
    setFavorites(next);
    try {
      localStorage.setItem("logo-designer-colors", JSON.stringify(next));
    } catch {
      s.setNotice(s.t("تعذّر حفظ المفضلة.", "Unable to save favorites."));
    }
  }
  return (
    <section className="ld-section">
      <p className="ld-eyebrow">A PALETTE OF POSSIBILITIES</p>
      <h2>{s.t("لون يشبهك.", "Find your color.")}</h2>
      <label className="ld-field">
        {s.t("لون العنصر المحدد", "Selected element color")}
        <input
          type="color"
          aria-label={s.t("لون التعبئة", "Fill color")}
          value={n?.fill || base}
          onChange={(e) => {
            setBase(e.target.value);
            s.patch({ fill: e.target.value });
          }}
        />
      </label>
      <label className="ld-check">
        <input
          type="checkbox"
          checked={n?.gradient || false}
          disabled={!n}
          onChange={(e) => s.patch({ gradient: e.target.checked })}
        />
        {s.t("تدرج لوني", "Gradient fill")}
      </label>
      <label className="ld-field">
        {s.t("اللون الثاني", "Second color")}
        <input
          type="color"
          value={n?.fill2 || "#758bff"}
          disabled={!n}
          onChange={(e) => s.patch({ fill2: e.target.value })}
        />
      </label>
      {n?.kind === "vector" && (
        <label className="ld-check">
          <input
            type="checkbox"
            checked={!!n.recolor}
            onChange={(e) => s.patch({ recolor: e.target.checked })}
          />
          {s.t("توحيد ألوان الرسم المتجهي", "Recolor traced vector")}
        </label>
      )}
      <h3>{s.t("لوحات جاهزة", "Curated palettes")}</h3>
      {palettes.map((p, i) => (
        <div className="ld-palette" key={i}>
          {p.map((c) => (
            <button
              key={c}
              aria-label={c}
              title={c}
              style={{ background: c }}
              onClick={() => {
                setBase(c);
                s.patch({ fill: c });
              }}
            />
          ))}
        </div>
      ))}
      <h3>{s.t("توليد من لون واحد", "Build from one color")}</h3>
      <input
        aria-label={s.t("اللون الأساسي", "Seed color")}
        type="color"
        value={base}
        onChange={(e) => setBase(e.target.value)}
      />
      <div className="ld-palette">
        {generatePalette(base).map((c, i) => (
          <button
            key={i}
            style={{ background: c }}
            aria-label={c}
            onClick={() => s.patch({ fill: c })}
          />
        ))}
      </div>
      <button className="ld-secondary" onClick={save}>
        {s.t("＋ حفظ اللون في المفضلة", "＋ Favorite this color")}
      </button>
      <div className="ld-palette">
        {favorites.map((c) => (
          <button
            key={c}
            style={{ background: c }}
            aria-label={s.t("لون محفوظ ", "Saved color ") + c}
            onClick={() => {
              setBase(c);
              s.patch({ fill: c });
            }}
          />
        ))}
      </div>
      <h3>{s.t("خلفية اللوحة", "Artboard background")}</h3>
      <label className="ld-check">
        <input
          type="checkbox"
          checked={!s.doc.background}
          onChange={(e) =>
            s.commit((p) => ({
              ...p,
              background: e.target.checked ? "" : "#ffffff",
            }))
          }
        />
        {s.t("خلفية شفافة", "Transparent")}
      </label>
      <input
        type="color"
        aria-label={s.t("لون الخلفية", "Background color")}
        value={s.doc.background || "#ffffff"}
        onChange={(e) =>
          s.commit((p) => ({ ...p, background: e.target.value }))
        }
      />
    </section>
  );
}
