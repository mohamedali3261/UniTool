import {
  Award,
  BriefcaseBusiness,
  CheckCircle2,
  Code2,
  Github,
  Globe,
  GraduationCap,
  HeartHandshake,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Quote,
  Sparkles,
  Star,
  TrendingUp,
} from 'lucide-react';
import type { CanvasDividerKind, CanvasShapeKind } from '../../../core/types';

export const CANVAS_ICON_MAP = {
  Award,
  BriefcaseBusiness,
  CheckCircle2,
  Code2,
  Github,
  Globe,
  GraduationCap,
  HeartHandshake,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Quote,
  Sparkles,
  Star,
  TrendingUp,
} as const;

export type CanvasIconKey = keyof typeof CANVAS_ICON_MAP;

export const CANVAS_ICON_LIST: { key: CanvasIconKey; ar: string; en: string }[] = [
  { key: 'BriefcaseBusiness', ar: 'حقيبة عمل', en: 'Briefcase' },
  { key: 'GraduationCap', ar: 'تخرج وتعليم', en: 'Education' },
  { key: 'Award', ar: 'جائزة / شهادة', en: 'Award' },
  { key: 'CheckCircle2', ar: 'توثيق / اعتماد', en: 'Verified' },
  { key: 'Sparkles', ar: 'تميز / مهارة', en: 'Highlight' },
  { key: 'Star', ar: 'نجمة', en: 'Star' },
  { key: 'Code2', ar: 'برمجة وتقنية', en: 'Code' },
  { key: 'TrendingUp', ar: 'نمو وإنجاز', en: 'Growth' },
  { key: 'Mail', ar: 'بريد إلكتروني', en: 'Email' },
  { key: 'Phone', ar: 'هاتف', en: 'Phone' },
  { key: 'MapPin', ar: 'موقع جغرافي', en: 'Location' },
  { key: 'Globe', ar: 'موقع إلكتروني', en: 'Website' },
  { key: 'Linkedin', ar: 'لينكدإن', en: 'LinkedIn' },
  { key: 'Github', ar: 'جيت هاب', en: 'GitHub' },
  { key: 'Quote', ar: 'اقتباس', en: 'Quote' },
  { key: 'HeartHandshake', ar: 'تطوع وتعاون', en: 'Community' },
];

export function CanvasShapeSvg({
  shapeKind = 'rect',
  fillColor = '#24795e22',
  strokeColor = '#24795e',
  strokeWidth = 2,
  borderRadius = 12,
}: {
  shapeKind?: CanvasShapeKind;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  borderRadius?: number;
}) {
  const fill = !fillColor || fillColor === 'transparent' ? 'none' : fillColor;
  const stroke = !strokeColor || strokeColor === 'transparent' || strokeWidth <= 0 ? 'none' : strokeColor;
  const sw = Math.max(0, strokeWidth);

  if (shapeKind === 'circle' || shapeKind === 'ring') {
    const r = Math.max(4, 50 - sw);
    return (
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="cv-canvas-svg">
        <ellipse
          cx="50"
          cy="50"
          rx={r}
          ry={r}
          fill={shapeKind === 'ring' ? 'none' : fill}
          stroke={stroke}
          strokeWidth={sw}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    );
  }

  if (shapeKind === 'triangle') {
    return (
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="cv-canvas-svg">
        <polygon
          points="50,6 96,94 4,94"
          fill={fill}
          stroke={stroke}
          strokeWidth={sw}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    );
  }

  if (shapeKind === 'diamond') {
    return (
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="cv-canvas-svg">
        <polygon
          points="50,4 96,50 50,96 4,50"
          fill={fill}
          stroke={stroke}
          strokeWidth={sw}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    );
  }

  if (shapeKind === 'hexagon') {
    return (
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="cv-canvas-svg">
        <polygon
          points="26,6 74,6 97,50 74,94 26,94 3,50"
          fill={fill}
          stroke={stroke}
          strokeWidth={sw}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    );
  }

  if (shapeKind === 'star') {
    return (
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="cv-canvas-svg">
        <polygon
          points="50,5 63,36 96,39 71,61 78,94 50,77 22,94 29,61 4,39 37,36"
          fill={fill}
          stroke={stroke}
          strokeWidth={sw}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    );
  }

  if (shapeKind === 'banner') {
    return (
      <svg viewBox="0 0 200 60" preserveAspectRatio="none" className="cv-canvas-svg">
        <polygon
          points="0,4 186,4 200,30 186,56 0,56 12,30"
          fill={fill}
          stroke={stroke}
          strokeWidth={sw}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    );
  }

  // rect / rounded / pill
  const radius = shapeKind === 'pill' ? 999 : shapeKind === 'rect' ? borderRadius ?? 2 : borderRadius ?? 14;
  return (
    <div
      className="cv-canvas-rect-shape"
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: fill === 'none' ? 'transparent' : fill,
        border: sw > 0 && stroke !== 'none' ? `${sw}px solid ${stroke}` : 'none',
        borderRadius: `${radius}px`,
      }}
    />
  );
}

export function CanvasDividerSvg({
  dividerStyle = 'solid',
  strokeColor = '#24795e',
  strokeWidth = 2,
}: {
  dividerStyle?: CanvasDividerKind;
  strokeColor?: string;
  strokeWidth?: number;
}) {
  const sw = Math.max(1, strokeWidth);
  if (dividerStyle === 'double') {
    return (
      <svg viewBox="0 0 200 24" preserveAspectRatio="none" className="cv-canvas-svg">
        <line
          x1="2"
          y1="9"
          x2="198"
          y2="9"
          stroke={strokeColor}
          strokeWidth={Math.max(1.5, sw * 0.55)}
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1="2"
          y1="15"
          x2="198"
          y2="15"
          stroke={strokeColor}
          strokeWidth={Math.max(1, sw * 0.35)}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    );
  }

  if (dividerStyle === 'arrow') {
    return (
      <svg viewBox="0 0 200 24" preserveAspectRatio="none" className="cv-canvas-svg">
        <line
          x1="4"
          y1="12"
          x2="188"
          y2="12"
          stroke={strokeColor}
          strokeWidth={sw}
          vectorEffect="non-scaling-stroke"
        />
        <polygon points="200,12 184,5 184,19" fill={strokeColor} />
      </svg>
    );
  }

  const dash = dividerStyle === 'dashed' ? '8 5' : dividerStyle === 'dotted' ? '2.5 5' : undefined;
  return (
    <svg viewBox="0 0 200 24" preserveAspectRatio="none" className="cv-canvas-svg">
      <line
        x1="2"
        y1="12"
        x2="198"
        y2="12"
        stroke={strokeColor}
        strokeWidth={sw}
        strokeDasharray={dash}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
