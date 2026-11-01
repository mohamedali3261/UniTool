import {
  MousePointer2,
  Type,
  Highlighter,
  PenLine,
  Square,
  Eraser,
} from "lucide-react";
import type { Tool, Translate } from "../../core/types";
export function ToolRail({
  tool,
  setTool,
  t,
}: {
  tool: Tool;
  setTool: (v: Tool) => void;
  t: Translate;
}) {
  return (
    <nav
      className="ps-tools"
      aria-label={t("أدوات التعليق", "Annotation tools")}
    >
      {[
        [MousePointer2, "select", t("تحديد وتحريك", "Select & move")],
        [Type, "text", t("إضافة نص", "Add text")],
        [Highlighter, "highlight", t("تظليل", "Highlight")],
        [PenLine, "pen", t("قلم حر", "Freehand")],
        [Square, "rectangle", t("إطار", "Rectangle")],
        [Eraser, "cover", t("غطاء أبيض", "White cover")],
      ].map(([Icon, id, label]) => {
        const I = Icon as typeof Type;
        return (
          <button
            key={String(id)}
            aria-pressed={tool === id}
            onClick={() => setTool(id as Tool)}
          >
            <I size={16} />
            <span>{String(label)}</span>
            {tool === id && <i />}
          </button>
        );
      })}
    </nav>
  );
}
