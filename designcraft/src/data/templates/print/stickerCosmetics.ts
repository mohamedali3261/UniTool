import type { DesignTemplate } from '../types';

export const stickerCosmetics: DesignTemplate = {
  "id": "sticker-cosmetics",
  "cat": "sticker",
  "nameAr": "ملصق عناية طبيعي",
  "nameEn": "Natural skincare label",
  "descAr": "ملصق رأسي لمنتجات العناية؛ عدّل بيانات المنتج • عناصر قابلة للتعديل • مقاس مقترح عند 300 DPI",
  "descEn": "Natural skincare label • Editable artwork • Suggested trim size at 300 DPI",
  "isNew": true,
  "bg": "#fdf2f8",
  "baseW": 531,
  "baseH": 827,
  "exactSize": true,
  "print": {
    "widthMm": 45,
    "heightMm": 70,
    "dpi": 300,
    "shape": "rectangle"
  },
  "objects": [
    {
      "type": "rect",
      "x": 0.1,
      "y": 0.5,
      "w": 0.04,
      "h": 0.86,
      "fill": "#be185d",
      "rx": 0,
      "rotation": 0
    },
    {
      "type": "text",
      "text": "NŪRA",
      "x": 0.54,
      "y": 0.19,
      "size": 0.115,
      "fill": "#831843",
      "w": 0.82,
      "fontFamily": "Cairo",
      "fontWeight": 700
    },
    {
      "type": "text",
      "text": "عناية طبيعية",
      "x": 0.54,
      "y": 0.33,
      "size": 0.065,
      "fill": "#9d174d",
      "w": 0.82,
      "fontFamily": "Cairo",
      "fontWeight": 700
    },
    {
      "type": "circle",
      "x": 0.54,
      "y": 0.53,
      "size": 0.36,
      "fill": "#fbcfe8"
    },
    {
      "type": "text",
      "text": "ROSE",
      "x": 0.54,
      "y": 0.53,
      "size": 0.07,
      "fill": "#831843",
      "w": 0.82,
      "fontFamily": "Cairo",
      "fontWeight": 700
    },
    {
      "type": "text",
      "text": "زيت الورد",
      "x": 0.54,
      "y": 0.72,
      "size": 0.07,
      "fill": "#831843",
      "w": 0.82,
      "fontFamily": "Cairo",
      "fontWeight": 700
    },
    {
      "type": "text",
      "text": "30 ml • YOUR BRAND",
      "x": 0.54,
      "y": 0.86,
      "size": 0.033,
      "fill": "#9d174d",
      "w": 0.82,
      "fontFamily": "Cairo",
      "fontWeight": 700
    }
  ]
};
