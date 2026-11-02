import { useDesigner } from "./state";
import { addVariant, switchVariant, syncVariants } from "./variants";
import { ProjectGraphic } from "./render";
export default function Variants() {
  const s = useDesigner();
  return (
    <section className="ld-feature-block">
      <h3>{s.t("نسخ التصميم ومقارنتها", "Design variants & comparison")}</h3>
      <p>
        {s.t(
          "حتى 8 نسخ مستقلة. الصور النقطية تحتفظ بألوانها؛ إعادة التلوين للعناصر المتجهة والنصوص.",
          "Up to 8 independent versions. Raster images retain their colors; vectors and text are recolored.",
        )}
      </p>
      <div className="ld-mini-grid">
        {(["copy", "dark", "light", "mono"] as const).map((mode, i) => (
          <button
            key={mode}
            disabled={(s.doc.variants?.length || 1) >= 8}
            onClick={() => {
              s.commit((p) => addVariant(p, mode));
              s.setSelected([]);
            }}
          >
            {s.t(
              ["نسخة بديلة", "داكنة", "فاتحة", "أحادية اللون"][i],
              ["Alternative", "Dark version", "Light version", "Monochrome"][i],
            )}
          </button>
        ))}
      </div>
      <div className="ld-variant-grid">
        {s.doc.variants?.map((v) => {
          const p = {
            ...s.doc,
            background:
              v.id === s.doc.activeVariant ? s.doc.background : v.background,
            nodes: v.id === s.doc.activeVariant ? s.doc.nodes : v.nodes,
          };
          return (
            <article
              key={v.id}
              className={v.id === s.doc.activeVariant ? "active" : ""}
            >
              <button
                aria-label={s.t("فتح نسخة ", "Open variant ") + v.name}
                onClick={() => {
                  s.commit((p) => switchVariant(p, v.id));
                  s.setSelected([]);
                }}
              >
                <svg viewBox={`0 0 ${p.width} ${p.height}`}>
                  <ProjectGraphic project={p} prefix={"variant-" + v.id} />
                </svg>
              </button>
              <input
                aria-label={s.t("اسم النسخة ", "Variant name ") + v.name}
                maxLength={80}
                value={v.name}
                onChange={(e) =>
                  s.commit((p) => ({
                    ...p,
                    variants: p.variants!.map((item) =>
                      item.id === v.id
                        ? { ...item, name: e.target.value }
                        : item,
                    ),
                  }))
                }
              />
              <button
                disabled={s.doc.variants!.length < 2}
                onClick={() => {
                  if (!confirm(s.t("حذف النسخة؟", "Delete this variant?")))
                    return;
                  s.commit((p) => {
                    const list = syncVariants(p).filter(
                      (item) => item.id !== v.id,
                    );
                    const next =
                      p.activeVariant === v.id
                        ? list[0]
                        : list.find((item) => item.id === p.activeVariant)!;
                    return {
                      ...p,
                      variants: list,
                      activeVariant: next.id,
                      nodes: structuredClone(next.nodes),
                      background: next.background,
                    };
                  });
                  s.setSelected([]);
                }}
              >
                {s.t("حذف", "Delete")}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
