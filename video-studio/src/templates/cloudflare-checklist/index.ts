import type { StudioTemplate } from "../types";
export const cloudflareChecklist: StudioTemplate = {
  id: "cloudflare-checklist",
  name: "Cloudflare — قبل ما تنشر",
  ratio: "9:16",
  colors: ["#10131a", "#f6821f"],
  description:
    "٦٦ ثانية • ٥ خطوات قبل النشر • Terminal وكود وبيانات وواجهات متحركة • عناصر مستقلة قابلة للتعديل",
  scenes: [
    {
      text: "موقعك وقع بعد ما رفعته؟ 😬",
      caption: "اعمل الـ 5 دول الأول",
      seconds: 4,
    },
    { text: "اختار قاعدة بيانات صح", caption: "D1 / SQLite", seconds: 12 },
    {
      text: "متحطش المفاتيح في الكود",
      caption: "Environment Variables",
      seconds: 12,
    },
    { text: "خلّي الموقع يطير", caption: "Caching / Edge", seconds: 12 },
    { text: "جرّب قبل ما تنشر", caption: "Preview Deployments", seconds: 12 },
    { text: "اعرف المشكلة قبل المستخدم", caption: "Monitoring", seconds: 8 },
    {
      text: "اكتب Cloudflare في التعليقات",
      caption: "وهبعتلك الـ checklist",
      seconds: 6,
    },
  ],
};
