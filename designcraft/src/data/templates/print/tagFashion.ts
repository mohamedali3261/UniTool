import type { DesignTemplate } from '../types';

export const tagFashion: DesignTemplate = {
  "id": "tag-fashion",
  "cat": "product-tag",
  "nameAr": "تاج ملابس أنيق",
  "nameEn": "Elegant clothing tag",
  "descAr": "تاج ملابس؛ الدائرة العلوية إشارة بصرية وليست أمر تثقيب • عناصر قابلة للتعديل • مقاس مقترح عند 300 DPI",
  "descEn": "Elegant clothing tag • Editable artwork • Suggested trim size at 300 DPI",
  "isNew": true,
  "bg": "#fafaf9",
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
      "type": "circle",
      "x": 0.5,
      "y": 0.075,
      "size": 0.035,
      "fill": "#a8a29e"
    },
    {
      "type": "text",
      "text": "MŌDE",
      "x": 0.5,
      "y": 0.3,
      "size": 0.16,
      "fill": "#292524",
      "w": 0.82,
      "fontFamily": "Cairo",
      "fontWeight": 700
    },
    {
      "type": "text",
      "text": "تفاصيل تصنع الفرق",
      "x": 0.5,
      "y": 0.46,
      "size": 0.053,
      "fill": "#57534e",
      "w": 0.82,
      "fontFamily": "Cairo",
      "fontWeight": 700
    },
    {
      "type": "rect",
      "x": 0.5,
      "y": 0.58,
      "w": 0.6,
      "h": 0.005,
      "fill": "#a8a29e",
      "rx": 0,
      "rotation": 0
    },
    {
      "type": "text",
      "text": "SIZE  M",
      "x": 0.5,
      "y": 0.69,
      "size": 0.067,
      "fill": "#292524",
      "w": 0.82,
      "fontFamily": "Cairo",
      "fontWeight": 700
    },
    {
      "type": "text",
      "text": "EGP 000",
      "x": 0.5,
      "y": 0.8,
      "size": 0.055,
      "fill": "#57534e",
      "w": 0.82,
      "fontFamily": "Cairo",
      "fontWeight": 700
    },
    {
      "type": "text",
      "text": "example.com",
      "x": 0.5,
      "y": 0.91,
      "size": 0.032,
      "fill": "#57534e",
      "w": 0.82,
      "fontFamily": "Cairo",
      "fontWeight": 700
    }
  ]
};
