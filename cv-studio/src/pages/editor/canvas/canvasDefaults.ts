import type React from 'react';
import QRCode from 'qrcode';
import type {
  CanvasDividerKind,
  CanvasElement,
  CanvasShapeKind,
  ImageFilterSettings,
  ImageFrameShape,
  PaperDir,
  PaperLang,
} from '../../../core/types';

export const DEFAULT_IMAGE_FILTERS: ImageFilterSettings = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
  grayscale: 0,
  sepia: 0,
  blur: 0,
  zoom: 1,
  panX: 0,
  panY: 0,
  flipX: false,
  flipY: false,
  objectFit: 'cover',
};

export interface ImageFilterPreset {
  id: string;
  labelAr: string;
  labelEn: string;
  values: Partial<ImageFilterSettings>;
}

export const IMAGE_FILTER_PRESETS: ImageFilterPreset[] = [
  {
    id: 'original',
    labelAr: 'أصلي',
    labelEn: 'Original',
    values: { brightness: 100, contrast: 100, saturate: 100, grayscale: 0, sepia: 0, blur: 0 },
  },
  {
    id: 'studio',
    labelAr: 'استوديو نقي',
    labelEn: 'Crisp Studio',
    values: { brightness: 105, contrast: 112, saturate: 108, grayscale: 0, sepia: 0, blur: 0 },
  },
  {
    id: 'bw',
    labelAr: 'أبيض وأسود',
    labelEn: 'Classic B&W',
    values: { brightness: 104, contrast: 118, saturate: 0, grayscale: 100, sepia: 0, blur: 0 },
  },
  {
    id: 'warm',
    labelAr: 'دافئ هادئ',
    labelEn: 'Warm Portrait',
    values: { brightness: 103, contrast: 104, saturate: 110, grayscale: 0, sepia: 28, blur: 0 },
  },
  {
    id: 'vivid',
    labelAr: 'تباين واضح',
    labelEn: 'High Contrast',
    values: { brightness: 102, contrast: 125, saturate: 120, grayscale: 0, sepia: 0, blur: 0 },
  },
];

export function mergeImageFilters(partial?: Partial<ImageFilterSettings>): ImageFilterSettings {
  return {
    ...DEFAULT_IMAGE_FILTERS,
    ...(partial || {}),
  };
}

export function buildImageFilterCss(f?: Partial<ImageFilterSettings>): string {
  const m = mergeImageFilters(f);
  const parts: string[] = [];
  if (m.brightness !== 100) parts.push(`brightness(${m.brightness}%)`);
  if (m.contrast !== 100) parts.push(`contrast(${m.contrast}%)`);
  if (m.saturate !== 100) parts.push(`saturate(${m.saturate}%)`);
  if (m.grayscale > 0) parts.push(`grayscale(${m.grayscale}%)`);
  if (m.sepia > 0) parts.push(`sepia(${m.sepia}%)`);
  if (m.blur > 0) parts.push(`blur(${m.blur}px)`);
  return parts.length ? parts.join(' ') : 'none';
}

export function buildImageTransformCss(f?: Partial<ImageFilterSettings>): string {
  const m = mergeImageFilters(f);
  const sx = (m.flipX ? -1 : 1) * m.zoom;
  const sy = (m.flipY ? -1 : 1) * m.zoom;
  const tx = m.panX;
  const ty = m.panY;
  if (sx === 1 && sy === 1 && tx === 0 && ty === 0) return 'none';
  return `translate(${tx}%, ${ty}%) scale(${sx}, ${sy})`;
}

export function getImageShapeFrameStyle(
  shape: ImageFrameShape = 'circle',
  customRadius?: number,
): React.CSSProperties {
  switch (shape) {
    case 'circle':
      return { borderRadius: '50%' };
    case 'rounded':
      return { borderRadius: `${customRadius ?? 14}px` };
    case 'square':
      return { borderRadius: '2px' };
    case 'arch':
      return { borderRadius: '999px 999px 12px 12px' };
    case 'hexagon':
      return {
        borderRadius: 0,
        clipPath: 'polygon(25% 4%, 75% 4%, 98% 50%, 75% 96%, 25% 96%, 2% 50%)',
      };
    case 'diamond':
      return {
        borderRadius: 0,
        clipPath: 'polygon(50% 2%, 98% 50%, 50% 98%, 2% 50%)',
      };
    default:
      return { borderRadius: '12px' };
  }
}

export function nextElementZIndex(elements?: CanvasElement[]): number {
  if (!elements || elements.length === 0) return 10;
  return Math.max(...elements.map((e) => e.zIndex || 1)) + 1;
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function createCanvasTextElement(
  preset: 'heading' | 'subheading' | 'body' | 'callout',
  opts: {
    paperLang: PaperLang;
    paperDir: PaperDir;
    fontFamily: string;
    accentColor: string;
    existing?: CanvasElement[];
    pageIndex?: number;
  },
): CanvasElement {
  const isAr = opts.paperLang === 'ar';
  const zIndex = nextElementZIndex(opts.existing);
  const pageIndex = opts.pageIndex ?? 0;

  if (preset === 'heading') {
    return {
      id: uid('txt'),
      type: 'text',
      name: isAr ? 'عنوان حر' : 'Custom Heading',
      pageIndex,
      layerPlane: 'overlay',
      zIndex,
      x: 80,
      y: 90,
      width: 300,
      height: 48,
      rotation: 0,
      visible: true,
      locked: false,
      opacity: 1,
      text: isAr ? 'عنوان بارز قابل للتعديل' : 'Editable Custom Heading',
      fontFamily: opts.fontFamily,
      fontSize: 22,
      fontWeight: 800,
      fontStyle: 'normal',
      textDecoration: 'none',
      textAlign: 'start',
      textDir: opts.paperDir,
      lineHeight: 1.3,
      letterSpacing: 0,
      textColor: opts.accentColor || '#1f6f54',
      fillColor: 'transparent',
      strokeColor: 'transparent',
      strokeWidth: 0,
      borderRadius: 6,
      padding: 6,
      shadow: false,
    };
  }

  if (preset === 'subheading') {
    return {
      id: uid('txt'),
      type: 'text',
      name: isAr ? 'عنوان فرعي' : 'Subheading',
      pageIndex,
      layerPlane: 'overlay',
      zIndex,
      x: 90,
      y: 148,
      width: 280,
      height: 38,
      rotation: 0,
      visible: true,
      locked: false,
      opacity: 1,
      text: isAr ? 'مسمى أو ملاحظة تعريفية' : 'Role or Section Subtitle',
      fontFamily: opts.fontFamily,
      fontSize: 15,
      fontWeight: 700,
      fontStyle: 'normal',
      textDecoration: 'none',
      textAlign: 'start',
      textDir: opts.paperDir,
      lineHeight: 1.35,
      letterSpacing: 0,
      textColor: '#334155',
      fillColor: 'transparent',
      strokeColor: 'transparent',
      strokeWidth: 0,
      borderRadius: 6,
      padding: 4,
      shadow: false,
    };
  }

  if (preset === 'callout') {
    return {
      id: uid('txt'),
      type: 'text',
      name: isAr ? 'بطاقة إبراز' : 'Callout Card',
      pageIndex,
      layerPlane: 'overlay',
      zIndex,
      x: 96,
      y: 210,
      width: 310,
      height: 82,
      rotation: 0,
      visible: true,
      locked: false,
      opacity: 1,
      text: isAr
        ? 'أبرز إنجاز: قيادة التحول الرقمي ورفع كفاءة الأداء بنسبة 45%.'
        : 'Key Highlight: Delivered 45% performance gain across core cloud services.',
      fontFamily: opts.fontFamily,
      fontSize: 12.5,
      fontWeight: 600,
      fontStyle: 'normal',
      textDecoration: 'none',
      textAlign: 'start',
      textDir: opts.paperDir,
      lineHeight: 1.5,
      letterSpacing: 0,
      textColor: '#1e293b',
      fillColor: '#ecfdf5',
      strokeColor: opts.accentColor || '#24795e',
      strokeWidth: 1.5,
      borderRadius: 10,
      padding: 10,
      shadow: true,
    };
  }

  return {
    id: uid('txt'),
    type: 'text',
    name: isAr ? 'فقرة نصية' : 'Body Text',
    pageIndex,
    layerPlane: 'overlay',
    zIndex,
    x: 95,
    y: 195,
    width: 320,
    height: 68,
    rotation: 0,
    visible: true,
    locked: false,
    opacity: 1,
    text: isAr
      ? 'اكتب أي نص إضافي هنا وحرّكه بحرية في أي مكان على صفحة السيرة الذاتية.'
      : 'Type any custom note or achievement here and drag it freely anywhere on the sheet.',
    fontFamily: opts.fontFamily,
    fontSize: 12.5,
    fontWeight: 400,
    fontStyle: 'normal',
    textDecoration: 'none',
    textAlign: 'start',
    textDir: opts.paperDir,
    lineHeight: 1.5,
    letterSpacing: 0,
    textColor: '#1f2937',
    fillColor: 'transparent',
    strokeColor: 'transparent',
    strokeWidth: 0,
    borderRadius: 6,
    padding: 6,
    shadow: false,
  };
}

export function createCanvasBadgeElement(opts: {
  paperLang: PaperLang;
  paperDir: PaperDir;
  fontFamily: string;
  accentColor: string;
  existing?: CanvasElement[];
  pageIndex?: number;
  label?: string;
}): CanvasElement {
  const isAr = opts.paperLang === 'ar';
  return {
    id: uid('bdg'),
    type: 'badge',
    name: isAr ? 'شارة مهارة / وسم' : 'Pill Badge',
    pageIndex: opts.pageIndex ?? 0,
    layerPlane: 'overlay',
    zIndex: nextElementZIndex(opts.existing),
    x: 120,
    y: 130,
    width: 156,
    height: 34,
    rotation: 0,
    visible: true,
    locked: false,
    opacity: 1,
    text: opts.label || (isAr ? 'معتمد دولياً ✓' : 'Certified Pro ✓'),
    fontFamily: opts.fontFamily,
    fontSize: 12,
    fontWeight: 700,
    fontStyle: 'normal',
    textDecoration: 'none',
    textAlign: 'center',
    textDir: opts.paperDir,
    lineHeight: 1.2,
    letterSpacing: 0,
    textColor: '#ffffff',
    fillColor: opts.accentColor || '#24795e',
    strokeColor: 'transparent',
    strokeWidth: 0,
    borderRadius: 999,
    padding: 6,
    shadow: false,
  };
}

export function createCanvasImageElement(
  src: string,
  opts: {
    name?: string;
    shape?: ImageFrameShape;
    accentColor?: string;
    existing?: CanvasElement[];
    pageIndex?: number;
  },
): CanvasElement {
  return {
    id: uid('img'),
    type: 'image',
    name: opts.name || 'صورة مضافة / Image',
    pageIndex: opts.pageIndex ?? 0,
    layerPlane: 'overlay',
    zIndex: nextElementZIndex(opts.existing),
    x: 540,
    y: 64,
    width: 124,
    height: 124,
    rotation: 0,
    visible: true,
    locked: false,
    opacity: 1,
    src,
    imageShape: opts.shape || 'rounded',
    imageFilters: { ...DEFAULT_IMAGE_FILTERS },
    strokeColor: opts.accentColor || '#24795e',
    strokeWidth: 2,
    borderRadius: 16,
    shadow: true,
  };
}

export function createCanvasShapeElement(
  shapeKind: CanvasShapeKind,
  opts: {
    accentColor: string;
    underlay?: boolean;
    existing?: CanvasElement[];
    pageIndex?: number;
    labelAr?: string;
  },
): CanvasElement {
  const isCircleLike =
    shapeKind === 'circle' ||
    shapeKind === 'ring' ||
    shapeKind === 'diamond' ||
    shapeKind === 'hexagon' ||
    shapeKind === 'star';
  const isBanner = shapeKind === 'banner' || shapeKind === 'pill';
  return {
    id: uid('shp'),
    type: 'shape',
    name: opts.labelAr || `شكل (${shapeKind})`,
    pageIndex: opts.pageIndex ?? 0,
    layerPlane: opts.underlay ? 'underlay' : 'overlay',
    zIndex: nextElementZIndex(opts.existing),
    x: opts.underlay ? 40 : 140,
    y: opts.underlay ? 40 : 160,
    width: isBanner ? 260 : isCircleLike ? 110 : 220,
    height: isBanner ? 54 : isCircleLike ? 110 : 110,
    rotation: 0,
    visible: true,
    locked: false,
    opacity: opts.underlay ? 0.16 : 1,
    shapeKind,
    fillColor: shapeKind === 'ring' ? 'transparent' : opts.underlay ? opts.accentColor : `${opts.accentColor}22`,
    strokeColor: opts.accentColor || '#24795e',
    strokeWidth: shapeKind === 'ring' ? 4 : 2,
    borderRadius: shapeKind === 'rounded' ? 16 : shapeKind === 'pill' ? 999 : 4,
    shadow: false,
  };
}

export function createCanvasDividerElement(
  dividerStyle: CanvasDividerKind,
  opts: {
    accentColor: string;
    vertical?: boolean;
    existing?: CanvasElement[];
    pageIndex?: number;
  },
): CanvasElement {
  return {
    id: uid('div'),
    type: 'divider',
    name: opts.vertical ? 'خط عمودي / Vertical Line' : `فاصل (${dividerStyle})`,
    pageIndex: opts.pageIndex ?? 0,
    layerPlane: 'overlay',
    zIndex: nextElementZIndex(opts.existing),
    x: opts.vertical ? 260 : 80,
    y: opts.vertical ? 180 : 260,
    width: opts.vertical ? 260 : 420,
    height: 24,
    rotation: opts.vertical ? 90 : 0,
    visible: true,
    locked: false,
    opacity: 1,
    dividerStyle,
    strokeColor: opts.accentColor || '#24795e',
    strokeWidth: dividerStyle === 'double' ? 4 : 2,
  };
}

export function createCanvasIconElement(
  iconName: string,
  opts: {
    accentColor: string;
    existing?: CanvasElement[];
    pageIndex?: number;
  },
): CanvasElement {
  return {
    id: uid('ico'),
    type: 'icon',
    name: `أيقونة (${iconName})`,
    pageIndex: opts.pageIndex ?? 0,
    layerPlane: 'overlay',
    zIndex: nextElementZIndex(opts.existing),
    x: 150,
    y: 150,
    width: 44,
    height: 44,
    rotation: 0,
    visible: true,
    locked: false,
    opacity: 1,
    iconName,
    textColor: opts.accentColor || '#24795e',
    fillColor: `${opts.accentColor || '#24795e'}14`,
    strokeColor: 'transparent',
    strokeWidth: 0,
    borderRadius: 12,
  };
}

export function createCanvasRatingElement(opts: {
  accentColor: string;
  existing?: CanvasElement[];
  pageIndex?: number;
}): CanvasElement {
  return {
    id: uid('rat'),
    type: 'rating',
    name: 'تقييم نجوم / Rating',
    pageIndex: opts.pageIndex ?? 0,
    layerPlane: 'overlay',
    zIndex: nextElementZIndex(opts.existing),
    x: 140,
    y: 200,
    width: 136,
    height: 30,
    rotation: 0,
    visible: true,
    locked: false,
    opacity: 1,
    ratingValue: 5,
    ratingMax: 5,
    textColor: opts.accentColor || '#24795e',
    fillColor: 'transparent',
  };
}

export async function createCanvasQrElement(
  urlText: string,
  opts: {
    accentColor: string;
    existing?: CanvasElement[];
    pageIndex?: number;
  },
): Promise<CanvasElement> {
  const cleanUrl = urlText.trim() || 'https://linkedin.com';
  const dataUrl = await QRCode.toDataURL(cleanUrl, {
    width: 240,
    margin: 1,
    color: {
      dark: opts.accentColor || '#111827',
      light: '#ffffff',
    },
  });
  return {
    id: uid('qr'),
    type: 'qr',
    name: 'كود QR تفاعلي',
    pageIndex: opts.pageIndex ?? 0,
    layerPlane: 'overlay',
    zIndex: nextElementZIndex(opts.existing),
    x: 620,
    y: 44,
    width: 92,
    height: 92,
    rotation: 0,
    visible: true,
    locked: false,
    opacity: 1,
    src: dataUrl,
    qrText: cleanUrl,
    fillColor: '#ffffff',
    strokeColor: `${opts.accentColor || '#24795e'}44`,
    strokeWidth: 1,
    borderRadius: 8,
    padding: 4,
    shadow: false,
  };
}

export function generateSamplePortraitDataUrl(accent = '#24795e'): string {
  const canvas = document.createElement('canvas');
  canvas.width = 280;
  canvas.height = 280;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 280, 280);
  grad.addColorStop(0, '#e6f4ee');
  grad.addColorStop(1, '#cde9dc');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 280, 280);

  // Subtle studio ring
  ctx.strokeStyle = accent;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(140, 140, 124, 0, Math.PI * 2);
  ctx.stroke();

  // Head & shoulders clean portrait silhouette
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(140, 108, 44, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(140, 246, 86, Math.PI * 1.12, Math.PI * 1.88);
  ctx.closePath();
  ctx.fill();

  return canvas.toDataURL('image/png');
}
