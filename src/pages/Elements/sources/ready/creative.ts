import {
  creativeCatalog,
  textCreativeIds,
} from "../../../../../video-studio/src/creative/catalog";
import type { LibraryElement } from "../../types";
import { label } from "./primitives";
export const creativeElements: LibraryElement[] = creativeCatalog.map(
  ([id, name, category]) => {
    const isText = textCreativeIds.has(id),
      bg = category === "backgrounds";
    const layer = label(
      `creative-${id}`,
      id === "odometer"
        ? "012345"
        : isText
          ? "أفكار تستحق المشاهدة"
          : name.split(" · ")[1],
      50,
      50,
      isText ? 60 : 32,
      "#63dfba",
    );
    layer.creative = { id, speed: 1, strength: 1, pointerX: 50, pointerY: 50 };
    layer.name = name;
    layer.font = id === "scramble" || id === "odometer" ? "mono" : "sans";
    if (!isText)
      layer.box = { width: bg ? 960 : 800, height: bg ? 540 : 450, radius: 0 };
    if (bg) layer.backgroundLayer = true;
    return {
      id: `creative-${id}`,
      name,
      source: "unitool-creative",
      sourceName: "Creative Motion / حركات إبداعية",
      kind: "layer",
      category,
      animated: true,
      layer,
      placement: bg ? "background" : "content",
    };
  },
);
