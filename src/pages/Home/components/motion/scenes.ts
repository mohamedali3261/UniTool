import { toolCategories } from "../../../ToolsHome/data";
import { studios } from "../../data";
import { Layers3, Sparkles } from "lucide-react";

export const heroScenes = toolCategories.flatMap((c) =>
  Array.from({ length: Math.ceil(c.tools.length / 6) }, (_, i) => ({
    id: `${c.id}-${i}`,
    ar: c.titleAr,
    en: c.titleEn,
    icon: c.icon,
    items: c.tools.slice(i * 6, i * 6 + 6).map((t) => ({
      id: t.id,
      ar: t.titleAr,
      en: t.titleEn,
      icon: t.icon,
      href: t.href || `/app.html#${t.id}`,
    })),
  })),
);

const seenHrefs = new Set(
  heroScenes.flatMap((s) => s.items.map((item) => item.href)),
);

const studioItems = [
  ...studios
    .filter((s) => !seenHrefs.has(s.href))
    .map((s) => ({
      id: s.id,
      ar: s.name.ar,
      en: s.name.en,
      icon: s.icon,
      href: s.href,
    })),
  {
    id: "logoDesigner",
    ar: "مصمم الشعارات",
    en: "Logo Designer",
    icon: Sparkles,
    href: "/logo-designer/",
  },
  {
    id: "elements",
    ar: "مكتبة العناصر",
    en: "Elements library",
    icon: Layers3,
    href: "/video-studio.html#elements",
  },
];

for (let i = 0; i < studioItems.length; i += 6) {
  heroScenes.push({
    id: i === 0 ? "studios" : `studios-${i / 6}`,
    ar: "استوديوهات الإبداع",
    en: "Creative studios",
    icon: Layers3,
    items: studioItems.slice(i, i + 6),
  });
}
