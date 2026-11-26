import { useEffect, useRef, useState, type ReactNode } from "react";
export function ToolSidebar({
  selectionKey,
  design,
  scene,
  ar,
}: {
  selectionKey: string;
  design: ReactNode;
  scene: ReactNode;
  ar: boolean;
}) {
  const [tab, setTab] = useState<"design" | "scene">("design");
  const designRef = useRef<HTMLDivElement>(null),
    sceneRef = useRef<HTMLDivElement>(null),
    scroller = useRef<HTMLDivElement>(null);
  function jump(t: "design" | "scene") {
    setTab(t);
    const target = t === "design" ? designRef.current : sceneRef.current;
    if (target && scroller.current)
      scroller.current.scrollTop +=
        target.getBoundingClientRect().top -
        scroller.current.getBoundingClientRect().top;
  }
  useEffect(() => {
    jump("design");
  }, [selectionKey]);
  return (
    <aside className="ps-tools">
      <nav aria-label={ar ? "أدوات الاستوديو" : "Studio tools"}>
        <button
          aria-pressed={tab === "design"}
          className={tab === "design" ? "active" : ""}
          onClick={() => jump("design")}
        >
          {ar ? "التصميم" : "Design"}
        </button>
        <button
          aria-pressed={tab === "scene"}
          className={tab === "scene" ? "active" : ""}
          onClick={() => jump("scene")}
        >
          {ar ? "الخامة والمشهد" : "Fabric & scene"}
        </button>
      </nav>
      <div className="ps-tools-scroll" ref={scroller}>
        <div ref={designRef}>{design}</div>
        <div ref={sceneRef}>{scene}</div>
      </div>
    </aside>
  );
}
