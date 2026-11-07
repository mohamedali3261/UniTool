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

export const financeCorporateTemplate: TemplateModule = {
  preset: {
    id: 'finance-corporate',
    visualStyle: 'corporate-ledger',
    category: 'finance',
    nameAr: 'المالي والمؤسسي — إطار رسمي مزدوج',
    nameEn: 'Corporate Ledger & Double-Rule',
    descAr:
      'إطار رسمي مزدوج علوي وسفلي، ترويسة مصرفية مقسّمة مع جدول تواصل جانبي، وعناوين متمركزة محاطة بخطوط كلاسيكية.',
    descEn:
      'Executive double-rule frame, split boardroom ledger header, centered flanked section titles, and tabular date gutter.',
    badgeAr: 'رسمي ومعتمد',
    badgeEn: 'Boardroom Ledger',
    structureTagAr: 'إطار مزدوج + جدول تواريخ',
    structureTagEn: 'Double Frame + Date Col',
    design: {
      templateId: 'finance-corporate',
      visualStyle: 'corporate-ledger',
      layoutMode: 'ats',
      modernVariant: 'banner',
      sectionDivider: 'line',
      paperLang: 'ar',
      paperDir: 'rtl',
      paperSize: 'a4',
      fontFamily: 'noto-naskh',
      fontScale: 1,
      lineHeight: 1.5,
      marginMm: 17,
      accentColor: '#1b4332',
      skillDisplay: 'comma',
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
        data-template-style="corporate-ledger"
        dir={doc.design.paperDir}
        lang={doc.design.paperLang}
        className="cv-paper-sheet cvp-tpl-corporate-ledger"
        style={{
          ...sheetStyle,
          padding: `${effectiveMarginMm}mm`,
        }}
        onPointerDown={() => canvas?.interactive && canvas.onSelect(null)}
      >
        {renderCanvasUnderlay?.()}

        <div className="cvp-corp-double-bar" style={{ borderColor: accent }} aria-hidden="true" />

        {page.includeHeader ? (
          <InteractiveBlock
            blockKey="header"
            label={doc.design.paperLang === 'ar' ? 'الترويسة المؤسسية' : 'Corporate Header'}
            doc={doc}
            canvas={canvas}
          >
            <header className="cvp-corp-split-header" style={{ borderBottomColor: `${accent}44` }}>
              <div className="cvp-corp-title-side">
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

              <div className="cvp-corp-ledger-side" style={{ borderInlineStartColor: `${accent}35` }}>
                {contacts.map((c, i) => (
                  <span key={i} className="cvp-corp-contact-cell">
                    <bdi>{c}</bdi>
                  </span>
                ))}
                <InteractiveProfilePhoto doc={doc} accent={accent} sizePx={64} canvas={canvas} />
              </div>
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
              headingVariant="corporate-centered"
              entryLayout="hanging-date"
              canvas={canvas}
            />
          ))}
        </div>

        <div className="cvp-corp-double-bar is-bottom" style={{ borderColor: accent }} aria-hidden="true" />

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
      <div className="cvt-mini-paper mini-corporate-ledger" dir={paperDir}>
        <div className="mini-corp-frame" style={{ borderColor: `${accent}55` }}>
          <div className="mini-corp-top" style={{ borderBottomColor: `${accent}44` }}>
            <div>
              <strong style={{ color: accent }}>{sample.personal.fullName}</strong>
              <span>{sample.personal.jobTitle}</span>
            </div>
            <div className="mini-corp-meta" style={{ borderInlineStartColor: `${accent}33` }}>
              <small>Cairo, EG</small>
              <small>+20 100…</small>
            </div>
          </div>
          <div className="mini-corp-flanked" style={{ color: accent }}>
            <u />
            <b>SUMMARY</b>
            <u />
          </div>
          <div className="cvt-mini-lines">
            <i style={{ width: '94%' }} />
            <i style={{ width: '82%' }} />
          </div>
          <div className="mini-corp-flanked" style={{ color: accent }}>
            <u />
            <b>EXPERIENCE</b>
            <u />
          </div>
          <div className="mini-hanging-row">
            <small>2021–Now</small>
            <div className="cvt-mini-lines" style={{ flex: 1 }}>
              <i style={{ width: '92%' }} />
              <i style={{ width: '84%' }} />
            </div>
          </div>
          <div className="mini-hanging-row">
            <small>2017–2021</small>
            <div className="cvt-mini-lines" style={{ flex: 1 }}>
              <i style={{ width: '88%' }} />
              <i style={{ width: '75%' }} />
            </div>
          </div>
        </div>
      </div>
    );
  },
};
