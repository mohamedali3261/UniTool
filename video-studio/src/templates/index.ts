import { orbitLaunch, buildOrbitLaunch } from "./orbit-launch";
import { paperStories, buildPaperStories } from "./paper-stories";
import { interfaceFlow } from "./interface-flow";
import { buildInterfaceFlow } from "./interface-flow/build";
import { nova } from "./nova";
import { buildNova } from "./nova/build";
import { reel } from "./reel";
import { product } from "./product";
import { quote } from "./quote";
import { slideshow } from "./slideshow";
import { uid, blankProject, newClip, type Project, type Asset } from "../types";
import { readAsset } from "../lib/media";
import type { StudioTemplate } from "./types";
export const templates = [
  reel,
  product,
  quote,
  slideshow,
  nova,
  interfaceFlow,
  orbitLaunch,
  paperStories,
];
export async function buildTemplate(
  template: StudioTemplate,
): Promise<{ project: Project; assets: Asset[] }> {
  if (template.id === "orbit-launch") return buildOrbitLaunch();
  if (template.id === "paper-stories") return buildPaperStories();
  if (template.id === "interface-flow") return buildInterfaceFlow();
  if (template.id === "nova") return buildNova();
  const project: Project = {
    ...blankProject(),
    name: template.name,
    ratio: template.ratio,
  };
  const assets: Asset[] = [];
  let at = 0;
  try {
    for (const [i, scene] of template.scenes.entries()) {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="960" viewBox="0 0 960 960"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="${template.colors[0]}"/><stop offset="1" stop-color="#0b1018"/></linearGradient></defs><rect width="960" height="960" fill="url(#g)"/><circle cx="${200 + i * 160}" cy="180" r="300" fill="${template.colors[1]}" opacity=".16"/><circle cx="780" cy="800" r="370" fill="${template.colors[1]}" opacity=".09"/><path d="M0 750 Q480 480 960 740" fill="none" stroke="${template.colors[1]}" stroke-width="2" opacity=".4"/></svg>`;
      const asset = await readAsset(
        new File([svg], `${template.id}-${i + 1}.svg`, {
          type: "image/svg+xml",
        }),
      );
      assets.push(asset);
      project.clips.push({
        ...newClip(asset),
        end: scene.seconds,
        fit: "cover",
        motion: i % 2 ? "pull-out" : "push-in",
        transition: i ? { kind: "crossfade", duration: 0.8 } : undefined,
      });
      project.texts.push(
        {
          id: uid(),
          text: scene.text,
          start: at + 0.25,
          end: at + scene.seconds - 0.2,
          x: 50,
          y: 45,
          size: template.id === "quote" ? 48 : 58,
          color: "#ffffff",
          animationIn: template.id === "quote" ? "typewriter" : "slide",
          animationOut: "fade",
          animationDuration: template.id === "quote" ? 2 : 0.5,
        },
        {
          id: uid(),
          text: scene.caption,
          start: at + 0.6,
          end: at + scene.seconds - 0.2,
          x: 50,
          y: 68,
          size: 26,
          color: template.colors[1],
          animationIn: "fade",
          animationOut: "fade",
          animationDuration: 0.5,
        },
      );
      at += scene.seconds;
    }
    return { project, assets };
  } catch (error) {
    assets.forEach((a) => URL.revokeObjectURL(a.url));
    throw error;
  }
}
