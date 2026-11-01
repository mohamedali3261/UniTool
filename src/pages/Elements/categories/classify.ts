import { creativeCatalog } from "../../../../video-studio/src/creative/catalog";
import type { LibraryElement, CategoryId } from "../types";
export function classify(item: LibraryElement): CategoryId {
  if (item.kind === "group") return "kits";
  if (item.kind === "scene") return "scenes";
  if (item.kind === "svg") return item.category;
  const layer = item.layer!;
  if (layer.creative)
    return creativeCatalog.find((entry) => entry[0] === layer.creative!.id)![2];
  if (layer.frames?.length || layer.counter) return "motion";
  if (!layer.box) return "typography";
  if (/خلفية|هالة|ورق الخلفية/.test(item.name)) return "backgrounds";
  if (/كارت|بطاقة|نافذة|لوحة|شريط|زر|مؤشر|طرفية|جدول/.test(item.name))
    return "panels";
  return "shapes";
}
