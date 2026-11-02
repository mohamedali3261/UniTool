import type { DesignTemplate } from '../types';

export const cardNavyFront: DesignTemplate = {
  "id": "card-navy-front",
  "cat": "business-card",
  "nameAr": "كارت أعمال كحلي — أمامي",
  "nameEn": "Navy business card front",
  "descAr": "وجه أمامي؛ الوجه الخلفي متاح كقالب مستقل • عناصر قابلة للتعديل • مقاس مقترح عند 300 DPI",
  "descEn": "Navy business card front • Editable artwork • Suggested trim size at 300 DPI",
  "isNew": true,
  "bg": "#0f172a",
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
      "x": 0.08,
      "y": 0.5,
      "w": 0.02,
      "h": 0.76,
      "fill": "#fbbf24",
      "rx": 0,
      "rotation": 0
    },
    {
      "type": "text",
      "text": "أحمد علي",
      "x": 0.54,
      "y": 0.33,
      "size": 0.071,
      "fill": "#f8fafc",
      "w": 0.82,
      "fontFamily": "Cairo",
      "fontWeight": 700
    },
    {
      "type": "text",
      "text": "مصمم هوية بصرية",
      "x": 0.54,
      "y": 0.52,
      "size": 0.034,
      "fill": "#cbd5e1",
      "w": 0.82,
      "fontFamily": "Cairo",
      "fontWeight": 700
    },
    {
      "type": "rect",
      "x": 0.54,
      "y": 0.67,
      "w": 0.62,
      "h": 0.005,
      "fill": "#334155",
      "rx": 0,
      "rotation": 0
    },
    {
      "type": "text",
      "text": "AHMED ALI  /  BRAND DESIGNER",
      "x": 0.54,
      "y": 0.79,
      "size": 0.022,
      "fill": "#fbbf24",
      "w": 0.82,
      "fontFamily": "Cairo",
      "fontWeight": 700
    }
  ]
};
