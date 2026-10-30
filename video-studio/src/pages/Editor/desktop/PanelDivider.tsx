import type { KeyboardEvent, PointerEvent } from "react";

type Side = "library" | "inspector";
/** Direct DOM sizing avoids rerendering the player while dragging a panel. */
export function PanelDivider({ side }: { side: Side }) {
  const selector = side === "library" ? ".library-panel" : ".inspector";
  const variable = `--desktop-${side}`;
  const sign = side === "library" ? 1 : -1;
  function workspace(target: HTMLElement) {
    return target.closest<HTMLElement>(".editor-workspace")!;
  }
  function resize(root: HTMLElement, width: number) {
    const other = root.querySelector<HTMLElement>(
      side === "library" ? ".inspector" : ".library-panel",
    )!;
    const max = root.clientWidth - other.getBoundingClientRect().width - 232;
    const min = side === "library" ? 230 : 200;
    const bounded = Math.max(min, Math.min(width, max));
    root.style.setProperty(variable, `${bounded}px`);
    root
      .querySelector(`[data-panel-divider="${side}"]`)
      ?.setAttribute(
        "aria-valuenow",
        String(
          Math.round(
            (root.querySelector<HTMLElement>(selector)!.getBoundingClientRect()
              .width /
              root.clientWidth) *
              100,
          ),
        ),
      );
  }
  function drag(e: PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    e.preventDefault();
    const el = e.currentTarget,
      root = workspace(el);
    const start = e.clientX;
    const width = root
      .querySelector<HTMLElement>(selector)!
      .getBoundingClientRect().width;
    el.setPointerCapture(e.pointerId);
    el.dataset.dragging = "true";
    const move = (event: globalThis.PointerEvent) =>
      resize(root, width + sign * (event.clientX - start));
    const end = () => {
      delete el.dataset.dragging;
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", end);
      el.removeEventListener("pointercancel", end);
      el.removeEventListener("lostpointercapture", end);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
    el.addEventListener("lostpointercapture", end);
  }
  function key(e: KeyboardEvent<HTMLDivElement>) {
    const root = workspace(e.currentTarget);
    if (e.key === "Home") {
      e.preventDefault();
      root.style.removeProperty(variable);
      e.currentTarget.setAttribute(
        "aria-valuenow",
        side === "library" ? "34" : "23",
      );
    }
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const width = root
      .querySelector<HTMLElement>(selector)!
      .getBoundingClientRect().width;
    resize(root, width + sign * (e.key === "ArrowRight" ? 16 : -16));
  }
  return (
    <div
      className={`desktop-panel-divider divider-${side}`}
      data-panel-divider={side}
      role="separator"
      aria-orientation="vertical"
      aria-label={
        side === "library" ? "تغيير عرض المكتبة" : "تغيير عرض الخصائص"
      }
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={side === "library" ? 34 : 23}
      tabIndex={0}
      title="اسحب لتغيير العرض • الأسهم للتحكم • Home أو نقرتان لإعادة الضبط"
      onPointerDown={drag}
      onKeyDown={key}
      onDoubleClick={(e) => {
        workspace(e.currentTarget).style.removeProperty(variable);
        e.currentTarget.setAttribute(
          "aria-valuenow",
          side === "library" ? "34" : "23",
        );
      }}
    />
  );
}
