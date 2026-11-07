import { useEffect, useRef, useState } from 'react';
import { useCvStudio } from '../../app/context';
import { getPaperDimensions } from '../../core/pagination';
import { resolveFontFamily } from '../../data/themes';

export function CoverLetterPreview() {
  const { resume, t } = useCvStudio();
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.74);

  const dims = getPaperDimensions(resume.design.paperSize);
  const accent =
    resume.design.layoutMode === 'ats'
      ? resume.design.accentColor || '#111827'
      : resume.design.accentColor || '#24795e';
  const fontCss = resolveFontFamily(resume.design.fontFamily);
  const isBanner = resume.design.layoutMode === 'modern' && resume.design.modernVariant === 'banner';

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const compute = () => {
      const w = el.clientWidth - 32;
      if (w <= 0) return;
      setScale(Number(Math.min(0.95, Math.max(0.34, w / dims.widthPx)).toFixed(3)));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [dims.widthPx]);

  const contacts = [
    resume.personal.email,
    resume.personal.phone,
    resume.personal.location,
    resume.personal.linkedin,
  ].filter(Boolean);

  const cl = resume.coverLetter;

  return (
    <section className="cv-preview-pane" aria-label={t('معاينة خطاب التقديم', 'Cover letter preview')}>
      <div className="cv-preview-toolbar no-print">
        <span className="cv-mode-pill">{t('متطابق مع هوية سيرتك تلقائياً', 'Synced with CV Identity')}</span>
        <span className="cv-meta-pill">
          {resume.design.paperSize.toUpperCase()} · {resume.design.paperDir.toUpperCase()} · {Math.round(scale * 100)}%
        </span>
      </div>

      <div className="cv-preview-stage" ref={stageRef}>
        <div
          className="cv-scale-frame"
          style={{
            width: `${Math.round(dims.widthPx * scale)}px`,
            minHeight: `${Math.round(dims.heightPx * scale)}px`,
          }}
        >
          <div
            style={{
              width: `${dims.widthPx}px`,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          >
            <article
              data-cl-sheet
              dir={resume.design.paperDir}
              lang={resume.design.paperLang}
              className="cv-paper-sheet cvcl-sheet"
              style={{
                width: `${dims.widthPx}px`,
                minHeight: `${dims.heightPx}px`,
                fontFamily: fontCss,
                fontSize: `${(13.8 * resume.design.fontScale).toFixed(2)}px`,
                lineHeight: resume.design.lineHeight + 0.1,
                padding: isBanner ? `0 0 ${resume.design.marginMm}mm 0` : `${resume.design.marginMm}mm`,
              }}
            >
              <header
                className="cvp-top-header"
                style={
                  isBanner
                    ? {
                        backgroundColor: `${accent}10`,
                        borderTop: `5px solid ${accent}`,
                        padding: `${resume.design.marginMm}mm ${resume.design.marginMm}mm 16px`,
                      }
                    : { borderBottomColor: `${accent}40` }
                }
              >
                <h1 style={{ color: accent, fontSize: '2em', fontWeight: 800 }}>{resume.personal.fullName}</h1>
                {resume.personal.jobTitle && <p className="cvp-job-title">{resume.personal.jobTitle}</p>}
                {contacts.length > 0 && (
                  <div className="cvp-inline-contacts">
                    {contacts.map((c, idx) => (
                      <span key={idx}>
                        {idx > 0 && <em> • </em>}
                        <bdi>{c}</bdi>
                      </span>
                    ))}
                  </div>
                )}
              </header>

              <div
                className="cvcl-letter-body"
                style={isBanner ? { paddingInline: `${resume.design.marginMm}mm` } : undefined}
              >
                <div className="cvcl-meta-block">
                  <span className="cvcl-date" dir="ltr">
                    {cl.date}
                  </span>
                  <div className="cvcl-recipient">
                    {cl.recipientName && <strong>{cl.recipientName}</strong>}
                    {cl.recipientTitle && <span>{cl.recipientTitle}</span>}
                    {cl.companyName && <span style={{ color: accent }}>{cl.companyName}</span>}
                  </div>
                </div>

                {cl.subject && (
                  <div className="cvcl-subject" style={{ borderInlineStartColor: accent }}>
                    {cl.subject}
                  </div>
                )}

                <div className="cvcl-paragraphs">
                  {cl.greeting && <p><strong>{cl.greeting}</strong></p>}
                  {cl.opening && <p>{cl.opening}</p>}
                  {cl.body
                    .split(/\n+/)
                    .filter(Boolean)
                    .map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  {cl.closing && <p>{cl.closing}</p>}
                </div>

                <div className="cvcl-signoff">
                  <span>{cl.signOff}</span>
                  <strong style={{ color: accent }}>{cl.signatureText || resume.personal.fullName}</strong>
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
