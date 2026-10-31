import { templateTextLayers } from "./text";
import { templateBackground } from "./background";
import { cloudflareChecklist } from "./cloudflare-checklist";
import { cloudflareProject } from "./cloudflare-checklist/project";
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
import { blankProject, newClip, type Project, type Asset } from "../types";
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
  cloudflareChecklist,
];
export async function buildTemplate(
  template: StudioTemplate,
): Promise<{ project: Project; assets: Asset[] }> {
  if (template.id === "cloudflare-checklist") return cloudflareProject();
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
      const svg = templateBackground(template, i);
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
      project.texts.push(...templateTextLayers(template, i, at));
      at += scene.seconds;
    }
    return { project, assets };
  } catch (error) {
    assets.forEach((a) => URL.revokeObjectURL(a.url));
    throw error;
  }
}
