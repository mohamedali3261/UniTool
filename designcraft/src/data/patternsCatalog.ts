// Patterned & Ornate Backgrounds Catalog for Applet

export interface BackgroundPatternItem {
  id: string;
  name: string;
  nameAr: string;
  category: 'islamic' | 'geometric' | 'luxury' | 'tech' | 'vintage' | 'abstract';
  type: 'svg-pattern' | 'wallpaper-image';
  thumbnail: string;
  // For SVG patterns: SVG string or Data URL; For wallpaper-image: high res URL
  sourceUrl: string;
  descriptionAr: string;
}

export const PATTERN_CATEGORIES = [
  { id: 'all', nameAr: 'الكل' },
  { id: 'islamic', nameAr: 'زخارف إسلامية' },
  { id: 'luxury', nameAr: 'رخام وذهب فاخر' },
  { id: 'geometric', nameAr: 'أنماط هندسية' },
  { id: 'tech', nameAr: 'تكنولوجيا ونيون' },
  { id: 'vintage', nameAr: 'نقوش كلاسيكية' },
  { id: 'abstract', nameAr: 'تجريدي وفني' }
];

// Helper to encode SVG string into data URI for Fabric.js pattern creation
const svgToDataUri = (svgStr: string): string => {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgStr)}`;
};

// 1. SVG Seamless Tile Patterns
const ISLAMIC_STAR_SVG = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
  <rect width="60" height="60" fill="#0B132B"/>
  <path d="M30 0 L36 18 L54 18 L40 28 L46 46 L30 35 L14 46 L20 28 L6 18 L24 18 Z" fill="none" stroke="#D97706" stroke-width="1.5" opacity="0.6"/>
  <circle cx="30" cy="30" r="8" fill="none" stroke="#F59E0B" stroke-width="1" opacity="0.8"/>
  <path d="M0 30 L6 12 L24 12 L10 22 L16 40 L0 29 Z" fill="none" stroke="#D97706" stroke-width="1" opacity="0.3"/>
  <path d="M60 30 L54 12 L36 12 L50 22 L44 40 L60 29 Z" fill="none" stroke="#D97706" stroke-width="1" opacity="0.3"/>
</svg>`);

const GEOMETRIC_HEX_SVG = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="56" height="100" viewBox="0 0 56 100">
  <rect width="56" height="100" fill="#0F172A"/>
  <path d="M28 66L0 50L0 16L28 0L56 16L56 50L28 66ZM28 100L0 84L0 50L28 66L56 50L56 84L28 100Z" fill="none" stroke="#0284C7" stroke-width="1.2" opacity="0.4"/>
  <path d="M28 0L28 33M0 16L28 33M56 16L28 33" stroke="#38BDF8" stroke-width="0.8" opacity="0.3"/>
</svg>`);

const POLKA_DOTS_SVG = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">
  <rect width="30" height="30" fill="#1E293B"/>
  <circle cx="15" cy="15" r="3" fill="#38BDF8" opacity="0.5"/>
  <circle cx="0" cy="0" r="1.5" fill="#38BDF8" opacity="0.3"/>
  <circle cx="30" cy="0" r="1.5" fill="#38BDF8" opacity="0.3"/>
  <circle cx="0" cy="30" r="1.5" fill="#38BDF8" opacity="0.3"/>
  <circle cx="30" cy="30" r="1.5" fill="#38BDF8" opacity="0.3"/>
</svg>`);

const DAMASK_VINTAGE_SVG = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
  <rect width="80" height="80" fill="#1C1917"/>
  <path d="M40 10 C 20 20, 20 40, 40 50 C 60 40, 60 20, 40 10 Z" fill="none" stroke="#D97706" stroke-width="1.5" opacity="0.5"/>
  <path d="M40 50 C 25 60, 25 75, 40 80 C 55 75, 55 60, 40 50 Z" fill="none" stroke="#F59E0B" stroke-width="1" opacity="0.4"/>
  <circle cx="40" cy="30" r="4" fill="#D97706" opacity="0.6"/>
  <path d="M10 40 C 20 30, 30 30, 40 40" fill="none" stroke="#B45309" stroke-width="1" opacity="0.3"/>
  <path d="M70 40 C 60 30, 50 30, 40 40" fill="none" stroke="#B45309" stroke-width="1" opacity="0.3"/>
</svg>`);

const BLUEPRINT_GRID_SVG = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
  <rect width="40" height="40" fill="#0369A1"/>
  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#38BDF8" stroke-width="1" opacity="0.35"/>
  <path d="M 20 0 L 20 40 M 0 20 L 40 20" fill="none" stroke="#7DD3FC" stroke-width="0.5" opacity="0.2"/>
</svg>`);

const MOROCCAN_TILE_SVG = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50">
  <rect width="50" height="50" fill="#0B132B"/>
  <path d="M25 0 Q25 25 0 25 Q25 25 25 50 Q25 25 50 25 Q25 25 25 0 Z" fill="none" stroke="#38BDF8" stroke-width="1.5" opacity="0.5"/>
  <circle cx="25" cy="25" r="5" fill="none" stroke="#818CF8" stroke-width="1" opacity="0.6"/>
</svg>`);

const CIRCUIT_TECH_SVG = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
  <rect width="60" height="60" fill="#09090B"/>
  <path d="M0 10 H20 V30 H40 V60" fill="none" stroke="#A855F7" stroke-width="1.5" opacity="0.5"/>
  <circle cx="20" cy="10" r="3" fill="#A855F7" opacity="0.8"/>
  <circle cx="40" cy="30" r="3" fill="#EC4899" opacity="0.8"/>
  <path d="M60 20 H40 V40 H10 V0" fill="none" stroke="#06B6D4" stroke-width="1.5" opacity="0.5"/>
  <circle cx="40" cy="20" r="3" fill="#06B6D4" opacity="0.8"/>
</svg>`);

// Catalog Items
export const PATTERNS_CATALOG: BackgroundPatternItem[] = [
  // 1. Islamic Arabesque Patterns
  {
    id: 'pat-islamic-star',
    name: 'Islamic Star Geometric',
    nameAr: 'نقش النجمة الإسلامية الذهبية',
    category: 'islamic',
    type: 'svg-pattern',
    thumbnail: ISLAMIC_STAR_SVG,
    sourceUrl: ISLAMIC_STAR_SVG,
    descriptionAr: 'نقش هندسي إسلامي بنجوم مزغرفة بلون ذهبي فخم'
  },
  {
    id: 'pat-moroccan-tile',
    name: 'Moroccan Tile Pattern',
    nameAr: 'نقش الزليج المغربي المودرن',
    category: 'islamic',
    type: 'svg-pattern',
    thumbnail: MOROCCAN_TILE_SVG,
    sourceUrl: MOROCCAN_TILE_SVG,
    descriptionAr: 'نقش زليج وبلاط مغربي عصري بخطوط متداخلة'
  },
  {
    id: 'pat-wallpaper-islamic-gold',
    name: 'Luxury Gold Mandala Wallpaper',
    nameAr: 'خلفية ماندالا إسلامية ذهبية فاخرة',
    category: 'islamic',
    type: 'wallpaper-image',
    thumbnail: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=500&auto=format&fit=crop&q=80',
    sourceUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1600&auto=format&fit=crop&q=80',
    descriptionAr: 'خلفية دقة عالية بزخارف هندسية إسلامية ذهبية داكنة'
  },

  // 2. Luxury & Gold Marble
  {
    id: 'pat-damask-vintage',
    name: 'Classic Gold Damask Ornament',
    nameAr: 'نقش كلاسيكي دمشقي فاخر',
    category: 'vintage',
    type: 'svg-pattern',
    thumbnail: DAMASK_VINTAGE_SVG,
    sourceUrl: DAMASK_VINTAGE_SVG,
    descriptionAr: 'نقش نباتي دمشقي كلاسيكي بشعارات ملكية'
  },
  {
    id: 'pat-wallpaper-black-gold-marble',
    name: 'Black Marble Gold Veins',
    nameAr: 'خلفية رخام أسود بعروق ذهبية',
    category: 'luxury',
    type: 'wallpaper-image',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80',
    sourceUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&auto=format&fit=crop&q=80',
    descriptionAr: 'خلفية رخامية فاخرة ممتلئة بالتفاصيل الراقية'
  },
  {
    id: 'pat-wallpaper-gold-silk',
    name: 'Dark Gold Silk Satin Waves',
    nameAr: 'خلفية حرير ومخمل ذهبي داكن',
    category: 'luxury',
    type: 'wallpaper-image',
    thumbnail: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=500&auto=format&fit=crop&q=80',
    sourceUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1600&auto=format&fit=crop&q=80',
    descriptionAr: 'ثنيات حرير وستان فخم بتدرجات ذهبية ناعمة'
  },

  // 3. Tech & Geometric
  {
    id: 'pat-hex-tech',
    name: 'Hexagon Tech Mesh',
    nameAr: 'شبكة خلايا النحل التكنولوجية',
    category: 'tech',
    type: 'svg-pattern',
    thumbnail: GEOMETRIC_HEX_SVG,
    sourceUrl: GEOMETRIC_HEX_SVG,
    descriptionAr: 'نقش مسدسات تكنولوجية مناسب للتطبيقات والألعاب'
  },
  {
    id: 'pat-circuit-tech',
    name: 'Cyberpunk Circuit Pattern',
    nameAr: 'نقش مسارات دوائر إلكترونية',
    category: 'tech',
    type: 'svg-pattern',
    thumbnail: CIRCUIT_TECH_SVG,
    sourceUrl: CIRCUIT_TECH_SVG,
    descriptionAr: 'نقش دوائر كهربائية مضيئة بألوان النيون'
  },
  {
    id: 'pat-wallpaper-neon-cyber',
    name: 'Cyberpunk 3D Geometry Wallpaper',
    nameAr: 'خلفية أشكال ثلاثية الأبعاد ونيون',
    category: 'tech',
    type: 'wallpaper-image',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80',
    sourceUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1600&auto=format&fit=crop&q=80',
    descriptionAr: 'خلفية أضواء نيون سايبر مع مجسمات متداخلة'
  },

  // 4. Clean Grids & Dots
  {
    id: 'pat-polka-dots',
    name: 'Subtle Polka Dots',
    nameAr: 'منقط هادئ بأسلوب المودرن',
    category: 'geometric',
    type: 'svg-pattern',
    thumbnail: POLKA_DOTS_SVG,
    sourceUrl: POLKA_DOTS_SVG,
    descriptionAr: 'نقش نقاط صغيرة ناعمة للخلفيات العصرية'
  },
  {
    id: 'pat-blueprint-grid',
    name: 'Blueprint Graphic Mesh',
    nameAr: 'شبكة مخططات جرافيك هندسية',
    category: 'geometric',
    type: 'svg-pattern',
    thumbnail: BLUEPRINT_GRID_SVG,
    sourceUrl: BLUEPRINT_GRID_SVG,
    descriptionAr: 'شبكة مربعات زرقاء بأسلوب المخططات المدرسية'
  },

  // 5. Vintage & Parchment Paper
  {
    id: 'pat-wallpaper-vintage-paper',
    name: 'Vintage Ornate Parchment Paper',
    nameAr: 'خلفية ورقية كلاسيكية مزغرفة',
    category: 'vintage',
    type: 'wallpaper-image',
    thumbnail: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=500&auto=format&fit=crop&q=80',
    sourceUrl: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=1600&auto=format&fit=crop&q=80',
    descriptionAr: 'ملمس ورق قديم مع حواف داكنة مثالية للشهادات والدعوات'
  },

  // 6. Abstract & Glitter
  {
    id: 'pat-wallpaper-bokeh-gold',
    name: 'Golden Bokeh Lights & Sparkles',
    nameAr: 'خلفية إضاءة بوكيه وجزيئات ذهبية',
    category: 'abstract',
    type: 'wallpaper-image',
    thumbnail: 'https://images.unsplash.com/photo-1519751138061-ce96946ae09f?w=500&auto=format&fit=crop&q=80',
    sourceUrl: 'https://images.unsplash.com/photo-1519751138061-ce96946ae09f?w=1600&auto=format&fit=crop&q=80',
    descriptionAr: 'نقاط ضوئية متلألئة بخلفية احتفالية فاخرة'
  },
  {
    id: 'pat-wallpaper-fluid-acrylic',
    name: 'Abstract Fluid Gold Paint',
    nameAr: 'خلفية ألوان مائية وسوائل ذهبية',
    category: 'abstract',
    type: 'wallpaper-image',
    thumbnail: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=500&auto=format&fit=crop&q=80',
    sourceUrl: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=1600&auto=format&fit=crop&q=80',
    descriptionAr: 'دمج فني بين التدرجات اللونية واللمسات الذهبية'
  }
];
