import type { DesignTemplate } from '../types';

export const stickerHandmade: DesignTemplate = {
  "id": "sticker-handmade",
  "cat": "sticker",
  "nameAr": "استيكر مصنوع يدويًا",
  "nameEn": "Handmade botanical sticker",
  "descAr": "استيكر منتجات يدوية بطابع نباتي • عناصر قابلة للتعديل • مقاس مقترح عند 300 DPI",
  "descEn": "Handmade botanical sticker • Editable artwork • Suggested trim size at 300 DPI",
  "isNew": true,
  "bg": "#f0fdf4",
  "baseW": 709,
  "baseH": 709,
  "exactSize": true,
  "print": {
    "widthMm": 60,
    "heightMm": 60,
    "dpi": 300,
    "shape": "rectangle"
  },
  "objects": [
    {
      "type": "circle",
      "x": 0.25,
      "y": 0.26,
      "size": 0.2,
      "fill": "#bbf7d0"
    },
    {
      "type": "circle",
      "x": 0.78,
      "y": 0.75,
      "size": 0.27,
      "fill": "#dcfce7"
    },
    {
      "type": "rect",
      "x": 0.5,
      "y": 0.5,
      "w": 0.84,
      "h": 0.84,
      "fill": "#ffffff",
      "rx": 0.05,
      "rotation": 0
    },
    {
      "type": "text",
      "text": "صُنع يدويًا",
      "x": 0.5,
      "y": 0.38,
      "size": 0.105,
      "fill": "#166534",
      "w": 0.82,
      "fontFamily": "Cairo",
      "fontWeight": 700
    },
    {
      "type": "text",
      "text": "تفاصيل صغيرة، حب كبير",
      "x": 0.5,
      "y": 0.58,
      "size": 0.047,
      "fill": "#15803d",
      "w": 0.82,
      "fontFamily": "Cairo",
      "fontWeight": 700
    },
    {
      "type": "rect",
      "x": 0.5,
      "y": 0.71,
      "w": 0.3,
      "h": 0.012,
      "fill": "#86a789",
      "rx": 0,
      "rotation": 0
    },
    {
      "type": "text",
      "text": "YOUR BRAND",
      "x": 0.5,
      "y": 0.8,
      "size": 0.034,
      "fill": "#166534",
      "w": 0.82,
      "fontFamily": "Cairo",
      "fontWeight": 700
    }
  ]
};
