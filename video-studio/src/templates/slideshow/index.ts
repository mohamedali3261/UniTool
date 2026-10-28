import type { StudioTemplate } from "../types";
export const slideshow: StudioTemplate = {
  id: "slideshow",
  name: "ألبوم لحظات",
  description: "عرض أفقي من ٤ مشاهد وانتقالات ناعمة",
  ratio: "16:9",
  colors: ["#3c2730", "#ffc3ad"],
  scenes: [
    {
      text: "لحظاتنا الحلوة",
      caption: "بدّل الخلفيات بصور ألبومك",
      seconds: 4,
    },
    { text: "تفاصيل بنحبها", caption: "اكتب وصف اللحظة", seconds: 4 },
    { text: "ذكريات بتجمعنا", caption: "تاريخ أو مكان مميز", seconds: 4 },
    { text: "والحكاية مكملة…", caption: "من ألبومك • بكل حب", seconds: 4 },
  ],
};
