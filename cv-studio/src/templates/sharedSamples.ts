import type {
  CoverLetterData,
  ResumeDocument,
  SectionMeta,
} from '../core/types';

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

export function defaultCoverLetterAr(
  name = 'أحمد طارق منصور',
  role = 'مهندس برمجيات أول',
  company = 'شركة تقنية رائدة',
): CoverLetterData {
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
    closing:
      'أرفق لكم سيرتي الذاتية للاطلاع على أبرز المشاريع والمؤشرات الرقمية، وأرحب بفرصة إجراء مقابلة لمناقشة كيف يمكن لخبرتي دعم أهداف فريقكم.',
    signOff: 'وتفضلوا بقبول فائق الاحترام والتقدير،',
    signatureText: name,
    showSignature: true,
  };
}

export function defaultCoverLetterEn(
  name = 'Ahmed Tarek Mansour',
  role = 'Senior Software Engineer',
  company = 'Horizon Tech',
): CoverLetterData {
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
    closing:
      'Thank you for reviewing my attached resume. I would welcome the opportunity to discuss how my technical execution can contribute to your upcoming roadmap.',
    signOff: 'Sincerely,',
    signatureText: name,
    showSignature: true,
  };
}

export type SampleResumePayload = Omit<ResumeDocument, 'id' | 'createdAt' | 'updatedAt' | 'design'>;

export const SAMPLE_AR_TECH: SampleResumePayload = {
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
  canvasElements: [],
  blockStyles: {},
};

export const SAMPLE_EN_TECH: SampleResumePayload = {
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
  canvasElements: [],
  blockStyles: {},
};

export const SAMPLE_AR_EXEC: SampleResumePayload = {
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
  canvasElements: [],
  blockStyles: {},
};

export const SAMPLE_AR_MEDICAL: SampleResumePayload = {
  ...SAMPLE_AR_TECH,
  title: 'سيرة استشاري أمراض القلب — د. يوسف عبد الحميد',
  targetCompany: 'مستشفى دار الفؤاد التخصصي',
  personal: {
    ...SAMPLE_AR_TECH.personal,
    fullName: 'د. يوسف نبيل عبد الحميد',
    jobTitle: 'استشاري أمراض القلب والقسطرة التداخلية (MD, MRCP)',
    email: 'dr.youssef.cardio@example.com',
    phone: '+20 109 334 7810',
    location: 'القاهرة، مصر',
    linkedin: 'linkedin.com/in/dr-youssef-cardio',
    website: '',
    github: '',
  },
  summary:
    'استشاري أمراض القلب والأوعية الدموية بخبرة إكلينيكية تتجاوز 10 سنوات في القسطرة التداخلية الطارئة ورعاية الحالات الحرجة بوحدات العناية القلبية المركزة (CCU). أجرى أكثر من 1,400 عملية قسطرة تشخيصية وعلاجية بنسب نجاح قياسية، وشارك في تدريب الأطباء المقيمين ونشر أبحاث سريرية محكّمة.',
  experience: [
    {
      id: 'exp-med-1',
      role: 'استشاري أمراض القلب والقسطرة التداخلية',
      company: 'المجمع الطبي التخصصي للقلب',
      location: 'القاهرة، مصر',
      startDate: '2020-06',
      endDate: '',
      current: true,
      highlights: [
        'إجراء أكثر من 450 قسطرة شريان تاجي علاجية ودعامات دوائية سنوياً مع خفض زمن التدخل الطارئ (Door-to-Balloon) إلى أقل من 52 دقيقة.',
        'الإشراف الإكلينيكي على وحدة العناية القلبية المركزة (18 سريراً) وتحديث بروتوكولات سلامة المرضى.',
      ],
    },
    {
      id: 'exp-med-2',
      role: 'أخصائي أول أمراض القلب والأوعية الدموية',
      company: 'مستشفيات جامعة عين شمس',
      location: 'القاهرة، مصر',
      startDate: '2016-03',
      endDate: '2020-05',
      current: false,
      highlights: [
        'تقييم ومتابعة أكثر من 60 مريضاً أسبوعياً بعيادات قصور عضلة القلب والموجات فوق الصوتية (Echocardiography).',
        'تدريب وتوجيه 25 طبيباً مقيماً على قراءة تخطيط القلب والتعامل مع الطوارئ القلبية الحادة.',
      ],
    },
  ],
  education: [
    {
      id: 'edu-med-1',
      degree: 'دكتوراه طب القلب والأوعية الدموية (MD Cardiology)',
      school: 'كلية الطب — جامعة عين شمس',
      location: 'القاهرة، مصر',
      startDate: '2016',
      endDate: '2020',
      grade: 'امتياز',
      notes: 'الزمالة البريطانية للأطباء الباطنيين MRCP (UK) — ترخيص مزاولة المهنة سارٍ.',
    },
  ],
  certifications: [
    { id: 'c-med-1', name: 'عضوية الكلية الملكية للأطباء الباطنيين MRCP (UK)', issuer: 'Royal Colleges of Physicians', date: '2021', credentialId: 'MRCP-9921' },
    { id: 'c-med-2', name: 'دعم الحياة القلبي المتقدم ACLS & BLS', issuer: 'American Heart Association', date: '2024', credentialId: 'AHA-4410' },
  ],
  skills: [
    { id: 'skm-1', name: 'القسطرة القلبية التداخلية (PCI)', level: 5 },
    { id: 'skm-2', name: 'إيكو القلب عبر الصدر والمريء (TTE/TEE)', level: 5 },
    { id: 'skm-3', name: 'إدارة العناية القلبية المركزة (CCU)', level: 5 },
    { id: 'skm-4', name: 'تخطيط القلب والجهد (ECG & Stress Test)', level: 5 },
    { id: 'skm-5', name: 'سلامة المرضى والجودة الإكلينيكية', level: 4 },
  ],
  projects: [],
  coverLetter: defaultCoverLetterAr('د. يوسف نبيل عبد الحميد', 'استشاري أمراض القلب والقسطرة التداخلية', 'مستشفى دار الفؤاد التخصصي'),
  canvasElements: [],
  blockStyles: {},
};
