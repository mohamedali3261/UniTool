import { formatPageNumber } from '../core/i18n';
import {
  collectContacts,
  InlineEditableText,
  InteractiveBlock,
  InteractiveProfilePhoto,
  RenderTemplateSection,
  type TemplateModule,
} from './TemplateBlockHelpers';
import { SAMPLE_AR_MEDICAL, SAMPLE_EN_TECH } from './sharedSamples';

export const medicalClinicalCleanTemplate: TemplateModule = {
  preset: {
    id: 'medical-clinical-clean',
    visualStyle: 'clinical-structured-grid',
    category: 'medical',
    nameAr: 'السيرة الطبية والإكلينيكية المعتمدة',
    nameEn: 'Medical & Clinical Board CV',
    descAr:
      'مصمم للأطباء والصيادلة والتمريض والرعاية الصحية: بطاقة اعتماد علوية منظمة، عناوين كبسولية واضحة، وتنسيق دقيق للزمالات والتراخيص.',
    descEn:
      'Tailored for physicians, pharmacists & clinicians: structured credential masthead, solid pill banners, and clean rotation/fellowship tables.',
    badgeAr: 'طب ورعاية صحية',
    badgeEn: 'Healthcare & MD',
    structureTagAr: 'بطاقة ترخيص طبي + شرائط أقسام',
    structureTagEn: 'Clinical Card + Pill Headers',
    design: {
      templateId: 'medical-clinical-clean',
      visualStyle: 'clinical-structured-grid',
      layoutMode: 'detailed',
      modernVariant: 'banner',
      sectionDivider: 'soft-bg',
      paperLang: 'ar',
      paperDir: 'rtl',
      paperSize: 'a4',
      fontFamily: 'cairo',
      fontScale: 0.99,
      lineHeight: 1.48,
      marginMm: 15,
      accentColor: '#0369a1',
      skillDisplay: 'bullets',
    },
    sampleAr: SAMPLE_AR_MEDICAL,
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

    return (
      <article
        key={page.pageNumber}
        data-cv-sheet
        data-template-style="clinical-structured-grid"
        dir={doc.design.paperDir}
        lang={doc.design.paperLang}
        className="cv-paper-sheet cvp-tpl-clinical"
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
            label={doc.design.paperLang === 'ar' ? 'بطاقة الاعتماد الطبي' : 'Clinical Credential Header'}
            doc={doc}
            canvas={canvas}
          >
            <header
              className="cvp-clinical-card"
              style={{
                borderColor: `${accent}55`,
                borderTopColor: accent,
                backgroundColor: `${accent}08`,
              }}
            >
              <div className="cvp-clinical-top">
                <div className="cvp-clinical-badge" style={{ backgroundColor: accent }} aria-hidden="true">
                  +
                </div>
                <div className="cvp-header-copy">
                  <InlineEditableText
                    tag="h1"
                    style={{ color: '#0c4a6e' }}
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
                      style={{ color: accent }}
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
                </div>
                <InteractiveProfilePhoto doc={doc} accent={accent} sizePx={78} canvas={canvas} />
              </div>

              {contacts.length > 0 && (
                <div className="cvp-clinical-contacts" style={{ borderTopColor: `${accent}26` }}>
                  {contacts.map((c, idx) => (
                    <span key={idx}>
                      <bdi>{c}</bdi>
                    </span>
                  ))}
                </div>
              )}
            </header>
          </InteractiveBlock>
        ) : (
          <header className="cvp-continuation-bar" style={{ borderBottomColor: `${accent}35` }}>
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
              accent={accent}
              headingVariant="clinical-badge"
              entryLayout="hanging-date"
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
    return (
      <div className="cvt-mini-paper mini-clinical" dir={paperDir}>
        <div className="mini-clinical-head" style={{ borderTopColor: accent, backgroundColor: `${accent}0d` }}>
          <b className="mini-clinical-plus" style={{ backgroundColor: accent }}>+</b>
          <div>
            <strong>{sample.personal.fullName}</strong>
            <span style={{ color: accent }}>{sample.personal.jobTitle}</span>
          </div>
        </div>
        <div className="cvt-mini-body">
          <div className="mini-clinical-pill" style={{ backgroundColor: accent }}>
            CLINICAL ROTATIONS
          </div>
          <div className="mini-hanging-row">
            <small>2020–Now</small>
            <div className="cvt-mini-lines">
              <i style={{ width: '94%' }} />
              <i style={{ width: '80%' }} />
            </div>
          </div>
          <div className="mini-clinical-pill" style={{ backgroundColor: accent }}>
            FELLOWSHIPS & BOARD
          </div>
          <div className="mini-hanging-row">
            <small>MRCP</small>
            <div className="cvt-mini-lines">
              <i style={{ width: '88%' }} />
            </div>
          </div>
        </div>
      </div>
    );
  },
};
