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

export const modernBannerCreativeTemplate: TemplateModule = {
  preset: {
    id: 'modern-banner-creative',
    visualStyle: 'creative-banner-timeline',
    category: 'creative',
    nameAr: 'ترويسة البانر والمسار الزمني',
    nameEn: 'Editorial Banner & Timeline',
    descAr:
      'ترويسة علوية ملونة كاملة العرض بتباين أنيق، مع مسار زمني متصل بنقاط إبراز للخبرات وأشرطة مهارات بصرية.',
    descEn:
      'Full-bleed colored banner header with crisp light contrast, connected timeline nodes, and visual skill progress bars.',
    badgeAr: 'ترويسة + تايم لاين',
    badgeEn: 'Banner + Timeline',
    structureTagAr: 'بانر ملون + مسار زمني',
    structureTagEn: 'Full Banner + Timeline',
    design: {
      templateId: 'modern-banner-creative',
      visualStyle: 'creative-banner-timeline',
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
        data-template-style="creative-banner-timeline"
        dir={doc.design.paperDir}
        lang={doc.design.paperLang}
        className="cv-paper-sheet cvp-tpl-banner-timeline"
        style={{
          ...sheetStyle,
          padding: `0 0 ${effectiveMarginMm}mm 0`,
        }}
        onPointerDown={() => canvas?.interactive && canvas.onSelect(null)}
      >
        {renderCanvasUnderlay?.()}

        {page.includeHeader ? (
          <InteractiveBlock
            blockKey="header"
            label={doc.design.paperLang === 'ar' ? 'بانر الهوية العلوي' : 'Editorial Banner'}
            doc={doc}
            canvas={canvas}
          >
            <header
              className="cvp-solid-banner-header"
              style={{
                backgroundColor: accent,
                color: '#ffffff',
                padding: `${effectiveMarginMm}mm ${effectiveMarginMm}mm 18px`,
                marginBottom: '16px',
              }}
            >
              <div className="cvp-header-row">
                <div className="cvp-header-copy">
                  <InlineEditableText
                    tag="h1"
                    style={{ color: '#ffffff' }}
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
                      className="cvp-banner-subtitle"
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
                    <div className="cvp-banner-contacts">
                      {contacts.map((c, i) => (
                        <span key={i}>
                          {i > 0 && <em aria-hidden="true"> • </em>}
                          <bdi>{c}</bdi>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <InteractiveProfilePhoto doc={doc} accent="#ffffff" sizePx={82} canvas={canvas} />
              </div>
            </header>
          </InteractiveBlock>
        ) : (
          <header
            className="cvp-continuation-bar"
            style={{
              borderBottomColor: `${accent}30`,
              margin: `12px ${effectiveMarginMm}mm`,
            }}
          >
            <span>{doc.personal.fullName}</span>
            <span>{formatPageNumber(page.pageNumber, totalPages, doc.design.paperLang)}</span>
          </header>
        )}

        <div className="cvp-body-flow" style={{ paddingInline: `${effectiveMarginMm}mm` }}>
          {page.blocks.map((b, idx) => (
            <RenderTemplateSection
              key={`${b.kind}-${b.customGroupId || idx}`}
              doc={doc}
              block={b}
              accent={accent}
              headingVariant="soft-pill"
              entryLayout="timeline"
              canvas={canvas}
            />
          ))}
        </div>

        {totalPages > 1 && (
          <footer className="cvp-sheet-footer" style={{ paddingInline: `${effectiveMarginMm}mm` }}>
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
      <div className="cvt-mini-paper mini-banner-timeline" dir={paperDir}>
        <div className="mini-solid-banner" style={{ backgroundColor: accent }}>
          <div>
            <strong>{sample.personal.fullName}</strong>
            <span>{sample.personal.jobTitle}</span>
          </div>
          <i className="mini-banner-ring" />
        </div>
        <div className="cvt-mini-body">
          <div className="mini-soft-band" style={{ backgroundColor: `${accent}16`, color: accent }}>
            TIMELINE EXPERIENCE
          </div>
          <div className="mini-timeline-list" style={{ borderInlineStartColor: `${accent}44` }}>
            <div className="mini-tl-item">
              <u style={{ backgroundColor: accent }} />
              <div className="cvt-mini-lines" style={{ flex: 1 }}>
                <i style={{ width: '92%' }} />
                <i style={{ width: '80%' }} />
              </div>
            </div>
            <div className="mini-tl-item">
              <u style={{ backgroundColor: accent }} />
              <div className="cvt-mini-lines" style={{ flex: 1 }}>
                <i style={{ width: '88%' }} />
                <i style={{ width: '74%' }} />
              </div>
            </div>
          </div>
          <div className="mini-bars-preview">
            <div>
              <span style={{ width: '90%', backgroundColor: accent }} />
            </div>
            <div>
              <span style={{ width: '78%', backgroundColor: accent }} />
            </div>
          </div>
        </div>
      </div>
    );
  },
};
