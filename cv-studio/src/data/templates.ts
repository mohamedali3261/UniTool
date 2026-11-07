import type {
  CoverLetterData,
  DesignSettings,
  PaperLang,
  ResumeDocument,
  SectionMeta,
  TemplatePreset,
} from '../core/types';
import { defaultFontForPaperLang } from './themes';

export function defaultSectionOrder(): SectionMeta[] {
  return [
    { id: 'summary', visible: true },
    { id: 'experience', visible: true },
    { id: 'projects', visible: true },
    { id: 'education', visible: true },
    { id: 'skills', visible: true },
    { id: 'certifications', visible: true },
    { id: 'languages', visible: true },
    { id: 'custom', visible: true },
  ];
}

export function defaultCoverLetterAr(name = 'أحمد طارق منصور', role = 'مهندس برمجيات أول', company = 'شركة تقنية رائدة'): CoverLetterData {
  return {
    recipientName: 'فريق استقطاب الكفاءات',
    recipientTitle: 'إدارة الموارد البشرية والهندسة',
    companyName: company,
    targetRole: role,
    date: new Date().toISOString().slice(0, 10),
    subject: `التقدم لوظيفة ${role} لدى ${company}`,
    greeting: `السادة فريق التوظيف في ${company} المحترمين،`,
    opening: `يسعدني التقدم لوظيفة ${role} لدى ${company}، مستنداً إلى خبرتي العملية في بناء منصات ويب سريعة وموثوقة وتحويل المتطلبات المعقدة إلى منتجات سهلة الاستخدام.`,
    body: 'خلال سنوات عملي الماضية، قدت تطوير أنظمة واجهات أمامية وخلفية رفعت سرعة التحميل بنسبة 42% وخفّضت الأعطال التشغيلية بنسبة 55%، مع التعاون الوثيق مع فرق المنتج والتصميم. أتابع بإعجاب مسيرة الابتكار في شركتكم وأثق بقدرتي على تحقيق إضافة ملموسة منذ الأسبوع الأول.',
    closing: 'أرفق لكم سيرتي الذاتية للاطلاع على أبرز المشاريع والمؤشرات الرقمية، وأرحب بفرصة إجراء مقابلة لمناقشة كيف يمكن لخبرتي دعم أهداف فريقكم.',
    signOff: 'وتفضلوا بقبول فائق الاحترام والتقدير،',
    signatureText: name,
    showSignature: true,
  };
}

export function defaultCoverLetterEn(name = 'Ahmed Tarek Mansour', role = 'Senior Software Engineer', company = 'Horizon Tech'): CoverLetterData {
  return {
    recipientName: 'Talent Acquisition Team',
    recipientTitle: 'Engineering & Product Hiring',
    companyName: company,
    targetRole: role,
    date: new Date().toISOString().slice(0, 10),
    subject: `Application for ${role} at ${company}`,
    greeting: `Dear Hiring Manager at ${company},`,
    opening: `I am excited to apply for the ${role} role at ${company}, bringing 6+ years of hands-on experience building resilient, high-performance web applications with TypeScript, React, and Node.js.`,
    body: 'In my recent engineering leadership roles, I spearheaded architecture improvements that boosted page responsiveness by 42% and reduced production incidents by 55%. Your commitment to clean product craftsmanship aligns closely with my engineering standards.',
    closing: 'Thank you for reviewing my attached resume. I would welcome the opportunity to discuss how my technical execution can contribute to your upcoming roadmap.',
    signOff: 'Sincerely,',
    signatureText: name,
    showSignature: true,
  };
}

const SAMPLE_AR_TECH: Omit<ResumeDocument, 'id' | 'createdAt' | 'updatedAt' | 'design'> = {
  title: 'سيرة مهندس برمجيات أول — أحمد منصور',
  targetCompany: 'شركة أفق التقنية',
  personal: {
    fullName: 'أحمد طارق منصور',
    jobTitle: 'مهندس برمجيات أول (Senior Full-Stack Engineer)',
    email: 'ahmed.mansour@example.com',
    phone: '+20 100 482 9150',
    location: 'القاهرة، مصر',
    website: 'ahmedmansour.dev',
    linkedin: 'linkedin.com/in/ahmed-mansour',
    github: 'github.com/ahmed-mansour',
    photoDataUrl: '',
    showPhoto: false,
    photoShape: 'circle',
  },
  summary:
    'مهندس برمجيات أول بخبرة تتجاوز 6 سنوات في تصميم وتطوير تطبيقات الويب السحابية باستخدام TypeScript وReact وNode.js. متخصص في بناء معماريات قابلة للتوسع، تحسين الأداء، وقيادة فرق العمل الرشيقة لإطلاق منتجات رقمية عالية الاعتمادية تخدم أكثر من 350 ألف مستخدم نشط.',
  experience: [
    {
      id: 'exp-1',
      role: 'مهندس برمجيات أول (Senior Software Engineer)',
      company: 'نواة للحلول السحابية',
      location: 'القاهرة، مصر (هجين)',
      startDate: '2023-02',
      endDate: '',
      current: true,
      highlights: [
        'قدت إعادة هيكلة منصة التحليلات الرئيسية باستخدام React وTypeScript، مما رفع سرعة استجابة الواجهة بنسبة 44%.',
        'صممت واجهات برمجية REST وGraphQL تعالج 1.4 مليون طلب يومياً بنسبة توافر 99.96%.',
        'أتمتت اختبارات التكامل والنشر المستمر CI/CD عبر GitHub Actions وPlaywright مما قلّص زمن الإصدار بنسبة 65%.',
      ],
    },
    {
      id: 'exp-2',
      role: 'مطور واجهات وتطبيقات ويب (Full-Stack Developer)',
      company: 'مدار للتقنية المالية (Fintech)',
      location: 'القاهرة، مصر',
      startDate: '2020-06',
      endDate: '2023-01',
      current: false,
      highlights: [
        'طوّرت بوابة مدفوعات إلكترونية مؤمنة رفعت معدل إتمام العمليات الناجحة بنسبة 29%.',
        'أنشأت مكتبة مكونات موحدة (Design System) استُخدمت في 5 منتجات داخلية ووفرت 30% من وقت التطوير.',
      ],
    },
  ],
  education: [
    {
      id: 'edu-1',
      degree: 'بكالوريوس علوم الحاسب وهندسة البرمجيات',
      school: 'جامعة القاهرة — كلية الحاسبات والذكاء الاصطناعي',
      location: 'الجيزة، مصر',
      startDate: '2016',
      endDate: '2020',
      grade: 'تقدير عام: امتياز مع مرتبة الشرف (GPA 3.82 / 4.0)',
      notes: 'مشروع التخرج: نظام ذكي لتحليل المستندات العربية بتقدير امتياز.',
    },
  ],
  certifications: [
    {
      id: 'cert-1',
      name: 'AWS Certified Solutions Architect – Associate',
      issuer: 'Amazon Web Services',
      date: '2024',
      credentialId: 'AWS-SAA-8841',
    },
    {
      id: 'cert-2',
      name: 'Professional Scrum Developer (PSD I)',
      issuer: 'Scrum.org',
      date: '2022',
      credentialId: 'PSD-4120',
    },
  ],
  skills: [
    { id: 'sk-1', name: 'TypeScript', level: 5 },
    { id: 'sk-2', name: 'React & Next.js', level: 5 },
    { id: 'sk-3', name: 'Node.js', level: 5 },
    { id: 'sk-4', name: 'PostgreSQL & SQL', level: 4 },
    { id: 'sk-5', name: 'REST & GraphQL APIs', level: 5 },
    { id: 'sk-6', name: 'Docker & CI/CD', level: 4 },
    { id: 'sk-7', name: 'Playwright Testing', level: 4 },
    { id: 'sk-8', name: 'System Architecture', level: 4 },
  ],
  languages: [
    { id: 'lang-1', name: 'العربية', proficiency: 'native' },
    { id: 'lang-2', name: 'الإنجليزية (English)', proficiency: 'fluent' },
  ],
  projects: [
    {
      id: 'proj-1',
      name: 'منصة إدارة الوثائق الذكية (DocFlow)',
      role: 'المبتكر والمطور الرئيسي',
      link: 'github.com/ahmed-mansour/docflow',
      date: '2024',
      summary: 'نظام مفتوح المصدر لمعالجة وفهرسة المستندات محلياً بسرعة فائقة.',
      highlights: ['حقق أكثر من 1,800 نجمة على GitHub واستُخدم من قِبل 40+ فريق عمل.'],
    },
  ],
  customSections: [
    {
      id: 'cust-1',
      title: 'الجوائز والأنشطة التطوعية',
      visible: true,
      items: [
        {
          id: 'ci-1',
          heading: 'المركز الأول في هاكاثون الابتكار المالي',
          subheading: 'مبادرة رواد التكنولوجيا — القاهرة',
          date: '2023',
          description: 'تطوير نموذج أولي لأتمتة مطابقة الفواتير للشركات الصغيرة خلال 48 ساعة.',
        },
      ],
    },
  ],
  sections: defaultSectionOrder(),
  coverLetter: defaultCoverLetterAr('أحمد طارق منصور', 'مهندس برمجيات أول', 'شركة أفق التقنية'),
  jobDescription: '',
};

const SAMPLE_EN_TECH: Omit<ResumeDocument, 'id' | 'createdAt' | 'updatedAt' | 'design'> = {
  title: 'Senior Software Engineer — Ahmed Mansour',
  targetCompany: 'Horizon Tech',
  personal: {
    fullName: 'Ahmed Tarek Mansour',
    jobTitle: 'Senior Full-Stack Software Engineer',
    email: 'ahmed.mansour@example.com',
    phone: '+20 100 482 9150',
    location: 'Cairo, Egypt',
    website: 'ahmedmansour.dev',
    linkedin: 'linkedin.com/in/ahmed-mansour',
    github: 'github.com/ahmed-mansour',
    photoDataUrl: '',
    showPhoto: false,
    photoShape: 'circle',
  },
  summary:
    'Senior Full-Stack Engineer with 6+ years of experience designing and scaling modern cloud web applications using TypeScript, React, and Node.js. Proven record of improving core web vitals by 44%, automating CI/CD pipelines, and delivering reliable products for 350K+ monthly active users.',
  experience: [
    {
      id: 'exp-en-1',
      role: 'Senior Software Engineer',
      company: 'Nawah Cloud Systems',
      location: 'Cairo, Egypt (Hybrid)',
      startDate: '2023-02',
      endDate: '',
      current: true,
      highlights: [
        'Led frontend re-architecture in React and TypeScript, improving dashboard rendering performance by 44%.',
        'Designed resilient Node.js & PostgreSQL APIs serving 1.4M+ daily requests at 99.96% availability.',
        'Automated end-to-end Playwright suites in CI/CD, reducing release regression defects by 62%.',
      ],
    },
    {
      id: 'exp-en-2',
      role: 'Full-Stack Developer',
      company: 'Madar FinTech',
      location: 'Cairo, Egypt',
      startDate: '2020-06',
      endDate: '2023-01',
      current: false,
      highlights: [
        'Built a PCI-aligned checkout workflow that increased successful payment completion by 29%.',
        'Authored a shared UI component library adopted across 5 product squads, cutting delivery time by 30%.',
      ],
    },
  ],
  education: [
    {
      id: 'edu-en-1',
      degree: 'B.Sc. in Computer Science & Software Engineering',
      school: 'Cairo University — Faculty of Computers & AI',
      location: 'Giza, Egypt',
      startDate: '2016',
      endDate: '2020',
      grade: 'GPA: 3.82 / 4.0 (First-Class Honors)',
      notes: 'Graduation Project: Arabic Document Intelligence Engine (Distinction).',
    },
  ],
  certifications: [
    {
      id: 'cert-en-1',
      name: 'AWS Certified Solutions Architect – Associate',
      issuer: 'Amazon Web Services',
      date: '2024',
      credentialId: 'AWS-SAA-8841',
    },
    {
      id: 'cert-en-2',
      name: 'Professional Scrum Developer (PSD I)',
      issuer: 'Scrum.org',
      date: '2022',
      credentialId: 'PSD-4120',
    },
  ],
  skills: [
    { id: 'ske-1', name: 'TypeScript', level: 5 },
    { id: 'ske-2', name: 'React & Next.js', level: 5 },
    { id: 'ske-3', name: 'Node.js', level: 5 },
    { id: 'ske-4', name: 'PostgreSQL & SQL', level: 4 },
    { id: 'ske-5', name: 'REST & GraphQL APIs', level: 5 },
    { id: 'ske-6', name: 'Docker & CI/CD', level: 4 },
    { id: 'ske-7', name: 'Playwright', level: 4 },
    { id: 'ske-8', name: 'System Design', level: 4 },
  ],
  languages: [
    { id: 'lange-1', name: 'Arabic', proficiency: 'native' },
    { id: 'lange-2', name: 'English', proficiency: 'fluent' },
  ],
  projects: [
    {
      id: 'proje-1',
      name: 'DocFlow — Local Document Indexing Engine',
      role: 'Creator & Lead Maintainer',
      link: 'github.com/ahmed-mansour/docflow',
      date: '2024',
      summary: 'Browser-first toolkit for fast offline document search and structured extraction.',
      highlights: ['Earned 1,800+ GitHub stars and adopted by 40+ engineering teams.'],
    },
  ],
  customSections: [
    {
      id: 'custe-1',
      title: 'Awards & Community Leadership',
      visible: true,
      items: [
        {
          id: 'cie-1',
          heading: '1st Place — FinTech Innovation Hackathon',
          subheading: 'Tech Pioneers Initiative',
          date: '2023',
          description: 'Built an automated SME invoice reconciliation prototype in 48 hours.',
        },
      ],
    },
  ],
  sections: defaultSectionOrder(),
  coverLetter: defaultCoverLetterEn('Ahmed Tarek Mansour', 'Senior Software Engineer', 'Horizon Tech'),
  jobDescription: '',
};

const SAMPLE_AR_EXEC: Omit<ResumeDocument, 'id' | 'createdAt' | 'updatedAt' | 'design'> = {
  ...SAMPLE_AR_TECH,
  title: 'سيرة مدير عمليات وتطوير أعمال — سارة الكيلاني',
  targetCompany: 'مجموعة النيل للاستثمار',
  personal: {
    ...SAMPLE_AR_TECH.personal,
    fullName: 'سارة محمود الكيلاني',
    jobTitle: 'مديرة العمليات وتطوير الأعمال (Head of Operations)',
    email: 'sara.elkilany@example.com',
    linkedin: 'linkedin.com/in/sara-elkilany',
    website: 'saraelkilany.com',
    github: '',
  },
  summary:
    'قائدة تنفيذية في إدارة العمليات وتطوير الأعمال بخبرة 9 سنوات في رفع كفاءة التشغيل، إدارة الميزانيات المليونية، وقيادة فرق تتجاوز 45 موظفاً. حققت نمواً في الهوامش التشغيلية بنسبة 27% وخفضت زمن دورات التوريد بنسبة 34%.',
  experience: [
    {
      id: 'exp-ex-1',
      role: 'مديرة العمليات الإقليمية',
      company: 'مجموعة الرؤية للخدمات اللوجستية',
      location: 'القاهرة، مصر',
      startDate: '2021-04',
      endDate: '',
      current: true,
      highlights: [
        'قدت خطة التحول التشغيلي لـ 6 فروع رئيسية ورفعت معدل الالتزام بمواعيد التسليم من 82% إلى 97%.',
        'أدرت ميزانية تشغيلية سنوية بقيمة 48 مليون جنيه وحققت وفراً صافياً بنسبة 19% عبر تحسين عقود الموردين.',
      ],
    },
    {
      id: 'exp-ex-2',
      role: 'رئيسة قسم التميز المؤسسي والجودة',
      company: 'شركة المشرق للتجارة والتوزيع',
      location: 'الإسكندرية، مصر',
      startDate: '2017-09',
      endDate: '2021-03',
      current: false,
      highlights: [
        'صممت مؤشرات الأداء الرئيسية KPIs ولوحات المتابعة الأسبوعية للإدارة العليا.',
        'حصلت المؤسسة تحت إشرافها على شهادة الجودة الدولية ISO 9001:2015 بدون أي ملاحظات حرجة.',
      ],
    },
  ],
  skills: [
    { id: 'skx-1', name: 'التخطيط الاستراتيجي', level: 5 },
    { id: 'skx-2', name: 'إدارة الميزانيات P&L', level: 5 },
    { id: 'skx-3', name: 'سلاسل الإمداد والتشغيل', level: 5 },
    { id: 'skx-4', name: 'مؤشرات الأداء KPIs & Power BI', level: 4 },
    { id: 'skx-5', name: 'قيادة الفرق والتفاوض', level: 5 },
    { id: 'skx-6', name: 'إدارة الجودة Lean Six Sigma', level: 4 },
  ],
  coverLetter: defaultCoverLetterAr('سارة محمود الكيلاني', 'مديرة العمليات وتطوير الأعمال', 'مجموعة النيل للاستثمار'),
};

export const CV_TEMPLATES: TemplatePreset[] = [
  {
    id: 'ats-standard',
    category: 'ats',
    nameAr: 'المعيار القياسي للـ ATS',
    nameEn: 'ATS Gold Standard',
    descAr: 'عمود واحد نقي بتقسيم قياسي واضح وعناوين معيارية يجتاز جميع أنظمة الفرز الآلي بنسبة 100%.',
    descEn: 'Pure single-column layout with crisp dividers and 100% machine-parseable hierarchy.',
    badgeAr: 'توافق ATS 100%',
    badgeEn: '100% ATS Safe',
    design: {
      templateId: 'ats-standard',
      layoutMode: 'ats',
      modernVariant: 'banner',
      sectionDivider: 'line',
      paperLang: 'ar',
      paperDir: 'rtl',
      paperSize: 'a4',
      fontFamily: 'cairo',
      fontScale: 1,
      lineHeight: 1.48,
      marginMm: 16,
      accentColor: '#111827',
      skillDisplay: 'comma',
    },
    sampleAr: SAMPLE_AR_TECH,
    sampleEn: SAMPLE_EN_TECH,
  },
  {
    id: 'modern-emerald-exec',
    category: 'executive',
    nameAr: 'التنفيذي العصري — عمودان',
    nameEn: 'Modern Executive Split',
    descAr: 'عمود جانبي منظم للمهارات والتواصل مع مساحة رئيسية واسعة للخبرات والإنجازات بهوية UniTool الهادئة.',
    descEn: 'Structured two-column executive layout with calm emerald accents and balanced hierarchy.',
    badgeAr: 'الأكثر اختياراً',
    badgeEn: 'Popular',
    design: {
      templateId: 'modern-emerald-exec',
      layoutMode: 'modern',
      modernVariant: 'sidebar',
      sectionDivider: 'accent-bar',
      paperLang: 'ar',
      paperDir: 'rtl',
      paperSize: 'a4',
      fontFamily: 'cairo',
      fontScale: 0.98,
      lineHeight: 1.45,
      marginMm: 14,
      accentColor: '#24795e',
      skillDisplay: 'badges',
    },
    sampleAr: SAMPLE_AR_EXEC,
    sampleEn: SAMPLE_EN_TECH,
  },
  {
    id: 'tech-one-page',
    category: 'tech',
    nameAr: 'المهندس المكثف — صفحة واحدة',
    nameEn: 'Tech One-Page Fit',
    descAr: 'مصمم لمهندسي البرمجيات والمنتجات الرقمية لجمع كل الخبرات والمشاريع والمهارات في صفحة واحدة متقنة.',
    descEn: 'Engineered for software & product roles to fit rich impact cleanly onto a single page.',
    badgeAr: 'صفحة واحدة ذكية',
    badgeEn: 'One-Page Fit',
    design: {
      templateId: 'tech-one-page',
      layoutMode: 'one-page',
      modernVariant: 'banner',
      sectionDivider: 'line',
      paperLang: 'en',
      paperDir: 'ltr',
      paperSize: 'a4',
      fontFamily: 'inter',
      fontScale: 0.95,
      lineHeight: 1.36,
      marginMm: 12,
      accentColor: '#1f4e5f',
      skillDisplay: 'badges',
    },
    sampleAr: SAMPLE_AR_TECH,
    sampleEn: SAMPLE_EN_TECH,
  },
  {
    id: 'finance-corporate',
    category: 'finance',
    nameAr: 'المالي والمؤسسي الرصين',
    nameEn: 'Corporate Finance & Consulting',
    descAr: 'تنسيق رسمي رفيع للبنوك والمحاسبة والاستشارات الإدارية بخطوط واضحة وفواصل كلاسيكية.',
    descEn: 'Authoritative layout tailored for banking, accounting, consulting, and corporate strategy.',
    badgeAr: 'رسمي ومعتمد',
    badgeEn: 'Corporate',
    design: {
      templateId: 'finance-corporate',
      layoutMode: 'ats',
      modernVariant: 'banner',
      sectionDivider: 'line',
      paperLang: 'ar',
      paperDir: 'rtl',
      paperSize: 'a4',
      fontFamily: 'noto-naskh',
      fontScale: 1,
      lineHeight: 1.5,
      marginMm: 18,
      accentColor: '#1b4332',
      skillDisplay: 'comma',
    },
    sampleAr: SAMPLE_AR_EXEC,
    sampleEn: SAMPLE_EN_TECH,
  },
  {
    id: 'modern-banner-creative',
    category: 'creative',
    nameAr: 'ترويسة الهوية الإبداعية',
    nameEn: 'Editorial Header Banner',
    descAr: 'ترويسة علوية أنيقة تبرز الاسم والمسمى الوظيفي مع شارات مهارات عصرية للتسويق والتصميم والمنتج.',
    descEn: 'Distinctive top banner header with refined badges for marketing, UX, and creative leads.',
    badgeAr: 'ترويسة مميزة',
    badgeEn: 'Header Accent',
    design: {
      templateId: 'modern-banner-creative',
      layoutMode: 'modern',
      modernVariant: 'banner',
      sectionDivider: 'soft-bg',
      paperLang: 'ar',
      paperDir: 'rtl',
      paperSize: 'a4',
      fontFamily: 'tajawal',
      fontScale: 1,
      lineHeight: 1.48,
      marginMm: 15,
      accentColor: '#7c4a2d',
      skillDisplay: 'bars',
    },
    sampleAr: SAMPLE_AR_TECH,
    sampleEn: SAMPLE_EN_TECH,
  },
  {
    id: 'academic-multipage',
    category: 'academic',
    nameAr: 'السيرة الأكاديمية والطبية التفصيلية',
    nameEn: 'Academic & Medical Multi-Page CV',
    descAr: 'يدعم الأبحاث، المؤتمرات، الشهادات، والخبرات الممتدة عبر عدة صفحات مرقمة تلقائياً.',
    descEn: 'Built for faculty, researchers, physicians, and senior experts with automatic page numbering.',
    badgeAr: 'متعدد الصفحات',
    badgeEn: 'Multi-Page',
    design: {
      templateId: 'academic-multipage',
      layoutMode: 'detailed',
      modernVariant: 'banner',
      sectionDivider: 'line',
      paperLang: 'ar',
      paperDir: 'rtl',
      paperSize: 'a4',
      fontFamily: 'amiri',
      fontScale: 1.03,
      lineHeight: 1.56,
      marginMm: 18,
      accentColor: '#6b2737',
      skillDisplay: 'bullets',
    },
    sampleAr: {
      ...SAMPLE_AR_TECH,
      experience: [
        ...SAMPLE_AR_TECH.experience,
        {
          id: 'exp-acad-3',
          role: 'باحث ومحاضر مساعد — نظم المعلومات الذكية',
          company: 'مركز البحوث التطبيقية والذكاء الاصطناعي',
          location: 'القاهرة، مصر',
          startDate: '2019-01',
          endDate: '2020-05',
          current: false,
          highlights: [
            'نشرت 3 أوراق علمية محكّمة في معالجة اللغات الطبيعية العربية وتصنيف النصوص.',
            'أشرفت على 18 مشروع تخرج طلابي وقدمت ورش عمل تطبيقية لأكثر من 250 طالباً.',
          ],
        },
      ],
      customSections: [
        ...SAMPLE_AR_TECH.customSections,
        {
          id: 'cust-pubs',
          title: 'الأبحاث المنشورة والمؤتمرات العلمية',
          visible: true,
          items: [
            {
              id: 'pub-1',
              heading: 'نماذج خفيفة لفهرسة الوثائق العربية عالية الدقة',
              subheading: 'المؤتمر الدولي لهندسة المعرفة واللغويات الحاسوبية',
              date: '2024',
              description: 'ورقة بحثية محكّمة تستعرض تقنيات تسريع البحث الدلالي بنسبة استدعاء 94%.',
            },
            {
              id: 'pub-2',
              heading: 'تقييم معماريات الواجهات المحلية لتطبيقات الأعمال',
              subheading: 'مجلة هندسة البرمجيات العربية — المجلد 12',
              date: '2023',
              description: 'دراسة مقارنة لأداء قواعد البيانات المتصفحية وأنماط المزامنة الآمنة.',
            },
          ],
        },
      ],
    },
    sampleEn: SAMPLE_EN_TECH,
  },
  {
    id: 'fresh-grad-starter',
    category: 'fresh-grad',
    nameAr: 'انطلاقة حديثي التخرج والتدريب',
    nameEn: 'Fresh Graduate & Intern Launchpad',
    descAr: 'يُبرز التعليم والمشاريع التطبيقية والشهادات في الصدارة لتعويض قلة سنوات الخبرة بذكاء.',
    descEn: 'Highlights education, projects, and certifications upfront for early-career candidates.',
    badgeAr: 'حديث التخرج',
    badgeEn: 'Entry-Level',
    design: {
      templateId: 'fresh-grad-starter',
      layoutMode: 'one-page',
      modernVariant: 'banner',
      sectionDivider: 'accent-bar',
      paperLang: 'ar',
      paperDir: 'rtl',
      paperSize: 'a4',
      fontFamily: 'tajawal',
      fontScale: 1,
      lineHeight: 1.46,
      marginMm: 15,
      accentColor: '#115e59',
      skillDisplay: 'badges',
    },
    sampleAr: {
      ...SAMPLE_AR_TECH,
      sections: [
        { id: 'summary', visible: true },
        { id: 'education', visible: true },
        { id: 'projects', visible: true },
        { id: 'skills', visible: true },
        { id: 'certifications', visible: true },
        { id: 'experience', visible: true },
        { id: 'languages', visible: true },
        { id: 'custom', visible: true },
      ],
    },
    sampleEn: SAMPLE_EN_TECH,
  },
];

/**
 * Switches the visual template & layout style while keeping 100% of the user's written data intact!
 */
export function applyTemplatePreservingData(doc: ResumeDocument, template: TemplatePreset): ResumeDocument {
  const keepPaperLang = doc.design.paperLang;
  const keepPaperDir = doc.design.paperDir;
  const nextFont = defaultFontForPaperLang(keepPaperLang, template.design.fontFamily);

  return {
    ...doc,
    updatedAt: new Date().toISOString(),
    design: {
      ...template.design,
      paperLang: keepPaperLang,
      paperDir: keepPaperDir,
      paperSize: doc.design.paperSize,
      fontFamily: nextFont,
    },
  };
}

export function createResumeFromTemplate(template: TemplatePreset, paperLang?: PaperLang): ResumeDocument {
  const now = new Date().toISOString();
  const targetLang = paperLang || template.design.paperLang;
  const sample = targetLang === 'en' ? template.sampleEn : template.sampleAr;
  const design: DesignSettings = {
    ...template.design,
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
      design,
    }),
  );
}

export function createDefaultStarterResume(paperLang: PaperLang = 'ar'): ResumeDocument {
  const defaultTemplate = CV_TEMPLATES[1]; // Modern Emerald Executive with rich realistic sample
  return createResumeFromTemplate(defaultTemplate, paperLang);
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
  };
}
