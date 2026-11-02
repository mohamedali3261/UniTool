export const soundCategories = [
  { id: "whoosh", name: "انتقالات" },
  { id: "impact", name: "ضربات" },
  { id: "ui", name: "واجهة ونقرات" },
  { id: "chime", name: "تنبيهات ونغمات" },
  { id: "cinema", name: "سينمائي" },
  { id: "nature", name: "أجواء وطبيعة" },
  { id: "rhythm", name: "إيقاع" },
] as const;
export type SoundCategory = (typeof soundCategories)[number]["id"];
export type SoundPreset = {
  id: string;
  name: string;
  category: SoundCategory;
  variant: number;
  seconds: number;
};
const names: Record<SoundCategory, string[]> = {
  whoosh: [
    "مرور هوائي",
    "سحب سريع",
    "اندفاع فضائي",
    "انتقال عكسي",
    "انزلاق ناعم",
    "موجة صاعدة",
    "مرور معدني",
    "فتح بوابة",
  ],
  impact: [
    "ضربة عميقة",
    "دقّة سينمائية",
    "اصطدام معدني",
    "هبوط قوي",
    "صدمة قصيرة",
    "طرق خشبي",
    "ضربة إلكترونية",
    "إغلاق ثقيل",
  ],
  ui: [
    "نقرة نظيفة",
    "زر زجاجي",
    "تبديل واجهة",
    "نقرة مزدوجة",
    "فتح قائمة",
    "إغلاق قائمة",
    "تحديد عنصر",
    "تأكيد سريع",
  ],
  chime: [
    "إشعار هادئ",
    "نجاح لامع",
    "جرس بلوري",
    "رسالة جديدة",
    "نجمة صغيرة",
    "رنين دافئ",
    "لمعة صاعدة",
    "نهاية سعيدة",
  ],
  cinema: [
    "صعود توتر",
    "نبض فضائي",
    "درون عميق",
    "كشف مفاجئ",
    "بريق مستقبلي",
    "بوابة غامضة",
    "ذبذبة مظلمة",
    "شعار ملحمي",
  ],
  nature: [
    "نسيم خفيف",
    "مطر رقمي",
    "موجة بحر",
    "قطرات ماء",
    "هبات رياح",
    "حفيف ناعم",
    "فقاعات",
    "ليل هادئ",
  ],
  rhythm: [
    "Kick عميق",
    "Snare قصير",
    "Hi-hat مغلق",
    "Hi-hat مفتوح",
    "Clap إلكتروني",
    "Tom منخفض",
    "نبضتان",
    "دقّة إيقاعية",
  ],
};
export const soundPresets: SoundPreset[] = soundCategories.flatMap((c) =>
  names[c.id].map((name, variant) => ({
    id: `${c.id}-${variant + 1}`,
    name,
    category: c.id,
    variant,
    seconds:
      c.id === "nature"
        ? 3
        : c.id === "cinema"
          ? 2.4
          : c.id === "whoosh"
            ? 0.6 + variant * 0.12
            : c.id === "chime"
              ? 1.2 + variant * 0.08
              : c.id === "ui"
                ? 0.22 + variant * 0.035
                : 0.7 + variant * 0.07,
  })),
);
export const soundById = new Map(soundPresets.map((s) => [s.id, s]));
