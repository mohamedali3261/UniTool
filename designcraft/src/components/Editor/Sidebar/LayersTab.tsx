import './layers.css';
import React, { useEffect, useRef, useState } from 'react';
import {
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  ArrowUp,
  ArrowDown,
  Type,
  Image as ImageIcon,
  Shapes,
  GripVertical,
  Copy,
  Pencil,
} from 'lucide-react';
import { useDcLang } from '../../../hooks/useDcLang';

interface LayerItem {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
  protected?: boolean;
  rawObject: any;
}
interface LayersTabProps {
  layers: LayerItem[];
  activeLayerId?: string | null;
  onSelectLayer: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onMoveLayerUp: (id: string) => void;
  onMoveLayerDown: (id: string) => void;
  onDeleteLayer: (id: string) => void;
  onReorder: (source: string, target: string) => void;
  onRename: (id: string, name: string) => void;
  onDuplicate: (id: string) => void;
}
export const LayersTab: React.FC<LayersTabProps> = ({
  layers,
  activeLayerId,
  onSelectLayer,
  onToggleVisibility,
  onToggleLock,
  onMoveLayerUp,
  onMoveLayerDown,
  onDeleteLayer,
  onReorder,
  onRename,
  onDuplicate,
}) => {
  const { lang } = useDcLang();
  const ar = lang === 'ar';
  const [editing, setEditing] = useState<string | null>(null),
    [name, setName] = useState('');
  const [drag, setDrag] = useState<{ source: string; target: string } | null>(
      null,
    ),
    [announcement, setAnnouncement] = useState('');
  const list = useRef<HTMLDivElement>(null);
  const gesture = useRef<{
    id: number;
    source: string;
    target: string;
    y: number;
    startY: number;
    moved: boolean;
    frame: number;
    time: number;
    rows: { id: string; center: number }[];
  } | null>(null);
  const abort = () => {
    if (gesture.current) cancelAnimationFrame(gesture.current.frame);
    gesture.current = null;
    setDrag(null);
  };
  useEffect(() => {
    const cancel = () => abort();
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && gesture.current) {
        event.preventDefault();
        event.stopPropagation();
        abort();
      }
    };
    window.addEventListener('blur', cancel);
    window.addEventListener('keydown', key, true);
    return () => {
      window.removeEventListener('blur', cancel);
      window.removeEventListener('keydown', key, true);
      if (gesture.current) cancelAnimationFrame(gesture.current.frame);
    };
  }, []);
  useEffect(() => {
    if (
      gesture.current &&
      !layers.some(
        (l) => l.id === gesture.current!.source && !l.locked && !l.protected,
      )
    )
      abort();
  }, [layers]);
  const visible = layers;
  const locate = (
    g: NonNullable<typeof gesture.current>,
    root: HTMLDivElement,
  ) => {
    if (!g.moved) return;
    const y = g.y - root.getBoundingClientRect().top + root.scrollTop;
    let target = g.source,
      distance = Infinity;
    for (const row of g.rows) {
      const d = Math.abs(y - row.center);
      if (d < distance) {
        target = row.id;
        distance = d;
      }
    }
    g.target = target;
    setDrag((old) =>
      old?.source === g.source && old.target === target
        ? old
        : { source: g.source, target },
    );
  };
  const startDrag = (
    event: React.PointerEvent<HTMLButtonElement>,
    layer: LayerItem,
  ) => {
    if (
      gesture.current ||
      layer.locked ||
      layer.protected ||
      event.button !== 0
    )
      return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    gesture.current = {
      id: event.pointerId,
      source: layer.id,
      target: layer.id,
      y: event.clientY,
      startY: event.clientY,
      moved: false,
      frame: 0,
      time: performance.now(),
      rows: Array.from(
        list.current?.querySelectorAll<HTMLElement>('[data-layer-id]') || [],
      )
        .filter((row) => row.dataset.protected !== 'true')
        .map((row) => ({
          id: row.dataset.layerId!,
          center: row.offsetTop + row.offsetHeight / 2,
        })),
    };
    const tick = (now: number) => {
      const g = gesture.current,
        root = list.current;
      if (!g || !root) return;
      const box = root.getBoundingClientRect(),
        dt = Math.min(32, now - g.time);
      g.time = now;
      // The cancel row can shrink the list after drag starts; retain the edge-scroll zone.
      if (g.moved && g.y > box.top - 40 && g.y < box.bottom + 40) {
        const up = Math.max(0, Math.min(1, (box.top + 48 - g.y) / 48)),
          down = Math.max(0, Math.min(1, (g.y - box.bottom + 48) / 48));
        if (up || down) root.scrollTop += (down - up) * 0.65 * dt;
        locate(g, root);
      }
      g.frame = requestAnimationFrame(tick);
    };
    gesture.current.frame = requestAnimationFrame(tick);
  };
  const finish = (event: React.PointerEvent<HTMLButtonElement>) => {
    const g = gesture.current;
    if (!g || event.pointerId !== g.id) return;
    const box = list.current?.getBoundingClientRect();
    const inside =
      box &&
      event.clientX >= box.left &&
      event.clientX <= box.right &&
      event.clientY >= box.top &&
      event.clientY <= box.bottom;
    if (inside && g.moved && g.source !== g.target) {
      onReorder(g.source, g.target);
      setAnnouncement(ar ? 'تم تغيير ترتيب الطبقة' : 'Layer order updated');
    }
    abort();
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const commit = (id: string) => {
    const value = name.trim();
    if (value) onRename(id, value.slice(0, 100));
    setEditing(null);
  };
  const action = (
    label: string,
    icon: React.ReactNode,
    callback: () => void,
    disabled = false,
    pressed?: boolean,
  ) => (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={callback}
      className="dc-layer-action rounded-md p-1 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
    >
      {icon}
    </button>
  );
  const iconClass = 'h-3.5 w-3.5';
  return (
    <div
      className="flex h-full min-h-0 min-w-0 flex-col gap-1 relative"
      dir={ar ? 'rtl' : 'ltr'}
      data-layer-panel
    >
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
      <div
        ref={list}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain space-y-1 pb-2 relative dc-layer-list"
        data-layer-list
      >
        {visible.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-600 p-4 text-xs text-slate-400">
            {ar ? 'لا توجد طبقات مطابقة.' : 'No matching layers.'}
          </p>
        )}
        {visible.map((layer) => {
          const reorderable = layers.filter((l) => !l.protected);
          const index = reorderable.indexOf(layer);
          const selected = activeLayerId === layer.id;
          const disabled = layer.locked || layer.protected;
          const Icon = ['text', 'textbox', 'i-text'].includes(layer.type)
            ? Type
            : layer.type === 'image'
              ? ImageIcon
              : Shapes;
          return (
            <div
              key={layer.id}
              data-layer-id={layer.id}
              data-protected={!!layer.protected}
              className={`dc-layer-card min-w-0 rounded-lg border p-0.5 ${drag?.target === layer.id && drag.source !== layer.id ? 'border-amber-400 ring-2 ring-amber-400/50' : selected ? 'border-sky-400 bg-sky-950/40' : 'border-slate-700 bg-slate-950/60'} ${drag?.source === layer.id ? 'opacity-60' : ''}`}
            >
              <div className="flex min-w-0 items-center gap-1">
                <button
                  type="button"
                  style={{ touchAction: 'none' }}
                  disabled={disabled}
                  aria-label={`${ar ? 'سحب الطبقة' : 'Drag layer'} ${layer.name}`}
                  title={
                    ar
                      ? 'اسحب للترتيب، أو استخدم Alt مع الأسهم'
                      : 'Drag to reorder, or use Alt + arrows'
                  }
                  onPointerDown={(e) => startDrag(e, layer)}
                  onPointerMove={(e) => {
                    const g = gesture.current;
                    if (g?.id === e.pointerId) {
                      g.y = e.clientY;
                      g.moved ||= Math.abs(g.y - g.startY) > 6;
                    }
                  }}
                  onPointerUp={finish}
                  onPointerCancel={abort}
                  onLostPointerCapture={abort}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') abort();
                    if (e.altKey && ['ArrowUp', 'ArrowDown'].includes(e.key)) {
                      e.preventDefault();
                      e.stopPropagation();
                      if (e.key === 'ArrowUp') onMoveLayerUp(layer.id);
                      else onMoveLayerDown(layer.id);
                    }
                  }}
                  className="dc-layer-action shrink-0 rounded-md p-1 text-slate-400 cursor-grab active:cursor-grabbing disabled:opacity-30"
                >
                  <GripVertical className={iconClass} />
                </button>
                {editing === layer.id ? (
                  <input
                    autoFocus
                    aria-label={ar ? 'اسم الطبقة' : 'Layer name'}
                    value={name}
                    maxLength={100}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => commit(layer.id)}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        commit(layer.id);
                      }
                      if (e.key === 'Escape') {
                        e.preventDefault();
                        setEditing(null);
                      }
                    }}
                    className="min-w-0 flex-1 rounded border border-sky-500 bg-slate-900 p-1 text-xs text-white"
                  />
                ) : (
                  <button
                    type="button"
                    disabled={layer.protected}
                    aria-pressed={selected}
                    onClick={() => onSelectLayer(layer.id)}
                    onDoubleClick={() => {
                      if (!layer.protected) {
                        setEditing(layer.id);
                        setName(layer.name);
                      }
                    }}
                    className="flex min-w-0 flex-1 items-center gap-2 p-1 text-start text-xs text-slate-100"
                  >
                    <Icon className={iconClass + ' shrink-0 text-sky-300'} />
                    <span className="truncate">{layer.name}</span>
                  </button>
                )}
                {action(
                  ar ? 'تغيير اسم الطبقة' : 'Rename layer',
                  <Pencil className={iconClass} />,
                  () => {
                    setEditing(layer.id);
                    setName(layer.name);
                  },
                  !!layer.protected,
                )}
              </div>
              <div className="flex flex-wrap items-center justify-end gap-0.5">
                {action(
                  layer.visible
                    ? ar
                      ? 'إخفاء الطبقة'
                      : 'Hide layer'
                    : ar
                      ? 'إظهار الطبقة'
                      : 'Show layer',
                  layer.visible ? (
                    <Eye className={iconClass} />
                  ) : (
                    <EyeOff className={iconClass} />
                  ),
                  () => onToggleVisibility(layer.id),
                  false,
                  layer.visible,
                )}
                {action(
                  layer.locked
                    ? ar
                      ? 'إلغاء قفل الطبقة'
                      : 'Unlock layer'
                    : ar
                      ? 'قفل الطبقة'
                      : 'Lock layer',
                  layer.locked ? (
                    <Lock className={iconClass} />
                  ) : (
                    <Unlock className={iconClass} />
                  ),
                  () => onToggleLock(layer.id),
                  !!layer.protected,
                  layer.locked,
                )}
                {action(
                  ar ? 'رفع الطبقة' : 'Move layer up',
                  <ArrowUp className={iconClass} />,
                  () => onMoveLayerUp(layer.id),
                  !!disabled || index === 0,
                )}
                {action(
                  ar ? 'خفض الطبقة' : 'Move layer down',
                  <ArrowDown className={iconClass} />,
                  () => onMoveLayerDown(layer.id),
                  !!disabled || index === reorderable.length - 1,
                )}
                {action(
                  ar ? 'تكرار الطبقة' : 'Duplicate layer',
                  <Copy className={iconClass} />,
                  () => onDuplicate(layer.id),
                  !!disabled,
                )}
                {action(
                  ar ? 'حذف الطبقة' : 'Delete layer',
                  <Trash2 className={iconClass} />,
                  () => onDeleteLayer(layer.id),
                  !!disabled,
                )}
              </div>
              {layer.protected && (
                <p className="px-2 text-[10px] text-amber-300">
                  {ar ? 'خطوط علبة محمية' : 'Protected carton guides'}
                </p>
              )}
            </div>
          );
        })}
      </div>
      {drag && (
        <button
          type="button"
          onClick={abort}
          className="absolute bottom-1 inset-x-2 rounded-lg border border-slate-600 bg-slate-900/95 p-2 text-xs text-white z-10"
        >
          {ar ? 'إلغاء السحب' : 'Cancel drag'}
        </button>
      )}
    </div>
  );
};
