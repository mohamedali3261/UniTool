import test from "node:test";
import assert from "node:assert/strict";
import {
  blankProject,
  clipDuration,
  durationOf,
  timeLabel,
  filterCss,
  type Clip,
  type Project,
  type Asset,
} from "../src/types";
import { locate } from "../src/lib/media";
import { loadProject } from "../src/lib/projectIO";
const clip: Clip = {
  id: "clip-1",
  assetId: "asset-1",
  start: 2,
  end: 10,
  filter: "original",
  brightness: 1,
  contrast: 1,
  saturation: 1,
  volume: 1,
  speed: 2,
};
const project: Project = {
  ...blankProject(),
  clips: [clip, { ...clip, id: "clip-2", speed: 1 }],
};
const asset: Asset = {
  id: "asset-1",
  name: "clip.webm",
  type: "video",
  duration: 10,
  url: "data:video/webm;base64,AA==",
};
const file = (p: unknown, assets: unknown = [asset]) =>
  new File(
    [JSON.stringify({ version: 1, project: p, assets })],
    "project.json",
  );
test("duration respects trim and playback speed", () => {
  assert.equal(clipDuration(clip), 4);
  assert.equal(durationOf(project), 12);
  assert.equal(durationOf(blankProject()), 0);
});
test("timeline boundaries and local media time", () => {
  assert.equal(locate(project, 0)?.local, 2);
  assert.equal(locate(project, 3)?.local, 8);
  assert.equal(locate(project, 4)?.clip.id, "clip-2");
  assert.equal(locate(project, 5)?.local, 3);
  assert.equal(locate(blankProject(), 0), null);
  assert.ok(locate(project, 12)!.local < 10);
});
test("time labels and non-destructive filter", () => {
  assert.equal(timeLabel(125.4), "02:05");
  assert.match(filterCss({ ...clip, filter: "mono" }), /grayscale\(1\)/);
  assert.equal(clip.filter, "original");
});
test("portable project roundtrip preserves edits and embedded media", async () => {
  const d = await loadProject(file(project));
  assert.deepEqual(d.project, project);
  assert.deepEqual(d.assets, [asset]);
});
test("reject remote media and duplicate asset IDs", async () => {
  await assert.rejects(
    loadProject(
      file(project, [{ ...asset, url: "https://example.com/video.webm" }]),
    ),
  );
  await assert.rejects(loadProject(file(project, [asset, asset])));
});
test("reject malformed, unsupported, missing media and unsafe values", async () => {
  for (const p of [
    null,
    { ...project, ratio: "bad" },
    { ...project, audioVolume: 2 },
    { ...project, audioId: "missing" },
    { ...project, clips: [{ ...clip, speed: 0 }] },
    { ...project, clips: [{ ...clip, end: 100 }] },
    { ...project, clips: [{ ...clip, volume: -1 }] },
    {
      ...project,
      texts: [
        {
          id: "text",
          text: "a",
          color: "#fff",
          start: 2,
          end: 1,
          x: 50,
          y: 50,
          size: 52,
        },
      ],
    },
  ])
    await assert.rejects(loadProject(file(p)));
});
test("allow image holds longer than source default duration", async () => {
  const p = { ...project, clips: [{ ...clip, assetId: "image", end: 30 }] };
  const d = await loadProject(
    file(p, [
      {
        ...asset,
        id: "image",
        type: "image",
        duration: 5,
        url: "data:image/png;base64,AA==",
      },
    ]),
  );
  assert.equal(d.project.clips[0].end, 30);
});

test("new transform, fade and audio controls roundtrip while old projects remain valid", async () => {
  const p = {
    ...project,
    audioStart: 2,
    audioOffset: 1,
    audioLoop: false,
    clips: [
      {
        ...clip,
        rotation: 90,
        flipX: true,
        flipY: false,
        zoom: 1.5,
        fit: "cover",
        fadeIn: 0.5,
        fadeOut: 0.5,
      },
    ],
  };
  assert.deepEqual((await loadProject(file(p))).project, p);
});
test("reject invalid optional transforms, fades and audio settings", async () => {
  for (const extra of [
    { rotation: -1 },
    { zoom: 0 },
    { flipX: "yes" },
    { fit: "stretch" },
    { fadeIn: -1 },
    { fadeOut: 100 },
  ])
    await assert.rejects(
      loadProject(file({ ...project, clips: [{ ...clip, ...extra }] })),
    );
  await assert.rejects(loadProject(file({ ...project, audioStart: -1 })));
  await assert.rejects(loadProject(file({ ...project, audioLoop: "false" })));
});

test("portable downloads always preserve MP4 and project file extensions", async () => {
  const { portableFilename } = await import("../src/lib/media");
  assert.equal(portableFilename("مشروعي الجديد.mp4"), "UniTool-project.mp4");
  assert.equal(
    portableFilename("مشروع.unitool.json"),
    "UniTool-project.unitool.json",
  );
  assert.equal(portableFilename("My video.mp4"), "My-video.mp4");
});
