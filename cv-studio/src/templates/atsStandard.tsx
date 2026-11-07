import { formatPageNumber } from '../core/i18n';
import {
  collectContacts,
  InlineEditableText,
  InteractiveBlock,
  RenderTemplateSection,
  type TemplateModule,
} from './TemplateBlockHelpers';
import { SAMPLE_AR_TECH, SAMPLE_EN_TECH } from './sharedSamples';

export const atsStandardTemplate: TemplateModule = {
  preset: {
    id: 'ats-standard',
    visualStyle: 'ats-classic',
    category: 'ats',
    nameAr: 'المعيار القياسي للـ ATS',
    nameEn: 'ATS Gold Standard',
    descAr:
      'ترويسة متمركزة وعمود واحد نقي بخطوط فاصلة ممتدة بدون أي أعمدة جانبية أو زخارف لضمان قراءة آلية بنسبة 100%.',
    descEn:
      'Centered typographic masthead and pure single-column hierarchy with crisp full-width rules for 100% ATS parsing.',
    badgeAr: 'توافق ATS 100%',
    badgeEn: '100% ATS Safe',
    structureTagAr: 'عمود واحد متمركز',
    structureTagEn: 'Centered Single-Col',
    design: {
      templateId: 'ats-standard',
      visualStyle: 'ats-classic',
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
    const ink = accent || '#111827';

    return (
      <article
        key={page.pageNumber}
        data-cv-sheet
        data-template-style="ats-classic"
        dir={doc.design.paperDir}
        lang={doc.design.paperLang}
        className="cv-paper-sheet cvp-tpl-ats-classic"
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
            label={doc.design.paperLang === 'ar' ? 'ترويسة الاسم والتواصل' : 'Header & Contacts'}
            doc={doc}
            canvas={canvas}
          >
            <header className="cvp-ats-centered-head" style={{ borderBottomColor: ink }}>
              <InlineEditableText
                tag="h1"
                style={{ color: ink }}
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
                <div className="cvp-ats-contact-rule">
                  {contacts.map((c, i) => (
                    <span key={i}>
                      {i > 0 && <em aria-hidden="true"> | </em>}
                      <bdi>{c}</bdi>
                    </span>
                  ))}
                </div>
              )}
            </header>
          </InteractiveBlock>
        ) : (
          <header className="cvp-continuation-bar" style={{ borderBottomColor: `${ink}30` }}>
            <span>{doc.personal.fullName}</span>
            <span>{formatPageNumber(page.pageNumber, totalPages, doc.design.paperLang)}</span>
          </header>
        )}

        <div className="cvp-body-flow">
          {page.blocks.map((b, idx) => (
            <RenderTemplateSection
              key={`${b.kind}-${b.customGroupId || idx}`}
              doc={doc}
              block={b}
              accent={ink}
              headingVariant="ats-line"
              entryLayout="standard"
              isAts
              canvas={canvas}
            />
          ))}
        </div>

        {totalPages > 1 && (
          <footer className="cvp-sheet-footer">
            <span>{doc.personal.fullName}</span>
            <span>{formatPageNumber(page.pageNumber, totalPages, doc.design.paperLang)}</span>
          </footer>
        )}

        {renderCanvasOverlay?.()}
      </article>
    );
  },

  renderMiniPreview({ sample, accent, paperDir }) {
    const ink = accent || '#111827';
    return (
      <div className="cvt-mini-paper mini-ats-classic" dir={paperDir}>
        <div className="mini-ats-head" style={{ borderBottomColor: ink }}>
          <strong style={{ color: ink }}>{sample.personal.fullName}</strong>
          <span>{sample.personal.jobTitle}</span>
          <small>email • phone • location</small>
        </div>
        <div className="cvt-mini-body">
          <div className="mini-rule-title" style={{ borderBottomColor: `${ink}55`, color: ink }}>
            SUMMARY
          </div>
          <div className="cvt-mini-lines">
            <i style={{ width: '96%' }} />
            <i style={{ width: '88%' }} />
          </div>
          <div className="mini-rule-title" style={{ borderBottomColor: `${ink}55`, color: ink }}>
            EXPERIENCE
          </div>
          <div className="cvt-mini-lines">
            <i style={{ width: '92%', background: '#cbd5e1' }} />
            <i style={{ width: '95%' }} />
            <i style={{ width: '84%' }} />
            <i style={{ width: '90%' }} />
          </div>
          <div className="mini-rule-title" style={{ borderBottomColor: `${ink}55`, color: ink }}>
            SKILLS
          </div>
          <p className="mini-comma-skills">TypeScript • React • Node.js • SQL • Docker</p>
        </div>
      </div>
    );
  },
};
