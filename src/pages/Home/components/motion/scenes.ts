import { toolCategories } from "../../../ToolsHome/data";
import { studios } from "../../data";
import { Layers3 } from "lucide-react";
export const heroScenes = toolCategories.flatMap((c) =>
  Array.from({ length: Math.ceil(c.tools.length / 6) }, (_, i) => ({
    id: `${c.id}-${i}`,
    ar: c.titleAr,
    en: c.titleEn,
    icon: c.icon,
    items: c.tools
      .slice(i * 6, i * 6 + 6)
      .map((t) => ({
        id: t.id,
        ar: t.titleAr,
        en: t.titleEn,
        icon: t.icon,
        href: `/app.html#${t.id}`,
      })),
  })),
);
heroScenes.push({
  id: "studios",
  ar: "استوديوهات الإبداع",
  en: "Creative studios",
  icon: Layers3,
  items: [
    ...studios.map((s) => ({
      id: s.id,
      ar: s.name.ar,
      en: s.name.en,
      icon: s.icon,
      href: s.href,
    })),
    {
      id: "elements",
      ar: "مكتبة العناصر",
      en: "Elements library",
      icon: Layers3,
      href: "/elements.html",
    },
  ],
});
