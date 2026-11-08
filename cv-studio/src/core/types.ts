export type UiLang = 'ar' | 'en';
export type PaperLang = 'ar' | 'en';
export type PaperDir = 'rtl' | 'ltr';
export type PaperSize = 'a4' | 'letter';

/**
 * 1. ats: 100% ATS single-column standard parseable layout
 * 2. modern: Modern & Executive two-column or banner header layout
 * 3. one-page: One-Page Fit compact layout auto-fitted to a single sheet
 * 4. detailed: Multi-page academic / senior layout with auto pagination & page numbers
 */
export type LayoutMode = 'ats' | 'modern' | 'one-page' | 'detailed';

export type ModernHeaderVariant = 'sidebar' | 'banner';

/**
 * Distinct per-template visual architecture so every template renders with its own unmistakable structure.
 */
export type TemplateVisualStyle =
  | 'ats-classic'
  | 'modern-sidebar'
  | 'tech-split-grid'
  | 'corporate-ledger'
  | 'creative-banner-timeline'
  | 'academic-hanging'
  | 'fresh-grad-cards'
  | 'nordic-minimal'
  | 'royal-split-header'
  | 'creative-bold-aside'
  | 'clinical-structured-grid'
  | 'spine-timeline-infographic'
  | 'editorial-magazine'
  | 'bento-modular-cards';

export type PageFrameStyle =
  | 'none'
  | 'classic-border'
  | 'double-frame'
  | 'corner-accents'
  | 'top-ribbon';

export type SkillDisplayMode = 'badges' | 'bars' | 'bullets' | 'comma' | 'dots';

export type CoreSectionId =
  | 'summary'
  | 'experience'
  | 'education'
  | 'certifications'
  | 'skills'
  | 'languages'
  | 'projects'
  | 'custom';

export type EditorSectionKey =
  | 'personal'
  | 'summary-experience'
  | 'education-certs'
  | 'skills-languages'
  | 'projects-custom'
  | 'elements-shapes'
  | 'layers';

export type StudioPageId =
  | 'editor'
  | 'templates'
  | 'cover-letter'
  | 'resumes';

export type WorkspaceViewMode = 'split' | 'focus';
export type MobileEditorTab = 'sections' | 'preview' | 'design';

export type ImageFrameShape = 'circle' | 'rounded' | 'square' | 'hexagon' | 'arch' | 'diamond';

export interface ImageFilterSettings {
  brightness: number; // 50..150 (default 100)
  contrast: number; // 50..150 (default 100)
  saturate: number; // 0..200 (default 100)
  grayscale: number; // 0..100 (default 0)
  sepia: number; // 0..100 (default 0)
  blur: number; // 0..10 (default 0)
  zoom: number; // 1..3 (default 1)
  panX: number; // -100..100 (default 0)
  panY: number; // -100..100 (default 0)
  flipX: boolean;
  flipY: boolean;
  objectFit: 'cover' | 'contain';
}

export type CanvasElementType =
  | 'text'
  | 'badge'
  | 'image'
  | 'shape'
  | 'divider'
  | 'icon'
  | 'rating'
  | 'qr';

export type CanvasShapeKind =
  | 'rect'
  | 'rounded'
  | 'pill'
  | 'circle'
  | 'ring'
  | 'triangle'
  | 'diamond'
  | 'hexagon'
  | 'star'
  | 'banner';

export type CanvasDividerKind = 'solid' | 'dashed' | 'dotted' | 'double' | 'arrow';

export interface CanvasElement {
  id: string;
  type: CanvasElementType;
  name: string;
  pageIndex: number; // 0-based page index
  layerPlane: 'underlay' | 'overlay';
  zIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  visible: boolean;
  locked: boolean;
  opacity: number;
  // Text & Badge styling
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline';
  textAlign?: 'start' | 'center' | 'end' | 'left' | 'right';
  textDir?: 'rtl' | 'ltr';
  lineHeight?: number;
  letterSpacing?: number;
  textColor?: string;
  // Shape, Box & Divider styling
  shapeKind?: CanvasShapeKind;
  dividerStyle?: CanvasDividerKind;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  borderRadius?: number;
  padding?: number;
  shadow?: boolean;
  // Image & QR properties
  src?: string;
  qrText?: string;
  imageShape?: ImageFrameShape;
  imageFilters?: ImageFilterSettings;
  // Icon & Rating properties
  iconName?: string;
  ratingValue?: number;
  ratingMax?: number;
}

/**
 * Per-block position & style overrides for built-in template blocks ('header', 'photo', 'summary', 'experience', etc.)
 * so users can drag, move, restyle, lock, or reset any part of the template directly on the CV page!
 */
export interface BlockOverrideStyle {
  dx?: number;
  dy?: number;
  widthDelta?: number;
  fontSizeScale?: number; // 0.75 .. 1.6
  fontFamily?: string;
  headingColor?: string;
  textColor?: string;
  bgColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  padding?: number;
  textAlign?: 'start' | 'center' | 'end';
  opacity?: number;
  locked?: boolean;
  hidden?: boolean;
}

export type CanvasSelection =
  | { kind: 'element'; id: string }
  | { kind: 'block'; blockKey: string }
  | null;

export interface PersonalInfo {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  github: string;
  photoDataUrl: string;
  showPhoto: boolean;
  photoShape: ImageFrameShape;
  photoSizePx?: number;
  photoBorderWidth?: number;
  photoBorderColor?: string;
  photoShadow?: boolean;
  photoFilters?: ImageFilterSettings;
}

export interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  highlights: string[];
}

export interface EducationItem {
  id: string;
  degree: string;
  school: string;
  location: string;
  startDate: string;
  endDate: string;
  grade: string;
  notes: string;
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  date: string;
  credentialId: string;
}

export interface SkillItem {
  id: string;
  name: string;
  level: number; // 1..5
  category?: string;
}

export interface LanguageItem {
  id: string;
  name: string;
  proficiency: 'native' | 'fluent' | 'advanced' | 'intermediate' | 'basic';
}

export interface ProjectItem {
  id: string;
  name: string;
  role: string;
  link: string;
  date: string;
  summary: string;
  highlights: string[];
}

export interface CustomSectionEntry {
  id: string;
  heading: string;
  subheading: string;
  date: string;
  description: string;
}

export interface CustomSectionGroup {
  id: string;
  title: string;
  visible: boolean;
  items: CustomSectionEntry[];
}

export interface SectionMeta {
  id: CoreSectionId;
  visible: boolean;
  customTitleAr?: string;
  customTitleEn?: string;
}

export interface DesignSettings {
  templateId: string;
  visualStyle?: TemplateVisualStyle;
  layoutMode: LayoutMode;
  modernVariant: ModernHeaderVariant;
  sectionDivider: 'line' | 'soft-bg' | 'accent-bar';
  paperLang: PaperLang;
  paperDir: PaperDir;
  paperSize: PaperSize;
  fontFamily: string;
  fontScale: number; // 0.86 .. 1.16
  lineHeight: number; // 1.28 .. 1.75
  marginMm: number; // 10 .. 24
  accentColor: string;
  skillDisplay: SkillDisplayMode;
  pageFrame?: PageFrameStyle;
}

export interface CoverLetterData {
  recipientName: string;
  recipientTitle: string;
  companyName: string;
  targetRole: string;
  date: string;
  subject: string;
  greeting: string;
  opening: string;
  body: string;
  closing: string;
  signOff: string;
  signatureText: string;
  showSignature: boolean;
}

export interface ResumeDocument {
  id: string;
  title: string;
  targetCompany: string;
  updatedAt: string;
  createdAt: string;
  personal: PersonalInfo;
  summary: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  certifications: CertificationItem[];
  skills: SkillItem[];
  languages: LanguageItem[];
  projects: ProjectItem[];
  customSections: CustomSectionGroup[];
  sections: SectionMeta[];
  design: DesignSettings;
  coverLetter: CoverLetterData;
  jobDescription: string;
  canvasElements?: CanvasElement[];
  blockStyles?: Record<string, BlockOverrideStyle>;
}

export interface UtcvProjectFile {
  format: 'unitool-cv-studio';
  version: 1;
  exportedAt: string;
  resume: ResumeDocument;
}

export type TemplateCategory =
  | 'all'
  | 'ats'
  | 'tech'
  | 'executive'
  | 'finance'
  | 'creative'
  | 'academic'
  | 'medical'
  | 'fresh-grad';

export interface TemplatePreset {
  id: string;
  visualStyle: TemplateVisualStyle;
  category: Exclude<TemplateCategory, 'all'>;
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
  badgeAr: string;
  badgeEn: string;
  structureTagAr: string;
  structureTagEn: string;
  design: DesignSettings;
  sampleAr: Omit<ResumeDocument, 'id' | 'createdAt' | 'updatedAt' | 'design'>;
  sampleEn: Omit<ResumeDocument, 'id' | 'createdAt' | 'updatedAt' | 'design'>;
}

export type AtsFixKind =
  | 'switch-ats-mode'
  | 'hide-photo'
  | 'skills-comma'
  | 'show-core-sections'
  | 'add-summary-starter'
  | 'add-measurable-bullet'
  | 'add-missing-keywords';

export interface AtsCheckItem {
  id: string;
  status: 'pass' | 'warn' | 'fail';
  category: 'format' | 'contact' | 'impact' | 'sections' | 'keywords';
  titleAr: string;
  titleEn: string;
  detailAr: string;
  detailEn: string;
  fixKind?: AtsFixKind;
  fixLabelAr?: string;
  fixLabelEn?: string;
}

export interface AtsSubScore {
  id: string;
  labelAr: string;
  labelEn: string;
  score: number;
  max: number;
}

export interface AtsReport {
  totalScore: number; // 0..100
  grade: 'excellent' | 'good' | 'fair' | 'needs-work';
  hasJobDescription: boolean;
  subScores: AtsSubScore[];
  checks: AtsCheckItem[];
  matchedKeywords: string[];
  missingKeywords: string[];
  jdMatchPercent?: number | null;
}
