import { useEffect, useRef } from "react";
import { MoreHorizontal, FolderOpen, Plus } from "lucide-react";
import { PerformanceMenu } from "../../../settings/PerformanceMenu";
export function MobileProjectMenu({
  onOpen,
  onImport,
  status,
}: {
  onOpen: () => void;
  onImport: () => void;
  status: string;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const outside = (e: PointerEvent) => {
      if (
        !ref.current?.contains(e.target as Node) &&
        !(e.target as HTMLElement).closest("[data-studio-select-content]")
      )
        ref.current?.removeAttribute("open");
    };
    const escape = (e: KeyboardEvent) => {
      if (
        e.key === "Escape" &&
        !e.defaultPrevented &&
        !document.querySelector("[data-studio-select-content]")
      )
        ref.current?.removeAttribute("open");
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, []);
  const act = (fn: () => void) => {
    ref.current?.removeAttribute("open");
    fn();
  };
  return (
    <details className="mobile-project-menu" ref={ref}>
      <summary aria-label="خيارات المشروع">
        <MoreHorizontal size={20} />
      </summary>
      <div
        className="mobile-project-popover"
        aria-label="خيارات المشروع الإضافية"
      >
        <button onClick={() => act(onOpen)}>
          <FolderOpen size={16} />
          فتح مشروع
        </button>
        <button onClick={() => act(onImport)}>
          <Plus size={16} />
          إضافة وسائط
        </button>
        <PerformanceMenu />
        <p role="status">{status}</p>
      </div>
    </details>
  );
}
