import React, { useEffect, useState } from 'react';
import { fabric } from 'fabric';
import {
  Box,
  Compass,
  FileDown,
  Layers,
  Maximize2,
  PackageCheck,
  QrCode,
  Recycle,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Tag,
} from 'lucide-react';
import {
  cartonError,
  cartonGeometry,
  MM_TO_PX,
  type CartonSize,
} from '../../../packaging/geometry';
import {
  formatSheetDims,
  formatUnitNumber,
  mmToUnit,
  unitShortLabel,
  unitToMm,
  type PackagingUnit,
} from '../../../packaging/units';
import { facePixels, faces, type PrintSettings } from '../../../advanced/core/faces';
import { useDcLang } from '../../../hooks/useDcLang';

interface CartonStudioTabProps {
  size: CartonSize;
  canvas: fabric.Canvas | null;
  printSettings: PrintSettings;
  onUpdatePrintSettings: (next: PrintSettings) => void;
  onResizeCarton: (next: CartonSize) => void;
  onOpenResizeModal: (unit: PackagingUnit) => void;
  onFocusFace: (faceIndex: number) => void;
  onOpen3D: () => void;
  onOpenPrint: () => void;
  onCanvasMutated: () => void;
}

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

export const CartonStudioTab: React.FC<CartonStudioTabProps> = ({
  size,
  canvas,
  printSettings,
  onUpdatePrintSettings,
  onResizeCarton,
  onOpenResizeModal,
  onFocusFace,
  onOpen3D,
  onOpenPrint,
  onCanvasMutated,
}) => {
  const { lang } = useDcLang();
  const ar = lang === 'ar';
  const hinged = size.construction === 'hinged-lid';

  // Default to cm ('سم') inside the Carton Studio sidebar for quick natural cm editing!
  const [unit, setUnit] = useState<PackagingUnit>('cm');
  const [draft, setDraft] = useState(() => ({
    height: formatUnitNumber(size.height, 'cm'),
    width: formatUnitNumber(size.width, 'cm'),
    depth: formatUnitNumber(size.depth, 'cm'),
  }));
  const [targetFaceIdx, setTargetFaceIdx] = useState<number>(0);
  const [statusMsg, setStatusMsg] = useState<string>('');

  // Keep draft synced when external resize / undo updates `size`
  useEffect(() => {
    setDraft({
      height: formatUnitNumber(size.height, unit),
      width: formatUnitNumber(size.width, unit),
      depth: formatUnitNumber(size.depth, unit),
    });
  }, [size.height, size.width, size.depth, unit]);

  const switchUnit = (nextUnit: PackagingUnit) => {
    if (nextUnit === unit) return;
    setDraft((prev) => {
      const convert = (raw: string) => {
        if (!raw || raw.trim() === '') return '';
        const n = Number(raw);
        if (!Number.isFinite(n)) return raw;
        return formatUnitNumber(unitToMm(n, unit), nextUnit);
      };
      return {
        height: convert(prev.height),
        width: convert(prev.width),
        depth: convert(prev.depth),
      };
    });
    setUnit(nextUnit);
  };

  const heightMm =
    draft.height.trim() === '' ? NaN : unitToMm(Number(draft.height), unit);
  const widthMm =
    draft.width.trim() === '' ? NaN : unitToMm(Number(draft.width), unit);
  const depthMm =
    draft.depth.trim() === '' ? NaN : unitToMm(Number(draft.depth), unit);

  const autoGlue = Number.isFinite(widthMm)
    ? clamp(size.glue, 5, Math.min(30, widthMm * 0.4))
    : size.glue;
  const autoTuck = hinged
    ? Number.isFinite(heightMm)
      ? clamp(size.tuck, 5, Math.min(30, heightMm * 0.7))
      : size.tuck
    : Number.isFinite(widthMm) && Number.isFinite(depthMm)
      ? clamp(size.tuck, 5, Math.min(30, depthMm * 0.6, widthMm * 0.25))
      : size.tuck;

  const candidateSize: CartonSize = {
    ...size,
    height: heightMm,
    width: widthMm,
    depth: depthMm,
    glue: Math.round(autoGlue * 100) / 100,
    tuck: Math.round(autoTuck * 100) / 100,
  };

  const issue = cartonError(candidateSize);
  const previewGeom = issue ? null : cartonGeometry(candidateSize);
  const cartonFaces = faces(size);

  const fieldDefs = hinged
    ? ([
        ['height', ar ? 'الارتفاع' : 'Height', 20, 150],
        ['width', ar ? 'العرض' : 'Width', 100, 650],
        ['depth', ar ? 'طول القاعدة' : 'Base length', 100, 650],
      ] as const)
    : ([
        ['height', ar ? 'الطول' : 'Length', 30, 500],
        ['width', ar ? 'العرض' : 'Width', 20, 300],
        ['depth', ar ? 'العمق' : 'Depth', 10, 150],
      ] as const);

  const errorText = issue
    ? unit === 'cm'
      ? hinged
        ? ar
          ? 'الارتفاع 2–15 سم، والعرض والقاعدة 10–65 سم.'
          : 'Height 2–15 cm; width & base 10–65 cm.'
        : ar
          ? 'الطول 3–50 سم، العرض 2–30 سم، والعمق 1–15 سم.'
          : 'Length 3–50 cm, width 2–30 cm, depth 1–15 cm.'
      : hinged
        ? ar
          ? 'الارتفاع 20–150 مم، والعرض والقاعدة 100–650 مم.'
          : 'Height 20–150 mm; width & base 100–650 mm.'
        : ar
          ? 'الطول 30–500 مم، العرض 20–300 مم، والعمق 10–150 مم.'
          : 'Length 30–500 mm, width 20–300 mm, depth 10–150 mm.'
    : '';

  const placeObjectOnFace = (
    obj: fabric.Object,
    faceIdx: number,
    verticalAnchor: 'center' | 'bottom' | 'top' = 'center'
  ) => {
    if (!canvas) return;
    const targetFace = cartonFaces[faceIdx] || cartonFaces[0];
    const fp = facePixels(targetFace);
    const pad = Math.max(8, 3.5 * MM_TO_PX);
    const maxW = Math.max(24, fp.width - pad * 2);
    const maxH = Math.max(24, fp.height - pad * 2);

    obj.set({ originX: 'center', originY: 'center' });
    const rawW = obj.getScaledWidth() || obj.width || 60;
    const rawH = obj.getScaledHeight() || obj.height || 40;
    const fitScale = Math.min(1, maxW / rawW, maxH / rawH);
    if (fitScale < 1) {
      obj.scale((obj.scaleX || 1) * fitScale);
    }

    const finalH = obj.getScaledHeight();
    const cx = fp.left + fp.width / 2;
    const cy =
      verticalAnchor === 'bottom'
        ? fp.top + fp.height - pad - finalH / 2
        : verticalAnchor === 'top'
          ? fp.top + pad + finalH / 2
          : fp.top + fp.height / 2;

    obj.set({ left: cx, top: cy });
    // Insert right below locked dieline guides so cut/fold lines stay visible on top
    const objs = canvas.getObjects();
    const firstGuideIdx = objs.findIndex(
      (o: any) => o.packagingRole === 'guide' || (o.selectable === false && o.evented === false)
    );
    canvas.add(obj);
    if (firstGuideIdx >= 0) {
      obj.moveTo(firstGuideIdx);
    }
    obj.setCoords();
    canvas.setActiveObject(obj);
    canvas.requestRenderAll();
    onCanvasMutated();
  };

  const addPackagingStamp = (
    kind: 'barcode' | 'recycle' | 'origin' | 'expiry' | 'capacity' | 'ingredients'
  ) => {
    if (!canvas) return;

    if (kind === 'barcode') {
      const barsPattern = [
        3, 1, 2, 2, 1, 3, 1, 1, 2, 3, 1, 2, 1, 2, 3, 1, 1, 2, 2, 1, 3, 1, 2, 1, 1, 3,
      ];
      const children: fabric.Object[] = [
        new fabric.Rect({
          left: 0,
          top: 0,
          width: 128,
          height: 68,
          rx: 5,
          ry: 5,
          fill: '#ffffff',
          stroke: '#1f2937',
          strokeWidth: 1,
        }),
      ];
      let cursor = 12;
      barsPattern.forEach((w, idx) => {
        if (idx % 2 === 0) {
          children.push(
            new fabric.Rect({
              left: cursor,
              top: 9,
              width: w * 1.55,
              height: idx === 0 || idx === 12 || idx === 24 ? 44 : 38,
              fill: '#111827',
            })
          );
        }
        cursor += w * 1.55 + 1.1;
      });
      children.push(
        new fabric.Text('6 221048 903127', {
          left: 64,
          top: 56,
          originX: 'center',
          originY: 'center',
          fontSize: 9.5,
          fontFamily: 'monospace',
          fontWeight: 'bold',
          fill: '#111827',
        })
      );
      const group = new fabric.Group(children, { name: ar ? 'باركود تجاري' : 'EAN-13 Barcode' });
      placeObjectOnFace(group, targetFaceIdx || 2, 'bottom');
      setStatusMsg(ar ? 'تمت إضافة الباركود على العلبة' : 'Barcode stamp placed on carton');
      return;
    }

    if (kind === 'recycle') {
      const group = new fabric.Group(
        [
          new fabric.Rect({
            left: 0,
            top: 0,
            width: 132,
            height: 44,
            rx: 8,
            ry: 8,
            fill: '#ecfdf5',
            stroke: '#1f6f57',
            strokeWidth: 1.2,
          }),
          new fabric.Text('♻  PAP 21 · KEEP DRY', {
            left: 66,
            top: 15,
            originX: 'center',
            originY: 'center',
            fontSize: 10,
            fontFamily: 'Arial',
            fontWeight: 'bold',
            fill: '#14532d',
          }),
          new fabric.Text(ar ? 'عبوة قابلة لإعادة التدوير' : '100% Recyclable Carton', {
            left: 66,
            top: 31,
            originX: 'center',
            originY: 'center',
            fontSize: 9.5,
            fontFamily: 'Cairo, Arial',
            fontWeight: '600',
            fill: '#1f6f57',
          }),
        ],
        { name: ar ? 'شعار إعادة التدوير' : 'Recycling mark' }
      );
      placeObjectOnFace(group, targetFaceIdx || 2, 'bottom');
      setStatusMsg(ar ? 'تمت إضافة شعار إعادة التدوير' : 'Recycling mark placed');
      return;
    }

    if (kind === 'origin') {
      const group = new fabric.Group(
        [
          new fabric.Circle({
            left: 0,
            top: 0,
            radius: 34,
            fill: '#f8faf9',
            stroke: '#24795e',
            strokeWidth: 2,
          }),
          new fabric.Circle({
            left: 4,
            top: 4,
            radius: 30,
            fill: 'transparent',
            stroke: '#24795e',
            strokeDashArray: [3, 2],
            strokeWidth: 1,
          }),
          new fabric.Text(ar ? 'صُنع في مصر' : 'PREMIUM', {
            left: 34,
            top: 25,
            originX: 'center',
            originY: 'center',
            fontSize: 10,
            fontFamily: 'Cairo, Arial',
            fontWeight: 'bold',
            fill: '#14532d',
          }),
          new fabric.Text('MADE IN EGYPT', {
            left: 34,
            top: 41,
            originX: 'center',
            originY: 'center',
            fontSize: 6.8,
            fontFamily: 'Arial',
            fontWeight: 'bold',
            fill: '#24795e',
          }),
        ],
        { name: ar ? 'ختم المنشأ والجودة' : 'Origin quality seal' }
      );
      placeObjectOnFace(group, targetFaceIdx, 'bottom');
      setStatusMsg(ar ? 'تمت إضافة ختم المنشأ والجودة' : 'Origin seal placed');
      return;
    }

    if (kind === 'expiry') {
      const box = new fabric.Textbox(
        ar
          ? 'تاريخ الإنتاج PROD: 11 / 2026\nتاريخ الانتهاء EXP: 11 / 2029\nرقم التشغيلة LOT: UT-2026'
          : 'PROD: 11 / 2026\nEXP:  11 / 2029\nLOT:  UT-2026',
        {
          width: 145,
          fontSize: 10,
          lineHeight: 1.35,
          fontFamily: ar ? 'Cairo, Arial' : 'monospace',
          fontWeight: '600',
          fill: '#1f2937',
          backgroundColor: 'rgba(255,255,255,0.88)',
          textAlign: ar ? 'right' : 'left',
          padding: 6,
          name: ar ? 'بيانات الإنتاج والصلاحية' : 'PROD / EXP / LOT',
        }
      );
      placeObjectOnFace(box, targetFaceIdx || 5, 'center');
      setStatusMsg(ar ? 'تمت إضافة بيانات الإنتاج والصلاحية' : 'Batch & expiry block placed');
      return;
    }

    if (kind === 'capacity') {
      const box = new fabric.Textbox('100 ML · e 3.4 FL.OZ', {
        width: 135,
        fontSize: 11.5,
        fontFamily: 'Arial',
        fontWeight: 'bold',
        charSpacing: 80,
        fill: '#14532d',
        textAlign: 'center',
        name: ar ? 'شارة السعة والوزن الصافي' : 'Net volume badge',
      });
      placeObjectOnFace(box, targetFaceIdx, 'bottom');
      setStatusMsg(ar ? 'تمت إضافة شارة السعة الصافية' : 'Net capacity badge placed');
      return;
    }

    if (kind === 'ingredients') {
      const box = new fabric.Textbox(
        ar
          ? 'المكونات وطريقة الحفظ:\nمكونات طبيعية مختارة بعناية. يُحفظ في مكان بارد وجاف بعيدًا عن أشعة الشمس المباشرة.'
          : 'INGREDIENTS & CARE:\nCarefully formulated ingredients. Store in a cool, dry place away from direct sunlight.',
        {
          width: 155,
          fontSize: 9.5,
          lineHeight: 1.4,
          fontFamily: ar ? 'Cairo, Arial' : 'Arial',
          fill: '#334155',
          textAlign: ar ? 'right' : 'left',
          name: ar ? 'بطاقة المكونات والتحذيرات' : 'Ingredients & care block',
        }
      );
      placeObjectOnFace(box, targetFaceIdx || 2, 'center');
      setStatusMsg(ar ? 'تمت إضافة بطاقة المكونات' : 'Ingredients block placed');
    }
  };

  return (
    <div
      className="dc-carton-studio-tab"
      data-testid="carton-studio-tab"
      dir={ar ? 'rtl' : 'ltr'}
    >
      {/* Header Banner */}
      <div className="dc-carton-tab-hero">
        <div className="dc-carton-tab-hero__badge">
          <Box className="w-4 h-4" />
          <span>{ar ? 'استوديو العلب والتغليف' : 'Boxes & Packaging Studio'}</span>
        </div>
        <p className="dc-carton-tab-hero__desc">
          {ar
            ? 'عدّل مقاسات العلبة بالـ سم أو المم مباشرةً، تنقّل بين الأوجه الستة، وأضف ملصقات التغليف القياسية.'
            : 'Edit carton dimensions live in cm or mm, target any of the 6 faces, and stamp packaging marks.'}
        </p>
      </div>

      {/* 1. Live cm / mm Dimension Editor */}
      <section className="dc-carton-tab-card" aria-label={ar ? 'مقاسات العلبة' : 'Carton dimensions'}>
        <div className="dc-carton-tab-card__head">
          <div className="dc-carton-tab-card__title">
            <Maximize2 className="w-3.5 h-3.5" />
            <span>{ar ? 'مقاسات العلبة في التعديل' : 'Live Box Dimensions'}</span>
          </div>
          <div
            className="carton-unit-switch carton-unit-switch--compact"
            role="group"
            data-testid="carton-sidebar-unit-toggle"
            aria-label={ar ? 'وحدة قياس التعديل' : 'Edit unit'}
          >
            {(['cm', 'mm'] as const).map((u) => (
              <button
                key={u}
                type="button"
                aria-pressed={unit === u}
                data-testid={`sidebar-unit-${u}`}
                onClick={() => switchUnit(u)}
              >
                {u === 'cm' ? (ar ? 'سم' : 'cm') : ar ? 'مم' : 'mm'}
              </button>
            ))}
          </div>
        </div>

        <div className="dc-carton-dim-grid">
          {fieldDefs.map(([key, label, minMm, maxMm]) => (
            <label key={key} className="dc-carton-dim-field">
              <span>
                {label} ({unitShortLabel(unit, ar)})
              </span>
              <input
                type="number"
                step="0.01"
                min={mmToUnit(minMm, unit)}
                max={mmToUnit(maxMm, unit)}
                data-testid={`sidebar-dim-${key}`}
                aria-label={`${label} (${unitShortLabel(unit, ar)})`}
                value={draft[key]}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, [key]: e.target.value }))
                }
              />
            </label>
          ))}
        </div>

        {previewGeom && (
          <div className="dc-carton-sheet-pill" dir="ltr">
            <span>{ar ? 'المفرود:' : 'Sheet:'}</span>
            <strong>{formatSheetDims(previewGeom.width, previewGeom.height, unit, ar)}</strong>
          </div>
        )}

        {errorText && (
          <p role="alert" className="dc-carton-inline-error">
            {errorText}
          </p>
        )}

        <div className="dc-carton-dim-actions">
          <button
            type="button"
            className="dc-carton-apply-btn"
            data-testid="carton-sidebar-apply-size"
            disabled={!!issue}
            onClick={() => {
              if (issue) return;
              onResizeCarton(candidateSize);
              setStatusMsg(
                ar
                  ? `تم تحديث مقاس العلبة (${formatUnitNumber(candidateSize.height, 'cm')} × ${formatUnitNumber(candidateSize.width, 'cm')} × ${formatUnitNumber(candidateSize.depth, 'cm')} سم)`
                  : 'Carton dimensions updated'
              );
            }}
          >
            {ar ? 'تطبيق المقاس الجديد' : 'Apply new size'}
          </button>
          <button
            type="button"
            className="dc-carton-secondary-btn"
            onClick={() => onOpenResizeModal(unit)}
            title={ar ? 'تعديل متقدم للألسنة والطي' : 'Advanced flap & tab resize'}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{ar ? 'الألسنة' : 'Flaps'}</span>
          </button>
        </div>
      </section>

      {/* 2. Interactive 6-Face Navigator */}
      <section className="dc-carton-tab-card" aria-label={ar ? 'أوجه العلبة' : 'Carton faces'}>
        <div className="dc-carton-tab-card__head">
          <div className="dc-carton-tab-card__title">
            <Compass className="w-3.5 h-3.5" />
            <span>{ar ? 'أوجه العلبة الستة' : '6 Carton Faces'}</span>
          </div>
          <small className="dc-carton-tab-card__hint">
            {ar ? 'انقر لتوجيه العنصر' : 'Click to target face'}
          </small>
        </div>

        <div className="dc-carton-faces-grid">
          {cartonFaces.map((face, idx) => {
            const isSelected = targetFaceIdx === idx;
            return (
              <button
                key={face.id}
                type="button"
                data-testid={`carton-face-btn-${face.id}`}
                aria-pressed={isSelected}
                className={`dc-carton-face-btn ${isSelected ? 'is-active' : ''}`}
                onClick={() => {
                  setTargetFaceIdx(idx);
                  onFocusFace(idx);
                }}
              >
                <span className="dc-carton-face-btn__name">
                  {ar ? face.ar : face.en}
                </span>
                <span className="dc-carton-face-btn__dims" dir="ltr">
                  {formatUnitNumber(face.width, unit)} × {formatUnitNumber(face.height, unit)}{' '}
                  {unitShortLabel(unit, ar)}
                </span>
              </button>
            );
          })}
        </div>

        <label className="dc-carton-guide-toggle">
          <input
            type="checkbox"
            checked={printSettings.showGuides}
            onChange={(e) =>
              onUpdatePrintSettings({
                ...printSettings,
                showGuides: e.target.checked,
              })
            }
          />
          <span>
            {ar
              ? `إظهار حدود الأوجه وهامش الأمان (${printSettings.safeMm} مم)`
              : `Show face bounds & safe zone (${printSettings.safeMm} mm)`}
          </span>
        </label>
      </section>

      {/* 3. Ready Packaging Marks & Stamps */}
      <section
        className="dc-carton-tab-card"
        aria-label={ar ? 'ملصقات ورموز التغليف' : 'Packaging stamps & marks'}
      >
        <div className="dc-carton-tab-card__head">
          <div className="dc-carton-tab-card__title">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{ar ? 'رموز وملصقات العلب الجاهزة' : 'Packaging Marks & Stamps'}</span>
          </div>
          <small className="dc-carton-tab-card__hint">
            {ar
              ? `على: ${cartonFaces[targetFaceIdx]?.ar || 'الأمام'}`
              : `On: ${cartonFaces[targetFaceIdx]?.en || 'Front'}`}
          </small>
        </div>

        <div className="dc-carton-stamps-grid">
          <button
            type="button"
            data-testid="stamp-barcode"
            className="dc-carton-stamp-btn"
            onClick={() => addPackagingStamp('barcode')}
          >
            <QrCode className="w-4 h-4" />
            <div>
              <strong>{ar ? 'باركود EAN-13' : 'EAN-13 Barcode'}</strong>
              <small>{ar ? 'كود تجاري قابل للتعديل' : 'Editable retail barcode'}</small>
            </div>
          </button>

          <button
            type="button"
            data-testid="stamp-recycle"
            className="dc-carton-stamp-btn"
            onClick={() => addPackagingStamp('recycle')}
          >
            <Recycle className="w-4 h-4" />
            <div>
              <strong>{ar ? 'إعادة التدوير' : 'Recycling PAP 21'}</strong>
              <small>{ar ? 'رمز التدوير والعناية' : 'Eco & keep-dry badge'}</small>
            </div>
          </button>

          <button
            type="button"
            data-testid="stamp-origin"
            className="dc-carton-stamp-btn"
            onClick={() => addPackagingStamp('origin')}
          >
            <ShieldCheck className="w-4 h-4" />
            <div>
              <strong>{ar ? 'ختم المنشأ والجودة' : 'Origin Seal'}</strong>
              <small>{ar ? 'صُنع في مصر · ختم دائري' : 'Made in Egypt badge'}</small>
            </div>
          </button>

          <button
            type="button"
            data-testid="stamp-expiry"
            className="dc-carton-stamp-btn"
            onClick={() => addPackagingStamp('expiry')}
          >
            <PackageCheck className="w-4 h-4" />
            <div>
              <strong>{ar ? 'إنتاج وصلاحية' : 'PROD / EXP / LOT'}</strong>
              <small>{ar ? 'جدول التشغيلة والتاريخ' : 'Batch & expiry block'}</small>
            </div>
          </button>

          <button
            type="button"
            data-testid="stamp-capacity"
            className="dc-carton-stamp-btn"
            onClick={() => addPackagingStamp('capacity')}
          >
            <Tag className="w-4 h-4" />
            <div>
              <strong>{ar ? 'السعة والوزن الصافي' : 'Net Volume'}</strong>
              <small>100 ML · e 3.4 FL.OZ</small>
            </div>
          </button>

          <button
            type="button"
            data-testid="stamp-ingredients"
            className="dc-carton-stamp-btn"
            onClick={() => addPackagingStamp('ingredients')}
          >
            <Layers className="w-4 h-4" />
            <div>
              <strong>{ar ? 'بطاقة المكونات' : 'Ingredients Block'}</strong>
              <small>{ar ? 'المكونات وطريقة الحفظ' : 'Formula & storage text'}</small>
            </div>
          </button>
        </div>
      </section>

      {/* 4. Quick 3D & Print Production Shortcuts */}
      <div className="dc-carton-quick-footer">
        <button type="button" className="dc-carton-secondary-btn" onClick={onOpen3D}>
          <Box className="w-3.5 h-3.5" />
          <span>{ar ? 'معاينة 3D تفاعلية' : '3D Folded Preview'}</span>
        </button>
        <button type="button" className="dc-carton-apply-btn" onClick={onOpenPrint}>
          <FileDown className="w-3.5 h-3.5" />
          <span>{ar ? 'ملف المطبعة والقص' : 'Print & Dieline Export'}</span>
        </button>
      </div>

      {statusMsg && (
        <p role="status" className="dc-carton-status-toast">
          {statusMsg}
        </p>
      )}
    </div>
  );
};
