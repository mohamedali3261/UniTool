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

const SIDEBAR_KINDS: CoreSectionId[] = ['skills', 'languages', 'certifications'];

export const modernEmeraldExecTemplate: TemplateModule = {
  preset: {
    id: 'modern-emerald-exec',
    visualStyle: 'modern-sidebar',
    category: 'executive',
    nameAr: 'التنفيذي العصري — شريط جانبي',
    nameEn: 'Modern Executive Sidebar',
    descAr:
      'عمود جانبي ممتد بطول الورقة يضم الصورة والهوية والتواصل والمهارات، مع عمود رئيسي واسع للإنجازات القيادية.',
    descEn:
      'Full-height tinted sidebar rail for identity, contacts, and competencies paired with a spacious executive main column.',
    badgeAr: 'الأكثر اختياراً',
    badgeEn: 'Popular',
    structureTagAr: 'عمود جانبي كامل',
    structureTagEn: 'Full Sidebar Split',
    design: {
      templateId: 'modern-emerald-exec',
      visualStyle: 'modern-sidebar',
      layoutMode: 'modern',
      modernVariant: 'sidebar',
      sectionDivider: 'accent-bar',
      paperLang: 'ar',
      paperDir: 'rtl',
      paperSize: 'a4',
      fontFamily: 'cairo',
      fontScale: 0.98,
      lineHeight: 1.45,
      marginMm: 14,
      accentColor: '#24795e',
      skillDisplay: 'badges',
    },
    sampleAr: SAMPLE_AR_EXEC,
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
    const sidebarBlocks = page.blocks.filter((b) => SIDEBAR_KINDS.includes(b.kind));
    const mainBlocks = page.blocks.filter((b) => !SIDEBAR_KINDS.includes(b.kind));

    return (
      <article
        key={page.pageNumber}
        data-cv-sheet
        data-template-style="modern-sidebar"
        dir={doc.design.paperDir}
        lang={doc.design.paperLang}
        className="cv-paper-sheet cvp-mode-sidebar cvp-tpl-modern-sidebar"
        style={sheetStyle}
        onPointerDown={() => canvas?.interactive && canvas.onSelect(null)}
      >
        {renderCanvasUnderlay?.()}

        <aside
          className="cvp-sidebar-col"
          style={{
            backgroundColor: `${accent}0f`,
            borderColor: `${accent}28`,
          }}
        >
          <InteractiveProfilePhoto doc={doc} accent={accent} sizePx={86} canvas={canvas} />

          <InteractiveBlock
            blockKey="header"
            label={doc.design.paperLang === 'ar' ? 'الاسم والتواصل' : 'Identity & Contact'}
            doc={doc}
            canvas={canvas}
          >
            <div className="cvp-sidebar-identity">
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
            </div>

            {contacts.length > 0 && (
              <div className="cvp-sidebar-contacts" style={{ marginTop: 10 }}>
                {contacts.map((c, i) => (
                  <span key={i} dir={c.includes('@') || c.includes('+') || c.includes('.') ? 'ltr' : undefined}>
                    {c}
                  </span>
                ))}
              </div>
            )}
          </InteractiveBlock>

          <div className="cvp-col-sections">
            {sidebarBlocks.map((b, idx) => (
              <RenderTemplateSection
                key={`${b.kind}-${idx}`}
                doc={doc}
                block={b}
                accent={accent}
                headingVariant="accent-bar"
                entryLayout="standard"
                canvas={canvas}
              />
            ))}
          </div>
        </aside>

        <div className="cvp-main-col" style={{ padding: `${effectiveMarginMm}mm` }}>
          <div className="cvp-col-sections">
            {mainBlocks.map((b, idx) => (
              <RenderTemplateSection
                key={`${b.kind}-${b.customGroupId || idx}`}
                doc={doc}
                block={b}
                accent={accent}
                headingVariant="accent-bar"
                entryLayout="standard"
                canvas={canvas}
              />
            ))}
          </div>
        </div>

        {renderCanvasOverlay?.()}
      </article>
    );
  },

  renderMiniPreview({ sample, accent, paperDir }) {
    return (
      <div className="cvt-mini-paper is-sidebar" dir={paperDir}>
        <div className="cvt-mini-side" style={{ backgroundColor: `${accent}16`, borderColor: `${accent}33` }}>
          <div className="cvt-mini-avatar" style={{ borderColor: accent }} />
          <strong style={{ color: accent }}>{sample.personal.fullName}</strong>
          <span>{sample.personal.jobTitle}</span>
          <div className="mini-pill-wrap">
            <b style={{ borderColor: `${accent}55`, color: accent }}>Strategy</b>
            <b style={{ borderColor: `${accent}55`, color: accent }}>P&L</b>
            <b style={{ borderColor: `${accent}55`, color: accent }}>KPIs</b>
          </div>
          <div className="cvt-mini-lines">
            <i style={{ width: '82%' }} />
            <i style={{ width: '68%' }} />
          </div>
        </div>
        <div className="cvt-mini-main">
          <div className="mini-bar-heading" style={{ color: accent }}>
            <em style={{ background: accent }} />
            <small>SUMMARY</small>
          </div>
          <p>{sample.summary.slice(0, 75)}…</p>
          <div className="mini-bar-heading" style={{ color: accent }}>
            <em style={{ background: accent }} />
            <small>EXPERIENCE</small>
          </div>
          <div className="cvt-mini-lines">
            <i style={{ width: '94%' }} />
            <i style={{ width: '86%' }} />
            <i style={{ width: '90%' }} />
            <i style={{ width: '74%' }} />
          </div>
        </div>
      </div>
    );
  },
};
