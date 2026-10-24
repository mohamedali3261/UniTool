/**
 * Shared shape of a ready-made template.
 * Coordinates are fractions of the target canvas (x/y = center anchor).
 * Sizes (size/w/h/rx) are fractions of the template's base width so they
 * scale cleanly onto any canvas the user applies them to.
 * Colors may use any CSS-compatible value; a second fill (fill2) turns the
 * object fill into a diagonal gradient.
 */

export type TemplateCategory =
  | 'promo'
  | 'social'
  | 'quote'
  | 'youtube'
  | 'event'
  | 'gp-icon'
  | 'gp-feature'
  | 'gp-phone'
  | 'gp-tablet7'
  | 'gp-tablet10';

export const GOOGLE_PLAY_CATEGORIES: TemplateCategory[] = ['gp-icon', 'gp-feature', 'gp-phone', 'gp-tablet7', 'gp-tablet10'];

export interface TemplateObjectShadow {
  color: string;
  blur: number; // fraction of base width
  offsetX?: number; // fraction of base width
  offsetY?: number;
}

export interface TemplateObjectDef {
  type: 'text' | 'rect' | 'circle';
  x: number; // 0..1 fraction of canvas width (center anchor)
  y: number; // 0..1 fraction of canvas height (center anchor)
  text?: string;
  fontFamily?: string;
  fontWeight?: string | number;
  fill?: string;
  fill2?: string; // optional gradient second stop
  stroke?: string;
  strokeWidth?: number;
  size?: number; // text: fontSize as fraction of base width; circle: diameter fraction of base width
  w?: number; // rect: width fraction of canvas width; text: wrap width fraction
  h?: number; // rect: height fraction of canvas height
  rx?: number; // rect corner radius fraction of canvas width
  opacity?: number;
  rotation?: number;
  shadow?: TemplateObjectShadow;
}

export interface DesignTemplate {
  id: string;
  cat: TemplateCategory;
  nameAr: string;
  nameEn: string;
  descAr?: string;
  descEn?: string;
  isNew?: boolean;
  bg: string;
  bg2?: string; // optional gradient second stop (linear diagonal)
  baseW: number;
  baseH: number;
  exactSize?: boolean; // resize the canvas to baseW×baseH when applied
  objects: TemplateObjectDef[];
}

export const TEMPLATE_CATEGORIES: { id: 'all' | TemplateCategory; nameAr: string; nameEn: string }[] = [
  { id: 'all', nameAr: 'الكل', nameEn: 'All' },
  { id: 'promo', nameAr: 'عروض وتخفيضات', nameEn: 'Promo & Sale' },
  { id: 'social', nameAr: 'سوشيال ميديا', nameEn: 'Social' },
  { id: 'quote', nameAr: 'اقتباسات', nameEn: 'Quotes' },
  { id: 'youtube', nameAr: 'يوتيوب', nameEn: 'YouTube' },
  { id: 'event', nameAr: 'مناسبات وبنرات', nameEn: 'Events & Banners' },
  { id: 'gp-icon', nameAr: 'أيقونة التطبيق 512', nameEn: 'App Icon 512' },
  { id: 'gp-feature', nameAr: 'بنر المتجر 1024×500', nameEn: 'Store Banner 1024×500' },
  { id: 'gp-phone', nameAr: 'لقطة هاتف 1080×1920', nameEn: 'Phone 1080×1920' },
  { id: 'gp-tablet7', nameAr: 'تابلت 7 بوصة', nameEn: '7" Tablet' },
  { id: 'gp-tablet10', nameAr: 'تابلت 10 بوصة', nameEn: '10" Tablet' }
];
