import { formatPageNumber } from '../core/i18n';
import {
  collectContacts,
  InlineEditableText,
  InteractiveBlock,
  InteractiveProfilePhoto,
  RenderTemplateSection,
  type TemplateModule,
} from './TemplateBlockHelpers';
import { SAMPLE_AR_EXEC, SAMPLE_EN_TECH } from './sharedSamples';

export const royalGoldExecutiveTemplate: TemplateModule = {
  preset: {
    id: 'royal-gold-executive',
    visualStyle: 'royal-split-header',
    category: 'executive',
    nameAr: 'القيادي الفاخر — الترويسة الملكية والخط الذهبي',
    nameEn: 'Royal Gold Executive Crest',
    descAr:
      'ترويسة تنفيذية كحلية داكنة محاطة بإطار ذهبي مزدوج، مع شريط تواصل أفقي أنيق وفواصل ماسية فخمة للمناصب القيادية.',
    descEn:
      'Deep obsidian-navy executive crest framed with warm gold double trim, metallic diamond section headers, and board-level polish.',
    badgeAr: 'فخامة تنفيذية',
    badgeEn: 'Boardroom Luxury',
    structureTagAr: 'ترويسة كحلية + إطار ذهبي',
    structureTagEn: 'Navy Crest + Gold Trim',
    design: {
      templateId: 'royal-gold-executive',
      visualStyle: 'royal-split-header',
      layoutMode: 'modern',
      modernVariant: 'banner',
      sectionDivider: 'line',
      paperLang: 'ar',
      paperDir: 'rtl',
      paperSize: 'a4',
      fontFamily: 'cairo',
      fontScale: 1,
      lineHeight: 1.48,
      marginMm: 15,
      accentColor: '#b45309',
      skillDisplay: 'badges',
      pageFrame: 'classic-border',
    },
    sampleAr: SAMPLE_AR_EXEC,
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
        data-template-style="royal-split-header"
        dir={doc.design.paperDir}
        lang={doc.design.paperLang}
        className="cv-paper-sheet cvp-tpl-royal-gold"
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
            label={doc.design.paperLang === 'ar' ? 'الترويسة القيادية الفاخرة' : 'Royal Executive Header'}
            doc={doc}
            canvas={canvas}
          >
            <header
              className="cvp-royal-crest"
              style={{
                backgroundColor: '#0f172a',
                border: `2px solid ${accent}`,
              }}
            >
              <div className="cvp-royal-inner" style={{ borderColor: `${accent}66` }}>
                <div className="cvp-royal-main">
                  <div className="cvp-royal-copy">
                    <span className="cvp-royal-kicker" style={{ color: '#fbbf24' }}>
                      {doc.design.paperLang === 'ar' ? 'ملف قيادي تنفيذي' : 'EXECUTIVE LEADERSHIP PROFILE'}
                    </span>
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
                        className="cvp-royal-role"
                        style={{ color: '#fcd34d' }}
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
                  <InteractiveProfilePhoto doc={doc} accent="#fbbf24" sizePx={82} canvas={canvas} />
                </div>

                {contacts.length > 0 && (
                  <div className="cvp-royal-ribbon" style={{ borderTopColor: `${accent}66` }}>
                    {contacts.map((c, idx) => (
                      <span key={idx}>
                        <i style={{ backgroundColor: '#fbbf24' }} aria-hidden="true" />
                        <bdi>{c}</bdi>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </header>
          </InteractiveBlock>
        ) : (
          <header className="cvp-continuation-bar" style={{ borderBottomColor: `${accent}44` }}>
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
              headingVariant="royal-gold"
              entryLayout="standard"
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
      <div className="cvt-mini-paper mini-royal-gold" dir={paperDir}>
        <div className="mini-royal-box" style={{ backgroundColor: '#0f172a', borderColor: accent }}>
          <em style={{ color: '#fbbf24' }}>EXECUTIVE</em>
          <strong>{sample.personal.fullName}</strong>
          <span style={{ color: '#fde68a' }}>{sample.personal.jobTitle}</span>
        </div>
        <div className="cvt-mini-body">
          <div className="mini-royal-sec">
            <u style={{ backgroundColor: accent }} />
            <small>LEADERSHIP</small>
          </div>
          <div className="cvt-mini-lines">
            <i style={{ width: '96%' }} />
            <i style={{ width: '88%' }} />
            <i style={{ width: '92%' }} />
          </div>
          <div className="mini-royal-sec">
            <u style={{ backgroundColor: accent }} />
            <small>ACHIEVEMENTS</small>
          </div>
          <div className="cvt-mini-lines">
            <i style={{ width: '90%' }} />
            <i style={{ width: '78%' }} />
          </div>
        </div>
      </div>
    );
  },
};
