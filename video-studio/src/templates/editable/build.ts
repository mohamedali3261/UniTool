import {
  blankProject,
  newClip,
  uid,
  type TextLayer,
  type Asset,
  type TimelineMarker,
} from "../../types";
import { readAsset } from "../../lib/media";
import type { StudioTemplate } from "../types";
export type Element = Partial<TextLayer> &
  Pick<TextLayer, "text" | "x" | "y" | "size" | "color">;
export const label = (
  name: string,
  text: string,
  x: number,
  y: number,
  size: number,
  color: string,
  extra: Partial<TextLayer> = {},
): Element => ({ name, text, x, y, size, color, ...extra });
export const shape = (
  name: string,
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
  radius = 0,
  extra: Partial<TextLayer> = {},
): Element => ({
  name,
  text: "",
  x,
  y,
  size: 12,
  color: fill,
  background: fill,
  box: { width, height, radius },
  ...extra,
});
/** Only the neutral source is rasterized; every visible design element is a real
 * selectable layer, including the full-frame background. No remote media needed. */
export async function buildEditable(
  template: StudioTemplate,
  scenes: Element[][],
) {
  const project = {
    ...blankProject(),
    name: template.name,
    ratio: template.ratio,
    markers: [] as TimelineMarker[],
  };
  const assets: Asset[] = [];
  let at = 0;
  try {
    const asset = await readAsset(
      new File(
        [
          '<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1280"><rect width="720" height="1280" fill="#101018"/></svg>',
        ],
        `${template.id}-source.svg`,
        { type: "image/svg+xml" },
      ),
    );
    assets.push(asset);
    template.scenes.forEach((scene, i) => {
      project.clips.push({
        ...newClip(asset),
        end: scene.seconds,
        fit: "cover",
      });
      project.markers.push({
        id: uid(),
        time: at,
        label: scene.text,
        color: template.colors[1],
      });
      scenes[i].forEach((element, j) =>
        project.texts.push({
          id: uid(),
          start: at + (j === 0 ? 0 : Math.min(j * 0.045, 0.45)),
          end: at + scene.seconds,
          animationIn: j === 0 ? "none" : "slide",
          animationOut: "none",
          animationDuration: 0.5,
          ...element,
        }),
      );
      at += scene.seconds;
    });
    return { project, assets };
  } catch (e) {
    assets.forEach((a) => URL.revokeObjectURL(a.url));
    throw e;
  }
}
