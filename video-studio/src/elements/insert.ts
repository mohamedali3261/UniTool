import { uid, newClip, durationOf, type Project, type Asset } from "../types";
import type { LibraryElement } from "../../../src/pages/Elements/types";
import type { Selection } from "../preview/model";
import { fittedLayer } from "../../../src/pages/Elements/lib/render";
import { elementProject } from "../../../src/pages/Elements/lib/export";
/** One undoable edit; never replaces the current project or its media. */
export function insertElement(
  project: Project,
  item: LibraryElement,
  at: number,
  color?: string,
  seconds = 5,
) {
  if (
    !Number.isFinite(at) ||
    !Number.isFinite(seconds) ||
    seconds < 0.1 ||
    seconds > 30
  )
    throw new Error("مدة أو توقيت غير صالح");
  const assets: Asset[] = [];
  let next = project;
  let selection: Selection;
  at = Math.max(0, Math.min(durationOf(project), at));
  if (item.kind === "scene") {
    if (project.tracks?.video?.locked)
      throw new Error("افتح قفل مسار الفيديو أولًا");
    const data = elementProject(item, color),
      asset = { ...data.assets[0], id: uid(), duration: seconds };
    assets.push(asset);
    const clip = {
      ...data.project.clips[0],
      id: uid(),
      assetId: asset.id,
      end: seconds,
    };
    at = durationOf(project);
    next = { ...project, clips: [...project.clips, clip] };
    selection = { kind: "clip", id: clip.id };
  } else {
    if (item.kind === "layer" && project.tracks?.text?.locked)
      throw new Error("افتح قفل مسار النصوص أولًا");
    if (item.kind === "svg" && (project.overlays?.length || 0) >= 6)
      throw new Error(
        "الحد الأقصى ٦ طبقات صور؛ احذف طبقة أو أضف العنصر في مشروع آخر",
      );
    const extra = at + seconds - durationOf(project);
    if (extra > 0) {
      if (project.tracks?.video?.locked)
        throw new Error("افتح قفل مسار الفيديو لتمديد المشروع");
      const asset: Asset = {
        id: uid(),
        name: "خلفية امتداد العناصر.svg",
        type: "image",
        duration: extra,
        width: 960,
        height: 540,
        url:
          "data:image/svg+xml," +
          encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540"><rect width="960" height="540" fill="#101312"/></svg>',
          ),
      };
      assets.push(asset);
      next = {
        ...next,
        clips: [...next.clips, { ...newClip(asset), end: extra }],
      };
    }
    if (item.kind === "layer") {
      const layer = {
        ...fittedLayer(item, color),
        id: uid(),
        start: at,
        end: at + seconds,
        groupId: undefined,
      };
      next = { ...next, texts: [...next.texts, layer] };
      selection = { kind: "text", id: layer.id };
    } else {
      const data = elementProject(item, color),
        asset = { ...data.assets[0], id: uid(), duration: seconds };
      assets.push(asset);
      const layer = {
        id: uid(),
        assetId: asset.id,
        at,
        start: 0,
        end: seconds,
        x: 50,
        y: 50,
        width: 65,
        rotation: 0,
        opacity: 1,
        volume: 0,
        foreground: true,
      };
      next = { ...next, overlays: [...(next.overlays || []), layer] };
      selection = { kind: "overlay", id: layer.id };
    }
  }
  return { project: next, assets, selection, at };
}
