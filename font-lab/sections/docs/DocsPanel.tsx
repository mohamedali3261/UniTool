/**
 * القسم ١٣ — دليل الاستخدام والاختصارات.
 * يشرح المسار الكامل من اختيار الخط إلى تصدير TTF، ويعرض اختصارات فعلية
 * مطابقة لما يسمعه التطبيق في لوحة المفاتيح.
 */
import { Keyboard, BookOpen, Layers, Workflow, ExternalLink } from 'lucide-react';
import { useFontLab } from '../../state/FontLabContext';
import { PanelCard } from '../../ui/controls';

const SHORTCUTS: Array<{ keys: string; ar: string; en: string }> = [
  { keys: 'V', ar: 'أداة التحديد', en: 'Select tool' },
  { keys: 'P', ar: 'القلم (نقرة = نقطة، نقرة مزدوجة = إغلاق)', en: 'Pen (click = node, double-click = close)' },
  { keys: 'L', ar: 'أداة اللاسو', en: 'Lasso tool' },
  { keys: 'H', ar: 'تحريك اللوحة', en: 'Pan canvas' },
  { keys: 'Z', ar: 'تكبير', en: 'Zoom' },
  { keys: 'Ctrl + Z', ar: 'تراجع', en: 'Undo' },
  { keys: 'Ctrl + Shift + Z', ar: 'إعادة', en: 'Redo' },
  { keys: 'Ctrl + S', ar: 'حفظ المشروع', en: 'Save project' },
  { keys: 'Ctrl + E', ar: 'تصدير الخط', en: 'Export font' },
  { keys: 'Delete', ar: 'حذف النقاط المحددة', en: 'Delete selected nodes' },
  { keys: 'Shift + نقرة', ar: 'إضافة نقطة للتحديد', en: 'Add node to selection' },
  { keys: 'Alt + سحب', ar: 'سحب بدون محاذاة', en: 'Drag without snapping' },
  { keys: 'Ctrl + عجلة', ar: 'تكبير حول المؤشر', en: 'Zoom at cursor' },
  { keys: 'نقرة مزدوجة على نقطة', ar: 'تحويل نقطة/تحكم', en: 'Toggle corner/control' },
];

export function DocsPanel() {
  const { ar } = useFontLab();
  return (
    <div className="fl-docs">
      <PanelCard title={ar ? 'كيف تعمل من الصفر' : 'From zero to font'} icon={<Workflow size={15} />}>
        <ol className="fl-steps">
          <li>
            <b>1</b>
            <span>{ar ? 'اختر خطاً مضمّناً أو استورد TTF/OTF — يُقرأ داخل المتصفح.' : 'Pick a bundled font or import a TTF/OTF — parsed in the browser.'}</span>
          </li>
          <li>
            <b>2</b>
            <span>{ar ? 'اختر حرفاً من الرف، ثم حرّك النقاط على المسرح أو أضف أشكالاً جاهزة.' : 'Choose a glyph, then move nodes on the stage or add presets.'}</span>
          </li>
          <li>
            <b>3</b>
            <span>{ar ? 'اضبط العرض والحواشي والمقاييس حتى يستقر الشكل على خط القاعدة.' : 'Tune advance, side bearings and metrics until it sits on the baseline.'}</span>
          </li>
          <li>
            <b>4</b>
            <span>{ar ? 'اضبط المسافات في استوديو الكرننغ، وراقب النموذج النصي الحقيقي.' : 'Adjust spacing in the kerning studio and watch the live sample.'}</span>
          </li>
          <li>
            <b>5</b>
            <span>{ar ? 'صدّر TTF/OTF — تُعاد قراءة الملف للتأكد قبل التنزيل.' : 'Export TTF/OTF — the file is parsed back for verification before download.'}</span>
          </li>
        </ol>
      </PanelCard>

      <PanelCard title={ar ? ' الاختصارات' : 'Keyboard shortcuts'} icon={<Keyboard size={15} />}>
        <div className="fl-shortcut-grid">
          {SHORTCUTS.map((entry) => (
            <div key={entry.keys}>
              <kbd>{entry.keys}</kbd>
              <span>{ar ? entry.ar : entry.en}</span>
            </div>
          ))}
        </div>
      </PanelCard>

      <PanelCard title={ar ? 'ما يميز الاستوديو' : 'What this studio does differently'} icon={<Layers size={15} />}>
        <ul className="fl-export-notes">
          <li>{ar ? 'يعمل على منحنيات حقيقية (TTF/OTF)، لا على حروف مرسومة بالكانفس.' : 'Edits real outlines (TTF/OTF), not canvas-drawn letters.'}</li>
          <li>{ar ? 'يقرأ الأشكال العربية من GSUB ويحفظ GPOS عند التصدير.' : 'Reads Arabic forms from GSUB and preserves GPOS on export.'}</li>
          <li>{ar ? 'معاينة حيّة بالخط المُحرَّر نفسه عبر FontFace.' : 'Live preview uses the edited font itself through FontFace.'}</li>
          <li>{ar ? 'سجل تعديلات قابل للتنقل، ومشاريع محلية بصيغة JSON.' : 'Navigable edit history and local JSON projects.'}</li>
          <li>{ar ? 'كشف فوري لأي خط غير صالح (مثل WOFF2) برسالة واضحة.' : 'Clear bilingual errors for unsupported fonts such as WOFF2.'}</li>
        </ul>
      </PanelCard>

      <PanelCard title={ar ? 'التراخيص' : 'Licences'} icon={<BookOpen size={15} />}>
        <p className="fl-hint-note">
          {ar
            ? 'الخطوط المضمّنة (Cairo وAmiri وInter) تحت رخصة SIL Open Font License 1.1، وتُحفظ ملفات الرخصة معها في مجلد assets/fonts.'
            : 'The bundled fonts (Cairo, Amiri, Inter) ship under the SIL Open Font License 1.1; the licence files live next to them in assets/fonts.'}
        </p>
        <a className="fl-link" href="https://openfontlicense.org" target="_blank" rel="noreferrer noopener">
          <ExternalLink size={13} /> SIL OFL 1.1
        </a>
      </PanelCard>
    </div>
  );
}
