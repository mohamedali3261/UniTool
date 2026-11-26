import { TeeStylePicker } from "./TeeStylePicker";
import { Shirt, ShoppingBag, Check } from "lucide-react";
import { products, type Project } from "../core/model";
const colors = [
  "#e5e8d9",
  "#f6f1e7",
  "#252e2a",
  "#3c5446",
  "#385b73",
  "#b06c54",
  "#d1a956",
  "#b6adc5",
];
export function ProductPanel({
  project,
  onChange,
  ar,
}: {
  project: Project;
  onChange: (p: Partial<Project>) => void;
  ar: boolean;
}) {
  return (
    <section>
      <div className="ps-section-head">
        <span>01 /</span>
        <h2>{ar ? "اختر قطعتك" : "Choose your canvas"}</h2>
      </div>
      <div className="ps-products">
        {products.map((p) => (
          <button
            key={p.id}
            className={`ps-product ${project.product === p.id ? "active" : ""}`}
            onClick={() => onChange({ product: p.id })}
            aria-pressed={project.product === p.id}
          >
            <span className="ps-product-icon">
              {p.id === "tote" ? (
                <ShoppingBag size={31} />
              ) : (
                <Shirt size={31} strokeWidth={p.id === "tee" ? 1.2 : 2} />
              )}
            </span>
            <span>
              {ar ? p.ar : p.en}
              <small>{p.label} / ESSENTIALS</small>
            </span>
            {project.product === p.id && <Check size={15} />}
          </button>
        ))}
      </div>
      {project.product === "tee" && (
        <TeeStylePicker
          value={project.appearance.teeStyle}
          color={project.color}
          ar={ar}
          change={(teeStyle) =>
            onChange({ appearance: { ...project.appearance, teeStyle } })
          }
        />
      )}
      <div className="ps-subhead">
        <h3>{ar ? "لون الخامة" : "Fabric color"}</h3>
        <code>{project.color.toUpperCase()}</code>
      </div>
      <div className="ps-swatches">
        {colors.map((c) => (
          <button
            key={c}
            title={c}
            aria-label={`${ar ? "لون" : "Color"} ${c}`}
            aria-pressed={project.color === c}
            className={project.color === c ? "active" : ""}
            style={{ background: c }}
            onClick={() => onChange({ color: c })}
          />
        ))}
        <label
          className="ps-custom-color"
          title={ar ? "لون مخصص" : "Custom color"}
        >
          +
          <input
            aria-label={ar ? "لون خامة مخصص" : "Custom fabric color"}
            type="color"
            value={project.color}
            onChange={(e) => onChange({ color: e.target.value })}
          />
        </label>
      </div>
      <div className="ps-note">
        <span>✳</span>
        <p>
          {ar
            ? "أفكارك، على خامتك. ابدأ من لون هادئ واترك التصميم يتكلم."
            : "Your ideas. Your canvas. Start with a quiet color and let the design speak."}
        </p>
      </div>
    </section>
  );
}
