import { motionPack2 } from "./pack2/catalog";
export const creativeCatalog = [
  ["scramble", "Text scramble · تشفير الحروف", "typography"],
  ["split", "Split reveal · كشف الكلمات بالقناع", "typography"],
  ["sweep", "Gradient sweep · لمعة النص", "typography"],
  ["weight", "Variable font morph · وزن الخط المتغير", "typography"],
  ["marker", "Highlight marker · تمييز الكلمة الأخيرة", "typography"],
  ["odometer", "Odometer · عداد الأرقام", "typography"],
  ["blob", "Morphing blob · شكل عضوي متحول", "backgrounds"],
  ["mesh", "Mesh gradient · ألوان سائلة", "backgrounds"],
  ["grid", "Pointer grid · شبكة مضيئة", "backgrounds"],
  ["aurora", "Aurora · أشرطة الشفق", "backgrounds"],
  ["grain", "Noise grain · حبيبات سينمائية", "backgrounds"],
  ["glass", "Glassmorphism · بطاقة زجاجية", "panels"],
  ["three", "Floating 3D · كرات ومكعب وTorus", "backgrounds"],
  ["bento", "Bento grid · بطاقات متتابعة", "panels"],
  ["island", "Dynamic island · كبسولة مرنة", "panels"],
  ["command", "Command palette · نافذة بحث", "panels"],
  ["toasts", "Toast stack · إشعارات متراصة", "panels"],
  ["skeleton", "Skeleton · تحميل لامع", "panels"],
  ["controls", "Spring controls · تحكم نابض", "panels"],
  ["cursor", "Custom cursor · مؤشر تفاعلي مصمم", "panels"],
  ["magnet", "Magnetic button · زر مغناطيسي", "panels"],
  ["shared", "Shared element · كارت يتمدد", "motion"],
  ["circle", "Circle reveal · كشف دائري", "motion"],
  ["flip", "Page flip · قلب الصفحة", "motion"],
  ["zoom", "Zoom through · عبور العنصر", "motion"],
  ["liquid", "Liquid wipe · انتقال سائل", "motion"],
  ["line", "Line draw · رسم بياني متدرج", "motion"],
  ["donut", "Radial progress · دائرة تقدم", "motion"],
  ["sparkline", "Sparklines · مؤشرات مصغرة", "motion"],
  ["heatmap", "Heatmap · خريطة حرارية", "motion"],
  ["flow", "Data flow · تدفق البيانات", "motion"],
  ["stroke", "Stroke draw · رسم أيقونة", "motion"],
  ["morph", "Icon morph · قائمة تتحول إلى X", "motion"],
  ["bounce", "Icon bounce · ارتداد مرن", "motion"],
  ["spinners", "Loading spinners · أقواس ونقط ونبض", "motion"],
  ["confetti", "Confetti particles · قصاصات نجاح", "motion"],
  ...motionPack2,
] as const;
export type CreativeId = (typeof creativeCatalog)[number][0];
export type CreativeSettings = {
  id: CreativeId;
  speed: number;
  strength: number;
  pointerX: number;
  pointerY: number;
  highlight?: string;
  value?: number;
  data?: number[];
};
export const isCreativeId = (id: unknown): id is CreativeId =>
  creativeCatalog.some((item) => item[0] === id);
export function validCreative(value: unknown): value is CreativeSettings {
  if (!value || typeof value !== "object") return false;
  const c = value as CreativeSettings;
  return (
    (c.highlight === undefined ||
      (typeof c.highlight === "string" && c.highlight.length <= 100)) &&
    (c.value === undefined ||
      (Number.isFinite(c.value) && c.value >= 0 && c.value <= 100)) &&
    (c.data === undefined ||
      (Array.isArray(c.data) &&
        c.data.length >= 2 &&
        c.data.length <= 64 &&
        c.data.every((n) => Number.isFinite(n) && Math.abs(n) <= 10000))) &&
    isCreativeId(c.id) &&
    Number.isFinite(c.speed) &&
    c.speed >= 0.1 &&
    c.speed <= 4 &&
    Number.isFinite(c.strength) &&
    c.strength >= 0.1 &&
    c.strength <= 2 &&
    [c.pointerX, c.pointerY].every(
      (n) => Number.isFinite(n) && n >= 0 && n <= 100,
    )
  );
}
export const textCreativeIds = new Set<CreativeId>([
  "scramble",
  "split",
  "sweep",
  "weight",
  "marker",
  "odometer",
  ...motionPack2
    .filter((entry) => entry[2] === "typography")
    .map((entry) => entry[0]),
]);
