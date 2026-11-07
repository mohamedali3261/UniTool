import type {
  DesignSettings,
  PaperLang,
  ResumeDocument,
  TemplatePreset,
  TemplateVisualStyle,
} from '../core/types';
import { defaultFontForPaperLang } from '../data/themes';
import { academicMultipageTemplate } from './academicMultipage';
import { atsStandardTemplate } from './atsStandard';
import { financeCorporateTemplate } from './financeCorporate';
import { freshGradStarterTemplate } from './freshGradStarter';
import { minimalistNordicTemplate } from './minimalistNordic';
import { modernBannerCreativeTemplate } from './modernBannerCreative';
import { modernEmeraldExecTemplate } from './modernEmeraldExec';
import {
  defaultCoverLetterAr,
  defaultCoverLetterEn,
  defaultSectionOrder,
} from './sharedSamples';
import { techOnePageTemplate } from './techOnePage';
import type { TemplateModule } from './TemplateBlockHelpers';

export {
  academicMultipageTemplate,
  atsStandardTemplate,
  defaultCoverLetterAr,
  defaultCoverLetterEn,
  defaultSectionOrder,
  financeCorporateTemplate,
  freshGradStarterTemplate,
  minimalistNordicTemplate,
  modernBannerCreativeTemplate,
  modernEmeraldExecTemplate,
  techOnePageTemplate,
};
export type { TemplateModule };

export const CV_TEMPLATE_MODULES: TemplateModule[] = [
  atsStandardTemplate,
  modernEmeraldExecTemplate,
  techOnePageTemplate,
  financeCorporateTemplate,
  modernBannerCreativeTemplate,
  academicMultipageTemplate,
  freshGradStarterTemplate,
  minimalistNordicTemplate,
];

export const CV_TEMPLATES: TemplatePreset[] = CV_TEMPLATE_MODULES.map((m) => m.preset);

const MODULE_BY_ID = new Map<string, TemplateModule>(
  CV_TEMPLATE_MODULES.map((m) => [m.preset.id, m]),
);

const MODULE_BY_STYLE = new Map<TemplateVisualStyle, TemplateModule>(
  CV_TEMPLATE_MODULES.map((m) => [m.preset.visualStyle, m]),
);

export function getTemplateModuleById(id: string): TemplateModule | undefined {
  return MODULE_BY_ID.get(id);
}

export function resolveTemplateModuleForDoc(doc: ResumeDocument): TemplateModule {
  if (doc.design.layoutMode === 'ats') {
    if (
      doc.design.visualStyle === 'corporate-ledger' ||
      doc.design.templateId === 'finance-corporate'
    ) {
      return financeCorporateTemplate;
    }
    return atsStandardTemplate;
  }

  if (doc.design.visualStyle && MODULE_BY_STYLE.has(doc.design.visualStyle)) {
    return MODULE_BY_STYLE.get(doc.design.visualStyle)!;
  }

  if (doc.design.templateId && MODULE_BY_ID.has(doc.design.templateId)) {
    return MODULE_BY_ID.get(doc.design.templateId)!;
  }

  if (doc.design.layoutMode === 'detailed') return academicMultipageTemplate;
  if (doc.design.layoutMode === 'one-page') return techOnePageTemplate;
  return doc.design.modernVariant === 'sidebar'
    ? modernEmeraldExecTemplate
    : modernBannerCreativeTemplate;
}

/**
 * Switches the visual template & layout style while keeping 100% of the user's written data intact!
 */
export function applyTemplatePreservingData(
  doc: ResumeDocument,
  template: TemplatePreset,
): ResumeDocument {
  const keepPaperLang = doc.design.paperLang;
  const keepPaperDir = doc.design.paperDir;
  const nextFont = defaultFontForPaperLang(keepPaperLang, template.design.fontFamily);

  return {
    ...doc,
    updatedAt: new Date().toISOString(),
    design: {
      ...template.design,
      visualStyle: template.visualStyle,
      paperLang: keepPaperLang,
      paperDir: keepPaperDir,
      paperSize: doc.design.paperSize,
      fontFamily: nextFont,
    },
  };
}

export function createResumeFromTemplate(
  template: TemplatePreset,
  paperLang?: PaperLang,
): ResumeDocument {
  const now = new Date().toISOString();
  const targetLang = paperLang || template.design.paperLang;
  const sample = targetLang === 'en' ? template.sampleEn : template.sampleAr;
  const design: DesignSettings = {
    ...template.design,
    visualStyle: template.visualStyle,
    paperLang: targetLang,
    paperDir: targetLang === 'ar' ? 'rtl' : 'ltr',
    fontFamily: defaultFontForPaperLang(targetLang, template.design.fontFamily),
  };

  return JSON.parse(
    JSON.stringify({
      id: `cv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: now,
      updatedAt: now,
      ...sample,
      canvasElements: sample.canvasElements || [],
      blockStyles: sample.blockStyles || {},
      design,
    }),
  );
}

export function createDefaultStarterResume(paperLang: PaperLang = 'ar'): ResumeDocument {
  return createResumeFromTemplate(modernEmeraldExecTemplate.preset, paperLang);
}

export function createBlankResume(paperLang: PaperLang = 'ar'): ResumeDocument {
  const now = new Date().toISOString();
  const isAr = paperLang === 'ar';
  return {
    id: `cv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: isAr ? 'سيرة ذاتية جديدة' : 'Untitled Resume',
    targetCompany: '',
    createdAt: now,
    updatedAt: now,
    personal: {
      fullName: isAr ? 'الاسم الكامل' : 'Your Full Name',
      jobTitle: isAr ? 'المسمى الوظيفي المستهدف' : 'Target Job Title',
      email: 'name@example.com',
      phone: '+20 100 000 0000',
      location: isAr ? 'القاهرة، مصر' : 'Cairo, Egypt',
      website: '',
      linkedin: 'linkedin.com/in/yourname',
      github: '',
      photoDataUrl: '',
      showPhoto: false,
      photoShape: 'circle',
    },
    summary: isAr
      ? 'اكتب هنا ملخصاً مهنياً موجزاً من 2 إلى 4 أسطر يبرز سنوات خبرتك، تخصصك الأساسي، وأهم قيمة تقدمها للشركة.'
      : 'Write a concise 2–4 sentence professional summary highlighting your core expertise, years of experience, and measurable impact.',
    experience: [
      {
        id: `exp-${Date.now()}`,
        role: isAr ? 'المسمى الوظيفي' : 'Job Title',
        company: isAr ? 'اسم الشركة أو المؤسسة' : 'Company Name',
        location: isAr ? 'القاهرة' : 'Cairo',
        startDate: '2023',
        endDate: '',
        current: true,
        highlights: [
          isAr
            ? 'أضف إنجازاً قابلاً للقياس مدعوماً بالأرقام والنسب المئوية.'
            : 'Add a measurable achievement backed by concrete numbers or percentages.',
        ],
      },
    ],
    education: [
      {
        id: `edu-${Date.now()}`,
        degree: isAr ? 'الدرجة العلمية والتخصص' : 'Degree & Major',
        school: isAr ? 'اسم الجامعة أو المعهد' : 'University Name',
        location: isAr ? 'مصر' : 'Egypt',
        startDate: '2019',
        endDate: '2023',
        grade: '',
        notes: '',
      },
    ],
    certifications: [],
    skills: [
      { id: 'sk-b1', name: isAr ? 'إدارة المشاريع' : 'Project Management', level: 4 },
      { id: 'sk-b2', name: isAr ? 'تحليل البيانات' : 'Data Analysis', level: 4 },
      { id: 'sk-b3', name: isAr ? 'التواصل الفعال' : 'Communication', level: 5 },
    ],
    languages: [
      { id: 'lg-b1', name: isAr ? 'العربية' : 'Arabic', proficiency: 'native' },
      { id: 'lg-b2', name: isAr ? 'الإنجليزية' : 'English', proficiency: 'advanced' },
    ],
    projects: [],
    customSections: [],
    sections: defaultSectionOrder(),
    design: {
      templateId: 'ats-standard',
      visualStyle: 'ats-classic',
      layoutMode: 'ats',
      modernVariant: 'banner',
      sectionDivider: 'line',
      paperLang,
      paperDir: isAr ? 'rtl' : 'ltr',
      paperSize: 'a4',
      fontFamily: defaultFontForPaperLang(paperLang),
      fontScale: 1,
      lineHeight: 1.48,
      marginMm: 16,
      accentColor: '#24795e',
      skillDisplay: 'badges',
    },
    coverLetter: isAr
      ? defaultCoverLetterAr('الاسم الكامل', 'المسمى الوظيفي', 'اسم الشركة')
      : defaultCoverLetterEn('Your Full Name', 'Target Role', 'Target Company'),
    jobDescription: '',
    canvasElements: [],
    blockStyles: {},
  };
}
