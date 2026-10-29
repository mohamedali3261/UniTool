import { ArrowRight, Check, Maximize2 } from "lucide-react";
import { StudioSelect } from "../../../components/StudioSelect";
import { tabs, type Tab } from "../Library";
import type { MobilePanel } from "./useMobileEditor";

/** A tool page replaces the main dock; edits are live, Done only returns to the timeline. */
export function MobileToolPage({
  panel,
  tab,
  onTool,
  onBack,
  onFocus,
}: {
  panel: MobilePanel;
  tab: Tab;
  onTool: (value: Tab | "adjust") => void;
  onBack: () => void;
  onFocus: () => void;
}) {
  return (
    <nav className="mobile-tool-page-footer" aria-label="تنقل صفحة الأداة">
      <button aria-label="الرجوع للتعديل" onClick={onBack}>
        <ArrowRight size={20} />
      </button>
      <StudioSelect
        label="قسم التحرير"
        value={panel === "inspector" ? "adjust" : tab}
        options={[
          { value: "adjust", label: "تعديل وخصائص" },
          ...tabs.map((t) => ({ value: t.id, label: t.label })),
        ]}
        onValueChange={(value) => onTool(value as Tab | "adjust")}
      />
      <button aria-label="تكبير مساحة المعاينة" onClick={onFocus}>
        <Maximize2 size={17} />
      </button>
      <button aria-label="تم والعودة للتايم لاين" onClick={onBack}>
        <Check size={22} />
      </button>
    </nav>
  );
}
