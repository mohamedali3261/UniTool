import { uid, type TextLayer } from "../../types";
import { interfaceFlow } from "./index";
/** Shared editor/library source: no duplicated artwork. */
export function interfaceTextLayers(i: number, at: number): TextLayer[] {
  const scene = interfaceFlow.scenes[i];
  return [
    {
      id: uid(),
      text: scene.text,
      start: at + 0.15,
      end: at + scene.seconds - 0.15,
      x: 50,
      y: 18,
      size: i === 1 ? 60 : 66,
      color: "#edf9f2",
      font: i < 6 ? "mono" : "sans",
      bold: true,
      animationIn: "slide",
      animationOut: "fade",
      animationDuration: 0.45,
    },
    {
      id: uid(),
      text: scene.caption,
      start: at + 0.6,
      end: at + scene.seconds - 0.15,
      x: 50,
      y: i === 0 ? 29 : 26,
      size: i === 0 ? 51 : 34,
      color: interfaceFlow.colors[1],
      animationIn: "fade",
      animationOut: "fade",
      animationDuration: 0.5,
    },
  ];
}
export function interfaceIdentityLayers(): TextLayer[] {
  return [
    {
      id: uid(),
      text: "@yourname",
      start: 0,
      end: 70,
      x: 50,
      y: 95,
      size: 24,
      color: "#8eafa1",
      font: "mono",
    },
    {
      id: uid(),
      text: "كلود",
      start: 64,
      end: 69.6,
      x: 50,
      y: 59.4,
      size: 38,
      color: "#e7f9f0",
      animationIn: "typewriter",
      animationDuration: 1.8,
    },
  ];
}
