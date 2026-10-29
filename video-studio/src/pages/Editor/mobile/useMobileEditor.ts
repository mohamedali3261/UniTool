import { useEffect, useState } from "react";
export const mobileEditorQuery =
  "(max-width:650px), (max-width:900px) and (pointer:coarse), (max-height:500px) and (pointer:coarse)";
export type MobilePanel = "library" | "timeline" | "inspector";
/** Keep the editor inside the visible viewport, including the on-screen keyboard. */
export function useMobileEditor() {
  const [mobile, setMobile] = useState(
    () => matchMedia(mobileEditorQuery).matches,
  );
  useEffect(() => {
    const media = matchMedia(mobileEditorQuery),
      change = () => setMobile(media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  useEffect(() => {
    if (!mobile) return;
    const body = document.body,
      root = document.documentElement,
      old = root.style.getPropertyValue("--studio-viewport");
    body.classList.add("studio-mobile-editing");
    const resize = () => {
      const height = window.visualViewport?.height || innerHeight;
      root.style.setProperty("--studio-viewport", `${height}px`);
      body.classList.toggle(
        "studio-keyboard-open",
        height < innerHeight * 0.75,
      );
    };
    resize();
    window.visualViewport?.addEventListener("resize", resize);
    window.addEventListener("resize", resize);
    return () => {
      window.visualViewport?.removeEventListener("resize", resize);
      window.removeEventListener("resize", resize);
      body.classList.remove("studio-mobile-editing", "studio-keyboard-open");
      if (old) root.style.setProperty("--studio-viewport", old);
      else root.style.removeProperty("--studio-viewport");
    };
  }, [mobile]);
  return mobile;
}
