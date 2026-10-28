import { ARABIC_TO_ENGLISH_DICT } from "./pexelsQuery";
// Pexels API Service with Smart Arabic-to-English Translation Engine

export const PEXELS_API_KEY = 'jkL8YS4uv9vShlbVCcDiQd2cL1ojHPgH20TA0nwymRfGXma2srfHHyM4';

export interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  photographer_id: number;
  avg_color: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  alt: string;
}

// Arabic to English Dictionary for High Quality Photography Searches
// Smart Arabic-to-English query translator
export const translateQueryToEnglish = async (rawQuery: string): Promise<string> => {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return 'modern background';

  // Check if query is mostly non-Arabic (already English/Latin)
  const isArabic = /[\u0600-\u06FF]/.test(query);
  if (!isArabic) {
    return query;
  }

  // 1. Direct phrase match in dictionary
  if (ARABIC_TO_ENGLISH_DICT[query]) {
    return ARABIC_TO_ENGLISH_DICT[query];
  }

  // 2. Multi-word phrase search in dictionary
  const words = query.split(/\s+/);
  const translatedWords: string[] = [];

  for (const word of words) {
    // Strip common Arabic prefixes (الـ, و, بـ, كـ, لـ)
    const cleanWord = word.replace(/^(ال|و|ب|ك|ل)/, '');
    
    if (ARABIC_TO_ENGLISH_DICT[word]) {
      translatedWords.push(ARABIC_TO_ENGLISH_DICT[word]);
    } else if (ARABIC_TO_ENGLISH_DICT[cleanWord]) {
      translatedWords.push(ARABIC_TO_ENGLISH_DICT[cleanWord]);
    }
  }

  if (translatedWords.length > 0) {
    return translatedWords.join(' ');
  }

  // 3. Fallback to free translation API if no local dictionary match
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(query)}&langpair=ar|en`
    );
    if (res.ok) {
      const data = await res.json();
      if (data.responseData?.translatedText && !data.responseData.translatedText.includes('QUERY LENGTH')) {
        const translated = data.responseData.translatedText.replace(/[^a-zA-Z0-9\s]/g, '').trim();
        if (translated) return translated;
      }
    }
  } catch (err) {
    console.warn('Online translation failed, using default', err);
  }

  return query;
};

// Fetch search photos from Pexels
export const searchPexelsPhotos = async (
  arabicOrEnglishQuery: string,
  page: number = 1,
  perPage: number = 30
): Promise<{ photos: PexelsPhoto[]; englishQuery: string; totalResults: number }> => {
  const englishQuery = await translateQueryToEnglish(arabicOrEnglishQuery);

  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(
      englishQuery
    )}&per_page=${perPage}&page=${page}&locale=en-US`;

    const response = await fetch(url, {
      headers: {
        Authorization: PEXELS_API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      photos: data.photos || [],
      englishQuery,
      totalResults: data.total_results || 0
    };
  } catch (err) {
    console.error('Failed to fetch from Pexels API', err);
    return {
      photos: [],
      englishQuery,
      totalResults: 0
    };
  }
};

// Fetch curated trending photos from Pexels
export const fetchCuratedPexelsPhotos = async (
  page: number = 1,
  perPage: number = 30
): Promise<{ photos: PexelsPhoto[]; totalResults: number }> => {
  try {
    const url = `https://api.pexels.com/v1/curated?per_page=${perPage}&page=${page}`;
    const response = await fetch(url, {
      headers: {
        Authorization: PEXELS_API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      photos: data.photos || [],
      totalResults: data.total_results || 0
    };
  } catch (err) {
    console.error('Failed to fetch curated Pexels photos', err);
    return {
      photos: [],
      totalResults: 0
    };
  }
};
