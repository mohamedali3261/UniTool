import type { Annotation } from "./types";
export async function loadFonts() {
  await Promise.all([
    document.fonts.load("20px PDFAmiri", "مرحبا Hello"),
    document.fonts.load("20px PDFCairo", "مرحبا Hello"),
  ]);
}
/** Browser shaping handles Arabic joining/bidi identically in preview and PDF overlays. */
export function drawAnnotations(
  ctx: CanvasRenderingContext2D,
  items: Annotation[],
  scale = 1,
) {
  ctx.save();
  ctx.scale(scale, scale);
  for (const a of items) {
    ctx.save();
    ctx.strokeStyle = a.color;
    ctx.fillStyle = a.color;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    if (a.type === "text") {
      ctx.beginPath();
      ctx.rect(a.x, a.y, a.w, a.h);
      ctx.clip();
      ctx.font = `${a.fontSize}px PDFAmiri`;
      ctx.textBaseline = "top";
      const rtl = /[\u0600-\u06ff]/.test(a.text || "");
      ctx.direction = rtl ? "rtl" : "ltr";
      ctx.textAlign = rtl ? "right" : "left";
      for (const [i, line] of (a.text || "").split("\n").entries())
        ctx.fillText(
          line,
          a.x + (rtl ? a.w : 0),
          a.y + i * a.fontSize * 1.5,
          a.w,
        );
    } else if (a.type === "pen" && a.points) {
      ctx.beginPath();
      a.points.forEach((p, i) =>
        i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y),
      );
      ctx.stroke();
    } else if (a.type === "rectangle") ctx.strokeRect(a.x, a.y, a.w, a.h);
    else {
      ctx.globalAlpha = a.type === "highlight" ? 0.28 : 1;
      ctx.fillStyle = a.type === "cover" ? "#ffffff" : a.color;
      ctx.fillRect(a.x, a.y, a.w, a.h);
    }
    ctx.restore();
  }
  ctx.restore();
}
