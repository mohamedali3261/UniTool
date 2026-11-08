import { useRef } from 'react';
import QRCode from 'qrcode';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  Bold,
  ChevronsDown,
  ChevronsUp,
  Copy,
  Eye,
  EyeOff,
  FlipHorizontal2,
  FlipVertical2,
  ImagePlus,
  Italic,
  Layers,
  Lock,
  RotateCcw,
  Trash2,
  Underline,
  Unlock,
} from 'lucide-react';
import { useCvStudio } from '../../../app/context';
import { getPaperSectionTitle } from '../../../core/i18n';
import type {
  BlockOverrideStyle,
  CanvasDividerKind,
  CanvasElement,
  CanvasShapeKind,
  ImageFilterSettings,
  ImageFrameShape,
} from '../../../core/types';
import { CV_COLOR_SWATCHES, CV_FONTS } from '../../../data/themes';
import {
  DEFAULT_IMAGE_FILTERS,
  IMAGE_FILTER_PRESETS,
  mergeImageFilters,
  nextElementZIndex,
} from './canvasDefaults';
import { CANVAS_ICON_LIST } from './CanvasShapeSvg';

const IMAGE_SHAPES: { id: ImageFrameShape; ar: string; en: string }[] = [
  { id: 'circle', ar: 'دائري', en: 'Circle' },
  { id: 'rounded', ar: 'مربع ناعم', en: 'Rounded' },
  { id: 'square', ar: 'مستطيل حاد', en: 'Square' },
  { id: 'arch', ar: 'قوس علوي', en: 'Arch' },
  { id: 'hexagon', ar: 'سداسي', en: 'Hexagon' },
  { id: 'diamond', ar: 'معين', en: 'Diamond' },
];

const SHAPE_OPTIONS: { id: CanvasShapeKind; ar: string; en: string }[] = [
  { id: 'rect', ar: 'مستطيل', en: 'Rectangle' },
  { id: 'rounded', ar: 'بطاقة ناعمة', en: 'Rounded' },
  { id: 'pill', ar: 'كبسولة', en: 'Pill' },
  { id: 'circle', ar: 'دائرة', en: 'Circle' },
  { id: 'ring', ar: 'حلقة', en: 'Ring' },
  { id: 'triangle', ar: 'مثلث', en: 'Triangle' },
  { id: 'diamond', ar: 'معين', en: 'Diamond' },
  { id: 'hexagon', ar: 'سداسي', en: 'Hexagon' },
  { id: 'star', ar: 'نجمة', en: 'Star' },
  { id: 'banner', ar: 'شريط بانر', en: 'Banner' },
];

function ImageFiltersEditor({
  filters,
  shape,
  borderRadius,
  borderWidth,
  borderColor,
  shadow,
  onChangeFilters,
  onChangeShape,
  onChangeRadius,
  onChangeBorderWidth,
  onChangeBorderColor,
  onChangeShadow,
  onReplaceFile,
  t,
}: {
  filters?: Partial<ImageFilterSettings>;
  shape: ImageFrameShape;
  borderRadius?: number;
  borderWidth: number;
  borderColor: string;
  shadow: boolean;
  onChangeFilters: (next: ImageFilterSettings) => void;
  onChangeShape: (s: ImageFrameShape) => void;
  onChangeRadius?: (r: number) => void;
  onChangeBorderWidth: (w: number) => void;
  onChangeBorderColor: (c: string) => void;
  onChangeShadow: (s: boolean) => void;
  onReplaceFile: (file: File) => void;
  t: (ar: string, en: string) => string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const f = mergeImageFilters(filters);

  const patchF = (partial: Partial<ImageFilterSettings>) => {
    onChangeFilters({ ...f, ...partial });
  };

  return (
    <div className="cv-inspector-sub">
      <div className="cv-photo-btn-row">
        <button type="button" className="cv-btn" onClick={() => fileRef.current?.click()}>
          <ImagePlus size={14} />
          <span>{t('استبدال الصورة', 'Replace Image')}</span>
        </button>
        <button
          type="button"
          className={`cv-btn ${f.flipX ? 'soft' : ''}`}
          onClick={() => patchF({ flipX: !f.flipX })}
          title={t('قلب أفقي', 'Flip Horizontal')}
        >
          <FlipHorizontal2 size={14} />
          <span>{t('قلب أفقي', 'Flip X')}</span>
        </button>
        <button
          type="button"
          className={`cv-btn ${f.flipY ? 'soft' : ''}`}
          onClick={() => patchF({ flipY: !f.flipY })}
          title={t('قلب رأسي', 'Flip Vertical')}
        >
          <FlipVertical2 size={14} />
          <span>{t('قلب رأسي', 'Flip Y')}</span>
        </button>
        <button
          type="button"
          className="cv-btn"
          onClick={() => onChangeFilters({ ...DEFAULT_IMAGE_FILTERS })}
        >
          <RotateCcw size={13} />
          <span>{t('إعادة ضبط الفلاتر', 'Reset')}</span>
        </button>
        <input
          hidden
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) onReplaceFile(file);
          }}
        />
      </div>

      {/* Frame Shape */}
      <div className="cv-field">
        <label>{t('شكل إطار الصورة (Mask)', 'Image Frame Shape')}</label>
        <div className="cv-chip-row">
          {IMAGE_SHAPES.map((sh) => (
            <button
              key={sh.id}
              type="button"
              data-testid={`img-shape-${sh.id}`}
              className={`cv-chip ${shape === sh.id ? 'active' : ''}`}
              onClick={() => onChangeShape(sh.id)}
            >
              {t(sh.ar, sh.en)}
            </button>
          ))}
        </div>
      </div>

      {shape === 'rounded' && onChangeRadius && (
        <div className="cv-field">
          <label>
            {t('استدارة الحواف', 'Corner Radius')}: {borderRadius ?? 16}px
          </label>
          <input
            type="range"
            min={0}
            max={80}
            value={borderRadius ?? 16}
            onChange={(e) => onChangeRadius(Number(e.target.value))}
          />
        </div>
      )}

      {/* Crop / Zoom / Pan */}
      <div className="cv-grid-3">
        <div className="cv-field">
          <label>
            {t('تكبير داخلي', 'Crop Zoom')}: {Math.round(f.zoom * 100)}%
          </label>
          <input
            type="range"
            min={100}
            max={280}
            value={Math.round(f.zoom * 100)}
            onChange={(e) => patchF({ zoom: Number(e.target.value) / 100 })}
          />
        </div>
        <div className="cv-field">
          <label>
            {t('إزاحة أفقية', 'Pan X')}: {f.panX}%
          </label>
          <input
            type="range"
            min={-60}
            max={60}
            value={f.panX}
            onChange={(e) => patchF({ panX: Number(e.target.value) })}
          />
        </div>
        <div className="cv-field">
          <label>
            {t('إزاحة رأسية', 'Pan Y')}: {f.panY}%
          </label>
          <input
            type="range"
            min={-60}
            max={60}
            value={f.panY}
            onChange={(e) => patchF({ panY: Number(e.target.value) })}
          />
        </div>
      </div>

      {/* Filter Presets */}
      <div className="cv-field">
        <label>{t('فلاتر جاهزة بلمسة واحدة', 'Instant Filter Presets')}</label>
        <div className="cv-chip-row">
          {IMAGE_FILTER_PRESETS.map((pr) => (
            <button
              key={pr.id}
              type="button"
              data-testid={`img-filter-preset-${pr.id}`}
              className="cv-chip"
              onClick={() => patchF(pr.values)}
            >
              {t(pr.labelAr, pr.labelEn)}
            </button>
          ))}
        </div>
      </div>

      {/* Fine Filter Sliders */}
      <div className="cv-grid-2">
        <div className="cv-field">
          <label>
            {t('السطوع (Brightness)', 'Brightness')}: {f.brightness}%
          </label>
          <input
            type="range"
            min={55}
            max={145}
            value={f.brightness}
            onChange={(e) => patchF({ brightness: Number(e.target.value) })}
          />
        </div>
        <div className="cv-field">
          <label>
            {t('التباين (Contrast)', 'Contrast')}: {f.contrast}%
          </label>
          <input
            type="range"
            min={55}
            max={150}
            value={f.contrast}
            onChange={(e) => patchF({ contrast: Number(e.target.value) })}
          />
        </div>
        <div className="cv-field">
          <label>
            {t('التشبع اللوني', 'Saturation')}: {f.saturate}%
          </label>
          <input
            type="range"
            min={0}
            max={190}
            value={f.saturate}
            onChange={(e) => patchF({ saturate: Number(e.target.value) })}
          />
        </div>
        <div className="cv-field">
          <label>
            {t('أبيض وأسود (Grayscale)', 'Grayscale')}: {f.grayscale}%
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={f.grayscale}
            onChange={(e) => patchF({ grayscale: Number(e.target.value) })}
          />
        </div>
        <div className="cv-field">
          <label>
            {t('دفء لوني (Sepia)', 'Warmth / Sepia')}: {f.sepia}%
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={f.sepia}
            onChange={(e) => patchF({ sepia: Number(e.target.value) })}
          />
        </div>
        <div className="cv-field">
          <label>
            {t('نعومة / تمويه (Blur)', 'Blur')}: {f.blur}px
          </label>
          <input
            type="range"
            min={0}
            max={8}
            step={0.5}
            value={f.blur}
            onChange={(e) => patchF({ blur: Number(e.target.value) })}
          />
        </div>
      </div>

      {/* Border & Shadow */}
      <div className="cv-grid-2">
        <div className="cv-field">
          <label>
            {t('سُمك الإطار', 'Border Width')}: {borderWidth}px
          </label>
          <input
            type="range"
            min={0}
            max={10}
            value={borderWidth}
            onChange={(e) => onChangeBorderWidth(Number(e.target.value))}
          />
        </div>
        <div className="cv-field">
          <label>{t('لون الإطار', 'Border Color')}</label>
          <div className="cv-color-inline">
            <input
              type="color"
              value={borderColor.startsWith('#') ? borderColor.slice(0, 7) : '#24795e'}
              onChange={(e) => onChangeBorderColor(e.target.value)}
            />
            <label className="cv-inline-check">
              <input
                type="checkbox"
                checked={shadow}
                onChange={(e) => onChangeShadow(e.target.checked)}
              />
              <span>{t('ظل هادئ', 'Drop Shadow')}</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LayersAndInspectorPanel() {
  const { resume, updateResume, canvasSelection, setCanvasSelection, notify, t } = useCvStudio();
  const elements = resume.canvasElements || [];
  const sortedLayers = [...elements].sort((a, b) => (b.zIndex || 1) - (a.zIndex || 1));

  const selectedEl =
    canvasSelection?.kind === 'element'
      ? elements.find((e) => e.id === canvasSelection.id) || null
      : null;

  const selectedBlockKey =
    canvasSelection?.kind === 'block' ? canvasSelection.blockKey : null;
  const selectedBlockOverride: BlockOverrideStyle = selectedBlockKey
    ? resume.blockStyles?.[selectedBlockKey] || {}
    : {};

  const patchSelectedEl = (patch: Partial<CanvasElement>) => {
    if (!selectedEl) return;
    updateResume((prev) => ({
      ...prev,
      canvasElements: (prev.canvasElements || []).map((item) =>
        item.id === selectedEl.id ? { ...item, ...patch } : item,
      ),
    }));
  };

  const patchBlockStyle = (blockKey: string, patch: Partial<BlockOverrideStyle>) => {
    updateResume((prev) => ({
      ...prev,
      blockStyles: {
        ...(prev.blockStyles || {}),
        [blockKey]: {
          ...(prev.blockStyles?.[blockKey] || {}),
          ...patch,
        },
      },
    }));
  };

  const resetBlockStyle = (blockKey: string) => {
    updateResume((prev) => {
      const next = { ...(prev.blockStyles || {}) };
      delete next[blockKey];
      return { ...prev, blockStyles: next };
    });
    notify(t('تمت استعادة الإعدادات والموضع الأصلي للقسم', 'Block position and style reset'));
  };

  const reorderLayerZ = (id: string, action: 'front' | 'up' | 'down' | 'back') => {
    updateResume((prev) => {
      const list = [...(prev.canvasElements || [])].sort((a, b) => (a.zIndex || 1) - (b.zIndex || 1));
      const idx = list.findIndex((e) => e.id === id);
      if (idx === -1) return prev;
      const [item] = list.splice(idx, 1);
      if (action === 'front') list.push(item);
      else if (action === 'back') list.unshift(item);
      else if (action === 'up') list.splice(Math.min(list.length, idx + 1), 0, item);
      else list.splice(Math.max(0, idx - 1), 0, item);

      const normalized = list.map((el, i) => ({ ...el, zIndex: (i + 1) * 5 }));
      return { ...prev, canvasElements: normalized };
    });
  };

  const duplicateLayer = (el: CanvasElement) => {
    const newId = `${el.type}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    updateResume((prev) => {
      const list = prev.canvasElements || [];
      const copy: CanvasElement = {
        ...JSON.parse(JSON.stringify(el)),
        id: newId,
        name: `${el.name} (نسخة)`,
        x: el.x + 16,
        y: el.y + 16,
        locked: false,
        zIndex: nextElementZIndex(list),
      };
      return { ...prev, canvasElements: [...list, copy] };
    });
    setCanvasSelection({ kind: 'element', id: newId });
  };

  const deleteLayer = (id: string) => {
    updateResume((prev) => ({
      ...prev,
      canvasElements: (prev.canvasElements || []).filter((e) => e.id !== id),
    }));
    if (canvasSelection?.kind === 'element' && canvasSelection.id === id) {
      setCanvasSelection(null);
    }
  };

  const moveTemplateSection = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= resume.sections.length) return;
    updateResume((prev) => {
      const next = [...prev.sections];
      const [moved] = next.splice(index, 1);
      next.splice(target, 0, moved);
      return { ...prev, sections: next };
    });
  };

  const handleUpdateQrUrl = async (nextUrl: string) => {
    patchSelectedEl({ qrText: nextUrl });
    if (!nextUrl.trim()) return;
    try {
      const dataUrl = await QRCode.toDataURL(nextUrl.trim(), {
        width: 240,
        margin: 1,
        color: {
          dark: resume.design.accentColor || '#111827',
          light: '#ffffff',
        },
      });
      patchSelectedEl({ qrText: nextUrl, src: dataUrl });
    } catch {
      /* ignore invalid intermediate URL */
    }
  };

  return (
    <div className="cv-section-stack" data-testid="cv-layers-inspector-panel">
      {/* Selected Freeform Element Inspector */}
      {selectedEl && (
        <div className="cv-section-card cv-inspector-card" data-testid="selected-element-inspector">
          <div className="cv-section-head">
            <div>
              <h3>{t('خصائص العنصر المحدد', 'Selected Element Properties')}</h3>
              <p>{selectedEl.name}</p>
            </div>
            <div className="cv-order-actions">
              <button
                type="button"
                className="cv-icon-btn"
                title={t('تكرار', 'Duplicate')}
                onClick={() => duplicateLayer(selectedEl)}
              >
                <Copy size={14} />
              </button>
              <button
                type="button"
                className="cv-icon-btn"
                title={selectedEl.locked ? t('فك القفل', 'Unlock') : t('قفل', 'Lock')}
                onClick={() => patchSelectedEl({ locked: !selectedEl.locked })}
              >
                {selectedEl.locked ? <Lock size={14} /> : <Unlock size={14} />}
              </button>
              {!selectedEl.locked && (
                <button
                  type="button"
                  className="cv-icon-btn"
                  title={t('حذف العنصر', 'Delete')}
                  onClick={() => deleteLayer(selectedEl.id)}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Layer Name & Plane */}
          <div className="cv-grid-2">
            <div className="cv-field">
              <label>{t('اسم الطبقة', 'Layer Name')}</label>
              <input
                type="text"
                value={selectedEl.name}
                onChange={(e) => patchSelectedEl({ name: e.target.value })}
              />
            </div>
            <div className="cv-field">
              <label>{t('موضع الطبقة من النص', 'Layer Plane')}</label>
              <select
                value={selectedEl.layerPlane}
                onChange={(e) =>
                  patchSelectedEl({ layerPlane: e.target.value as 'underlay' | 'overlay' })
                }
              >
                <option value="overlay">{t('فوق محتوى السيرة (أمامي)', 'Above CV Text (Overlay)')}</option>
                <option value="underlay">{t('خلف محتوى السيرة (خلفية)', 'Behind CV Text (Underlay)')}</option>
              </select>
            </div>
          </div>

          {/* Quick Page Alignment Bar */}
          <div className="cv-field">
            <label>{t('محاذاة سريعة بالصفحة', 'Quick Page Alignment')}</label>
            <div className="cv-chip-row">
              <button
                type="button"
                className="cv-chip"
                onClick={() => patchSelectedEl({ x: 48 })}
              >
                {t('أقصى اليسار', 'Left Edge')}
              </button>
              <button
                type="button"
                className="cv-chip"
                data-testid="align-el-center-x"
                onClick={() =>
                  patchSelectedEl({
                    x: Math.round(((resume.design.paperSize === 'letter' ? 816 : 794) - selectedEl.width) / 2),
                  })
                }
              >
                {t('توسيط أفقي', 'Center X')}
              </button>
              <button
                type="button"
                className="cv-chip"
                onClick={() =>
                  patchSelectedEl({
                    x: Math.round((resume.design.paperSize === 'letter' ? 816 : 794) - selectedEl.width - 48),
                  })
                }
              >
                {t('أقصى اليمين', 'Right Edge')}
              </button>
              <button
                type="button"
                className="cv-chip"
                onClick={() =>
                  patchSelectedEl({
                    y: Math.round(((resume.design.paperSize === 'letter' ? 1056 : 1123) - selectedEl.height) / 2),
                  })
                }
              >
                {t('توسيط رأسي', 'Center Y')}
              </button>
            </div>
          </div>

          {/* Geometry: X, Y, W, H, Rotation, Opacity */}
          <div className="cv-grid-4">
            <div className="cv-field">
              <label>X (px)</label>
              <input
                type="number"
                value={selectedEl.x}
                onChange={(e) => patchSelectedEl({ x: Number(e.target.value) || 0 })}
              />
            </div>
            <div className="cv-field">
              <label>Y (px)</label>
              <input
                type="number"
                value={selectedEl.y}
                onChange={(e) => patchSelectedEl({ y: Number(e.target.value) || 0 })}
              />
            </div>
            <div className="cv-field">
              <label>{t('العرض W', 'Width')}</label>
              <input
                type="number"
                min={20}
                value={selectedEl.width}
                onChange={(e) => patchSelectedEl({ width: Math.max(20, Number(e.target.value) || 20) })}
              />
            </div>
            <div className="cv-field">
              <label>{t('الارتفاع H', 'Height')}</label>
              <input
                type="number"
                min={16}
                value={selectedEl.height}
                onChange={(e) => patchSelectedEl({ height: Math.max(16, Number(e.target.value) || 16) })}
              />
            </div>
          </div>

          <div className="cv-grid-2">
            <div className="cv-field">
              <label>
                {t('الدوران (Rotation)', 'Rotation')}: {selectedEl.rotation || 0}°
              </label>
              <input
                type="range"
                min={-180}
                max={180}
                value={selectedEl.rotation || 0}
                onChange={(e) => patchSelectedEl({ rotation: Number(e.target.value) })}
              />
            </div>
            <div className="cv-field">
              <label>
                {t('الشفافية (Opacity)', 'Opacity')}: {Math.round((selectedEl.opacity ?? 1) * 100)}%
              </label>
              <input
                type="range"
                min={10}
                max={100}
                value={Math.round((selectedEl.opacity ?? 1) * 100)}
                onChange={(e) => patchSelectedEl({ opacity: Number(e.target.value) / 100 })}
              />
            </div>
          </div>

          {/* TEXT / BADGE SPECIFIC CONTROLS */}
          {(selectedEl.type === 'text' || selectedEl.type === 'badge') && (
            <div className="cv-inspector-sub">
              <div className="cv-field">
                <label>{t('محتوى النص', 'Text Content')}</label>
                <textarea
                  rows={selectedEl.type === 'badge' ? 2 : 3}
                  data-testid="inspector-text-content"
                  value={selectedEl.text || ''}
                  onChange={(e) => patchSelectedEl({ text: e.target.value })}
                />
              </div>

              <div className="cv-grid-2">
                <div className="cv-field">
                  <label>{t('نوع الخط', 'Font Family')}</label>
                  <select
                    value={selectedEl.fontFamily || resume.design.fontFamily}
                    onChange={(e) => patchSelectedEl({ fontFamily: e.target.value })}
                  >
                    {CV_FONTS.map((f) => (
                      <option key={f.id} value={f.id}>
                        {t(f.labelAr, f.labelEn)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="cv-field">
                  <label>
                    {t('حجم الخط', 'Font Size')}: {selectedEl.fontSize || 14}px
                  </label>
                  <input
                    type="range"
                    min={9}
                    max={58}
                    data-testid="inspector-font-size"
                    value={selectedEl.fontSize || 14}
                    onChange={(e) => patchSelectedEl({ fontSize: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="cv-text-format-bar">
                <button
                  type="button"
                  className={`cv-icon-btn ${(selectedEl.fontWeight || 400) >= 700 ? 'active-fmt' : ''}`}
                  title={t('عريض (Bold)', 'Bold')}
                  onClick={() =>
                    patchSelectedEl({ fontWeight: (selectedEl.fontWeight || 400) >= 700 ? 400 : 700 })
                  }
                >
                  <Bold size={14} />
                </button>
                <button
                  type="button"
                  className={`cv-icon-btn ${selectedEl.fontStyle === 'italic' ? 'active-fmt' : ''}`}
                  title={t('مائل (Italic)', 'Italic')}
                  onClick={() =>
                    patchSelectedEl({
                      fontStyle: selectedEl.fontStyle === 'italic' ? 'normal' : 'italic',
                    })
                  }
                >
                  <Italic size={14} />
                </button>
                <button
                  type="button"
                  className={`cv-icon-btn ${selectedEl.textDecoration === 'underline' ? 'active-fmt' : ''}`}
                  title={t('تسطير (Underline)', 'Underline')}
                  onClick={() =>
                    patchSelectedEl({
                      textDecoration: selectedEl.textDecoration === 'underline' ? 'none' : 'underline',
                    })
                  }
                >
                  <Underline size={14} />
                </button>

                <span className="cv-fmt-sep" />

                <button
                  type="button"
                  className={`cv-icon-btn ${selectedEl.textAlign === 'right' ? 'active-fmt' : ''}`}
                  onClick={() => patchSelectedEl({ textAlign: 'right' })}
                  title={t('محاذاة لليمين', 'Align Right')}
                >
                  <AlignRight size={14} />
                </button>
                <button
                  type="button"
                  className={`cv-icon-btn ${selectedEl.textAlign === 'center' ? 'active-fmt' : ''}`}
                  onClick={() => patchSelectedEl({ textAlign: 'center' })}
                  title={t('توسيط', 'Align Center')}
                >
                  <AlignCenter size={14} />
                </button>
                <button
                  type="button"
                  className={`cv-icon-btn ${selectedEl.textAlign === 'left' ? 'active-fmt' : ''}`}
                  onClick={() => patchSelectedEl({ textAlign: 'left' })}
                  title={t('محاذاة لليسار', 'Align Left')}
                >
                  <AlignLeft size={14} />
                </button>

                <span className="cv-fmt-sep" />

                <button
                  type="button"
                  className={`cv-chip ${selectedEl.textDir === 'rtl' ? 'active' : ''}`}
                  onClick={() => patchSelectedEl({ textDir: 'rtl' })}
                >
                  RTL
                </button>
                <button
                  type="button"
                  className={`cv-chip ${selectedEl.textDir === 'ltr' ? 'active' : ''}`}
                  onClick={() => patchSelectedEl({ textDir: 'ltr' })}
                >
                  LTR
                </button>
              </div>

              <div className="cv-grid-3">
                <div className="cv-field">
                  <label>{t('لون النص', 'Text Color')}</label>
                  <input
                    type="color"
                    value={(selectedEl.textColor || '#111827').slice(0, 7)}
                    onChange={(e) => patchSelectedEl({ textColor: e.target.value })}
                  />
                </div>
                <div className="cv-field">
                  <label>{t('لون الخلفية', 'Box Fill')}</label>
                  <div className="cv-color-inline">
                    <input
                      type="color"
                      value={
                        selectedEl.fillColor && selectedEl.fillColor.startsWith('#')
                          ? selectedEl.fillColor.slice(0, 7)
                          : '#ecfdf5'
                      }
                      onChange={(e) => patchSelectedEl({ fillColor: e.target.value })}
                    />
                    <button
                      type="button"
                      className="cv-chip"
                      onClick={() => patchSelectedEl({ fillColor: 'transparent' })}
                    >
                      {t('شفاف', 'None')}
                    </button>
                  </div>
                </div>
                <div className="cv-field">
                  <label>{t('لون الإطار', 'Border')}</label>
                  <div className="cv-color-inline">
                    <input
                      type="color"
                      value={
                        selectedEl.strokeColor && selectedEl.strokeColor.startsWith('#')
                          ? selectedEl.strokeColor.slice(0, 7)
                          : '#24795e'
                      }
                      onChange={(e) =>
                        patchSelectedEl({
                          strokeColor: e.target.value,
                          strokeWidth: Math.max(1, selectedEl.strokeWidth || 1),
                        })
                      }
                    />
                    <button
                      type="button"
                      className="cv-chip"
                      onClick={() => patchSelectedEl({ strokeWidth: 0, strokeColor: 'transparent' })}
                    >
                      0px
                    </button>
                  </div>
                </div>
              </div>

              <div className="cv-grid-3">
                <div className="cv-field">
                  <label>
                    {t('استدارة الصندوق', 'Radius')}: {selectedEl.borderRadius ?? 6}px
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={40}
                    value={selectedEl.borderRadius ?? 6}
                    onChange={(e) => patchSelectedEl({ borderRadius: Number(e.target.value) })}
                  />
                </div>
                <div className="cv-field">
                  <label>
                    {t('هامش داخلي', 'Padding')}: {selectedEl.padding ?? 6}px
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={28}
                    value={selectedEl.padding ?? 6}
                    onChange={(e) => patchSelectedEl({ padding: Number(e.target.value) })}
                  />
                </div>
                <div className="cv-field">
                  <label>
                    {t('تباعد الأسطر', 'Line Height')}: {selectedEl.lineHeight ?? 1.4}
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={2.1}
                    step={0.05}
                    value={selectedEl.lineHeight ?? 1.4}
                    onChange={(e) => patchSelectedEl({ lineHeight: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* IMAGE SPECIFIC CONTROLS */}
          {selectedEl.type === 'image' && (
            <ImageFiltersEditor
              filters={selectedEl.imageFilters}
              shape={selectedEl.imageShape || 'rounded'}
              borderRadius={selectedEl.borderRadius}
              borderWidth={selectedEl.strokeWidth ?? 0}
              borderColor={selectedEl.strokeColor || '#24795e'}
              shadow={Boolean(selectedEl.shadow)}
              onChangeFilters={(next) => patchSelectedEl({ imageFilters: next })}
              onChangeShape={(s) => patchSelectedEl({ imageShape: s })}
              onChangeRadius={(r) => patchSelectedEl({ borderRadius: r })}
              onChangeBorderWidth={(w) => patchSelectedEl({ strokeWidth: w })}
              onChangeBorderColor={(c) => patchSelectedEl({ strokeColor: c })}
              onChangeShadow={(s) => patchSelectedEl({ shadow: s })}
              onReplaceFile={(file) => {
                const reader = new FileReader();
                reader.onload = () => {
                  if (typeof reader.result === 'string') {
                    patchSelectedEl({ src: reader.result });
                  }
                };
                reader.readAsDataURL(file);
              }}
              t={t}
            />
          )}

          {/* SHAPE SPECIFIC CONTROLS */}
          {selectedEl.type === 'shape' && (
            <div className="cv-inspector-sub">
              <div className="cv-field">
                <label>{t('نوع الشكل الهندسي', 'Shape Type')}</label>
                <div className="cv-chip-row">
                  {SHAPE_OPTIONS.map((sh) => (
                    <button
                      key={sh.id}
                      type="button"
                      className={`cv-chip ${selectedEl.shapeKind === sh.id ? 'active' : ''}`}
                      onClick={() => patchSelectedEl({ shapeKind: sh.id })}
                    >
                      {t(sh.ar, sh.en)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="cv-field">
                <label>{t('ألوان سريعة متناسقة', 'Calm Palette Swatches')}</label>
                <div className="cv-swatches-row">
                  {CV_COLOR_SWATCHES.map((sw) => (
                    <button
                      key={sw.hex}
                      type="button"
                      className="cv-color-swatch"
                      style={{ backgroundColor: sw.hex }}
                      onClick={() =>
                        patchSelectedEl({
                          fillColor: selectedEl.shapeKind === 'ring' ? 'transparent' : `${sw.hex}28`,
                          strokeColor: sw.hex,
                        })
                      }
                    />
                  ))}
                </div>
              </div>

              <div className="cv-grid-3">
                <div className="cv-field">
                  <label>{t('لون التعبئة', 'Fill Color')}</label>
                  <div className="cv-color-inline">
                    <input
                      type="color"
                      value={
                        selectedEl.fillColor && selectedEl.fillColor.startsWith('#')
                          ? selectedEl.fillColor.slice(0, 7)
                          : '#24795e'
                      }
                      onChange={(e) => patchSelectedEl({ fillColor: e.target.value })}
                    />
                    <button
                      type="button"
                      className="cv-chip"
                      onClick={() => patchSelectedEl({ fillColor: 'transparent' })}
                    >
                      {t('مفرغ', 'Empty')}
                    </button>
                  </div>
                </div>
                <div className="cv-field">
                  <label>{t('لون الحدود', 'Stroke Color')}</label>
                  <input
                    type="color"
                    value={(selectedEl.strokeColor || '#24795e').slice(0, 7)}
                    onChange={(e) => patchSelectedEl({ strokeColor: e.target.value })}
                  />
                </div>
                <div className="cv-field">
                  <label>
                    {t('سُمك الحد', 'Stroke')}: {selectedEl.strokeWidth ?? 2}px
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={12}
                    value={selectedEl.strokeWidth ?? 2}
                    onChange={(e) => patchSelectedEl({ strokeWidth: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* DIVIDER CONTROLS */}
          {selectedEl.type === 'divider' && (
            <div className="cv-inspector-sub">
              <div className="cv-grid-3">
                <div className="cv-field">
                  <label>{t('نمط الخط', 'Line Style')}</label>
                  <select
                    value={selectedEl.dividerStyle || 'solid'}
                    onChange={(e) =>
                      patchSelectedEl({ dividerStyle: e.target.value as CanvasDividerKind })
                    }
                  >
                    <option value="solid">{t('متصل', 'Solid')}</option>
                    <option value="dashed">{t('متقطع', 'Dashed')}</option>
                    <option value="dotted">{t('منقط', 'Dotted')}</option>
                    <option value="double">{t('مزدوج رسمي', 'Double')}</option>
                    <option value="arrow">{t('سهم', 'Arrow')}</option>
                  </select>
                </div>
                <div className="cv-field">
                  <label>{t('لون الخط', 'Color')}</label>
                  <input
                    type="color"
                    value={(selectedEl.strokeColor || '#24795e').slice(0, 7)}
                    onChange={(e) => patchSelectedEl({ strokeColor: e.target.value })}
                  />
                </div>
                <div className="cv-field">
                  <label>
                    {t('السُمك', 'Thickness')}: {selectedEl.strokeWidth ?? 2}px
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={selectedEl.strokeWidth ?? 2}
                    onChange={(e) => patchSelectedEl({ strokeWidth: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ICON / RATING / QR CONTROLS */}
          {selectedEl.type === 'icon' && (
            <div className="cv-inspector-sub">
              <div className="cv-grid-2">
                <div className="cv-field">
                  <label>{t('الأيقونة', 'Icon')}</label>
                  <select
                    value={selectedEl.iconName || 'Sparkles'}
                    onChange={(e) => patchSelectedEl({ iconName: e.target.value })}
                  >
                    {CANVAS_ICON_LIST.map((ic) => (
                      <option key={ic.key} value={ic.key}>
                        {t(ic.ar, ic.en)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="cv-field">
                  <label>{t('لون الأيقونة والخلفية', 'Colors')}</label>
                  <div className="cv-color-inline">
                    <input
                      type="color"
                      value={(selectedEl.textColor || '#24795e').slice(0, 7)}
                      onChange={(e) => patchSelectedEl({ textColor: e.target.value })}
                    />
                    <input
                      type="color"
                      value={
                        selectedEl.fillColor && selectedEl.fillColor.startsWith('#')
                          ? selectedEl.fillColor.slice(0, 7)
                          : '#e6f4ee'
                      }
                      onChange={(e) => patchSelectedEl({ fillColor: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedEl.type === 'rating' && (
            <div className="cv-inspector-sub">
              <div className="cv-grid-2">
                <div className="cv-field">
                  <label>
                    {t('التقييم', 'Stars')}: {selectedEl.ratingValue ?? 5} / {selectedEl.ratingMax ?? 5}
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={selectedEl.ratingValue ?? 5}
                    onChange={(e) => patchSelectedEl({ ratingValue: Number(e.target.value) })}
                  />
                </div>
                <div className="cv-field">
                  <label>{t('لون النجوم', 'Star Color')}</label>
                  <input
                    type="color"
                    value={(selectedEl.textColor || '#24795e').slice(0, 7)}
                    onChange={(e) => patchSelectedEl({ textColor: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {selectedEl.type === 'qr' && (
            <div className="cv-inspector-sub">
              <div className="cv-field">
                <label>{t('رابط كود QR', 'QR Destination URL')}</label>
                <input
                  type="url"
                  dir="ltr"
                  value={selectedEl.qrText || ''}
                  onChange={(e) => void handleUpdateQrUrl(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Selected Built-in Template Block Inspector (including Profile Photo!) */}
      {selectedBlockKey && (
        <div className="cv-section-card cv-inspector-card" data-testid="selected-block-inspector">
          <div className="cv-section-head">
            <div>
              <h3>
                {selectedBlockKey === 'photo'
                  ? t('تعديل الصورة الشخصية وموضعها', 'Edit Profile Photo & Position')
                  : t('تخصيص وتحريك قسم القالب المحدد', 'Customize & Move Template Block')}
              </h3>
              <p>
                {t(
                  'حرّك القسم بالسحب المباشر على الورقة أو عدّل الإزاحة والألوان والخط هنا.',
                  'Drag directly on the sheet or fine-tune offset, colors, and typography below.',
                )}
              </p>
            </div>
            <button
              type="button"
              className="cv-btn"
              onClick={() => resetBlockStyle(selectedBlockKey)}
            >
              <RotateCcw size={13} />
              <span>{t('استعادة الأصل', 'Reset Block')}</span>
            </button>
          </div>

          <div className="cv-grid-3">
            <div className="cv-field">
              <label>{t('إزاحة أفقية X', 'Offset X (px)')}</label>
              <input
                type="number"
                value={selectedBlockOverride.dx || 0}
                onChange={(e) =>
                  patchBlockStyle(selectedBlockKey, { dx: Number(e.target.value) || 0 })
                }
              />
            </div>
            <div className="cv-field">
              <label>{t('إزاحة رأسية Y', 'Offset Y (px)')}</label>
              <input
                type="number"
                value={selectedBlockOverride.dy || 0}
                onChange={(e) =>
                  patchBlockStyle(selectedBlockKey, { dy: Number(e.target.value) || 0 })
                }
              />
            </div>
            <div className="cv-field">
              <label>{t('قفل الموضع', 'Lock Block')}</label>
              <button
                type="button"
                className={`cv-btn ${selectedBlockOverride.locked ? 'soft' : ''}`}
                onClick={() =>
                  patchBlockStyle(selectedBlockKey, { locked: !selectedBlockOverride.locked })
                }
              >
                {selectedBlockOverride.locked ? <Lock size={14} /> : <Unlock size={14} />}
                <span>{selectedBlockOverride.locked ? t('مقفل', 'Locked') : t('حر الحركة', 'Unlocked')}</span>
              </button>
            </div>
          </div>

          {selectedBlockKey === 'photo' ? (
            <>
              <div className="cv-field">
                <label>
                  {t('حجم إطار الصورة على الورقة', 'Photo Size on Sheet')}:{' '}
                  {resume.personal.photoSizePx || 82}px
                </label>
                <input
                  type="range"
                  min={52}
                  max={160}
                  value={resume.personal.photoSizePx || 82}
                  onChange={(e) =>
                    updateResume((prev) => ({
                      ...prev,
                      personal: { ...prev.personal, photoSizePx: Number(e.target.value) },
                    }))
                  }
                />
              </div>

              <ImageFiltersEditor
                filters={resume.personal.photoFilters}
                shape={resume.personal.photoShape || 'circle'}
                borderWidth={resume.personal.photoBorderWidth ?? 2}
                borderColor={resume.personal.photoBorderColor || resume.design.accentColor || '#24795e'}
                shadow={Boolean(resume.personal.photoShadow)}
                onChangeFilters={(next) =>
                  updateResume((prev) => ({
                    ...prev,
                    personal: { ...prev.personal, photoFilters: next },
                  }))
                }
                onChangeShape={(sh) =>
                  updateResume((prev) => ({
                    ...prev,
                    personal: { ...prev.personal, photoShape: sh },
                  }))
                }
                onChangeBorderWidth={(w) =>
                  updateResume((prev) => ({
                    ...prev,
                    personal: { ...prev.personal, photoBorderWidth: w },
                  }))
                }
                onChangeBorderColor={(c) =>
                  updateResume((prev) => ({
                    ...prev,
                    personal: { ...prev.personal, photoBorderColor: c },
                  }))
                }
                onChangeShadow={(s) =>
                  updateResume((prev) => ({
                    ...prev,
                    personal: { ...prev.personal, photoShadow: s },
                  }))
                }
                onReplaceFile={(file) => {
                  const reader = new FileReader();
                  reader.onload = () => {
                    if (typeof reader.result === 'string') {
                      updateResume((prev) => ({
                        ...prev,
                        personal: { ...prev.personal, photoDataUrl: reader.result as string, showPhoto: true },
                      }));
                    }
                  };
                  reader.readAsDataURL(file);
                }}
                t={t}
              />
            </>
          ) : (
            <div className="cv-inspector-sub">
              <div className="cv-grid-2">
                <div className="cv-field">
                  <label>
                    {t('مقياس حجم خط القسم', 'Section Font Scale')}:{' '}
                    {Math.round((selectedBlockOverride.fontSizeScale || 1) * 100)}%
                  </label>
                  <input
                    type="range"
                    min={80}
                    max={145}
                    value={Math.round((selectedBlockOverride.fontSizeScale || 1) * 100)}
                    onChange={(e) =>
                      patchBlockStyle(selectedBlockKey, {
                        fontSizeScale: Number(e.target.value) / 100,
                      })
                    }
                  />
                </div>
                <div className="cv-field">
                  <label>{t('خط مخصص للقسم', 'Section Font')}</label>
                  <select
                    value={selectedBlockOverride.fontFamily || ''}
                    onChange={(e) =>
                      patchBlockStyle(selectedBlockKey, {
                        fontFamily: e.target.value || undefined,
                      })
                    }
                  >
                    <option value="">{t('خط الورقة الافتراضي', 'Default Sheet Font')}</option>
                    {CV_FONTS.map((f) => (
                      <option key={f.id} value={f.id}>
                        {t(f.labelAr, f.labelEn)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="cv-grid-3">
                <div className="cv-field">
                  <label>{t('لون العنوان', 'Heading Color')}</label>
                  <input
                    type="color"
                    value={(selectedBlockOverride.headingColor || resume.design.accentColor || '#24795e').slice(0, 7)}
                    onChange={(e) =>
                      patchBlockStyle(selectedBlockKey, { headingColor: e.target.value })
                    }
                  />
                </div>
                <div className="cv-field">
                  <label>{t('لون النص', 'Text Color')}</label>
                  <input
                    type="color"
                    value={(selectedBlockOverride.textColor || '#1f2937').slice(0, 7)}
                    onChange={(e) => patchBlockStyle(selectedBlockKey, { textColor: e.target.value })}
                  />
                </div>
                <div className="cv-field">
                  <label>{t('خلفية القسم', 'Background')}</label>
                  <div className="cv-color-inline">
                    <input
                      type="color"
                      value={
                        selectedBlockOverride.bgColor && selectedBlockOverride.bgColor.startsWith('#')
                          ? selectedBlockOverride.bgColor.slice(0, 7)
                          : '#f8fafc'
                      }
                      onChange={(e) =>
                        patchBlockStyle(selectedBlockKey, {
                          bgColor: e.target.value,
                          padding: selectedBlockOverride.padding ?? 10,
                          borderRadius: selectedBlockOverride.borderRadius ?? 10,
                        })
                      }
                    />
                    <button
                      type="button"
                      className="cv-chip"
                      onClick={() => patchBlockStyle(selectedBlockKey, { bgColor: 'transparent', padding: 0 })}
                    >
                      {t('شفاف', 'None')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Freeform Canvas Layers Stack */}
      <div className="cv-section-card">
        <div className="cv-section-head">
          <div>
            <h3>
              <Layers size={16} style={{ verticalAlign: 'middle', marginInlineEnd: 6 }} />
              {t('طبقات العناصر المضافة (Layers)', 'Canvas Layers Stack')} ({sortedLayers.length})
            </h3>
            <p>
              {t(
                'رتّب الطبقات للأمام أو الخلف، اقفل العناصر، أو أخفها مؤقتاً بنقرة واحدة.',
                'Reorder z-index layers, lock positions, toggle visibility, or duplicate elements.',
              )}
            </p>
          </div>
        </div>

        {sortedLayers.length === 0 ? (
          <p className="cv-calm-note">
            {t(
              'لا توجد عناصر حرة مضافة بعد — أضف نصوصاً أو صوراً أو أشكالاً من تبويب «عناصر وأشكال» أو من الشريط العلوي فوق الورقة.',
              'No freeform layers yet — add texts, images, shapes, or QR codes from "Elements & Shapes" or the preview toolbar.',
            )}
          </p>
        ) : (
          <div className="cv-order-list" data-testid="canvas-layers-list">
            {sortedLayers.map((layer, idx) => {
              const isSel =
                canvasSelection?.kind === 'element' && canvasSelection.id === layer.id;
              return (
                <div
                  key={layer.id}
                  data-testid={`layer-row-${layer.id}`}
                  className={`cv-order-row cv-layer-row ${isSel ? 'is-active-layer' : ''} ${layer.visible === false ? 'is-hidden' : ''}`}
                  onClick={() => setCanvasSelection({ kind: 'element', id: layer.id })}
                >
                  <div className="cv-order-label">
                    <span className="cv-layer-type-badge">{layer.type.toUpperCase()}</span>
                    <strong>{layer.name}</strong>
                    <small>
                      {layer.layerPlane === 'underlay'
                        ? t('خلفية', 'Behind')
                        : t('أمامي', 'Front')}
                    </small>
                  </div>

                  <div className="cv-order-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="cv-icon-btn"
                      title={t('إحضار للمقدمة', 'Bring to front')}
                      disabled={idx === 0}
                      onClick={() => reorderLayerZ(layer.id, 'front')}
                    >
                      <ChevronsUp size={13} />
                    </button>
                    <button
                      type="button"
                      className="cv-icon-btn"
                      title={t('تقديم طبقة', 'Move layer up')}
                      disabled={idx === 0}
                      onClick={() => reorderLayerZ(layer.id, 'up')}
                    >
                      <ArrowUp size={13} />
                    </button>
                    <button
                      type="button"
                      className="cv-icon-btn"
                      title={t('تأخير طبقة', 'Move layer down')}
                      disabled={idx === sortedLayers.length - 1}
                      onClick={() => reorderLayerZ(layer.id, 'down')}
                    >
                      <ArrowDown size={13} />
                    </button>
                    <button
                      type="button"
                      className="cv-icon-btn"
                      title={t('إرسال للخلف تماماً', 'Send to back')}
                      disabled={idx === sortedLayers.length - 1}
                      onClick={() => reorderLayerZ(layer.id, 'back')}
                    >
                      <ChevronsDown size={13} />
                    </button>
                    <button
                      type="button"
                      className="cv-icon-btn"
                      title={layer.visible === false ? t('إظهار', 'Show') : t('إخفاء', 'Hide')}
                      onClick={() =>
                        updateResume((prev) => ({
                          ...prev,
                          canvasElements: (prev.canvasElements || []).map((e) =>
                            e.id === layer.id ? { ...e, visible: e.visible === false } : e,
                          ),
                        }))
                      }
                    >
                      {layer.visible === false ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button
                      type="button"
                      className="cv-icon-btn"
                      title={layer.locked ? t('فك القفل', 'Unlock') : t('قفل', 'Lock')}
                      onClick={() =>
                        updateResume((prev) => ({
                          ...prev,
                          canvasElements: (prev.canvasElements || []).map((e) =>
                            e.id === layer.id ? { ...e, locked: !e.locked } : e,
                          ),
                        }))
                      }
                    >
                      {layer.locked ? <Lock size={14} /> : <Unlock size={14} />}
                    </button>
                    <button
                      type="button"
                      className="cv-icon-btn"
                      title={t('حذف الطبقة', 'Delete layer')}
                      onClick={() => deleteLayer(layer.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Template Sections & Header Layers */}
      <div className="cv-section-card">
        <div className="cv-section-head">
          <div>
            <h3>{t('طبقات وأقسام القالب الأساسية', 'Template Blocks & Sections')}</h3>
            <p>
              {t(
                'انقر على أي قسم لتحريكه أو تلوينه، أو غيّر ترتيب الأقسام وإظهارها.',
                'Select any template block to adjust its offset/colors, or reorder and hide sections.',
              )}
            </p>
          </div>
        </div>

        <div className="cv-order-list">
          {/* Header Block Row */}
          <div
            className={`cv-order-row cv-layer-row ${selectedBlockKey === 'header' ? 'is-active-layer' : ''}`}
            onClick={() => setCanvasSelection({ kind: 'block', blockKey: 'header' })}
          >
            <div className="cv-order-label">
              <span className="cv-layer-type-badge">HEAD</span>
              <strong>{t('ترويسة الاسم والتواصل', 'Header & Contact Block')}</strong>
              {(resume.blockStyles?.header?.dx || resume.blockStyles?.header?.dy) ? (
                <small>
                  ({resume.blockStyles.header.dx || 0}, {resume.blockStyles.header.dy || 0})
                </small>
              ) : null}
            </div>
            <div className="cv-order-actions" onClick={(e) => e.stopPropagation()}>
              {(resume.blockStyles?.header?.dx || resume.blockStyles?.header?.dy) ? (
                <button
                  type="button"
                  className="cv-icon-btn"
                  title={t('إعادة للموضع الأصلي', 'Reset offset')}
                  onClick={() => resetBlockStyle('header')}
                >
                  <RotateCcw size={13} />
                </button>
              ) : null}
            </div>
          </div>

          {/* Profile Photo Row (when uploaded) */}
          {resume.personal.photoDataUrl && (
            <div
              className={`cv-order-row cv-layer-row ${selectedBlockKey === 'photo' ? 'is-active-layer' : ''} ${!resume.personal.showPhoto ? 'is-hidden' : ''}`}
              onClick={() => setCanvasSelection({ kind: 'block', blockKey: 'photo' })}
            >
              <div className="cv-order-label">
                <span className="cv-layer-type-badge">PHOTO</span>
                <strong>{t('الصورة الشخصية (تعديل وفلاتر)', 'Profile Photo')}</strong>
              </div>
              <div className="cv-order-actions" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className="cv-icon-btn"
                  onClick={() =>
                    updateResume((prev) => ({
                      ...prev,
                      personal: { ...prev.personal, showPhoto: !prev.personal.showPhoto },
                    }))
                  }
                >
                  {resume.personal.showPhoto ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
              </div>
            </div>
          )}

          {/* Core Sections */}
          {resume.sections.map((sec, idx) => {
            const title = getPaperSectionTitle(
              sec.id,
              resume.design.paperLang,
              sec.customTitleAr,
              sec.customTitleEn,
            );
            const bStyle = resume.blockStyles?.[sec.id];
            return (
              <div
                key={sec.id}
                className={`cv-order-row cv-layer-row ${selectedBlockKey === sec.id ? 'is-active-layer' : ''} ${sec.visible ? '' : 'is-hidden'}`}
                onClick={() => setCanvasSelection({ kind: 'block', blockKey: sec.id })}
              >
                <div className="cv-order-label">
                  <span className="cv-layer-type-badge">SEC</span>
                  <strong>{title}</strong>
                  {(bStyle?.dx || bStyle?.dy) ? (
                    <small>
                      ({bStyle.dx || 0}, {bStyle.dy || 0})
                    </small>
                  ) : null}
                </div>
                <div className="cv-order-actions" onClick={(e) => e.stopPropagation()}>
                  {(bStyle?.dx || bStyle?.dy) ? (
                    <button
                      type="button"
                      className="cv-icon-btn"
                      title={t('إعادة للموضع الأصلي', 'Reset offset')}
                      onClick={() => resetBlockStyle(sec.id)}
                    >
                      <RotateCcw size={13} />
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="cv-icon-btn"
                    disabled={idx === 0}
                    onClick={() => moveTemplateSection(idx, -1)}
                  >
                    <ArrowUp size={13} />
                  </button>
                  <button
                    type="button"
                    className="cv-icon-btn"
                    disabled={idx === resume.sections.length - 1}
                    onClick={() => moveTemplateSection(idx, 1)}
                  >
                    <ArrowDown size={13} />
                  </button>
                  <button
                    type="button"
                    className="cv-icon-btn"
                    onClick={() =>
                      updateResume((prev) => ({
                        ...prev,
                        sections: prev.sections.map((s, i) =>
                          i === idx ? { ...s, visible: !s.visible } : s,
                        ),
                      }))
                    }
                  >
                    {sec.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
