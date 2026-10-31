import { sourceLayers } from "../../sources/editable";
import { vectorElements } from "../../sources/vector";
import { classify } from "../classify";
export function load() {
  return [...sourceLayers(), ...vectorElements]
    .filter((item) => classify(item) === "typography")
    .map((item) => ({ ...item, category: "typography" as const }));
}
