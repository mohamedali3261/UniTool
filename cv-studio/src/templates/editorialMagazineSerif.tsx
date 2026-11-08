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
import { SAMPLE_AR_EXEC, SAMPLE_EN_TECH } from './sharedSamples';

const EDITORIAL_SIDE_KINDS: CoreSectionId[] = ['education', 'skills', 'languages', 'certifications'];

export const editorialMagazineSerifTemplate: TemplateModule = {
  preset: {
    id: 'editorial-magazine-serif',
    visualStyle: 'editorial-magazine',
    category: 'creative',
    nameAr: 'المجلة التحريرية — التصميم الصحفي الرفيع',
    nameEn: 'Editorial Magazine & Pull-Quote',
    descAr:
      'ترويسة صحفية كبيرة الحجم مع اقتباس بارز للملخص المهني، وتقسيم تحريري غير متماثل يبرز السرد المهني بأناقة مطبعية.',
    descEn:
      'Magazine-inspired masthead with an editorial pull-quote summary box and an asymmetric two-column typographic layout.',
    badgeAr: 'طابع تحريري',
    badgeEn: 'Editorial Print',
    structureTagAr: 'ترويسة صحفية + اقتباس + عمودين',
    structureTagEn: 'Masthead + Pull-Quote + 2-Col',
    design: {
      templateId: 'editorial-magazine-serif',
      visualStyle: 'editorial-magazine',
      layoutMode: 'one-page',
      modernVariant: 'banner',
      sectionDivider: 'line',
      paperLang: 'ar',
      paperDir: 'rtl',
      paperSize: 'a4',
      fontFamily: 'amiri',
      fontScale: 0.96,
      lineHeight: 1.44,
      marginMm: 13,
      accentColor: '#9f1239',
      skillDisplay: 'dots',
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
    const hasSummaryInPage = page.blocks.some((b) => b.kind === 'summary') && doc.summary.trim().length > 0;
    const bodyBlocks = page.blocks.filter((b) => b.kind !== 'summary');
    const sideBlocks = bodyBlocks.filter((b) => EDITORIAL_SIDE_KINDS.includes(b.kind));
    const mainBlocks = bodyBlocks.filter((b) => !EDITORIAL_SIDE_KINDS.includes(b.kind));

    return (
      <article
        key={page.pageNumber}
        data-cv-sheet
        data-template-style="editorial-magazine"
        dir={doc.design.paperDir}
        lang={doc.design.paperLang}
        className="cv-paper-sheet cvp-tpl-editorial"
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
            label={doc.design.paperLang === 'ar' ? 'ترويسة المجلة التحريرية' : 'Editorial Masthead'}
            doc={doc}
            canvas={canvas}
          >
            <header className="cvp-editorial-masthead" style={{ borderBottomColor: '#111827' }}>
              <div className="cvp-editorial-top">
                <div className="cvp-header-copy">
                  <InlineEditableText
                    tag="h1"
                    style={{ color: '#111827' }}
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
                      className="cvp-editorial-subtitle"
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
                <InteractiveProfilePhoto doc={doc} accent={accent} sizePx={76} canvas={canvas} />
              </div>

              {contacts.length > 0 && (
                <div className="cvp-editorial-dateline">
                  {contacts.map((c, idx) => (
                    <span key={idx}>
                      {idx > 0 && <em aria-hidden="true"> · </em>}
                      <bdi>{c}</bdi>
                    </span>
                  ))}
                </div>
              )}
            </header>
          </InteractiveBlock>
        ) : (
          <header className="cvp-continuation-bar">
            <span>{doc.personal.fullName}</span>
            <span>{formatPageNumber(page.pageNumber, totalPages, doc.design.paperLang)}</span>
          </header>
        )}

        {hasSummaryInPage && (
          <InteractiveBlock
            blockKey="summary"
            label={doc.design.paperLang === 'ar' ? 'اقتباس الملخص المهني' : 'Editorial Pull-Quote'}
            doc={doc}
            canvas={canvas}
          >
            <blockquote
              className="cvp-editorial-pullquote"
              style={{ borderInlineStartColor: accent, backgroundColor: `${accent}08` }}
            >
              <span className="cvp-quote-mark" style={{ color: accent }} aria-hidden="true">
                ❝
              </span>
              <InlineEditableText
                tag="p"
                multiline
                className="cvp-summary-text"
                value={doc.summary}
                canvas={canvas}
                onCommit={(val) => canvas?.onUpdateDoc((prev) => ({ ...prev, summary: val }))}
              />
            </blockquote>
          </InteractiveBlock>
        )}

        {sideBlocks.length > 0 && mainBlocks.length > 0 ? (
          <div className="cvp-editorial-columns">
            <div className="cvp-editorial-main">
              {mainBlocks.map((b, idx) => (
                <RenderTemplateSection
                  key={`${b.kind}-${b.customGroupId || idx}`}
                  doc={doc}
                  block={b}
                  accent={accent}
                  headingVariant="nordic-minimal"
                  entryLayout="standard"
                  canvas={canvas}
                />
              ))}
            </div>
            <aside className="cvp-editorial-aside">
              {sideBlocks.map((b, idx) => (
                <RenderTemplateSection
                  key={`${b.kind}-${idx}`}
                  doc={doc}
                  block={b}
                  accent={accent}
                  headingVariant="nordic-minimal"
                  entryLayout="standard"
                  canvas={canvas}
                />
              ))}
            </aside>
          </div>
        ) : (
          <div className="cvp-body-flow">
            {[...mainBlocks, ...sideBlocks].map((b, idx) => (
              <RenderTemplateSection
                key={`${b.kind}-${b.customGroupId || idx}`}
                doc={doc}
                block={b}
                accent={accent}
                headingVariant="nordic-minimal"
                entryLayout="standard"
                canvas={canvas}
              />
            ))}
          </div>
        )}

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
      <div className="cvt-mini-paper mini-editorial" dir={paperDir}>
        <div className="mini-edit-mast">
          <strong>{sample.personal.fullName}</strong>
          <span style={{ color: accent }}>{sample.personal.jobTitle}</span>
        </div>
        <div className="mini-edit-quote" style={{ borderInlineStartColor: accent, backgroundColor: `${accent}0d` }}>
          <b style={{ color: accent }}>❝</b>
          <div className="cvt-mini-lines" style={{ flex: 1 }}>
            <i style={{ width: '95%' }} />
            <i style={{ width: '82%' }} />
          </div>
        </div>
        <div className="mini-tech-cols">
          <div className="mini-tech-left">
            <small style={{ color: accent }}>EXPERIENCE</small>
            <div className="cvt-mini-lines">
              <i style={{ width: '95%' }} />
              <i style={{ width: '85%' }} />
              <i style={{ width: '90%' }} />
            </div>
          </div>
          <div className="mini-tech-right">
            <small style={{ color: accent }}>SKILLS</small>
            <div className="cvt-mini-lines">
              <i style={{ width: '85%' }} />
              <i style={{ width: '75%' }} />
            </div>
          </div>
        </div>
      </div>
    );
  },
};
