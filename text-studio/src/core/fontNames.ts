export const fonts = [
  { id: "cairo", name: "Cairo · القاهرة" },
  { id: "amiri", name: "Amiri · أميري" },
  { id: "changa", name: "Changa · شانغا" },
  { id: "noto", name: "Noto Sans Arabic" },
] as const;
export const family = (font: string) => `TextStudio-${font}`;
