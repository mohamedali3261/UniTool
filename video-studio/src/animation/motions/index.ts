import { extendedMotions } from "./extended";
import { entryMotions } from "./entry";
import { exitMotions } from "./exit";
import { loopMotions } from "./loop";
import { cameraMotions } from "./camera";
export const motions = [
  ...extendedMotions,
  ...cameraMotions,
  ...entryMotions,
  ...exitMotions,
  ...loopMotions,
];
export const motionById = new Map(motions.map((m) => [m.id, m]));
export const motionCategories = [
  { id: "camera", name: "كاميرا" },
  { id: "entry", name: "دخول" },
  { id: "exit", name: "خروج" },
  { id: "loop", name: "إيقاع ومسارات" },
];
