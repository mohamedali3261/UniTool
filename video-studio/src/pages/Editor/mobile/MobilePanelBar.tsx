import {
  SlidersHorizontal,
  Clapperboard,
  PanelsTopLeft,
  Maximize2,
  Minimize2,
} from "lucide-react";
import type { MobilePanel } from "./useMobileEditor";
export function MobilePanelBar({
  panel,
  onPanel,
  toolName,
  focused,
  onFocus,
}: {
  panel: MobilePanel;
  onPanel: (panel: MobilePanel) => void;
  toolName: string;
  focused: boolean;
  onFocus: () => void;
}) {
  return (
    <div className="mobile-panel-bar" aria-label="عرض لوحة التحرير">
      <button
        aria-label="لوحة الأدوات"
        aria-pressed={!focused && panel === "library"}
        onClick={() => onPanel("library")}
      >
        <PanelsTopLeft size={16} />
        <span>{toolName}</span>
      </button>
      <button
        aria-label="لوحة الخط الزمني"
        aria-pressed={!focused && panel === "timeline"}
        onClick={() => onPanel("timeline")}
      >
        <Clapperboard size={16} />
        <span>التايم لاين</span>
      </button>
      <button
        aria-label="لوحة الخصائص"
        aria-pressed={!focused && panel === "inspector"}
        onClick={() => onPanel("inspector")}
      >
        <SlidersHorizontal size={16} />
        <span>الخصائص</span>
      </button>
      <button
        aria-label={focused ? "استعادة مساحة الأدوات" : "تكبير مساحة المعاينة"}
        aria-pressed={focused}
        onClick={onFocus}
      >
        {focused ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
      </button>
    </div>
  );
}
