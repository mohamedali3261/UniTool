import type { DesignTemplate } from '../types';

export const flyerWorkshop: DesignTemplate = {
  "id": "flyer-workshop",
  "cat": "flyer",
  "nameAr": "فلاير ورشة عمل",
  "nameEn": "Creative workshop flyer",
  "descAr": "فلاير A5 لورش العمل والفعاليات • عناصر قابلة للتعديل • مقاس مقترح عند 300 DPI",
  "descEn": "Creative workshop flyer • Editable artwork • Suggested trim size at 300 DPI",
  "isNew": true,
  "bg": "#eef2ff",
  "baseW": 1748,
  "baseH": 2480,
  "exactSize": true,
  "print": {
    "widthMm": 148,
    "heightMm": 210,
    "dpi": 300,
    "shape": "rectangle"
  },
  "objects": [
    {
      "type": "rect",
      "x": 0.2,
      "y": 0.17,
      "w": 0.12,
      "h": 0.2,
      "fill": "#818cf8",
      "rx": 0.01,
      "rotation": 15
    },
    {
      "type": "text",
      "text": "مساحة للإبداع",
      "x": 0.6,
      "y": 0.18,
      "size": 0.085,
      "fill": "#312e81",
      "w": 0.65,
      "fontFamily": "Cairo",
      "fontWeight": 700
    },
    {
      "type": "text",
      "text": "ورشة تصميم",
      "x": 0.5,
      "y": 0.39,
      "size": 0.105,
      "fill": "#4338ca",
      "w": 0.82,
      "fontFamily": "Cairo",
      "fontWeight": 700
    },
    {
      "type": "text",
      "text": "من الفكرة إلى التنفيذ",
      "x": 0.5,
      "y": 0.52,
      "size": 0.05,
      "fill": "#3730a3",
      "w": 0.82,
      "fontFamily": "Cairo",
      "fontWeight": 700
    },
    {
      "type": "rect",
      "x": 0.5,
      "y": 0.69,
      "w": 0.84,
      "h": 0.17,
      "fill": "#4338ca",
      "rx": 0.025,
      "rotation": 0
    },
    {
      "type": "text",
      "text": "احجز مكانك الآن",
      "x": 0.5,
      "y": 0.69,
      "size": 0.056,
      "fill": "#ffffff",
      "w": 0.82,
      "fontFamily": "Cairo",
      "fontWeight": 700
    },
    {
      "type": "text",
      "text": "التاريخ • المكان • رابط التسجيل",
      "x": 0.5,
      "y": 0.86,
      "size": 0.033,
      "fill": "#312e81",
      "w": 0.82,
      "fontFamily": "Cairo",
      "fontWeight": 700
    }
  ]
};
