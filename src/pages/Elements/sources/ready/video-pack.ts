import type { LibraryElement } from "../../types";
import { label, panel, palette } from "./primitives";
/** Original compact SVG overlays. No remote requests, icon fonts or external assets. */
const icons = [
  [
    "كاميرا فيديو",
    '<rect x="4" y="7" width="11" height="10" rx="2"/><path d="m15 10 5-3v10l-5-3"/>',
  ],
  [
    "مايكروفون بودكاست",
    '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6 10v2a6 6 0 0 0 12 0v-2M12 18v4M8 22h8"/>',
  ],
  [
    "تشغيل الفيديو",
    '<circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4Z"/>',
  ],
  ["إيقاف مؤقت", '<circle cx="12" cy="12" r="9"/><path d="M9 8v8M15 8v8"/>'],
  [
    "رفع الصوت",
    '<path d="M3 9h4l5-4v14l-5-4H3ZM16 8a6 6 0 0 1 0 8M19 5a10 10 0 0 1 0 14"/>',
  ],
  ["كتم الصوت", '<path d="M3 9h4l5-4v14l-5-4H3ZM16 9l6 6M22 9l-6 6"/>'],
  [
    "مشاركة الفيديو",
    '<circle cx="5" cy="12" r="3"/><circle cx="19" cy="5" r="3"/><circle cx="19" cy="19" r="3"/><path d="m8 11 8-5M8 13l8 5"/>',
  ],
  ["جرس تنبيه", '<path d="M5 17h14l-2-4V9a5 5 0 0 0-10 0v4ZM10 21h4"/>'],
  ["إعجاب", '<path d="M8 20H3V10h5m0 10h10l3-10h-8l1-6-3-1-3 7Z"/>'],
  ["تعليق جمهور", '<path d="M3 4h18v13H9l-6 4ZM7 8h10M7 12h7"/>'],
  ["حفظ حلقة", '<path d="M6 3h12v19l-6-4-6 4Z"/>'],
  [
    "سماعة مونتاج",
    '<path d="M4 14v-3a8 8 0 0 1 16 0v3"/><rect x="2" y="12" width="5" height="8" rx="2"/><rect x="17" y="12" width="5" height="8" rx="2"/>',
  ],
  [
    "عداد وقت",
    '<circle cx="12" cy="14" r="8"/><path d="M12 14V9M9 2h6M12 2v4M18 6l2-2"/>',
  ],
  [
    "تقويم نشر",
    '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 2v6M17 2v6M3 11h18M8 15h2M14 15h2"/>',
  ],
  ["رابط خارجي", '<path d="M14 3h7v7M21 3 10 14M11 5H3v16h16v-8"/>'],
  ["تنزيل ملف", '<path d="M12 2v13m-5-5 5 5 5-5M3 16v5h18v-5"/>'],
  ["رفع ملف", '<path d="M12 16V3m-5 5 5-5 5 5M3 16v5h18v-5"/>'],
  ["مؤشر نقر", '<path d="m5 2 15 12-8 1-4 7ZM15 3l2-2M20 6h3M3 13H1"/>'],
  [
    "موقع تصوير",
    '<path d="M12 22S4 14 4 9a8 8 0 0 1 16 0c0 5-8 13-8 13Z"/><circle cx="12" cy="9" r="3"/>',
  ],
  [
    "بريد تواصل",
    '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 5 10 8L22 5"/>',
  ],
  ["حقيبة منتج", '<path d="M4 8h16l2 13H2ZM8 8V6a4 4 0 0 1 8 0v2"/>'],
  ["درع موثوق", '<path d="m12 2 9 4-2 10-7 6-7-6L3 6ZM8 12l3 3 5-6"/>'],
  ["رسم نمو", '<path d="M3 2v19h19M6 16l5-6 4 3 6-9M16 4h5v5"/>'],
  [
    "شبكة عالمية",
    '<circle cx="12" cy="12" r="10"/><ellipse cx="12" cy="12" rx="4" ry="10"/><path d="M2 12h20M4 6h16M4 18h16"/>',
  ],
] as const;
export const videoIcons: LibraryElement[] = icons.map(([name, body], i) => ({
  id: `video-icon-${i}`,
  name,
  source: "unitool-ready",
  sourceName: "UniTool Ready",
  category: "shapes",
  kind: "svg",
  placement: "content",
  defaultWidth: 20,
  animated: false,
  svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240"><g transform="scale(10)" fill="none" stroke="${palette[i % palette.length]}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`,
}));
const titles = [
  "عنوان الحلقة",
  "اسم المتحدث",
  "سؤال الجمهور",
  "مصدر المعلومة",
  "نصيحة سريعة",
  "مراجعة المنتج",
  "ملخص الدرس",
  "تنبيه مهم",
  "الفصل التالي",
  "تجربة المستخدم",
  "نتيجة الاختبار",
  "تواصل معنا",
];
const details = [
  "بودكاست الأسبوع",
  "المسمى الوظيفي",
  "اكتب سؤالك هنا",
  "example.com",
  "جرّبها في مشروعك",
  "رأيك يصنع الفرق",
  "أهم ثلاث نقاط",
  "راجع التفاصيل",
  "نكمل الحكاية",
  "قصة تستحق المشاركة",
  "بيانات قابلة للتحديث",
  "hello@example.com",
];
export const videoKits: LibraryElement[] = titles.map((name, i) => {
  const id = `video-lower-third-${i}`,
    accent = palette[i % palette.length];
  return {
    id,
    name: `شريط فيديو · ${name}`,
    source: "unitool-kits",
    sourceName: "UniTool Kits",
    category: "kits",
    kind: "group",
    animated: false,
    layers: [
      panel(`${id}-base`, 50, 74, 750, 155, "#14232e", i % 2 ? 28 : 6),
      panel(`${id}-accent`, 76, 74, 7, 125, accent, 3),
      label(`${id}-title`, name, 49, 71, 34, "#ffffff"),
      label(`${id}-subtitle`, details[i], 49, 79, 20, accent),
    ],
  };
});
export const videoLabels: LibraryElement[] = titles.map((name, i) => ({
  id: `video-label-${i}`,
  name: `عنوان فيديو · ${name}`,
  source: "unitool-ready",
  sourceName: "UniTool Ready",
  category: "typography",
  kind: "layer",
  animated: false,
  layer: label(
    `video-label-${i}`,
    name,
    50,
    50,
    40,
    palette[i % palette.length],
  ),
}));
