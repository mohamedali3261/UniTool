import {
  cartonGeometry,
  cartonSvg,
  MM_TO_PX,
  type CartonSize,
} from "./geometry";
export const ART_STYLES = {
  noir: {
    ar: "ليلة ذهبية",
    en: "Golden night",
    background: "#171b25",
    accent: "#d6b77b",
    ink: "#f5eddc",
    product: "NOCTURNE",
  },
  emerald: {
    ar: "حديقة الزمرد",
    en: "Emerald garden",
    background: "#133c35",
    accent: "#c9d5ab",
    ink: "#f3f4dc",
    product: "BOTANICA",
  },
  rose: {
    ar: "وردة مخملية",
    en: "Velvet rose",
    background: "#f2dcd8",
    accent: "#883e54",
    ink: "#572b3b",
    product: "ROSE ATELIER",
  },
} as const;
export type ArtworkOptions = {
  style: "blank" | keyof typeof ART_STYLES;
  brand: string;
  product: string;
  accent: string;
  ml: number;
};
export const DEFAULT_ARTWORK: ArtworkOptions = {
  style: "blank",
  brand: "MAISON",
  product: "NOCTURNE",
  accent: "#d6b77b",
  ml: 50,
};
export function cartonArtwork(
  size: CartonSize,
  options: ArtworkOptions,
): Record<string, any>[] {
  if (options.style === "blank") return [];
  const theme = ART_STYLES[options.style],
    g = cartonGeometry(size),
    s = MM_TO_PX;
  const accent = /^#[0-9a-f]{6}$/i.test(options.accent)
    ? options.accent
    : theme.accent;
  const result: Record<string, any>[] = [];
  const add = (name: string, type: string, props: Record<string, any>) =>
    result.push({
      type,
      version: "5.3.0",
      originX: "left",
      originY: "top",
      scaleX: 1,
      scaleY: 1,
      angle: 0,
      opacity: 1,
      visible: true,
      ...props,
      id: `art-${result.length}`,
      name,
      selectable: true,
      evented: true,
    });
  const rect = (
    name: string,
    x: number,
    y: number,
    w: number,
    h: number,
    fill: string,
    stroke?: string,
  ) =>
    add(name, "rect", {
      left: x * s,
      top: y * s,
      width: w * s,
      height: h * s,
      fill,
      stroke: stroke || null,
      strokeWidth: stroke ? 0.25 * s : 0,
    });
  const text = (
    name: string,
    value: string,
    x: number,
    y: number,
    w: number,
    font: number,
    color: string,
    extra = {},
  ) =>
    add(name, "textbox", {
      left: x * s,
      top: y * s,
      width: w * s,
      text: value,
      fontSize: font * s,
      fontFamily: "Arial",
      textAlign: "center",
      fill: color,
      lineHeight: 1.35,
      strokeWidth: 0,
      ...extra,
    });
  rect("Base color / لون الخلفية", 0, 0, g.width, g.height, theme.background);
  g.panels.forEach((p, index) => {
    const { x, y, width: w, height: h } = p;
    rect(
      `Border ${index + 1} / إطار`,
      x + 2,
      y + 3,
      w - 4,
      h - 6,
      "transparent",
      accent,
    );
    if (index % 2 === 0) {
      add("Emblem / زخرفة", "circle", {
        left: (x + w / 2 - w * 0.12) * s,
        top: (y + h * 0.12) * s,
        radius: w * 0.12 * s,
        fill: "transparent",
        stroke: accent,
        strokeWidth: 0.35 * s,
      });
      text(
        "Monogram / رمز",
        (options.brand.trim() || "M").slice(0, 1),
        x + w * 0.38,
        y + h * 0.12 + w * 0.035,
        w * 0.24,
        w * 0.13,
        accent,
        { fontFamily: "Georgia" },
      );
      text(
        "Brand / اسم العلامة",
        options.brand.trim().slice(0, 24) || "MAISON",
        x + w * 0.1,
        y + h * 0.36,
        w * 0.8,
        Math.min(
          w * 0.09,
          ((w * 0.8) / Math.max(options.brand.length, 6)) * 1.5,
        ),
        theme.ink,
        { fontWeight: "bold" },
      );
      text(
        "Fragrance / اسم العطر",
        options.product.trim().slice(0, 32) || theme.product,
        x + w * 0.1,
        y + h * 0.48,
        w * 0.8,
        Math.min(
          w * 0.085,
          ((w * 0.8) / Math.max(options.product.length, 8)) * 1.5,
        ),
        accent,
        { fontFamily: "Georgia" },
      );
      rect(
        "Accent rule / خط زخرفي",
        x + w * 0.32,
        y + h * 0.62,
        w * 0.36,
        0.3,
        accent,
      );
      text(
        "Concentration / نوع العطر",
        "EAU DE PARFUM",
        x + w * 0.1,
        y + h * 0.68,
        w * 0.8,
        w * 0.047,
        theme.ink,
      );
      text(
        "Capacity / السعة",
        `${options.ml} ml`,
        x + w * 0.1,
        y + h * 0.86,
        w * 0.8,
        w * 0.065,
        accent,
      );
    } else {
      text(
        "Side label / نص جانبي",
        "EAU\nDE\nPARFUM",
        x + 3,
        y + h * 0.35,
        w - 6,
        Math.min(w * 0.12, 3),
        accent,
      );
      text(
        "Side brand / العلامة",
        options.brand.trim().slice(0, 24) || "MAISON",
        x + 3,
        y + h * 0.75,
        w - 6,
        Math.min(w * 0.08, 2),
        theme.ink,
      );
    }
  });
  return result;
}
const escape = (s: unknown) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[c]!,
  );
/** Preview generated from the same editable primitives as the native project. */
export function artworkPreview(
  size: CartonSize,
  options: ArtworkOptions,
  dimensions: boolean,
  safeArea = false,
) {
  let svg = cartonSvg(size, dimensions);
  const safe = safeArea
    ? `<g id="suggested-safe-area" fill="none" stroke="#35b88a" stroke-width=".25" stroke-dasharray="1 1">${cartonGeometry(
        size,
      )
        .panels.map(
          (p) =>
            `<rect x="${p.x + 3}" y="${p.y + 3}" width="${p.width - 6}" height="${p.height - 6}"/>`,
        )
        .join("")}</g>`
    : "";
  if (options.style === "blank") return svg.replace("</svg>", safe + "</svg>");
  const s = MM_TO_PX,
    g = cartonGeometry(size);
  const items = cartonArtwork(size, options)
    .map((o) => {
      if (o.type === "rect")
        return `<rect x="${o.left / s}" y="${o.top / s}" width="${o.width / s}" height="${o.height / s}" fill="${escape(o.fill)}" stroke="${escape(o.stroke || "none")}" stroke-width="${o.strokeWidth / s}"/>`;
      if (o.type === "circle")
        return `<circle cx="${(o.left + o.radius) / s}" cy="${(o.top + o.radius) / s}" r="${o.radius / s}" fill="${escape(o.fill)}" stroke="${escape(o.stroke)}" stroke-width="${o.strokeWidth / s}"/>`;
      return `<text x="${(o.left + o.width / 2) / s}" y="${(o.top + o.fontSize) / s}" text-anchor="middle" font-family="${escape(o.fontFamily)}" font-size="${o.fontSize / s}" font-weight="${o.fontWeight || "normal"}" fill="${escape(o.fill)}">${o.text
        .split("\n")
        .map(
          (line: string, i: number) =>
            `<tspan x="${(o.left + o.width / 2) / s}" dy="${i ? (o.fontSize / s) * 1.35 : 0}">${escape(line)}</tspan>`,
        )
        .join("")}</text>`;
    })
    .join("");
  svg = svg.replace(
    '<g id="cut"',
    `<defs><clipPath id="art-preview-mask"><path d="${g.cut}"/></clipPath></defs><g clip-path="url(#art-preview-mask)">${items}</g><g id="cut"`,
  );
  return svg.replace("</svg>", safe + "</svg>");
}
