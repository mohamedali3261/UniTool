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

const DARK_ASIDE_KINDS: CoreSectionId[] = ['skills', 'languages', 'certifications'];

export const creativeStudioSplitTemplate: TemplateModule = {
  preset: {
    id: 'creative-studio-split',
    visualStyle: 'creative-bold-aside',
    category: 'creative',
    nameAr: 'ستوديو التصميم — الشريط الغامق المتباين',
    nameEn: 'Dark Contrast Studio Sidebar',
    descAr:
      'عمود جانبي داكن غني يمتد بكامل الارتفاع بنصوص بيضاء ناصعة للمهارات والتواصل، مقابل مساحة بيضاء مشرقة للخبرات والمشاريع.',
    descEn:
      'High-contrast full-bleed dark sidebar with crisp white typography for skills & credentials opposite a bright studio portfolio column.',
    badgeAr: 'تباين بصري عالٍ',
    badgeEn: 'High Contrast',
    structureTagAr: 'شريط داكن كامل + عمود أبيض',
    structureTagEn: 'Full Dark Sidebar + Studio Main',
    design: {
      templateId: 'creative-studio-split',
      visualStyle: 'creative-bold-aside',
      layoutMode: 'modern',
      modernVariant: 'sidebar',
      sectionDivider: 'accent-bar',
      paperLang: 'ar',
      paperDir: 'rtl',
      paperSize: 'a4',
      fontFamily: 'tajawal',
      fontScale: 0.98,
      lineHeight: 1.45,
      marginMm: 14,
      accentColor: '#0f766e',
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
    const asideBlocks = page.blocks.filter((b) => DARK_ASIDE_KINDS.includes(b.kind));
    const mainBlocks = page.blocks.filter((b) => !DARK_ASIDE_KINDS.includes(b.kind));

    return (
      <article
        key={page.pageNumber}
        data-cv-sheet
        data-template-style="creative-bold-aside"
        dir={doc.design.paperDir}
        lang={doc.design.paperLang}
        className="cv-paper-sheet cvp-mode-sidebar cvp-tpl-dark-aside"
        style={sheetStyle}
        onPointerDown={() => canvas?.interactive && canvas.onSelect(null)}
      >
        {renderCanvasUnderlay?.()}

        <aside className="cvp-dark-aside-col" style={{ backgroundColor: '#111827' }}>
          <div className="cvp-dark-aside-accent" style={{ backgroundColor: accent }} aria-hidden="true" />
          <InteractiveProfilePhoto doc={doc} accent={accent} sizePx={92} canvas={canvas} />

          <InteractiveBlock
            blockKey="header"
            label={doc.design.paperLang === 'ar' ? 'الهوية في الشريط الداكن' : 'Dark Sidebar Identity'}
            doc={doc}
            canvas={canvas}
          >
            <div className="cvp-dark-identity">
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
                  className="cvp-dark-role"
                  style={{ color: '#5eead4' }}
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

            {contacts.length > 0 && (
              <div className="cvp-dark-contacts">
                {contacts.map((c, idx) => (
                  <span key={idx}>
                    <bdi>{c}</bdi>
                  </span>
                ))}
              </div>
            )}
          </InteractiveBlock>

          <div className="cvp-col-sections cvp-dark-sections-invert">
            {asideBlocks.map((b, idx) => (
              <RenderTemplateSection
                key={`${b.kind}-${idx}`}
                doc={doc}
                block={b}
                accent="#5eead4"
                headingVariant="dark-sidebar"
                entryLayout="standard"
                canvas={canvas}
              />
            ))}
          </div>
        </aside>

        <main className="cvp-dark-aside-main" style={{ padding: `${effectiveMarginMm}mm` }}>
          <div className="cvp-col-sections">
            {mainBlocks.map((b, idx) => (
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
        </main>

        {renderCanvasOverlay?.()}
      </article>
    );
  },

  renderMiniPreview({ sample, accent, paperDir }) {
    return (
      <div className="cvt-mini-paper is-sidebar mini-dark-studio" dir={paperDir}>
        <div className="mini-dark-col" style={{ backgroundColor: '#111827' }}>
          <span className="mini-dark-avatar" style={{ borderColor: accent }} />
          <strong>{sample.personal.fullName}</strong>
          <small style={{ color: '#5eead4' }}>{sample.personal.jobTitle}</small>
          <div className="mini-dark-tags">
            <i>Figma</i>
            <i>UI/UX</i>
            <i>React</i>
          </div>
        </div>
        <div className="cvt-mini-main">
          <div className="mini-bar-heading">
            <em style={{ backgroundColor: accent }} />
            <small style={{ color: accent }}>PORTFOLIO & EXP</small>
          </div>
          <div className="mini-timeline-list">
            <div className="mini-tl-item">
              <u style={{ backgroundColor: accent }} />
              <div className="cvt-mini-lines" style={{ flex: 1 }}>
                <i style={{ width: '92%' }} />
                <i style={{ width: '78%' }} />
              </div>
            </div>
            <div className="mini-tl-item">
              <u style={{ backgroundColor: accent }} />
              <div className="cvt-mini-lines" style={{ flex: 1 }}>
                <i style={{ width: '88%' }} />
                <i style={{ width: '72%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
};
