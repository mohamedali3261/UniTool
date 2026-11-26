/**
 * القسم ١٤ — شريط الاختصارات.
 * شريط سفلي دائم يعرض الأدوات الفعّالة وحالتها، ويطابق ما يقرأه التطبيق فعلاً
 * من لوحة المفاتيح (بدون اختصارات وهمية).
 */
import { X, Command } from 'lucide-react';
import { useFontLab } from '../../state/FontLabContext';

const KEYS: Array<{ keys: string; ar: string; en: string; tool?: string }> = [
  { keys: 'V', ar: 'تحديد', en: 'Select', tool: 'select' },
  { keys: 'P', ar: 'قلم', en: 'Pen', tool: 'pen' },
  { keys: 'L', ar: 'لاسو', en: 'Lasso', tool: 'lasso' },
  { keys: 'H', ar: 'تحريك', en: 'Pan', tool: 'pan' },
  { keys: 'Z', ar: 'تكبير', en: 'Zoom', tool: 'zoom' },
  { keys: 'Del', ar: 'حذف النقاط', en: 'Delete nodes' },
  { keys: 'Shift', ar: 'إضافة للتحديد', en: 'Add to selection' },
  { keys: 'Alt', ar: 'دقة كاملة', en: 'Pixel-precise drag' },
  { keys: 'Ctrl+Z', ar: 'تراجع', en: 'Undo' },
  { keys: 'Ctrl+S', ar: 'حفظ', en: 'Save' },
  { keys: 'Ctrl+E', ar: 'تصدير', en: 'Export' },
  { keys: 'Ctrl+Wheel', ar: 'تكبير حول المؤشر', en: 'Zoom at cursor' },
];

export function ShortcutBar({ show, onHide }: { show: boolean; onHide: () => void }) {
  const { state, ar } = useFontLab();
  if (!show) return null;
  return (
    <div className="fl-shortcut-bar">
      <span className="fl-shortcut-title">
        <Command size={13} /> {ar ? 'اختصارات' : 'Shortcuts'}
      </span>
      <div className="fl-shortcut-items">
        {KEYS.map((entry) => (
          <span key={entry.keys} className={`fl-shortcut${entry.tool && entry.tool === state.tool ? ' is-active' : ''}`}>
            <kbd>{entry.keys}</kbd>
            <em>{ar ? entry.ar : entry.en}</em>
          </span>
        ))}
      </div>
      <button type="button" className="fl-shortcut-hide" onClick={onHide} aria-label={ar ? 'إخفاء الشريط' : 'Hide shortcut bar'}>
        <X size={13} />
      </button>
    </div>
  );
}
