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

const RIGHT_RAIL_KINDS: CoreSectionId[] = ['skills', 'education', 'certifications', 'languages'];

export const techOnePageTemplate: TemplateModule = {
  preset: {
    id: 'tech-one-page',
    visualStyle: 'tech-split-grid',
    category: 'tech',
    nameAr: 'المهندس التقني — شبكة مزدوجة',
    nameEn: 'Tech Grid & Dark Masthead',
    descAr:
      'شريط علوي داكن للمطورين مع تقسيم شبكي غير متماثل (65% خبرات ومشاريع / 35% تقنيات وتعليم) ووسوم برمجية مدمجة.',
    descEn:
      'Dark slate developer masthead with an asymmetric 65/35 engineering grid and monospace code-style skill tags.',
    badgeAr: 'صفحة واحدة ذكية',
    badgeEn: 'Tech Split Grid',
    structureTagAr: 'شريط داكن + شبكة 65/35',
    structureTagEn: 'Dark Bar + 65/35 Grid',
    design: {
      templateId: 'tech-one-page',
      visualStyle: 'tech-split-grid',
      layoutMode: 'one-page',
      modernVariant: 'banner',
      sectionDivider: 'line',
      paperLang: 'en',
      paperDir: 'ltr',
      paperSize: 'a4',
      fontFamily: 'inter',
      fontScale: 0.94,
      lineHeight: 1.36,
      marginMm: 12,
      accentColor: '#1f4e5f',
      skillDisplay: 'badges',
    },
    sampleAr: SAMPLE_AR_TECH,
    sampleEn: SAMPLE_EN_TECH,
  },

  renderPage({
    doc,
    page,
    sheetStyle,
    effectiveMarginMm,
    accent,
    canvas,
    renderCanvasUnderlay,
    renderCanvasOverlay,
  }) {
    const contacts = collectContacts(doc);
    const sideBlocks = page.blocks.filter((b) => RIGHT_RAIL_KINDS.includes(b.kind));
    const primaryBlocks = page.blocks.filter((b) => !RIGHT_RAIL_KINDS.includes(b.kind));

    return (
      <article
        key={page.pageNumber}
        data-cv-sheet
        data-template-style="tech-split-grid"
        dir={doc.design.paperDir}
        lang={doc.design.paperLang}
        className="cv-paper-sheet cvp-tpl-tech-grid"
        style={{
          ...sheetStyle,
          padding: 0,
        }}
        onPointerDown={() => canvas?.interactive && canvas.onSelect(null)}
      >
        {renderCanvasUnderlay?.()}

        {page.includeHeader && (
          <InteractiveBlock
            blockKey="header"
            label={doc.design.paperLang === 'ar' ? 'الشريط التقني العلوي' : 'Tech Masthead'}
            doc={doc}
            canvas={canvas}
          >
            <header
              className="cvp-tech-masthead"
              style={{
                backgroundColor: '#11222b',
                borderBottom: `4px solid ${accent}`,
                padding: `${effectiveMarginMm}mm ${effectiveMarginMm}mm 14px`,
              }}
            >
              <div className="cvp-tech-head-row">
                <div className="cvp-tech-head-copy">
                  <InlineEditableText
                    tag="h1"
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
                      className="cvp-tech-role"
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
                    <div className="cvp-tech-chips">
                      {contacts.map((c, i) => (
                        <span key={i} className="cvp-tech-chip">
                          <bdi>{c}</bdi>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <InteractiveProfilePhoto doc={doc} accent="#7dd3fc" sizePx={74} canvas={canvas} />
              </div>
            </header>
          </InteractiveBlock>
        )}

        <div
          className="cvp-tech-two-col"
          style={{ padding: `14px ${effectiveMarginMm}mm ${effectiveMarginMm}mm` }}
        >
          <div className="cvp-tech-main-col">
            {primaryBlocks.map((b, idx) => (
              <RenderTemplateSection
                key={`${b.kind}-${b.customGroupId || idx}`}
                doc={doc}
                block={b}
                accent={accent}
                headingVariant="tech-bracket"
                entryLayout="standard"
                skillChipVariant="mono"
                canvas={canvas}
              />
            ))}
          </div>

          <aside className="cvp-tech-side-col" style={{ borderColor: `${accent}24` }}>
            {sideBlocks.map((b, idx) => (
              <RenderTemplateSection
                key={`${b.kind}-${idx}`}
                doc={doc}
                block={b}
                accent={accent}
                headingVariant="tech-bracket"
                entryLayout="standard"
                skillChipVariant="mono"
                canvas={canvas}
              />
            ))}
          </aside>
        </div>

        {renderCanvasOverlay?.()}
      </article>
    );
  },

  renderMiniPreview({ sample, accent, paperDir }) {
    return (
      <div className="cvt-mini-paper mini-tech-grid" dir={paperDir}>
        <div className="mini-tech-top" style={{ backgroundColor: '#11222b', borderBottom: `3px solid ${accent}` }}>
          <strong>{sample.personal.fullName}</strong>
          <span>{sample.personal.jobTitle}</span>
          <div className="mini-tech-pills">
            <i>GitHub</i>
            <i>LinkedIn</i>
            <i>Mail</i>
          </div>
        </div>
        <div className="mini-tech-cols">
          <div className="mini-tech-left">
            <small style={{ color: accent }}>{'// EXPERIENCE'}</small>
            <div className="cvt-mini-lines">
              <i style={{ width: '95%' }} />
              <i style={{ width: '88%' }} />
              <i style={{ width: '92%' }} />
            </div>
            <small style={{ color: accent }}>{'// PROJECTS'}</small>
            <div className="cvt-mini-lines">
              <i style={{ width: '90%' }} />
              <i style={{ width: '80%' }} />
            </div>
          </div>
          <div className="mini-tech-right">
            <small style={{ color: accent }}>{'// STACK'}</small>
            <div className="mini-pill-wrap">
              <b style={{ background: `${accent}16`, color: accent }}>TS</b>
              <b style={{ background: `${accent}16`, color: accent }}>React</b>
              <b style={{ background: `${accent}16`, color: accent }}>Node</b>
              <b style={{ background: `${accent}16`, color: accent }}>SQL</b>
            </div>
            <small style={{ color: accent }}>{'// EDU'}</small>
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
