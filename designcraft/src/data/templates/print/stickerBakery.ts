import type { DesignTemplate } from '../types';

export const stickerBakery: DesignTemplate = {
  "id": "sticker-bakery",
  "cat": "sticker",
  "nameAr": "استيكر مخبوزات دائري",
  "nameEn": "Round bakery sticker",
  "descAr": "استيكر دائري للمخبوزات؛ الخلفية مربعة ولا يتضمن مسار قص • عناصر قابلة للتعديل • مقاس مقترح عند 300 DPI",
  "descEn": "Round bakery sticker • Editable artwork • Suggested trim size at 300 DPI",
  "isNew": true,
  "bg": "#fff7ed",
  "baseW": 591,
  "baseH": 591,
  "exactSize": true,
  "print": {
    "widthMm": 50,
    "heightMm": 50,
    "dpi": 300,
    "shape": "circle"
  },
  "objects": [
    {
      "type": "circle",
      "x": 0.5,
      "y": 0.5,
      "size": 0.91,
      "fill": "#92400e"
    },
    {
      "type": "circle",
      "x": 0.5,
      "y": 0.5,
      "size": 0.84,
      "fill": "#ffedd5"
    },
    {
      "type": "text",
      "text": "مخبوز بحب",
      "x": 0.5,
      "y": 0.35,
      "size": 0.105,
      "fill": "#78350f",
      "w": 0.82,
      "fontFamily": "Cairo",
      "fontWeight": 700
    },
    {
      "type": "rect",
      "x": 0.5,
      "y": 0.5,
      "w": 0.52,
      "h": 0.008,
      "fill": "#c2410c",
      "rx": 0,
      "rotation": 0
    },
    {
      "type": "text",
      "text": "مخبز الحارة",
      "x": 0.5,
      "y": 0.62,
      "size": 0.065,
      "fill": "#9a3412",
      "w": 0.82,
      "fontFamily": "Cairo",
      "fontWeight": 700
    },
    {
      "type": "text",
      "text": "FRESH EVERY DAY",
      "x": 0.5,
      "y": 0.74,
      "size": 0.032,
      "fill": "#78350f",
      "w": 0.82,
      "fontFamily": "Cairo",
      "fontWeight": 700
    }
  ]
};
