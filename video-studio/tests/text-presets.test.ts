import test from "node:test";
import assert from "node:assert/strict";
import { textPresets, textCategories } from "../src/text/presets";
import { effects } from "../src/effects/registry";
import { validateProjectData } from "../src/lib/projectIO";
import { blankProject } from "../src/types";

test("60 authored text presets have unique names, content, IDs and styles", () => {
  assert.equal(textPresets.length, 60);
  for (const field of ["id", "name", "text"] as const)
    assert.equal(
      new Set(textPresets.map((p) => p[field].trim())).size,
      60,
      field,
    );
  assert.equal(
    new Set(textPresets.map((p) => JSON.stringify(p.style))).size,
    60,
  );
  assert.equal(textCategories.length, 6);
  for (const category of textCategories)
    assert.equal(
      textPresets.filter((p) => p.category === category.id).length,
      10,
    );
});
test("all 60 preset styles survive project validation without losing typography or animation", () => {
  const texts = textPresets.map((p) => ({
    id: p.id,
    text: p.text,
    start: 0,
    end: 5,
    ...p.style,
  }));
  const data = validateProjectData({
    version: 1,
    assets: [
      {
        id: "source",
        name: "sample.png",
        type: "image",
        duration: 5,
        url: "data:image/png;base64,AA==",
      },
    ],
    project: {
      ...blankProject(),
      clips: [
        {
          id: "clip",
          assetId: "source",
          start: 0,
          end: 5,
          speed: 1,
          volume: 1,
          filter: "original",
          brightness: 1,
          contrast: 1,
          saturation: 1,
        },
      ],
      texts,
    },
  });
  for (const [i, t] of data.project.texts.entries()) {
    assert.equal(t.text, texts[i].text);
    for (const key of Object.keys(
      textPresets[i].style,
    ) as (keyof (typeof textPresets)[number]["style"])[]) {
      if (texts[i][key] !== undefined)
        assert.equal(t[key], texts[i][key], `${t.id}/${key}`);
    }
  }
});
test("new filter/effect identifiers remain valid portable project settings", () => {
  const assets = [
    {
      id: "source",
      name: "sample.png",
      type: "image",
      duration: 5,
      url: "data:image/png;base64,AA==",
    },
  ];
  for (const definition of effects) {
    const clip = {
      id: "c",
      assetId: "source",
      start: 0,
      end: 5,
      speed: 1,
      volume: 1,
      filter: definition.kind === "filter" ? definition.id : "original",
      brightness: 1,
      contrast: 1,
      saturation: 1,
      ...(definition.kind === "effect" ? { effect: definition.id } : {}),
    };
    const saved = validateProjectData({
      version: 1,
      assets,
      project: { ...blankProject(), clips: [clip] },
    });
    assert.equal(
      definition.kind === "filter"
        ? saved.project.clips[0].filter
        : saved.project.clips[0].effect,
      definition.id,
    );
  }
});
