import type { DesignTemplate } from '../types';

export const thankYouWarm: DesignTemplate = {
  "id": "thank-you-warm",
  "cat": "thank-you",
  "nameAr": "كارت شكر دافئ",
  "nameEn": "Warm thank-you insert",
  "descAr": "كارت شكر داخل الطلبات • عناصر قابلة للتعديل • مقاس مقترح عند 300 DPI",
  "descEn": "Warm thank-you insert • Editable artwork • Suggested trim size at 300 DPI",
  "isNew": true,
  "bg": "#fff7ed",
  "baseW": 1181,
  "baseH": 827,
  "exactSize": true,
  "print": {
    "widthMm": 100,
    "heightMm": 70,
    "dpi": 300,
    "shape": "rectangle"
  },
  "objects": [
    {
      "type": "circle",
      "x": 0.13,
      "y": 0.18,
      "size": 0.18,
      "fill": "#fed7aa"
    },
    {
      "type": "circle",
      "x": 0.9,
      "y": 0.86,
      "size": 0.24,
      "fill": "#ffedd5"
    },
    {
      "type": "text",
      "text": "شكرًا لاختيارك لنا",
      "x": 0.5,
      "y": 0.34,
      "size": 0.068,
      "fill": "#9a3412",
      "w": 0.82,
      "fontFamily": "Cairo",
      "fontWeight": 700
    },
    {
      "type": "text",
      "text": "طلبك أسعدنا، ونتمنى أن يسعدك",
      "x": 0.5,
      "y": 0.53,
      "size": 0.033,
      "fill": "#7c2d12",
      "w": 0.82,
      "fontFamily": "Cairo",
      "fontWeight": 700
    },
    {
      "type": "text",
      "text": "شاركنا تجربتك",
      "x": 0.5,
      "y": 0.68,
      "size": 0.033,
      "fill": "#9a3412",
      "w": 0.82,
      "fontFamily": "Cairo",
      "fontWeight": 700
    },
    {
      "type": "text",
      "text": "@yourbrand  •  example.com",
      "x": 0.5,
      "y": 0.83,
      "size": 0.026,
      "fill": "#7c2d12",
      "w": 0.82,
      "fontFamily": "Cairo",
      "fontWeight": 700
    }
  ]
};
