import { novaTextLayers } from "./text";
import {
  blankProject,
  newClip,
  uid,
  type Asset,
  type Project,
} from "../../types";
import { readAsset } from "../../lib/media";
import { releaseMediaURL } from "../../media/files";
import { nova } from "./index";
import { novaArt } from "./art";
import { novaSoundtrack, type SoundMode } from "./soundtrack";
export async function buildNova(): Promise<{
  project: Project;
  assets: Asset[];
}> {
  const project = { ...blankProject(), name: nova.name, ratio: nova.ratio };
  project.markers = nova.scenes.map((scene, i) => ({
    id: uid(),
    time: i * 4,
    label: scene.text,
    color: nova.colors[1],
  }));
  const assets: Asset[] = [];
  try {
    for (const [i, scene] of nova.scenes.entries()) {
      const asset = await readAsset(
        new File([novaArt(i)], `NOVA-scene-${i + 1}.svg`, {
          type: "image/svg+xml",
        }),
      );
      assets.push(asset);
      project.clips.push({
        ...newClip(asset),
        end: 4,
        fit: "cover",
        motion: [
          "push-in",
          "pan-left",
          "pull-out",
          "pan-right",
          "push-in",
          "pull-out",
        ][i],
        transition: i
          ? {
              kind: i === 3 ? "light" : i === 5 ? "zoom" : "crossfade",
              duration: 0.55,
            }
          : undefined,
        effect: i === 3 ? "bloom" : undefined,
        effectIntensity: 0.25,
      });
      const at = i * 4;
      project.texts.push(...novaTextLayers(i, at));
    }
    for (const [mode, name] of [
      ["mix", "NOVA • الموسيقى + أصوات الانتقال"],
      ["music", "NOVA • موسيقى فقط"],
      ["sfx", "NOVA • أصوات انتقال فقط"],
    ] as [SoundMode, string][]) {
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      const asset = await readAsset(
        new File([novaSoundtrack(mode)], `${name}.wav`, { type: "audio/wav" }),
      );
      assets.push(asset);
      if (mode === "mix") project.audioId = asset.id;
    }
    project.audioVolume = 0.8;
    project.audioLoop = false;
    return { project, assets };
  } catch (e) {
    assets.forEach((a) => releaseMediaURL(a.url));
    throw e;
  }
}
