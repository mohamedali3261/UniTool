import type { DesignTemplate } from '../types';

export const cardCreative: DesignTemplate = {
  "id": "card-creative",
  "cat": "business-card",
  "nameAr": "كارت استوديو إبداعي",
  "nameEn": "Creative studio card",
  "descAr": "كارت استوديو بأشكال هندسية قابلة للتلوين • عناصر قابلة للتعديل • مقاس مقترح عند 300 DPI",
  "descEn": "Creative studio card • Editable artwork • Suggested trim size at 300 DPI",
  "isNew": true,
  "bg": "#f3e8ff",
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
      "x": 0.91,
      "y": 0.14,
      "size": 0.33,
      "fill": "#a855f7"
    },
    {
      "type": "rect",
      "x": 0.11,
      "y": 0.85,
      "w": 0.15,
      "h": 0.19,
      "fill": "#facc15",
      "rx": 0.02,
      "rotation": -12
    },
    {
      "type": "text",
      "text": "فكرة ستوديو",
      "x": 0.49,
      "y": 0.35,
      "size": 0.08,
      "fill": "#581c87",
      "w": 0.82,
      "fontFamily": "Cairo",
      "fontWeight": 700
    },
    {
      "type": "text",
      "text": "تصميم • تصوير • محتوى",
      "x": 0.49,
      "y": 0.53,
      "size": 0.037,
      "fill": "#6b21a8",
      "w": 0.82,
      "fontFamily": "Cairo",
      "fontWeight": 700
    },
    {
      "type": "text",
      "text": "studio@example.com",
      "x": 0.49,
      "y": 0.76,
      "size": 0.03,
      "fill": "#581c87",
      "w": 0.82,
      "fontFamily": "Cairo",
      "fontWeight": 700
    }
  ]
};
