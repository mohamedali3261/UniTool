import { type Design, serializeProject } from "./model";
import { embeddedFontCss } from "./fonts";
import { canvasMeasure, svgDesign } from "./render";
export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function exportProject(d: Design) {
  download(
    new Blob([serializeProject(d)], { type: "application/json" }),
    "unitool-text.json",
  );
}
export async function designBlob(
  d: Design,
  format: "svg" | "png" | "jpeg",
  scale = 1,
) {
  const css = await embeddedFontCss(d.font, d.weight),
    { svg } = svgDesign(d, canvasMeasure(d), css);
  if (format === "svg") return new Blob([svg], { type: "image/svg+xml" });
  const canvas = document.createElement("canvas");
  canvas.width = Math.min(4096, Math.round(d.width * scale));
  canvas.height = Math.min(4096, Math.round(d.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw Error("CANVAS");
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    if (format === "jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(Error("EXPORT"))),
        format === "png" ? "image/png" : "image/jpeg",
        0.95,
      ),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}
