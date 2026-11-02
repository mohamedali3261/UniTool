import { uid, type TextLayer } from "../../types";
import { nova } from "./index";
/** The editor and Elements share these exact text layers. */
export function novaTextLayers(i: number, at: number): TextLayer[] {
  const scene = nova.scenes[i];
  return [
    {
      id: uid(),
      text: scene.text,
      start: at + 0.22,
      end: at + 3.8,
      x: 50,
      y: 43,
      size: 68,
      color: "#ffffff",
      bold: true,
      font: "sans",
      outline: true,
      animationIn: i === 4 ? "typewriter" : i % 2 ? "pop" : "slide",
      animationOut: "fade",
      animationDuration: i === 4 ? 0.8 : 0.45,
    },
    {
      id: uid(),
      text: scene.caption,
      start: at + 0.65,
      end: at + 3.8,
      x: 50,
      y: 61,
      size: 29,
      color: nova.colors[1],
      animationIn: "fade",
      animationOut: "fade",
      animationDuration: 0.5,
    },
  ];
}
