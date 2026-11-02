import type { DesignTemplate } from '../types';

export const cardVertical: DesignTemplate = {
  "id": "card-vertical",
  "cat": "business-card",
  "nameAr": "كارت شخصي رأسي",
  "nameEn": "Vertical architect card",
  "descAr": "كارت رأسي للمهندسين والمستقلين • عناصر قابلة للتعديل • مقاس مقترح عند 300 DPI",
  "descEn": "Vertical architect card • Editable artwork • Suggested trim size at 300 DPI",
  "isNew": true,
  "bg": "#ecfdf5",
  "baseW": 591,
  "baseH": 1063,
  "exactSize": true,
  "print": {
    "widthMm": 50,
    "heightMm": 90,
    "dpi": 300,
    "shape": "rectangle"
  },
  "objects": [
    {
      "type": "rect",
      "x": 0.18,
      "y": 0.23,
      "w": 0.025,
      "h": 0.3,
      "fill": "#047857",
      "rx": 0,
      "rotation": 0
    },
    {
      "type": "rect",
      "x": 0.39,
      "y": 0.1,
      "w": 0.4,
      "h": 0.014,
      "fill": "#047857",
      "rx": 0,
      "rotation": 0
    },
    {
      "type": "text",
      "text": "عمر حسن",
      "x": 0.5,
      "y": 0.43,
      "size": 0.115,
      "fill": "#064e3b",
      "w": 0.82,
      "fontFamily": "Cairo",
      "fontWeight": 700
    },
    {
      "type": "text",
      "text": "مهندس معماري",
      "x": 0.5,
      "y": 0.56,
      "size": 0.062,
      "fill": "#047857",
      "w": 0.82,
      "fontFamily": "Cairo",
      "fontWeight": 700
    },
    {
      "type": "text",
      "text": "OMAR HASSAN",
      "x": 0.5,
      "y": 0.68,
      "size": 0.048,
      "fill": "#064e3b",
      "w": 0.82,
      "fontFamily": "Cairo",
      "fontWeight": 700
    },
    {
      "type": "text",
      "text": "hello@example.com",
      "x": 0.5,
      "y": 0.81,
      "size": 0.04,
      "fill": "#047857",
      "w": 0.82,
      "fontFamily": "Cairo",
      "fontWeight": 700
    },
    {
      "type": "text",
      "text": "+20 100 000 0000",
      "x": 0.5,
      "y": 0.88,
      "size": 0.038,
      "fill": "#047857",
      "w": 0.82,
      "fontFamily": "Cairo",
      "fontWeight": 700
    }
  ]
};
