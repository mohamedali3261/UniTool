export type DimensionPresetCategory = 'google-play' | 'social' | 'covers' | 'video' | 'ads' | 'custom';

export interface DimensionPreset {
  id: string;
  title: string;
  titleAr: string;
  width: number;
  height: number;
  category: DimensionPresetCategory;
  description: string;
  descriptionAr: string;
  icon: string;
  aspectRatio: string;
}

export interface CanvasPage {
  id: string;
  title: string;
  canvasData?: any;
  thumbnail?: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  width: number;
  height: number;
  canvasData: any; // Fabric JSON representation
  pages?: CanvasPage[];
  thumbnail?: string;
  category: string;
  createdAt: number;
  updatedAt: number;
}

export type SidebarTabType = 
  | 'text' 
  | 'elements' 
  | 'icons' 
  | 'images' 
  | 'ornaments' 
  | 'layers';

export interface StockPhoto {
  id: string;
  title: string;
  url: string;
  category: 'business' | 'tech' | 'abstract' | 'food' | 'people' | 'nature' | 'gradients';
  author: string;
}

export interface TextPreset {
  id: string;
  label: string;
  labelAr: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string | number;
  fill: string;
  fontStyle?: string;
  textDecoration?: string;
  shadow?: string;
  backgroundColor?: string;
  text: string;
  category?: 'all' | 'headings' | 'gold' | 'neon' | 'calligraphy' | 'badges' | '3d';
  stroke?: string;
  strokeWidth?: number;
  letterSpacing?: number;
}

export interface ActiveObjectProperties {
  type: string;
  left: number;
  top: number;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
  angle: number;
  opacity: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  strokeDashArray?: number[];
  shadow?: {
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
  rx?: number; // for rect rounded corners
  ry?: number;
  // Text specific
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string | number;
  fontStyle?: string;
  textAlign?: string;
  lineHeight?: number;
  charSpacing?: number;
  underline?: boolean;
  linethrough?: boolean;
  textBackgroundColor?: string;
  backgroundColor?: string;
  textGradient?: string[];
  curve?: number;
  // Image specific
  src?: string;
  brightness?: number;
  contrast?: number;
  grayscale?: boolean;
  sepia?: boolean;
  blur?: number;
  clipCornerTL?: number;
  clipCornerTR?: number;
  clipCornerBR?: number;
  clipCornerBL?: number;
  cropTop?: number;
  cropBottom?: number;
  cropLeft?: number;
  cropRight?: number;
  fadeTop?: number;
  fadeBottom?: number;
  fadeLeft?: number;
  fadeRight?: number;
  fadeRadial?: number;
  _originalSrc?: string;
  hasBorders?: boolean;
  hasControls?: boolean;
  // Lock state
  lockMovementX?: boolean;
  lockMovementY?: boolean;
  lockRotation?: boolean;
  lockScalingX?: boolean;
  lockScalingY?: boolean;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message?: string;
}
