import { useState } from "react";
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
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
  return (
    <div className="timeline-track-controls" dir="rtl">
      <button
        className="track-settings-toggle"
        aria-label={`أدوات مسار ${name}`}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {settings.name || name} ⋯
      </button>
      {open && (
        <div className="track-settings-popover">
          <button
            onClick={() => setOpen(false)}
            aria-label={`إغلاق أدوات مسار ${name}`}
          >
            إغلاق
          </button>
          <label>
            اسم المسار
            <input
              aria-label={`اسم مسار ${name}`}
              maxLength={80}
              value={settings.name || name}
              onChange={(e) => onChange({ name: e.target.value })}
            />
          </label>
          <div>
            <button
              aria-label={`قفل مسار ${name}`}
              aria-pressed={!!settings.locked}
              onClick={() => onChange({ locked: !settings.locked })}
            >
              {settings.locked ? <Lock size={14} /> : <Unlock size={14} />}
            </button>
            <button
              aria-label={`إخفاء مسار ${name}`}
              aria-pressed={!!settings.hidden}
              onClick={() => onChange({ hidden: !settings.hidden })}
            >
              {settings.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
            {audio && (
              <button
                aria-label={`كتم مسار ${name}`}
                aria-pressed={!!settings.muted}
                onClick={() => onChange({ muted: !settings.muted })}
              >
                {settings.muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
            )}
            <button
              aria-label={`طي مسار ${name}`}
              aria-pressed={!!settings.collapsed}
              onClick={() => onChange({ collapsed: !settings.collapsed })}
            >
              {settings.collapsed ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronUp size={14} />
              )}
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
