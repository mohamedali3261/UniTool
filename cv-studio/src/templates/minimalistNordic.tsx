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

function extractMonogram(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'CV';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export const minimalistNordicTemplate: TemplateModule = {
  preset: {
    id: 'minimalist-nordic',
    visualStyle: 'nordic-minimal',
    category: 'creative',
    nameAr: 'التصميم السويسري الهندسي — المونوغرام',
    nameEn: 'Swiss Monogram & Dot-Matrix',
    descAr:
      'أسلوب هندسي هادئ مع شارة أحرف أولى (Monogram)، شريط بيانات ثلاثي الأعمدة، ومؤشرات مهارات نقطية أنيقة.',
    descEn:
      'Architectural Swiss grid featuring an initials monogram badge, 3-cell metadata bar, and 5-dot skill matrix.',
    badgeAr: 'هندسي معاصر',
    badgeEn: 'Swiss Minimal',
    structureTagAr: 'مونوغرام + مؤشر نقطي',
    structureTagEn: 'Monogram + Dot Matrix',
    design: {
      templateId: 'minimalist-nordic',
      visualStyle: 'nordic-minimal',
      layoutMode: 'modern',
      modernVariant: 'banner',
      sectionDivider: 'line',
      paperLang: 'ar',
      paperDir: 'rtl',
      paperSize: 'a4',
      fontFamily: 'changa',
      fontScale: 0.98,
      lineHeight: 1.48,
      marginMm: 16,
      accentColor: '#374151',
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
    const monogram = extractMonogram(doc.personal.fullName);

    return (
      <article
        key={page.pageNumber}
        data-cv-sheet
        data-template-style="nordic-minimal"
        dir={doc.design.paperDir}
        lang={doc.design.paperLang}
        className="cv-paper-sheet cvp-tpl-nordic"
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
            label={doc.design.paperLang === 'ar' ? 'ترويسة المونوغرام الهندسية' : 'Monogram Masthead'}
            doc={doc}
            canvas={canvas}
          >
            <header className="cvp-nordic-header">
              <div className="cvp-nordic-top-row">
                <div className="cvp-nordic-monogram" style={{ borderColor: accent, color: accent }}>
                  {monogram}
                </div>
                <div className="cvp-header-copy">
                  <InlineEditableText
                    tag="h1"
                    style={{ color: '#0f172a' }}
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
                <InteractiveProfilePhoto doc={doc} accent={accent} sizePx={70} canvas={canvas} />
              </div>

              {contacts.length > 0 && (
                <div className="cvp-nordic-meta-strip" style={{ borderColor: `${accent}30` }}>
                  {contacts.map((c, i) => (
                    <span key={i}>
                      <bdi>{c}</bdi>
                    </span>
                  ))}
                </div>
              )}
            </header>
          </InteractiveBlock>
        ) : (
          <header className="cvp-continuation-bar" style={{ borderBottomColor: `${accent}30` }}>
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
              headingVariant="nordic-minimal"
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
    const mono = extractMonogram(sample.personal.fullName);
    return (
      <div className="cvt-mini-paper mini-nordic" dir={paperDir}>
        <div className="mini-nordic-head">
          <div className="mini-monogram-box" style={{ borderColor: accent, color: accent }}>
            {mono}
          </div>
          <div>
            <strong>{sample.personal.fullName}</strong>
            <span style={{ color: accent }}>{sample.personal.jobTitle}</span>
          </div>
        </div>
        <div className="mini-nordic-gridbar" style={{ borderColor: `${accent}30` }}>
          <small>Mail</small>
          <small>Phone</small>
          <small>Web</small>
        </div>
        <div className="cvt-mini-body">
          <div className="mini-nordic-sec" style={{ color: accent }}>
            EXPERIENCE
          </div>
          <div className="cvt-mini-lines">
            <i style={{ width: '94%' }} />
            <i style={{ width: '82%' }} />
            <i style={{ width: '88%' }} />
          </div>
          <div className="mini-nordic-sec" style={{ color: accent }}>
            COMPETENCIES
          </div>
          <div className="mini-dot-matrix">
            <div>
              <small>Strategy</small>
              <b style={{ color: accent }}>●●●●●</b>
            </div>
            <div>
              <small>Analytics</small>
              <b style={{ color: accent }}>●●●●○</b>
            </div>
          </div>
        </div>
      </div>
    );
  },
};
