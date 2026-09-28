/**
 * Locale de référence. `en.ts` est typé `typeof ar`, donc c'est ce fichier qui
 * définit le contrat : y ajouter une cle fait echouer `vue-tsc` sur `en.ts`
 * jusqu'a ce qu'elle soit traduite.
 *
 * Surtout PAS de `as const` : chaque valeur deviendrait son propre type
 * litteral, et toute traduction serait alors refusee comme n'etant pas la
 * chaine arabe.
 *
 * L'interface reste en sens LTR quelle que soit la langue (choix assume, voir
 * `langues.ts`) : seul le texte arabe se dispose de droite a gauche, par bidi.
 * Les guillemets et les espaces font partie de la traduction, pas du code — aucun
 * composant ne doit les ajouter lui-meme.
 */
export default {
  app: {
    /**
     * Nom du produit, non traduit. `title` sert de `document.title`.
     */
    name: 'bloub',
    title: 'bloub — أفاتار SVG متحرك',
    botAria: 'أفاتار bloub المتحرك'
  },

  gallery: {
    back: 'العودة إلى المشغّل',
    intro: 'مونتاجات جاهزة، منسّقة يدويًا — اضغط «تحميل» ليُضاف إلى قائمتك وتشاهله فورًا.',
    charger: 'تحميل'
  },

  presets: {
    accueil: 'ترحيب',
    accueil_detail: 'غمزة ودهشة خفيفة — أفضل افتتاحية لظهور البوت.',
    notifications: 'إشعارات',
    notifications_detail: 'نبض الإشعارات مع علامة التعجب، لجذب الانتباه بسرعة.',
    reflexion: 'تفكير',
    reflexion_detail: 'لحظة بحث… ثم برق الفكرة وانطلاق التشغيل.',
    joie: 'فرح',
    joie_detail: 'حماس وضحك ينتهيان بانفجار صغير من الفرح.',
    nuit: 'ليل',
    nuit_detail: 'نوم هادئ متقطع بنظرة — مناسب للوضع الليلي.',
    surprises: 'مفاجآت',
    surprises_detail: 'دهشة، بيضة، سداسي، ومذنّب — تسلسل غير متوقع.'
  },

  integration: {
    intro: 'انسخ البوت إلى أي صفحة: الكود أدناه يحمل الرسم كاملًا داخله — الصقه وهو يعمل بدون أي استضافة.',
    format: 'الصيغة',
    statique: 'ثابت',
    anime: 'متحرك',
    taille: 'الحجم بالبكسل',
    fond: 'الخلفية',
    fond_clair: 'فاتحة',
    fond_nuit: 'داكنة',
    fond_transparent: 'شفافة',
    generer: 'توليد الكود المتحرك',
    code: 'الكود الجاهز للصق',
    copier: 'نسخ الكود',
    telecharger: 'تنزيل SVG متحرك',
    vide: 'اضغط «توليد الكود المتحرك» أولًا.',
    video_hint: 'لفيديو MP4 أو GIF أو ورقة Sprites لمونتاجك الكامل: صدّرها من شاشة الحركات.'
  },

  rail: {
    nav: 'الأقسام',
    customize: 'تخصيص',
    animations: 'الحركات',
    galerie: 'المعرض',
    integration: 'التضمين',
    elements: 'العناصر',
    settings: 'الإعدادات'
  },

  panel: {
    /**
     * Au SINGULIER, comme les autres : un titre de grille nomme ce qu'un clic
     * pose, pas le nombre de vignettes proposees.
     */
    animations: 'حركة',
    moves: '{n} حركة',
    shape: 'الشكل',
    expression: 'التعبير',
    color: 'اللون',
    mouth: 'الفم',
    surprise: 'فاجئني',
    couleur_perso: 'لون مخصص'
  },

  /**
   * Barre d'export de la vue Personnaliser. Les libelles du menu sont des
   * ACTIONS et pas des noms de format.
   */
  export: {
    action: 'تصدير بصيغة PNG',
    more: 'صيغ أخرى',
    png: 'تنزيل PNG',
    svg: 'تنزيل SVG',
    anime: 'تنزيل SVG متحرك',
    gif: 'تنزيل GIF متحرك',
    cycleDetail: 'الفيديو أخفّ وأسلس، وصيغة الـ GIF تعمل في أي مكان.',
    cycleFormat: 'الصيغة',
    cycle_mp4: 'فيديو MP4',
    cycle_mp4_aide: 'خفيف وسلس، يحتاج خلفية',
    cycle_gif: 'GIF متحرك',
    cycle_gif_aide: 'يعمل في أي مكان، أكبر حجمًا',
    cycle_sprites: 'ورقة Sprites ‏(PNG)',
    cycle_sprites_aide: 'كل الإطارات في شبكة واحدة، لمحركات الألعاب',
    cycleProgress: 'جارٍ التصدير…',
    cycleReessayer: 'إعادة المحاولة',
    gifTitle: 'تنزيل GIF متحرك',
    gifDetail:
      'شفافية صيغة الـ GIF كلّها أو لا شيء: بدون خلفية تخرج حافة الكرة حادّة بعض الشيء.',
    gifBackground: 'الخلفية',
    fond_blanc: 'خلفية بيضاء',
    fond_blanc_aide: 'حافة ناعمة، للأسطح الفاتحة',
    fond_transparent: 'خلفية شفافة',
    fond_transparent_aide: 'تناسب أي خلفية، بحافة حادّة بعض الشيء',
    gifConfirm: 'تنزيل',
    copie: 'نسخ الصورة',
    copieSvg: 'نسخ الـ SVG',
    done: 'تم التصدير',
    copied: 'تم النسخ',
    failed: 'فشل التصدير'
  },

  preview: {
    exit: 'إنهاء المعاينة',
    /** Nom de la touche tel qu'il est grave sur le clavier. */
    key: 'Esc'
  },

  timeline: {
    play: 'بدء التشغيل',
    pause: 'إيقاف التشغيل',
    addAnimation: 'إضافة حركة',
    preview: 'معاينة',
    export: 'تصدير المونتاج',
    share: 'نسخ رابط المشاركة',
    random: 'مونتاج عشوائي',
    blocks: '{n} بلوكس',
    blockDuplicateAria: 'تكرار {state}',
    zoom: 'تكبير المسار',
    blockAria: '{state}، {duration}',
    blockDurationAria: 'مدة {state}، {duration}',
    blockRemoveAria: 'إزالة {state}'
  },

  dialog: {
    cancel: 'إلغاء',
    nameCreateTitle: 'مونتاج جديد',
    nameRenameTitle: 'إعادة تسمية المونتاج',
    nameField: 'اسم المونتاج',
    nameCreate: 'إنشاء',
    nameRename: 'إعادة التسمية',
    removeTitle: 'حذف «{name}»؟',
    // Une seule forme : la phrase arabe ne declenche pas le pluriel, inutile
    // d'exposer un gabarit a variantes que la langue n'utilise pas ici.
    removeDetail: 'سيُفقد هذا المونتاج مع حركاته.',
    removeConfirm: 'حذف',
    importEchec: 'ملف غير صالح، لم يتم الاستيراد.',
    resetTitle: 'استعادة التسلسل الأصلي؟',
    resetDetail: 'سيُستبدل ترتيب المونتاج الحالي بالتسلسل المقيس من الفيديو المرجعي.',
    resetConfirm: 'استعادة'
  },

  cycles: {
    defaultName: 'المونتاج الافتراضي',
    newName: 'مونتاجي',
    menuNew: 'مونتاج جديد',
    menuExporter: 'تصدير JSON',
    menuImporter: 'استيراد JSON',
    menuReset: 'استعادة التسلسل الأصلي',
    menuRenameAria: 'إعادة تسمية {name}',
    menuRemoveAria: 'حذف {name}'
  },

  units: {
    seconds: '{n} ثانية',
    /** Graduation de la règle : serré, le chiffre est déjà petit. */
    secondsShort: '{n}ث'
  },

  settings: {
    title: 'الإعدادات',
    language: 'اللغة',
    appearance: 'المظهر',
    previewBackground: 'خلفية المعاينة',
    transparent: 'شفافة',
    customBackground: 'لون مخصص',
    followCursor: 'اتّباع المؤشر',
    followCursorHint: 'تتحرك العينان والفم مع مؤشر الماوس أثناء المعاينة.',
    theme_jour: 'نهاري',
    theme_nuit: 'ليلي',
    about: 'حول',
    credits: 'صُنع بكل ❤️ بواسطة {name}'
  },

  states: {
    idle: 'سكون',
    thinking: 'تفكير',
    wink: 'غمزة',
    wide: 'عيون واسعة',
    alert: 'تنبيه',
    notify: 'إشعار',
    exclaim: 'تعجّب',
    sleep: 'نوم',
    egg: 'بيضة',
    hexagon: 'سداسي',
    play: 'تشغيل',
    orbit: 'مدار',
    burst: 'انفجار',
    comet: 'مذنّب',
    bounce: 'قفزة',
    shake: 'اهتزاز',
    pulse: 'نبض',
    nod: 'إيماءة',
    jump: 'نطّة',
    dart: 'اندفاع',
    swirl: 'دوامة'
  },

  shapes: {
    cercle: 'دائرة',
    ovale: 'بيضاوي',
    oeuf: 'بيضة',
    galet: 'حصاة',
    squircle: 'سكويركل',
    capsule: 'كبسولة',
    triangle: 'مثلث',
    pentagone: 'خماسي',
    hexagone: 'سداسي',
    losange: 'معيّن',
    nuage: 'سحابة',
    goutte: 'قطرة',
    fleur: 'زهرة',
    etoile: 'نجمة',
    coeur: 'قلب',
    bouclier: 'درع'
  },

  colors: {
    encre: 'حبر',
    creme: 'كريمي',
    brun: 'بني',
    rouge: 'أحمر',
    orange: 'برتقالي',
    ambre: 'عنبري',
    vert: 'أخضر',
    turquoise: 'تركوازي',
    bleu: 'أزرق',
    violet: 'بنفسجي',
    rose: 'وردي',
    gris: 'رمادي'
  },

  mouths: {
    aucun: 'بدون',
    sourire: 'ابتسامة',
    rire: 'يضحك',
    afflige: 'حزين',
    etonne: 'منبهر'
  },

  expressions: {
    neutre: 'محايد',
    attentif: 'منتبه',
    surpris: 'مندهش',
    excite: 'متحمّس',
    heureux: 'سعيد',
    hilare: 'ضاحك',
    colere: 'غاضب',
    triste: 'حزين',
    effraye: 'خائف',
    mefiant: 'مرتاب',
    confus: 'محتار',
    curieux: 'فضولي',
    fier: 'فخور',
    timide: 'خجول',
    blase: 'غير منبهر',
    somnolent: 'نعسان',
    ebloui: 'منبهَر',
    determine: 'عازم',
    moqueur: 'ساخر',
    calme: 'هادئ',
    fatigue: 'مُرهَق',
    vertige: 'دُوخة',
    grognon: 'ناشِز',
    hesitant: 'متردّد'
  }
}
