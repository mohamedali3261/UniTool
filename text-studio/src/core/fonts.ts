const files = import.meta.glob(
  "../../../logo-designer/assets/{cairo,amiri,changa}-{arabic,latin}-{400,700}-normal.woff2",
  { query: "?url", import: "default", eager: true },
) as Record<string, string>;
const noto = import.meta.glob(
  "../../../video-studio/assets/variable-{arabic,latin}.woff2",
  { query: "?url", import: "default", eager: true },
) as Record<string, string>;
import { fonts, family } from "./fontNames";
export { fonts, family } from "./fontNames";
const latin =
  "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD";
const arabic =
  "U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC,U+102E0-102FB,U+10E60-10E7E,U+10EC2-10EC4,U+10EFC-10EFF,U+1EE00-1EEFF";
const faces = fonts.flatMap((font) =>
  [400, 700].flatMap((weight) =>
    ["arabic", "latin"].map((subset) => ({
      font: font.id,
      weight,
      range: subset === "arabic" ? arabic : latin,
      url:
        font.id === "noto"
          ? noto[`../../../video-studio/assets/variable-${subset}.woff2`]
          : files[
              `../../../logo-designer/assets/${font.id}-${subset}-${weight}-normal.woff2`
            ],
    })),
  ),
);
function faceCss(face: (typeof faces)[number], url: string) {
  return `@font-face{font-family:'${family(face.font)}';font-style:normal;font-weight:${face.weight};font-display:swap;src:url('${url}') format('woff2');unicode-range:${face.range};}`;
}
export const localFontCss = faces.map((f) => faceCss(f, f.url)).join("\n");
const data = new Map<string, Promise<string>>();
async function dataURL(url: string) {
  if (!url) throw Error("FONT_MISSING");
  if (!data.has(url))
    data.set(
      url,
      fetch(url)
        .then((r) => {
          if (!r.ok) throw Error("FONT_LOAD");
          return r.blob();
        })
        .then(
          (b) =>
            new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(String(reader.result));
              reader.onerror = () => reject(Error("FONT_READ"));
              reader.readAsDataURL(b);
            }),
        )
        .catch((e) => {
          data.delete(url);
          throw e;
        }),
    );
  return data.get(url)!;
}
export async function embeddedFontCss(font: string, weight: number) {
  return (
    await Promise.all(
      faces
        .filter((f) => f.font === font && f.weight === weight)
        .map(async (f) => faceCss(f, await dataURL(f.url))),
    )
  ).join("\n");
}
export async function readyFonts() {
  await Promise.all(
    fonts.flatMap((f) =>
      [400, 700].map((w) =>
        document.fonts.load(`${w} 48px '${family(f.id)}'`, "مرحبا Hello"),
      ),
    ),
  );
  await document.fonts.ready;
}
