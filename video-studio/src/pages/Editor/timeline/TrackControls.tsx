import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import type { TrackSettings } from "../../../types";

export function TrackControls({
  name,
  settings = {},
  onChange,
  audio = false,
}: {
  name: string;
  settings?: TrackSettings;
  onChange: (patch: TrackSettings) => void;
  audio?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const popover = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!open || !trigger.current || !popover.current) return;
    const place = () => {
      const r = trigger.current!.getBoundingClientRect();
      const el = popover.current!;
      const width = Math.min(260, innerWidth - 16);
      el.style.width = `${width}px`;
      el.style.left = `${Math.max(8, Math.min(r.left, innerWidth - width - 8))}px`;
      const height = el.getBoundingClientRect().height;
      el.style.top = `${Math.max(8, Math.min(r.bottom + 6, innerHeight - height - 8))}px`;
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!popover.current?.contains(target) && !trigger.current?.contains(target))
        setOpen(false);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", key, true);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", key, true);
    };
  }, [open]);
  const label = settings.name || name;
  return (
    <div className="timeline-track-controls" dir="rtl">
      <button
        ref={trigger}
        className="track-settings-toggle"
        aria-label={`أدوات مسار ${name}`}
        aria-expanded={open}
        title={`${label} — إعدادات المسار`}
        onClick={() => setOpen(!open)}
      >
        <span>{label}</span>
        <span className="track-state-icons">
          {settings.locked && <Lock size={10} />}
          {settings.hidden && <EyeOff size={10} />}
          {audio && settings.muted && <VolumeX size={10} />}
          {settings.collapsed ? <ChevronDown size={11} /> : <ChevronUp size={11} />}
        </span>
      </button>
      {open && (
        <div ref={popover} className="track-settings-popover" role="group" aria-label={`إعدادات مسار ${name}`}>
          <div className="track-popover-heading">
            <b>{label}</b>
            <button onClick={() => setOpen(false)} aria-label={`إغلاق أدوات مسار ${name}`}>
              <X size={15} />
            </button>
          </div>
          <label>
            اسم المسار
            <input
              aria-label={`اسم مسار ${name}`}
              maxLength={80}
              value={settings.name || name}
              onChange={(e) => onChange({ name: e.target.value })}
            />
          </label>
          <div className="track-toggle-row">
            <button aria-label={`قفل مسار ${name}`} aria-pressed={!!settings.locked} onClick={() => onChange({ locked: !settings.locked })}>
              {settings.locked ? <Lock size={14} /> : <Unlock size={14} />}
              <span>قفل</span>
            </button>
            <button aria-label={`إخفاء مسار ${name}`} aria-pressed={!!settings.hidden} onClick={() => onChange({ hidden: !settings.hidden })}>
              {settings.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
              <span>إظهار</span>
            </button>
            {audio && (
              <button aria-label={`كتم مسار ${name}`} aria-pressed={!!settings.muted} onClick={() => onChange({ muted: !settings.muted })}>
                {settings.muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                <span>كتم</span>
              </button>
            )}
            <button aria-label={`طي مسار ${name}`} aria-pressed={!!settings.collapsed} onClick={() => onChange({ collapsed: !settings.collapsed })}>
              {settings.collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              <span>طي</span>
            </button>
          </div>
          <label>
            ارتفاع المسار
            <input
              type="range"
              aria-label={`ارتفاع مسار ${name}`}
              min="40"
              max="140"
              value={settings.height || 60}
              onChange={(e) => onChange({ height: +e.target.value })}
            />
          </label>
        </div>
      )}
    </div>
  );
}
