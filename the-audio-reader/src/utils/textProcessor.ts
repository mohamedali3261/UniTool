import { BookChunk, DetectedLanguage } from "../types";

/**
 * Detects whether the given string is predominantly Arabic, English, or Mixed.
 */
export function detectTextLanguage(text: string): DetectedLanguage {
  if (!text || text.trim().length === 0) return "ar";

  const arabicChars = (
    text.match(
      /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g,
    ) || []
  ).length;
  const latinChars = (text.match(/[a-zA-Z]/g) || []).length;

  if (arabicChars === 0 && latinChars === 0) return "ar";

  const totalLetters = arabicChars + latinChars;
  const arabicRatio = arabicChars / totalLetters;

  if (arabicRatio > 0.6) return "ar";
  if (arabicRatio < 0.2) return "en";
  return "mixed";
}

/**
 * Checks if a specific sentence chunk is Arabic or English
 */
export function detectChunkLanguage(
  chunkText: string,
  defaultLang: "ar" | "en" = "ar",
): "ar" | "en" {
  const arabicChars = (
    chunkText.match(
      /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g,
    ) || []
  ).length;
  const latinChars = (chunkText.match(/[a-zA-Z]/g) || []).length;

  if (arabicChars > latinChars) return "ar";
  if (latinChars > arabicChars) return "en";
  return defaultLang;
}

/** توحيد Unicode فقط؛ لا نحاول تخمين كلمات الكاتب أو حذف تشكيلها. */
export function normalizeArabicPresentationForms(text: string): string {
  return (text || "").normalize("NFKC");
}

/**
 * Detects if a text line or chunk is a main heading/title (like chapters, titles in PDFs).
 */
export function isHeadingText(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 90) return false;

  const titleKeywordsRegex =
    /^(الفصل|الباب|المبحث|المطلب|مقدمة|تمهيد|الفهرس|خاتمة|المحتويات|القسم|الجزء|كتاب|درس|الوحدة|عنوان|رقم|[0-9]{1,2}\s*[\.\-]|Chapter|Section|Part|Lesson|Introduction|Unit|Book)\b/i;

  if (titleKeywordsRegex.test(trimmed)) {
    return true;
  }

  // Short line (3 to 60 chars) without trailing punctuation that looks like a heading
  if (
    trimmed.length >= 3 &&
    trimmed.length <= 60 &&
    !/[.!?؟؛,]$/.test(trimmed) &&
    !/^\s*[a-z]/.test(trimmed)
  ) {
    return true;
  }

  return false;
}

/** تنظيف محافظ: لا تخمين لترتيب الكلمات ولا حذف للتشكيل الذي يحدد النطق. */
export function sanitizeExtractedText(rawText: string): string {
  return (rawText || "")
    .normalize("NFKC")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000E-\u001F\u007F-\u009F\uFEFF]/g, "")
    .replace(/\u000C/g, "\n")
    .replace(/[\u200C\u200D\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, "")
    .replace(/\u200B/g, " ")
    .replace(/\u0640/g, "")
    .replace(/[ \t\u00A0]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** مقاطع قصيرة بحدود كلمات ولغة مناسبة؛ حتى وضع الصفحة لا يرسل صفحة كاملة للمحرك. */
export function processTextIntoChunks(
  rawText: string,
  pageNumber: number,
  fallbackLang: "ar" | "en" = "ar",
  readingMode: "page" | "sentence" = "page",
): BookChunk[] {
  const text = sanitizeExtractedText(rawText).replace(/\s+/g, " ").trim();
  if (!text) return [];
  const chunks: BookChunk[] = [];
  let start = 0,
    current = "",
    lang = fallbackLang;
  const flush = () => {
    if (!current.trim()) return;
    const leading = current.length - current.trimStart().length,
      body = current.trim();
    chunks.push({
      id: `p${pageNumber}-c${chunks.length}`,
      pageNumber,
      chunkIndex: chunks.length,
      text: body,
      language: lang,
      startChar: start + leading,
      endChar: start + leading + body.length,
      isHeading: isHeadingText(body),
    });
    current = "";
  };
  for (const match of text.matchAll(/\S+\s*/g)) {
    const token = match[0],
      tokenLang = detectTokenLanguage(token, lang);
    if (
      current &&
      (current.length + token.length > 220 || tokenLang !== lang)
    ) {
      flush();
    }
    if (!current) {
      start = match.index!;
      lang = tokenLang;
    }
    current += token;
    if (readingMode === "sentence" && /[.!?؟؛]\s*$/.test(token)) flush();
  }
  flush();
  return chunks;
}
function detectTokenLanguage(text: string, fallback: "ar" | "en"): "ar" | "en" {
  if (
    /[\u0621-\u064A\u066E-\u06D3\u06FA-\u06FF\u0750-\u077F\u08A0-\u08C9]/.test(
      text,
    )
  )
    return "ar";
  if (/[a-z]/i.test(text)) return "en";
  return fallback;
}

/**
 * Splits a chunk text into word boundaries for synchronous word highlighting
 */
export interface WordBoundary {
  word: string;
  startIndex: number;
  endIndex: number;
}

export function extractWordBoundaries(text: string): WordBoundary[] {
  const boundaries: WordBoundary[] = [];
  const regex = /\S+/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    boundaries.push({
      word: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  return boundaries;
}

/**
 * Calculates estimated listening duration in minutes and seconds
 */
export function calculateEstimatedTime(
  wordsRemaining: number,
  speechRate: number = 1.0,
): { minutes: number; seconds: number; formatted: string } {
  // Average speaking rate: ~140 WPM at 1.0x
  const effectiveWpm = Math.max(50, 140 * speechRate);
  const totalSeconds = Math.round((wordsRemaining / effectiveWpm) * 60);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  let formatted = "";
  if (minutes > 60) {
    const hours = Math.floor(minutes / 60);
    const remMins = minutes % 60;
    formatted = `${hours}h ${remMins}m`;
  } else if (minutes > 0) {
    formatted = `${minutes}m ${seconds}s`;
  } else {
    formatted = `${seconds}s`;
  }

  return { minutes, seconds, formatted };
}

/** تحضير النطق مع خريطة إزاحات حتى يطابق تمييز الكلمة النص المعروض. */
export function prepareSpeech(text: string): {
  text: string;
  offsets: number[];
} {
  let result = "";
  const offsets: number[] = [];
  let source = 0;
  for (const char of text || "") {
    let value = char
      .normalize("NFKC")
      .replace(/\u0671/g, "ا")
      .replace(
        /[\u0640\u061C\u200C-\u200F\u202A-\u202E\u2066-\u2069\uFEFF\u06D6-\u06E4\u06E7-\u06ED]/g,
        "",
      );
    if (char === "\u200B") value = " ";
    for (const c of value) {
      if (/\s/.test(c)) {
        if (result && !result.endsWith(" ")) {
          result += " ";
          offsets.push(source);
        }
      } else if (!/[\u0000-\u001F\u007F-\u009F]/.test(c)) {
        result += c;
        for (let i = 0; i < c.length; i++)
          offsets.push(
            value === char && char.length === 2 ? source + i : source,
          );
      }
    }
    source += char.length;
  }
  if (result.endsWith(" ")) {
    result = result.slice(0, -1);
    offsets.pop();
  }
  return { text: result, offsets };
}
export function cleanTextForSpeech(text: string): string {
  return prepareSpeech(text).text;
}
export function speechParts(
  text: string,
  maxLength = 220,
): { text: string; start: number }[] {
  const parts: { text: string; start: number }[] = [];
  let from = 0;
  maxLength = Math.max(2, Math.floor(maxLength) || 220);
  while (from < text.length) {
    let end = Math.min(text.length, from + maxLength);
    if (end < text.length) {
      let space = text.lastIndexOf(" ", end);
      if (space > from) end = space;
      else {
        while (end < text.length && /[\u064B-\u065F\u0670]/.test(text[end]))
          end++;
        if (end < text.length && /[\uDC00-\uDFFF]/.test(text[end])) end++;
      }
    }
    const raw = text.slice(from, end),
      leading = raw.length - raw.trimStart().length;
    if (raw.trim()) parts.push({ text: raw.trim(), start: from + leading });
    from = end;
    while (text[from] === " ") from++;
  }
  return parts;
}
