// Arabic to English Search Translation Helper for Icons, Shapes & Media Search

const AR_TO_EN_MAP: Record<string, string[]> = {
  // Common UI & Icon terms
  'نجمة': ['star', 'sparkles', 'rating', 'award'],
  'نجوم': ['star', 'sparkles', 'rating'],
  'قلب': ['heart', 'love', 'favorite'],
  'قلوب': ['heart', 'love'],
  'سهم': ['arrow', 'chevron', 'pointer'],
  'أسهم': ['arrow', 'chevron'],
  'عين': ['eye', 'view'],
  'بيت': ['home', 'house'],
  'منزل': ['home', 'house'],
  'بحث': ['search', 'zoom', 'magnifier'],
  'عدسة': ['search', 'zoom'],
  'إعدادات': ['settings', 'sliders', 'controls', 'cog', 'gear'],
  'ضبط': ['settings', 'sliders', 'controls'],
  'قفل': ['lock', 'key', 'privacy', 'protected'],
  'أمان': ['shield', 'lock', 'protected', 'security'],
  'حماية': ['shield', 'security', 'protected'],
  'مستخدم': ['user', 'profile', 'person', 'account'],
  'حساب': ['user', 'account', 'profile'],
  'شخص': ['user', 'person', 'people', 'profile'],
  'أشخاص': ['people', 'users', 'group'],
  'هاتف': ['phone', 'mobile', 'smartphone'],
  'تليفون': ['phone', 'mobile'],
  'موبايل': ['smartphone', 'phone', 'mobile'],
  'رسالة': ['mail', 'message', 'send'],
  'رسائل': ['messages', 'mail'],
  'بريد': ['mail', 'email'],
  'إيميل': ['email', 'mail'],
  'تشغيل': ['play', 'video'],
  'فيديو': ['video', 'play', 'youtube'],
  'تحميل': ['download'],
  'تنزيل': ['download'],
  'مشاركة': ['share', 'send'],
  'حذف': ['trash', 'delete', 'remove'],
  'سلة': ['trash', 'cart', 'shopping'],
  'تعديل': ['edit', 'pencil', 'pen'],
  'قلم': ['pen', 'pencil', 'edit'],
  'زائد': ['plus', 'add'],
  'إضافة': ['plus', 'add'],
  'اضافة': ['plus', 'add'],
  'صح': ['check', 'checkcircle'],
  'تأكيد': ['check', 'checkcircle'],
  'غلق': ['close', 'x'],
  'إلغاء': ['close', 'x'],
  'نار': ['flame', 'fire', 'zap'],
  'شعلة': ['flame', 'fire'],
  'شمس': ['sun', 'light', 'sparkles'],
  'ضوء': ['sun', 'light', 'zap'],
  'قمر': ['moon'],
  'ليل': ['moon', 'dark'],
  'ألعاب': ['gamepad', 'games', 'console'],
  'العاب': ['gamepad', 'games'],
  'جيمنج': ['gamepad', 'esports', 'games'],
  'موسيقى': ['music', 'podcast', 'volume', 'radio'],
  'صوت': ['volume', 'music', 'podcast'],
  'تسوق': ['shopping', 'cart', 'bag', 'store'],
  'عربة': ['cart', 'shopping'],
  'متجر': ['store', 'shop', 'cart'],
  'تاج': ['crown', 'vip'],
  'ملكي': ['crown', 'vip', 'shield'],
  'وسام': ['medal', 'award', 'badge'],
  'جائزة': ['award', 'medal', 'trophy'],
  'ختم': ['seal', 'badge'],
  'شارة': ['badge', 'seal', 'star'],
  'شريط': ['ribbon', 'banner'],
  'بانر': ['banner', 'ribbon'],
  'فقاعة': ['bubble', 'message', 'chat'],
  'محادثة': ['chat', 'message', 'bubble'],
  'واتساب': ['whatsapp', 'messagecircle'],
  'فيسبوك': ['facebook'],
  'تويتر': ['twitter'],
  'انستغرام': ['instagram'],
  'إنستغرام': ['instagram'],
  'يوتيوب': ['youtube'],
  'موقع': ['globe', 'website'],
  'شبكة': ['wifi', 'globe'],
  'واي فاي': ['wifi'],
  'كاميرا': ['camera'],
  'صورة': ['image', 'camera', 'photo'],
  'صور': ['image', 'photo'],
  'دائرة': ['circle'],
  'مستطيل': ['rect', 'rectangle'],
  'مربع': ['square', 'box'],
  'مثلث': ['triangle'],
  'سداسي': ['hexagon', 'hex'],
  'ثماني': ['octagon'],
  'درع': ['shield'],
  'غيمة': ['cloud'],
  'سحابة': ['cloud'],
  'ساعة': ['watch', 'time', 'clock'],
  'وقت': ['time', 'clock', 'watch'],
  'تقويم': ['calendar'],
  'تاريخ': ['calendar', 'date']
};

export const getEnglishKeywordsForSearch = (query: string): string[] => {
  const clean = query.trim().toLowerCase();
  if (!clean) return [];

  const results = new Set<string>();
  results.add(clean);

  const words = clean.split(/\s+/);

  for (const word of words) {
    if (!word) continue;
    const stripped = word.replace(/^(ال|و|ب|ك|ل)/, '');

    for (const [arKey, enTerms] of Object.entries(AR_TO_EN_MAP)) {
      if (
        arKey === word ||
        arKey === stripped ||
        (stripped.length > 2 && arKey.includes(stripped)) ||
        (word.length > 2 && arKey.includes(word))
      ) {
        enTerms.forEach((t) => results.add(t.toLowerCase()));
      }
    }
  }

  return Array.from(results);
};
