import { useEffect, useRef, useState } from 'react';
import { Camera, Crop, Eye, EyeOff, Trash2 } from 'lucide-react';
import { useCvStudio } from '../../app/context';
import { Modal } from '../../components/Modal';

export function PersonalInfoSection() {
  const { resume, updateResume, notify, t } = useCvStudio();
  const { personal } = resume;
  const fileRef = useRef<HTMLInputElement>(null);

  // Crop modal state
  const [rawImage, setRawImage] = useState<string>('');
  const [cropZoom, setCropZoom] = useState(1.1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!rawImage || !cropCanvasRef.current) return;
    const img = new Image();
    img.onload = () => {
      const canvas = cropCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d')!;
      const size = 260;
      canvas.width = size;
      canvas.height = size;
      ctx.clearRect(0, 0, size, size);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);

      const minSide = Math.min(img.width, img.height);
      const drawW = (img.width / minSide) * size * cropZoom;
      const drawH = (img.height / minSide) * size * cropZoom;
      const x = (size - drawW) / 2 + offsetX;
      const y = (size - drawH) / 2 + offsetY;
      ctx.drawImage(img, x, y, drawW, drawH);
    };
    img.src = rawImage;
  }, [rawImage, cropZoom, offsetX, offsetY]);

  const setField = <K extends keyof typeof personal>(key: K, value: (typeof personal)[K]) => {
    updateResume((prev) => ({
      ...prev,
      personal: { ...prev.personal, [key]: value },
    }));
  };

  const applyCroppedPhoto = () => {
    const canvas = cropCanvasRef.current;
    if (!canvas) return;
    const cropped = canvas.toDataURL('image/jpeg', 0.92);
    updateResume((prev) => ({
      ...prev,
      personal: { ...prev.personal, photoDataUrl: cropped, showPhoto: true },
    }));
    setRawImage('');
    notify(t('تم قص الصورة وإضافتها للسيرة الذاتية', 'Photo cropped and applied'));
  };

  return (
    <div className="cv-section-card">
      <div className="cv-section-head">
        <div>
          <h3>{t('البيانات الشخصية والتواصل', 'Personal Details & Contact')}</h3>
          <p>{t('المعلومات الأساسية التي تظهر في ترويسة السيرة وخطاب التقديم.', 'Primary details displayed in your CV and cover letter header.')}</p>
        </div>
      </div>

      {/* Calm Photo Card */}
      <div className="cv-photo-box">
        <div className={`cv-photo-thumb ${personal.photoShape}`}>
          {personal.photoDataUrl ? (
            <img src={personal.photoDataUrl} alt={personal.fullName} />
          ) : (
            <Camera size={22} aria-hidden="true" />
          )}
        </div>
        <div className="cv-photo-controls">
          <div className="cv-photo-btn-row">
            <button type="button" className="cv-btn" onClick={() => fileRef.current?.click()}>
              <Camera size={14} />
              <span>{personal.photoDataUrl ? t('تغيير الصورة', 'Change Photo') : t('رفع صورة شخصية', 'Upload Photo')}</span>
            </button>
            {personal.photoDataUrl && (
              <>
                <button
                  type="button"
                  className="cv-btn"
                  onClick={() => {
                    setCropZoom(1.1);
                    setOffsetX(0);
                    setOffsetY(0);
                    setRawImage(personal.photoDataUrl);
                  }}
                >
                  <Crop size={14} />
                  <span>{t('قص وضبط', 'Crop')}</span>
                </button>
                <button
                  type="button"
                  className="cv-btn"
                  onClick={() => setField('showPhoto', !personal.showPhoto)}
                  data-testid="toggle-photo-visibility"
                >
                  {personal.showPhoto ? <EyeOff size={14} /> : <Eye size={14} />}
                  <span>{personal.showPhoto ? t('إخفاء من الورقة', 'Hide on sheet') : t('إظهار في الورقة', 'Show on sheet')}</span>
                </button>
                <button
                  type="button"
                  className="cv-icon-btn"
                  aria-label={t('حذف الصورة', 'Remove photo')}
                  onClick={() => {
                    updateResume((prev) => ({
                      ...prev,
                      personal: { ...prev.personal, photoDataUrl: '', showPhoto: false },
                    }));
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
          {personal.photoDataUrl && (
            <div className="cv-photo-shape-row">
              <span>{t('إطار الصورة:', 'Photo frame:')}</span>
              <button
                type="button"
                className={`cv-chip ${personal.photoShape === 'circle' ? 'active' : ''}`}
                onClick={() => setField('photoShape', 'circle')}
              >
                {t('دائري', 'Circular')}
              </button>
              <button
                type="button"
                className={`cv-chip ${personal.photoShape === 'rounded' ? 'active' : ''}`}
                onClick={() => setField('photoShape', 'rounded')}
              >
                {t('مربع ناعم', 'Rounded Square')}
              </button>
            </div>
          )}
          <small className="cv-calm-note">
            {resume.design.layoutMode === 'ats'
              ? t('ملاحظة: وضع ATS 100% يُخفي الصورة تلقائياً لضمان أعلى توافق مع الفرز الآلي.', 'Note: 100% ATS mode automatically omits photos for strict machine parsing.')
              : t('اختياري — تقدر تخفي الصورة في أي وقت للشركات العالمية بدون حذفها.', 'Optional — toggle visibility anytime without deleting your cropped photo.')}
          </small>
        </div>

        <input
          hidden
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          aria-label={t('اختيار صورة شخصية', 'Select profile photo')}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
              if (typeof reader.result === 'string') {
                setCropZoom(1.1);
                setOffsetX(0);
                setOffsetY(0);
                setRawImage(reader.result);
              }
            };
            reader.readAsDataURL(file);
          }}
        />
      </div>

      <div className="cv-grid-2">
        <div className="cv-field">
          <label htmlFor="cv-fullname">{t('الاسم الكامل', 'Full Name')}</label>
          <input
            id="cv-fullname"
            type="text"
            value={personal.fullName}
            onChange={(e) => setField('fullName', e.target.value)}
          />
        </div>
        <div className="cv-field">
          <label htmlFor="cv-jobtitle">{t('المسمى الوظيفي المستهدف', 'Target Job Title')}</label>
          <input
            id="cv-jobtitle"
            type="text"
            value={personal.jobTitle}
            onChange={(e) => setField('jobTitle', e.target.value)}
          />
        </div>
        <div className="cv-field">
          <label htmlFor="cv-email">{t('البريد الإلكتروني', 'Email Address')}</label>
          <input
            id="cv-email"
            type="email"
            dir="ltr"
            value={personal.email}
            onChange={(e) => setField('email', e.target.value)}
          />
        </div>
        <div className="cv-field">
          <label htmlFor="cv-phone">{t('رقم الهاتف', 'Phone Number')}</label>
          <input
            id="cv-phone"
            type="tel"
            dir="ltr"
            value={personal.phone}
            onChange={(e) => setField('phone', e.target.value)}
          />
        </div>
        <div className="cv-field">
          <label htmlFor="cv-location">{t('المدينة / الدولة', 'City / Country')}</label>
          <input
            id="cv-location"
            type="text"
            value={personal.location}
            onChange={(e) => setField('location', e.target.value)}
          />
        </div>
        <div className="cv-field">
          <label htmlFor="cv-linkedin">{t('رابط LinkedIn', 'LinkedIn Profile')}</label>
          <input
            id="cv-linkedin"
            type="text"
            dir="ltr"
            placeholder="linkedin.com/in/username"
            value={personal.linkedin}
            onChange={(e) => setField('linkedin', e.target.value)}
          />
        </div>
        <div className="cv-field">
          <label htmlFor="cv-website">{t('الموقع الشخصي / معرض الأعمال', 'Portfolio / Website')}</label>
          <input
            id="cv-website"
            type="text"
            dir="ltr"
            placeholder="yourportfolio.com"
            value={personal.website}
            onChange={(e) => setField('website', e.target.value)}
          />
        </div>
        <div className="cv-field">
          <label htmlFor="cv-github">{t('رابط GitHub / Behance', 'GitHub / Behance')}</label>
          <input
            id="cv-github"
            type="text"
            dir="ltr"
            placeholder="github.com/username"
            value={personal.github}
            onChange={(e) => setField('github', e.target.value)}
          />
        </div>
      </div>

      {rawImage && (
        <Modal
          title={t('قص وضبط الصورة الشخصية', 'Crop & Frame Profile Photo')}
          subtitle={t('اضبط التقريب والإزاحة لتوسيط الوجه بوضوح.', 'Adjust zoom and alignment to center your portrait cleanly.')}
          closeLabel={t('إلغاء', 'Cancel')}
          onClose={() => setRawImage('')}
        >
          <div className="cv-crop-dialog">
            <div className={`cv-crop-preview-wrap ${personal.photoShape}`}>
              <canvas ref={cropCanvasRef} width={260} height={260} />
            </div>
            <div className="cv-crop-sliders">
              <div className="cv-field">
                <label>{t('التقريب (Zoom)', 'Zoom')}</label>
                <input
                  type="range"
                  min="1"
                  max="2.5"
                  step="0.05"
                  value={cropZoom}
                  onChange={(e) => setCropZoom(Number(e.target.value))}
                />
              </div>
              <div className="cv-grid-2">
                <div className="cv-field">
                  <label>{t('إزاحة أفقية', 'Horizontal Offset')}</label>
                  <input
                    type="range"
                    min="-90"
                    max="90"
                    step="2"
                    value={offsetX}
                    onChange={(e) => setOffsetX(Number(e.target.value))}
                  />
                </div>
                <div className="cv-field">
                  <label>{t('إزاحة رأسية', 'Vertical Offset')}</label>
                  <input
                    type="range"
                    min="-90"
                    max="90"
                    step="2"
                    value={offsetY}
                    onChange={(e) => setOffsetY(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
            <div className="cv-modal-footer">
              <button type="button" className="cv-btn" onClick={() => setRawImage('')}>
                {t('إلغاء', 'Cancel')}
              </button>
              <button type="button" className="cv-btn primary" onClick={applyCroppedPhoto}>
                {t('اعتماد الصورة المقصوصة', 'Apply Cropped Photo')}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
