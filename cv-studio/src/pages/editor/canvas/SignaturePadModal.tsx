import React, { useEffect, useRef, useState } from 'react';
import { Check, Eraser, PenTool, Type } from 'lucide-react';
import { useCvStudio } from '../../../app/context';
import { Modal } from '../../../components/Modal';
import { createCanvasImageElement } from './canvasDefaults';

const INK_COLORS = [
  { id: 'black', hex: '#111827', ar: 'حبر أسود رسمي', en: 'Classic Black' },
  { id: 'blue', hex: '#1d4ed8', ar: 'أزرق قلم جاف', en: 'Royal Pen Blue' },
  { id: 'emerald', hex: '#1f6f54', ar: 'زمردي رسمي', en: 'Emerald Ink' },
];

export function SignaturePadModal({
  open,
  onClose,
  onInserted,
}: {
  open: boolean;
  onClose: () => void;
  onInserted?: () => void;
}) {
  const { resume, updateResume, setCanvasSelection, notify, t } = useCvStudio();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<'draw' | 'type'>('draw');
  const [inkColor, setInkColor] = useState('#1d4ed8');
  const [strokeWidth, setStrokeWidth] = useState(2.8);
  const [hasStrokes, setHasStrokes] = useState(false);
  const [typedName, setTypedName] = useState(resume.personal.fullName || 'التوقيع');
  const drawingRef = useRef(false);
  const lastPtRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!open || mode !== 'draw') return;
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, cvs.width, cvs.height);
    setHasStrokes(false);
  }, [open, mode]);

  if (!open) return null;

  const getPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const cvs = canvasRef.current!;
    const rect = cvs.getBoundingClientRect();
    const sx = cvs.width / rect.width;
    const sy = cvs.height / rect.height;
    return {
      x: (e.clientX - rect.left) * sx,
      y: (e.clientY - rect.top) * sy,
    };
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const cvs = canvasRef.current;
    if (!cvs) return;
    try {
      cvs.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    drawingRef.current = true;
    const pt = getPoint(e);
    lastPtRef.current = pt;

    const ctx = cvs.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, strokeWidth / 2, 0, Math.PI * 2);
      ctx.fillStyle = inkColor;
      ctx.fill();
    }
    setHasStrokes(true);
  };

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || !canvasRef.current || !lastPtRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    const nextPt = getPoint(e);
    const prev = lastPtRef.current;
    const midX = (prev.x + nextPt.x) / 2;
    const midY = (prev.y + nextPt.y) / 2;

    ctx.strokeStyle = inkColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
    ctx.lineTo(nextPt.x, nextPt.y);
    ctx.stroke();

    lastPtRef.current = nextPt;
  };

  const onUp = () => {
    drawingRef.current = false;
    lastPtRef.current = null;
  };

  const clearPad = () => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    ctx?.clearRect(0, 0, cvs.width, cvs.height);
    setHasStrokes(false);
  };

  const insertSignature = () => {
    let dataUrl = '';

    if (mode === 'draw') {
      const cvs = canvasRef.current;
      if (!cvs || !hasStrokes) {
        notify(t('ارسم توقيعك أولاً داخل المربع', 'Please draw your signature first'));
        return;
      }
      dataUrl = cvs.toDataURL('image/png');
    } else {
      const off = document.createElement('canvas');
      off.width = 520;
      off.height = 170;
      const ctx = off.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, off.width, off.height);
      ctx.fillStyle = inkColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'italic 700 46px Georgia, "Amiri", serif';
      ctx.fillText(typedName.trim() || 'Signature', off.width / 2, off.height / 2 - 6);
      // Decorative pen underline flourish
      ctx.strokeStyle = inkColor;
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(130, 128);
      ctx.quadraticCurveTo(260, 112, 390, 130);
      ctx.stroke();
      dataUrl = off.toDataURL('image/png');
    }

    const sigEl = createCanvasImageElement(dataUrl, {
      name: t('توقيع إلكتروني', 'Signature'),
      shape: 'square',
      accentColor: 'transparent',
      existing: resume.canvasElements,
    });
    sigEl.width = 185;
    sigEl.height = 68;
    sigEl.x = 90;
    sigEl.y = 940;
    sigEl.strokeWidth = 0;
    sigEl.shadow = false;
    sigEl.imageFilters = {
      ...(sigEl.imageFilters as any),
      objectFit: 'contain',
    };

    updateResume((prev) => ({
      ...prev,
      canvasElements: [...(prev.canvasElements || []), sigEl],
    }));
    setCanvasSelection({ kind: 'element', id: sigEl.id });
    notify(t('تم إدراج التوقيع الشفاف — اسحبه لأي موضع على الورقة', 'Transparent signature placed on sheet'));
    onClose();
    onInserted?.();
  };

  return (
    <Modal
      title={t('إضافة توقيع إلكتروني شفاف على السيرة', 'Add Transparent Electronic Signature')}
      subtitle={t(
        'ارسم توقيعك بالماوس أو اللمس أو اكتبه بخط توقيع أنيق، ثم حرّكه بحرية على الورقة.',
        'Draw your handwritten signature smoothly or generate a calligraphic text signature.',
      )}
      closeLabel={t('إغلاق', 'Close')}
      onClose={onClose}
    >
      <div className="cv-sig-modal" data-testid="signature-pad-modal">
        <div className="cv-chip-row">
          <button
            type="button"
            className={`cv-chip ${mode === 'draw' ? 'active' : ''}`}
            onClick={() => setMode('draw')}
          >
            <PenTool size={13} style={{ verticalAlign: 'middle', marginInlineEnd: 5 }} />
            {t('رسم حر باليد', 'Hand-Drawn Ink')}
          </button>
          <button
            type="button"
            className={`cv-chip ${mode === 'type' ? 'active' : ''}`}
            onClick={() => setMode('type')}
          >
            <Type size={13} style={{ verticalAlign: 'middle', marginInlineEnd: 5 }} />
            {t('توقيع مكتوب أنيق', 'Stylized Text Signature')}
          </button>
        </div>

        <div className="cv-sig-controls">
          <div className="cv-swatches-row">
            <span style={{ fontSize: 12, fontWeight: 700 }}>{t('لون الحبر:', 'Ink:')}</span>
            {INK_COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`cv-color-swatch ${inkColor === c.hex ? 'active' : ''}`}
                style={{ backgroundColor: c.hex, width: 26, height: 26 }}
                title={t(c.ar, c.en)}
                onClick={() => setInkColor(c.hex)}
              >
                {inkColor === c.hex && <Check size={12} color="#fff" />}
              </button>
            ))}
          </div>

          {mode === 'draw' && (
            <label className="cv-sig-thickness">
              <span>{t('سُمك القلم:', 'Pen Width:')}</span>
              <input
                type="range"
                min={1.5}
                max={5.5}
                step={0.5}
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
              />
            </label>
          )}
        </div>

        {mode === 'draw' ? (
          <div className="cv-sig-pad-frame">
            <canvas
              ref={canvasRef}
              width={560}
              height={190}
              data-testid="signature-canvas"
              className="cv-sig-canvas"
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerCancel={onUp}
            />
            <span className="cv-sig-baseline" aria-hidden="true" />
            <button
              type="button"
              className="cv-btn cv-sig-clear-btn"
              onClick={clearPad}
            >
              <Eraser size={13} />
              <span>{t('مسح الإعادة', 'Clear')}</span>
            </button>
          </div>
        ) : (
          <div className="cv-field">
            <label htmlFor="cv-sig-typed-input">{t('نص التوقيع', 'Signature Text')}</label>
            <input
              id="cv-sig-typed-input"
              type="text"
              data-testid="signature-typed-input"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
            />
            <div className="cv-sig-typed-preview" style={{ color: inkColor }}>
              <span>{typedName || 'Signature'}</span>
            </div>
          </div>
        )}

        <div className="cv-modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" className="cv-btn" onClick={onClose}>
            {t('إلغاء', 'Cancel')}
          </button>
          <button
            type="button"
            className="cv-btn primary"
            data-testid="insert-signature-btn"
            onClick={insertSignature}
          >
            <PenTool size={14} />
            <span>{t('إدراج التوقيع على الورقة', 'Insert Signature on Sheet')}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
