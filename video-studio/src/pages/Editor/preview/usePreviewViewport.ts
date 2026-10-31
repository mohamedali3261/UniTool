import {
  useEffect,
  useRef,
  useState,
  type RefObject,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { boundView, FIT_VIEW, type Viewport } from "./geometry";
export function usePreviewViewport(
  stage: RefObject<HTMLDivElement>,
  canvas: RefObject<HTMLCanvasElement>,
) {
  const [view, setView] = useState<Viewport>(FIT_VIEW);
  const [panning, setPanning] = useState(false);
  const [guides, setGuides] = useState(false);
  const current = useRef(view);
  current.current = view;
  const gesture = useRef<{
    pointer: number;
    x: number;
    y: number;
    view: Viewport;
  } | null>(null);
  const frame = useRef(0);
  const pending = useRef<Viewport | null>(null);
  const bound = (next: Viewport) => {
    const el = stage.current,
      c = canvas.current;
    if (!el || !c) return next;
    const r = c.getBoundingClientRect();
    return boundView(
      next,
      {
        width: r.width / current.current.zoom,
        height: r.height / current.current.zoom,
      },
      { width: el.clientWidth, height: el.clientHeight },
    );
  };
  const flush = () => {
    cancelAnimationFrame(frame.current);
    frame.current = 0;
    if (pending.current) {
      const next = bound(pending.current);
      pending.current = null;
      current.current = next;
      setView(next);
    }
  };
  function finish(cancelled = false) {
    const g = gesture.current;
    if (!g) return;
    if (cancelled) {
      pending.current = null;
      cancelAnimationFrame(frame.current);
      frame.current = 0;
      setView(g.view);
      current.current = g.view;
    } else flush();
    gesture.current = null;
    if (stage.current?.hasPointerCapture(g.pointer))
      stage.current.releasePointerCapture(g.pointer);
  }
  function zoomTo(zoom: number, client?: { x: number; y: number }) {
    finish();
    const old = current.current;
    const nextZoom = Math.max(0.25, Math.min(4, zoom));
    const r = stage.current?.getBoundingClientRect();
    const px = client && r ? client.x - r.left - r.width / 2 : 0;
    const py = client && r ? client.y - r.top - r.height / 2 : 0;
    const next = bound({
      zoom: nextZoom,
      x: px - ((px - old.x) * nextZoom) / old.zoom,
      y: py - ((py - old.y) * nextZoom) / old.zoom,
    });
    current.current = next;
    setView(next);
  }
  function fit() {
    finish();
    current.current = FIT_VIEW;
    setView(FIT_VIEW);
    setPanning(false);
  }
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const wheel = (e: WheelEvent) => {
      if (
        (!e.ctrlKey && !e.metaKey) ||
        (e.target as HTMLElement).closest("[data-preview-tools]")
      )
        return;
      e.preventDefault();
      zoomTo(current.current.zoom * (e.deltaY > 0 ? 0.9 : 1.1), {
        x: e.clientX,
        y: e.clientY,
      });
    };
    const resize = new ResizeObserver(() => {
      setView((old) => {
        const next = bound(old);
        return old.x === next.x && old.y === next.y ? old : next;
      });
    });
    resize.observe(el);
    el.addEventListener("wheel", wheel, { passive: false });
    return () => {
      resize.disconnect();
      el.removeEventListener("wheel", wheel);
      cancelAnimationFrame(frame.current);
    };
  }, []);
  const handlers = {
    onPointerDownCapture(e: ReactPointerEvent<HTMLDivElement>) {
      if (
        !panning ||
        view.zoom <= 1 ||
        e.button !== 0 ||
        (e.target as HTMLElement).closest("[data-preview-tools]")
      )
        return;
      e.preventDefault();
      e.stopPropagation();
      if (gesture.current) return;
      gesture.current = {
        pointer: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        view: current.current,
      };
      e.currentTarget.focus({ preventScroll: true });
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    onPointerMoveCapture(e: ReactPointerEvent<HTMLDivElement>) {
      const g = gesture.current;
      if (!g || e.pointerId !== g.pointer) return;
      e.preventDefault();
      e.stopPropagation();
      pending.current = {
        ...g.view,
        x: g.view.x + e.clientX - g.x,
        y: g.view.y + e.clientY - g.y,
      };
      if (!frame.current) frame.current = requestAnimationFrame(flush);
    },
    onPointerUpCapture(e: ReactPointerEvent<HTMLDivElement>) {
      if (e.pointerId === gesture.current?.pointer) {
        e.stopPropagation();
        finish();
      }
    },
    onPointerCancelCapture(e: ReactPointerEvent<HTMLDivElement>) {
      if (e.pointerId === gesture.current?.pointer) finish(true);
    },
    onLostPointerCapture() {
      if (gesture.current) finish(true);
    },
  };
  return {
    view,
    panning,
    guides,
    setGuides,
    setPanning,
    zoomTo,
    fit,
    finish,
    handlers,
  };
}
