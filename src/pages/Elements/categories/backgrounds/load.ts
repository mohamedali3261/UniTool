import { readyElements } from "../../sources/ready";
import { sourceLayers } from "../../sources/editable";
import { vectorElements } from "../../sources/vector";
import { classify } from "../classify";
export function load() {
  return [
    ...readyElements.filter((i) => i.kind !== "group"),
    ...sourceLayers(),
    ...vectorElements,
  ]
    .filter((item) => classify(item) === "backgrounds")
    .map((item) => ({ ...item, category: "backgrounds" as const }));
}
