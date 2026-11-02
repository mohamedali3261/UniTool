import type { DesignTemplate } from '../types';

export const stickerCoffee: DesignTemplate = {
  "id": "sticker-coffee",
  "cat": "sticker",
  "nameAr": "ملصق قهوة مختصة",
  "nameEn": "Specialty coffee label",
  "descAr": "ملصق مستطيل لمنتجات القهوة • عناصر قابلة للتعديل • مقاس مقترح عند 300 DPI",
  "descEn": "Specialty coffee label • Editable artwork • Suggested trim size at 300 DPI",
  "isNew": true,
  "bg": "#292524",
  "baseW": 827,
  "baseH": 531,
  "exactSize": true,
  "print": {
    "widthMm": 70,
    "heightMm": 45,
    "dpi": 300,
    "shape": "rectangle"
  },
  "objects": [
    {
      "type": "rect",
      "x": 0.5,
      "y": 0.1,
      "w": 1,
      "h": 0.08,
      "fill": "#d6b68a",
      "rx": 0,
      "rotation": 0
    },
    {
      "type": "text",
      "text": "BATCH 08",
      "x": 0.5,
      "y": 0.24,
      "size": 0.042,
      "fill": "#d6b68a",
      "w": 0.82,
      "fontFamily": "Cairo",
      "fontWeight": 700
    },
    {
      "type": "text",
      "text": "قهوة مختصة",
      "x": 0.5,
      "y": 0.46,
      "size": 0.09,
      "fill": "#fafaf9",
      "w": 0.82,
      "fontFamily": "Cairo",
      "fontWeight": 700
    },
    {
      "type": "text",
      "text": "إثيوبيا • تحميص متوسط",
      "x": 0.5,
      "y": 0.64,
      "size": 0.038,
      "fill": "#e7e5e4",
      "w": 0.82,
      "fontFamily": "Cairo",
      "fontWeight": 700
    },
    {
      "type": "rect",
      "x": 0.5,
      "y": 0.79,
      "w": 0.78,
      "h": 0.006,
      "fill": "#a8a29e",
      "rx": 0,
      "rotation": 0
    },
    {
      "type": "text",
      "text": "250 g  /  ROASTED WITH CARE",
      "x": 0.5,
      "y": 0.88,
      "size": 0.026,
      "fill": "#d6b68a",
      "w": 0.82,
      "fontFamily": "Cairo",
      "fontWeight": 700
    }
  ]
};
