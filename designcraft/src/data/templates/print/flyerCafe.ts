import type { DesignTemplate } from '../types';

export const flyerCafe: DesignTemplate = {
  "id": "flyer-cafe",
  "cat": "flyer",
  "nameAr": "فلاير افتتاح كافيه",
  "nameEn": "Cafe opening flyer",
  "descAr": "فلاير A5؛ استبدل العرض والعنوان والتاريخ قبل الطباعة • عناصر قابلة للتعديل • مقاس مقترح عند 300 DPI",
  "descEn": "Cafe opening flyer • Editable artwork • Suggested trim size at 300 DPI",
  "isNew": true,
  "bg": "#fffbeb",
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
      "x": 0.5,
      "y": 0.12,
      "w": 1,
      "h": 0.18,
      "fill": "#78350f",
      "rx": 0,
      "rotation": 0
    },
    {
      "type": "text",
      "text": "قهوة ولمة",
      "x": 0.5,
      "y": 0.12,
      "size": 0.11,
      "fill": "#fef3c7",
      "w": 0.82,
      "fontFamily": "Cairo",
      "fontWeight": 700
    },
    {
      "type": "text",
      "text": "افتتاح فرعنا الجديد",
      "x": 0.5,
      "y": 0.34,
      "size": 0.07,
      "fill": "#78350f",
      "w": 0.82,
      "fontFamily": "Cairo",
      "fontWeight": 700
    },
    {
      "type": "circle",
      "x": 0.5,
      "y": 0.55,
      "size": 0.45,
      "fill": "#fde68a"
    },
    {
      "type": "text",
      "text": "خصم 20%",
      "x": 0.5,
      "y": 0.55,
      "size": 0.11,
      "fill": "#92400e",
      "w": 0.82,
      "fontFamily": "Cairo",
      "fontWeight": 700
    },
    {
      "type": "text",
      "text": "على طلبك الأول",
      "x": 0.5,
      "y": 0.74,
      "size": 0.052,
      "fill": "#78350f",
      "w": 0.82,
      "fontFamily": "Cairo",
      "fontWeight": 700
    },
    {
      "type": "text",
      "text": "العنوان هنا • التاريخ هنا",
      "x": 0.5,
      "y": 0.85,
      "size": 0.035,
      "fill": "#92400e",
      "w": 0.82,
      "fontFamily": "Cairo",
      "fontWeight": 700
    },
    {
      "type": "text",
      "text": "+20 100 000 0000",
      "x": 0.5,
      "y": 0.93,
      "size": 0.032,
      "fill": "#78350f",
      "w": 0.82,
      "fontFamily": "Cairo",
      "fontWeight": 700
    }
  ]
};
