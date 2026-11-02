import { useMemo } from "react";
import type { Design, Lang } from "../../core/model";
import { canvasMeasure, svgDesign } from "../../core/render";
import { tr } from "./sections/shared";
export function Preview({
  design,
  lang,
  fontReady,
}: {
  design: Design;
  lang: Lang;
  fontReady: boolean;
}) {
  const result = useMemo(
    () => svgDesign(design, canvasMeasure(design)),
    [design, fontReady],
  );
  return (
    <section
      className="preview-panel"
      aria-label={tr(lang, "معاينة التصميم", "Design preview")}
    >
      <div className="preview-heading">
        <span>
          <i />
          {tr(lang, "معاينة مباشرة", "LIVE PREVIEW")}
        </span>
        <code>
          {design.width} × {design.height} PX
        </code>
      </div>
      <div className="preview-stage">
        <div
          className="artboard"
          style={{
            aspectRatio: `${design.width}/${design.height}`,
            maxWidth: `min(100%,${Math.min(660, (620 * design.width) / design.height)}px)`,
          }}
          dangerouslySetInnerHTML={{ __html: result.svg }}
        />
      </div>
      <div className="preview-footer">
        <span>
          {tr(lang, "حجم الخط الفعلي", "Actual font size")}:{" "}
          {result.layout.size}px
        </span>
        <span>100% {tr(lang, "محلي", "LOCAL")}</span>
      </div>
      {result.layout.overflow && (
        <p className="notice warning" role="alert">
          {tr(
            lang,
            "النص أكبر من المساحة وقد يتم قصّه. قلّل النص أو حجم الخط، أو كبّر اللوحة وقلّل الهوامش.",
            "Text exceeds the canvas and may be clipped. Shorten it, reduce the font/padding, or increase canvas size.",
          )}
        </p>
      )}
      <p className="preview-note">
        {tr(
          lang,
          "جمال الكلمة في تفاصيلها. جرّب قالبًا، ثم خلّيه على ذوقك.",
          "Great words deserve a little attention. Start with a template, then make it yours.",
        )}
      </p>
    </section>
  );
}
