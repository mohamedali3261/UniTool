import type { AtsCheckItem, AtsFixKind, AtsReport, AtsSubScore, ResumeDocument } from './types';

const EN_STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'have', 'will', 'your', 'you', 'our', 'are',
  'who', 'what', 'when', 'where', 'how', 'why', 'into', 'over', 'under', 'more', 'most', 'some',
  'such', 'than', 'then', 'them', 'they', 'their', 'about', 'after', 'before', 'between', 'across',
  'role', 'team', 'work', 'working', 'experience', 'years', 'year', 'strong', 'ability', 'skills',
  'skill', 'looking', 'join', 'must', 'plus', 'good', 'great', 'excellent', 'using', 'build',
  'building', 'help', 'make', 'ensure', 'within', 'including', 'related', 'field', 'degree', 'job',
  'position', 'company', 'responsibilities', 'requirements', 'qualifications', 'preferred', 'ideal',
  'candidate', 'collaborate', 'environment', 'fast', 'paced', 'able', 'well', 'high', 'level', 'new',
]);

const AR_STOP_WORDS = new Set([
  'في', 'من', 'على', 'إلى', 'الى', 'عن', 'مع', 'هذا', 'هذه', 'ذلك', 'تلك', 'التي', 'الذي', 'الذين',
  'أو', 'او', 'ثم', 'حتى', 'كل', 'بعض', 'غير', 'بين', 'فوق', 'تحت', 'خلال', 'عبر', 'بعد', 'قبل',
  'لدى', 'نحن', 'أنت', 'ان', 'أن', 'إن', 'كان', 'تكون', 'يكون', 'عمل', 'العمل', 'خبرة', 'سنوات',
  'سنة', 'وظيفة', 'مطلوب', 'القدرة', 'مهارات', 'جيد', 'ممتاز', 'فريق', 'شركة', 'مجال', 'ضمن',
  'بشكل', 'على', 'حسب', 'متطلبات', 'المهام', 'المسؤوليات', 'المؤهلات', 'يفضل', 'إجادة', 'اجادة',
]);

const STRONG_VERBS_EN = [
  'led', 'built', 'designed', 'developed', 'launched', 'improved', 'increased', 'reduced', 'automated',
  'architected', 'delivered', 'managed', 'optimized', 'spearheaded', 'engineered', 'scaled', 'streamlined',
  'achieved', 'generated', 'implemented', 'mentored', 'negotiated', 'accelerated',
];

const STRONG_VERBS_AR = [
  'طورت', 'طوّرت', 'قدت', 'أدرت', 'حسنت', 'حسّنت', 'رفعت', 'خفضت', 'خفّضت', 'أنشأت', 'صممت', 'صمّمت',
  'أطلقت', 'نفذت', 'نفّذت', 'حققت', 'بنيت', 'أتمتت', 'ضاعفت', 'عززت', 'أسست', 'ابتكرت', 'أنجزت',
];

function normalizeToken(word: string): string {
  return word
    .toLowerCase()
    .replace(/^[\s.,;:!?()[\]{}"'«»“”‘’/\\|•·–—-]+|[\s.,;:!?()[\]{}"'«»“”‘’/\\|•·–—-]+$/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة$/g, 'ه')
    .replace(/ى$/g, 'ي');
}

export function collectResumeCorpus(doc: ResumeDocument): string {
  const parts: string[] = [
    doc.personal.fullName,
    doc.personal.jobTitle,
    doc.summary,
    ...doc.experience.flatMap((e) => [e.role, e.company, ...e.highlights]),
    ...doc.education.flatMap((e) => [e.degree, e.school, e.notes]),
    ...doc.certifications.flatMap((c) => [c.name, c.issuer]),
    ...doc.skills.map((s) => s.name),
    ...doc.languages.map((l) => l.name),
    ...doc.projects.flatMap((p) => [p.name, p.role, p.summary, ...p.highlights]),
    ...doc.customSections.filter((g) => g.visible).flatMap((g) => [
      g.title,
      ...g.items.flatMap((i) => [i.heading, i.subheading, i.description]),
    ]),
  ];
  return parts.filter(Boolean).join(' \n ');
}

/**
 * Extracts meaningful domain/technical keywords from a Job Description (Arabic or English).
 */
export function extractJobKeywords(jobDescription: string, maxKeywords = 18): string[] {
  if (!jobDescription.trim()) return [];

  // Capture technical tokens like Node.js, C#, C++, Next.js, TypeScript, SQL, CI/CD, Power BI, and Arabic words
  const rawTokens = jobDescription.match(/[A-Za-z][A-Za-z0-9+#./-]{1,24}|[\u0600-\u06FF]{3,24}/g) || [];
  const counts = new Map<string, { display: string; count: number; bonus: number }>();

  for (const raw of rawTokens) {
    const cleaned = raw.replace(/[.,;:!?()]+$/g, '');
    const norm = normalizeToken(cleaned);
    if (norm.length < 2) continue;
    if (/^\d+$/.test(norm)) continue;
    if (EN_STOP_WORDS.has(norm) || AR_STOP_WORDS.has(cleaned) || AR_STOP_WORDS.has(norm)) continue;

    // Strip Arabic definite article "ال" for stop-word check while preserving nice display
    const withoutAl = norm.startsWith('ال') && norm.length > 4 ? norm.slice(2) : norm;
    if (AR_STOP_WORDS.has(withoutAl)) continue;

    const isTechLike = /[A-Z0-9+#./]/.test(cleaned) ? 1.5 : 1;
    const prev = counts.get(withoutAl);
    if (prev) {
      prev.count += 1;
    } else {
      counts.set(withoutAl, { display: cleaned, count: 1, bonus: isTechLike });
    }
  }

  return [...counts.values()]
    .sort((a, b) => b.count * b.bonus - a.count * a.bonus)
    .slice(0, maxKeywords)
    .map((item) => item.display);
}

export function evaluateAts(doc: ResumeDocument): AtsReport {
  const checks: AtsCheckItem[] = [];
  const corpus = collectResumeCorpus(doc);
  const normCorpus = normalizeToken(corpus)
    .split(/\s+/)
    .map((w) => {
      const n = normalizeToken(w);
      return n.startsWith('ال') && n.length > 4 ? n.slice(2) : n;
    });
  const corpusSet = new Set(normCorpus);
  const rawLowerCorpus = normalizeToken(corpus);

  // 1. Format & ATS Parseability (Max 25)
  let formatScore = 0;
  if (doc.design.layoutMode === 'ats' || doc.design.layoutMode === 'one-page' || doc.design.layoutMode === 'detailed') {
    formatScore += 11;
    checks.push({
      id: 'single-column',
      status: 'pass',
      category: 'format',
      titleAr: 'تخطيط عمود قياسي قابل للقراءة الآلية',
      titleEn: 'Standard ATS-readable column flow',
      detailAr: 'ترتيب الأقسام المتسلسل يضمن قراءة التواريخ والمسميات الوظيفية بدقة.',
      detailEn: 'Linear section order ensures accurate date and role parsing.',
    });
  } else {
    formatScore += 7;
    checks.push({
      id: 'single-column',
      status: 'warn',
      category: 'format',
      titleAr: 'التصميم العصري ممتاز للبشر، ووضع ATS أدق للبوابات الآلية',
      titleEn: 'Modern layout looks great; ATS mode is stricter for portals',
      detailAr: 'عند التقديم عبر بوابات توظيف آلية صارمة (مثل Workday/Taleo)، يُنصح بالتبديل لوضع ATS.',
      detailEn: 'When submitting to strict ATS portals (Workday/Taleo), switch to 100% ATS mode.',
      fixKind: 'switch-ats-mode',
      fixLabelAr: 'التحويل لوضع ATS 100%',
      fixLabelEn: 'Switch to 100% ATS mode',
    });
  }

  if (!doc.personal.showPhoto || !doc.personal.photoDataUrl) {
    formatScore += 7;
    checks.push({
      id: 'photo-policy',
      status: 'pass',
      category: 'format',
      titleAr: 'بدون صورة شخصية مدمجة تشتت الفرز الآلي',
      titleEn: 'Clean header without embedded photo',
      detailAr: 'معظم معايير ATS العالمية تفضل عدم تضمين صورة شخصية.',
      detailEn: 'Most global ATS standards prefer resumes without profile photos.',
    });
  } else {
    formatScore += 4;
    checks.push({
      id: 'photo-policy',
      status: 'warn',
      category: 'format',
      titleAr: 'الصورة الشخصية مفعّلة حالياً',
      titleEn: 'Profile photo is currently visible',
      detailAr: 'مقبولة في بعض الشركات المحلية، لكن إخفاءها أفضل للشركات العالمية وأنظمة ATS.',
      detailEn: 'Acceptable regionally, but hiding it improves strict global ATS compliance.',
      fixKind: 'hide-photo',
      fixLabelAr: 'إخفاء الصورة بنقرة',
      fixLabelEn: 'Hide photo in 1 click',
    });
  }

  if (doc.design.skillDisplay === 'comma' || doc.design.skillDisplay === 'badges' || doc.design.skillDisplay === 'bullets') {
    formatScore += doc.design.skillDisplay === 'comma' ? 7 : 6;
    if (doc.design.skillDisplay !== 'comma') {
      checks.push({
        id: 'skill-format',
        status: 'pass',
        category: 'format',
        titleAr: 'عرض المهارات نصي واضح',
        titleEn: 'Skills rendered as clear text',
        detailAr: 'يمكنك أيضاً اختيار وضع الفواصل النصية لأعلى توافق مع ATS.',
        detailEn: 'You can also switch to comma-separated text for maximum ATS compatibility.',
      });
    } else {
      checks.push({
        id: 'skill-format',
        status: 'pass',
        category: 'format',
        titleAr: 'المهارات مفصولة بفواصل قياسية للـ ATS',
        titleEn: 'Skills formatted as standard ATS comma-separated text',
        detailAr: 'أفضل صيغة لاستخلاص الكلمات المفتاحية بدون رموز رسومية.',
        detailEn: 'Optimal format for keyword extraction without graphic meters.',
      });
    }
  } else {
    formatScore += 3;
    checks.push({
      id: 'skill-format',
      status: 'warn',
      category: 'format',
      titleAr: 'أشرطة المستوى الرسومية لا يقرؤها نظام الـ ATS',
      titleEn: 'Graphic skill bars are ignored by ATS parsers',
      detailAr: 'أنظمة الفرز تقرأ اسم المهارة النصي وتتجاهل النسب المرسومة.',
      detailEn: 'ATS bots read skill names and ignore visual percentage bars.',
      fixKind: 'skills-comma',
      fixLabelAr: 'تحويل المهارات لنص ATS',
      fixLabelEn: 'Convert skills to ATS text',
    });
  }

  // 2. Contact Completeness (Max 15)
  let contactScore = 0;
  const hasEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(doc.personal.email.trim());
  const hasPhone = doc.personal.phone.trim().length >= 7;
  const hasNameAndRole = doc.personal.fullName.trim().length >= 3 && doc.personal.jobTitle.trim().length >= 2;
  const hasLocation = doc.personal.location.trim().length >= 2;
  const hasLink = Boolean(doc.personal.linkedin.trim() || doc.personal.website.trim() || doc.personal.github.trim());

  if (hasNameAndRole) contactScore += 4;
  if (hasEmail) contactScore += 4;
  if (hasPhone) contactScore += 3;
  if (hasLocation) contactScore += 2;
  if (hasLink) contactScore += 2;

  if (contactScore >= 13) {
    checks.push({
      id: 'contact-complete',
      status: 'pass',
      category: 'contact',
      titleAr: 'بيانات التواصل مكتملة واحترافية',
      titleEn: 'Complete & professional contact details',
      detailAr: 'الاسم، المسمى الوظيفي، البريد، الهاتف، والموقع والروابط المهنية متوفرة.',
      detailEn: 'Name, job title, email, phone, location, and professional link are present.',
    });
  } else {
    checks.push({
      id: 'contact-complete',
      status: contactScore >= 9 ? 'warn' : 'fail',
      category: 'contact',
      titleAr: 'نقص في بعض بيانات التواصل الأساسية',
      titleEn: 'Some essential contact details are missing',
      detailAr: 'تأكد من كتابة البريد الإلكتروني الصحيح، رقم الهاتف، الموقع، ورابط LinkedIn.',
      detailEn: 'Ensure valid email, phone number, city/country, and LinkedIn URL are filled.',
    });
  }

  // 3. Impact & Measurable Achievements (Max 25)
  const allBullets = [
    ...doc.experience.flatMap((e) => e.highlights),
    ...doc.projects.flatMap((p) => p.highlights),
  ].filter((b) => b.trim().length > 0);

  const metricBullets = allBullets.filter((b) => /\d+\s*(%|٪|\+|x|k|m|مليون|ألف|الف|ساعة|يوم|عميل|مشروع|\$)/i.test(b) || /\d{2,}/.test(b));
  const verbBullets = allBullets.filter((b) => {
    const low = b.toLowerCase();
    return STRONG_VERBS_EN.some((v) => low.includes(v)) || STRONG_VERBS_AR.some((v) => b.includes(v));
  });

  let impactScore = 0;
  if (allBullets.length >= 4) impactScore += 10;
  else if (allBullets.length >= 2) impactScore += 5;

  if (metricBullets.length >= 2) impactScore += 9;
  else if (metricBullets.length === 1) impactScore += 5;

  if (verbBullets.length >= 2) impactScore += 6;
  else if (verbBullets.length === 1) impactScore += 3;

  if (metricBullets.length >= 2 && allBullets.length >= 4) {
    checks.push({
      id: 'measurable-impact',
      status: 'pass',
      category: 'impact',
      titleAr: `إنجازات رقمية قابلة للقياس (${metricBullets.length} نقاط مدعومة بأرقام)`,
      titleEn: `Quantified impact (${metricBullets.length} metric-backed bullets)`,
      detailAr: 'الأرقام والنسب المئوية ترفع جاذبية السيرة الذاتية لدى مسؤولي التوظيف.',
      detailEn: 'Metrics and percentages significantly boost recruiter & ATS ranking.',
    });
  } else {
    checks.push({
      id: 'measurable-impact',
      status: metricBullets.length === 1 ? 'warn' : 'fail',
      category: 'impact',
      titleAr: 'أضف أرقاماً ونسب إنجاز داخل الخبرات العملية',
      titleEn: 'Add numbers & measurable results in experience bullets',
      detailAr: 'استخدم صياغات مثل: «رفعت الأداء بنسبة 35%» أو «Improved load speed by 40%».',
      detailEn: 'Include concrete outcomes such as "Increased conversion by 28%".',
      fixKind: 'add-measurable-bullet',
      fixLabelAr: 'إدراج عبارة إنجازية قياسية',
      fixLabelEn: 'Insert sample metric bullet',
    });
  }

  // 4. Core Sections Coverage (Max 20)
  let sectionsScore = 0;
  const visibleSet = new Set(doc.sections.filter((s) => s.visible).map((s) => s.id));
  const hasSummary = visibleSet.has('summary') && doc.summary.trim().length >= 50;
  const hasExpOrProj =
    (visibleSet.has('experience') && doc.experience.length > 0) ||
    (visibleSet.has('projects') && doc.projects.length > 0);
  const hasEdu = visibleSet.has('education') && doc.education.length > 0;
  const hasSkills = visibleSet.has('skills') && doc.skills.length >= 5;

  if (hasSummary) sectionsScore += 5;
  else {
    checks.push({
      id: 'summary-check',
      status: 'warn',
      category: 'sections',
      titleAr: 'الملخص المهني قصير أو غير مفعّل',
      titleEn: 'Professional summary is missing or too short',
      detailAr: 'ملخص من 2 إلى 4 أسطر يوضح تخصصك وسنوات خبرتك وأبرز مهاراتك.',
      detailEn: 'A 2–4 line summary clarifies your role, seniority, and core strengths.',
      fixKind: 'add-summary-starter',
      fixLabelAr: 'إضافة ملخص مهني احترافي',
      fixLabelEn: 'Add starter summary',
    });
  }

  if (hasExpOrProj) sectionsScore += 6;
  if (hasEdu) sectionsScore += 4;
  if (hasSkills) sectionsScore += 5;

  const coreHidden = (['summary', 'experience', 'education', 'skills'] as const).some(
    (id) => !visibleSet.has(id),
  );
  if (coreHidden) {
    checks.push({
      id: 'hidden-core',
      status: 'warn',
      category: 'sections',
      titleAr: 'أحد الأقسام الأساسية مخفي حالياً',
      titleEn: 'One or more core sections are currently hidden',
      detailAr: 'إظهار الملخص والخبرات والتعليم والمهارات يساعد أنظمة الفرز على تصنيفك.',
      detailEn: 'Showing Summary, Experience, Education, and Skills improves ATS indexing.',
      fixKind: 'show-core-sections',
      fixLabelAr: 'إظهار الأقسام الأساسية',
      fixLabelEn: 'Show all core sections',
    });
  } else if (sectionsScore >= 18) {
    checks.push({
      id: 'sections-complete',
      status: 'pass',
      category: 'sections',
      titleAr: 'جميع الأقسام القياسية مكتملة ومرتبة',
      titleEn: 'All essential resume sections are populated',
      detailAr: 'تغطية متكاملة للملخص والخبرات والتعليم والمهارات.',
      detailEn: 'Balanced coverage across summary, experience, education, and skills.',
    });
  }

  // 5. Job Description Keyword Match (Max 15)
  const hasJobDescription = doc.jobDescription.trim().length >= 20;
  const jdKeywords = hasJobDescription ? extractJobKeywords(doc.jobDescription, 16) : [];
  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];

  for (const kw of jdKeywords) {
    const normKw = normalizeToken(kw);
    const strippedKw = normKw.startsWith('ال') && normKw.length > 4 ? normKw.slice(2) : normKw;
    if (corpusSet.has(strippedKw) || rawLowerCorpus.includes(normKw)) {
      matchedKeywords.push(kw);
    } else {
      missingKeywords.push(kw);
    }
  }

  let keywordScore = 0;
  if (hasJobDescription && jdKeywords.length > 0) {
    const ratio = matchedKeywords.length / jdKeywords.length;
    keywordScore = Math.round(ratio * 15);
    if (missingKeywords.length === 0) {
      checks.push({
        id: 'jd-match',
        status: 'pass',
        category: 'keywords',
        titleAr: 'تطابق ممتاز مع الكلمات المفتاحية للوظيفة',
        titleEn: 'Strong keyword alignment with Job Description',
        detailAr: `تم العثور على ${matchedKeywords.length} من أصل ${jdKeywords.length} كلمة مفتاحية مستهدفة.`,
        detailEn: `Matched ${matchedKeywords.length} of ${jdKeywords.length} target job keywords.`,
      });
    } else {
      checks.push({
        id: 'jd-match',
        status: ratio >= 0.6 ? 'warn' : 'fail',
        category: 'keywords',
        titleAr: `يوجد ${missingKeywords.length} كلمات مفتاحية ناقصة من وصف الوظيفة`,
        titleEn: `${missingKeywords.length} keywords from the Job Description are missing`,
        detailAr: `نسبة التطابق الحالية ${Math.round(ratio * 100)}%. أضف المهارات المتوافقة فعلياً مع خبرتك.`,
        detailEn: `Current keyword match is ${Math.round(ratio * 100)}%. Add relevant missing skills.`,
        fixKind: 'add-missing-keywords',
        fixLabelAr: 'إضافة أهم الكلمات الناقصة للمهارات',
        fixLabelEn: 'Add top missing keywords to Skills',
      });
    }
  } else {
    // Without a JD, evaluate richness of existing skill keywords (up to 15 pts)
    keywordScore = Math.min(15, Math.round((Math.min(doc.skills.length, 10) / 10) * 15));
  }

  const subScores: AtsSubScore[] = [
    { id: 'format', labelAr: 'هيكلة وتوافق ATS', labelEn: 'ATS Structure', score: formatScore, max: 25 },
    { id: 'contact', labelAr: 'اكتمال التواصل', labelEn: 'Contact Info', score: contactScore, max: 15 },
    { id: 'impact', labelAr: 'قوة الصياغة والأثر', labelEn: 'Impact & Metrics', score: impactScore, max: 25 },
    { id: 'sections', labelAr: 'تغطية الأقسام', labelEn: 'Section Coverage', score: sectionsScore, max: 20 },
    {
      id: 'keywords',
      labelAr: hasJobDescription ? 'مطابقة الوظيفة' : 'ثراء الكلمات المفتاحية',
      labelEn: hasJobDescription ? 'Job Match' : 'Keyword Richness',
      score: keywordScore,
      max: 15,
    },
  ];

  const totalScore = Math.max(0, Math.min(100, formatScore + contactScore + impactScore + sectionsScore + keywordScore));
  const grade: AtsReport['grade'] =
    totalScore >= 85 ? 'excellent' : totalScore >= 70 ? 'good' : totalScore >= 50 ? 'fair' : 'needs-work';

  return {
    totalScore,
    grade,
    subScores,
    checks,
    matchedKeywords,
    missingKeywords,
    hasJobDescription,
  };
}

export function applyInstantAtsFix(doc: ResumeDocument, fix: AtsFixKind, missingKeywords: string[] = []): ResumeDocument {
  const isAr = doc.design.paperLang === 'ar';
  switch (fix) {
    case 'switch-ats-mode':
      return {
        ...doc,
        design: {
          ...doc.design,
          layoutMode: 'ats',
          skillDisplay: doc.design.skillDisplay === 'bars' ? 'comma' : doc.design.skillDisplay,
        },
      };
    case 'hide-photo':
      return {
        ...doc,
        personal: { ...doc.personal, showPhoto: false },
      };
    case 'skills-comma':
      return {
        ...doc,
        design: { ...doc.design, skillDisplay: 'comma' },
      };
    case 'show-core-sections':
      return {
        ...doc,
        sections: doc.sections.map((s) =>
          ['summary', 'experience', 'education', 'skills'].includes(s.id) ? { ...s, visible: true } : s,
        ),
      };
    case 'add-summary-starter': {
      const role = doc.personal.jobTitle || (isAr ? 'متخصص محترف' : 'Experienced Professional');
      const starter = isAr
        ? `${role} بخبرة عملية في تطوير الحلول وتحسين جودة الأداء وتحقيق نتائج قابلة للقياس، مع التزام عالٍ بمعايير الدقة والعمل الجماعي وتسليم المشاريع في مواعيدها.`
        : `Results-driven ${role} with hands-on experience delivering scalable solutions, optimizing operational workflows, and achieving measurable business outcomes across cross-functional teams.`;
      return {
        ...doc,
        summary: doc.summary.trim() ? `${doc.summary.trim()} ${starter}` : starter,
        sections: doc.sections.map((s) => (s.id === 'summary' ? { ...s, visible: true } : s)),
      };
    }
    case 'add-measurable-bullet': {
      const bullet = isAr
        ? 'حسّنت كفاءة سير العمل وقلّصت زمن إنجاز المهام بنسبة 30% عبر أتمتة الخطوات المتكررة وتوحيد معايير الجودة.'
        : 'Improved workflow efficiency and reduced delivery turnaround time by 30% through process automation and quality standardization.';
      if (doc.experience.length > 0) {
        const [first, ...rest] = doc.experience;
        return {
          ...doc,
          experience: [{ ...first, highlights: [...first.highlights, bullet] }, ...rest],
        };
      }
      return {
        ...doc,
        experience: [
          {
            id: `exp-${Date.now()}`,
            role: doc.personal.jobTitle || (isAr ? 'أخصائي أول' : 'Senior Specialist'),
            company: isAr ? 'شركة رائدة' : 'Leading Organization',
            location: doc.personal.location || (isAr ? 'القاهرة، مصر' : 'Cairo, Egypt'),
            startDate: '2023',
            endDate: '',
            current: true,
            highlights: [bullet],
          },
        ],
      };
    }
    case 'add-missing-keywords': {
      const existing = new Set(doc.skills.map((s) => s.name.toLowerCase()));
      const additions = missingKeywords
        .slice(0, 6)
        .filter((kw) => !existing.has(kw.toLowerCase()))
        .map((kw, idx) => ({
          id: `sk-jd-${Date.now()}-${idx}`,
          name: kw,
          level: 4,
        }));
      return {
        ...doc,
        skills: [...doc.skills, ...additions],
        sections: doc.sections.map((s) => (s.id === 'skills' ? { ...s, visible: true } : s)),
      };
    }
  }
}
