import { entryMotions } from "./entry";
import type { MotionDefinition } from "./types";
export const exitMotions: MotionDefinition[] = entryMotions.map((m) => ({
  id: m.id.replace("enter-", "exit-"),
  name: "خروج — " + m.name,
  category: "exit",
  sample: (p) => m.sample(1 - p),
}));
