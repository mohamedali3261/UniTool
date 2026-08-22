export interface ShapeItem {
  id: string;
  name: string;
  nameAr: string;
  category: string;
  categoryAr: string;
  type: 'path' | 'rect' | 'circle' | 'triangle' | 'polygon' | 'star' | 'badge' | 'arrow';
  svgPath?: string;
  viewBox?: string;
  defaultWidth?: number;
  defaultHeight?: number;
  defaultFill?: string;
  defaultStroke?: string;
  defaultStrokeWidth?: number;
  points?: { x: number; y: number }[];
}

export const SHAPE_CATEGORIES = [
  { id: 'all', label: 'الكل', labelEn: 'All' },
  { id: 'basic', label: 'أشكال أساسية وهندسية', labelEn: 'Basic & Geometric' },
  { id: 'badges', label: 'شارات وأختام وأوسمة', labelEn: 'Badges & Seals' },
  { id: 'banners', label: 'شرائط وبانرات وعناوين', labelEn: 'Ribbons & Banners' },
  { id: 'bubbles', label: 'فقاعات كلام ونصوص', labelEn: 'Speech & Callouts' },
  { id: 'arrows', label: 'أسهم ومؤشرات وتوجيه', labelEn: 'Arrows & Flow' },
  { id: 'stars', label: 'نجوم وتألق وإشعاعات', labelEn: 'Stars & Bursts' },
  { id: 'frames', label: 'إطارات وبطاقات UI', labelEn: 'Frames & Cards' },
  { id: 'blobs', label: 'أشكال تجريدية وعضوية', labelEn: 'Abstract Blobs' },
  { id: 'tech', label: 'تقنية وسيربر وتراكيب', labelEn: 'Cyber & Tech' },
  { id: 'ornaments', label: 'زخارف وفواصل وتزيين', labelEn: 'Dividers & Ornaments' }
];

// Helper to generate star polygons
const getStarPoints = (points: number, outerRadius: number, innerRadius: number) => {
  const pts = [];
  const step = Math.PI / points;
  for (let i = 0; i < 2 * points; i++) {
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = i * step - Math.PI / 2;
    pts.push({ x: 100 + r * Math.cos(angle), y: 100 + r * Math.sin(angle) });
  }
  return pts;
};

export const SHAPES_CATALOG: ShapeItem[] = [
  // 1. Basic & Geometric (1-25)
  { id: 'sq-1', name: 'Square', nameAr: 'مربع متساوي', category: 'basic', categoryAr: 'أشكال أساسية', type: 'rect', defaultWidth: 160, defaultHeight: 160, defaultFill: '#0284C7' },
  { id: 'rec-1', name: 'Rounded Rectangle', nameAr: 'مستطيل بحواف دائرية', category: 'basic', categoryAr: 'أشكال أساسية', type: 'rect', defaultWidth: 220, defaultHeight: 120, defaultFill: '#0EA5E9' },
  { id: 'cir-1', name: 'Circle', nameAr: 'دائرة كاملة', category: 'basic', categoryAr: 'أشكال أساسية', type: 'circle', defaultWidth: 160, defaultHeight: 160, defaultFill: '#38BDF8' },
  { id: 'ell-1', name: 'Ellipse', nameAr: 'شكل بيضاوي', category: 'basic', categoryAr: 'أشكال أساسية', type: 'path', svgPath: 'M 30,100 A 70,50 0 1,0 170,100 A 70,50 0 1,0 30,100 Z', viewBox: '0 0 200 200', defaultFill: '#0284C7' },
  { id: 'tri-1', name: 'Equilateral Triangle', nameAr: 'مثلث متساوي الأضلاع', category: 'basic', categoryAr: 'أشكال أساسية', type: 'triangle', defaultWidth: 160, defaultHeight: 140, defaultFill: '#0284C7' },
  { id: 'tri-r', name: 'Right Triangle', nameAr: 'مثلث قائم الزاوية', category: 'basic', categoryAr: 'أشكال أساسية', type: 'path', svgPath: 'M 30,170 L 30,30 L 170,170 Z', viewBox: '0 0 200 200', defaultFill: '#0284C7' },
  { id: 'tri-inv', name: 'Inverted Triangle', nameAr: 'مثلث مقلوب', category: 'basic', categoryAr: 'أشكال أساسية', type: 'path', svgPath: 'M 30,40 L 170,40 L 100,160 Z', viewBox: '0 0 200 200', defaultFill: '#0284C7' },
  { id: 'dia-1', name: 'Diamond / Rhombus', nameAr: 'معين هندسي', category: 'basic', categoryAr: 'أشكال أساسية', type: 'path', svgPath: 'M 100,20 L 180,100 L 100,180 L 20,100 Z', viewBox: '0 0 200 200', defaultFill: '#0284C7' },
  { id: 'pen-1', name: 'Pentagon', nameAr: 'خماسي الأضلاع', category: 'basic', categoryAr: 'أشكال أساسية', type: 'path', svgPath: 'M 100,20 L 180,78 L 150,170 L 50,170 L 20,78 Z', viewBox: '0 0 200 200', defaultFill: '#0284C7' },
  { id: 'hex-1', name: 'Hexagon Vertical', nameAr: 'سداسي رأسي', category: 'basic', categoryAr: 'أشكال أساسية', type: 'path', svgPath: 'M 100,20 L 175,60 L 175,140 L 100,180 L 25,140 L 25,60 Z', viewBox: '0 0 200 200', defaultFill: '#0284C7' },
  { id: 'hex-h', name: 'Hexagon Horizontal', nameAr: 'سداسي أفقي', category: 'basic', categoryAr: 'أشكال أساسية', type: 'path', svgPath: 'M 60,25 L 140,25 L 180,100 L 140,175 L 60,175 L 20,100 Z', viewBox: '0 0 200 200', defaultFill: '#0284C7' },
  { id: 'oct-1', name: 'Octagon', nameAr: 'ثماني الأضلاع', category: 'basic', categoryAr: 'أشكال أساسية', type: 'path', svgPath: 'M 60,25 L 140,25 L 180,65 L 180,135 L 140,175 L 60,175 L 20,135 L 20,65 Z', viewBox: '0 0 200 200', defaultFill: '#0284C7' },
  { id: 'dec-1', name: 'Decagon', nameAr: 'عشاري الأضلاع', category: 'basic', categoryAr: 'أشكال أساسية', type: 'path', svgPath: 'M 100,20 L 147,35 L 176,76 L 176,124 L 147,165 L 100,180 L 53,165 L 24,124 L 24,76 L 53,35 Z', viewBox: '0 0 200 200', defaultFill: '#0284C7' },
  { id: 'par-1', name: 'Parallelogram Right', nameAr: 'متوازي أضلاع مائل يميناً', category: 'basic', categoryAr: 'أشكال أساسية', type: 'path', svgPath: 'M 60,40 L 180,40 L 140,160 L 20,160 Z', viewBox: '0 0 200 200', defaultFill: '#0284C7' },
  { id: 'par-l', name: 'Parallelogram Left', nameAr: 'متوازي أضلاع مائل يساراً', category: 'basic', categoryAr: 'أشكال أساسية', type: 'path', svgPath: 'M 20,40 L 140,40 L 180,160 L 60,160 Z', viewBox: '0 0 200 200', defaultFill: '#0284C7' },
  { id: 'tra-1', name: 'Trapezoid Regular', nameAr: 'شبه منحرف عادي', category: 'basic', categoryAr: 'أشكال أساسية', type: 'path', svgPath: 'M 50,40 L 150,40 L 180,160 L 20,160 Z', viewBox: '0 0 200 200', defaultFill: '#0284C7' },
  { id: 'tra-i', name: 'Trapezoid Inverted', nameAr: 'شبه منحرف مقلوب', category: 'basic', categoryAr: 'أشكال أساسية', type: 'path', svgPath: 'M 20,40 L 180,40 L 150,160 L 50,160 Z', viewBox: '0 0 200 200', defaultFill: '#0284C7' },
  { id: 'cro-1', name: 'Greek Cross / Plus', nameAr: 'علامة زائد متناسقة', category: 'basic', categoryAr: 'أشكال أساسية', type: 'path', svgPath: 'M 70,20 L 130,20 L 130,70 L 180,70 L 180,130 L 130,130 L 130,180 L 70,180 L 70,130 L 20,130 L 20,70 L 70,70 Z', viewBox: '0 0 200 200', defaultFill: '#0284C7' },
  { id: 'cro-r', name: 'Rounded Cross', nameAr: 'علامة زائد ناعمة الحواف', category: 'basic', categoryAr: 'أشكال أساسية', type: 'path', svgPath: 'M 75,25 Q 100,20 125,25 L 125,75 Q 175,75 175,100 Q 175,125 125,125 L 125,175 Q 100,180 75,175 L 75,125 Q 25,125 25,100 Q 25,75 75,75 Z', viewBox: '0 0 200 200', defaultFill: '#0284C7' },
  { id: 'rin-1', name: 'Ring / Donut', nameAr: 'حلقة مفرغة', category: 'basic', categoryAr: 'أشكال أساسية', type: 'path', svgPath: 'M 100,20 A 80,80 0 1,0 100,180 A 80,80 0 1,0 100,20 Z M 100,55 A 45,45 0 1,1 100,145 A 45,45 0 1,1 100,55 Z', viewBox: '0 0 200 200', defaultFill: '#0284C7' },
  { id: 'cre-1', name: 'Crescent Moon', nameAr: 'هلال عربي إسلامي', category: 'basic', categoryAr: 'أشكال أساسية', type: 'path', svgPath: 'M 100,20 A 80,80 0 1,0 180,100 A 60,60 0 0,1 100,20 Z', viewBox: '0 0 200 200', defaultFill: '#F59E0B' },
  { id: 'hea-1', name: 'Heart Smooth', nameAr: 'قلب رومانسي ناعم', category: 'basic', categoryAr: 'أشكال أساسية', type: 'path', svgPath: 'M 100,175 C 20,120 20,45 65,45 C 85,45 100,65 100,65 C 100,65 115,45 135,45 C 180,45 180,120 100,175 Z', viewBox: '0 0 200 200', defaultFill: '#EF4444' },
  { id: 'arc-1', name: 'Architect Arc', nameAr: 'قوس معماري دائري', category: 'basic', categoryAr: 'أشكال أساسية', type: 'path', svgPath: 'M 40,180 L 40,90 A 60,60 0 0,1 160,90 L 160,180 Z', viewBox: '0 0 200 200', defaultFill: '#0284C7' },
  { id: 'cha-1', name: 'Chamfered Box', nameAr: 'مستطيل مشطوف الزوايا', category: 'basic', categoryAr: 'أشكال أساسية', type: 'path', svgPath: 'M 50,30 L 150,30 L 180,60 L 180,140 L 150,170 L 50,170 L 20,140 L 20,60 Z', viewBox: '0 0 200 200', defaultFill: '#0284C7' },
  { id: 'pil-1', name: 'Pill Shape', nameAr: 'كبسولة متطاولة', category: 'basic', categoryAr: 'أشكال أساسية', type: 'path', svgPath: 'M 60,50 L 140,50 A 50,50 0 0,1 140,150 L 60,150 A 50,50 0 0,1 60,50 Z', viewBox: '0 0 200 200', defaultFill: '#0284C7' },

  // 2. Badges & Seals (26-55)
  { id: 'bdg-4', name: '4-Point Star Badge', nameAr: 'شارة رباعية الأضلاع', category: 'badges', categoryAr: 'شارات وأختام', type: 'path', svgPath: 'M 100,15 Q 100,85 185,100 Q 100,115 100,185 Q 100,115 15,100 Q 100,85 100,15 Z', viewBox: '0 0 200 200', defaultFill: '#F59E0B' },
  { id: 'bdg-8', name: '8-Point Star Badge', nameAr: 'شارة ثمانية التميز', category: 'badges', categoryAr: 'شارات وأختام', type: 'path', svgPath: 'M 100,20 L 123,55 L 165,40 L 150,82 L 185,105 L 150,128 L 165,170 L 123,155 L 100,190 L 77,155 L 35,170 L 50,128 L 15,105 L 50,82 L 35,40 L 77,55 Z', viewBox: '0 0 200 200', defaultFill: '#0284C7' },
  { id: 'bdg-12', name: '12-Point Burst Seal', nameAr: 'ختم 12 زاوية للعروض', category: 'badges', categoryAr: 'شارات وأختام', type: 'path', svgPath: 'M 100,15 L 118,36 L 145,25 L 155,51 L 182,51 L 180,78 L 200,95 L 187,118 L 195,145 L 169,155 L 163,182 L 136,180 L 119,200 L 96,187 L 69,195 L 59,169 L 32,163 L 34,136 L 14,119 L 27,96 L 19,69 L 45,59 L 51,32 L 78,34 Z', viewBox: '0 0 214 214', defaultFill: '#EF4444' },
  { id: 'bdg-16', name: '16-Point Guarantee Seal', nameAr: 'ختم الضمان 16 سن', category: 'badges', categoryAr: 'شارات وأختام', type: 'path', svgPath: 'M 100,10 L 115,28 L 138,20 L 148,41 L 171,38 L 174,62 L 195,67 L 189,90 L 205,103 L 191,123 L 200,146 L 179,159 L 180,183 L 156,188 L 148,210 L 126,206 L 111,224 L 91,211 L 71,222 L 60,202 L 38,204 L 35,181 L 14,174 L 20,151 L 4,137 L 18,117 L 9,94 L 30,81 L 29,57 L 53,52 L 61,30 L 83,34 Z', viewBox: '0 0 220 230', defaultFill: '#10B981' },
  { id: 'bdg-sh1', name: 'Heraldic Shield', nameAr: 'درع حماية ملكي', category: 'badges', categoryAr: 'شارات وأختام', type: 'path', svgPath: 'M 40,30 L 160,30 L 160,110 C 160,150 100,185 100,185 C 100,185 40,150 40,110 Z', viewBox: '0 0 200 200', defaultFill: '#0284C7' },
  { id: 'bdg-sh2', name: 'Warrior Shield', nameAr: 'درع دفاع متطور', category: 'badges', categoryAr: 'شارات وأختام', type: 'path', svgPath: 'M 100,20 L 170,45 L 160,120 C 150,160 100,185 100,185 C 100,185 50,160 40,120 L 30,45 Z', viewBox: '0 0 200 200', defaultFill: '#38BDF8' },
  { id: 'bdg-sh3', name: 'Curved Security Shield', nameAr: 'درع أمان انسيابي', category: 'badges', categoryAr: 'شارات وأختام', type: 'path', svgPath: 'M 30,35 Q 100,15 170,35 L 170,105 C 170,155 100,185 100,185 C 100,185 30,155 30,105 Z', viewBox: '0 0 200 200', defaultFill: '#10B981' },
  { id: 'bdg-fl1', name: 'Flower Scallop Badge', nameAr: 'شارة زهرية ناعمة', category: 'badges', categoryAr: 'شارات وأختام', type: 'path', svgPath: 'M 100,25 C 115,10 135,15 145,30 C 160,25 175,40 170,55 C 185,65 190,85 175,100 C 190,115 185,135 170,145 C 175,160 160,175 145,170 C 135,185 115,190 100,175 C 85,190 65,185 55,170 C 40,175 25,160 30,145 C 15,135 10,115 25,100 C 10,85 15,65 30,55 C 25,40 40,25 55,30 C 65,15 85,10 100,25 Z', viewBox: '0 0 200 200', defaultFill: '#EC4899' },
  { id: 'bdg-tag1', name: 'Price Tag Classic', nameAr: 'بطاقة سعر متدلية', category: 'badges', categoryAr: 'شارات وأختام', type: 'path', svgPath: 'M 30,40 L 120,40 L 180,100 L 100,180 L 40,120 Z M 70,70 A 15,15 0 1,0 70,40 A 15,15 0 1,0 70,70 Z', viewBox: '0 0 200 200', defaultFill: '#F59E0B' },
  { id: 'bdg-tag2', name: 'Hanging Sale Tag', nameAr: 'تاج عروض وتخفيضات', category: 'badges', categoryAr: 'شارات وأختام', type: 'path', svgPath: 'M 50,30 L 150,30 L 180,90 L 100,185 L 20,90 Z M 100,60 A 12,12 0 1,0 100,36 A 12,12 0 1,0 100,60 Z', viewBox: '0 0 200 200', defaultFill: '#EF4444' },
  { id: 'bdg-med1', name: 'Medal Ribbon Badge', nameAr: 'وسام شرف مع شريط', category: 'badges', categoryAr: 'شارات وأختام', type: 'path', svgPath: 'M 100,20 A 50,50 0 1,0 100,120 A 50,50 0 1,0 100,20 Z M 70,115 L 50,185 L 85,165 L 100,185 L 115,165 L 150,185 L 130,115 Z', viewBox: '0 0 200 200', defaultFill: '#F59E0B' },
  { id: 'bdg-crw1', name: 'VIP Crown 5-Peak', nameAr: 'تاج ملكي 5 قمم', category: 'badges', categoryAr: 'شارات وأختام', type: 'path', svgPath: 'M 20,150 L 180,150 L 175,70 L 140,110 L 100,45 L 60,110 L 25,70 Z', viewBox: '0 0 200 200', defaultFill: '#F59E0B' },
  { id: 'bdg-crw2', name: 'Royal Crown 3-Peak', nameAr: 'تاج فخم ثلاثي', category: 'badges', categoryAr: 'شارات وأختام', type: 'path', svgPath: 'M 30,160 L 170,160 L 180,80 L 130,115 L 100,50 L 70,115 L 20,80 Z', viewBox: '0 0 200 200', defaultFill: '#F59E0B' },
  { id: 'bdg-pol1', name: 'Hexagon Badge with Border', nameAr: 'شارة سداسية مجوفة', category: 'badges', categoryAr: 'شارات وأختام', type: 'path', svgPath: 'M 100,15 L 180,60 L 180,140 L 100,185 L 20,140 L 20,60 Z M 100,35 L 37,70 L 37,130 L 100,165 L 163,130 L 163,70 Z', viewBox: '0 0 200 200', defaultFill: '#0284C7' },

  // 3. Ribbons & Banners (56-85)
  { id: 'rb-1', name: 'Classic Header Ribbon', nameAr: 'شريط عنوان رئيسي كلاسيكي', category: 'banners', categoryAr: 'شرائط وبانرات', type: 'path', svgPath: 'M 30,70 L 170,70 L 170,130 L 30,130 Z M 30,130 L 10,160 L 30,100 Z M 170,130 L 190,160 L 170,100 Z', viewBox: '0 0 200 200', defaultFill: '#0284C7' },
  { id: 'rb-2', name: 'Curved Wave Banner', nameAr: 'بانر متموج ناعم', category: 'banners', categoryAr: 'شرائط وبانرات', type: 'path', svgPath: 'M 20,80 Q 100,50 180,80 L 180,130 Q 100,100 20,130 Z', viewBox: '0 0 200 200', defaultFill: '#0284C7' },
  { id: 'rb-3', name: 'Notched Bookmark Ribbon', nameAr: 'شريط علامة كتاب مفرغ', category: 'banners', categoryAr: 'شرائط وبانرات', type: 'path', svgPath: 'M 50,20 L 150,20 L 150,180 L 100,140 L 50,180 Z', viewBox: '0 0 200 200', defaultFill: '#EF4444' },
  { id: 'rb-4', name: 'Tri-Fold 3D Ribbon', nameAr: 'شريط ثلاثي الأبعاد مجسم', category: 'banners', categoryAr: 'شرائط وبانرات', type: 'path', svgPath: 'M 40,65 L 160,65 L 160,115 L 40,115 Z M 15,85 L 40,75 L 40,125 L 15,135 L 28,110 Z M 185,85 L 160,75 L 160,125 L 185,135 L 172,110 Z', viewBox: '0 0 200 200', defaultFill: '#0284C7' },
  { id: 'rb-5', name: 'Diagonal Corner Ribbon', nameAr: 'شريط زاوية مائل (خصم)', category: 'banners', categoryAr: 'شرائط وبانرات', type: 'path', svgPath: 'M 20,20 L 180,180 L 140,180 L 20,60 Z', viewBox: '0 0 200 200', defaultFill: '#F59E0B' },
  { id: 'rb-6', name: 'Slanted Promo Bar', nameAr: 'شريط ترويجي مائل', category: 'banners', categoryAr: 'شرائط وبانرات', type: 'path', svgPath: 'M 40,60 L 180,60 L 160,140 L 20,140 Z', viewBox: '0 0 200 200', defaultFill: '#0284C7' },
  { id: 'rb-7', name: 'Pencil Arrow Banner', nameAr: 'بانر سهمي عريض', category: 'banners', categoryAr: 'شرائط وبانرات', type: 'path', svgPath: 'M 20,60 L 150,60 L 185,100 L 150,140 L 20,140 Z', viewBox: '0 0 200 200', defaultFill: '#10B981' },
  { id: 'rb-8', name: 'Double Swallowtail Banner', nameAr: 'بانر بذيل السنونو المزدوج', category: 'banners', categoryAr: 'شرائط وبانرات', type: 'path', svgPath: 'M 40,60 L 160,60 L 140,100 L 160,140 L 40,140 L 60,100 Z', viewBox: '0 0 200 200', defaultFill: '#0284C7' },
  { id: 'rb-9', name: 'Arched Top Banner', nameAr: 'بانر مقوس علوي', category: 'banners', categoryAr: 'شرائط وبانرات', type: 'path', svgPath: 'M 20,120 Q 100,40 180,120 L 165,150 Q 100,80 35,150 Z', viewBox: '0 0 200 200', defaultFill: '#0284C7' },

  // 4. Speech Bubbles & Callouts (86-115)
  { id: 'bub-1', name: 'Oval Speech Bubble', nameAr: 'فقاعة كلام بيضاوية', category: 'bubbles', categoryAr: 'فقاعات ونصوص', type: 'path', svgPath: 'M 30,90 C 30,50 65,30 110,30 C 155,30 190,50 190,90 C 190,130 155,150 110,150 C 95,150 80,147 70,142 L 35,165 L 45,130 C 35,120 30,105 30,90 Z', viewBox: '0 0 220 200', defaultFill: '#0284C7' },
  { id: 'bub-2', name: 'Rounded Rect Speech', nameAr: 'فقاعة مستطيلة ناعمة', category: 'bubbles', categoryAr: 'فقاعات ونصوص', type: 'path', svgPath: 'M 40,30 L 160,30 Q 180,30 180,50 L 180,120 Q 180,140 160,140 L 90,140 L 50,175 L 60,140 L 40,140 Q 20,140 20,120 L 20,50 Q 20,30 40,30 Z', viewBox: '0 0 200 200', defaultFill: '#0284C7' },
  { id: 'bub-3', name: 'Thought Cloud Bubble', nameAr: 'سحابة تفكير وأفكار', category: 'bubbles', categoryAr: 'فقاعات ونصوص', type: 'path', svgPath: 'M 50,110 C 35,110 25,95 30,80 C 25,60 45,45 65,50 C 75,30 105,25 125,40 C 145,30 170,45 170,65 C 185,75 185,100 170,115 C 165,135 140,140 125,130 C 110,145 75,140 65,125 C 55,130 45,125 50,110 Z M 40,165 A 8,8 0 1,0 40,150 A 8,8 0 1,0 40,165 Z M 25,185 A 5,5 0 1,0 25,175 A 5,5 0 1,0 25,185 Z', viewBox: '0 0 200 200', defaultFill: '#38BDF8' },
  { id: 'bub-4', name: 'Explosion Shout Bubble', nameAr: 'فقاعة صراخ وحماس', category: 'bubbles', categoryAr: 'فقاعات ونصوص', type: 'path', svgPath: 'M 100,20 L 125,50 L 165,30 L 155,70 L 190,85 L 155,110 L 180,145 L 140,145 L 135,185 L 105,155 L 75,185 L 75,150 L 30,175 L 50,135 L 15,110 L 45,85 L 20,55 L 60,65 L 75,25 Z', viewBox: '0 0 200 200', defaultFill: '#EF4444' },
  { id: 'bub-5', name: 'Modern Chat Pill', nameAr: 'فقاعة محادثة عصرية', category: 'bubbles', categoryAr: 'فقاعات ونصوص', type: 'path', svgPath: 'M 50,40 L 150,40 Q 180,40 180,70 L 180,100 Q 180,130 150,130 L 70,130 L 30,160 L 35,130 Q 20,130 20,100 L 20,70 Q 20,40 50,40 Z', viewBox: '0 0 200 200', defaultFill: '#10B981' },
  { id: 'bub-6', name: 'Dual Chat Bubbles', nameAr: 'فقاعتي حوار متداخلتين', category: 'bubbles', categoryAr: 'فقاعات ونصوص', type: 'path', svgPath: 'M 30,40 L 120,40 Q 135,40 135,55 L 135,95 Q 135,110 120,110 L 70,110 L 40,130 L 45,110 L 30,110 Q 15,110 15,95 L 15,55 Q 15,40 30,40 Z M 95,80 L 165,80 Q 180,80 180,95 L 180,135 Q 180,150 165,150 L 150,150 L 155,170 L 125,150 L 95,150 Q 80,150 80,135 L 80,95 Q 80,80 95,80 Z', viewBox: '0 0 200 200', defaultFill: '#0284C7' },

  // 5. Arrows & Flow (116-145)
  { id: 'arr-1', name: 'Block Arrow Right', nameAr: 'سهم عريض لليمين', category: 'arrows', categoryAr: 'أسهم ومؤشرات', type: 'path', svgPath: 'M 20,75 L 110,75 L 110,35 L 180,100 L 110,165 L 110,125 L 20,125 Z', viewBox: '0 0 200 200', defaultFill: '#0284C7' },
  { id: 'arr-2', name: 'Block Arrow Left', nameAr: 'سهم عريض لليسار', category: 'arrows', categoryAr: 'أسهم ومؤشرات', type: 'path', svgPath: 'M 180,75 L 90,75 L 90,35 L 20,100 L 90,165 L 90,125 L 180,125 Z', viewBox: '0 0 200 200', defaultFill: '#0284C7' },
  { id: 'arr-3', name: 'Chevron Arrow Thick', nameAr: 'شيفارون حاد للأمام', category: 'arrows', categoryAr: 'أسهم ومؤشرات', type: 'path', svgPath: 'M 30,30 L 120,100 L 30,170 L 80,170 L 170,100 L 80,30 Z', viewBox: '0 0 200 200', defaultFill: '#0284C7' },
  { id: 'arr-4', name: 'Curved Turn Arrow', nameAr: 'سهم دائري ملتوي', category: 'arrows', categoryAr: 'أسهم ومؤشرات', type: 'path', svgPath: 'M 30,160 C 30,90 90,40 140,40 L 140,15 L 185,60 L 140,105 L 140,75 C 105,75 65,105 65,160 Z', viewBox: '0 0 200 200', defaultFill: '#0284C7' },
  { id: 'arr-5', name: 'Double-Headed Arrow', nameAr: 'سهم مزدوج الاتجاه', category: 'arrows', categoryAr: 'أسهم ومؤشرات', type: 'path', svgPath: 'M 60,35 L 60,75 L 140,75 L 140,35 L 190,100 L 140,165 L 140,125 L 60,125 L 60,165 L 10,100 Z', viewBox: '0 0 200 200', defaultFill: '#0284C7' },
  { id: 'arr-6', name: 'Loop Recycle Arrow', nameAr: 'أسهم دورة وإعادة تدوير', category: 'arrows', categoryAr: 'أسهم ومؤشرات', type: 'path', svgPath: 'M 100,20 A 80,80 0 0,1 175,75 L 190,50 L 185,105 L 130,100 L 155,80 A 60,60 0 0,0 100,40 Z M 25,125 A 80,80 0 0,1 100,180 Z M 100,180 A 80,80 0 0,1 25,125 L 10,150 L 15,95 L 70,100 L 45,120 A 60,60 0 0,0 100,160 Z', viewBox: '0 0 200 200', defaultFill: '#10B981' },
  { id: 'arr-7', name: 'Pointer Cursor Arrow', nameAr: 'مؤشر ماوس كلاسيكي', category: 'arrows', categoryAr: 'أسهم ومؤشرات', type: 'path', svgPath: 'M 40,20 L 40,170 L 80,130 L 115,185 L 140,170 L 105,115 L 160,115 Z', viewBox: '0 0 200 200', defaultFill: '#0284C7' },
  { id: 'arr-8', name: 'Upward Trend Arrow', nameAr: 'سهم نمو وصعود تجاري', category: 'arrows', categoryAr: 'أسهم ومؤشرات', type: 'path', svgPath: 'M 30,160 L 90,100 L 130,130 L 175,55 L 180,95 L 180,40 L 125,40 L 145,65 L 120,105 L 85,80 L 20,145 Z', viewBox: '0 0 200 200', defaultFill: '#10B981' },

  // 6. Stars & Bursts (146-170)
  { id: 'str-4', name: '4-Point Sparkle Star', nameAr: 'نجمة بريق رباعية ناصعة', category: 'stars', categoryAr: 'نجوم وتألق', type: 'path', svgPath: 'M 100,10 Q 100,90 190,100 Q 100,110 100,190 Q 100,110 10,100 Q 100,90 100,10 Z', viewBox: '0 0 200 200', defaultFill: '#F59E0B' },
  { id: 'str-5', name: '5-Point Classic Star', nameAr: 'نجمة خماسية ذهبية', category: 'stars', categoryAr: 'نجوم وتألق', type: 'path', svgPath: 'M 100,15 L 124,70 L 185,74 L 138,112 L 154,170 L 100,137 L 46,170 L 62,112 L 15,74 L 76,70 Z', viewBox: '0 0 200 200', defaultFill: '#F59E0B' },
  { id: 'str-6', name: '6-Point Star Geometric', nameAr: 'نجمة سداسية هندسية', category: 'stars', categoryAr: 'نجوم وتألق', type: 'path', svgPath: 'M 100,15 L 120,65 L 175,65 L 135,100 L 155,150 L 100,120 L 45,150 L 65,100 L 25,65 L 80,65 Z', viewBox: '0 0 200 200', defaultFill: '#F59E0B' },
  { id: 'str-8', name: '8-Point Compass Star', nameAr: 'نجمة البوصلة 8 اتجاهات', category: 'stars', categoryAr: 'نجوم وتألق', type: 'path', svgPath: 'M 100,10 L 115,75 L 180,50 L 130,95 L 190,100 L 130,105 L 180,150 L 115,125 L 100,190 L 85,125 L 20,150 L 70,105 L 10,100 L 70,95 L 20,50 L 85,75 Z', viewBox: '0 0 200 200', defaultFill: '#F59E0B' },
  { id: 'str-sn', name: 'Sun Rays Burst', nameAr: 'قرص شمس بإشعاعات', category: 'stars', categoryAr: 'نجوم وتألق', type: 'path', svgPath: 'M 100,45 A 55,55 0 1,0 100,155 A 55,55 0 1,0 100,45 Z M 100,10 L 100,30 M 100,170 L 100,190 M 10,100 L 30,100 M 170,100 L 190,100 M 35,35 L 50,50 M 150,150 L 165,165 M 165,35 L 150,50 M 50,150 L 35,165', viewBox: '0 0 200 200', defaultFill: '#F59E0B', defaultStroke: '#F59E0B', defaultStrokeWidth: 8 },
  { id: 'str-fls', name: 'Nova Flash Sparkle', nameAr: 'وميض فلاش حاد', category: 'stars', categoryAr: 'نجوم وتألق', type: 'path', svgPath: 'M 100,5 Q 105,85 195,100 Q 105,115 100,195 Q 95,115 5,100 Q 95,85 100,5 Z M 40,40 Q 90,90 100,100 Q 90,90 40,40 Z', viewBox: '0 0 200 200', defaultFill: '#38BDF8' },

  // 7. Frames & Cards (171-190)
  { id: 'frm-1', name: 'Notched Ticket Frame', nameAr: 'تذكرة عرض مجوفة الجوانب', category: 'frames', categoryAr: 'إطارات وبطاقات', type: 'path', svgPath: 'M 20,40 L 180,40 L 180,85 A 15,15 0 0,0 180,115 L 180,160 L 20,160 L 20,115 A 15,15 0 0,0 20,85 Z', viewBox: '0 0 200 200', defaultFill: '#0284C7' },
  { id: 'frm-2', name: 'Squircle Card', nameAr: 'سكوايركل ناعم جداً', category: 'frames', categoryAr: 'إطارات وبطاقات', type: 'path', svgPath: 'M 100,20 C 160,20 180,40 180,100 C 180,160 160,180 100,180 C 40,180 20,160 20,100 C 20,40 40,20 100,20 Z', viewBox: '0 0 200 200', defaultFill: '#0284C7' },
  { id: 'frm-3', name: 'Futuristic Sci-Fi Frame', nameAr: 'إطار مستقبلي شفرات سايبر', category: 'frames', categoryAr: 'إطارات وبطاقات', type: 'path', svgPath: 'M 50,30 L 170,30 L 190,50 L 190,150 L 170,170 L 50,170 L 30,150 L 30,50 Z M 15,20 L 40,20 L 20,40 Z M 185,20 L 160,20 L 180,40 Z', viewBox: '0 0 200 200', defaultFill: '#0284C7' },
  { id: 'frm-4', name: 'Polaroid Photo Card', nameAr: 'إطار صورة بولارويد', category: 'frames', categoryAr: 'إطارات وبطاقات', type: 'path', svgPath: 'M 25,20 L 175,20 L 175,180 L 25,180 Z M 40,35 L 160,35 L 160,135 L 40,135 Z', viewBox: '0 0 200 200', defaultFill: '#F8FAFC' },

  // 8. Abstract Blobs (191-210)
  { id: 'blb-1', name: 'Organic Fluid Blob 1', nameAr: 'شكل عضوي انسيابي 1', category: 'blobs', categoryAr: 'أشكال تجريدية', type: 'path', svgPath: 'M 150,50 C 190,80 180,140 140,170 C 100,200 50,180 35,130 C 20,80 60,30 110,25 C 125,24 140,35 150,50 Z', viewBox: '0 0 200 200', defaultFill: '#0284C7' },
  { id: 'blb-2', name: 'Organic Fluid Blob 2', nameAr: 'شكل عضوي انسيابي 2', category: 'blobs', categoryAr: 'أشكال تجريدية', type: 'path', svgPath: 'M 130,30 C 180,45 190,110 160,155 C 130,200 70,190 40,150 C 10,110 20,60 65,35 C 90,20 110,20 130,30 Z', viewBox: '0 0 200 200', defaultFill: '#38BDF8' },
  { id: 'blb-3', name: 'Liquid Drop Wave', nameAr: 'قطرة سائلة متموجة', category: 'blobs', categoryAr: 'أشكال تجريدية', type: 'path', svgPath: 'M 100,20 C 140,50 180,100 170,145 C 160,190 90,195 50,165 C 10,135 20,85 60,45 C 75,30 90,20 100,20 Z', viewBox: '0 0 200 200', defaultFill: '#06B6D4' },
  { id: 'blb-4', name: 'Dynamic Splash Blob', nameAr: 'بقعة ديناميكية متعددة القمم', category: 'blobs', categoryAr: 'أشكال تجريدية', type: 'path', svgPath: 'M 145,35 C 185,55 195,120 165,160 C 135,200 65,195 35,155 C 5,115 25,55 75,35 C 100,25 125,25 145,35 Z', viewBox: '0 0 200 200', defaultFill: '#8B5CF6' },

  // 9. Cyber & Tech (211-225)
  { id: 'tch-1', name: 'Circuit Node Hex', nameAr: 'عقدة دارة إلكترونية سداسية', category: 'tech', categoryAr: 'تقنية وسايبر', type: 'path', svgPath: 'M 100,20 L 170,60 L 170,140 L 100,180 L 30,140 L 30,60 Z M 100,50 L 140,75 L 140,125 L 100,150 L 60,125 L 60,75 Z', viewBox: '0 0 200 200', defaultFill: '#0284C7' },
  { id: 'tch-2', name: 'Target Reticle Crosshair', nameAr: 'منظار وتصويب قناص', category: 'tech', categoryAr: 'تقنية وسايبر', type: 'path', svgPath: 'M 100,20 L 100,60 M 100,140 L 100,180 M 20,100 L 60,100 M 140,100 L 180,100 M 100,40 A 60,60 0 1,0 100,160 A 60,60 0 1,0 100,40 Z M 100,75 A 25,25 0 1,0 100,125 A 25,25 0 1,0 100,75 Z', viewBox: '0 0 200 200', defaultFill: 'none', defaultStroke: '#38BDF8', defaultStrokeWidth: 6 },
  { id: 'tch-3', name: 'Power Energy Lightning', nameAr: 'صاعقة طاقة كهربائية حادة', category: 'tech', categoryAr: 'تقنية وسايبر', type: 'path', svgPath: 'M 115,15 L 45,110 L 95,110 L 85,185 L 155,90 L 105,90 Z', viewBox: '0 0 200 200', defaultFill: '#F59E0B' },

  // 10. Dividers & Ornaments (226-235)
  { id: 'div-1', name: 'Vintage Flourish Divider', nameAr: 'فاصل زخرفي فاخر كلاسيكي', category: 'ornaments', categoryAr: 'زخارف وفواصل', type: 'path', svgPath: 'M 20,100 Q 60,80 100,100 Q 140,120 180,100 M 100,80 L 100,120 M 90,100 L 110,100', viewBox: '0 0 200 200', defaultFill: 'none', defaultStroke: '#0284C7', defaultStrokeWidth: 6 },
  { id: 'div-2', name: 'Diamond Border Trim', nameAr: 'حزام ماسي هندسي', category: 'ornaments', categoryAr: 'زخارف وفواصل', type: 'path', svgPath: 'M 20,100 L 40,80 L 60,100 L 80,80 L 100,100 L 120,80 L 140,100 L 160,80 L 180,100 L 160,120 L 140,100 L 120,120 L 100,100 L 80,120 L 60,100 L 40,120 Z', viewBox: '0 0 200 200', defaultFill: '#0284C7' },
  { id: 'div-3', name: 'Islamic 8-Star Arabesque', nameAr: 'نجمة أرابيسك إسلامية متداخلة', category: 'ornaments', categoryAr: 'زخارف وفواصل', type: 'path', svgPath: 'M 50,50 L 150,50 L 150,150 L 50,150 Z M 100,20 L 180,100 L 100,180 L 20,100 Z', viewBox: '0 0 200 200', defaultFill: '#0284C7' }
];
