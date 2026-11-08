import { formatPageNumber } from '../core/i18n';
import type { CoreSectionId } from '../core/types';
import {
  collectContacts,
  InlineEditableText,
  InteractiveBlock,
  InteractiveProfilePhoto,
  RenderTemplateSection,
  type TemplateModule,
} from './TemplateBlockHelpers';
import { SAMPLE_AR_TECH, SAMPLE_EN_TECH } from './sharedSamples';

const COMPACT_BENTO_HALF: CoreSectionId[] = ['skills', 'education', 'certifications', 'languages'];

export const compactStartupGridTemplate: TemplateModule = {
  preset: {
    id: 'compact-startup-grid',
    visualStyle: 'bento-modular-cards',
    category: 'tech',
    nameAr: 'بطاقات Bento العصرية — شركات التقنية والمنتجات',
    nameEn: 'Modern Bento Modular Grid',
    descAr:
      'شبكة بطاقات Bento مستديرة تفصل كل قسم داخل بلاطة مستقلة أنيقة بظلال ناعمة، مثالية لمصممي المنتجات ومطوري الستارت أب.',
    descEn:
      'Modular Bento-box grid placing identity, experience, skills, and credentials inside clean rounded tiles.',
    badgeAr: 'شبكة Bento حديثة',
    badgeEn: 'Bento Grid',
    structureTagAr: 'شبكة بطاقات Bento معيارية',
    structureTagEn: 'Modular Bento Tiles',
    design: {
      templateId: 'compact-startup-grid',
      visualStyle: 'bento-modular-cards',
      layoutMode: 'one-page',
      modernVariant: 'banner',
      sectionDivider: 'soft-bg',
      paperLang: 'ar',
      paperDir: 'rtl',
      paperSize: 'a4',
      fontFamily: 'cairo',
      fontScale: 0.96,
      lineHeight: 1.44,
      marginMm: 12,
      accentColor: '#059669',
      skillDisplay: 'badges',
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
    const fullWidthBlocks = page.blocks.filter((b) => !COMPACT_BENTO_HALF.includes(b.kind));
    const halfWidthBlocks = page.blocks.filter((b) => COMPACT_BENTO_HALF.includes(b.kind));

    return (
      <article
        key={page.pageNumber}
        data-cv-sheet
        data-template-style="bento-modular-cards"
        dir={doc.design.paperDir}
        lang={doc.design.paperLang}
        className="cv-paper-sheet cvp-tpl-bento"
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
            label={doc.design.paperLang === 'ar' ? 'بطاقة الهوية Bento' : 'Bento Identity Tile'}
            doc={doc}
            canvas={canvas}
          >
            <header
              className="cvp-bento-hero-tile"
              style={{
                backgroundColor: `${accent}10`,
                borderColor: `${accent}35`,
              }}
            >
              <div className="cvp-header-row">
                <div className="cvp-header-copy">
                  <InlineEditableText
                    tag="h1"
                    style={{ color: '#064e3b' }}
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
                  {contacts.length > 0 && (
                    <div className="cvp-bento-chips">
                      {contacts.map((c, idx) => (
                        <span key={idx} className="cvp-bento-contact-chip">
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
          <header className="cvp-continuation-bar">
            <span>{doc.personal.fullName}</span>
            <span>{formatPageNumber(page.pageNumber, totalPages, doc.design.paperLang)}</span>
          </header>
        )}

        <div className="cvp-bento-stack">
          {fullWidthBlocks.map((b, idx) => (
            <div key={`${b.kind}-${b.customGroupId || idx}`} className="cvp-bento-tile">
              <RenderTemplateSection
                doc={doc}
                block={b}
                accent={accent}
                headingVariant="bento-header"
                entryLayout="standard"
                canvas={canvas}
              />
            </div>
          ))}

          {halfWidthBlocks.length > 0 && (
            <div className="cvp-bento-grid-2">
              {halfWidthBlocks.map((b, idx) => (
                <div key={`${b.kind}-${idx}`} className="cvp-bento-tile">
                  <RenderTemplateSection
                    doc={doc}
                    block={b}
                    accent={accent}
                    headingVariant="bento-header"
                    entryLayout="standard"
                    canvas={canvas}
                  />
                </div>
              ))}
            </div>
          )}
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
      <div className="cvt-mini-paper mini-bento" dir={paperDir}>
        <div className="mini-bento-hero" style={{ backgroundColor: `${accent}14`, borderColor: `${accent}44` }}>
          <strong>{sample.personal.fullName}</strong>
          <span style={{ color: accent }}>{sample.personal.jobTitle}</span>
        </div>
        <div className="mini-bento-wide">
          <small style={{ color: accent }}>● EXPERIENCE</small>
          <div className="cvt-mini-lines">
            <i style={{ width: '94%' }} />
            <i style={{ width: '82%' }} />
          </div>
        </div>
        <div className="mini-bento-pair">
          <div className="mini-bento-cell">
            <small style={{ color: accent }}>● SKILLS</small>
            <div className="mini-pill-wrap">
              <b>React</b>
              <b>TS</b>
              <b>AI</b>
            </div>
          </div>
          <div className="mini-bento-cell">
            <small style={{ color: accent }}>● EDU</small>
            <div className="cvt-mini-lines">
              <i style={{ width: '88%' }} />
              <i style={{ width: '70%' }} />
            </div>
          </div>
        </div>
      </div>
    );
  },
};
