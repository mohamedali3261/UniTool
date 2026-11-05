/** Browser-side audit of visible UI chrome. Authored media and dimming scrims
 * are intentionally not UI surfaces; neither should be recolored by a theme. */
export function darkSurfaces() {
  const art =
    "canvas,video,img,svg,.hero-art,.template-art,.interface-mini-art,.format-illustration,.motion-picture,.text-preset-picture,.filter-sample,.effect-picture,.asset-thumb,.timeline-clip,.stock-thumbnail,.canvas-stage,.packaging-hero-art,.packaging-card-photo,.carton-preview,.carton-entry-thumb,.carton-3d-stage,.storage-thumbnail,.dc-template-preview,[data-theme-art]";
  return [...document.querySelectorAll<HTMLElement>("body *")].flatMap(
    (element) => {
      if (element.closest(art)) return [];
      const rect = element.getBoundingClientRect(),
        s = getComputedStyle(element);
      if (
        rect.width < 60 ||
        rect.height < 20 ||
        rect.bottom <= 0 ||
        rect.top >= innerHeight ||
        s.visibility === "hidden" ||
        Number(s.opacity) < 0.6
      )
        return [];
      if (
        /backdrop/.test(element.className) ||
        element.matches('[class*="bg-black/"]')
      )
        return [];
      const colors = [
        s.backgroundColor,
        ...(/1px/.test(s.backgroundImage)
          ? []
          : s.backgroundImage.matchAll(/rgba?\([^)]+\)/g)),
      ].map((v) => (typeof v === "string" ? v : v[0]));
      const dark = colors.some((color) => {
        if (!color.startsWith("rgb")) return false;
        const n = color.match(/[\d.]+/g)?.map(Number);
        return (
          n &&
          n.length >= 3 &&
          (n[3] ?? 1) > 0.6 &&
          Math.max(...n.slice(0, 3)) < 110 &&
          Math.max(...n.slice(0, 3)) - Math.min(...n.slice(0, 3)) < 65
        );
      });
      return dark
        ? [
            {
              tag: element.tagName,
              classes: element.className,
              id: element.id,
              text: (element.textContent || "").trim().slice(0, 45),
              background: s.backgroundColor,
              image: s.backgroundImage,
            },
          ]
        : [];
    },
  );
}
