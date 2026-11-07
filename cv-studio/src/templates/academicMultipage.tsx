import { formatPageNumber } from '../core/i18n';
import {
  collectContacts,
  InlineEditableText,
  InteractiveBlock,
  InteractiveProfilePhoto,
  RenderTemplateSection,
  type TemplateModule,
} from './TemplateBlockHelpers';
import { SAMPLE_AR_TECH, SAMPLE_EN_TECH } from './sharedSamples';

export const academicMultipageTemplate: TemplateModule = {
  preset: {
    id: 'academic-multipage',
    visualStyle: 'academic-hanging',
    category: 'academic',
    nameAr: 'السيرة الأكاديمية والطبية — هامش التواريخ',
    nameEn: 'Academic & Medical Curriculum Vitae',
    descAr:
      'تصميم أكاديمي محكّم بهامش تواريخ معلق (Hanging Margin)، ترقيم للأبحاث والمؤتمرات، وترويسة وتذييل للصفحات المتعددة.',
    descEn:
      'Scholarly Curriculum Vitae with hanging outer date column, numbered research entries, and automatic multi-page headers.',
    badgeAr: 'متعدد الصفحات',
    badgeEn: 'Scholarly Multi-Page',
    structureTagAr: 'هامش تواريخ معلق + أبحاث',
    structureTagEn: 'Hanging Dates + Pubs',
    design: {
      templateId: 'academic-multipage',
      visualStyle: 'academic-hanging',
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

  renderPage({
    doc,
    page,
    totalPages,
    sheetStyle,
    effectiveMarginMm,
    accent,
    canvas,
    renderCanvasUnderlay,
    renderCanvasOverlay,
  }) {
    const contacts = collectContacts(doc);
    const isAr = doc.design.paperLang === 'ar';

    return (
      <article
        key={page.pageNumber}
        data-cv-sheet
        data-template-style="academic-hanging"
        dir={doc.design.paperDir}
        lang={doc.design.paperLang}
        className="cv-paper-sheet cvp-tpl-academic"
        style={{
          ...sheetStyle,
          padding: `${effectiveMarginMm}mm`,
        }}
        onPointerDown={() => canvas?.interactive && canvas.onSelect(null)}
      >
        {renderCanvasUnderlay?.()}

        {page.includeHeader ? (
          <InteractiveBlock
            blockKey="header"
            label={isAr ? 'الترويسة الأكاديمية' : 'Academic Masthead'}
            doc={doc}
            canvas={canvas}
          >
            <header className="cvp-academic-masthead" style={{ borderTopColor: accent, borderBottomColor: `${accent}44` }}>
              <span className="cvp-academic-kicker" style={{ color: accent }}>
                {isAr ? 'السيرة العلمية والأكاديمية · CURRICULUM VITAE' : 'CURRICULUM VITAE'}
              </span>
              <div className="cvp-header-row" style={{ alignItems: 'center' }}>
                <div className="cvp-header-copy">
                  <InlineEditableText
                    tag="h1"
                    style={{ color: accent }}
                    value={doc.personal.fullName}
                    canvas={canvas}
                    onCommit={(val) =>
                      canvas?.onUpdateDoc((prev) => ({
                        ...prev,
                        personal: { ...prev.personal, fullName: val },
                      }))
                    }
                  />
                  {doc.personal.jobTitle && (
                    <InlineEditableText
                      tag="p"
                      className="cvp-job-title"
                      value={doc.personal.jobTitle}
                      canvas={canvas}
                      onCommit={(val) =>
                        canvas?.onUpdateDoc((prev) => ({
                          ...prev,
                          personal: { ...prev.personal, jobTitle: val },
                        }))
                      }
                    />
                  )}
                  {contacts.length > 0 && (
                    <div className="cvp-inline-contacts">
                      {contacts.map((c, i) => (
                        <span key={i}>
                          {i > 0 && <em aria-hidden="true"> · </em>}
                          <bdi>{c}</bdi>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <InteractiveProfilePhoto doc={doc} accent={accent} sizePx={76} canvas={canvas} />
              </div>
            </header>
          </InteractiveBlock>
        ) : (
          <header className="cvp-continuation-bar" style={{ borderBottomColor: `${accent}40` }}>
            <span>{doc.personal.fullName} — Curriculum Vitae</span>
            <span>{formatPageNumber(page.pageNumber, totalPages, doc.design.paperLang)}</span>
          </header>
        )}

        <div className="cvp-body-flow">
          {page.blocks.map((b, idx) => (
            <RenderTemplateSection
              key={`${b.kind}-${b.customGroupId || idx}`}
              doc={doc}
              block={b}
              accent={accent}
              headingVariant="academic-caps"
              entryLayout="hanging-date"
              canvas={canvas}
            />
          ))}
        </div>

        <footer className="cvp-sheet-footer" style={{ borderTopColor: `${accent}30` }}>
          <span>{doc.personal.fullName}</span>
          <span>{formatPageNumber(page.pageNumber, totalPages, doc.design.paperLang)}</span>
        </footer>

        {renderCanvasOverlay?.()}
      </article>
    );
  },

  renderMiniPreview({ sample, accent, paperDir }) {
    return (
      <div className="cvt-mini-paper mini-academic" dir={paperDir}>
        <div className="mini-acad-head" style={{ borderTopColor: accent, borderBottomColor: `${accent}44` }}>
          <em style={{ color: accent }}>CURRICULUM VITAE</em>
          <strong style={{ color: accent }}>{sample.personal.fullName}</strong>
          <span>{sample.personal.jobTitle}</span>
        </div>
        <div className="cvt-mini-body">
          <div className="mini-rule-title" style={{ borderBottomColor: accent, color: accent }}>
            EDUCATION & RESEARCH
          </div>
          <div className="mini-hanging-row">
            <small>2020–2024</small>
            <div className="cvt-mini-lines" style={{ flex: 1 }}>
              <i style={{ width: '94%' }} />
              <i style={{ width: '80%' }} />
            </div>
          </div>
          <div className="mini-rule-title" style={{ borderBottomColor: accent, color: accent }}>
            PUBLICATIONS
          </div>
          <div className="mini-pub-row">
            <b style={{ color: accent }}>[1]</b>
            <i />
          </div>
          <div className="mini-pub-row">
            <b style={{ color: accent }}>[2]</b>
            <i />
          </div>
          <div className="mini-acad-foot">Page 1 / 2</div>
        </div>
      </div>
    );
  },
};
