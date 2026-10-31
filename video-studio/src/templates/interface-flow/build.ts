import { interfaceTextLayers, interfaceIdentityLayers } from "./text";
import {
  blankProject,
  newClip,
  uid,
  type Asset,
  type Project,
} from "../../types";
import { readAsset } from "../../lib/media";
import { releaseMediaURL } from "../../media/files";
import { novaSoundtrack } from "../nova/soundtrack";
import { soundById } from "../../sound/presets";
import { synthSound } from "../../sound/synth";
import { interfaceFlow } from "./index";
import { interfaceScenes } from "./scenes";
export async function buildInterfaceFlow(): Promise<{
  project: Project;
  assets: Asset[];
}> {
  const project: Project = {
    ...blankProject(),
    name: interfaceFlow.name,
    ratio: "9:16",
    sounds: [],
    markers: [],
  };
  const assets: Asset[] = [];
  try {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1280"><defs><radialGradient id="b"><stop stop-color="#123b30"/><stop offset="1" stop-color="#071013"/></radialGradient></defs><rect width="720" height="1280" fill="url(#b)"/></svg>';
    const base = await readAsset(
      new File([svg], "interface-flow-background.svg", {
        type: "image/svg+xml",
      }),
    );
    assets.push(base);
    let at = 0;
    for (const [i, scene] of interfaceFlow.scenes.entries()) {
      project.clips.push({
        ...newClip(base),
        end: scene.seconds,
        fit: "cover",
        designScene: interfaceScenes[i].id,
        designAccent: interfaceFlow.colors[1],
        transition: i ? { kind: "crossfade", duration: 0.3 } : undefined,
      });
      project.markers!.push({
        id: uid(),
        time: at,
        label: scene.text,
        color: interfaceFlow.colors[1],
      });
      project.texts.push(...interfaceTextLayers(i, at));
      at += scene.seconds;
    }
    project.texts.push(...interfaceIdentityLayers());
    await new Promise<void>((r) => setTimeout(r, 0));
    const music = await readAsset(
      new File(
        [novaSoundtrack("music")],
        "Interface Flow • موسيقى اختيارية.wav",
        { type: "audio/wav" },
      ),
    );
    assets.push(music);
    project.audioId = music.id;
    project.audioVolume = 0.18;
    project.audioLoop = true;
    for (const id of ["whoosh-2", "ui-1"]) {
      const preset = soundById.get(id)!;
      const a = await readAsset(
        new File([synthSound(preset)], `${preset.name}.wav`, {
          type: "audio/wav",
        }),
      );
      assets.push(a);
      for (const when of id === "whoosh-2"
        ? [8, 18, 28, 38, 48, 58]
        : [11, 31, 43, 64, 64.45, 64.9, 65.35])
        project.sounds!.push({
          id: uid(),
          assetId: a.id,
          at: id === "whoosh-2" ? when - 0.3 : when,
          start: 0,
          end: a.duration,
          volume: id === "whoosh-2" ? 0.25 : 0.5,
        });
    }
    return { project, assets };
  } catch (e) {
    assets.forEach((a) => releaseMediaURL(a.url));
    throw e;
  }
}
