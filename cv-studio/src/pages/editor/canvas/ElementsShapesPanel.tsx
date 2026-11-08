import { useRef, useState } from 'react';
import {
  ImagePlus,
  Layers,
  Minus,
  PenTool,
  QrCode,
  Shapes,
  Sparkles,
  Star,
  Type,
  UserSquare2,
} from 'lucide-react';
import { useCvStudio } from '../../../app/context';
import type { CanvasDividerKind, CanvasElement, CanvasShapeKind } from '../../../core/types';
import {
  createCanvasBadgeElement,
  createCanvasDividerElement,
  createCanvasIconElement,
  createCanvasImageElement,
  createCanvasQrElement,
  createCanvasRatingElement,
  createCanvasShapeElement,
  createCanvasTextElement,
  generateSamplePortraitDataUrl,
} from './canvasDefaults';
import { CANVAS_ICON_LIST, CANVAS_ICON_MAP, CanvasShapeSvg } from './CanvasShapeSvg';
import { SignaturePadModal } from './SignaturePadModal';

const SHAPE_PRESETS: { kind: CanvasShapeKind; ar: string; en: string }[] = [
  { kind: 'rect', ar: 'مستطيل حاد', en: 'Rectangle' },
  { kind: 'rounded', ar: 'بطاقة ناعمة', en: 'Rounded Box' },
  { kind: 'pill', ar: 'كبسولة عريضة', en: 'Pill Capsule' },
  { kind: 'circle', ar: 'دائرة مصمتة', en: 'Circle' },
  { kind: 'ring', ar: 'حلقة دائرية', en: 'Ring Outline' },
  { kind: 'triangle', ar: 'مثلث', en: 'Triangle' },
  { kind: 'diamond', ar: 'معين هندسي', en: 'Diamond' },
  { kind: 'hexagon', ar: 'سداسي', en: 'Hexagon' },
  { kind: 'star', ar: 'نجمة', en: 'Star' },
  { kind: 'banner', ar: 'شريط عنوان', en: 'Ribbon Banner' },
];

const DIVIDER_PRESETS: {
  style: CanvasDividerKind;
  vertical?: boolean;
  ar: string;
  en: string;
}[] = [
  { style: 'solid', ar: 'خط فاصل متصل', en: 'Solid Line' },
  { style: 'dashed', ar: 'خط متقطع', en: 'Dashed Line' },
  { style: 'dotted', ar: 'خط منقط', en: 'Dotted Line' },
  { style: 'double', ar: 'فاصل مزدوج رسمي', en: 'Double Rule' },
  { style: 'arrow', ar: 'سهم اتجاهي', en: 'Arrow Pointer' },
  { style: 'solid', vertical: true, ar: 'عمود فاصل رأسي', en: 'Vertical Spine' },
];

export function ElementsShapesPanel({
  onOpenInspector,
}: {
  onOpenInspector: () => void;
}) {
  const { resume, updateResume, setCanvasSelection, notify, t } = useCvStudio();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [placeUnderlay, setPlaceUnderlay] = useState(false);
  const [sigOpen, setSigOpen] = useState(false);
  const [qrUrl, setQrUrl] = useState(
    resume.personal.linkedin
      ? `https://${resume.personal.linkedin.replace(/^https?:\/\//, '')}`
      : 'https://linkedin.com',
  );

  const insertElement = (el: CanvasElement, msgAr: string, msgEn: string) => {
    updateResume((prev) => ({
      ...prev,
      canvasElements: [...(prev.canvasElements || []), el],
    }));
    setCanvasSelection({ kind: 'element', id: el.id });
    notify(t(msgAr, msgEn));
    onOpenInspector();
  };

  const commonOpts = {
    paperLang: resume.design.paperLang,
    paperDir: resume.design.paperDir,
    fontFamily: resume.design.fontFamily,
    accentColor: resume.design.accentColor || '#24795e',
    existing: resume.canvasElements,
    pageIndex: 0,
  };

  const handleUploadCanvasImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const el = createCanvasImageElement(reader.result, {
          name: file.name.replace(/\.[^.]+$/, '').slice(0, 28) || t('صورة مضافة', 'Uploaded Image'),
          accentColor: commonOpts.accentColor,
          existing: resume.canvasElements,
        });
        insertElement(el, 'تمت إضافة الصورة للورقة — يمكنك تحريكها وتعديل فلاترها الآن', 'Image added to sheet');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddSampleImage = () => {
    const sampleSrc = generateSamplePortraitDataUrl(commonOpts.accentColor);
    const el = createCanvasImageElement(sampleSrc, {
      name: t('صورة شخصية / شعار', 'Portrait / Graphic'),
      shape: 'circle',
      accentColor: commonOpts.accentColor,
      existing: resume.canvasElements,
    });
    insertElement(el, 'تمت إضافة صورة للورقة — عدّل شكلها وفلاترها بحرية', 'Sample portrait added');
  };

  const handleAddQr = async () => {
    try {
      const el = await createCanvasQrElement(qrUrl, {
        accentColor: commonOpts.accentColor,
        existing: resume.canvasElements,
      });
      insertElement(el, 'تم إنشاء وإضافة كود QR على الورقة', 'Interactive QR code added to sheet');
    } catch {
      notify(t('تعذر توليد كود QR', 'Could not generate QR code'));
    }
  };

  return (
    <div className="cv-section-stack" data-testid="cv-elements-shapes-panel">
      {/* 1. Freeform Text & Badges */}
      <div className="cv-section-card">
        <div className="cv-section-head">
          <div>
            <h3>
              <Type size={16} style={{ verticalAlign: 'middle', marginInlineEnd: 6 }} />
              {t('إضافة نصوص حرة وشارات', 'Add Freeform Texts & Badges')}
            </h3>
            <p>
              {t(
                'أضف أي نص حر أو شارة، وحرّكه في أي مكان على الورقة وعدّل خطه ولونه وحجمه وميله.',
                'Drop movable headings, notes, callouts, or pill badges anywhere onto the CV sheet.',
              )}
            </p>
          </div>
        </div>

        <div className="cv-elem-btn-grid">
          <button
            type="button"
            className="cv-elem-tile"
            data-testid="add-canvas-heading"
            onClick={() =>
              insertElement(
                createCanvasTextElement('heading', commonOpts),
                'تمت إضافة عنوان حر على الورقة',
                'Added movable heading',
              )
            }
          >
            <strong style={{ fontSize: 16 }}>Aa</strong>
            <span>{t('عنوان رئيسي حر', 'Custom Heading')}</span>
          </button>

          <button
            type="button"
            className="cv-elem-tile"
            data-testid="add-canvas-subheading"
            onClick={() =>
              insertElement(
                createCanvasTextElement('subheading', commonOpts),
                'تمت إضافة عنوان فرعي حر',
                'Added movable subheading',
              )
            }
          >
            <strong style={{ fontSize: 14 }}>Aa</strong>
            <span>{t('عنوان فرعي', 'Subheading')}</span>
          </button>

          <button
            type="button"
            className="cv-elem-tile"
            data-testid="add-canvas-body"
            onClick={() =>
              insertElement(
                createCanvasTextElement('body', commonOpts),
                'تمت إضافة فقرة نصية حرة',
                'Added movable text block',
              )
            }
          >
            <Type size={17} />
            <span>{t('فقرة نصية حرة', 'Paragraph Text')}</span>
          </button>

          <button
            type="button"
            className="cv-elem-tile"
            data-testid="add-canvas-callout"
            onClick={() =>
              insertElement(
                createCanvasTextElement('callout', commonOpts),
                'تمت إضافة بطاقة إبراز ملونة',
                'Added highlight callout card',
              )
            }
          >
            <Sparkles size={17} />
            <span>{t('صندوق إبراز ملون', 'Callout Card')}</span>
          </button>

          <button
            type="button"
            className="cv-elem-tile"
            data-testid="add-canvas-badge"
            onClick={() =>
              insertElement(
                createCanvasBadgeElement(commonOpts),
                'تمت إضافة شارة (Badge) قابلة للتحريك',
                'Added pill badge',
              )
            }
          >
            <span className="cv-mini-pill-demo">{t('وسم ✓', 'Tag ✓')}</span>
            <span>{t('شارة / وسم كبسولة', 'Pill Badge')}</span>
          </button>
        </div>
      </div>

      {/* 2. Images & QR Code */}
      <div className="cv-section-card">
        <div className="cv-section-head">
          <div>
            <h3>
              <ImagePlus size={16} style={{ verticalAlign: 'middle', marginInlineEnd: 6 }} />
              {t('إضافة صور وشعارات وكود QR', 'Add Images, Logos & QR Code')}
            </h3>
            <p>
              {t(
                'ارفع صوراً إضافية (صورة شخصية، شعار جهة، توقيع، ختم) مع قص وتكبير وفلاتر وإطارات هندسية.',
                'Place photos, logos, or signatures on the sheet with shape masks, zoom/pan, and studio filters.',
              )}
            </p>
          </div>
        </div>

        <div className="cv-photo-btn-row">
          <button
            type="button"
            className="cv-btn primary"
            data-testid="upload-canvas-image-btn"
            onClick={() => imageInputRef.current?.click()}
          >
            <ImagePlus size={15} />
            <span>{t('رفع صورة على السيرة', 'Upload Image to Sheet')}</span>
          </button>

          <button
            type="button"
            className="cv-btn"
            data-testid="add-sample-canvas-image"
            onClick={handleAddSampleImage}
          >
            <UserSquare2 size={15} />
            <span>{t('إدراج صورة جاهزة للتجربة', 'Insert Sample Portrait')}</span>
          </button>

          <button
            type="button"
            className="cv-btn soft"
            data-testid="open-signature-pad-btn"
            onClick={() => setSigOpen(true)}
          >
            <PenTool size={15} />
            <span>{t('رسم / كتابة توقيع إلكتروني', 'Electronic Signature')}</span>
          </button>

          <input
            hidden
            ref={imageInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            data-testid="canvas-image-file-input"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file) handleUploadCanvasImage(file);
            }}
          />
        </div>

        <div className="cv-qr-builder-box">
          <label htmlFor="cv-qr-url-input">
            <QrCode size={14} style={{ verticalAlign: 'middle', marginInlineEnd: 5 }} />
            {t('كود QR لمعرض أعمالك أو حساب LinkedIn:', 'Portfolio or LinkedIn QR Code:')}
          </label>
          <div className="cv-quick-add-row">
            <input
              id="cv-qr-url-input"
              type="url"
              dir="ltr"
              value={qrUrl}
              onChange={(e) => setQrUrl(e.target.value)}
              placeholder="https://linkedin.com/in/yourname"
            />
            <button
              type="button"
              className="cv-btn soft"
              data-testid="add-canvas-qr-btn"
              onClick={() => void handleAddQr()}
            >
              <QrCode size={14} />
              <span>{t('إدراج QR', 'Add QR')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Geometric Shapes */}
      <div className="cv-section-card">
        <div className="cv-section-head">
          <div>
            <h3>
              <Shapes size={16} style={{ verticalAlign: 'middle', marginInlineEnd: 6 }} />
              {t('الأشكال الهندسية والخلفيات الزخرفية', 'Shapes & Decorative Accents')}
            </h3>
            <p>
              {t(
                'أضف أشكالاً هندسية ملونة فوق الورقة أو خلف نصوص السيرة لتصميم ترويسات وهوامش مبتكرة.',
                'Add geometric shapes above or behind CV text to craft custom headers, sidebars, and accents.',
              )}
            </p>
          </div>
        </div>

        <label className="cv-inline-check">
          <input
            type="checkbox"
            checked={placeUnderlay}
            onChange={(e) => setPlaceUnderlay(e.target.checked)}
          />
          <Layers size={14} />
          <span>
            {t(
              'وضع الشكل خلف نصوص السيرة كخلفية زخرفية هادئة',
              'Place shape behind CV text as decorative background',
            )}
          </span>
        </label>

        <div className="cv-shapes-grid">
          {SHAPE_PRESETS.map((sh) => (
            <button
              key={sh.kind}
              type="button"
              className="cv-shape-tile"
              data-testid={`add-shape-${sh.kind}`}
              onClick={() =>
                insertElement(
                  createCanvasShapeElement(sh.kind, {
                    accentColor: commonOpts.accentColor,
                    underlay: placeUnderlay,
                    existing: resume.canvasElements,
                    labelAr: sh.ar,
                  }),
                  `تمت إضافة شكل: ${sh.ar}`,
                  `Added ${sh.en}`,
                )
              }
            >
              <div className="cv-shape-tile-preview">
                <CanvasShapeSvg
                  shapeKind={sh.kind}
                  fillColor="#24795e26"
                  strokeColor="#24795e"
                  strokeWidth={2}
                />
              </div>
              <span>{t(sh.ar, sh.en)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Lines & Dividers */}
      <div className="cv-section-card">
        <div className="cv-section-head">
          <div>
            <h3>
              <Minus size={16} style={{ verticalAlign: 'middle', marginInlineEnd: 6 }} />
              {t('الخطوط والفواصل والأسهم', 'Lines, Dividers & Connectors')}
            </h3>
          </div>
        </div>

        <div className="cv-elem-btn-grid">
          {DIVIDER_PRESETS.map((dv, idx) => (
            <button
              key={idx}
              type="button"
              className="cv-elem-tile"
              data-testid={`add-divider-${dv.style}${dv.vertical ? '-v' : ''}`}
              onClick={() =>
                insertElement(
                  createCanvasDividerElement(dv.style, {
                    accentColor: commonOpts.accentColor,
                    vertical: dv.vertical,
                    existing: resume.canvasElements,
                  }),
                  `تمت إضافة: ${dv.ar}`,
                  `Added ${dv.en}`,
                )
              }
            >
              <Minus size={16} style={dv.vertical ? { transform: 'rotate(90deg)' } : undefined} />
              <span>{t(dv.ar, dv.en)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 5. Icons & Star Ratings */}
      <div className="cv-section-card">
        <div className="cv-section-head">
          <div>
            <h3>
              <Star size={16} style={{ verticalAlign: 'middle', marginInlineEnd: 6 }} />
              {t('أيقونات السيرة وتقييم النجوم', 'Professional Icons & Ratings')}
            </h3>
          </div>
          <button
            type="button"
            className="cv-btn soft"
            data-testid="add-canvas-rating"
            onClick={() =>
              insertElement(
                createCanvasRatingElement({
                  accentColor: commonOpts.accentColor,
                  existing: resume.canvasElements,
                }),
                'تمت إضافة شريط تقييم النجوم',
                'Added 5-star rating bar',
              )
            }
          >
            <Star size={14} />
            <span>{t('+ تقييم 5 نجوم', '+ 5-Star Rating')}</span>
          </button>
        </div>

        <div className="cv-icons-mini-grid">
          {CANVAS_ICON_LIST.map((ic) => {
            const IconComp = CANVAS_ICON_MAP[ic.key];
            return (
              <button
                key={ic.key}
                type="button"
                className="cv-icon-tile"
                title={t(ic.ar, ic.en)}
                data-testid={`add-icon-${ic.key}`}
                onClick={() =>
                  insertElement(
                    createCanvasIconElement(ic.key, {
                      accentColor: commonOpts.accentColor,
                      existing: resume.canvasElements,
                    }),
                    `تمت إضافة أيقونة: ${ic.ar}`,
                    `Added ${ic.en} icon`,
                  )
                }
              >
                <IconComp size={18} />
                <small>{t(ic.ar, ic.en)}</small>
              </button>
            );
          })}
        </div>
      </div>

      <SignaturePadModal
        open={sigOpen}
        onClose={() => setSigOpen(false)}
        onInserted={onOpenInspector}
      />
    </div>
  );
}
