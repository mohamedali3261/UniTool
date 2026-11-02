import { type Design } from "./model";
import { family } from "./fontNames";
import { layoutText, type Measure } from "./layout";
export function escapeXml(value: string) {
  return value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "").replace(
    /[<>&"']/g,
    (c) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
        "'": "&apos;",
      })[c]!,
  );
}
export function svgDesign(d: Design, measure: Measure, fontCss = "") {
  const l = layoutText(d, measure),
    color = escapeXml(d.color),
    color2 = escapeXml(d.color2),
    bg = escapeXml(d.bg),
    bg2 = escapeXml(d.bg2);
  const background =
    d.background === "transparent"
      ? ""
      : `<rect width="100%" height="100%" fill="${d.background === "gradient" ? "url(#paper)" : bg}"/>`;
  let decoration = "";
  if (d.decoration === "orbit")
    decoration = `<g fill="none" stroke="${color}" stroke-opacity=".14" stroke-width="1.5"><circle cx="${d.width * 0.87}" cy="${d.height * 0.12}" r="${d.width * 0.24}"/><circle cx="${d.width * 0.87}" cy="${d.height * 0.12}" r="${d.width * 0.29}"/><circle cx="${d.width * 0.08}" cy="${d.height * 0.94}" r="${d.width * 0.15}"/></g>`;
  if (d.decoration === "frame")
    decoration = `<rect x="24" y="24" width="${d.width - 48}" height="${d.height - 48}" rx="8" fill="none" stroke="${color}" stroke-opacity=".4" stroke-width="2"/><path d="M ${d.width / 2 - 24} 48 h 48 M ${d.width / 2 - 24} ${d.height - 48} h 48" stroke="${color}" stroke-width="3"/>`;
  if (d.decoration === "dots")
    decoration = `<rect width="100%" height="100%" fill="url(#dots)"/>`;
  const filter =
    d.effect === "shadow" || d.effect === "glow"
      ? ' filter="url(#effect)"'
      : "";
  const stroke =
    d.effect === "outline"
      ? `stroke="${bg}" stroke-width="${Math.max(1, l.size * 0.035)}" paint-order="stroke fill" stroke-linejoin="round"`
      : "";
  const text = l.lines
    .map(
      (line, i) =>
        `<text x="${l.x}" y="${l.firstY + i * l.lineStep}" direction="${l.direction}" unicode-bidi="plaintext" text-anchor="${d.align === "center" ? "middle" : d.align === "left" ? (l.direction === "rtl" ? "end" : "start") : l.direction === "rtl" ? "start" : "end"}" xml:space="preserve">${escapeXml(line)}</text>`,
    )
    .join("");
  return {
    layout: l,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${d.width}" height="${d.height}" viewBox="0 0 ${d.width} ${d.height}" role="img" aria-label="Text design"><defs><style>${fontCss}</style><linearGradient id="paper" x2="1" y2="1"><stop stop-color="${bg}"/><stop offset="1" stop-color="${bg2}"/></linearGradient><linearGradient id="ink" x2="1" y2=".4"><stop stop-color="${color}"/><stop offset="1" stop-color="${color2}"/></linearGradient><pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.2" fill="${color}" opacity=".16"/></pattern><filter id="effect" x="-60%" y="-80%" width="220%" height="260%"><feDropShadow dx="${d.effect === "glow" ? 0 : 3}" dy="${d.effect === "glow" ? 0 : 7}" stdDeviation="${d.effect === "glow" ? 8 : 5}" flood-color="${d.effect === "glow" ? color : "#000000"}" flood-opacity=".7"/></filter><clipPath id="page"><rect width="${d.width}" height="${d.height}"/></clipPath></defs><g clip-path="url(#page)">${background}${decoration}<g font-family="${family(d.font)}" font-weight="${d.weight}" font-size="${l.size}" letter-spacing="${d.spacing}" fill="${d.textGradient ? "url(#ink)" : color}" ${stroke}${filter}>${text}</g>${d.signature ? `<text x="${d.width / 2}" y="${d.height - d.padding + 12}" text-anchor="middle" direction="${l.direction}" font-family="${family(d.font)}" font-size="${l.signatureSize}" font-weight="${d.weight}" fill="${color}" opacity=".7">${escapeXml(d.signature)}</text>` : ""}</g></svg>`,
  };
}
export function canvasMeasure(d: Design): Measure {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) throw Error("CANVAS");
  return (text, size) => {
    ctx.font = `${d.weight} ${size}px '${family(d.font)}'`;
    return (
      ctx.measureText(text).width +
      Math.max(
        0,
        Array.from(
          new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(
            text,
          ),
        ).length - 1,
      ) *
        d.spacing
    );
  };
}
