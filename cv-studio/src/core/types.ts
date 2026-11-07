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

export type SkillDisplayMode = 'badges' | 'bars' | 'bullets' | 'comma';

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
  | 'projects-custom';

export type StudioPageId =
  | 'editor'
  | 'templates'
  | 'ats-checker'
  | 'cover-letter'
  | 'resumes';

export type WorkspaceViewMode = 'split' | 'focus';
export type MobileEditorTab = 'sections' | 'preview' | 'design';

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
  photoShape: 'circle' | 'rounded';
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
  | 'fresh-grad';

export interface TemplatePreset {
  id: string;
  category: Exclude<TemplateCategory, 'all'>;
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
  badgeAr: string;
  badgeEn: string;
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
  subScores: AtsSubScore[];
  checks: AtsCheckItem[];
  matchedKeywords: string[];
  missingKeywords: string[];
  hasJobDescription: boolean;
}
