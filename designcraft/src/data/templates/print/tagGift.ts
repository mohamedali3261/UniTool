import type { DesignTemplate } from '../types';

export const tagGift: DesignTemplate = {
  "id": "tag-gift",
  "cat": "product-tag",
  "nameAr": "تاج هدية",
  "nameEn": "Gift tag",
  "descAr": "تاج للهدايا؛ يحتاج القص والتثقيب إلى تجهيز المطبعة • عناصر قابلة للتعديل • مقاس مقترح عند 300 DPI",
  "descEn": "Gift tag • Editable artwork • Suggested trim size at 300 DPI",
  "isNew": true,
  "bg": "#fef2f2",
  "baseW": 650,
  "baseH": 1004,
  "exactSize": true,
  "print": {
    "widthMm": 55,
    "heightMm": 85,
    "dpi": 300,
    "shape": "rectangle"
  },
  "objects": [
    {
      "type": "circle",
      "x": 0.5,
      "y": 0.075,
      "size": 0.035,
      "fill": "#b91c1c"
    },
    {
      "type": "rect",
      "x": 0.5,
      "y": 0.23,
      "w": 0.72,
      "h": 0.045,
      "fill": "#dc2626",
      "rx": 0,
      "rotation": 0
    },
    {
      "type": "text",
      "text": "هدية لك",
      "x": 0.5,
      "y": 0.43,
      "size": 0.14,
      "fill": "#991b1b",
      "w": 0.82,
      "fontFamily": "Cairo",
      "fontWeight": 700
    },
    {
      "type": "text",
      "text": "من القلب إلى القلب",
      "x": 0.5,
      "y": 0.59,
      "size": 0.053,
      "fill": "#b91c1c",
      "w": 0.82,
      "fontFamily": "Cairo",
      "fontWeight": 700
    },
    {
      "type": "rect",
      "x": 0.5,
      "y": 0.74,
      "w": 0.65,
      "h": 0.005,
      "fill": "#fca5a5",
      "rx": 0,
      "rotation": 0
    },
    {
      "type": "text",
      "text": "من: __________",
      "x": 0.5,
      "y": 0.85,
      "size": 0.047,
      "fill": "#991b1b",
      "w": 0.82,
      "fontFamily": "Cairo",
      "fontWeight": 700
    }
  ]
};
