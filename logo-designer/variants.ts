import { uid, type Project, type Element } from "./types";
export type DesignVariant = {
  id: string;
  name: string;
  background: string;
  nodes: Element[];
};
/** النسخة النشطة تُحفظ في الجذر؛ عند التبديل نحدّث لقطة النسخة المغادرة أولًا. */
export function syncVariants(p: Project): DesignVariant[] {
  return p.variants?.length
    ? p.variants.map((v) =>
        v.id === p.activeVariant
          ? { ...v, background: p.background, nodes: structuredClone(p.nodes) }
          : v,
      )
    : [
        {
          id: uid(),
          name: "Original",
          background: p.background,
          nodes: structuredClone(p.nodes),
        },
      ];
}
export function addVariant(
  p: Project,
  mode: "copy" | "dark" | "light" | "mono",
): Project {
  const list = syncVariants(p);
  if (list.length >= 8) throw new Error("Maximum 8 variants");
  const variant: DesignVariant = {
    id: uid(),
    name: {
      copy: "Alternative",
      dark: "Dark",
      light: "Light",
      mono: "Monochrome",
    }[mode],
    background:
      mode === "copy" ? p.background : mode === "dark" ? "#14221d" : "#ffffff",
    nodes: structuredClone(p.nodes).map((n) =>
      mode === "copy" || n.kind === "image"
        ? n
        : {
            ...n,
            fill: mode === "dark" ? "#f0fff6" : "#15261f",
            fill2: mode === "dark" ? "#a8dfbd" : "#4d8061",
            stroke: mode === "dark" ? "#f0fff6" : "#15261f",
            gradient: mode === "mono" ? false : n.gradient,
            recolor: true,
          },
    ),
  };
  return {
    ...p,
    variants: [...list, variant],
    activeVariant: variant.id,
    background: variant.background,
    nodes: variant.nodes,
  };
}
export function switchVariant(p: Project, id: string): Project {
  const list = syncVariants(p),
    v = list.find((v) => v.id === id);
  return v
    ? {
        ...p,
        variants: list,
        activeVariant: id,
        background: v.background,
        nodes: structuredClone(v.nodes),
      }
    : p;
}
