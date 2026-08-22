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
const ARABIC_TO_ENGLISH_DICT: Record<string, string> = {
  // General & Categories
  'طبيعة': 'nature landscape scenic',
  'طبيعه': 'nature landscape scenic',
  'طبيعة خلابة': 'breathtaking landscape mountains nature',
  'تقنية': 'technology tech modern',
  'تكنولوجيا': 'technology futuristic cyber',
  'برمجة': 'coding software developer programming',
  'كود': 'computer code programming screen',
  'كمبيوتر': 'computer laptop workspace',
  'حاسوب': 'laptop workspace desk',
  'لابتوب': 'laptop workspace modern',
  'هاتف': 'smartphone mobile device screen',
  'موبايل': 'smartphone modern phone app',
  'تطبيق': 'mobile app UI mockup smartphone',
  'تطبيقات': 'mobile app technology screen',
  'ذكاء اصطناعي': 'artificial intelligence futuristic AI technology',
  'روبوت': 'robot AI technology cyber',
  
  // Business & Finance
  'أعمال': 'business professional corporate office',
  'اعمال': 'business corporate teamwork meeting',
  'عمل': 'workspace business office productivity',
  'مكتب': 'modern office workspace desk',
  'شركة': 'business team corporate office',
  'فريق': 'teamwork business team meeting',
  'فريق عمل': 'teamwork collaborative meeting office',
  'تسويق': 'digital marketing business growth ecommerce',
  'تجارة': 'ecommerce business shopping commerce',
  'متجر': 'store boutique retail shop',
  'تسوق': 'online shopping store bags',
  'نقود': 'money finance coins currency',
  'مال': 'money wealth investment finance',
  'فلوس': 'money wealth investment banknote',
  'بنك': 'finance banking investment business',
  'عملات': 'crypto coins currency finance',
  'استثمار': 'investment stock market finance growth',
  'نجاح': 'success celebration achievement business',

  // Backgrounds & Abstract
  'خلفية': 'minimal abstract wallpaper background texture',
  'خلفيه': 'minimal abstract wallpaper background texture',
  'خلفية داكنة': 'dark luxury abstract minimal background',
  'خلفية سوداء': 'black dark minimal clean background texture',
  'خلفية بيضاء': 'clean white minimal bright background studio',
  'خلفية نيون': 'neon cyber glowing dark abstract background',
  'تجريدي': 'abstract geometric 3D minimal art wallpaper',
  'ألوان': 'vibrant colorful fluid abstract gradient',
  'الوان': 'colorful vibrant gradient wallpaper',
  'تدرج': 'smooth gradient abstract background',
  'رخام': 'marble luxury texture background',
  'هندسي': 'geometric abstract modern 3D shapes',
  'نيون': 'neon cyberpunk glowing futuristic lights',
  'ظلام': 'dark mood atmospheric cinematic shadows',
  'فضاء': 'space galaxy stars nebula cosmos universe',
  'نجوم': 'night sky stars galaxy astronomical',
  'قمر': 'moon night dark sky lunar',
  'شمس': 'bright sun sunlight golden hour lens flare',
  'غروب': 'sunset golden hour dusk evening sky',
  'شروق': 'sunrise morning golden dawn sunlight',
  'سماء': 'blue sky clouds sunny atmosphere',
  'غيوم': 'fluffy white clouds blue sky weather',
  'سحاب': 'clouds dramatic sky weather atmosphere',
  'ليل': 'night city lights dark landscape atmospheric',
  'مدينة': 'city skyline skyscrapers urban architecture night',
  'مدن': 'city skyline modern architecture metropolis',
  'عمارة': 'modern architecture buildings geometric facade',
  'مباني': 'architecture skyscrapers modern buildings city',

  // Food & Drinks
  'طعام': 'gourmet delicious food restaurant dish',
  'اكل': 'delicious food table meal kitchen',
  'أكل': 'healthy delicious food restaurant',
  'قهوة': 'specialty espresso coffee cup cafe morning',
  'كافيه': 'cozy cafe coffee shop interior',
  'مطعم': 'fine dining restaurant luxury food table',
  'برجر': 'juicy burger gourmet fast food delicious',
  'بيتزا': 'hot pizza italian cuisine delicious',
  'فواكه': 'fresh colorful fruits healthy organic',
  'خضروات': 'fresh organic vegetables farm food',
  'حلويات': 'delicious dessert bakery pastry cake sweet',
  'كيك': 'luxury cake bakery sweet dessert birthday',
  'عصير': 'fresh refreshing juice smoothie fruit drink',
  'شاي': 'hot tea cup herbal morning cozy',

  // Lifestyle, Fashion, People
  'شخص': 'person portrait lifestyle authentic',
  'اشخاص': 'people group lifestyle diverse friends',
  'أشخاص': 'diverse people lifestyle smiling happy',
  'رجل': 'man portrait professional lifestyle handsome',
  'امراة': 'woman portrait professional lifestyle elegant',
  'امرأة': 'woman portrait elegant confident fashion',
  'بنت': 'girl young portrait smile lifestyle',
  'شباب': 'young people friends active lifestyle',
  'اطفال': 'happy children playing kids cute',
  'أطفال': 'cute kids smiling joyful play',
  'طفل': 'cute baby toddler smiling joyful',
  'عائلة': 'happy family parents children home',
  'صحة': 'health fitness wellness lifestyle medical',
  'رياضة': 'sports fitness workout gym athlete running',
  'جيم': 'gym workout fitness bodybuilding exercise',
  'لياقة': 'fitness athlete training workout energetic',
  'كرة قدم': 'soccer football match stadium sport player',
  'موضة': 'fashion style luxury model streetwear',
  'ازياء': 'fashion editorial streetwear luxury model',
  'أزياء': 'stylish fashion clothing model runway',
  'ملابس': 'clothing apparel modern fashion store',
  'جمال': 'beauty cosmetic skincare glowing aesthetic',
  'مكياج': 'beauty cosmetics makeup skincare brushes',
  'عطور': 'luxury perfume fragrance bottle cosmetic',
  'ساعة': 'luxury watch timepiece wrist accessory',
  'نظارة': 'stylish sunglasses eyewear fashion',

  // Vehicles & Transportation
  'سيارة': 'luxury sports car modern automotive vehicle',
  'سيارات': 'supercars luxury vehicles automotive driving',
  'طائرة': 'airplane flying sky clouds travel flight',
  'طيران': 'aviation airplane sunset flight travel',
  'سفر': 'travel vacation wanderlust luggage tourist beach',
  'سياحة': 'tourism travel scenic landmark vacation holiday',
  'فندق': 'luxury hotel resort room swimming pool',
  'بحر': 'crystal clear blue ocean beach tropical waves',
  'شاطئ': 'tropical sandy beach palm trees turquoise ocean',
  'محيط': 'deep ocean blue water waves underwater',
  'جبل': 'mountain peaks snow alpine landscape scenic',
  'جبال': 'majestic mountain range nature sunset landscape',
  'صحراء': 'sand dunes desert golden hour sun travel',
  'غابة': 'misty pine forest green trees nature wild',
  'زهور': 'beautiful fresh flowers bouquet botanical blooming',
  'ورد': 'red roses romantic flowers blooming garden',
  'حديقة': 'lush green garden botanical plants nature',

  // Gaming, Art, Music
  'العاب': 'gaming setup rgb lights gamer room console',
  'ألعاب': 'video games gaming setup controller esports',
  'جيمنج': 'esports gaming setup glowing neon computer',
  'موسيقى': 'music concert instruments headphones stage acoustic',
  'فن': 'modern art painting sculpture creative gallery',
  'رسم': 'artistic watercolor paint canvas artist creative',
  'تصميم': 'minimal graphic design aesthetic studio creativity'
};

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
