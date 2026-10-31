import { svgString } from "./render";
import { embeddedFonts } from "./fonts";
import { bounds, type Project } from "./types";
export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
export function exportSize(p: Project, maxEdge: number) {
  const scale = maxEdge / Math.max(p.width, p.height);
  return {
    width: Math.max(1, Math.round(p.width * scale)),
    height: Math.max(1, Math.round(p.height * scale)),
  };
}
export const safeName = (name: string) =>
  name.replace(/[^\p{L}\p{N}_-]+/gu, "-").slice(0, 80) || "brand";
export async function portableSVG(p: Project, mono = false) {
  await document.fonts.ready;
  return svgString(
    p,
    await embeddedFonts([
      ...new Set([
        "cairo",
        ...p.nodes.filter((n) => n.kind === "text").map((n) => n.font),
      ]),
    ]),
    mono,
  );
}
/** الملف المتجهي أصل التصدير؛ ما فيش لقطة شاشة لعناصر واجهة المستخدم. */
export async function raster(
  p: Project,
  width: number,
  height: number,
  type = "image/png",
  mono = false,
) {
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width < 1 ||
    height < 1 ||
    width > 4096 ||
    height > 4096
  )
    throw new Error("Export dimensions exceed 4096px");
  const svg = await portableSVG(p, mono),
    url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Unable to render SVG"));
      image.src = url;
    });
    const c = document.createElement("canvas");
    c.width = width;
    c.height = height;
    const ctx = c.getContext("2d")!;
    if (type === "image/jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
    }
    ctx.drawImage(image, 0, 0, width, height);
    return await new Promise<Blob>((resolve, reject) =>
      c.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Export failed"))),
        type,
        0.95,
      ),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}
export function kitVariant(
  p: Project,
  mode: "horizontal" | "vertical" | "square",
) {
  const project = structuredClone(p);
  project.background = "";
  project.nodes = project.nodes.filter((n) => !n.hidden);
  if (mode !== "square") {
    const texts = project.nodes.filter((n) => n.kind === "text"),
      marks = project.nodes.filter((n) => n.kind !== "text");
    if (texts.length && marks.length) {
      const mb = bounds(marks),
        tb = bounds(texts),
        gap = 40;
      const tx =
          mode === "horizontal"
            ? mb.x + mb.w + gap - tb.x
            : mb.x + mb.w / 2 - (tb.x + tb.w / 2),
        ty =
          mode === "horizontal"
            ? mb.y + mb.h / 2 - (tb.y + tb.h / 2)
            : mb.y + mb.h + gap - tb.y;
      texts.forEach((n) => {
        n.x += tx;
        n.y += ty;
      });
    }
  }
  const b = bounds(project.nodes),
    pad = 60;
  const w = b.w + pad * 2,
    h = b.h + pad * 2;
  project.width = mode === "square" ? Math.max(w, h) : w;
  project.height = mode === "square" ? Math.max(w, h) : h;
  project.nodes.forEach((n) => {
    n.x += -b.x + pad + (project.width - w) / 2;
    n.y += -b.y + pad + (project.height - h) / 2;
  });
  return project;
}
