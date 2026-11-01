import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildText,
  normalizeSearch,
  hits,
  fullTextMatch,
} from "../src/core/text";
import { parseProject } from "../src/core/project";
import type { TextRun } from "../src/core/types";
const run = (str: string, x = 0, y = 0, dir = "rtl"): TextRun => ({
  str,
  x,
  y,
  dir,
  w: 100,
  h: 15,
  end: false,
});
test("Arabic search normalization removes marks and tatweel but preserves the original string", () => {
  const original = "العَرَبِيَّةُ — إِصْدَار الألفـى";
  assert.equal(normalizeSearch(original), "العربية — اصدار الالفي");
  assert.ok(fullTextMatch(original, "العربية"));
  assert.equal(original, "العَرَبِيَّةُ — إِصْدَار الألفـى");
});
test("logical Arabic strings and mixed numerals are never blindly reversed", () => {
  const t = buildText([run("مرحبًا بكم", 200), run("12345", 100, 0, "ltr")]);
  assert.equal(t.source, "مرحبًا بكم 12345");
  assert.ok(t.lines.includes("مرحبًا بكم"));
  assert.ok(!t.source.includes("مكب"));
  assert.equal(hits(t, "مرحبا").length, 1);
});
test("geometric reading order sorts Arabic runs right-to-left without reversing characters", () => {
  const t = buildText([
    run("الثاني", 100, 0),
    run("الأول", 300, 0),
    run("السطر التالي", 300, 40),
  ]);
  assert.equal(t.lines, "الأول الثاني\nالسطر التالي");
  assert.equal(t.source, "الثاني الأول السطر التالي");
});
test("encoding and empty-page warnings are explicit instead of fabricating reliable text", () => {
  assert.ok(buildText([]).warnings.includes("no-text"));
  assert.ok(buildText([run("\uFFFD\uE000")]).warnings.includes("encoding"));
  assert.equal(buildText([run("عربي سليم")]).characters, 9);
});
test("project recovery is fingerprint-bound and validates pages, bounds and content", () => {
  const project = {
    version: 1,
    fingerprint: "sha",
    pages: [
      {
        id: "p",
        source: 0,
        rotation: 90,
        annotations: [
          {
            id: "a",
            type: "text",
            x: 20,
            y: 30,
            w: 100,
            h: 60,
            fontSize: 22,
            color: "#303030",
            text: "مرحبا 123",
          },
        ],
      },
    ],
  };
  assert.equal(
    parseProject(project, "sha", 1).pages[0].annotations[0].text,
    "مرحبا 123",
  );
  assert.throws(() => parseProject(project, "different", 1));
  assert.throws(() => parseProject({ ...project, pages: [] }, "sha", 1));
  assert.throws(() =>
    parseProject(
      { ...project, pages: [{ ...project.pages[0], rotation: 37 }] },
      "sha",
      1,
    ),
  );
  assert.throws(() =>
    parseProject(
      {
        ...project,
        pages: [
          {
            ...project.pages[0],
            annotations: [
              { ...project.pages[0].annotations[0], color: "url(unsafe)" },
            ],
          },
        ],
      },
      "sha",
      1,
    ),
  );
  assert.throws(() =>
    parseProject(
      {
        ...project,
        pages: [
          {
            ...project.pages[0],
            annotations: [{ ...project.pages[0].annotations[0], x: Infinity }],
          },
        ],
      },
      "sha",
      1,
    ),
  );
});
test("Arabic glyph fragments join using geometry while real word gaps remain", () => {
  const r = (str: string, x: number, w: number, dir = "rtl") => ({
    ...run(str, x, 0, dir),
    w,
    h: 20,
  });
  const t = buildText([
    r("القاهرة", 10, 40),
    r("في", 60, 10),
    r("بكم", 80, 20),
    r("ا", 111, 4),
    r("ً", 112, 0, "ltr"),
    r("ب", 116, 4),
    r("مرح", 120, 25),
  ]);
  assert.equal(t.lines, "مرحبًا بكم في القاهرة");
  assert.equal(hits(t, "مرحبا").length, 3);
  assert.equal(hits(t, "بكم في القاهرة").length, 3);
});
test("rotated visual coordinates do not change logical reading coordinates", () => {
  const a = { ...run("مرحبا", 0, 500), read: { x: 200, y: 20, w: 50, h: 20 } },
    b = { ...run("بكم", 0, 400), read: { x: 140, y: 20, w: 45, h: 20 } };
  assert.equal(buildText([b, a]).lines, "مرحبا بكم");
});
test("null glyph mappings trigger an explicit encoding warning", () => {
  assert.ok(buildText([run("عربي\u0000")]).warnings.includes("encoding"));
});
test("search tolerates bidi controls, presentation forms and Arabic/Persian numerals without altering display", () => {
  assert.equal(normalizeSearch("فاتورة \u200f١٢٣۴۵"), "فاتورة 12345");
  assert.ok(fullTextMatch("ﻻختبار   ١٢٣", "لاختبار 123"));
});

test("display expands Arabic presentation forms while preserving unmodified extraction for diagnostics", () => {
  const raw = "ﻧﻮع اﻟﺘﺄﺳﻴﺲ / Formation Type",
    t = buildText([run(raw)]);
  assert.equal(t.source, "نوع التأسيس / Formation Type");
  assert.equal(t.lines, "نوع التأسيس / Formation Type");
  assert.equal(t.rawSource, raw);
  assert.equal(t.runs[0].str, raw);
  assert.deepEqual(t.encodingIssues, []);
});
test("font-private symbols in the reported pattern are flagged and never guessed as letters", () => {
  const raw = "ﻧﻮع اﻟ\uE018ﺄﺳﻴﺲ / Formation Type\nﺟﺮ\uE032ﻦ",
    t = buildText([run(raw)]);
  assert.equal(t.source, "نوع ال�أسيس / Formation Type\nجر�ن");
  assert.equal(t.rawSource, raw);
  assert.deepEqual(t.encodingIssues, [
    { code: "U+E018", count: 1 },
    { code: "U+E032", count: 1 },
  ]);
  assert.ok(t.warnings.includes("encoding"));
  assert.ok(!t.source.includes("التأسيس"));
});
test("unknown code accounting includes supplementary private-use planes and replacement glyphs", () => {
  const t = buildText([run("\uE018\uE018\u{F0018}\u{100018}\uFFFD\u0000")]);
  assert.equal(t.source, "������");
  assert.deepEqual(t.encodingIssues, [
    { code: "U+E018", count: 2 },
    { code: "U+F0018", count: 1 },
    { code: "U+100018", count: 1 },
    { code: "U+FFFD", count: 1 },
    { code: "U+0000", count: 1 },
  ]);
});
test("display cleanup preserves legal-document dates, identifiers, digits and ordinary marks", () => {
  const text =
    "04-Apr-2027 / 05-Apr-2025\nرقم 001.02 / ١٢٣۴۵\nالعَرَبِيَّةُ ① Å https://example.invalid/?d=ABC%2B";
  assert.equal(buildText([run(text)]).source, text);
});
test("presentation-form vowel placeholders do not add spaces inside Arabic words", () => {
  assert.equal(buildText([run("ﺑﹶﺎﺏ")]).source, "بَاب");
  assert.equal(buildText([run("بـاب")]).source, "بـاب");
});
test("search retains original run coordinates after presentation forms expand", () => {
  const r = run("ﻻختبار", 24, 30);
  const t = buildText([r]);
  assert.equal(t.lines, "لاختبار");
  assert.equal(hits(t, "لاختبار")[0], r);
  assert.equal(r.x, 24);
});
