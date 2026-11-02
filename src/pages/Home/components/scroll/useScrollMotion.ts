import { useEffect, type RefObject } from "react";
const clamp = (v: number) => Math.max(0, Math.min(1, v));
/** Event-driven RAF, active chapters only. No scroll hijacking or per-frame React state. */
export function useScrollMotion(
  ref: RefObject<HTMLElement | null>,
  paused: boolean,
) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const nodes = Array.from(
      root.querySelectorAll<HTMLElement>("[data-scroll-scene]"),
    );
    const active = new Set<HTMLElement>();
    const chapterLinks = Array.from(
      root.querySelectorAll<HTMLAnchorElement>(".journey-nav a"),
    );
    let currentChapter = "";
    let frame = 0;
    const settled = () => {
      for (const el of nodes) {
        el.style.setProperty("--enter", "1");
        el.style.setProperty("--progress", ".5");
        el.style.setProperty("--drift", "0px");
        el.style.setProperty("--turn", "0deg");
        el.style.setProperty("--zoom", "1");
        el.style.setProperty("--draw", "0");
      }
    };
    const paint = () => {
      frame = 0;
      if (document.hidden || paused || media.matches) return;
      const h = innerHeight;
      let nearest = "",
        distance = Infinity;
      for (const el of active) {
        if (!el.classList.contains("journey-chapter")) continue;
        const r = el.getBoundingClientRect();
        if (r.top < h * 0.7 && r.bottom > 150) {
          const d = Math.abs(r.top - 140);
          if (d < distance) {
            nearest = el.id;
            distance = d;
          }
        }
      }
      if (nearest !== currentChapter) {
        currentChapter = nearest;
        for (const link of chapterLinks) {
          if (link.hash === `#${nearest}`)
            link.setAttribute("aria-current", "step");
          else link.removeAttribute("aria-current");
        }
      }
      for (const el of active) {
        const r = el.getBoundingClientRect();
        const progress = clamp((h - r.top) / (h + r.height));
        const enter = clamp((h - r.top) / (h * 0.72));
        el.style.setProperty("--progress", progress.toFixed(4));
        el.style.setProperty("--enter", enter.toFixed(4));
        el.style.setProperty(
          "--drift",
          `${((0.5 - progress) * 110).toFixed(2)}px`,
        );
        el.style.setProperty(
          "--turn",
          `${((0.5 - progress) * 24).toFixed(2)}deg`,
        );
        el.style.setProperty("--zoom", `${(0.86 + enter * 0.14).toFixed(4)}`);
        el.style.setProperty("--draw", `${(1 - enter).toFixed(4)}`);
      }
    };
    const request = () => {
      if (!frame && !paused && !media.matches && !document.hidden)
        frame = requestAnimationFrame(paint);
    };
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const el = e.target as HTMLElement;
          if (e.isIntersecting) {
            active.add(el);
            el.dataset.visible = "true";
          } else {
            active.delete(el);
            el.dataset.visible = "false";
          }
        }
        request();
      },
      { rootMargin: "200px 0px" },
    );
    nodes.forEach((el) => observer.observe(el));
    const preference = () => {
      if (paused || media.matches) {
        cancelAnimationFrame(frame);
        frame = 0;
        settled();
      } else request();
    };
    const visibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else request();
    };
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    media.addEventListener("change", preference);
    document.addEventListener("visibilitychange", visibility);
    root.dataset.scrollMotion = "ready";
    preference();
    request();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
      media.removeEventListener("change", preference);
      document.removeEventListener("visibilitychange", visibility);
      delete root.dataset.scrollMotion;
    };
  }, [ref, paused]);
}
