import type { LibraryElement, CategoryId } from "../types";
export function classify(item: LibraryElement): CategoryId {
  if (item.kind === "scene") return "scenes";
  if (item.kind === "svg") return "backgrounds";
  const layer = item.layer!;
  if (layer.frames?.length || layer.counter) return "motion";
  if (!layer.box) return "typography";
  if (/خلفية|هالة|ورق الخلفية/.test(item.name)) return "backgrounds";
  if (/كارت|بطاقة|نافذة|لوحة|شريط|زر|مؤشر|طرفية|جدول/.test(item.name))
    return "panels";
  return "shapes";
}
