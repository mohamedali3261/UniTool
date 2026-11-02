import { uid, type TextLayer } from "../types";
import type { StudioTemplate } from "./types";
/** The editor and Elements share these exact text layers. */
export function templateTextLayers(
  template: StudioTemplate,
  i: number,
  at: number,
): TextLayer[] {
  const scene = template.scenes[i];
  return [
    {
      id: uid(),
      text: scene.text,
      start: at + 0.25,
      end: at + scene.seconds - 0.2,
      x: 50,
      y: 45,
      size: template.id === "quote" ? 48 : 58,
      color: "#ffffff",
      animationIn: template.id === "quote" ? "typewriter" : "slide",
      animationOut: "fade",
      animationDuration: template.id === "quote" ? 2 : 0.5,
    },
    {
      id: uid(),
      text: scene.caption,
      start: at + 0.6,
      end: at + scene.seconds - 0.2,
      x: 50,
      y: 68,
      size: 26,
      color: template.colors[1],
      animationIn: "fade",
      animationOut: "fade",
      animationDuration: 0.5,
    },
  ];
}
