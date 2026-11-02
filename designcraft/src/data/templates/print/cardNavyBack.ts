import type { DesignTemplate } from '../types';

export const cardNavyBack: DesignTemplate = {
  "id": "card-navy-back",
  "cat": "business-card",
  "nameAr": "كارت أعمال كحلي — خلفي",
  "nameEn": "Navy business card back",
  "descAr": "وجه خلفي ببيانات تجريبية؛ استبدلها قبل التصدير • عناصر قابلة للتعديل • مقاس مقترح عند 300 DPI",
  "descEn": "Navy business card back • Editable artwork • Suggested trim size at 300 DPI",
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
      "type": "circle",
      "x": 0.18,
      "y": 0.5,
      "size": 0.16,
      "fill": "#fbbf24"
    },
    {
      "type": "text",
      "text": "A",
      "x": 0.18,
      "y": 0.5,
      "size": 0.085,
      "fill": "#0f172a",
      "w": 0.15,
      "fontFamily": "Cairo",
      "fontWeight": 700
    },
    {
      "type": "text",
      "text": "تواصل معي",
      "x": 0.65,
      "y": 0.25,
      "size": 0.052,
      "fill": "#fbbf24",
      "w": 0.55,
      "fontFamily": "Cairo",
      "fontWeight": 700
    },
    {
      "type": "text",
      "text": "+20 100 000 0000",
      "x": 0.65,
      "y": 0.45,
      "size": 0.031,
      "fill": "#ffffff",
      "w": 0.55,
      "fontFamily": "Cairo",
      "fontWeight": 700
    },
    {
      "type": "text",
      "text": "hello@example.com",
      "x": 0.65,
      "y": 0.61,
      "size": 0.03,
      "fill": "#cbd5e1",
      "w": 0.55,
      "fontFamily": "Cairo",
      "fontWeight": 700
    },
    {
      "type": "text",
      "text": "example.com",
      "x": 0.65,
      "y": 0.77,
      "size": 0.03,
      "fill": "#cbd5e1",
      "w": 0.55,
      "fontFamily": "Cairo",
      "fontWeight": 700
    }
  ]
};
