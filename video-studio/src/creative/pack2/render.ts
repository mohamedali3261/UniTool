import type { CreativeSettings } from "../catalog";
import type { C } from "../renderers/common";
import { packBackground } from "./backgrounds";
import { packShape } from "./shapes";
import { packUI } from "./ui";
import { packData } from "./data";
import { packIcon } from "./icons";
export function drawPack2(
  c: C,
  id: string,
  t: number,
  color: string,
  text: string,
  settings: CreativeSettings,
) {
  const [, group, key] = id.split("-");
  switch (group) {
    case "bg":
      packBackground(c, key, t, color);
      break;
    case "shape":
      packShape(c, key, t, color);
      break;
    case "ui":
      packUI(c, key, t, color, text);
      break;
    case "data":
      packData(c, key, t, color, text, settings);
      break;
    case "icon":
      packIcon(c, key, t, color);
      break;
  }
}
