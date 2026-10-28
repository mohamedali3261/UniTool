import type { StudioTemplate } from "../types";
export const product: StudioTemplate = {
  id: "product",
  name: "إعلان منتج",
  description: "افتتاحية، ميزة أساسية، ودعوة للطلب",
  ratio: "4:5",
  colors: ["#302145", "#f9c385"],
  scenes: [
    {
      text: "تفاصيل بتفرق",
      caption: "اسم المنتج • مجموعتك الجديدة",
      seconds: 4,
    },
    { text: "مصمّم علشانك", caption: "اكتب أهم ميزة لمنتجك", seconds: 4 },
    { text: "اختار تميّزك", caption: "اطلب الآن • أضف رابطك هنا", seconds: 4 },
  ],
};
