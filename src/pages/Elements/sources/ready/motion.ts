import { extendedMotions } from "../../../../../video-studio/src/animation/motions/extended";
import { frame } from "../../../../../video-studio/src/animation/layerFrames";
import type { LibraryElement } from "../../types";
import { label, palette } from "./primitives";
export const readyMotion: LibraryElement[] = extendedMotions.map(
  (motion, i) => {
    const layer = label(
      `motion-${motion.id}`,
      "حرّك فكرتك ✦",
      50,
      50,
      60,
      palette[i % 5],
    );
    layer.frames = Array.from({ length: 61 }, (_, n) => {
      const sample = motion.sample(n / 60);
      return frame((n / 60) * 8, {
        x: sample.x,
        y: sample.y,
        scaleX: sample.scale,
        scaleY: sample.scale,
        opacity: sample.opacity,
      });
    });
    return {
      id: `motion-${motion.id}`,
      name: motion.name,
      source: "unitool-motion",
      sourceName: "UniTool Motion 50",
      kind: "layer",
      category: "motion",
      layer,
      animated: true,
    };
  },
);
