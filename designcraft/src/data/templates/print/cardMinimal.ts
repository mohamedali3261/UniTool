import type { DesignTemplate } from '../types';

export const cardMinimal: DesignTemplate = {
  "id": "card-minimal",
  "cat": "business-card",
  "nameAr": "كارت شخصي بسيط",
  "nameEn": "Minimal personal card",
  "descAr": "كارت شخصي بسيط بمقاس أوروبي مقترح • عناصر قابلة للتعديل • مقاس مقترح عند 300 DPI",
  "descEn": "Minimal personal card • Editable artwork • Suggested trim size at 300 DPI",
  "isNew": true,
  "bg": "#fafaf9",
  "baseW": 1004,
  "baseH": 650,
  "exactSize": true,
  "print": {
    "widthMm": 85,
    "heightMm": 55,
    "dpi": 300,
    "shape": "rectangle"
  },
  "objects": [
    {
      "type": "rect",
      "x": 0.5,
      "y": 0.08,
      "w": 0.86,
      "h": 0.012,
      "fill": "#18181b",
      "rx": 0,
      "rotation": 0
    },
    {
      "type": "text",
      "text": "سارة محمود",
      "x": 0.5,
      "y": 0.35,
      "size": 0.075,
      "fill": "#18181b",
      "w": 0.82,
      "fontFamily": "Cairo",
      "fontWeight": 700
    },
    {
      "type": "text",
      "text": "استشارات وتسويق",
      "x": 0.5,
      "y": 0.52,
      "size": 0.034,
      "fill": "#52525b",
      "w": 0.82,
      "fontFamily": "Cairo",
      "fontWeight": 700
    },
    {
      "type": "text",
      "text": "hello@example.com  •  +20 100 000 0000",
      "x": 0.5,
      "y": 0.78,
      "size": 0.025,
      "fill": "#3f3f46",
      "w": 0.82,
      "fontFamily": "Cairo",
      "fontWeight": 700
    }
  ]
};
