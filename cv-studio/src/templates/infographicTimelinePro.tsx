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

export const infographicTimelineProTemplate: TemplateModule = {
  preset: {
    id: 'infographic-timeline-pro',
    visualStyle: 'spine-timeline-infographic',
    category: 'tech',
    nameAr: 'الإنفوغرافيك المهني — المحور الزمني المتصل',
    nameEn: 'Infographic Spine & Metrics CV',
    descAr:
      'تخطيط بصري حديث بمحور زمني رأسي يربط المحطات المهنية مع أشرطة مهارات رقمية وشريط إنجازات علوي واضح.',
    descEn:
      'Visual infographic layout featuring a connected vertical career spine, top contact capsules, and percentage skill meters.',
    badgeAr: 'مسار إنفوغرافيك',
    badgeEn: 'Visual Spine',
    structureTagAr: 'محور زمني متصل + مؤشرات مئوية',
    structureTagEn: 'Connected Spine + Skill Bars',
    design: {
      templateId: 'infographic-timeline-pro',
      visualStyle: 'spine-timeline-infographic',
      layoutMode: 'modern',
      modernVariant: 'banner',
      sectionDivider: 'accent-bar',
      paperLang: 'ar',
      paperDir: 'rtl',
      paperSize: 'a4',
      fontFamily: 'cairo',
      fontScale: 0.98,
      lineHeight: 1.46,
      marginMm: 14,
      accentColor: '#4f46e5',
      skillDisplay: 'bars',
      pageFrame: 'top-ribbon',
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

    return (
      <article
        key={page.pageNumber}
        data-cv-sheet
        data-template-style="spine-timeline-infographic"
        dir={doc.design.paperDir}
        lang={doc.design.paperLang}
        className="cv-paper-sheet cvp-tpl-infographic"
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
            label={doc.design.paperLang === 'ar' ? 'ترويسة الإنفوغرافيك' : 'Infographic Header'}
            doc={doc}
            canvas={canvas}
          >
            <header className="cvp-info-header" style={{ borderBottomColor: `${accent}30` }}>
              <div className="cvp-info-head-row">
                <div className="cvp-info-accent-block" style={{ backgroundColor: accent }} aria-hidden="true" />
                <div className="cvp-header-copy">
                  <InlineEditableText
                    tag="h1"
                    style={{ color: '#1e1b4b' }}
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
                <InteractiveProfilePhoto doc={doc} accent={accent} sizePx={80} canvas={canvas} />
              </div>

              {contacts.length > 0 && (
                <div className="cvp-info-capsules">
                  {contacts.map((c, idx) => (
                    <span
                      key={idx}
                      className="cvp-info-capsule"
                      style={{ backgroundColor: `${accent}10`, borderColor: `${accent}28`, color: '#1e293b' }}
                    >
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

        <div className="cvp-body-flow cvp-info-spine-flow" style={{ ['--spine-color' as any]: `${accent}35` }}>
          {page.blocks.map((b, idx) => (
            <RenderTemplateSection
              key={`${b.kind}-${b.customGroupId || idx}`}
              doc={doc}
              block={b}
              accent={accent}
              headingVariant="accent-bar"
              entryLayout="timeline"
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
      <div className="cvt-mini-paper mini-infographic" dir={paperDir}>
        <div className="mini-info-top" style={{ borderTop: `4px solid ${accent}` }}>
          <div className="mini-info-id">
            <span className="mini-info-pillar" style={{ backgroundColor: accent }} />
            <div>
              <strong>{sample.personal.fullName}</strong>
              <span style={{ color: accent }}>{sample.personal.jobTitle}</span>
            </div>
          </div>
          <div className="mini-pill-wrap">
            <b>Mail</b>
            <b>In</b>
            <b>Web</b>
          </div>
        </div>
        <div className="cvt-mini-body">
          <div className="mini-timeline-list" style={{ borderColor: `${accent}55` }}>
            <div className="mini-tl-item">
              <u style={{ backgroundColor: accent }} />
              <div className="cvt-mini-lines" style={{ flex: 1 }}>
                <i style={{ width: '94%' }} />
                <i style={{ width: '80%' }} />
              </div>
            </div>
            <div className="mini-tl-item">
              <u style={{ backgroundColor: accent }} />
              <div className="cvt-mini-lines" style={{ flex: 1 }}>
                <i style={{ width: '88%' }} />
                <i style={{ width: '70%' }} />
              </div>
            </div>
          </div>
          <div className="mini-bars-preview">
            <div><span style={{ width: '92%', backgroundColor: accent }} /></div>
            <div><span style={{ width: '80%', backgroundColor: accent }} /></div>
          </div>
        </div>
      </div>
    );
  },
};
