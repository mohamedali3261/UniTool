import GroupParts from "./GroupParts";
/** خصائص سياقية للمحدد، وخصائص عامة لمساحة العمل. */
import {
  FlipHorizontal,
  FlipVertical,
  Copy,
  Trash2,
  AlignCenter,
  AlignVerticalJustifyCenter,
} from "lucide-react";
import { useDesigner } from "./state";
import { NumberField } from "./ui";
import SelectionTools from "./SelectionTools";
export default function Properties() {
  const s = useDesigner(),
    n = s.doc.nodes.find((n) => s.selected.includes(n.id));
  return (
    <section className="ld-properties">
      <div className="ld-properties-heading">
        <h2>{s.t("الخصائص", "Inspector")}</h2>
        <small>
          {s.selected.length
            ? s.t(`${s.selected.length} محدد`, `${s.selected.length} selected`)
            : "ARTBOARD"}
        </small>
      </div>
      <GroupParts />
      <SelectionTools />
      {n ? (
        <>
          <div className="ld-object-heading">
            <span>{n.kind === "text" ? "T" : "◇"}</span>
            <div>
              <strong>{n.name}</strong>
              <small>
                {n.kind.toUpperCase()} {n.locked ? "· LOCKED" : ""}
              </small>
            </div>
          </div>
          {n.locked && (
            <p className="ld-empty">
              {s.t(
                "الطبقة مقفولة؛ افتحها من قسم الطبقات.",
                "This layer is locked. Unlock it in Layers.",
              )}
            </p>
          )}
          <fieldset disabled={n.locked}>
            <div className="ld-two">
              <NumberField
                label="X"
                value={n.x}
                onChange={(x) => s.patch({ x })}
              />
              <NumberField
                label="Y"
                value={n.y}
                onChange={(y) => s.patch({ y })}
              />
              <NumberField
                label={s.t("العرض", "Width")}
                value={n.w}
                min={1}
                max={8000}
                onChange={(w) => s.patch({ w })}
              />
              <NumberField
                label={s.t("الارتفاع", "Height")}
                value={n.h}
                min={1}
                max={8000}
                onChange={(h) => s.patch({ h })}
              />
              <NumberField
                label={s.t("الدوران", "Rotation")}
                value={n.rotation}
                min={-360}
                max={360}
                onChange={(rotation) => s.patch({ rotation })}
              />
              <NumberField
                label={s.t("الشفافية %", "Opacity %")}
                value={n.opacity * 100}
                min={0}
                max={100}
                onChange={(opacity) => s.patch({ opacity: opacity / 100 })}
              />
            </div>
            <div className="ld-toolbar">
              <button
                aria-label={s.t("انعكاس أفقي", "Flip horizontally")}
                onClick={() => s.patch({ flipX: !n.flipX })}
              >
                <FlipHorizontal size={17} />
              </button>
              <button
                aria-label={s.t("انعكاس رأسي", "Flip vertically")}
                onClick={() => s.patch({ flipY: !n.flipY })}
              >
                <FlipVertical size={17} />
              </button>
              <button
                aria-label={s.t("توسيط أفقي", "Center horizontally")}
                onClick={() => s.patch({ x: s.doc.width / 2 })}
              >
                <AlignCenter size={17} />
              </button>
              <button
                aria-label={s.t("توسيط رأسي", "Center vertically")}
                onClick={() => s.patch({ y: s.doc.height / 2 })}
              >
                <AlignVerticalJustifyCenter size={17} />
              </button>
            </div>
            <h3>{s.t("المظهر", "Appearance")}</h3>
            <div className="ld-color-row">
              <label>
                {s.t("تعبئة", "Fill")}
                <input
                  type="color"
                  aria-label={s.t("لون العنصر", "Element color")}
                  value={n.fill}
                  onChange={(e) => s.patch({ fill: e.target.value })}
                />
              </label>
              <label>
                {s.t("حدود", "Stroke")}
                <input
                  type="color"
                  value={n.stroke}
                  onChange={(e) => s.patch({ stroke: e.target.value })}
                />
              </label>
            </div>
            <div className="ld-two">
              <NumberField
                label={s.t("عرض الحد", "Stroke width")}
                value={n.strokeWidth}
                min={0}
                max={40}
                step={0.5}
                onChange={(strokeWidth) => s.patch({ strokeWidth })}
              />
              <NumberField
                label={s.t("استدارة الحواف", "Corner radius")}
                value={n.radius}
                min={0}
                max={1000}
                onChange={(radius) => s.patch({ radius })}
              />
              <NumberField
                label={s.t("الظل", "Shadow")}
                value={n.shadow}
                min={0}
                max={80}
                onChange={(shadow) => s.patch({ shadow })}
              />
              <NumberField
                label={s.t("التمويه", "Blur")}
                value={n.blur}
                min={0}
                max={30}
                step={0.5}
                onChange={(blur) => s.patch({ blur })}
              />
            </div>
            <label className="ld-check">
              <input
                type="checkbox"
                checked={!!n.reflection}
                onChange={(e) => s.patch({ reflection: e.target.checked })}
              />
              {s.t("انعكاس أسفل العنصر", "Faded reflection")}
            </label>
            <label className="ld-check">
              <input
                type="checkbox"
                checked={n.gradient}
                onChange={(e) => s.patch({ gradient: e.target.checked })}
              />
              {s.t("تدرج لوني", "Gradient")}
            </label>
            {n.gradient && (
              <input
                type="color"
                aria-label={s.t("لون التدرج الثاني", "Gradient end color")}
                value={n.fill2}
                onChange={(e) => s.patch({ fill2: e.target.value })}
              />
            )}
          </fieldset>
          <div className="ld-toolbar">
            <button onClick={s.duplicate}>
              <Copy size={16} />
              {s.t("نسخ", "Duplicate")}
            </button>
            <button className="ld-danger" onClick={s.remove}>
              <Trash2 size={16} />
              {s.t("حذف", "Delete")}
            </button>
          </div>
          {n.kind === "text" && (
            <button
              className="ld-secondary"
              onClick={() => {
                s.setTab("text");
                s.setLeftOpen(true);
              }}
            >
              {s.t("افتح خصائص النص ↗", "Edit typography ↗")}
            </button>
          )}
        </>
      ) : (
        <p className="ld-empty">
          {s.t(
            "اختار عنصر من اللوحة أو الطبقات علشان تعدّل تفاصيله.",
            "Select an element on the canvas or in Layers to edit its details.",
          )}
        </p>
      )}
      <hr />
      <h3>{s.t("مساحة العمل", "Artboard")}</h3>
      <div className="ld-two">
        <NumberField
          label={s.t("عرض اللوحة", "Artboard width")}
          value={s.doc.width}
          min={64}
          max={4096}
          onChange={(width) => s.commit((p) => ({ ...p, width }))}
        />
        <NumberField
          label={s.t("ارتفاع اللوحة", "Artboard height")}
          value={s.doc.height}
          min={64}
          max={4096}
          onChange={(height) => s.commit((p) => ({ ...p, height }))}
        />
      </div>
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
        {s.t("خلفية شفافة", "Transparent background")}
      </label>
      <input
        type="color"
        aria-label={s.t("خلفية اللوحة", "Artboard color")}
        value={s.doc.background || "#ffffff"}
        onChange={(e) =>
          s.commit((p) => ({ ...p, background: e.target.value }))
        }
      />
    </section>
  );
}
