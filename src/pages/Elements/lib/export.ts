import {
  blankProject,
  newClip,
  type Asset,
} from "../../../../video-studio/src/types";
import type { LibraryElement } from "../types";
import { fittedLayer } from "./render";
export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function svgURL(svg: string) {
  return (
    "data:image/svg+xml;base64," +
    btoa(
      Array.from(new TextEncoder().encode(svg), (b) =>
        String.fromCharCode(b),
      ).join(""),
    )
  );
}
export function elementProject(item: LibraryElement, color?: string) {
  const svg =
    item.svg ||
    '<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540"><rect width="960" height="540" fill="#101312"/></svg>';
  const width = Number(svg.match(/\bwidth="(\d+)"/)?.[1] || 960),
    height = Number(svg.match(/\bheight="(\d+)"/)?.[1] || 540);
  const asset: Asset = {
    id: "element-source",
    name: `${item.id}.svg`,
    type: "image",
    url: svgURL(svg),
    duration: 8,
    width,
    height,
  };
  const project = {
    ...blankProject(),
    name: item.name,
    ratio:
      item.kind === "scene"
        ? "9:16"
        : item.kind === "svg" && width === height
          ? "1:1"
          : "16:9",
    clips: [
      {
        ...newClip(asset),
        id: "element-clip",
        end: 8,
        fit: "contain" as const,
        ...(item.kind === "scene"
          ? { designScene: item.scene, designAccent: color || "#4bdfc5" }
          : {}),
      },
    ],
    texts:
      item.kind === "layer"
        ? [
            {
              ...fittedLayer(item, color),
              id: "element-layer",
              animationOut: "none" as const,
            },
          ]
        : [],
  };
  return { version: 1, project, assets: [asset] };
}
export function elementCode(item: LibraryElement, color?: string) {
  if (item.kind === "svg") return item.svg!;
  if (item.kind === "scene")
    return `// Interface Flow — ${item.name}\nimport { drawInterfaceScene } from "./video-studio/src/templates/interface-flow/render";\n// ctx is a 720 × 1280 canvas context; time is in seconds.\ndrawInterfaceScene(ctx, ${JSON.stringify(item.scene)}, time, ${JSON.stringify(color || "#4bdfc5")});`;
  return JSON.stringify(fittedLayer(item, color), null, 2);
}
