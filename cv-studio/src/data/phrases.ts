export interface ReadyPhrase {
  id: string;
  category: 'tech' | 'leadership' | 'growth' | 'operations';
  categoryLabelAr: string;
  categoryLabelEn: string;
  ar: string;
  en: string;
}

export const SUMMARY_STARTERS: { id: string; labelAr: string; labelEn: string; ar: string; en: string }[] = [
  {
    id: 'sum-tech',
    labelAr: 'هندسة البرمجيات والتقنية',
    labelEn: 'Software & Engineering',
    ar: 'مهندس برمجيات أول بخبرة تتجاوز 5 سنوات في بناء تطبيقات الويب عالية الاعتمادية باستخدام TypeScript وReact وNode.js، مع سجل موثق في تسريع أداء المنصات بنسبة 42% وقيادة فرق العمل الرشيقة لتسليم منتجات تخدم مئات الآلاف من المستخدمين.',
    en: 'Senior Software Engineer with 5+ years of experience architecting scalable web platforms using TypeScript, React, and Node.js. Proven track record of improving core load performance by 42% and leading agile product delivery for 200K+ active users.',
  },
  {
    id: 'sum-exec',
    labelAr: 'الإدارة التنفيذية والعمليات',
    labelEn: 'Executive & Operations',
    ar: 'مدير عمليات وتطوير أعمال بخبرة 8 سنوات في قيادة التحول المؤسسي وضبط الميزانيات التشغيلية، نجح في رفع كفاءة سلاسل الإمداد بنسبة 31% وتقليص التكاليف السنوية مع الحفاظ على أعلى مؤشرات رضا العملاء.',
    en: 'Operations & Strategy Manager with 8+ years leading organizational growth, P&L optimization, and cross-functional execution—boosting operational efficiency by 31% while elevating client retention.',
  },
  {
    id: 'sum-finance',
    labelAr: 'المحاسبة والتحليل المالي',
    labelEn: 'Finance & Analytics',
    ar: 'محلل مالي ومحاسب معتمد متمرس في إعداد التقارير المالية والنمذجة التنبؤية وتحليل التدفقات النقدية وفق المعايير الدولية IFRS، مع قدرة عالية على أتمتة لوحات المؤشرات لدعم القرارات الاستثمارية.',
    en: 'Detail-oriented Financial Analyst experienced in IFRS reporting, forecasting models, cash-flow optimization, and automated BI dashboards that drive confident executive decision-making.',
  },
  {
    id: 'sum-fresh',
    labelAr: 'حديث التخرج والتدريب',
    labelEn: 'Fresh Graduate & Entry-Level',
    ar: 'خريج متميز بتقدير امتياز مع خبرة عملية من خلال مشاريع تطبيقية وتدريب ميداني مكثف، أمتلك أساساً تقنياً قوياً ومهارات سريعة في التعلم وحل المشكلات والعمل الجماعي ضمن بيئات عمل احترافية.',
    en: 'High-achieving Honors Graduate with hands-on internship and capstone project experience, combining strong analytical fundamentals, rapid learning, and disciplined teamwork.',
  },
];

export const ACHIEVEMENT_PHRASES: ReadyPhrase[] = [
  {
    id: 'ph-1',
    category: 'tech',
    categoryLabelAr: 'تقنية وهندسة',
    categoryLabelEn: 'Tech & Engineering',
    ar: 'طوّرت وأطلقت معمارية واجهات أمامية حديثة رفعت سرعة استجابة الصفحات بنسبة 45% وخفّضت أخطاء التشغيل في الإنتاج بنسبة 60%.',
    en: 'Architected and shipped a modular frontend system that accelerated page load speed by 45% and reduced production error rates by 60%.',
  },
  {
    id: 'ph-2',
    category: 'tech',
    categoryLabelAr: 'تقنية وهندسة',
    categoryLabelEn: 'Tech & Engineering',
    ar: 'أتمتت خطوط الاختبار والنشر المستمر (CI/CD)، مما قلّص زمن إطلاق التحديثات الأسبوعية من 4 ساعات إلى 15 دقيقة.',
    en: 'Automated CI/CD testing and deployment pipelines, cutting release cycles from 4 hours down to 15 minutes.',
  },
  {
    id: 'ph-3',
    category: 'tech',
    categoryLabelAr: 'تقنية وهندسة',
    categoryLabelEn: 'Tech & Engineering',
    ar: 'صممت واجهات برمجية (REST APIs) عالية الكفاءة تعالج أكثر من 1.2 مليون طلب يومياً بنسبة توافر 99.95%.',
    en: 'Engineered high-throughput REST APIs handling 1.2M+ daily requests while maintaining 99.95% uptime SLA.',
  },
  {
    id: 'ph-4',
    category: 'leadership',
    categoryLabelAr: 'قيادة وإدارة فرق',
    categoryLabelEn: 'Leadership & Management',
    ar: 'قدت فريقاً متعدد التخصصات من 9 أفراد لتسليم 14 مشروعاً استراتيجياً في الموعد المحدد وضمن الميزانية المعتمدة بنسبة التزام 100%.',
    en: 'Led a cross-functional team of 9 specialists to deliver 14 strategic initiatives on schedule and 100% within approved budget.',
  },
  {
    id: 'ph-5',
    category: 'leadership',
    categoryLabelAr: 'قيادة وإدارة فرق',
    categoryLabelEn: 'Leadership & Management',
    ar: 'أشرفت على تدريب وتأهيل 12 عضواً جديداً، مما رفع إنتاجية الفريق بنسبة 28% خلال الربع الأول.',
    en: 'Mentored and onboarded 12 team members, increasing sprint velocity and team output by 28% in Q1.',
  },
  {
    id: 'ph-6',
    category: 'growth',
    categoryLabelAr: 'نمو وتسويق ومبيعات',
    categoryLabelEn: 'Growth, Sales & Marketing',
    ar: 'ضاعفت معدل التحويل الرقمي بنسبة 38% وخفّضت تكلفة الاستحواذ على العميل (CAC) بنسبة 24% عبر اختبارات A/B وتحسين رحلة المستخدم.',
    en: 'Increased digital conversion rate by 38% and lowered customer acquisition cost (CAC) by 24% through structured A/B experimentation.',
  },
  {
    id: 'ph-7',
    category: 'growth',
    categoryLabelAr: 'نمو وتسويق ومبيعات',
    categoryLabelEn: 'Growth, Sales & Marketing',
    ar: 'أدرت محفظة عملاء استراتيجيين وحققت نمواً في الإيرادات السنوية المتكررة بنسبة 34% مع معدل احتفاظ بالعملاء بلغ 94%.',
    en: 'Managed enterprise client accounts and grew annual recurring revenue (ARR) by 34% with a 94% retention rate.',
  },
  {
    id: 'ph-8',
    category: 'operations',
    categoryLabelAr: 'عمليات ومالية وجودة',
    categoryLabelEn: 'Operations & Finance',
    ar: 'أعدت هيكلة إجراءات الإقفال المالي الشهري وأتمتت التقارير الدورية، مما وفّر 35 ساعة عمل شهرياً ورفع دقة المطابقات إلى 99.8%.',
    en: 'Streamlined monthly financial close workflows and automated reporting dashboards, saving 35 hours/month at 99.8% accuracy.',
  },
  {
    id: 'ph-9',
    category: 'operations',
    categoryLabelAr: 'عمليات ومالية وجودة',
    categoryLabelEn: 'Operations & Finance',
    ar: 'تفاوضت مع الموردين الرئيسيين وأعدت صياغة العقود السنوية، محققاً وفورات مباشرة بقيمة 18% دون المساس بمعايير الجودة.',
    en: 'Renegotiated vendor contracts and procurement workflows, realizing 18% annual cost savings with zero quality compromise.',
  },
];

export interface CoverLetterPreset {
  id: string;
  roleTypeAr: string;
  roleTypeEn: string;
  subjectAr: string;
  subjectEn: string;
  greetingAr: string;
  greetingEn: string;
  openingAr: string;
  openingEn: string;
  bodyAr: string;
  bodyEn: string;
  closingAr: string;
  closingEn: string;
  signOffAr: string;
  signOffEn: string;
}

export const COVER_LETTER_PRESETS: CoverLetterPreset[] = [
  {
    id: 'cl-tech',
    roleTypeAr: 'وظيفة تقنية وهندسة برمجيات',
    roleTypeEn: 'Software & Tech Role',
    subjectAr: 'التقدم لوظيفة {{role}} لدى {{company}}',
    subjectEn: 'Application for {{role}} at {{company}}',
    greetingAr: 'السادة فريق التوظيف في {{company}} المحترمين،',
    greetingEn: 'Dear Hiring Manager at {{company}},',
    openingAr: 'يسعدني التقدم لوظيفة {{role}} لدى {{company}}، انطلاقاً من خبرتي العملية في تطوير منتجات رقمية عالية الأداء وبناء حلول هندسية قابلة للتوسع تركز على تجربة المستخدم والاعتمادية.',
    openingEn: 'I am excited to submit my application for the {{role}} position at {{company}}. With a strong track record in building reliable, user-focused software systems, I am eager to contribute directly to your engineering goals.',
    bodyAr: 'خلال مسيرتي المهنية، عملت على قيادة وتطوير مشاريع متكاملة حققت تحسناً ملموساً في سرعة الأداء وجودة الكود البرمجي وتقليص زمن الإطلاق. يجذبني في {{company}} التزامكم بالابتكار التقني وجودة المنتج، وأثق أن مهاراتي في الهندسة الحديثة والعمل الجماعي الرشيق ستضيف قيمة فورية لفريقكم.',
    bodyEn: 'Throughout my recent roles, I have delivered measurable improvements in application performance, code maintainability, and release velocity while collaborating closely with product and design partners. {{company}}’s focus on engineering excellence strongly aligns with how I build and ship products.',
    closingAr: 'أرفق لكم سيرتي الذاتية للاطلاع على تفاصيل خبراتي ومشاريعي، وأتطلع بترحيب لفرصة إجراء مقابلة لمناقشة كيف يمكنني المساهمة في نجاح مشاريعكم القادمة.',
    closingEn: 'Thank you for reviewing my resume and application. I would welcome the opportunity to discuss how my background and technical execution can support {{company}}’s upcoming initiatives.',
    signOffAr: 'وتفضلوا بقبول فائق الاحترام والتقدير،',
    signOffEn: 'Sincerely,',
  },
  {
    id: 'cl-executive',
    roleTypeAr: 'منصب إداري وقيادي',
    roleTypeEn: 'Management & Executive',
    subjectAr: 'طلب ترشح لمنصب {{role}} — {{company}}',
    subjectEn: 'Executive Application: {{role}} — {{company}}',
    greetingAr: 'عناية الإدارة التنفيذية ولجنة الاستقطاب في {{company}}،',
    greetingEn: 'Dear Executive Search & Hiring Committee at {{company}},',
    openingAr: 'أتقدم إليكم بطلبي لشغل منصب {{role}} في {{company}}، مستنداً إلى خبرة قيادية ممتدة في توجيه الفرق متعددة التخصصات، وتحسين الكفاءة التشغيلية، وتحويل الخطط الاستراتيجية إلى نتائج مالية وتشغيلية ملموسة.',
    openingEn: 'I am writing to express my strong interest in the {{role}} role at {{company}}, bringing proven leadership across strategic planning, operational excellence, and high-performing team development.',
    bodyAr: 'نجحت في محطاتي السابقة في رفع مؤشرات الأداء الرئيسية وضبط الميزانيات وبناء ثقافة عمل قائمة على المساءلة والوضوح. أتطلع إلى توظيف هذه الخبرة لدعم مستهدفات النمو والتوسع لدى {{company}}.',
    bodyEn: 'In my previous leadership mandates, I consistently aligned cross-functional teams around clear KPIs, streamlined execution bottlenecks, and delivered sustainable growth without sacrificing quality.',
    closingAr: 'يسعدني التواصل معكم في الوقت المناسب لكم لاستعراض رؤيتي العملية وكيف تتكامل خبراتي مع أولويات {{company}} في المرحلة المقبلة.',
    closingEn: 'I look forward to speaking with you to explore how my leadership approach can advance {{company}}’s strategic priorities.',
    signOffAr: 'مع خالص التحية والتقدير،',
    signOffEn: 'Best regards,',
  },
  {
    id: 'cl-marketing',
    roleTypeAr: 'تسويق وتطوير أعمال',
    roleTypeEn: 'Marketing & Growth',
    subjectAr: 'التقدم لوظيفة {{role}} في {{company}}',
    subjectEn: 'Application for {{role}} — {{company}}',
    greetingAr: 'الأستاذ/ة مدير التوظيف في {{company}}،',
    greetingEn: 'Dear Hiring Team at {{company}},',
    openingAr: 'أكتب إليكم بشغف للتقدم لوظيفة {{role}} في {{company}}، جامعاً بين التفكير الإبداعي والتحليل الرقمي الدقيق لبناء حملات نمو ترفع الوعي بالعلامة التجارية وتضاعف معدلات التحويل.',
    openingEn: 'I am thrilled to apply for the {{role}} opening at {{company}}, combining data-backed growth experimentation with compelling brand storytelling.',
    bodyAr: 'عملت على تخطيط وتنفيذ حملات متعددة القنوات بالاعتماد على قراءة البيانات وسلوك المستخدم، مما أثمر عن نمو مستدام في اكتساب العملاء والاحتفاظ بهم. يسعدني تسخير هذه الخبرة لتعزيز حضور {{company}} في السوق.',
    bodyEn: 'By pairing funnel analytics with creative positioning, I have scaled acquisition campaigns and improved retention metrics across competitive markets—experience I am eager to bring to {{company}}.',
    closingAr: 'شاكراً لكم وقتكم واهتمامكم، وأتطلع للحديث قريباً حول أفكار عملية تدعم نمو {{company}}.',
    closingEn: 'Thank you for your time and consideration. I look forward to discussing how I can help accelerate {{company}}’s growth.',
    signOffAr: 'أطيب التحيات،',
    signOffEn: 'Warm regards,',
  },
  {
    id: 'cl-fresh',
    roleTypeAr: 'حديث التخرج / تدريب مهني',
    roleTypeEn: 'Fresh Graduate / Internship',
    subjectAr: 'التقدم لفرصة {{role}} لدى {{company}}',
    subjectEn: 'Application for {{role}} Opportunity at {{company}}',
    greetingAr: 'السادة فريق الموارد البشرية في {{company}}،',
    greetingEn: 'Dear Recruiting Team at {{company}},',
    openingAr: 'يسرني التقدم لفرصة {{role}} لدى {{company}}، حاملاً تأسيساً أكاديمياً متميزاً وشغفاً عملياً ظهر في المشاريع التطبيقية والتدريبات التي أنجزتها.',
    openingEn: 'I am writing to apply for the {{role}} opportunity at {{company}}, bringing strong academic foundations, hands-on project work, and high enthusiasm to learn and contribute.',
    bodyAr: 'حرصت خلال دراستي على تحويل المعرفة النظرية إلى مشاريع حقيقية قابلة للقياس، مع الالتزام بالدقة وسرعة التعلم والعمل المتناغم ضمن الفريق. تمثل {{company}} البيئة المثالية التي أطمح للنمو والعطاء فيها.',
    bodyEn: 'Through capstone projects and practical training, I developed disciplined problem-solving habits, strong technical fundamentals, and collaborative communication skills that prepare me to add value from day one.',
    closingAr: 'ممتنّ لاطلاعكم على سيرتي الذاتية المرفقة، وأتطلع بشدة لفرصة اللقاء بكم.',
    closingEn: 'Thank you for reviewing my attached resume. I would be honored to interview with your team.',
    signOffAr: 'مع خالص الاحترام،',
    signOffEn: 'Respectfully,',
  },
];

export const SAMPLE_JOB_DESCRIPTIONS: { id: string; titleAr: string; titleEn: string; text: string }[] = [
  {
    id: 'jd-frontend-en',
    titleAr: 'مهندس واجهات أمامية (English JD)',
    titleEn: 'Senior Frontend Engineer (EN)',
    text: 'We are hiring a Senior Frontend Engineer proficient in TypeScript, React, Next.js, TailwindCSS, REST APIs, GraphQL, Git, CI/CD, Performance Optimization, Accessibility, and Automated Testing with Playwright.',
  },
  {
    id: 'jd-fullstack-ar',
    titleAr: 'مهندس برمجيات متكامل (وصف وظيفي عربي)',
    titleEn: 'Full-Stack Developer (AR)',
    text: 'مطلوب مهندس برمجيات متكامل لديه خبرة في تطوير تطبيقات الويب باستخدام TypeScript و React و Node.js وقواعد البيانات SQL و Docker وأتمتة النشر CI/CD وتحسين الأداء وتكامل واجهات البرمجة APIs.',
  },
  {
    id: 'jd-data-en',
    titleAr: 'محلل بيانات وذكاء أعمال (BI & Data)',
    titleEn: 'Data & BI Analyst (EN)',
    text: 'Seeking a Data Analyst skilled in SQL, Python, Power BI, Excel, Forecasting, KPI Dashboards, Data Modeling, ETL, and Stakeholder Reporting.',
  },
];
