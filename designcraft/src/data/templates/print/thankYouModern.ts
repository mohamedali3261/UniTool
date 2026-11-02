import type { DesignTemplate } from '../types';

export const thankYouModern: DesignTemplate = {
  "id": "thank-you-modern",
  "cat": "thank-you",
  "nameAr": "كارت شكر عصري",
  "nameEn": "Modern thank-you insert",
  "descAr": "كارت شكر بخلفية كحلية • عناصر قابلة للتعديل • مقاس مقترح عند 300 DPI",
  "descEn": "Modern thank-you insert • Editable artwork • Suggested trim size at 300 DPI",
  "isNew": true,
  "bg": "#172554",
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
      "type": "text",
      "text": "THANK YOU",
      "x": 0.5,
      "y": 0.28,
      "size": 0.09,
      "fill": "#bfdbfe",
      "w": 0.82,
      "fontFamily": "Cairo",
      "fontWeight": 700
    },
    {
      "type": "rect",
      "x": 0.5,
      "y": 0.46,
      "w": 0.65,
      "h": 0.006,
      "fill": "#3b82f6",
      "rx": 0,
      "rotation": 0
    },
    {
      "type": "text",
      "text": "شكرًا لدعم مشروعنا",
      "x": 0.5,
      "y": 0.6,
      "size": 0.055,
      "fill": "#ffffff",
      "w": 0.82,
      "fontFamily": "Cairo",
      "fontWeight": 700
    },
    {
      "type": "text",
      "text": "صنعنا هذا الطلب بكل اهتمام",
      "x": 0.5,
      "y": 0.74,
      "size": 0.03,
      "fill": "#bfdbfe",
      "w": 0.82,
      "fontFamily": "Cairo",
      "fontWeight": 700
    },
    {
      "type": "text",
      "text": "YOUR BRAND",
      "x": 0.5,
      "y": 0.87,
      "size": 0.024,
      "fill": "#93c5fd",
      "w": 0.82,
      "fontFamily": "Cairo",
      "fontWeight": 700
    }
  ]
};
