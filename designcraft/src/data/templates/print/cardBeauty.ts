import type { DesignTemplate } from '../types';

export const cardBeauty: DesignTemplate = {
  "id": "card-beauty",
  "cat": "business-card",
  "nameAr": "كارت بيوتي وردي",
  "nameEn": "Blush beauty card",
  "descAr": "كارت حجز لمجال التجميل • عناصر قابلة للتعديل • مقاس مقترح عند 300 DPI",
  "descEn": "Blush beauty card • Editable artwork • Suggested trim size at 300 DPI",
  "isNew": true,
  "bg": "#fff1f2",
  "baseW": 1063,
  "baseH": 591,
  "exactSize": true,
  "print": {
    "widthMm": 90,
    "heightMm": 50,
    "dpi": 300,
    "shape": "rectangle"
  },
  "objects": [
    {
      "type": "rect",
      "x": 0.5,
      "y": 0.5,
      "w": 0.91,
      "h": 0.84,
      "fill": "#ffe4e6",
      "rx": 0.04,
      "rotation": 0
    },
    {
      "type": "text",
      "text": "LINA BEAUTY",
      "x": 0.5,
      "y": 0.3,
      "size": 0.068,
      "fill": "#881337",
      "w": 0.82,
      "fontFamily": "Cairo",
      "fontWeight": 700
    },
    {
      "type": "text",
      "text": "جمالك في التفاصيل",
      "x": 0.5,
      "y": 0.49,
      "size": 0.041,
      "fill": "#9f1239",
      "w": 0.82,
      "fontFamily": "Cairo",
      "fontWeight": 700
    },
    {
      "type": "rect",
      "x": 0.5,
      "y": 0.64,
      "w": 0.45,
      "h": 0.007,
      "fill": "#fb7185",
      "rx": 0,
      "rotation": 0
    },
    {
      "type": "text",
      "text": "BOOKING  +20 100 000 0000",
      "x": 0.5,
      "y": 0.78,
      "size": 0.028,
      "fill": "#881337",
      "w": 0.82,
      "fontFamily": "Cairo",
      "fontWeight": 700
    }
  ]
};
