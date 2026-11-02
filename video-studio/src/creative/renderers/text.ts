import type { TextLayer } from "../../types";
import { clamp, ease, noise, type C } from "./common";
/** Whole-word Arabic drawing retains joining; scramble iterates grapheme clusters, not UTF-16. */
export function drawCreativeText(
  c: C,
  t: TextLayer,
  text: string,
  size: number,
  width: number,
  time: number,
  duration: number,
) {
  const id = t.creative!.id,
    p = ease(time / Math.min(2, Math.max(0.2, duration * 0.45)));
  c.shadowBlur = 0;
  c.fillStyle = t.color;
  const lines = text.split("\n");
  lines.forEach((value, row) => {
    const y = row * size * 1.2;
    c.save();
    c.translate(0, y);
    if (id === "weight") {
      const weight = Math.round(
        100 + 800 * (0.5 - 0.5 * Math.cos((time * Math.PI) / 2)),
      );
      c.font = `${weight} ${size}px StudioVariable, sans-serif`;
    }
    const naturalWidth = c.measureText(value).width || width;
    c.scale(Math.min(1, width / naturalWidth), 1);
    if (id === "scramble") {
      const chars =
        typeof Intl.Segmenter === "function"
          ? [
              ...new Intl.Segmenter("ar", { granularity: "grapheme" }).segment(
                value,
              ),
            ].map((x) => x.segment)
          : Array.from(value);
      const glyphs = "01#%+=<>ابتسمن";
      const out = chars
        .map((ch, i) =>
          /\s/.test(ch) || i < Math.floor(p * chars.length)
            ? ch
            : glyphs[
                Math.floor(
                  noise(i + Math.floor(time * 18) * 31) * glyphs.length,
                )
              ],
        )
        .join("");
      c.fillText(out, 0, 0, naturalWidth);
    } else if (id === "split") {
      const words = value.split(/\s+/),
        gap = c.measureText(" ").width,
        widths = words.map((w) => c.measureText(w).width),
        total = widths.reduce((a, b) => a + b, 0) + gap * (words.length - 1);
      const rtl = /[\u0600-\u06ff]/.test(value);
      let at = rtl ? total / 2 : -total / 2;
      c.textAlign = rtl ? "right" : "left";
      words.forEach((word, i) => {
        const amount = ease(
          clamp(p * 1.7 - (i / Math.max(1, words.length)) * 0.7),
        );
        c.save();
        const x = rtl ? at - widths[i] : at;
        c.beginPath();
        c.rect(x - 2, -size * 0.75, widths[i] + 4, size * 1.6);
        c.clip();
        c.fillText(word, at, (1 - amount) * size * 1.8);
        c.restore();
        at += (rtl ? -1 : 1) * (widths[i] + gap);
      });
    } else if (id === "sweep") {
      c.fillText(value, 0, 0, naturalWidth);
      if (time < 2) {
        const w = Math.min(width, c.measureText(value).width),
          x = -w / 2 + (time / 2) * (w + size * 3),
          g = c.createLinearGradient(x - size, 0, x + size, 0);
        g.addColorStop(0, t.color);
        g.addColorStop(0.5, "#ffffff");
        g.addColorStop(1, t.color);
        c.fillStyle = g;
        c.fillText(value, 0, 0, naturalWidth);
      }
    } else if (id === "weight") {
      c.fillText(value, 0, 0, naturalWidth);
    } else if (id === "marker") {
      const words = value.trim().split(/\s+/),
        word = t.creative!.highlight || words.at(-1) || value,
        index = value.indexOf(word),
        before = c.measureText(value.slice(0, Math.max(0, index))).width,
        w = c.measureText(word).width,
        full = c.measureText(value).width,
        rtl = /[\u0600-\u06ff]/.test(value);
      c.save();
      c.globalAlpha *= 0.65;
      c.fillStyle = "#f9d65c";
      c.fillRect(
        rtl ? full / 2 - before - w : -full / 2 + before,
        size * 0.05,
        index < 0 ? 0 : w * p,
        size * 0.55,
      );
      c.restore();
      c.fillText(value, 0, 0, naturalWidth);
    } else if (id === "odometer") {
      // Each digit travels vertically through its own clipped reel. Non-digits remain intact.
      const chars = Array.from(value),
        widths = chars.map((ch) => c.measureText(ch).width),
        total = widths.reduce((a, b) => a + b, 0);
      let x = -total / 2;
      c.textAlign = "left";
      c.direction = "ltr";
      chars.forEach((ch, i) => {
        const d = "0123456789٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹".indexOf(ch),
          digit = d < 0 ? -1 : d % 10;
        c.save();
        c.beginPath();
        c.rect(x - 1, -size * 0.65, widths[i] + 2, size * 1.3);
        c.clip();
        if (digit < 0) c.fillText(ch, x, 0);
        else {
          const progress = ease(
              clamp(
                p * (1 + (i / Math.max(1, chars.length)) * 0.3) -
                  (i / Math.max(1, chars.length)) * 0.3,
              ),
            ),
            position = (20 + digit) * progress,
            base = Math.floor(position),
            frac = position - base,
            alphabet =
              d >= 20 ? "۰۱۲۳۴۵۶۷۸۹" : d >= 10 ? "٠١٢٣٤٥٦٧٨٩" : "0123456789";
          c.fillText(alphabet[base % 10], x, -frac * size * 1.3);
          c.fillText(alphabet[(base + 1) % 10], x, (1 - frac) * size * 1.3);
        }
        c.restore();
        x += widths[i];
      });
    }
    c.restore();
  });
}
