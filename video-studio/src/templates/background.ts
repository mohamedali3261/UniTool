import type { StudioTemplate } from "./types";
/** Shared by template builds and the Elements library. */
export function templateBackground(template: StudioTemplate, i: number) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="960" viewBox="0 0 960 960"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="${template.colors[0]}"/><stop offset="1" stop-color="#0b1018"/></linearGradient></defs><rect width="960" height="960" fill="url(#g)"/><circle cx="${200 + i * 160}" cy="180" r="300" fill="${template.colors[1]}" opacity=".16"/><circle cx="780" cy="800" r="370" fill="${template.colors[1]}" opacity=".09"/><path d="M0 750 Q480 480 960 740" fill="none" stroke="${template.colors[1]}" stroke-width="2" opacity=".4"/></svg>`;
}
