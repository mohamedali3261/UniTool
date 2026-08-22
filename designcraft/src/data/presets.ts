import { DimensionPreset, StockPhoto, TextPreset, ProjectItem } from '../types';

export const DIMENSION_PRESETS: DimensionPreset[] = [
  // Google Play Store Graphics (Official Developer Console Specifications)
  {
    id: 'google-play-feature',
    title: 'Google Play Feature Graphic',
    titleAr: 'صورة مميزة متجر جوجل بلاي',
    width: 1024,
    height: 500,
    category: 'google-play',
    description: '1024 x 500 px (Feature Graphic)',
    descriptionAr: '1024 × 500 بكسل (الصورة المميزة الرسمية)',
    icon: 'Play',
    aspectRatio: '2.05:1'
  },
  {
    id: 'google-play-icon',
    title: 'Google Play App Icon',
    titleAr: 'أيقونة تطبيق جوجل بلاي',
    width: 512,
    height: 512,
    category: 'google-play',
    description: '512 x 512 px (Hi-res App Icon)',
    descriptionAr: '512 × 512 بكسل (أيقونة عالية الدقة)',
    icon: 'Smartphone',
    aspectRatio: '1:1'
  },
  {
    id: 'google-play-screenshot-phone',
    title: 'Google Play Phone Screenshot',
    titleAr: 'لقطة شاشة الهاتف لجوجل بلاي',
    width: 1080,
    height: 1920,
    category: 'google-play',
    description: '1080 x 1920 px (Phone Screenshot 9:16)',
    descriptionAr: '1080 × 1920 بكسل (لقطات شاشة الهاتف)',
    icon: 'Smartphone',
    aspectRatio: '9:16'
  },
  {
    id: 'google-play-screenshot-tablet7',
    title: 'Google Play 7" Tablet Screenshot',
    titleAr: 'لقطة شاشة تابلت 7 بوصة',
    width: 1200,
    height: 1920,
    category: 'google-play',
    description: '1200 x 1920 px (7-inch Tablet)',
    descriptionAr: '1200 × 1920 بكسل (أجهزة لوحية 7")',
    icon: 'Tablet',
    aspectRatio: '10:16'
  },
  {
    id: 'google-play-screenshot-tablet10',
    title: 'Google Play 10" Tablet Screenshot',
    titleAr: 'لقطة شاشة تابلت 10 بوصة',
    width: 1600,
    height: 2560,
    category: 'google-play',
    description: '1600 x 2560 px (10-inch Tablet)',
    descriptionAr: '1600 × 2560 بكسل (أجهزة لوحية 10")',
    icon: 'Tablet',
    aspectRatio: '10:16'
  },

  // Social Media
  {
    id: 'instagram-post',
    title: 'Instagram Post',
    titleAr: 'منشور إنستغرام مربع',
    width: 1080,
    height: 1080,
    category: 'social',
    description: '1080 x 1080 px (Square 1:1)',
    descriptionAr: '1080 × 1080 بكسل (مربع 1:1)',
    icon: 'Instagram',
    aspectRatio: '1:1'
  },
  {
    id: 'instagram-story',
    title: 'Instagram Story / Reel',
    titleAr: 'قصة إنستغرام / ريلز',
    width: 1080,
    height: 1920,
    category: 'social',
    description: '1080 x 1920 px (Vertical 9:16)',
    descriptionAr: '1080 × 1920 بكسل (رأسي 9:16)',
    icon: 'Smartphone',
    aspectRatio: '9:16'
  },
  {
    id: 'youtube-thumbnail',
    title: 'YouTube Thumbnail',
    titleAr: 'صورة مصغرة يوتيوب',
    width: 1280,
    height: 720,
    category: 'video',
    description: '1280 x 720 px (HD 16:9)',
    descriptionAr: '1280 × 720 بكسل (HD 16:9)',
    icon: 'Youtube',
    aspectRatio: '16:9'
  },
  {
    id: 'facebook-post',
    title: 'Facebook Post',
    titleAr: 'منشور فيسبوك',
    width: 1200,
    height: 630,
    category: 'social',
    description: '1200 x 630 px (Landscape)',
    descriptionAr: '1200 × 630 بكسل (أفقي)',
    icon: 'Facebook',
    aspectRatio: '1.91:1'
  },
  {
    id: 'twitter-post',
    title: 'Twitter / X Post',
    titleAr: 'منشور تويتر / X',
    width: 1200,
    height: 675,
    category: 'social',
    description: '1200 x 675 px (Landscape 16:9)',
    descriptionAr: '1200 × 675 بكسل (أفقي 16:9)',
    icon: 'Twitter',
    aspectRatio: '16:9'
  },
  {
    id: 'custom',
    title: 'Custom Size',
    titleAr: 'مقاس مخصص',
    width: 1200,
    height: 800,
    category: 'custom',
    description: 'Manual Width & Height',
    descriptionAr: 'تحديد الأبعاد يدوياً',
    icon: 'Sliders',
    aspectRatio: 'Custom'
  }
];

export const STOCK_PHOTOS: StockPhoto[] = [
  {
    id: 'photo-1',
    title: 'Modern Workspace',
    category: 'business',
    url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800&auto=format&fit=crop&q=80',
    author: 'Unsplash Business'
  },
  {
    id: 'photo-2',
    title: 'Neon Abstract Wave',
    category: 'abstract',
    url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&auto=format&fit=crop&q=80',
    author: 'Unsplash Abstract'
  },
  {
    id: 'photo-3',
    title: 'Tech Laptop & Code',
    category: 'tech',
    url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
    author: 'Unsplash Tech'
  },
  {
    id: 'photo-4',
    title: 'Gourmet Burger & Fries',
    category: 'food',
    url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80',
    author: 'Unsplash Food'
  },
  {
    id: 'photo-5',
    title: 'Creative Professional Team',
    category: 'people',
    url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80',
    author: 'Unsplash Team'
  },
  {
    id: 'photo-6',
    title: 'Mountain Sunset Gradient',
    category: 'nature',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
    author: 'Unsplash Nature'
  },
  {
    id: 'photo-7',
    title: 'Dark Blue Fluid Silk',
    category: 'gradients',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    author: 'Unsplash Liquid'
  }
];

export const TEXT_PRESETS: TextPreset[] = [
  // 1. Headings & Structures
  {
    id: 'preset-h1',
    label: 'Main Heading',
    labelAr: 'عنوان رئيسي ضخم',
    category: 'headings',
    fontFamily: 'Cairo',
    fontSize: 54,
    fontWeight: 800,
    fill: '#FFFFFF',
    text: 'عنوان رئيسي جذاب'
  },
  {
    id: 'preset-h2',
    label: 'Subheading',
    labelAr: 'عنوان فرعي أنيق',
    category: 'headings',
    fontFamily: 'Tajawal',
    fontSize: 36,
    fontWeight: 700,
    fill: '#38BDF8',
    text: 'عنوان فرعي توضيحي مميز'
  },

  // 2. Royal Gold Styles
  {
    id: 'preset-gold',
    label: 'Royal Gold',
    labelAr: 'خط كوفي ذهبي فخم',
    category: 'gold',
    fontFamily: 'Reem Kufi',
    fontSize: 48,
    fontWeight: 700,
    fill: '#FCD34D',
    shadow: 'rgba(245, 158, 11, 0.6) 0px 4px 16px',
    text: 'الخط الفاخر المميز'
  },
  {
    id: 'preset-royal-badge',
    label: 'Royal Gold Badge',
    labelAr: 'وسام التميز الملكي',
    category: 'gold',
    fontFamily: 'Cairo',
    fontSize: 40,
    fontWeight: 900,
    fill: '#FBBF24',
    stroke: '#78350F',
    strokeWidth: 2,
    shadow: 'rgba(217, 119, 6, 0.5) 0px 6px 18px',
    text: '🏆 وسام التميز والتفوق'
  },
  {
    id: 'preset-gold-dark',
    label: 'Gold Dark Box',
    labelAr: 'عنوان مذهب بكادر فاخر',
    category: 'gold',
    fontFamily: 'Aref Ruqaa',
    fontSize: 38,
    fontWeight: 700,
    fill: '#FCD34D',
    backgroundColor: '#1E1B4B',
    shadow: 'rgba(245, 158, 11, 0.4) 0px 4px 12px',
    text: '✨ الشرف والتميز والابتكار'
  },

  // 3. Neon & Glow
  {
    id: 'preset-neon',
    label: 'Neon Glow Cyan',
    labelAr: 'توهج نيون سماوي',
    category: 'neon',
    fontFamily: 'Alexandria',
    fontSize: 44,
    fontWeight: 900,
    fill: '#38BDF8',
    shadow: 'rgba(56, 189, 248, 0.95) 0px 0px 20px',
    text: '⚡ تصميم نيون مستقبلي'
  },
  {
    id: 'preset-neon-pink',
    label: 'Neon Pink Flame',
    labelAr: 'توهج وردي حماسي',
    category: 'neon',
    fontFamily: 'Cairo',
    fontSize: 46,
    fontWeight: 900,
    fill: '#F43F5E',
    shadow: 'rgba(244, 63, 94, 0.9) 0px 0px 22px',
    text: '🔥 عرض حماسي استثنائي'
  },
  {
    id: 'preset-cyber-green',
    label: 'Emerald Cyber Glow',
    labelAr: 'توهج زمرّدي إلكتروني',
    category: 'neon',
    fontFamily: 'Alexandria',
    fontSize: 42,
    fontWeight: 800,
    fill: '#10B981',
    shadow: 'rgba(16, 185, 129, 0.9) 0px 0px 18px',
    text: '💎 التقنية الحديثة الذكية'
  },

  // 4. Calligraphy & Arabic Heritage
  {
    id: 'preset-ruqaa',
    label: 'Classic Ruqaa',
    labelAr: 'خط رقعة أصيل',
    category: 'calligraphy',
    fontFamily: 'Aref Ruqaa',
    fontSize: 44,
    fontWeight: 700,
    fill: '#38BDF8',
    text: 'الإبداع والتميز والاحترافية'
  },
  {
    id: 'preset-amiri',
    label: 'Traditional Amiri',
    labelAr: 'خط أميري تراثي',
    category: 'calligraphy',
    fontFamily: 'Amiri',
    fontSize: 42,
    fontWeight: 700,
    fontStyle: 'italic',
    fill: '#E2E8F0',
    text: 'بسم الله الرحمن الرحيم'
  },
  {
    id: 'preset-lalezar',
    label: 'Lalezar Pop',
    labelAr: 'عنوان لاليزار المهرجاني',
    category: 'calligraphy',
    fontFamily: 'Lalezar',
    fontSize: 48,
    fontWeight: 400,
    fill: '#F59E0B',
    text: 'تنزيلات المهرجان الكبرى'
  },
  {
    id: 'preset-andalus',
    label: 'Andalusian Gold',
    labelAr: 'نقش أندلسي فاخر',
    category: 'calligraphy',
    fontFamily: 'Amiri',
    fontSize: 44,
    fontWeight: 700,
    fill: '#FBBF24',
    shadow: 'rgba(0, 0, 0, 0.6) 2px 4px 8px',
    text: 'الروعة والأصالة التراثية'
  },

  // 5. Badges & Promo Tags
  {
    id: 'preset-badge',
    label: 'Sale Badge Tag',
    labelAr: 'شارة خصم / عرض حصري',
    category: 'badges',
    fontFamily: 'Cairo',
    fontSize: 24,
    fontWeight: 800,
    fill: '#FFFFFF',
    backgroundColor: '#EF4444',
    text: '🔥 خصم خاص 50%'
  },
  {
    id: 'preset-badge-sky',
    label: 'Pro Badge Tag',
    labelAr: 'شارة احترافية ترويجية',
    category: 'badges',
    fontFamily: 'Alexandria',
    fontSize: 22,
    fontWeight: 800,
    fill: '#0F172A',
    backgroundColor: '#38BDF8',
    text: '✨ الإصدار الذهبي الاحترافي'
  },
  {
    id: 'preset-badge-emerald',
    label: 'Guarantee Emerald',
    labelAr: 'شارة ضمان الجودة',
    category: 'badges',
    fontFamily: 'Cairo',
    fontSize: 22,
    fontWeight: 800,
    fill: '#FFFFFF',
    backgroundColor: '#059669',
    text: '✅ ضمان الجودة 100%'
  },
  {
    id: 'preset-badge-purple',
    label: 'VIP Membership',
    labelAr: 'شارة VIP الملكية',
    category: 'badges',
    fontFamily: 'Tajawal',
    fontSize: 24,
    fontWeight: 800,
    fill: '#FDE047',
    backgroundColor: '#6D28D9',
    text: '👑 العضوية الملكية VIP'
  },

  // 6. 3D & Modern Visual Effects
  {
    id: 'preset-3d-shadow',
    label: '3D Extruded Shadow',
    labelAr: 'تأثير ثلاثي الأبعاد بارز',
    category: '3d',
    fontFamily: 'Cairo',
    fontSize: 48,
    fontWeight: 900,
    fill: '#FFFFFF',
    shadow: 'rgba(15, 23, 42, 0.95) 4px 6px 0px',
    text: 'تأثير بارز 3D فخم'
  },
  {
    id: 'preset-celebration',
    label: 'Festive Celebration',
    labelAr: 'احتفال المهرجانات المشرق',
    category: '3d',
    fontFamily: 'Lalezar',
    fontSize: 50,
    fontWeight: 400,
    fill: '#FEF08A',
    shadow: 'rgba(234, 88, 12, 0.8) 0px 6px 14px',
    text: '🎉 أهلاً وسهلاً بكم'
  }
];

export const COLOR_PALETTES = {
  solids: [
    '#FFFFFF', '#F8FAFC', '#F1F5F9', '#E2E8F0', '#CBD5E1', '#94A3B8', '#64748B', '#475569',
    '#334155', '#1E293B', '#0F172A', '#0B132B', '#1C2541', '#3A506B', '#0284C7', '#38BDF8',
    '#0077B6', '#0369A1', '#0C4A6E', '#0D9488', '#10B981', '#059669', '#047857', '#064E3B',
    '#EAB308', '#F59E0B', '#D97706', '#B45309', '#78350F', '#F97316', '#EA580C', '#C2410C',
    '#EF4444', '#DC2626', '#B91C1C', '#991B1B', '#EC4899', '#DB2777', '#BE185D', '#831843',
    '#8B5CF6', '#7C3AED', '#6D28D9', '#5B21B6', '#6366F1', '#4F46E5', '#4338CA', '#312E81'
  ],
  gradients: [
    { name: 'Royal Gold', nameAr: 'ذهبي بريميوم ملكي', gradient: 'linear-gradient(135deg, #18181B 0%, #78350F 50%, #F59E0B 100%)', stops: ['#18181B', '#78350F', '#F59E0B'] },
    { name: 'Islamic Emerald Gold', nameAr: 'زمردي مذهب فاخر', gradient: 'linear-gradient(135deg, #064E3B 0%, #047857 50%, #F59E0B 100%)', stops: ['#064E3B', '#047857', '#F59E0B'] },
    { name: 'Ocean Cyan', nameAr: 'أزرق سماوي عميق', gradient: 'linear-gradient(135deg, #1C2541 0%, #0077B6 50%, #48CAE4 100%)', stops: ['#1C2541', '#0077B6', '#48CAE4'] },
    { name: 'Sky Electric', nameAr: 'كهرباء السماء', gradient: 'linear-gradient(135deg, #0284C7 0%, #38BDF8 50%, #E0F2FE 100%)', stops: ['#0284C7', '#38BDF8', '#E0F2FE'] },
    { name: 'Dark Navy', nameAr: 'كحلي ليلي', gradient: 'linear-gradient(135deg, #0B132B 0%, #1C2541 100%)', stops: ['#0B132B', '#1C2541'] },
    { name: 'Deep Midnight', nameAr: 'سحر الليل والنيون', gradient: 'linear-gradient(135deg, #0F172A 0%, #312E81 100%)', stops: ['#0F172A', '#312E81'] },
    { name: 'Sunset Glow', nameAr: 'توهج الغروب الدافئ', gradient: 'linear-gradient(135deg, #1E1B4B 0%, #831843 50%, #B91C1C 100%)', stops: ['#1E1B4B', '#831843', '#B91C1C'] },
    { name: 'Flame Burst', nameAr: 'لهب بركاني مشتعل', gradient: 'linear-gradient(135deg, #7C2D12 0%, #EA580C 50%, #FACC15 100%)', stops: ['#7C2D12', '#EA580C', '#FACC15'] },
    { name: 'Rose Gold Luxury', nameAr: 'ذهبي وردي ملكي', gradient: 'linear-gradient(135deg, #500724 0%, #BE185D 50%, #FBCFE8 100%)', stops: ['#500724', '#BE185D', '#FBCFE8'] },
    { name: 'Purple Dream', nameAr: 'بنفسجي ملكي ساحر', gradient: 'linear-gradient(135deg, #311042 0%, #6B21A8 50%, #C084FC 100%)', stops: ['#311042', '#6B21A8', '#C084FC'] },
    { name: 'Neon Cyber', nameAr: 'نيون مستقبلي مشع', gradient: 'linear-gradient(135deg, #09090B 0%, #4F46E5 50%, #06B6D4 100%)', stops: ['#09090B', '#4F46E5', '#06B6D4'] },
    { name: 'Emerald Forest', nameAr: 'غابة زمردية نضرة', gradient: 'linear-gradient(135deg, #022C22 0%, #059669 50%, #6EE7B7 100%)', stops: ['#022C22', '#059669', '#6EE7B7'] },
    { name: 'Metallic Silver Slate', nameAr: 'فضة وستيل فاخر', gradient: 'linear-gradient(135deg, #1E293B 0%, #64748B 50%, #F1F5F9 100%)', stops: ['#1E293B', '#64748B', '#F1F5F9'] },
    { name: 'Copper Amber', nameAr: 'نحاسي وعنبر دافئ', gradient: 'linear-gradient(135deg, #451A03 0%, #D97706 50%, #FDE68A 100%)', stops: ['#451A03', '#D97706', '#FDE68A'] },
    { name: 'Crimson Night', nameAr: 'أحمر قرمزي ملكي', gradient: 'linear-gradient(135deg, #450A0A 0%, #DC2626 50%, #FCA5A5 100%)', stops: ['#450A0A', '#DC2626', '#FCA5A5'] },
    { name: 'Pastel Aurora', nameAr: 'أورورا ناعمة بوهيمية', gradient: 'linear-gradient(135deg, #A5F3FC 0%, #C4B5FD 50%, #FBCFE8 100%)', stops: ['#A5F3FC', '#C4B5FD', '#FBCFE8'] },
    { name: 'Clean Light Slate', nameAr: 'رمادي فاتح نظيف', gradient: 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)', stops: ['#F8FAFC', '#E2E8F0'] },
    { name: 'Pure Dark Matte', nameAr: 'أسود مطفي بريميوم', gradient: 'linear-gradient(135deg, #090A0F 0%, #171923 100%)', stops: ['#090A0F', '#171923'] }
  ]
};

export const POPULAR_FONTS = [
  { name: 'Cairo', label: 'Cairo (عربي/إنجليزي عريض)', font: 'Cairo, sans-serif' },
  { name: 'Tajawal', label: 'Tajawal (عربي/إنجليزي أنيق)', font: 'Tajawal, sans-serif' },
  { name: 'Alexandria', label: 'Alexandria (عربي عصري حديث)', font: 'Alexandria, sans-serif' },
  { name: 'Almarai', label: 'Almarai (عربي رسمي واضح)', font: 'Almarai, sans-serif' },
  { name: 'Reem Kufi', label: 'Reem Kufi (خط كوفي فاخر)', font: 'Reem Kufi, sans-serif' },
  { name: 'Aref Ruqaa', label: 'Aref Ruqaa (خط رقعة أصيل)', font: 'Aref Ruqaa, serif' },
  { name: 'Amiri', label: 'Amiri (خط أميري تراثي)', font: 'Amiri, serif' },
  { name: 'Changa', label: 'Changa (خط شاشات عريض)', font: 'Changa, sans-serif' },
  { name: 'El Messiri', label: 'El Messiri (خط جرافيك أنيق)', font: 'El Messiri, sans-serif' },
  { name: 'Lalezar', label: 'Lalezar (خط عناوين بارز)', font: 'Lalezar, cursive' },
  { name: 'Montserrat', label: 'Montserrat (Modern Bold)', font: 'Montserrat, sans-serif' },
  { name: 'Poppins', label: 'Poppins (Geometric Clean)', font: 'Poppins, sans-serif' },
  { name: 'Inter', label: 'Inter (High Readability)', font: 'Inter, sans-serif' },
  { name: 'Outfit', label: 'Outfit (Trendy Tech)', font: 'Outfit, sans-serif' },
  { name: 'Bebas Neue', label: 'Bebas Neue (Heavy Display)', font: 'Bebas Neue, sans-serif' },
  { name: 'Playfair Display', label: 'Playfair Display (Luxury Serif)', font: 'Playfair Display, serif' }
];

export const ICONS_CATALOG = [
  {
    category: 'GooglePlay & Apps',
    categoryAr: 'جوجل بلاي وتطبيقات',
    icons: [
      { name: 'Play', label: 'Google Play' },
      { name: 'Gamepad2', label: 'Games' },
      { name: 'Gamepad', label: 'Console' },
      { name: 'Download', label: 'Download' },
      { name: 'Smartphone', label: 'Mobile' },
      { name: 'Tablet', label: 'Tablet' },
      { name: 'AppWindow', label: 'App Window' },
      { name: 'Layers', label: 'Layers' },
      { name: 'Wifi', label: 'Online / Wifi' },
      { name: 'QrCode', label: 'QR Code' },
      { name: 'Monitor', label: 'Desktop' },
      { name: 'Tv', label: 'Smart TV' },
      { name: 'Bell', label: 'Notifications' },
      { name: 'Sparkles', label: 'AI Features' },
      { name: 'Sliders', label: 'Controls' },
      { name: 'Star', label: 'Rating' },
      { name: 'Award', label: 'Top Choice' },
      { name: 'ShieldCheck', label: 'Protected' },
      { name: 'Zap', label: 'High Speed' },
      { name: 'Cpu', label: 'Core Engine' },
      { name: 'Cloud', label: 'Cloud Sync' },
      { name: 'Lock', label: 'Privacy' },
      { name: 'Key', label: 'API Key' },
      { name: 'Share2', label: 'Share App' }
    ]
  },
  {
    category: 'Social & Brands',
    categoryAr: 'سوشيال ميديا وتواصل',
    icons: [
      { name: 'Instagram', label: 'Instagram' },
      { name: 'Facebook', label: 'Facebook' },
      { name: 'Twitter', label: 'Twitter / X' },
      { name: 'Youtube', label: 'YouTube' },
      { name: 'Linkedin', label: 'LinkedIn' },
      { name: 'MessageCircle', label: 'WhatsApp / Chat' },
      { name: 'Send', label: 'Telegram / Send' },
      { name: 'Globe', label: 'Website' },
      { name: 'Mail', label: 'Email' },
      { name: 'Phone', label: 'Phone' },
      { name: 'Github', label: 'Github' },
      { name: 'Twitch', label: 'Twitch' },
      { name: 'Chrome', label: 'Chrome' },
      { name: 'Figma', label: 'Figma' },
      { name: 'Dribbble', label: 'Dribbble' },
      { name: 'Slack', label: 'Slack' },
      { name: 'MessageSquare', label: 'Messages' },
      { name: 'AtSign', label: 'Mention / @' },
      { name: 'Radio', label: 'Broadcast' },
      { name: 'Podcast', label: 'Podcast' },
      { name: 'Rss', label: 'Feed / RSS' },
      { name: 'Share', label: 'Direct Share' },
      { name: 'MessageSquarePlus', label: 'New Chat' },
      { name: 'PhoneCall', label: 'Call Active' }
    ]
  },
  {
    category: 'Marketing & Commerce',
    categoryAr: 'تسويق وتجارة إلكترونية',
    icons: [
      { name: 'ShoppingBag', label: 'Shopping Bag' },
      { name: 'ShoppingCart', label: 'Shopping Cart' },
      { name: 'Tag', label: 'Discount Tag' },
      { name: 'Percent', label: 'Percentage' },
      { name: 'BadgePercent', label: 'Promo Badge' },
      { name: 'Sparkles', label: 'Special Offer' },
      { name: 'Flame', label: 'Hot Deals' },
      { name: 'Zap', label: 'Flash Sale' },
      { name: 'Gift', label: 'Free Gift' },
      { name: 'CreditCard', label: 'Credit Card' },
      { name: 'DollarSign', label: 'Price' },
      { name: 'Wallet', label: 'Digital Wallet' },
      { name: 'Coins', label: 'Coins / Points' },
      { name: 'Package', label: 'Shipping Box' },
      { name: 'Store', label: 'Storefront' },
      { name: 'Truck', label: 'Fast Delivery' },
      { name: 'Receipt', label: 'Invoice' },
      { name: 'Banknote', label: 'Cash' },
      { name: 'Barcode', label: 'Barcode' },
      { name: 'Boxes', label: 'Inventory' },
      { name: 'ShoppingBasket', label: 'Basket' },
      { name: 'Calculator', label: 'Calculator' },
      { name: 'BadgeDollarSign', label: 'Cashback' },
      { name: 'TrendingUp', label: 'Sales Growth' }
    ]
  },
  {
    category: 'Badges & UI',
    categoryAr: 'شارات وأوسمة وتقييم',
    icons: [
      { name: 'Award', label: 'Award' },
      { name: 'CheckCircle2', label: 'Verified' },
      { name: 'Star', label: 'Star Rating' },
      { name: 'ShieldCheck', label: 'Security' },
      { name: 'Crown', label: 'VIP Crown' },
      { name: 'Trophy', label: 'Trophy' },
      { name: 'Medal', label: 'Medal' },
      { name: 'Heart', label: 'Favorite' },
      { name: 'ThumbsUp', label: 'Thumbs Up' },
      { name: 'ThumbsDown', label: 'Dislike' },
      { name: 'Bookmark', label: 'Save / Bookmark' },
      { name: 'Clock', label: 'Time' },
      { name: 'Calendar', label: 'Date' },
      { name: 'Bell', label: 'Alert' },
      { name: 'Eye', label: 'Preview' },
      { name: 'EyeOff', label: 'Hidden' },
      { name: 'Filter', label: 'Filter' },
      { name: 'Share2', label: 'Share' },
      { name: 'MapPin', label: 'Location' },
      { name: 'Check', label: 'Checkmark' },
      { name: 'Plus', label: 'Add / Plus' },
      { name: 'Minus', label: 'Remove' },
      { name: 'Trash', label: 'Delete' },
      { name: 'Info', label: 'Information' },
      { name: 'HelpCircle', label: 'Support' }
    ]
  },
  {
    category: 'Arrows & Direction',
    categoryAr: 'أسهم وتوجيه وحركة',
    icons: [
      { name: 'ArrowRight', label: 'Arrow Right' },
      { name: 'ArrowLeft', label: 'Arrow Left' },
      { name: 'ArrowUp', label: 'Arrow Up' },
      { name: 'ArrowDown', label: 'Arrow Down' },
      { name: 'ArrowUpRight', label: 'Up Right' },
      { name: 'ChevronRight', label: 'Chevron Right' },
      { name: 'ChevronLeft', label: 'Chevron Left' },
      { name: 'ChevronUp', label: 'Chevron Up' },
      { name: 'ChevronDown', label: 'Chevron Down' },
      { name: 'MoveRight', label: 'Long Arrow' },
      { name: 'MousePointerClick', label: 'CTA Click' },
      { name: 'Compass', label: 'Compass' },
      { name: 'RefreshCw', label: 'Refresh / Sync' },
      { name: 'RotateCcw', label: 'Undo' },
      { name: 'Maximize', label: 'Full Screen' },
      { name: 'Minimize', label: 'Minimize' },
      { name: 'Move', label: 'Move Object' },
      { name: 'CornerRightDown', label: 'Curved Arrow' },
      { name: 'Navigation', label: 'GPS / Navigation' },
      { name: 'Crosshair', label: 'Target / Focus' },
      { name: 'ExternalLink', label: 'External Link' },
      { name: 'LocateFixed', label: 'Current Pin' }
    ]
  },
  {
    category: 'Tech & Media',
    categoryAr: 'تقنية، ميديا وأجهزة',
    icons: [
      { name: 'Laptop', label: 'Laptop' },
      { name: 'Monitor', label: 'Display' },
      { name: 'Tv', label: 'Television' },
      { name: 'Headphones', label: 'Headphones' },
      { name: 'Mic', label: 'Microphone' },
      { name: 'Camera', label: 'Camera' },
      { name: 'Video', label: 'Video Recorder' },
      { name: 'Music', label: 'Music Note' },
      { name: 'Cpu', label: 'AI Processor' },
      { name: 'Wifi', label: 'Wifi Signal' },
      { name: 'BatteryCharging', label: 'Battery Charging' },
      { name: 'Server', label: 'Server Rack' },
      { name: 'Database', label: 'Database' },
      { name: 'Cloud', label: 'Cloud Storage' },
      { name: 'Code', label: 'Code Bracket' },
      { name: 'Terminal', label: 'Terminal / CLI' },
      { name: 'Lock', label: 'Security Lock' },
      { name: 'Key', label: 'Security Key' },
      { name: 'Bluetooth', label: 'Bluetooth' },
      { name: 'HardDrive', label: 'Storage Disk' },
      { name: 'Usb', label: 'USB Port' },
      { name: 'Radio', label: 'Wireless Radio' },
      { name: 'Cast', label: 'Screen Cast' },
      { name: 'Volume2', label: 'Sound / Volume' }
    ]
  },
  {
    category: 'Design & Creative',
    categoryAr: 'تصميم، ألوان وإبداع',
    icons: [
      { name: 'Palette', label: 'Color Palette' },
      { name: 'Brush', label: 'Paint Brush' },
      { name: 'Crop', label: 'Crop Tool' },
      { name: 'Layers', label: 'Layer Hierarchy' },
      { name: 'Layout', label: 'Layout Grid' },
      { name: 'Grid', label: 'Alignment Grid' },
      { name: 'Type', label: 'Typography' },
      { name: 'Wand2', label: 'Magic Wand' },
      { name: 'Shapes', label: 'Geometric Shapes' },
      { name: 'Scissors', label: 'Cut / Scissors' },
      { name: 'SlidersHorizontal', label: 'Adjustments' },
      { name: 'Sun', label: 'Light Mode / Sun' },
      { name: 'Moon', label: 'Dark Mode / Moon' },
      { name: 'Droplet', label: 'Color Dropper' },
      { name: 'Feather', label: 'Art Feather' },
      { name: 'Box', label: '3D Box' },
      { name: 'Spline', label: 'Curves' },
      { name: 'Eraser', label: 'Eraser' },
      { name: 'PenTool', label: 'Vector Pen' },
      { name: 'Pipette', label: 'Eyedropper' }
    ]
  },
  {
    category: 'Lifestyle & Health',
    categoryAr: 'حياة، صحة وسفر',
    icons: [
      { name: 'Coffee', label: 'Coffee Cup' },
      { name: 'Utensils', label: 'Dining' },
      { name: 'Dumbbell', label: 'Gym Workout' },
      { name: 'HeartPulse', label: 'Health Pulse' },
      { name: 'Plane', label: 'Flight Travel' },
      { name: 'Car', label: 'Automotive' },
      { name: 'Rocket', label: 'Launch Rocket' },
      { name: 'Briefcase', label: 'Business Bag' },
      { name: 'Building', label: 'Skyscraper' },
      { name: 'Book', label: 'Reading Book' },
      { name: 'GraduationCap', label: 'Education' },
      { name: 'User', label: 'Profile' },
      { name: 'Users', label: 'Community' },
      { name: 'UserPlus', label: 'Add Member' },
      { name: 'Folder', label: 'Folder' },
      { name: 'FileText', label: 'Document' },
      { name: 'Search', label: 'Search' },
      { name: 'Settings', label: 'Settings' }
    ]
  }
];

export const INITIAL_MOCK_PROJECTS: ProjectItem[] = [
  {
    id: 'proj-gp-1',
    title: 'الصورة المميزة لتطبيق الذكاء الاصطناعي - جوجل بلاي',
    width: 1024,
    height: 500,
    category: 'Google Play Feature',
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 3600000 * 4,
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80',
    canvasData: {
      background: '#0B132B',
      objects: [
        {
          type: 'rect',
          left: 512,
          top: 250,
          originX: 'center',
          originY: 'center',
          width: 980,
          height: 460,
          fill: '#1C2541',
          rx: 24,
          ry: 24,
          stroke: '#38BDF8',
          strokeWidth: 2
        },
        {
          type: 'textbox',
          left: 180,
          top: 140,
          text: '⚡ المساعد الذكي الفائق',
          fontSize: 38,
          fontFamily: 'Cairo',
          fontWeight: 900,
          fill: '#38BDF8',
          textAlign: 'right'
        }
      ]
    }
  },
  {
    id: 'proj-1',
    title: 'حملة تخفيضات الصيف الكبرى 2026',
    width: 1080,
    height: 1080,
    category: 'Instagram Post',
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 1,
    thumbnail: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=500&auto=format&fit=crop&q=80',
    canvasData: {
      background: '#0F172A',
      objects: [
        {
          type: 'circle',
          left: 540,
          top: 540,
          originX: 'center',
          originY: 'center',
          radius: 440,
          fill: '#1E293B',
          stroke: '#EF4444',
          strokeWidth: 8
        },
        {
          type: 'textbox',
          left: 540,
          top: 420,
          originX: 'center',
          originY: 'center',
          text: 'خصم 50% OFF',
          fontSize: 78,
          fontFamily: 'Cairo',
          fontWeight: 900,
          fill: '#FACC15',
          textAlign: 'center'
        }
      ]
    }
  }
];
