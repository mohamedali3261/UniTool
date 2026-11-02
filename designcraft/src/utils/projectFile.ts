import {validatePrint} from '../advanced/core/faces';
import type { fabric } from "fabric";
import type { ProjectItem } from "../types";
import { cartonError } from "../packaging/geometry";
const types = new Set([
  "rect",
  "circle",
  "ellipse",
  "triangle",
  "line",
  "polygon",
  "polyline",
  "path",
  "text",
  "i-text",
  "textbox",
  "image",
  "group",
]);
export function parseProjectFile(raw: unknown): ProjectItem {
  const file = raw as any;
  if (!file || file.format !== "unitool-designcraft" || file.version !== 1)
    throw Error("VERSION");
  const p = file.project;
  if (
    !p ||
    typeof p.title !== "string" ||
    p.title.length > 250 ||
    ![p.width, p.height].every(
      (n) => Number.isFinite(n) && n >= 1 && n <= 12000,
    ) ||
    p.width * p.height > 40_000_000 ||
    !p.canvasData ||
    !Array.isArray(p.canvasData.objects)
  )
    throw Error("PROJECT");
  let count = 0;
  function check(value: any, depth = 0, key = "") {
    if (++count > 100_000 || depth > 30) throw Error("COMPLEXITY");
    if (
      typeof value === "number" &&
      (!Number.isFinite(value) || Math.abs(value) > 1e7)
    )
      throw Error("NUMBER");
    if (typeof value === "string") {
      if (
        /^\s*function\b/.test(value) ||
        /^(?:https?:|file:|javascript:|blob:|\/\/)/i.test(value) ||
        /url\s*\(/i.test(value)
      )
        throw Error("RESOURCE");
      if (
        ["src", "source", "_originalSrc"].includes(key) &&
        value &&
        !/^data:image\/(?:png|jpeg|webp|gif);base64,[a-z0-9+/=\s]+$/i.test(
          value,
        )
      )
        throw Error("IMAGE");
      if (value.length > 24_000_000) throw Error("SIZE");
    }
    if (value && typeof value === "object") {
      for (const [k, v] of Object.entries(value)) {
        if (["__proto__", "prototype", "constructor"].includes(k))
          throw Error("KEY");
        check(v, depth + 1, k);
      }
      if (
        value.type &&
        typeof value.type === "string" &&
        !types.has(value.type) &&
        ![
          "linear",
          "radial",
          "pattern",
          "shadow",
          "Blur",
          "Brightness",
          "ColorMatrix",
          "Contrast",
          "Convolute",
          "Gamma",
          "Grayscale",
          "HueRotation",
          "Invert",
          "Noise",
          "Pixelate",
          "RemoveColor",
          "Resize",
          "Saturation",
          "Vibrance",
          "BlendColor",
          "BlendImage",
          "Composed",
          "Sepia",
        ].includes(value.type)
      )
        throw Error("TYPE");
    }
  }
  check(p.canvasData);
  if (p.packaging) check(p.packaging);
  if (p.canvasData.objects.length > 1500) throw Error("OBJECTS");
  let packaging: ProjectItem["packaging"];
  if (p.packaging) {
    if (
      p.packaging.kind !== "reverse-tuck" ||
      p.packaging.version !== 1 ||
      cartonError(p.packaging.size)
    )
      throw Error("CARTON");
    packaging = { kind: "reverse-tuck", version: 1, size: p.packaging.size };
  }
  const now = Date.now();
  return {
    id: `import-${now}-${Math.random().toString(36).slice(2, 8)}`,
    title: p.title,
    width: p.width,
    height: p.height,
    canvasData: p.canvasData,
    category:
      typeof p.category === "string" ? p.category.slice(0, 80) : "custom",
    packaging,
    studio:p.studio?validatePrint(p.studio):undefined,
    createdAt: now,
    updatedAt: now,
  };
}
/** Embed original raster sources, retaining editable transforms and filters. Fail rather than silently drop assets. */
export async function portableProject(
  project: ProjectItem,
  canvas: fabric.Canvas,
) {
  const data = JSON.parse(JSON.stringify(project.canvasData));
  function embed(objects: any[], live: any[]) {
    objects.forEach((o, i) => {
      const source = live[i];
      if (!source) throw Error("OBJECT_MISMATCH");
      if (o.type === "image") {
        const image = source._originalElement || source.getElement?.();
        if (!image) throw Error("IMAGE");
        const w = image.naturalWidth || image.width,
          h = image.naturalHeight || image.height;
        if (!w || !h || w * h > 16_000_000) throw Error("IMAGE_SIZE");
        const temp = document.createElement("canvas");
        temp.width = w;
        temp.height = h;
        const ctx = temp.getContext("2d");
        if (!ctx) throw Error("CANVAS");
        ctx.drawImage(image, 0, 0);
        o.src = temp.toDataURL("image/png");
        if ("_originalSrc" in o) o._originalSrc = o.src;
      }
      if (o.objects) embed(o.objects, source.getObjects());
    });
  }
  embed(data.objects, canvas.getObjects());
  const raw = {
    format: "unitool-designcraft",
    version: 1,
    project: {
      title: project.title,
      width: project.width,
      height: project.height,
      category: project.category,
      packaging: project.packaging,
      studio:project.studio,
      canvasData: data,
    },
  };
  // Validate our own output too: no unsafe/unrestorable project can be downloaded as a success.
  parseProjectFile(raw);
  const text = JSON.stringify(raw);
  if (new Blob([text]).size > 32 * 1024 * 1024) throw Error("PROJECT_SIZE");
  return text;
}
