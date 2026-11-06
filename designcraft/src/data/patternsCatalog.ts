// Patterned & Ornate Seamless Backgrounds Catalog (60 distinct vector patterns)

export type PatternCategoryId =
  | 'islamic'
  | 'geometric'
  | 'luxury'
  | 'vintage'
  | 'botanical'
  | 'tech'
  | 'abstract';

export interface BackgroundPatternItem {
  id: string;
  name: string;
  nameAr: string;
  category: PatternCategoryId;
  type: 'svg-pattern' | 'wallpaper-image';
  thumbnail: string;
  sourceUrl: string;
  descriptionAr: string;
}

export const PATTERN_CATEGORIES: { id: 'all' | PatternCategoryId; name: string; nameAr: string }[] = [
  { id: 'all', name: 'All', nameAr: 'الكل' },
  { id: 'islamic', name: 'Islamic Ornaments', nameAr: 'زخارف إسلامية' },
  { id: 'geometric', name: 'Geometric', nameAr: 'أنماط هندسية' },
  { id: 'luxury', name: 'Marble & Gold', nameAr: 'رخام وذهب فاخر' },
  { id: 'vintage', name: 'Classic & Heritage', nameAr: 'نقوش كلاسيكية' },
  { id: 'botanical', name: 'Botanical & Floral', nameAr: 'زهور ونباتات' },
  { id: 'tech', name: 'Tech & Neon', nameAr: 'تكنولوجيا ونيون' },
  { id: 'abstract', name: 'Abstract Art', nameAr: 'تجريدي وفني' },
];

const svgTile = (w: number, h: number, bg: string, body: string): string =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="${bg}"/>${body}</svg>`,
  )}`;

const item = (
  id: string,
  category: PatternCategoryId,
  name: string,
  nameAr: string,
  descriptionAr: string,
  w: number,
  h: number,
  bg: string,
  body: string,
): BackgroundPatternItem => {
  const uri = svgTile(w, h, bg, body);
  return {
    id,
    name,
    nameAr,
    category,
    type: 'svg-pattern',
    thumbnail: uri,
    sourceUrl: uri,
    descriptionAr,
  };
};

export const PATTERNS_CATALOG: BackgroundPatternItem[] = [
  // ================= 1. ISLAMIC ORNAMENTS (10) =================
  item(
    'pat-islamic-star',
    'islamic',
    'Islamic Golden Star',
    'نقش النجمة الإسلامية الذهبية',
    'نقش هندسي إسلامي بنجوم مزخرفة بلون ذهبي فخم',
    64,
    64,
    '#0E221B',
    `<path d="M32 4l6 18 18 2-14 11 5 18-15-10-15 10 5-18L8 24l18-2z" fill="none" stroke="#E0A83B" stroke-width="1.5" opacity="0.72"/>
     <circle cx="32" cy="32" r="9" fill="none" stroke="#F6C863" stroke-width="1.2" opacity="0.8"/>
     <path d="M0 0l12 12M64 0L52 12M0 64l12-12M64 64L52 52" stroke="#D97706" stroke-width="1.2" opacity="0.45"/>`,
  ),
  item(
    'pat-moroccan-tile',
    'islamic',
    'Moroccan Zellige Quatrefoil',
    'نقش الزليج المغربي الكلاسيكي',
    'نقش زليج مغربي بأقواس متداخلة باللون الفيروزي والعاجي',
    56,
    56,
    '#F5F0E6',
    `<path d="M28 0Q28 28 0 28Q28 28 28 56Q28 28 56 28Q28 28 28 0Z" fill="#1F6F5C" opacity="0.16" stroke="#1F6F5C" stroke-width="1.5"/>
     <circle cx="28" cy="28" r="6" fill="none" stroke="#C5892B" stroke-width="1.4"/>
     <circle cx="0" cy="0" r="6" fill="none" stroke="#1F6F5C" stroke-width="1.2" opacity="0.5"/>
     <circle cx="56" cy="0" r="6" fill="none" stroke="#1F6F5C" stroke-width="1.2" opacity="0.5"/>
     <circle cx="0" cy="56" r="6" fill="none" stroke="#1F6F5C" stroke-width="1.2" opacity="0.5"/>
     <circle cx="56" cy="56" r="6" fill="none" stroke="#1F6F5C" stroke-width="1.2" opacity="0.5"/>`,
  ),
  item(
    'pat-andalusian-rosette',
    'islamic',
    'Andalusian Ivory Rosette',
    'وردة الأندلس العاجية',
    'زخرفة أندلسية ثمانية ناعمة على خلفية عاجية دافئة',
    72,
    72,
    '#FAF6EE',
    `<g fill="none" stroke="#B7791F" stroke-width="1.3" opacity="0.65">
       <polygon points="36,6 45,27 66,36 45,45 36,66 27,45 6,36 27,27"/>
       <polygon points="36,14 58,14 58,36 58,58 36,58 14,58 14,36 14,14" opacity="0.45"/>
       <circle cx="36" cy="36" r="10" stroke="#24795E"/>
     </g>`,
  ),
  item(
    'pat-mashrabiya-lattice',
    'islamic',
    'Mashrabiya Cedar Lattice',
    'مشربية خشبية متشابكة',
    'تعشيق مشربية هندسي بألوان الخشب الدافئ',
    60,
    60,
    '#2B1B12',
    `<g fill="none" stroke="#D89B52" stroke-width="1.6" opacity="0.72">
       <path d="M30 0L60 30L30 60L0 30Z"/>
       <path d="M15 0L60 45M0 15L45 60M45 0L0 45M60 15L15 60" stroke-width="1" opacity="0.55"/>
       <rect x="23" y="23" width="14" height="14" transform="rotate(45 30 30)" fill="#4A2E1B"/>
     </g>`,
  ),
  item(
    'pat-girih-emerald',
    'islamic',
    'Emerald Girih Strapwork',
    'عقد الجيريه الزمردي',
    'شرائط هندسية إسلامية متشابكة بالأخضر الزمردي والذهبي',
    68,
    68,
    '#103126',
    `<g fill="none" stroke="#74C69D" stroke-width="1.4" opacity="0.62">
       <path d="M34 2L52 20L66 34L52 48L34 66L16 48L2 34L16 20Z"/>
       <path d="M20 2L34 22L48 2M66 20L46 34L66 48M48 66L34 46L20 66M2 48L22 34L2 20" stroke="#EAB308" opacity="0.7"/>
       <circle cx="34" cy="34" r="5" fill="#EAB308" opacity="0.5"/>
     </g>`,
  ),
  item(
    'pat-kufic-maze',
    'islamic',
    'Square Kufic Labyrinth',
    'نقش الكوفي المربع',
    'تشكيل هندسي مستوحى من الخط الكوفي المربع المعماري',
    48,
    48,
    '#F3EDE0',
    `<path d="M6 6h36v12H18v12h24v12H6V24h18v6H12v6h24v-6H12V12h24v-2" fill="none" stroke="#365347" stroke-width="3" stroke-linecap="square" opacity="0.55"/>`,
  ),
  item(
    'pat-ottoman-tulip',
    'islamic',
    'Ottoman Tulip Iznik',
    'زهرة التوليب الإزنيقية',
    'نقش خزف إزنيق بزهرة التوليب الفيروزية والمرجانية',
    64,
    64,
    '#F7F9F7',
    `<path d="M32 52V28M32 34C20 30 20 14 32 10C44 14 44 30 32 34Z" fill="#E05A47" fill-opacity="0.22" stroke="#C84635" stroke-width="1.5"/>
     <path d="M32 46C22 44 16 36 18 26M32 46C42 44 48 36 46 26" fill="none" stroke="#1E7860" stroke-width="1.6" stroke-linecap="round"/>
     <circle cx="8" cy="8" r="3" fill="#1E7860" opacity="0.35"/>
     <circle cx="56" cy="8" r="3" fill="#1E7860" opacity="0.35"/>`,
  ),
  item(
    'pat-mihrab-arches',
    'islamic',
    'Gilded Mihrab Arches',
    'أقواس المحراب المذهبة',
    'أقواس عربية مدببة متكررة بإيقاع معماري أنيق',
    56,
    72,
    '#142634',
    `<path d="M4 72V34Q4 10 28 4Q52 10 52 34V72" fill="none" stroke="#E5B95C" stroke-width="1.6" opacity="0.7"/>
     <path d="M12 72V36Q12 18 28 13Q44 18 44 36V72" fill="none" stroke="#76C7B7" stroke-width="1" opacity="0.5"/>
     <circle cx="28" cy="28" r="3.5" fill="#E5B95C" opacity="0.75"/>`,
  ),
  item(
    'pat-fez-mosaic',
    'islamic',
    'Fez Courtyard Mosaic',
    'فسيفساء فاس الملونة',
    'تشكيل فسيفساء مغربي بألوان الزمرد والعنبر والعاج',
    60,
    60,
    '#FAF7F0',
    `<polygon points="30,4 38,22 56,30 38,38 30,56 22,38 4,30 22,22" fill="#24795E" fill-opacity="0.78"/>
     <circle cx="30" cy="30" r="6" fill="#D97706"/>
     <polygon points="0,0 10,4 4,10" fill="#1E3A8A" opacity="0.65"/>
     <polygon points="60,0 50,4 56,10" fill="#1E3A8A" opacity="0.65"/>
     <polygon points="0,60 10,56 4,50" fill="#1E3A8A" opacity="0.65"/>
     <polygon points="60,60 50,56 56,50" fill="#1E3A8A" opacity="0.65"/>`,
  ),
  item(
    'pat-desert-medallion',
    'islamic',
    'Sandstone Arabesque Medallion',
    'ميدالية الصحراء العربية',
    'ميدالية أرابيسك رملية ناعمة تناسب الدعوات والبطاقات',
    64,
    64,
    '#EFE6D5',
    `<path d="M32 6L58 32L32 58L6 32Z" fill="#DFCDAE" stroke="#9C6F38" stroke-width="1.3"/>
     <circle cx="32" cy="32" r="12" fill="#EFE6D5" stroke="#24795E" stroke-width="1.3"/>
     <path d="M32 23v18M23 32h18" stroke="#9C6F38" stroke-width="1.2"/>`,
  ),

  // ================= 2. GEOMETRIC PATTERNS (10) =================
  item(
    'pat-polka-dots',
    'geometric',
    'Balanced Polka Dots',
    'نقاط بولكا متوازنة',
    'نقش نقاط صغيرة ناعمة للخلفيات العصرية',
    32,
    32,
    '#EDF4F0',
    `<circle cx="8" cy="8" r="3" fill="#24795E" opacity="0.48"/>
     <circle cx="24" cy="24" r="3" fill="#24795E" opacity="0.48"/>`,
  ),
  item(
    'pat-blueprint-grid',
    'geometric',
    'Architectural Grid Mesh',
    'شبكة مخططات هندسية',
    'شبكة مربعات معمارية مزدوجة الدقة',
    40,
    40,
    '#0C4A6E',
    `<path d="M40 0H0V40" fill="none" stroke="#7DD3FC" stroke-width="1" opacity="0.38"/>
     <path d="M20 0V40M0 20H40" fill="none" stroke="#BAE6FD" stroke-width="0.6" opacity="0.22"/>`,
  ),
  item(
    'pat-chevron-modern',
    'geometric',
    'Modern Chevron Zigzag',
    'شيفرون متعرج عصري',
    'خطوط شيفرون هندسية متوازية بإيقاع ديناميكي',
    48,
    36,
    '#F4F7F5',
    `<path d="M0 12L24 0L48 12M0 24L24 12L48 24M0 36L24 24L48 36" fill="none" stroke="#24795E" stroke-width="2.2" opacity="0.45"/>`,
  ),
  item(
    'pat-herringbone-oak',
    'geometric',
    'Architectural Herringbone',
    'عظم السمكة المعماري',
    'نمط باركيه عظم السمكة الأنيق بتدرج هادئ',
    48,
    48,
    '#F5EFE6',
    `<path d="M0 12L12 0L24 12L12 24ZM24 12L36 0L48 12L36 24ZM12 24L24 12L36 24L24 36ZM0 36L12 24L24 36L12 48ZM24 36L36 24L48 36L36 48Z" fill="none" stroke="#9A7B56" stroke-width="1.2" opacity="0.5"/>`,
  ),
  item(
    'pat-houndstooth-classic',
    'geometric',
    'Classic Houndstooth',
    'هاوندستوث كلاسيكي',
    'نقشة الأزياء الكلاسيكية المتداخلة بالأخضر الداكن والعاجي',
    40,
    40,
    '#F6F5F0',
    `<path d="M0 0h20l10-10v20L20 20v10L10 20H0zM20 20h20v20H20z" fill="#1E352B" opacity="0.22"/>
     <path d="M0 20l10-10h10L10 20zm20 20l10-10h10L30 40z" fill="#24795E" opacity="0.35"/>`,
  ),
  item(
    'pat-isometric-cubes',
    'geometric',
    '3D Isometric Cubes',
    'مكعبات ثلاثية الأبعاد',
    'مكعبات هندسية مجسمة بظلال ثلاثية الأبعاد',
    56,
    48,
    '#E8F0EC',
    `<polygon points="28,0 56,12 28,24 0,12" fill="#FFFFFF" opacity="0.85"/>
     <polygon points="0,12 28,24 28,48 0,36" fill="#84BFA8" opacity="0.6"/>
     <polygon points="28,24 56,12 56,36 28,48" fill="#24795E" opacity="0.45"/>`,
  ),
  item(
    'pat-bauhaus-shapes',
    'geometric',
    'Bauhaus Geometric Tiles',
    'تراكيب باوهاوس الفنية',
    'أرباع دوائر ومثلثات مستوحاة من مدرسة باوهاوس',
    64,
    64,
    '#FBF8F1',
    `<path d="M0 0A32 32 0 0 1 32 32H0Z" fill="#24795E" opacity="0.78"/>
     <path d="M64 0V32H32A32 32 0 0 1 64 0Z" fill="#E09F3E" opacity="0.78"/>
     <polygon points="0,32 32,32 0,64" fill="#D65A47" opacity="0.72"/>
     <circle cx="48" cy="48" r="11" fill="#264653" opacity="0.78"/>`,
  ),
  item(
    'pat-argyle-diamond',
    'geometric',
    'Crossed Argyle Diamonds',
    'معينات أرجايل المتقاطعة',
    'معينات كلاسيكية متناظرة مع خطوط متقاطعة منقطة',
    48,
    64,
    '#F2F6F4',
    `<polygon points="24,0 48,32 24,64 0,32" fill="#24795E" fill-opacity="0.16"/>
     <path d="M0 0L48 64M48 0L0 64" stroke="#1E352B" stroke-width="1" stroke-dasharray="3 3" opacity="0.45"/>`,
  ),
  item(
    'pat-diagonal-awning',
    'geometric',
    'Soft Diagonal Stripes',
    'خطوط قطرية ناعمة',
    'تقليمات مائلة متناسقة بزاوية 45 درجة',
    32,
    32,
    '#F7FAF8',
    `<path d="M-8,8 l16,-16 M0,32 l32,-32 M24,40 l16,-16" stroke="#24795E" stroke-width="6" opacity="0.16"/>`,
  ),
  item(
    'pat-lowpoly-facets',
    'geometric',
    'Faceted Prism Triangles',
    'فسيفساء المثلثات المتدرجة',
    'شبكة مثلثات منشورية متدرجة الإضاءة',
    60,
    52,
    '#DCEBE3',
    `<polygon points="0,0 30,0 15,26" fill="#CBE2D6"/>
     <polygon points="30,0 60,0 45,26" fill="#B5D5C5"/>
     <polygon points="15,26 45,26 30,0" fill="#EDF5F0"/>
     <polygon points="0,52 15,26 30,52" fill="#A3CBB7"/>
     <polygon points="30,52 45,26 60,52" fill="#E3EFE8"/>`,
  ),

  // ================= 3. LUXURY MARBLE & GOLD (10) =================
  item(
    'pat-carrara-marble',
    'luxury',
    'White Carrara Gold Veins',
    'رخام كرارا أبيض بعروق ذهبية',
    'ملمس رخام أبيض راقٍ تتخلله عروق ذهبية ورمادية ناعمة',
    96,
    96,
    '#FAF9F6',
    `<path d="M0 22Q28 12 46 34T96 26M0 68Q36 52 58 76T96 66" fill="none" stroke="#CBD5E1" stroke-width="2.2" opacity="0.7"/>
     <path d="M12 0Q32 34 22 60T48 96M64 0Q82 28 70 58T88 96" fill="none" stroke="#D4AF37" stroke-width="1.1" opacity="0.65"/>`,
  ),
  item(
    'pat-nero-gold-marble',
    'luxury',
    'Black Nero Gold Marble',
    'رخام أسود ملكي بعروق الذهب',
    'خلفية رخام أسود فاخر مع عروق ذهبية متوهجة',
    96,
    96,
    '#141416',
    `<path d="M0 18C26 28 38 8 64 24S82 46 96 38M0 74C28 60 48 86 74 68S88 54 96 62" fill="none" stroke="#D4AF37" stroke-width="1.6" opacity="0.78"/>
     <path d="M24 0C36 28 16 54 38 96M72 0C60 32 84 62 68 96" fill="none" stroke="#FDE68A" stroke-width="0.7" opacity="0.42"/>`,
  ),
  item(
    'pat-emerald-malachite',
    'luxury',
    'Emerald Malachite Bands',
    'حجر الملاكيت الأخضر الفاخر',
    'تموجات حجر الملاكيت الطبيعي بدرجات الزمرد والذهب',
    80,
    80,
    '#0D3B2E',
    `<path d="M0 16Q20 4 40 16T80 16M0 36Q20 22 40 36T80 36M0 56Q20 44 40 56T80 56M0 74Q20 64 40 74T80 74" fill="none" stroke="#34D399" stroke-width="3" opacity="0.32"/>
     <path d="M0 26Q20 14 40 26T80 26M0 66Q20 54 40 66T80 66" fill="none" stroke="#EAB308" stroke-width="1" opacity="0.55"/>`,
  ),
  item(
    'pat-artdeco-fan',
    'luxury',
    'Gilded Art Deco Fans',
    'مراوح آرت ديكو المذهبة',
    'أقواس آرت ديكو الذهبية الفاخرة على كحلي ملكي',
    64,
    48,
    '#111B27',
    `<g fill="none" stroke="#D4AF37" stroke-width="1.3" opacity="0.75">
       <path d="M0 48A32 32 0 0 1 64 48"/>
       <path d="M32 48L12 22M32 48L24 17M32 48V16M32 48L40 17M32 48L52 22"/>
       <path d="M-32 24A32 32 0 0 1 32 24M32 24A32 32 0 0 1 96 24"/>
     </g>`,
  ),
  item(
    'pat-pearl-scallop',
    'luxury',
    'Mother of Pearl Scallops',
    'قشور اللؤلؤ المتراصة',
    'أصداف لؤلؤية ناعمة بحواف ذهبية رقيقة',
    56,
    48,
    '#FCFBF7',
    `<g fill="#F4EFE4" fill-opacity="0.6" stroke="#C9A24D" stroke-width="1.2">
       <path d="M-28 24A28 24 0 0 1 28 24A28 24 0 0 1 84 24"/>
       <path d="M0 48A28 24 0 0 1 56 48"/>
     </g>`,
  ),
  item(
    'pat-champagne-sunburst',
    'luxury',
    'Champagne Gold Sunburst',
    'إشعاع الشامبانيا الذهبي',
    'نجوم شعاعية بلون الشامبانيا للعروض والبطاقات الفاخرة',
    64,
    64,
    '#FBF7EE',
    `<g stroke="#C89D3C" stroke-width="1.1" opacity="0.62">
       <path d="M32 8v48M8 32h48M15 15l34 34M49 15L15 49"/>
       <circle cx="32" cy="32" r="5" fill="#FBF7EE"/>
     </g>`,
  ),
  item(
    'pat-velvet-tufted',
    'luxury',
    'Quilted Diamond Tufting',
    'تبطين مخملي ماسي',
    'تبطين جلدي ومخملي فاخر مع دبابيس ذهبية عند الزوايا',
    56,
    56,
    '#1D2824',
    `<path d="M28 0L56 28L28 56L0 28Z" fill="none" stroke="#4D6B5E" stroke-width="1.4"/>
     <circle cx="28" cy="0" r="2.5" fill="#E5B95C"/>
     <circle cx="28" cy="56" r="2.5" fill="#E5B95C"/>
     <circle cx="0" cy="28" r="2.5" fill="#E5B95C"/>
     <circle cx="56" cy="28" r="2.5" fill="#E5B95C"/>
     <circle cx="28" cy="28" r="2.5" fill="#E5B95C"/>`,
  ),
  item(
    'pat-versailles-trellis',
    'luxury',
    'Royal Versailles Trellis',
    'تعريشة فرساي الملكية',
    'إطارات متداخلة كلاسيكية مستوحاة من قصور فرساي',
    64,
    64,
    '#F7F3EA',
    `<path d="M32 4C44 18 46 18 60 32C46 46 44 46 32 60C20 46 18 46 4 32C18 18 20 18 32 4Z" fill="none" stroke="#B78A3A" stroke-width="1.5"/>
     <circle cx="32" cy="32" r="4" fill="#B78A3A" opacity="0.65"/>`,
  ),
  item(
    'pat-rose-quartz-veins',
    'luxury',
    'Rose Quartz & Blush Gold',
    'رخام الكوارتز الوردي',
    'تموجات الكوارتز الوردي الناعمة مع خيوط ذهبية للجمال والعطور',
    88,
    88,
    '#FDF2F4',
    `<path d="M0 24Q30 8 54 30T88 22M0 64Q26 80 52 58T88 68" fill="none" stroke="#F4B8C4" stroke-width="3" opacity="0.65"/>
     <path d="M18 0Q42 36 28 88M68 0Q54 44 74 88" fill="none" stroke="#D4A359" stroke-width="1" opacity="0.6"/>`,
  ),
  item(
    'pat-imperial-filigree',
    'luxury',
    'Imperial Gold Filigree',
    'تخريم ذهبي إمبراطوري',
    'زخارف تخريمية ذهبية دقيقة على خلفية عنابية ملكية',
    64,
    64,
    '#3B1219',
    `<g fill="none" stroke="#E6BA5A" stroke-width="1.3" opacity="0.72">
       <circle cx="32" cy="32" r="20"/>
       <circle cx="32" cy="32" r="10"/>
       <path d="M32 4v16M32 44v16M4 32h16M44 32h16"/>
     </g>`,
  ),

  // ================= 4. CLASSIC & HERITAGE (10) =================
  item(
    'pat-damask-vintage',
    'vintage',
    'Classic Royal Damask',
    'نقش دمشقي كلاسيكي فاخر',
    'نقش نباتي دمشقي عريق بلمسة تراثية ملكية',
    72,
    72,
    '#1E1B18',
    `<path d="M36 8C18 18 18 38 36 48C54 38 54 18 36 8Z" fill="none" stroke="#D99B38" stroke-width="1.6" opacity="0.65"/>
     <path d="M36 48C24 56 24 68 36 72C48 68 48 56 36 48Z" fill="none" stroke="#F0B85A" stroke-width="1.2" opacity="0.5"/>
     <circle cx="36" cy="28" r="4" fill="#D99B38" opacity="0.65"/>`,
  ),
  item(
    'pat-seigaiha-waves',
    'vintage',
    'Seigaiha Ocean Waves',
    'أمواج سيغايها التراثية',
    'أقواس الأمواج المتراكبة الهادئة بأسلوب الحبر الكلاسيكي',
    64,
    32,
    '#EEF4F7',
    `<g fill="none" stroke="#255F7A" stroke-width="1.3" opacity="0.55">
       <circle cx="32" cy="32" r="28"/><circle cx="32" cy="32" r="20"/><circle cx="32" cy="32" r="12"/>
       <circle cx="0" cy="16" r="20"/><circle cx="64" cy="16" r="20"/>
     </g>`,
  ),
  item(
    'pat-asanoha-star',
    'vintage',
    'Asanoha Star Weave',
    'نجمة أسانوها المنسوجة',
    'نجمة هندسية سداسية دقيقة مستوحاة من النسيج التراثي',
    56,
    64,
    '#F9F5EE',
    `<g fill="none" stroke="#8C5A3C" stroke-width="1.1" opacity="0.55">
       <path d="M28 0v64M0 16l56 32M56 16L0 48M0 16L28 0l28 16v32L28 64 0 48z"/>
     </g>`,
  ),
  item(
    'pat-tartan-plaid',
    'vintage',
    'Scottish Tartan Plaid',
    'كاروهات تارتان كلاسيكية',
    'نسيج كاروهات متقاطع بالأخضر الغامق والكريمي',
    64,
    64,
    '#F3EFE6',
    `<rect x="12" y="0" width="16" height="64" fill="#24795E" opacity="0.22"/>
     <rect x="0" y="12" width="64" height="16" fill="#24795E" opacity="0.22"/>
     <path d="M44 0v64M0 44h64" stroke="#B45309" stroke-width="2" opacity="0.45"/>`,
  ),
  item(
    'pat-paisley-cashmere',
    'vintage',
    'Cashmere Paisley Drop',
    'نقشة الكشمير والبيزلي',
    'دمعة الكشمير الشرقية المزخرفة بتفاصيل دقيقة',
    68,
    68,
    '#FDF8F0',
    `<path d="M28 16C46 16 54 32 46 46C38 58 20 54 18 38C16 26 24 22 30 26" fill="#24795E" fill-opacity="0.14" stroke="#24795E" stroke-width="1.6" stroke-linecap="round"/>
     <circle cx="34" cy="36" r="4" fill="#D97706" opacity="0.6"/>
     <circle cx="56" cy="16" r="2.5" fill="#24795E" opacity="0.4"/>`,
  ),
  item(
    'pat-victorian-lace',
    'vintage',
    'Ivory Victorian Lace',
    'دانتيل فيكتوري مفرغ',
    'زخارف دانتيل ناعمة مثالية لبطاقات الزفاف والتهنئة',
    60,
    60,
    '#F5ECE4',
    `<g fill="none" stroke="#FFFFFF" stroke-width="1.8">
       <circle cx="30" cy="30" r="20" stroke-dasharray="4 3"/>
       <circle cx="30" cy="30" r="11"/>
       <path d="M30 6v8M30 46v8M6 30h8M46 30h8"/>
     </g>`,
  ),
  item(
    'pat-linen-weave',
    'vintage',
    'Natural Woven Linen',
    'نسيج الكتان الطبيعي',
    'ملمس قماش كتان منسوج دافئ وهادئ للنصوص',
    24,
    24,
    '#EFE9DC',
    `<path d="M0 6h24M0 18h24M6 0v24M18 0v24" stroke="#CBBBA0" stroke-width="1" opacity="0.55"/>`,
  ),
  item(
    'pat-majolica-tile',
    'vintage',
    'Mediterranean Majolica',
    'بلاط المايوليكا المتوسطي',
    'بلاط خزفي متوسطي بالأزرق اللازوردي والليموني',
    64,
    64,
    '#FFFFFF',
    `<path d="M32 6C38 22 42 26 58 32C42 38 38 42 32 58C26 42 22 38 6 32C22 26 26 22 32 6Z" fill="#1D4ED8" fill-opacity="0.16" stroke="#1D4ED8" stroke-width="1.5"/>
     <circle cx="32" cy="32" r="5" fill="#EAB308"/>`,
  ),
  item(
    'pat-greek-meander',
    'vintage',
    'Classical Greek Key',
    'المفتاح اليوناني الكلاسيكي',
    'زخرفة هندسية كلاسيكية متصلة للشهادات والإطارات',
    48,
    48,
    '#F8F5EC',
    `<path d="M0 8h40v32H16V20h12v8h-4v-4h-4v12h16V12H0" fill="none" stroke="#785A32" stroke-width="2" opacity="0.5"/>`,
  ),
  item(
    'pat-heritage-pinstripe',
    'vintage',
    'Tailored Cream Pinstripe',
    'تقليمة كلاسيكية راقية',
    'خطوط طولية رفيعة متناوبة بأسلوب القرطاسية الفاخرة',
    28,
    28,
    '#FAF7F0',
    `<path d="M7 0v28" stroke="#24795E" stroke-width="1.2" opacity="0.35"/>
     <path d="M21 0v28" stroke="#C59B40" stroke-width="0.8" stroke-dasharray="4 3" opacity="0.5"/>`,
  ),

  // ================= 5. BOTANICAL & FLORAL (10) =================
  item(
    'pat-olive-branches',
    'botanical',
    'Mediterranean Olive Leaves',
    'أغصان وأوراق الزيتون',
    'أغصان زيتون ناعمة بدرجات الأخضر الطبيعي على خلفية كريمية',
    68,
    68,
    '#F6F8F3',
    `<path d="M12 56Q34 34 56 12" fill="none" stroke="#4D7C5B" stroke-width="1.6"/>
     <ellipse cx="24" cy="36" rx="8" ry="3.5" transform="rotate(-25 24 36)" fill="#6B9E78" opacity="0.75"/>
     <ellipse cx="42" cy="32" rx="8" ry="3.5" transform="rotate(25 42 32)" fill="#3B6E4C" opacity="0.75"/>
     <ellipse cx="38" cy="18" rx="7" ry="3" transform="rotate(-25 38 18)" fill="#6B9E78" opacity="0.75"/>
     <circle cx="32" cy="42" r="3" fill="#365314"/>`,
  ),
  item(
    'pat-palm-fronds',
    'botanical',
    'Tropical Palm Fronds',
    'سعف النخيل الاستوائي',
    'سعف نخيل انسيابي يمنح التصميم طابعاً طبيعياً منعشاً',
    72,
    72,
    '#ECF6F1',
    `<path d="M10 62Q36 36 62 10" fill="none" stroke="#1E6B52" stroke-width="1.8"/>
     <path d="M22 50L12 34M30 42L18 24M38 34L28 16M46 26L38 10M26 46L44 56M34 38L52 46M42 30L60 36" stroke="#24795E" stroke-width="1.8" stroke-linecap="round" opacity="0.65"/>`,
  ),
  item(
    'pat-jasmine-blossom',
    'botanical',
    'White Jasmine Blossoms',
    'زهور الياسمين البيضاء',
    'زهور ياسمين خماسية ناعمة على خلفية خضراء باستيل',
    60,
    60,
    '#E5F2EB',
    `<g transform="translate(30 30)">
       <ellipse rx="4" ry="11" fill="#FFFFFF"/>
       <ellipse rx="4" ry="11" transform="rotate(72)" fill="#FFFFFF"/>
       <ellipse rx="4" ry="11" transform="rotate(144)" fill="#FFFFFF"/>
       <ellipse rx="4" ry="11" transform="rotate(216)" fill="#FFFFFF"/>
       <ellipse rx="4" ry="11" transform="rotate(288)" fill="#FFFFFF"/>
       <circle r="3.5" fill="#F59E0B"/>
     </g>`,
  ),
  item(
    'pat-monstera-tropical',
    'botanical',
    'Botanical Leaf Silhouette',
    'أوراق المونستيرا الخضراء',
    'ظلال أوراق نباتية عريضة للملصقات والمنتجات الطبيعية',
    72,
    72,
    '#F2F7F2',
    `<path d="M36 12C54 16 58 42 36 60C14 42 18 16 36 12Z" fill="#2D7A5B" fill-opacity="0.22" stroke="#24795E" stroke-width="1.4"/>
     <path d="M36 16v40M36 28l10-6M36 38l12-6M36 32l-10-6M36 42l-12-6" stroke="#24795E" stroke-width="1.2" opacity="0.65"/>`,
  ),
  item(
    'pat-wheat-harvest',
    'botanical',
    'Golden Wheat Harvest',
    'سنابل القمح الذهبية',
    'سنابل قمح دافئة مثالية للمخابز والمنتجات الغذائية',
    56,
    68,
    '#FBF6E9',
    `<path d="M28 62V14" stroke="#B7791F" stroke-width="1.5"/>
     <ellipse cx="23" cy="22" rx="3" ry="6" transform="rotate(-28 23 22)" fill="#D69E2E"/>
     <ellipse cx="33" cy="22" rx="3" ry="6" transform="rotate(28 33 22)" fill="#D69E2E"/>
     <ellipse cx="23" cy="34" rx="3" ry="6" transform="rotate(-28 23 34)" fill="#D69E2E"/>
     <ellipse cx="33" cy="34" rx="3" ry="6" transform="rotate(28 33 34)" fill="#D69E2E"/>
     <ellipse cx="28" cy="12" rx="2.8" ry="6" fill="#ECC94B"/>`,
  ),
  item(
    'pat-lotus-petals',
    'botanical',
    'Serene Lotus Petals',
    'بتلات زهرة اللوتس',
    'بتلات لوتس متناظرة للعناية والجمال والسبا',
    68,
    60,
    '#FAF3F5',
    `<path d="M34 14C42 26 42 40 34 48C26 40 26 26 34 14Z" fill="#E07A9A" fill-opacity="0.28" stroke="#C85A7C" stroke-width="1.3"/>
     <path d="M34 48C48 44 54 32 50 22C40 26 36 36 34 48ZM34 48C20 44 14 32 18 22C28 26 32 36 34 48Z" fill="#E07A9A" fill-opacity="0.16" stroke="#C85A7C" stroke-width="1.2"/>`,
  ),
  item(
    'pat-fern-forest',
    'botanical',
    'Woodland Fern Fronds',
    'سرخس الغابة الهادئة',
    'أوراق سرخس رقيقة متناثرة بأسلوب الرسم النباتي',
    64,
    64,
    '#162921',
    `<path d="M16 52Q32 32 48 12" fill="none" stroke="#85CCAC" stroke-width="1.4"/>
     <path d="M22 44l-8-4m14-4l-8-4m14-4l-8-4m-2 16l6 6m0-14l6 6m0-14l6 6" stroke="#85CCAC" stroke-width="1.3" stroke-linecap="round" opacity="0.75"/>`,
  ),
  item(
    'pat-eucalyptus-sprig',
    'botanical',
    'Soft Eucalyptus Coins',
    'أوراق الأوكالبتوس الناعمة',
    'أوراق أوكالبتوس مستديرة هادئة للبطاقات العصرية',
    64,
    64,
    '#F4F7F4',
    `<path d="M32 60Q28 32 34 6" fill="none" stroke="#5F8D78" stroke-width="1.3"/>
     <circle cx="24" cy="44" r="7" fill="#7FA998" opacity="0.55"/>
     <circle cx="40" cy="34" r="7" fill="#5F8D78" opacity="0.5"/>
     <circle cx="25" cy="22" r="6" fill="#8FB8A8" opacity="0.6"/>`,
  ),
  item(
    'pat-sakura-blossom',
    'botanical',
    'Spring Sakura Petals',
    'أزهار الساكورا الربيعية',
    'بتلات زهر الكرز المتناثرة بألوان الربيع الوردية',
    64,
    64,
    '#FFF7F9',
    `<circle cx="22" cy="22" r="7" fill="#F9A8D4" opacity="0.55"/>
     <circle cx="22" cy="22" r="2" fill="#DB2777"/>
     <circle cx="48" cy="46" r="5" fill="#FBCFE8" opacity="0.75"/>
     <path d="M44 16c4-2 8 2 5 6c-4 2-8-2-5-6z" fill="#F472B6" opacity="0.5"/>`,
  ),
  item(
    'pat-arabesque-vine',
    'botanical',
    'Scrolling Arabesque Vine',
    'كرمة عربية مورقة',
    'أغصان نباتية حلزونية تجمع الزخرفة العربية والطبيعة',
    72,
    72,
    '#F6F4EC',
    `<path d="M0 36Q18 10 36 36T72 36" fill="none" stroke="#24795E" stroke-width="1.6" opacity="0.65"/>
     <circle cx="18" cy="26" r="5" fill="none" stroke="#C5892B" stroke-width="1.3"/>
     <circle cx="54" cy="46" r="5" fill="none" stroke="#C5892B" stroke-width="1.3"/>`,
  ),

  // ================= 6. TECH & NEON (5) =================
  item(
    'pat-hex-tech',
    'tech',
    'Hexagon Tech Mesh',
    'شبكة خلايا النحل التكنولوجية',
    'نقش مسدسات تكنولوجية مناسب للتطبيقات والألعاب',
    56,
    96,
    '#0F172A',
    `<path d="M28 64L0 48V16L28 0L56 16V48ZM28 96L0 80V48L28 64L56 48V80Z" fill="none" stroke="#38BDF8" stroke-width="1.2" opacity="0.42"/>`,
  ),
  item(
    'pat-circuit-tech',
    'tech',
    'Cyberpunk Circuit Traces',
    'نقش مسارات دوائر إلكترونية',
    'مسارات دوائر إلكترونية مضيئة بألوان النيون',
    64,
    64,
    '#0B101B',
    `<path d="M0 14h22v20h20v30M64 24H44v18H14V0" fill="none" stroke="#34D399" stroke-width="1.5" opacity="0.55"/>
     <circle cx="22" cy="14" r="3" fill="#34D399"/>
     <circle cx="44" cy="24" r="3" fill="#38BDF8"/>`,
  ),
  item(
    'pat-matrix-dots',
    'tech',
    'Digital Dot Matrix',
    'مصفوفة النقاط الرقمية',
    'مصفوفة نقاط مضيئة متدرجة الكثافة للمحتوى التقني',
    40,
    40,
    '#0D1512',
    `<circle cx="8" cy="8" r="2.2" fill="#34D399" opacity="0.85"/>
     <circle cx="20" cy="8" r="1.4" fill="#34D399" opacity="0.4"/>
     <circle cx="32" cy="8" r="1.8" fill="#34D399" opacity="0.6"/>
     <circle cx="8" cy="20" r="1.3" fill="#34D399" opacity="0.35"/>
     <circle cx="20" cy="20" r="2.5" fill="#74C69D" opacity="0.9"/>
     <circle cx="32" cy="32" r="2" fill="#34D399" opacity="0.7"/>`,
  ),
  item(
    'pat-neon-synth-grid',
    'tech',
    'Neon Perspective Grid',
    'شبكة النيون المستقبلية',
    'شبكة ليزر متوهجة بالبنفسجي والسماوي للبث والألعاب',
    48,
    48,
    '#120B24',
    `<path d="M48 0H0V48" fill="none" stroke="#EC4899" stroke-width="1" opacity="0.42"/>
     <path d="M24 0V48M0 24H48" fill="none" stroke="#22D3EE" stroke-width="0.7" opacity="0.32"/>`,
  ),
  item(
    'pat-radar-rings',
    'tech',
    'Sonar Radar Concentric',
    'دوائر الرادار المتداخلة',
    'حلقات رادار وإحداثيات تقنية دقيقة',
    72,
    72,
    '#0A1916',
    `<circle cx="36" cy="36" r="28" fill="none" stroke="#2DD4BF" stroke-width="1" opacity="0.32"/>
     <circle cx="36" cy="36" r="16" fill="none" stroke="#2DD4BF" stroke-width="1" stroke-dasharray="4 3" opacity="0.48"/>
     <path d="M36 0v72M0 36h72" stroke="#2DD4BF" stroke-width="0.6" opacity="0.22"/>`,
  ),

  // ================= 7. ABSTRACT ART (5) =================
  item(
    'pat-topo-contours',
    'abstract',
    'Topographic Contour Map',
    'خطوط الكنتور الطبوغرافية',
    'منحنيات طبوغرافية انسيابية حديثة للهويات العصرية',
    96,
    96,
    '#F2F6F3',
    `<g fill="none" stroke="#24795E" stroke-width="1.2" opacity="0.38">
       <path d="M0 20C32 6 64 38 96 20"/>
       <path d="M0 44C28 26 68 62 96 44"/>
       <path d="M0 72C36 56 60 88 96 72"/>
       <ellipse cx="48" cy="48" rx="22" ry="11"/>
     </g>`,
  ),
  item(
    'pat-terrazzo-stone',
    'abstract',
    'Venetian Terrazzo Chips',
    'تيرازو الحجر الإيطالي الملون',
    'شظايا حجر تيرازو ملونة على خلفية حجرية فاتحة',
    80,
    80,
    '#F6F3EE',
    `<polygon points="14,16 26,12 22,26" fill="#24795E" opacity="0.75"/>
     <polygon points="54,18 68,24 58,34 48,26" fill="#E07A5F" opacity="0.8"/>
     <polygon points="24,54 38,50 34,66 18,62" fill="#E9C46A" opacity="0.85"/>
     <polygon points="60,58 72,54 68,70" fill="#457B9D" opacity="0.75"/>
     <circle cx="42" cy="34" r="3" fill="#9A8C98"/>`,
  ),
  item(
    'pat-memphis-confetti',
    'abstract',
    'Playful Memphis Confetti',
    'كونفيتي ممفيس الإبداعي',
    'أشكال وخطوط احتفالية مرحة للإعلانات والسوشيال ميديا',
    72,
    72,
    '#FFFDF7',
    `<path d="M12 18l8-6 8 6-8 6" fill="none" stroke="#24795E" stroke-width="2"/>
     <circle cx="54" cy="20" r="5" fill="#F59E0B" opacity="0.8"/>
     <path d="M18 52q6-8 12 0t12 0" fill="none" stroke="#EC4899" stroke-width="2.2" stroke-linecap="round"/>
     <rect x="50" y="48" width="9" height="9" transform="rotate(22 54 52)" fill="#3B82F6" opacity="0.75"/>`,
  ),
  item(
    'pat-opart-waves',
    'abstract',
    'Fluid Ribbon Waves',
    'تموجات الفن البصري',
    'أمواج انسيابية متوازية تعطي إحساساً بالحركة والعمق',
    64,
    48,
    '#132A22',
    `<path d="M0 12Q16 0 32 12T64 12M0 24Q16 12 32 24T64 24M0 36Q16 24 32 36T64 36" fill="none" stroke="#85CCAC" stroke-width="1.8" opacity="0.5"/>`,
  ),
  item(
    'pat-starry-cosmos',
    'abstract',
    'Celestial Starry Cosmos',
    'سماء النجوم والكواكب',
    'نجوم وبريق سماوي ذهبي على خلفية ليلية هادئة',
    72,
    72,
    '#111827',
    `<path d="M22 14l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="#FBBF24" opacity="0.85"/>
     <path d="M54 46l1.5 4.5 4.5 1.5-4.5 1.5-1.5 4.5-1.5-4.5-4.5-1.5 4.5-1.5z" fill="#85CCAC" opacity="0.8"/>
     <circle cx="52" cy="18" r="1.6" fill="#FDE68A"/>
     <circle cx="18" cy="54" r="1.8" fill="#E0F2FE"/>
     <circle cx="38" cy="36" r="1.2" fill="#FDE68A" opacity="0.7"/>`,
  ),
];
