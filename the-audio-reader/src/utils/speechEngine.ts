import { BookChunk, DeviceVoice, ReaderSettings } from "../types";
import { prepareSpeech, speechParts } from "./textProcessor";
export interface SpeechCallbacks {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
  onWordBoundary?: (charIndex: number, charLength: number) => void;
}
export function voiceLanguage(
  v: Pick<SpeechSynthesisVoice, "lang" | "name">,
): "ar" | "en" | null {
  const lang = v.lang.toLowerCase().replace(/_/g, "-");
  if (
    /^ar(?:-|$)/.test(lang) ||
    /arabic|عربي|maged|tarik|laila|zeina/i.test(v.name)
  )
    return "ar";
  if (/^en(?:-|$)/.test(lang) || /english/i.test(v.name)) return "en";
  return null;
}
// محرك المتصفح مشترك بين القراءة والمعاينة والترجمة؛ المالك وحده يلغي النطق.
const owners = new WeakMap<SpeechSynthesis, SpeechEngineService>();
/** جلسة مرقمة تمنع وصول نهاية/خطأ من قراءة أُلغيت إلى قراءة جديدة. */
export class SpeechEngineService {
  private synth: SpeechSynthesis | null;
  private current: SpeechSynthesisUtterance | null = null;
  private generation = 0;
  private paused = false;
  private restart = false;
  private lastBoundary = 0;
  private resumeCurrent: (() => void) | null = null;
  private pending: (() => void) | null = null;
  constructor(
    synth: SpeechSynthesis | null = typeof window !== "undefined" &&
    "speechSynthesis" in window
      ? window.speechSynthesis
      : null,
    private utteranceFactory: (text: string) => SpeechSynthesisUtterance = (
      text,
    ) => new SpeechSynthesisUtterance(text),
  ) {
    this.synth = synth;
  }
  isSupported() {
    return this.synth !== null;
  }
  async getAvailableVoices(): Promise<DeviceVoice[]> {
    if (!this.synth) return [];
    if (!this.synth.getVoices().length)
      await new Promise<void>((resolve) => {
        let timer: ReturnType<typeof setTimeout>;
        const done = () => {
          clearTimeout(timer);
          this.synth?.removeEventListener("voiceschanged", done);
          resolve();
        };
        this.synth!.addEventListener("voiceschanged", done);
        timer = setTimeout(done, 1500);
      });
    return this.synth.getVoices().map((v) => ({
      voiceURI: v.voiceURI,
      name: v.name,
      lang: v.lang,
      isDefault: v.default,
      isArabic: voiceLanguage(v) === "ar",
      isEnglish: voiceLanguage(v) === "en",
      localService: v.localService,
    }));
  }
  findVoice(lang: "ar" | "en", preferred: string | null, _auto = true) {
    const candidates =
      this.synth?.getVoices().filter((v) => voiceLanguage(v) === lang) || [];
    return (
      candidates.find((v) => v.voiceURI === preferred) ||
      candidates.find(
        (v) =>
          v.lang.toLowerCase().replace("_", "-") ===
          (lang === "ar" ? "ar-eg" : "en-us"),
      ) ||
      candidates.find((v) => v.default) ||
      candidates[0] ||
      null
    );
  }
  speak(
    chunk: BookChunk,
    settings: ReaderSettings,
    callbacks: SpeechCallbacks,
  ) {
    const previous = this.synth && owners.get(this.synth);
    if (previous && previous !== this) previous.stop();
    this.stop();
    if (this.synth) owners.set(this.synth, this);
    const token = this.generation;
    if (!this.synth) {
      callbacks.onError?.("unsupported");
      return;
    }
    const prepared = prepareSpeech(chunk.text),
      parts = speechParts(prepared.text);
    if (!parts.length) {
      callbacks.onEnd?.();
      return;
    }
    const voice = this.findVoice(
      chunk.language,
      chunk.language === "ar"
        ? settings.selectedArabicVoiceURI
        : settings.selectedEnglishVoiceURI,
      settings.autoVoiceSelect,
    );
    if (!voice) {
      callbacks.onError?.(
        chunk.language === "ar"
          ? "missing-arabic-voice"
          : "missing-english-voice",
      );
      return;
    }
    let index = 0,
      started = false;
    const play = (offset = 0) => {
      if (token !== this.generation) return;
      if (this.paused) {
        this.pending = () => play(offset);
        return;
      }
      const part = parts[index],
        utterance = this.utteranceFactory(part.text.slice(offset));
      this.current = utterance;
      this.lastBoundary = offset;
      this.restart = false;
      this.resumeCurrent = () => play(this.lastBoundary);
      utterance.voice = voice;
      utterance.lang = voice.lang.replace(/_/g, "-");
      utterance.rate = Math.max(0.5, Math.min(2, settings.speechRate));
      utterance.pitch = Math.max(0.5, Math.min(1.5, settings.pitch));
      utterance.volume = Math.max(0, Math.min(1, settings.volume));
      const valid = () =>
        token === this.generation && this.current === utterance;
      utterance.onstart = () => {
        if (valid() && !started) {
          started = true;
          callbacks.onStart?.();
        }
      };
      utterance.onboundary = (e) => {
        if (!valid() || this.paused || e.name !== "word") return;
        const local = offset + e.charIndex;
        this.lastBoundary = local;
        const start = part.start + local,
          length =
            e.charLength ||
            part.text.slice(local).match(/^\S+/)?.[0].length ||
            1;
        const sourceStart = prepared.offsets[start] ?? 0,
          sourceEnd =
            prepared.offsets[
              Math.min(prepared.offsets.length - 1, start + length - 1)
            ] ?? sourceStart;
        callbacks.onWordBoundary?.(sourceStart, sourceEnd - sourceStart + 1);
      };
      utterance.onend = () => {
        if (!valid()) return;
        if (this.paused) {
          this.restart = true;
          return;
        }
        this.current = null;
        index++;
        if (index < parts.length) play();
        else {
          this.resumeCurrent = null;
          callbacks.onEnd?.();
        }
      };
      utterance.onerror = (e) => {
        if (!valid()) return;
        if (
          this.paused &&
          (e.error === "interrupted" || e.error === "canceled")
        ) {
          this.restart = true;
          return;
        }
        this.current = null;
        this.resumeCurrent = null;
        callbacks.onError?.(e.error || "synthesis-failed");
      };
      try {
        this.synth!.speak(utterance);
      } catch {
        if (valid()) {
          this.current = null;
          callbacks.onError?.("synthesis-failed");
        }
      }
    };
    play();
  }
  pause() {
    if (this.synth && owners.get(this.synth) === this && this.current) {
      this.paused = true;
      this.synth.pause();
    }
  }
  resume() {
    if (!this.synth || owners.get(this.synth) !== this || !this.paused) return;
    this.paused = false;
    if (this.pending) {
      const pending = this.pending;
      this.pending = null;
      pending();
    } else if (this.restart || !this.synth.speaking) {
      this.resumeCurrent?.();
    } else this.synth.resume();
  }
  stop() {
    this.generation++;
    this.current = null;
    this.paused = false;
    this.restart = false;
    this.pending = null;
    this.resumeCurrent = null;
    if (
      this.synth &&
      (!owners.has(this.synth) || owners.get(this.synth) === this)
    ) {
      this.synth.cancel();
      if (this.synth.paused) this.synth.resume();
      owners.delete(this.synth);
    }
  }
  testVoice(
    uri: string,
    callbacks: SpeechCallbacks = {},
    arabic = "مرحبًا بك. القراءة العربية تحفظ الكلمات والتشكيل، وتقرأ الأرقام ١٢٣ بوضوح.",
    english = "Hello, this is a voice preview.",
  ) {
    const v = this.synth?.getVoices().find((v) => v.voiceURI === uri);
    if (!v) return;
    const language = voiceLanguage(v) || "en";
    this.speak(
      {
        id: "preview",
        pageNumber: 1,
        chunkIndex: 0,
        text: language === "ar" ? arabic : english,
        language,
        startChar: 0,
        endChar: 0,
      },
      {
        speechRate: 1,
        pitch: 1,
        volume: 1,
        selectedArabicVoiceURI: uri,
        selectedEnglishVoiceURI: uri,
        autoVoiceSelect: false,
      } as ReaderSettings,
      callbacks,
    );
  }
}
export const speechEngine = new SpeechEngineService();
