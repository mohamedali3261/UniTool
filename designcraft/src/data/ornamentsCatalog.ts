export interface OrnamentItem {
  id: string;
  name: string;
  nameAr: string;
  category: 'frames' | 'corners' | 'dividers' | 'mandalas' | 'islamic' | 'calligraphy';
  categoryAr: string;
  svgPath: string;
  viewBox?: string;
  defaultWidth?: number;
  defaultHeight?: number;
  defaultFill?: string;
  defaultStroke?: string;
  defaultStrokeWidth?: number;
}

export const ORNAMENT_CATEGORIES = [
  { id: 'all', label: 'الكل', labelEn: 'All' },
  { id: 'frames', label: 'إطارات وقبالات إسلامية', labelEn: 'Islamic Frames & Arches' },
  { id: 'corners', label: 'زوايا فاخرة وتزينات', labelEn: 'Luxury Ornate Corners' },
  { id: 'dividers', label: 'فواصل ونهايات نصوص', labelEn: 'Text Dividers & Flourishes' },
  { id: 'mandalas', label: 'أرابيسك وروزيت مانداﻻ', labelEn: 'Arabesque & Rosettes' },
  { id: 'islamic', label: 'أهلة وفوانيس ومساجد', labelEn: 'Crescents, Lanterns & Domes' },
  { id: 'calligraphy', label: 'مخطوطات وأختام وتيجان', labelEn: 'Calligraphic Seals & Badges' }
];

export const ORNAMENTS_CATALOG: OrnamentItem[] = [
  // 1. ISLAMIC FRAMES & ARCHES (إطارات وقبالات إسلامية) (1-10)
  {
    id: 'orn-frm-1',
    name: 'Islamic Horseshoe Arch Frame',
    nameAr: 'قوس حدوة الحصان الأندلسي',
    category: 'frames',
    categoryAr: 'إطارات وقبالات إسلامية',
    svgPath: 'M 30,190 L 30,90 C 30,30 170,30 170,90 L 170,190 Z M 45,180 L 155,180 L 155,95 C 155,45 45,45 45,95 Z',
    viewBox: '0 0 200 200',
    defaultFill: '#F59E0B'
  },
  {
    id: 'orn-frm-2',
    name: 'Ogee Arch Mihrab Frame',
    nameAr: 'إطار المحراب الشرقي المقوس',
    category: 'frames',
    categoryAr: 'إطارات وقبالات إسلامية',
    svgPath: 'M 20,190 L 20,100 C 20,70 50,60 100,20 C 150,60 180,70 180,100 L 180,190 Z M 35,180 L 165,180 L 165,105 C 165,80 140,70 100,35 C 60,70 35,80 35,105 Z',
    viewBox: '0 0 200 200',
    defaultFill: '#EAB308'
  },
  {
    id: 'orn-frm-3',
    name: 'Multi-Foil Islamic Arch',
    nameAr: 'قوس إسلامي متعدد الفصوص',
    category: 'frames',
    categoryAr: 'إطارات وقبالات إسلامية',
    svgPath: 'M 25,190 L 25,100 Q 25,75 50,75 Q 75,75 75,50 Q 100,25 100,20 Q 100,25 125,50 Q 125,75 150,75 Q 175,75 175,100 L 175,190 Z',
    viewBox: '0 0 200 200',
    defaultFill: '#38BDF8'
  },
  {
    id: 'orn-frm-4',
    name: 'Scalloped Royal Card Frame',
    nameAr: 'إطار مموج بأطراف مسننة',
    category: 'frames',
    categoryAr: 'إطارات وقبالات إسلامية',
    svgPath: 'M 20,20 Q 50,10 100,20 Q 150,10 180,20 Q 190,50 180,100 Q 190,150 180,180 Q 150,190 100,180 Q 50,190 20,180 Q 10,150 20,100 Q 10,50 20,20 Z M 35,35 Q 50,28 100,35 Q 150,28 165,35 Q 172,50 165,100 Q 172,150 165,165 Q 150,172 100,165 Q 50,172 35,165 Q 28,150 35,100 Q 28,50 35,35 Z',
    viewBox: '0 0 200 200',
    defaultFill: '#0284C7'
  },
  {
    id: 'orn-frm-5',
    name: 'Octagonal Geometrical Star Frame',
    nameAr: 'إطار ثماني هندسي فاخر',
    category: 'frames',
    categoryAr: 'إطارات وقبالات إسلامية',
    svgPath: 'M 60,15 L 140,15 L 185,60 L 185,140 L 140,185 L 60,185 L 15,140 L 15,60 Z M 68,28 L 28,68 L 28,132 L 68,172 L 132,172 L 172,132 L 172,68 L 132,28 Z',
    viewBox: '0 0 200 200',
    defaultFill: '#F59E0B'
  },
  {
    id: 'orn-frm-6',
    name: 'Double Filigree Border Frame',
    nameAr: 'إطار خطوط زخرفية مزدوجة',
    category: 'frames',
    categoryAr: 'إطارات وقبالات إسلامية',
    svgPath: 'M 15,15 L 185,15 L 185,185 L 15,185 Z M 25,25 L 25,175 L 175,175 L 175,25 Z M 35,35 L 165,35 L 165,165 L 35,165 Z M 40,40 L 40,160 L 160,160 L 160,40 Z',
    viewBox: '0 0 200 200',
    defaultFill: '#10B981'
  },
  {
    id: 'orn-frm-7',
    name: 'Notched Islamic Card Arch',
    nameAr: 'إطار بطاقة مجوفة الزوايا',
    category: 'frames',
    categoryAr: 'إطارات وقبالات إسلامية',
    svgPath: 'M 40,15 L 160,15 Q 185,15 185,40 L 185,160 Q 185,185 160,185 L 40,185 Q 15,185 15,160 L 15,40 Q 15,15 40,15 Z M 30,30 L 30,170 L 170,170 L 170,30 Z',
    viewBox: '0 0 200 200',
    defaultFill: '#EC4899'
  },
  {
    id: 'orn-frm-8',
    name: 'Ottoman Crowned Dome Frame',
    nameAr: 'إطار قبة عثمانية مزخرفة',
    category: 'frames',
    categoryAr: 'إطارات وقبالات إسلامية',
    svgPath: 'M 100,10 L 110,35 Q 160,50 180,100 L 180,190 L 20,190 L 20,100 Q 40,50 90,35 Z M 100,30 Q 50,60 35,105 L 35,175 L 165,175 L 165,105 Q 150,60 100,30 Z',
    viewBox: '0 0 200 200',
    defaultFill: '#F59E0B'
  },
  {
    id: 'orn-frm-9',
    name: 'Floral Cartouche Vignette Frame',
    nameAr: 'إطار فينييت نباتي كلاسيكي',
    category: 'frames',
    categoryAr: 'إطارات وقبالات إسلامية',
    svgPath: 'M 50,20 C 100,5 100,5 150,20 C 195,50 195,150 150,180 C 100,195 100,195 50,180 C 5,150 5,50 50,20 Z M 60,35 C 15,60 15,140 60,165 C 100,180 100,180 140,165 C 185,140 185,60 140,35 C 100,20 100,20 60,35 Z',
    viewBox: '0 0 200 200',
    defaultFill: '#38BDF8'
  },
  {
    id: 'orn-frm-10',
    name: 'Diamond Arabesque Mesh Frame',
    nameAr: 'إطار المعين الشبكي الأرابيسك',
    category: 'frames',
    categoryAr: 'إطارات وقبالات إسلامية',
    svgPath: 'M 100,10 L 190,100 L 100,190 L 10,100 Z M 100,30 L 30,100 L 100,170 L 170,100 Z',
    viewBox: '0 0 200 200',
    defaultFill: '#8B5CF6'
  },

  // 2. LUXURY ORNATE CORNERS (زوايا فاخرة وتزينات) (11-20)
  {
    id: 'orn-crn-1',
    name: 'Classic Vintage Corner Top-Left',
    nameAr: 'زاوية كلاسيكية فاخرة (أعلى اليسار)',
    category: 'corners',
    categoryAr: 'زوايا فاخرة وتزينات',
    svgPath: 'M 10,10 L 100,10 C 80,25 60,25 45,45 C 25,60 25,80 10,100 Z M 20,20 L 20,70 C 30,55 45,45 70,20 Z',
    viewBox: '0 0 200 200',
    defaultFill: '#F59E0B'
  },
  {
    id: 'orn-crn-2',
    name: 'Filigree Scrollwork Corner',
    nameAr: 'زاوية لولبية مذهبة',
    category: 'corners',
    categoryAr: 'زوايا فاخرة وتزينات',
    svgPath: 'M 10,10 L 120,10 Q 90,30 60,60 Q 30,90 10,120 Z M 25,25 Q 60,35 75,75 Q 35,60 25,25 Z',
    viewBox: '0 0 200 200',
    defaultFill: '#EAB308'
  },
  {
    id: 'orn-crn-3',
    name: 'Arabesque Leaf Corner',
    nameAr: 'زاوية أوراق الأرابيسك المتداخلة',
    category: 'corners',
    categoryAr: 'زوايا فاخرة وتزينات',
    svgPath: 'M 15,15 L 110,15 C 85,40 85,40 50,50 C 40,85 40,85 15,110 Z M 30,30 L 70,30 C 55,45 45,55 30,70 Z',
    viewBox: '0 0 200 200',
    defaultFill: '#38BDF8'
  },
  {
    id: 'orn-crn-4',
    name: 'Geometrical Chevron Corner',
    nameAr: 'زاوية هندسية حادة',
    category: 'corners',
    categoryAr: 'زوايا فاخرة وتزينات',
    svgPath: 'M 10,10 L 100,10 L 70,40 L 40,40 L 40,70 L 10,100 Z M 20,20 L 20,55 L 35,40 L 55,20 Z',
    viewBox: '0 0 200 200',
    defaultFill: '#0284C7'
  },
  {
    id: 'orn-crn-5',
    name: 'Royal Crown Corner Accent',
    nameAr: 'تاج الزاوية الملكي',
    category: 'corners',
    categoryAr: 'زوايا فاخرة وتزينات',
    svgPath: 'M 10,10 L 90,10 L 70,30 L 50,20 L 30,50 L 10,90 Z M 20,20 L 30,35 L 35,30 L 20,20 Z',
    viewBox: '0 0 200 200',
    defaultFill: '#F59E0B'
  },
  {
    id: 'orn-crn-6',
    name: 'Symmetric Flourish Corner Pair',
    nameAr: 'زوج زخرفي متناظر للزوايا',
    category: 'corners',
    categoryAr: 'زوايا فاخرة وتزينات',
    svgPath: 'M 15,15 L 130,15 C 100,35 60,35 35,60 C 35,100 15,130 15,130 Z M 30,30 C 60,30 80,40 40,80 C 40,80 30,60 30,30 Z',
    viewBox: '0 0 200 200',
    defaultFill: '#10B981'
  },
  {
    id: 'orn-crn-7',
    name: 'Baroque Vine Scroll Corner',
    nameAr: 'زاوية أغصان الباروك الكلاسيكية',
    category: 'corners',
    categoryAr: 'زوايا فاخرة وتزينات',
    svgPath: 'M 10,10 L 100,10 Q 70,45 45,70 Q 10,100 10,10 Z M 25,25 Q 50,40 35,65 Z',
    viewBox: '0 0 200 200',
    defaultFill: '#EC4899'
  },
  {
    id: 'orn-crn-8',
    name: 'Islamic Star Segment Corner',
    nameAr: 'قطاع النجمة الإسلامية للزوايا',
    category: 'corners',
    categoryAr: 'زوايا فاخرة وتزينات',
    svgPath: 'M 10,10 L 110,10 L 80,40 L 40,80 L 10,110 Z M 25,25 L 60,25 L 25,60 Z',
    viewBox: '0 0 200 200',
    defaultFill: '#8B5CF6'
  },
  {
    id: 'orn-crn-9',
    name: 'Triple Lace Ribbon Corner',
    nameAr: 'زاوية الدانتيل الثلاثي',
    category: 'corners',
    categoryAr: 'زوايا فاخرة وتزينات',
    svgPath: 'M 15,15 L 120,15 L 100,35 L 35,100 L 15,120 Z M 30,30 L 75,30 L 30,75 Z',
    viewBox: '0 0 200 200',
    defaultFill: '#38BDF8'
  },
  {
    id: 'orn-crn-10',
    name: 'Golden Crescent Wing Corner',
    nameAr: 'جناح الهلال الذهبي للزاوية',
    category: 'corners',
    categoryAr: 'زوايا فاخرة وتزينات',
    svgPath: 'M 10,10 L 130,10 Q 80,50 50,80 Q 10,130 10,10 Z M 30,30 A 40,40 0 0,0 70,70 A 40,40 0 0,0 30,30 Z',
    viewBox: '0 0 200 200',
    defaultFill: '#F59E0B'
  },

  // 3. TEXT DIVIDERS & FLOURISHES (فواصل ونهايات نصوص) (21-30)
  {
    id: 'orn-div-1',
    name: 'Symmetrical Fleur-de-Lis Divider',
    nameAr: 'فاصل الزنبقة الملكية المترابط',
    category: 'dividers',
    categoryAr: 'فواصل ونهايات نصوص',
    svgPath: 'M 10,100 Q 50,80 100,100 Q 150,120 190,100 M 100,70 L 100,130 M 80,100 L 120,100 M 100,70 C 85,80 85,90 100,100 C 115,90 115,80 100,70 Z',
    viewBox: '0 0 200 200',
    defaultFill: '#F59E0B'
  },
  {
    id: 'orn-div-2',
    name: 'Arabesque Winged Line Divider',
    nameAr: 'فاصل أجنحة الأرابيسك الانسيابي',
    category: 'dividers',
    categoryAr: 'فواصل ونهايات نصوص',
    svgPath: 'M 15,100 L 70,100 C 85,80 85,80 100,100 C 115,120 115,120 130,100 L 185,100 M 100,80 A 20,20 0 1,0 100,120 A 20,20 0 1,0 100,80 Z',
    viewBox: '0 0 200 200',
    defaultFill: '#38BDF8'
  },
  {
    id: 'orn-div-3',
    name: 'Diamond Chain Border Trim',
    nameAr: 'سلسلة الماس الزخرفية',
    category: 'dividers',
    categoryAr: 'فواصل ونهايات نصوص',
    svgPath: 'M 20,100 L 40,80 L 60,100 L 80,80 L 100,100 L 120,80 L 140,100 L 160,80 L 180,100 L 160,120 L 140,100 L 120,120 L 100,100 L 80,120 L 60,100 L 40,120 Z',
    viewBox: '0 0 200 200',
    defaultFill: '#EAB308'
  },
  {
    id: 'orn-div-4',
    name: 'Calligraphic Heart Flourish Divider',
    nameAr: 'فاصل المخطوطة اللولبية الساحرة',
    category: 'dividers',
    categoryAr: 'فواصل ونهايات نصوص',
    svgPath: 'M 15,100 Q 50,60 100,100 Q 150,140 185,100 M 50,100 Q 75,120 100,100 Q 125,80 150,100',
    viewBox: '0 0 200 200',
    defaultFill: '#EC4899'
  },
  {
    id: 'orn-div-5',
    name: 'Islamic Star Segment Line',
    nameAr: 'فاصل النجوم المتسلسلة',
    category: 'dividers',
    categoryAr: 'فواصل ونهايات نصوص',
    svgPath: 'M 10,100 L 60,100 M 140,100 L 190,100 M 100,75 L 115,90 L 125,75 L 125,95 L 140,100 L 125,105 L 125,125 L 115,110 L 100,125 L 85,110 L 75,125 L 75,105 L 60,100 L 75,95 L 75,75 L 85,90 Z',
    viewBox: '0 0 200 200',
    defaultFill: '#10B981'
  },
  {
    id: 'orn-div-6',
    name: 'Vintage Laurel Scroll Bar',
    nameAr: 'شريط أغصان الغار الكلاسيكي',
    category: 'dividers',
    categoryAr: 'فواصل ونهايات نصوص',
    svgPath: 'M 20,100 C 50,85 70,85 100,100 C 130,115 150,115 180,100 M 70,80 Q 85,95 100,100 Q 115,95 130,80',
    viewBox: '0 0 200 200',
    defaultFill: '#0284C7'
  },
  {
    id: 'orn-div-7',
    name: 'Royal Crown Centerpiece Line',
    nameAr: 'فاصل التاج الفاخر في المنتصف',
    category: 'dividers',
    categoryAr: 'فواصل ونهايات نصوص',
    svgPath: 'M 15,100 L 70,100 L 80,85 L 100,65 L 120,85 L 130,100 L 185,100 M 90,100 L 100,80 L 110,100 Z',
    viewBox: '0 0 200 200',
    defaultFill: '#F59E0B'
  },
  {
    id: 'orn-div-8',
    name: 'Swirl Loop Vignette Bar',
    nameAr: 'فاصل الدوامات والأنواط الفنية',
    category: 'dividers',
    categoryAr: 'فواصل ونهايات نصوص',
    svgPath: 'M 15,100 C 40,70 60,130 100,100 C 140,70 160,130 185,100',
    viewBox: '0 0 200 200',
    defaultFill: '#8B5CF6'
  },
  {
    id: 'orn-div-9',
    name: 'Triple Pearl Drop Divider',
    nameAr: 'فاصل حبّات اللؤلؤ الثلاثية',
    category: 'dividers',
    categoryAr: 'فواصل ونهايات نصوص',
    svgPath: 'M 15,100 L 75,100 M 125,100 L 185,100 M 100,85 A 15,15 0 1,0 100,115 A 15,15 0 1,0 100,85 Z M 80,92 A 8,8 0 1,0 80,108 A 8,8 0 1,0 80,92 Z M 120,92 A 8,8 0 1,0 120,108 A 8,8 0 1,0 120,92 Z',
    viewBox: '0 0 200 200',
    defaultFill: '#38BDF8'
  },
  {
    id: 'orn-div-10',
    name: 'Minimalist Crescent Divider',
    nameAr: 'فاصل الهلال والنجمة الناعم',
    category: 'dividers',
    categoryAr: 'فواصل ونهايات نصوص',
    svgPath: 'M 15,100 L 75,100 M 125,100 L 185,100 M 100,80 A 20,20 0 1,0 100,120 A 15,15 0 0,1 100,80 Z',
    viewBox: '0 0 200 200',
    defaultFill: '#F59E0B'
  },

  // 4. ARABESQUE & ROSETTES (أرابيسك وروزيت ماندالا) (31-40)
  {
    id: 'orn-man-1',
    name: 'Islamic 8-Point Arabesque Rosette',
    nameAr: 'وردة الأرابيسك ثمانية الأجنحة',
    category: 'mandalas',
    categoryAr: 'أرابيسك وروزيت ماندالا',
    svgPath: 'M 100,20 L 120,70 L 170,50 L 140,95 L 180,130 L 130,130 L 120,180 L 95,140 L 60,170 L 70,120 L 20,110 L 65,85 L 35,45 L 85,60 Z',
    viewBox: '0 0 200 200',
    defaultFill: '#F59E0B'
  },
  {
    id: 'orn-man-2',
    name: '12-Petal Sacred Mandala Lotus',
    nameAr: 'ماندالا زهرة اللوتس 12 فص',
    category: 'mandalas',
    categoryAr: 'أرابيسك وروزيت ماندالا',
    svgPath: 'M 100,25 C 110,45 110,45 125,35 C 125,55 125,55 145,55 C 135,70 135,70 150,85 C 135,95 135,95 145,115 C 125,115 125,115 125,135 C 110,125 110,125 100,145 C 90,125 90,125 75,135 C 75,115 75,115 55,115 C 65,95 65,95 50,85 C 65,70 65,70 55,55 C 75,55 75,55 75,35 C 90,45 90,45 100,25 Z',
    viewBox: '0 0 200 200',
    defaultFill: '#EAB308'
  },
  {
    id: 'orn-man-3',
    name: 'Geometrical Star Medallion',
    nameAr: 'ميدالية النجمة الهندسية المتداخلة',
    category: 'mandalas',
    categoryAr: 'أرابيسك وروزيت ماندالا',
    svgPath: 'M 100,10 L 125,60 L 180,35 L 150,90 L 190,135 L 135,135 L 125,190 L 90,150 L 45,180 L 60,125 L 10,115 L 60,85 L 25,40 L 80,55 Z M 100,50 A 50,50 0 1,0 100,150 A 50,50 0 1,0 100,50 Z',
    viewBox: '0 0 200 200',
    defaultFill: '#38BDF8'
  },
  {
    id: 'orn-man-4',
    name: 'Lace Flower Kaleidoscope Mandala',
    nameAr: 'زهرة الكلايدوسكوب المفرغة',
    category: 'mandalas',
    categoryAr: 'أرابيسك وروزيت ماندالا',
    svgPath: 'M 100,30 A 70,70 0 1,0 100,170 A 70,70 0 1,0 100,30 Z M 100,50 A 50,50 0 1,1 100,150 A 50,50 0 1,1 100,50 Z M 100,70 A 30,30 0 1,0 100,130 A 30,30 0 1,0 100,70 Z',
    viewBox: '0 0 200 200',
    defaultFill: '#0284C7'
  },
  {
    id: 'orn-man-5',
    name: 'Ottoman Floral Sunburst Mandala',
    nameAr: 'شمس الأرابيسك العثمانية',
    category: 'mandalas',
    categoryAr: 'أرابيسك وروزيت ماندالا',
    svgPath: 'M 100,15 L 112,50 L 145,28 L 138,65 L 175,55 L 155,85 L 190,100 L 155,115 L 175,145 L 138,135 L 145,172 L 112,150 L 100,185 L 88,150 L 55,172 L 62,135 L 25,145 L 45,115 L 10,100 L 45,85 L 25,55 L 62,65 L 55,28 L 88,50 Z',
    viewBox: '0 0 200 200',
    defaultFill: '#F59E0B'
  },
  {
    id: 'orn-man-6',
    name: 'Moroccan Zillij Star Mandala',
    nameAr: 'نجمة الزليج المغربي الملونة',
    category: 'mandalas',
    categoryAr: 'أرابيسك وروزيت ماندالا',
    svgPath: 'M 100,20 L 180,100 L 100,180 L 20,100 Z M 40,40 L 160,40 L 160,160 L 40,160 Z',
    viewBox: '0 0 200 200',
    defaultFill: '#10B981'
  },
  {
    id: 'orn-man-7',
    name: 'Classic Oriental Seal Mandala',
    nameAr: 'خاتم ماندالا شرقي دائرية',
    category: 'mandalas',
    categoryAr: 'أرابيسك وروزيت ماندالا',
    svgPath: 'M 100,15 C 145,15 185,55 185,100 C 185,145 145,185 100,185 C 55,185 15,145 15,100 C 15,55 55,15 100,15 Z M 100,35 C 135,35 165,65 165,100 C 165,135 135,165 100,165 C 65,165 35,135 35,100 C 35,65 65,35 100,35 Z',
    viewBox: '0 0 200 200',
    defaultFill: '#EC4899'
  },
  {
    id: 'orn-man-8',
    name: 'Hexagonal Geometric Tile Rosette',
    nameAr: 'روزيت بلاط سداسي محفور',
    category: 'mandalas',
    categoryAr: 'أرابيسك وروزيت ماندالا',
    svgPath: 'M 100,15 L 175,58 L 175,142 L 100,185 L 25,142 L 25,58 Z M 100,40 L 150,70 L 150,130 L 100,160 L 50,130 L 50,70 Z',
    viewBox: '0 0 200 200',
    defaultFill: '#8B5CF6'
  },
  {
    id: 'orn-man-9',
    name: 'Abstract Arabesque Vine Rosette',
    nameAr: 'زهرة أغصان الأرابيسك الملتفة',
    category: 'mandalas',
    categoryAr: 'أرابيسك وروزيت ماندالا',
    svgPath: 'M 100,20 Q 140,20 160,60 Q 180,100 160,140 Q 140,180 100,180 Q 60,180 40,140 Q 20,100 40,60 Q 60,20 100,20 Z',
    viewBox: '0 0 200 200',
    defaultFill: '#38BDF8'
  },
  {
    id: 'orn-man-10',
    name: 'Royal Sun Emblem Mandala',
    nameAr: 'شعار الشمس الملكية الذهبية',
    category: 'mandalas',
    categoryAr: 'أرابيسك وروزيت ماندالا',
    svgPath: 'M 100,20 A 80,80 0 1,0 100,180 A 80,80 0 1,0 100,20 Z M 100,45 A 55,55 0 1,1 100,155 A 55,55 0 1,1 100,45 Z',
    viewBox: '0 0 200 200',
    defaultFill: '#F59E0B'
  },

  // 5. CRESCENTS, LANTERNS & MOSQUES (أهلة وفوانيس ومساجد) (41-50)
  {
    id: 'orn-isl-1',
    name: 'Ornate Arabesque Crescent Moon',
    nameAr: 'هلال عربي إسلامي مزخرف',
    category: 'islamic',
    categoryAr: 'أهلة وفوانيس ومساجد',
    svgPath: 'M 100,15 C 150,15 190,55 190,105 C 190,155 150,195 100,195 C 135,175 155,140 155,105 C 155,70 135,35 100,15 Z',
    viewBox: '0 0 200 200',
    defaultFill: '#F59E0B'
  },
  {
    id: 'orn-isl-2',
    name: 'Traditional Ramadan Fanous Lantern',
    nameAr: 'فانوس رمضان التقليدي الأنيق',
    category: 'islamic',
    categoryAr: 'أهلة وفوانيس ومساجد',
    svgPath: 'M 100,10 L 110,30 L 150,60 L 130,140 L 150,170 L 50,170 L 70,140 L 50,60 L 90,30 Z M 100,30 A 8,8 0 1,0 100,14 A 8,8 0 1,0 100,30 Z M 70,75 L 130,75 L 120,125 L 80,125 Z',
    viewBox: '0 0 200 200',
    defaultFill: '#EAB308'
  },
  {
    id: 'orn-isl-3',
    name: 'Mosque Dome & Minarets Silhouette',
    nameAr: 'قبة المسجد والمآذن الفخمة',
    category: 'islamic',
    categoryAr: 'أهلة وفوانيس ومساجد',
    svgPath: 'M 100,20 Q 70,50 60,90 L 15,90 L 15,180 L 185,180 L 185,90 L 140,90 Q 130,50 100,20 Z M 25,60 L 35,80 L 15,80 Z M 175,60 L 185,80 L 165,80 Z',
    viewBox: '0 0 200 200',
    defaultFill: '#38BDF8'
  },
  {
    id: 'orn-isl-4',
    name: 'Crescent Moon with Hanging Star',
    nameAr: 'هلال مع نجمة متدلية',
    category: 'islamic',
    categoryAr: 'أهلة وفوانيس ومساجد',
    svgPath: 'M 90,15 C 135,15 170,50 170,95 C 170,140 135,175 90,175 C 120,155 138,125 138,95 C 138,65 120,35 90,15 Z M 45,20 L 45,70 M 45,85 L 50,72 L 63,72 L 53,80 L 57,93 L 45,85 L 33,93 L 37,80 L 27,72 L 40,72 Z',
    viewBox: '0 0 200 200',
    defaultFill: '#F59E0B'
  },
  {
    id: 'orn-isl-5',
    name: 'Islamic Star Rub el Hizb 8-Point',
    nameAr: 'نجمة ربع الحزب ثمانية الأبعاد',
    category: 'islamic',
    categoryAr: 'أهلة وفوانيس ومساجد',
    svgPath: 'M 40,40 L 160,40 L 160,160 L 40,160 Z M 100,15 L 185,100 L 100,185 L 15,100 Z',
    viewBox: '0 0 200 200',
    defaultFill: '#10B981'
  },
  {
    id: 'orn-isl-6',
    name: 'Hanging Royal Oil Lamp',
    nameAr: 'قنديل إسلامي معلق مع سلاسل',
    category: 'islamic',
    categoryAr: 'أهلة وفوانيس ومساجد',
    svgPath: 'M 100,10 L 100,50 M 60,80 L 140,80 L 120,140 C 120,165 80,165 80,140 Z M 70,50 L 130,50 L 100,80 Z',
    viewBox: '0 0 200 200',
    defaultFill: '#0284C7'
  },
  {
    id: 'orn-isl-7',
    name: 'Moroccan Lantern Arch Combo',
    nameAr: 'تراكيب الفانوس مع المحراب',
    category: 'islamic',
    categoryAr: 'أهلة وفوانيس ومساجد',
    svgPath: 'M 30,180 L 30,90 Q 30,30 100,15 Q 170,30 170,90 L 170,180 Z M 100,40 L 115,70 L 85,70 Z M 100,80 L 115,130 L 85,130 Z',
    viewBox: '0 0 200 200',
    defaultFill: '#EC4899'
  },
  {
    id: 'orn-isl-8',
    name: 'Double Crescent Garland',
    nameAr: 'قلادة الهلالين المتناظرين',
    category: 'islamic',
    categoryAr: 'أهلة وفوانيس ومساجد',
    svgPath: 'M 20,100 Q 60,40 100,100 Q 140,160 180,100 Q 140,40 100,100 Q 60,160 20,100 Z',
    viewBox: '0 0 200 200',
    defaultFill: '#8B5CF6'
  },
  {
    id: 'orn-isl-9',
    name: 'Islamic Crescent Medallion',
    nameAr: 'ميدالية هلال رمضان المزخرفة',
    category: 'islamic',
    categoryAr: 'أهلة وفوانيس ومساجد',
    svgPath: 'M 100,20 A 80,80 0 1,0 100,180 A 80,80 0 1,0 100,20 Z M 90,45 A 55,55 0 1,1 90,155 A 45,45 0 0,0 90,45 Z',
    viewBox: '0 0 200 200',
    defaultFill: '#38BDF8'
  },
  {
    id: 'orn-isl-10',
    name: 'Grand Mosque Minaret Spire',
    nameAr: 'هلال المئذنة الشامخة',
    category: 'islamic',
    categoryAr: 'أهلة وفوانيس ومساجد',
    svgPath: 'M 100,10 L 108,35 L 100,45 L 92,35 Z M 100,45 L 115,100 L 85,100 Z M 85,100 L 115,100 L 120,190 L 80,190 Z',
    viewBox: '0 0 200 200',
    defaultFill: '#F59E0B'
  },

  // 6. CALLIGRAPHIC SEALS & BADGES (مخطوطات وأختام وتيجان) (51-60)
  {
    id: 'orn-cal-1',
    name: 'Bismillah Calligraphic Oval Seal',
    nameAr: 'ختم البسملة البيضاوي الشريف',
    category: 'calligraphy',
    categoryAr: 'مخطوطات وأختام وتيجان',
    svgPath: 'M 20,100 C 20,50 55,20 100,20 C 145,20 180,50 180,100 C 180,150 145,180 100,180 C 55,180 20,150 20,100 Z M 35,100 C 35,60 65,35 100,35 C 135,35 165,60 165,100 C 165,140 135,165 100,165 C 65,165 35,140 35,100 Z',
    viewBox: '0 0 200 200',
    defaultFill: '#F59E0B'
  },
  {
    id: 'orn-cal-2',
    name: 'Royal Crest Crown Badge',
    nameAr: 'شعار الشرف والتاج الملكي',
    category: 'calligraphy',
    categoryAr: 'مخطوطات وأختام وتيجان',
    svgPath: 'M 20,130 L 180,130 L 170,60 L 135,95 L 100,35 L 65,95 L 30,60 Z M 30,150 L 170,150 L 160,170 L 40,170 Z',
    viewBox: '0 0 200 200',
    defaultFill: '#EAB308'
  },
  {
    id: 'orn-cal-3',
    name: 'Laurel Wreath Triumph Circle',
    nameAr: 'إكليل الغار الملكي المتوج',
    category: 'calligraphy',
    categoryAr: 'مخطوطات وأختام وتيجان',
    svgPath: 'M 40,160 C 15,120 20,70 55,40 C 65,30 80,25 100,25 C 120,25 135,30 145,40 C 180,70 185,120 160,160 M 80,175 L 100,155 L 120,175',
    viewBox: '0 0 200 200',
    defaultFill: '#38BDF8'
  },
  {
    id: 'orn-cal-4',
    name: 'Imperial Sultan Tughra Seal',
    nameAr: 'الطغراء السلطانية الفخمة',
    category: 'calligraphy',
    categoryAr: 'مخطوطات وأختام وتيجان',
    svgPath: 'M 30,150 Q 80,20 140,80 Q 180,120 120,170 Q 70,190 30,150 Z M 60,100 Q 100,40 130,80 Z',
    viewBox: '0 0 200 200',
    defaultFill: '#0284C7'
  },
  {
    id: 'orn-cal-5',
    name: 'Flower Scalloped Stamp Badge',
    nameAr: 'ختم الزهرة المسننة الترويجية',
    category: 'calligraphy',
    categoryAr: 'مخطوطات وأختام وتيجان',
    svgPath: 'M 100,20 C 115,5 135,10 145,25 C 160,20 175,35 170,50 C 185,60 190,80 175,95 C 190,110 185,130 170,140 C 175,155 160,170 145,165 C 135,180 115,185 100,170 C 85,185 65,180 55,165 C 40,170 25,155 30,140 C 15,130 10,110 25,95 C 10,80 15,60 30,50 C 25,35 40,20 55,25 C 65,10 85,5 100,20 Z',
    viewBox: '0 0 200 200',
    defaultFill: '#EC4899'
  },
  {
    id: 'orn-cal-6',
    name: 'Geometric Hexagon Crest Seal',
    nameAr: 'خاتم الشعار السداسي الذهبي',
    category: 'calligraphy',
    categoryAr: 'مخطوطات وأختام وتيجان',
    svgPath: 'M 100,15 L 180,60 L 180,140 L 100,185 L 20,140 L 20,60 Z M 100,35 L 37,70 L 37,130 L 100,165 L 163,130 L 163,70 Z',
    viewBox: '0 0 200 200',
    defaultFill: '#10B981'
  },
  {
    id: 'orn-cal-7',
    name: 'Shield of Valor Royal Crest',
    nameAr: 'درع الشجاعة والتميز الملكي',
    category: 'calligraphy',
    categoryAr: 'مخطوطات وأختام وتيجان',
    svgPath: 'M 30,30 L 170,30 L 170,110 C 170,155 100,185 100,185 C 100,185 30,155 30,110 Z M 45,45 L 45,105 C 45,140 100,165 100,165 C 100,165 155,140 155,105 L 155,45 Z',
    viewBox: '0 0 200 200',
    defaultFill: '#8B5CF6'
  },
  {
    id: 'orn-cal-8',
    name: 'Classic Wax Seal Stamp',
    nameAr: 'ختم الشمع الأحمر الأنتيك',
    category: 'calligraphy',
    categoryAr: 'مخطوطات وأختام وتيجان',
    svgPath: 'M 100,15 C 145,10 185,40 180,85 C 190,130 150,185 100,180 C 50,185 10,135 20,85 C 15,40 55,10 100,15 Z M 100,40 A 50,50 0 1,0 100,140 A 50,50 0 1,0 100,40 Z',
    viewBox: '0 0 200 200',
    defaultFill: '#DC2626'
  },
  {
    id: 'orn-cal-9',
    name: 'Triple Star VIP Award Seal',
    nameAr: 'شارة النجوم الثلاثية المعتمدة',
    category: 'calligraphy',
    categoryAr: 'مخطوطات وأختام وتيجان',
    svgPath: 'M 100,20 A 70,70 0 1,0 100,160 A 70,70 0 1,0 100,20 Z M 70,150 L 50,195 L 85,175 L 100,195 L 115,175 L 150,195 L 130,150 Z',
    viewBox: '0 0 200 200',
    defaultFill: '#F59E0B'
  },
  {
    id: 'orn-cal-10',
    name: 'Vintage Flourish Ribbon Tag',
    nameAr: 'وسام الشريط الزخرفي الكلاسيكي',
    category: 'calligraphy',
    categoryAr: 'مخطوطات وأختام وتيجان',
    svgPath: 'M 40,50 L 160,50 L 180,90 L 160,130 L 40,130 L 20,90 Z M 30,130 L 10,170 L 45,150 L 60,170 L 40,130 Z M 170,130 L 190,170 L 155,150 L 140,170 L 160,130 Z',
    viewBox: '0 0 200 200',
    defaultFill: '#38BDF8'
  }
];
