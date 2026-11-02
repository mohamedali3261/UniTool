import { test } from "node:test";
import assert from "node:assert/strict";
import {
  sanitizeExtractedText,
  processTextIntoChunks,
  prepareSpeech,
  speechParts,
} from "../src/utils/textProcessor";
import { SpeechEngineService, voiceLanguage } from "../src/utils/speechEngine";
import type { ReaderSettings, BookChunk } from "../src/types";
const settings = {
  speechRate: 1,
  pitch: 1,
  volume: 1,
  selectedArabicVoiceURI: null,
  selectedEnglishVoiceURI: null,
  autoVoiceSelect: true,
} as ReaderSettings;
const voice = (lang: string, name = lang) =>
  ({
    lang,
    name,
    voiceURI: name,
    default: lang === "en-US",
    localService: true,
  }) as SpeechSynthesisVoice;
const chunk = (text: string, language: "ar" | "en" = "ar"): BookChunk => ({
  id: "test",
  text,
  language,
  pageNumber: 1,
  chunkIndex: 0,
  startChar: 0,
  endChar: text.length,
});
function setup(voices = [voice("ar-EG"), voice("en-US")]) {
  const submitted: SpeechSynthesisUtterance[] = [];
  let resumes = 0,
    paused = false,
    speaking = false;
  const synth = {
    getVoices: () => voices,
    speak: (u: SpeechSynthesisUtterance) => {
      submitted.push(u);
      speaking = true;
      u.onstart?.({} as any);
    },
    cancel: () => {
      speaking = false;
    },
    pause: () => {
      paused = true;
    },
    resume: () => {
      resumes++;
      paused = false;
    },
    get paused() {
      return paused;
    },
    get speaking() {
      return speaking;
    },
  } as SpeechSynthesis;
  const engine = new SpeechEngineService(
    synth,
    (text) => ({ text }) as SpeechSynthesisUtterance,
  );
  return {
    engine,
    submitted,
    synth,
    get resumes() {
      return resumes;
    },
    end() {
      speaking = false;
      submitted.at(-1)!.onend?.({} as any);
    },
  };
}
test("Arabic words and meaningful diacritics are not guessed, deleted, or reordered", () => {
  const text =
    "يف عىل برشي املشاركة كِتَابًا يَسُرُّني مُحَمَّدٌ اللهُ لا إله إلا الله ١٢٣ 2026";
  assert.equal(sanitizeExtractedText(text), text.normalize("NFKC"));
});
test("presentation ligatures normalize and join controls do not split Arabic words", () => {
  assert.equal(
    sanitizeExtractedText("ﻻ ﻷ ﻹ ﷲ ا\u200dلعـربية"),
    "لا لأ لإ الله العربية",
  );
});
for (const mode of ["page", "sentence"] as const)
  test(`${mode}: long Arabic text retains every word in order`, () => {
    const text = Array.from({ length: 1500 }, (_, i) => `كَلِمَة${i}`).join(
      " ",
    );
    const chunks = processTextIntoChunks(text, 2, "ar", mode);
    assert.ok(chunks.length > 30);
    assert.equal(chunks.map((c) => c.text).join(" "), text.normalize("NFKC"));
    assert.ok(chunks.every((c) => c.text.length <= 220 && c.language === "ar"));
  });
test("mixed languages use matching chunks without dropping numbers or punctuation", () => {
  const text = "العربية ١٢٣ hello world 2026 مرحبًا بكم!";
  const chunks = processTextIntoChunks(text, 1);
  assert.deepEqual(
    chunks.map((c) => c.language),
    ["ar", "en", "ar"],
  );
  assert.equal(chunks.map((c) => c.text).join(" "), text.normalize("NFKC"));
});
test("chunk offsets match normalized displayed text", () => {
  const text = sanitizeExtractedText(
    "أولًا.\nSecond sentence!\nنهاية.",
  ).replace(/\s+/g, " ");
  for (const c of processTextIntoChunks(text, 1, "ar", "sentence"))
    assert.equal(text.slice(c.startChar, c.endChar), c.text);
});
test("speech source mapping survives removed ornaments, ligature expansion, and wasla", () => {
  const text = "ـٱسم ﷲ، https://example.com مرحبًا";
  const prepared = prepareSpeech(text);
  assert.equal(
    prepared.text,
    "اسم الله، https://example.com مرحبًا".normalize("NFKC"),
  );
  assert.equal(
    prepared.offsets[prepared.text.indexOf("مرحب")],
    text.indexOf("مرحب"),
  );
  assert.equal(
    prepared.offsets[prepared.text.indexOf("الله")],
    text.indexOf("ﷲ"),
  );
  assert.equal(prepared.offsets.length, prepared.text.length);
});
test("even pathological long tokens retain all characters without cutting surrogate pairs", () => {
  const text = "عَ".repeat(300) + "😀".repeat(130);
  const parts = speechParts(text);
  assert.equal(parts.map((p) => p.text).join(""), text);
  assert.ok(
    parts.every(
      (p) => !/^\p{M}|^[\uDC00-\uDFFF]|[\uD800-\uDBFF]$/u.test(p.text),
    ),
  );
});
test("long chunk engine progression submits every word once", () => {
  const mock = setup(),
    text = Array.from({ length: 700 }, (_, i) => `عربي${i}`).join(" ");
  let ended = 0;
  mock.engine.speak(chunk(text), settings, { onEnd: () => ended++ });
  while (!ended && mock.submitted.length < 100) mock.end();
  assert.equal(ended, 1);
  assert.equal(mock.submitted.map((u) => u.text).join(" "), text);
  assert.ok(
    mock.submitted.every(
      (u) => u.text.length <= 220 && u.voice?.lang === "ar-EG",
    ),
  );
});
test("English default must not substitute for missing Arabic voice", () => {
  const mock = setup([voice("en-US")]);
  let error = "";
  mock.engine.speak(chunk("العربية"), settings, {
    onError: (e) => (error = e),
  });
  assert.equal(error, "missing-arabic-voice");
  assert.equal(mock.submitted.length, 0);
});
test("preferred voice cannot override passage language", () => {
  const mock = setup();
  mock.engine.speak(
    chunk("العربية"),
    { ...settings, selectedArabicVoiceURI: "en-US" },
    {},
  );
  assert.equal(mock.submitted[0].voice?.lang, "ar-EG");
  assert.equal(voiceLanguage(voice("ar_EG")), "ar");
  assert.equal(voiceLanguage(voice("fr-FR")), null);
});
test("canceled old callbacks cannot advance or clear a new session", () => {
  const mock = setup();
  let old = 0,
    current = 0;
  mock.engine.speak(chunk("قديم"), settings, {
    onEnd: () => old++,
    onError: () => old++,
  });
  const stale = mock.submitted[0];
  mock.engine.speak(chunk("جديد"), settings, { onEnd: () => current++ });
  stale.onend?.({} as any);
  stale.onerror?.({ error: "canceled" } as any);
  mock.end();
  assert.equal(old, 0);
  assert.equal(current, 1);
});
test("runtime error is surfaced and never silently advances", () => {
  const mock = setup();
  let error = "",
    ended = false;
  mock.engine.speak(chunk("نص طويل ".repeat(100)), settings, {
    onError: (e) => (error = e),
    onEnd: () => (ended = true),
  });
  mock.submitted[0].onerror?.({ error: "network" } as any);
  assert.equal(error, "network");
  assert.equal(ended, false);
  assert.equal(mock.submitted.length, 1);
});
test("pause/resume uses native resume and stopping clears native paused state", () => {
  const mock = setup();
  mock.engine.speak(chunk("مرحبًا"), settings, {});
  mock.engine.pause();
  assert.equal(mock.synth.paused, true);
  mock.engine.resume();
  assert.equal(mock.resumes, 1);
  mock.engine.pause();
  mock.engine.stop();
  assert.equal(mock.synth.paused, false);
});
test("native end while paused restarts from last word instead of skipping remaining text", () => {
  const mock = setup();
  let ended = 0;
  mock.engine.speak(chunk("أول ثاني ثالث"), settings, { onEnd: () => ended++ });
  mock.submitted[0].onboundary?.({
    name: "word",
    charIndex: 4,
    charLength: 4,
  } as any);
  mock.engine.pause();
  mock.end();
  assert.equal(ended, 0);
  mock.engine.resume();
  assert.equal(mock.submitted[1].text, "ثاني ثالث");
  mock.end();
  assert.equal(ended, 1);
});
test("word boundary highlights map back to the exact source word", () => {
  const mock = setup();
  const text = "ـٱسم ﷲ مرحبًا";
  let range: number[] = [];
  mock.engine.speak(chunk(text), settings, {
    onWordBoundary: (s, l) => (range = [s, l]),
  });
  const u = mock.submitted[0];
  u.onboundary?.({
    name: "word",
    charIndex: u.text.indexOf("مرحب"),
    charLength: "مرحبًا".length,
  } as any);
  assert.equal(text.slice(range[0], range[0] + range[1]), "مرحبًا");
});
test("unsupported browser produces an explicit error", () => {
  const engine = new SpeechEngineService(null);
  let error = "";
  engine.speak(chunk("نص"), settings, { onError: (e) => (error = e) });
  assert.equal(error, "unsupported");
});

test("preview/translation cleanup cannot cancel a newer narration session", () => {
  const mock = setup();
  const auxiliary = new SpeechEngineService(
    mock.synth,
    (text) => ({ text }) as SpeechSynthesisUtterance,
  );
  let oldEnded = 0;
  auxiliary.speak(chunk("ترجمة"), settings, { onEnd: () => oldEnded++ });
  const stale = mock.submitted[0];
  mock.engine.speak(chunk("قراءة جديدة"), settings, {});
  auxiliary.stop();
  assert.equal(mock.synth.speaking, true);
  stale.onend?.({} as any);
  assert.equal(oldEnded, 0);
});
