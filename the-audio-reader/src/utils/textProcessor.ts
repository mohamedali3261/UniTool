import { BookChunk, DetectedLanguage } from '../types';

/**
 * Detects whether the given string is predominantly Arabic, English, or Mixed.
 */
export function detectTextLanguage(text: string): DetectedLanguage {
  if (!text || text.trim().length === 0) return 'ar';

  const arabicChars = (text.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g) || []).length;
  const latinChars = (text.match(/[a-zA-Z]/g) || []).length;

  if (arabicChars === 0 && latinChars === 0) return 'ar';

  const totalLetters = arabicChars + latinChars;
  const arabicRatio = arabicChars / totalLetters;

  if (arabicRatio > 0.6) return 'ar';
  if (arabicRatio < 0.2) return 'en';
  return 'mixed';
}

/**
 * Checks if a specific sentence chunk is Arabic or English
 */
export function detectChunkLanguage(chunkText: string, defaultLang: 'ar' | 'en' = 'ar'): 'ar' | 'en' {
  const arabicChars = (chunkText.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g) || []).length;
  const latinChars = (chunkText.match(/[a-zA-Z]/g) || []).length;

  if (arabicChars > latinChars) return 'ar';
  if (latinChars > arabicChars) return 'en';
  return defaultLang;
}

/**
 * Map of Arabic presentation forms (Forms-A & Forms-B) to standard Unicode Arabic characters.
 * Fixes broken, split, or disconnected Arabic letters extracted from PDFs.
 */
const ARABIC_PRESENTATION_MAP: { [key: string]: string } = {
  '\uFEF5': 'لآ', '\uFEF6': 'لآ',
  '\uFEF7': 'لأ', '\uFEF8': 'لأ',
  '\uFEF9': 'ﻹ', '\uFEFA': 'ﻹ',
  '\uFEFB': 'لا', '\uFEFC': 'لا',
  '\uFE80': 'ء',
  '\uFE81': 'آ', '\uFE82': 'آ',
  '\uFE83': 'أ', '\uFE84': 'أ',
  '\uFE85': 'ؤ', '\uFE86': 'ؤ',
  '\uFE87': 'إ', '\uFE88': 'إ',
  '\uFE89': 'ئ', '\uFE8A': 'ئ', '\uFE8B': 'ئ', '\uFE8C': 'ئ',
  '\uFE8D': 'ا', '\uFE8E': 'ا',
  '\uFE8F': 'ب', '\uFE90': 'ب', '\uFE91': 'ب', '\uFE92': 'ب',
  '\uFE93': 'ة', '\uFE94': 'ة',
  '\uFE95': 'ت', '\uFE96': 'ت', '\uFE97': 'ت', '\uFE98': 'ت',
  '\uFE99': 'ث', '\uFE9A': 'ث', '\uFE9B': 'ث', '\uFE9C': 'ث',
  '\uFE9D': 'ج', '\uFE9E': 'ج', '\uFE9F': 'ج', '\uFEA0': 'ج',
  '\uFEA1': 'ح', '\uFEA2': 'ح', '\uFEA3': 'ح', '\uFEA4': 'ح',
  '\uFEA5': 'خ', '\uFEA6': 'خ', '\uFEA7': 'خ', '\uFEA8': 'خ',
  '\uFEA9': 'د', '\uFEAA': 'د',
  '\uFEAB': 'ذ', '\uFEAC': 'ذ',
  '\uFEAD': 'ر', '\uFEAE': 'ر',
  '\uFEAF': 'ز', '\uFEB0': 'ز',
  '\uFEB1': 'س', '\uFEB2': 'س', '\uFEB3': 'س', '\uFEB4': 'س',
  '\uFEB5': 'ش', '\uFEB6': 'ش', '\uFEB7': 'ش', '\uFEB8': 'ش',
  '\uFEB9': 'ص', '\uFEBA': 'ص', '\uFEBB': 'ص', '\uFEBC': 'ص',
  '\uFEBD': 'ض', '\uFEBE': 'ض', '\uFEBF': 'ض', '\uFEC0': 'ض',
  '\uFEC1': 'ط', '\uFEC2': 'ط', '\uFEC3': 'ط', '\uFEC4': 'ط',
  '\uFEC5': 'ظ', '\uFEC6': 'ظ', '\uFEC7': 'ظ', '\uFEC8': 'ظ',
  '\uFEC9': 'ع', '\uFECA': 'ع', '\uFECB': 'ع', '\uFECC': 'ع',
  '\uFECD': 'غ', '\uFECE': 'غ', '\uFECF': 'غ', '\uFED0': 'غ',
  '\uFED1': 'ف', '\uFED2': 'ف', '\uFED3': 'ف', '\uFED4': 'ف',
  '\uFED5': 'ق', '\uFED6': 'ق', '\uFED7': 'ق', '\uFED8': 'ق',
  '\uFED9': 'ك', '\uFEDA': 'ك', '\uFEDB': 'ك', '\uFEDC': 'ك',
  '\uFEDD': 'ل', '\uFEDE': 'ل', '\uFEDF': 'ل', '\uFEE0': 'ل',
  '\uFEE1': 'م', '\uFEE2': 'م', '\uFEE3': 'م', '\uFEE4': 'م',
  '\uFEE5': 'ن', '\uFEE6': 'ن', '\uFEE7': 'ن', '\uFEE8': 'ن',
  '\uFEE9': 'ه', '\uFEEA': 'ه', '\uFEEB': 'ه', '\uFEEC': 'ه',
  '\uFEED': 'و', '\uFEEE': 'و',
  '\uFEEF': 'ى', '\uFEF0': 'ى',
  '\uFEF1': 'ي', '\uFEF2': 'ي', '\uFEF3': 'ي', '\uFEF4': 'ي',
  // Common ligatures and Shadda combinations in Presentation Forms A & B
  '\uFC5D': 'ًّ', '\uFC5E': 'ٌّ', '\uFC5F': 'ٍّ',
  '\uFC60': 'َّ', '\uFC61': 'ُّ', '\uFC62': 'ِّ', '\uFC63': 'ٍّ',
  '\uFDF2': 'الله', '\uFD39': 'شر', '\uFDF9': 'شر', '\uFC29': 'شر',
  '\uFC2D': 'تر', '\uFC2E': 'تر', '\uFD3A': 'تر',
};

/**
 * Normalizes Arabic presentation forms to standard Unicode Arabic characters.
 */
export function normalizeArabicPresentationForms(text: string): string {
  if (!text) return '';
  return text.replace(/[\uFE70-\uFEFC\uFB50-\uFDFD]/g, (char) => ARABIC_PRESENTATION_MAP[char] || char);
}

/**
 * Fixes common reversed/inverted words, ligatures, and glyph typos extracted from Arabic PDFs.
 * e.g. "املشاركة" -> "المشاركة", "املُتشعِّب" -> "المُتشعِّب", "عىل" -> "على", "إىل" -> "إلى", "يف" -> "في", "يرسُّ ني" -> "يسرُّني"
 */
export function fixInvertedArabicWords(text: string): string {
  if (!text) return '';

  let result = text;

  // 1. Fix "اﻹ" / "اﻷ" / "اﻵ" Presentation forms to standard "الإ" / "الأ" / "الآ"
  result = result.replace(/اﻹ/g, 'الإ');
  result = result.replace(/اﻷ/g, 'الأ');
  result = result.replace(/اﻵ/g, 'الآ');

  // 2. Fix "لﻹ" / "لﻷ" / "لﻵ" / "لإ" ligatures -> "للإ" / "للأ" / "للآ" (e.g. "لﻹسهام" -> "للإسهام")
  result = result.replace(/(?<![\u0600-\u06FF])لﻹ(?=[\u0600-\u06FF])/g, 'للإ');
  result = result.replace(/(?<![\u0600-\u06FF])لﻷ(?=[\u0600-\u06FF])/g, 'للأ');
  result = result.replace(/(?<![\u0600-\u06FF])لﻵ(?=[\u0600-\u06FF])/g, 'للآ');
  result = result.replace(/(?<![\u0600-\u06FF])لإسهام(?![\u0600-\u06FF])/g, 'للإسهام');

  // 3. Fix "امل" / "بامل" / "فامل" / "وامل" / "لامل" prefix inversions at word boundaries -> "الم" / "بالم" / "فالم" / "والم" / "للم"
  // e.g. "املشاركة" -> "المشاركة", "باملعنى" -> "بالمعنى", "املُتشعِّب" -> "المُتشعِّب"
  result = result.replace(/(?<![\u0600-\u06FF])بامل(?=[\u0600-\u06FF\u064B-\u0652])/g, 'بالم');
  result = result.replace(/(?<![\u0600-\u06FF])فامل(?=[\u0600-\u06FF\u064B-\u0652])/g, 'فالم');
  result = result.replace(/(?<![\u0600-\u06FF])وامل(?=[\u0600-\u06FF\u064B-\u0652])/g, 'والم');
  result = result.replace(/(?<![\u0600-\u06FF])لامل(?=[\u0600-\u06FF\u064B-\u0652])/g, 'للم');
  result = result.replace(/(?<![\u0600-\u06FF])امل(?=[\u0600-\u06FF\u064B-\u0652])/g, 'الم');

  // 4. Fix inverted parentheses around numbers/years in PDF text extraction (e.g. ")١٩٨٥(" -> "(١٩٨٥)")
  result = result.replace(/\)\s*([\u0660-\u06690-9]+)\s*\(/g, '($1)');

  // 5. Fix "يرسُّ ني" / "يرسني" split & inverted ligatures -> "يسُرُّني" / "يسرني"
  result = result.replace(/(?<![\u0600-\u06FF])يرس([\u064B-\u0652]*)\s*ني(?![\u0600-\u06FF])/g, 'يسر$1ني');
  result = result.replace(/(?<![\u0600-\u06FF])يرس([\u064B-\u0652]*)(?![\u0600-\u06FF])/g, 'يسر$1');

  // 6. Fix common PDF glyph misreadings (e.g. "نرش" -> "نشر")
  result = result.replace(/(?<![\u0600-\u06FF])(ال)?نرش(ه|ها|هم|ين|وا|ت)?(?![\u0600-\u06FF])/g, '$1نشر$2');
  result = result.replace(/(?<![\u0600-\u06FF])ارشتراك(?![\u0600-\u06FF])/g, 'اشتراك');
  result = result.replace(/(?<![\u0600-\u06FF])إرشراف(?![\u0600-\u06FF])/g, 'إشراف');

  // 7. Fix inverted standalone prepositions & common words
  result = result.replace(/(?<![\u0600-\u06FF])عىل(?![\u0600-\u06FF])/g, 'على');
  result = result.replace(/(?<![\u0600-\u06FF])إىل(?![\u0600-\u06FF])/g, 'إلى');
  result = result.replace(/(?<![\u0600-\u06FF])يف(?![\u0600-\u06FF])/g, 'في');
  result = result.replace(/(?<![\u0600-\u06FF])حىت(?![\u0600-\u06FF])/g, 'حتى');
  result = result.replace(/(?<![\u0600-\u06FF])حرّى(?![\u0600-\u06FF])/g, 'حتى');

  // 8. Fix "رش" / "رشي" ligature swap in words like "البشري" / "بشري" / "بشرية"
  result = result.replace(/(?<![\u0600-\u06FF])(ال)?برشي(اً|ًا|ين|ون|ات|ة)?(?![\u0600-\u06FF])/g, '$1بشري$2');
  result = result.replace(/(?<![\u0600-\u06FF])برش(?![\u0600-\u06FF])/g, 'بشر');

  // 9. Fix "رت" / "تر" reversed ligatures in words like "الإنتروبيا", "انترنت", "إلكترون", "فترة"
  result = result.replace(/انرتوبيا/g, 'انتروبيا');
  result = result.replace(/اﻹنرتوبيا/g, 'الإنتروبيا');
  result = result.replace(/الإنرتوبيا/g, 'الإنتروبيا');
  result = result.replace(/انرتنت/g, 'انترنت');
  result = result.replace(/إلكرتون/g, 'إلكترون');
  result = result.replace(/(?<![\u0600-\u06FF])فرتة(?![\u0600-\u06FF])/g, 'فترة');
  result = result.replace(/(?<![\u0600-\u06FF])اسرتاتيج(?![\u0600-\u06FF])/g, 'استراتيج');

  // 10. Fix common letter typos like "برباعة" -> "ببراعة"
  result = result.replace(/برباعة/g, 'ببراعة');

  return result;
}

/**
 * Normalizes Arabic Tashkeel (diacritics/tanween) placement and fixes glued words.
 * Fixes isolated/split tanween like "محتمَ لً ا." -> "محتملاً.", "ثلاثٍمن" -> "ثلاثٍ من",
 * "أُنشئَنظامٌ" -> "أُنشئَ نظامٌ", "أرشحُمكوناته" -> "أرشحُ مكوناته", "ظهورَالحياة" -> "ظهورَ الحياة",
 * "السلسلةَالسببية" -> "السلسلةَ السببية", "آليةِاستجابةٍ" -> "آليةِ استجابةٍ", "الوعيُالأول" -> "الوعيُ الأول".
 */
export function fixArabicTashkeelAndSpacing(text: string): string {
  if (!text) return '';

  let result = text;

  // 1. Fix split Tanween Alef (e.g. "محتمَ لً ا." -> "محتملاً.", "فصلا ً" -> "فصلاً")
  result = result.replace(/([\u0600-\u06FF][\u064B-\u0652]*)\s+ل\s*ً\s*ا/g, '$1لاً');
  result = result.replace(/([\u0600-\u06FF][\u064B-\u0652]*)\s+لً\s+ا/g, '$1لاً');
  result = result.replace(/([\u0600-\u06FF][\u064B-\u0652]*)\s+ً\s*ا/g, '$1ًا');

  // 2. Remove space BEFORE Tashkeel / Tanween characters (e.g. "إنسان ٍ" -> "إنسانٍ")
  result = result.replace(/(?<=\S)\s+([\u064B-\u0652])/g, '$1');

  // 3. Fix words glued to Definite Article "ال" after ANY Tashkeel (َ, ُ, ِ, ّ, ْ)
  // e.g. "ظهورَالحياة" -> "ظهورَ الحياة", "السلسلةَالسببية" -> "السلسلةَ السببية", "الوعيُالأول" -> "الوعيُ الأول"
  result = result.replace(/([\u064E\u064F\u0650\u0651\u0652])(?=ال[\u0600-\u06FF])/g, '$1 ');

  // 4. Fix Ta Marbuta (ة) with Tashkeel glued to next word
  // e.g. "آليةِاستجابةٍ" -> "آليةِ استجابةٍ", "استجابةٍالآنيِّ" -> "استجابةٍ الآنيِّ"
  result = result.replace(/([ةt][\u064B-\u0652]*)(?=[\u0600-\u06FF])/g, '$1 ');

  // 5. Insert space AFTER Tanween (ً, ٍ, ٌ) if followed directly by an Arabic letter or quote
  // Tanween ONLY occurs at the very end of a word!
  // e.g. "ثلاثٍمن" -> "ثلاثٍ من", "إثارةًللاهتمام" -> "إثارةً للاهتمام"
  result = result.replace(/([\u064B\u064C\u064D])(?=[\u0600-\u06FF»"«\(\)\[\]])/g, '$1 ');

  // 6. Fix verbs/nouns ending with Tashkeel (ُ, َ, ِ, ْ, ّ) glued to Alif/Hamza or specific nouns
  // e.g. "أُنشئَنظامٌ" -> "أُنشئَ نظامٌ", "أرشحُمكوناته" -> "أرشحُ مكوناته", "بدأتُأشعر" -> "بدأتُ أشعر"
  result = result.replace(/(أُنشئَ|أنشئَ)(نظام)/g, '$1 $2');
  result = result.replace(/(أرشحُ|أرشّحُ)(مكونات)/g, '$1 $2');
  result = result.replace(/([\u0600-\u06FF][\u064E\u064F\u0650\u0651\u0652])(?=[أإآ]|أن|أنني|لم|لا|من|في|على|عن|إلى|قد|علم|طبيعة|وجود|حقيقة|كل)/g, '$1 ');

  // 7. Fix words glued to quotes or brackets
  result = result.replace(/([\u0600-\u06FF])(»)/g, '$1 $2');
  result = result.replace(/(«)([\u0600-\u06FF])/g, '$1 $2');
  result = result.replace(/(»)([\u0600-\u06FF])/g, '$1 $2');

  // 8. Normalize Tanween Fath on Alef: "فصلا ً" -> "فصلاً"
  result = result.replace(/([اى])\s*ً/g, 'ً$1');

  // 9. Remove excess spaces before Arabic punctuation
  result = result.replace(/\s+([،؛؟!:,.])/g, '$1');

  return result;
}

/**
 * Connects Arabic letters that were extracted with spaces between each letter (e.g. "ا ل ف ص ل").
 */
export function fixSpacedArabicLetters(text: string): string {
  if (!text) return '';
  // Exclude diacritics (\u064B-\u065F, \u0670) from the Arabic letter range to preserve tashkeel
  return text.replace(/(?:[\u0600-\u064A\u0660-\u0669\u0671-\u06FF]\s+){2,}[\u0600-\u064A\u0660-\u0669\u0671-\u06FF]/g, (match) => {
    // Replace single spaces between letters, keeping double spaces for word breaks
    return match.replace(/([^\s])\s([^\s])/g, '$1$2');
  });
}

/**
 * Removes all Arabic diacritics (tashkeel/tanween) from text.
 * e.g. "بِسْمِ ٱللَّهِ" -> "بسم الله", "كِتَابًا" -> "كتابا"
 */
export function removeArabicDiacritics(text: string): string {
  if (!text) return '';
  // Remove all Arabic diacritics: Fatha, Damma, Kasra, Sukun, Shadda, Tanween, Wasla, Superscript Alef, etc.
  return text.replace(/[\u064B-\u065F\u0670\u0610-\u061A]/g, '');
}

/**
 * Detects if a text line or chunk is a main heading/title (like chapters, titles in PDFs).
 */
export function isHeadingText(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 90) return false;

  const titleKeywordsRegex = /^(الفصل|الباب|المبحث|المطلب|مقدمة|تمهيد|الفهرس|خاتمة|المحتويات|القسم|الجزء|كتاب|درس|الوحدة|عنوان|رقم|[0-9]{1,2}\s*[\.\-]|Chapter|Section|Part|Lesson|Introduction|Unit|Book)\b/i;

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

/**
 * Sanitizes and verifies extracted text from PDF, EPUB, DOCX, or OCR
 * to remove corrupt symbols, non-printable control characters, duplicate artifact strings,
 * broken line hyphens, and garbage OCR noise.
 */
export function sanitizeExtractedText(rawText: string): string {
  if (!rawText) return '';

  let text = rawText;

  // 1. Convert Arabic presentation forms (e.g. \uFE70-\uFEFC) to normal Arabic characters
  text = normalizeArabicPresentationForms(text);

  // 2. Fix inverted/swapped Arabic words and ligatures (e.g. "املشاركة" -> "المشاركة", "البرشي" -> "البشري", "عىل" -> "على")
  text = fixInvertedArabicWords(text);

  // 3. Normalize Arabic Tashkeel/Tanween placement & spaces (e.g. "إنسان ٍ" -> "إنسانٍ", "فصلا ًجديدًا" -> "فصلاً جديداً")
  text = fixArabicTashkeelAndSpacing(text);

  // 4. Fix spaced-out Arabic letters (e.g. "ك ت ا ب" -> "كتاب")
  text = fixSpacedArabicLetters(text);

  // 4b. Remove all Arabic diacritics (tashkeel) since they often get mangled by PDF extraction
  text = removeArabicDiacritics(text);

  // 5. Strip non-printable control characters, null bytes, BOM, replacement chars (\uFFFD)
  text = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\uFFFD\uFEFF]/g, '');

  // 6. Remove soft hyphens and fix broken line-end hyphenations (e.g. "in-\nteresting" -> "interesting")
  text = text.replace(/(\w+)-\s*\n\s*(\w+)/gi, '$1$2');
  // Remove Tatweel (Kashida) inside words or at end of lines breaking letters
  text = text.replace(/ـ\s*\n\s*/g, '').replace(/(?<=\S)ـ+(?=\S)/g, '');

  // 7. Remove stray non-word repetitive garbage symbols like ~ ~ ~ ~, | | | |, _____ , ...
  text = text.replace(/([~|_|\\|/|#|*|=|^])\1{3,}/g, '');
  text = text.replace(/^\s*[|\\/=_~^#-]{1,3}\s*$/gm, '');

  // 8. Clean up weird zero-width non-joiner characters where inappropriate
  text = text.replace(/[\u200B\u200C\u200D\u200E\u200F]/g, ' ');

  // 9. Normalize line breaks (maximum 2 consecutive newlines to preserve clean paragraph breaks)
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  text = text.replace(/\n{3,}/g, '\n\n');

  // 10. Normalize multiple spaces on the same line
  text = text.split('\n').map(line => line.replace(/[ \t]+/g, ' ').trim()).join('\n');

  return text.trim();
}

/**
 * Splits page text into safe, natural speech chunks (sentences/phrases)
 * so SpeechSynthesis does not time out or drop audio.
 */
export function processTextIntoChunks(
  rawText: string,
  pageNumber: number,
  fallbackLang: 'ar' | 'en' = 'ar',
  readingMode: 'page' | 'sentence' = 'page'
): BookChunk[] {
  const cleanText = sanitizeExtractedText(rawText);
  if (!cleanText) {
    return [];
  }

  if (readingMode === 'page') {
    // Treat the entire page as a single speech chunk
    const continuousText = cleanText.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (!continuousText) return [];
    
    const lang = detectChunkLanguage(continuousText, fallbackLang);
    return [
      {
        id: `p${pageNumber}-c0`,
        pageNumber,
        chunkIndex: 0,
        text: continuousText,
        language: lang,
        startChar: 0,
        endChar: continuousText.length,
        isHeading: false,
      },
    ];
  } else {
    // Split into sentences (by sentence terminators)
    const segments = cleanText.match(/[^.!?؟؛\n]+(?:[.!?؟؛\n]+|$)/g) || [cleanText];
    const chunks: BookChunk[] = [];
    let chunkIndex = 0;
    let currentIndex = 0;

    for (const segment of segments) {
      const trimmed = segment.trim();
      if (!trimmed) {
          currentIndex += segment.length;
          continue;
      }
      
      const continuousText = segment.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ');
      const lang = detectChunkLanguage(trimmed, fallbackLang);
      chunks.push({
        id: `p${pageNumber}-c${chunkIndex}`,
        pageNumber,
        chunkIndex,
        text: continuousText,
        language: lang,
        startChar: currentIndex,
        endChar: currentIndex + segment.length,
        isHeading: isHeadingText(trimmed),
      });
      chunkIndex++;
      currentIndex += segment.length;
    }
    return chunks;
  }
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
  speechRate: number = 1.0
): { minutes: number; seconds: number; formatted: string } {
  // Average speaking rate: ~140 WPM at 1.0x
  const effectiveWpm = Math.max(50, 140 * speechRate);
  const totalSeconds = Math.round((wordsRemaining / effectiveWpm) * 60);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  let formatted = '';
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

/**
 * Cleans and sanitizes text specifically for Speech Synthesis (TTS).
 * - Strips web URLs (http, https, www, domain names) and email addresses
 * - Strips punctuation marks, dots, commas, dashes, colons, slashes, and symbols
 *   so the TTS engine won't pronounce punctuation or web addresses out loud.
 */
export function cleanTextForSpeech(text: string): string {
  if (!text) return '';

  let s = text;

  // 1. Remove URLs, web links, domain addresses, and email addresses
  s = s.replace(/https?:\/\/\S+/gi, ' ');
  s = s.replace(/\bwww\.\S+/gi, ' ');
  s = s.replace(/\b[a-zA-Z0-9.-]+\.(com|org|net|gov|edu|io|co|ai|me|app|info|dev|tv|sa|eg|uk|de|xyz|site|online)\b(\/\S*)?/gi, ' ');
  s = s.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/gi, ' ');

  // 2. Remove dots, commas, dashes, colons, slashes, quotes, and punctuation symbols
  // Arabic & English punctuation: . , ، ! ? ؟ ؛ ; : - – — _ / \ | " ' « » ( ) [ ] { } * # @ + = < > ~ ^ % & $ … •
  s = s.replace(/[.,،!؟?؛;:–—_/\-\\|"'«»()\[\]{}*#@+=<>~^%&$…•·°]+/g, ' ');

  // 3. Normalize whitespace into single clean spaces
  s = s.replace(/[\r\n\t]+/g, ' ');
  s = s.replace(/\s+/g, ' ');

  return s.trim();
}
