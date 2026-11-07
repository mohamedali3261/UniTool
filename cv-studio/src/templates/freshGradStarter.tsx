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

export const freshGradStarterTemplate: TemplateModule = {
  preset: {
    id: 'fresh-grad-starter',
    visualStyle: 'fresh-grad-cards',
    category: 'fresh-grad',
    nameAr: 'انطلاقة الخريجين — بطاقات المشاريع',
    nameEn: 'Fresh Grad Showcase Cards',
    descAr:
      'بطاقة تعريف علوية مستديرة تدمج النبذة الشخصية، مع شبكة بطاقات مؤطرة تضع التعليم والمشاريع التطبيقية في الصدارة.',
    descEn:
      'Rounded spotlight hero card with integrated summary box and 2-column project/education showcase cards.',
    badgeAr: 'حديث التخرج',
    badgeEn: 'Card Showcase',
    structureTagAr: 'بطاقة علوية + بطاقات مشاريع',
    structureTagEn: 'Hero Box + Project Cards',
    design: {
      templateId: 'fresh-grad-starter',
      visualStyle: 'fresh-grad-cards',
      layoutMode: 'one-page',
      modernVariant: 'banner',
      sectionDivider: 'accent-bar',
      paperLang: 'ar',
      paperDir: 'rtl',
      paperSize: 'a4',
      fontFamily: 'tajawal',
      fontScale: 0.99,
      lineHeight: 1.44,
      marginMm: 14,
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
    const hasSummaryBlock = page.blocks.some((b) => b.kind === 'summary');
    const otherBlocks = page.blocks.filter((b) => b.kind !== 'summary');

    return (
      <article
        key={page.pageNumber}
        data-cv-sheet
        data-template-style="fresh-grad-cards"
        dir={doc.design.paperDir}
        lang={doc.design.paperLang}
        className="cv-paper-sheet cvp-tpl-fresh-cards"
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
            label={doc.design.paperLang === 'ar' ? 'بطاقة التعريف والملخص' : 'Hero Spotlight Card'}
            doc={doc}
            canvas={canvas}
          >
            <header
              className="cvp-fresh-hero-card"
              style={{
                backgroundColor: `${accent}0f`,
                borderColor: `${accent}35`,
              }}
            >
              <div className="cvp-header-row">
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
                          {i > 0 && <em aria-hidden="true"> • </em>}
                          <bdi>{c}</bdi>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <InteractiveProfilePhoto doc={doc} accent={accent} sizePx={78} canvas={canvas} />
              </div>

              {hasSummaryBlock && doc.summary.trim() && (
                <div className="cvp-fresh-summary-spotlight" style={{ borderColor: `${accent}26` }}>
                  <InlineEditableText
                    tag="p"
                    multiline
                    className="cvp-summary-text"
                    value={doc.summary}
                    canvas={canvas}
                    onCommit={(val) => canvas?.onUpdateDoc((prev) => ({ ...prev, summary: val }))}
                  />
                </div>
              )}
            </header>
          </InteractiveBlock>
        ) : (
          <header className="cvp-continuation-bar" style={{ borderBottomColor: `${accent}30` }}>
            <span>{doc.personal.fullName}</span>
            <span>{formatPageNumber(page.pageNumber, totalPages, doc.design.paperLang)}</span>
          </header>
        )}

        <div className="cvp-body-flow">
          {otherBlocks.map((b, idx) => (
            <RenderTemplateSection
              key={`${b.kind}-${b.customGroupId || idx}`}
              doc={doc}
              block={b}
              accent={accent}
              headingVariant="accent-bar"
              entryLayout="cards"
              skillChipVariant="outline"
              canvas={canvas}
            />
          ))}
        </div>

        {renderCanvasOverlay?.()}
      </article>
    );
  },

  renderMiniPreview({ sample, accent, paperDir }) {
    return (
      <div className="cvt-mini-paper mini-fresh-cards" dir={paperDir}>
        <div
          className="mini-fresh-hero"
          style={{ backgroundColor: `${accent}14`, borderColor: `${accent}38` }}
        >
          <strong style={{ color: accent }}>{sample.personal.fullName}</strong>
          <span>{sample.personal.jobTitle}</span>
          <div className="mini-fresh-summary-box">
            <i style={{ width: '92%' }} />
            <i style={{ width: '76%' }} />
          </div>
        </div>
        <div className="cvt-mini-body" style={{ paddingTop: 6 }}>
          <div className="mini-bar-heading" style={{ color: accent }}>
            <em style={{ background: accent }} />
            <small>EDUCATION & PROJECTS</small>
          </div>
          <div className="mini-cards-2col">
            <div className="mini-card-box" style={{ borderColor: `${accent}33` }}>
              <b style={{ color: accent }}>B.Sc. CS</b>
              <i />
              <i style={{ width: '70%' }} />
            </div>
            <div className="mini-card-box" style={{ borderColor: `${accent}33` }}>
              <b style={{ color: accent }}>DocFlow</b>
              <i />
              <i style={{ width: '76%' }} />
            </div>
          </div>
          <div className="mini-pill-wrap">
            <b style={{ borderColor: `${accent}55`, color: accent }}>React</b>
            <b style={{ borderColor: `${accent}55`, color: accent }}>TypeScript</b>
            <b style={{ borderColor: `${accent}55`, color: accent }}>SQL</b>
          </div>
        </div>
      </div>
    );
  },
};
