import { test } from "node:test";
import assert from "node:assert/strict";
import {
  defaults,
  parseProject,
  serializeProject,
  textDirection,
  statistics,
  cleanText,
} from "../src/core/model";
import { layoutText, wrapText } from "../src/core/layout";
import { svgDesign, escapeXml } from "../src/core/render";
const measure = (s: string, size: number) => Array.from(s).length * size * 0.5;
test("versioned project round-trips all editable fields", () =>
  assert.deepEqual(
    parseProject(JSON.parse(serializeProject(defaults))),
    defaults,
  ));
test("rejects wrong versions, injected colors, invalid enums, oversized content, nonfinite sizes and wrong booleans", () => {
  for (const patch of [
    { color: 'red"/><script/>' },
    { font: "system" },
    { text: "a".repeat(1501) },
    { signature: "a".repeat(101) },
    { size: NaN },
    { weight: 900 },
    { background: "url(http://example.com)" },
    { autoFit: "true" },
    { width: 10000 },
  ])
    assert.throws(() =>
      parseProject({ version: 1, design: { ...defaults, ...patch } }),
    );
  assert.throws(() => parseProject({ version: 2, design: defaults }));
  assert.throws(() => parseProject(null));
});
test("imports only allowlisted fields", () => {
  const d = parseProject({
    version: 1,
    design: { ...defaults, onload: "alert(1)" },
  });
  assert.equal("onload" in d, false);
});
test("direction detection follows first strong character and can be overridden", () => {
  assert.equal(textDirection("123 مرحبا Hello", "auto"), "rtl");
  assert.equal(textDirection("123 Hello مرحبا", "auto"), "ltr");
  assert.equal(textDirection("مرحبا", "ltr"), "ltr");
  assert.equal(textDirection("", "auto"), "rtl");
});
test("grapheme and word counters handle Arabic diacritics, emoji and empty text", () => {
  assert.deepEqual(statistics(""), { characters: 0, words: 0, lines: 0 });
  assert.equal(statistics("أَ").characters, 1);
  assert.equal(statistics("👨‍👩‍👧‍👦").characters, 1);
  assert.equal(statistics("مرحبا بالعالم\nHello").words, 3);
  assert.equal(statistics("a\nb").lines, 2);
});
test("cleaning preserves Arabic letters and paragraph structure", () => {
  assert.equal(
    cleanText("  أهلاً   بك \n\n\n هنا ", "spaces"),
    "أهلاً بك\n\nهنا",
  );
  assert.equal(cleanText("أَهْلًا بِك", "diacritics"), "أهلا بك");
  assert.equal(cleanText("جـمـيـل", "tatweel"), "جميل");
  assert.equal(cleanText("مرحبا Hello", "upper"), "مرحبا HELLO");
  assert.equal(cleanText("TEST", "lower"), "test");
});
test("wrapping respects explicit lines and long unbroken tokens", () => {
  assert.deepEqual(wrapText("one two\n\nabcde", 30, 10, measure), [
    "one",
    "two",
    "",
    "abcde",
  ]);
  const lines = wrapText("abcdefghijkl", 15, 10, measure);
  assert.equal(lines.join(""), "abcdefghijkl");
  assert.ok(lines.every((s) => measure(s, 10) <= 15));
});
test("auto-fit chooses a smaller size without modifying text and flags impossible layouts", () => {
  const d = {
    ...defaults,
    width: 320,
    height: 320,
    padding: 24,
    text: "a ".repeat(100),
    signature: "",
    size: 100,
  };
  const result = layoutText(d, measure);
  assert.ok(result.size < 100);
  assert.equal(d.text, "a ".repeat(100));
  const bad = layoutText(
    { ...d, padding: 160, text: "a".repeat(1500) },
    measure,
  );
  assert.equal(bad.overflow, true);
});
test("SVG escapes markup, strips invalid control characters and retains complete selectable text", () => {
  const text = 'مرحبا <script>alert("x")</script> & \u0000';
  const { svg } = svgDesign({ ...defaults, text }, measure);
  assert.ok(svg.includes("&lt;script&gt;"));
  assert.ok(!svg.includes("<script>"));
  assert.ok(!svg.includes("\u0000"));
  assert.ok(svg.includes('font-family="TextStudio-cairo"'));
  assert.equal(escapeXml('"<&'), "&quot;&lt;&amp;");
});
test("transparent SVG has no opaque page background; all effects and decorations render", () => {
  const { svg } = svgDesign(
    {
      ...defaults,
      background: "transparent",
      decoration: "none",
      textGradient: true,
    },
    measure,
  );
  assert.ok(!svg.includes('<rect width="100%" height="100%" fill='));
  assert.ok(svg.includes('fill="url(#ink)"'));
  for (const decoration of ["orbit", "frame", "dots"] as const)
    for (const effect of ["none", "shadow", "glow", "outline"] as const)
      assert.ok(
        svgDesign({ ...defaults, decoration, effect }, measure).svg.endsWith(
          "</svg>",
        ),
      );
});

test("Arabic-Indic digits and tatweel do not override the first strong letter", () => {
  assert.equal(textDirection("١٢٣ Hello", "auto"), "ltr");
  assert.equal(textDirection("ــمرحبا", "auto"), "rtl");
});
