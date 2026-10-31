import {
  FileText, Image, Type, Shrink, Merge, Scissors, Lock, Unlock, ScanLine, Files,
  LayoutGrid, Percent, Film, Subtitles, Plus, Combine, Video, Images,
  AudioLines, FileAudio, MessageSquareText, Zap, QrCode, ScanQrCode, Briefcase, Sparkles,
  FileSignature, ArrowLeftRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface ToolEntry {
  id: string;
  icon: LucideIcon;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  gradient: string;
  border: string;
  glow: string;
  badgeAr?: string;
  badgeEn?: string;
}

export interface ToolCategory {
  id: string;
  titleAr: string;
  titleEn: string;
  taglineAr: string;
  taglineEn: string;
  icon: LucideIcon;
  accent: string;
  soft: string;
  tools: ToolEntry[];
}

export const toolCategories: ToolCategory[] = [
  {
    id: 'pdf',
    titleAr: 'أدوات PDF',
    titleEn: 'PDF Tools',
    taglineAr: 'تحويل، دمج، تقسيم، ضغط وحماية ملفات PDF',
    taglineEn: 'Convert, merge, split, compress and protect PDF files',
    icon: FileText,
    accent: 'from-red-500 to-rose-600',
    soft: 'bg-red-500/10 text-red-300 border-red-500/20',
    tools: [
      {
        id: 'imageToPdf', icon: Image,
        titleAr: 'صور → PDF', titleEn: 'Images → PDF',
        descAr: 'حوّل مجموعة صور لملف PDF واحد مع ترتيب وتدوير وقص كل صورة',
        descEn: 'Turn multiple images into one PDF with reorder, rotate and crop',
        gradient: 'from-red-500 to-rose-600', border: 'border-red-500/25 hover:border-red-400/50', glow: 'group-hover:shadow-red-500/20',
        badgeAr: 'الأكثر استخدامًا', badgeEn: 'Popular',
      },
      {
        id: 'pdfToImage', icon: Image,
        titleAr: 'PDF → صور', titleEn: 'PDF → Images',
        descAr: 'صدّر صفحات PDF كصور PNG أو JPG عالية الدقة مع قص قبل التحميل',
        descEn: 'Export PDF pages as high-res PNG or JPG with crop before download',
        gradient: 'from-orange-500 to-amber-500', border: 'border-orange-500/25 hover:border-orange-400/50', glow: 'group-hover:shadow-orange-500/20',
      },
      {
        id: 'pdfToWord', icon: Type,
        titleAr: 'PDF → Word', titleEn: 'PDF → Word',
        descAr: 'استخرج النص من PDF وحوّله لمستند Word قابل للتعديل',
        descEn: 'Extract text from PDF and convert it to an editable Word document',
        gradient: 'from-blue-500 to-indigo-600', border: 'border-blue-500/25 hover:border-blue-400/50', glow: 'group-hover:shadow-blue-500/20',
      },
      {
        id: 'wordToPdf', icon: FileText,
        titleAr: 'Word → PDF', titleEn: 'Word → PDF',
        descAr: 'حوّل ملفات Word إلى PDF مع الحفاظ على التنسيق',
        descEn: 'Convert Word documents to PDF while preserving formatting',
        gradient: 'from-cyan-500 to-blue-500', border: 'border-cyan-500/25 hover:border-cyan-400/50', glow: 'group-hover:shadow-cyan-500/20',
      },
      {
        id: 'pdfCompressor', icon: Shrink,
        titleAr: 'ضغط PDF', titleEn: 'Compress PDF',
        descAr: 'قلّل حجم ملفات PDF مع الحفاظ على وضوح المحتوى',
        descEn: 'Reduce PDF size while keeping content clear',
        gradient: 'from-emerald-500 to-teal-500', border: 'border-emerald-500/25 hover:border-emerald-400/50', glow: 'group-hover:shadow-emerald-500/20',
      },
      {
        id: 'pdfMerger', icon: Merge,
        titleAr: 'دمج ملفات PDF', titleEn: 'Merge PDF',
        descAr: 'اجمع عدة ملفات PDF في ملف واحد مع ترتيب الصفحات',
        descEn: 'Combine multiple PDF files into one with page ordering',
        gradient: 'from-violet-500 to-purple-600', border: 'border-violet-500/25 hover:border-violet-400/50', glow: 'group-hover:shadow-violet-500/20',
      },
      {
        id: 'pdfSplitter', icon: Scissors,
        titleAr: 'تقسيم PDF', titleEn: 'Split PDF',
        descAr: 'استخرج أو احذف صفحات محددة من ملف PDF',
        descEn: 'Extract or remove specific pages from a PDF',
        gradient: 'from-emerald-500 to-teal-600', border: 'border-emerald-500/25 hover:border-emerald-400/50', glow: 'group-hover:shadow-emerald-500/20',
      },
      {
        id: 'pdfProtect', icon: Lock,
        titleAr: 'حماية PDF', titleEn: 'Protect PDF',
        descAr: 'أضف كلمة مرور لحماية ملف PDF من الوصول غير المصرح به',
        descEn: 'Add a password to protect your PDF from unauthorized access',
        gradient: 'from-rose-500 to-pink-600', border: 'border-rose-500/25 hover:border-rose-400/50', glow: 'group-hover:shadow-rose-500/20',
      },
      {
        id: 'pdfUnlock', icon: Unlock,
        titleAr: 'فتح PDF محمي', titleEn: 'Unlock PDF',
        descAr: 'أزل كلمة المرور من ملف PDF محمي لتعديله أو طباعته',
        descEn: 'Remove the password from a protected PDF for editing or printing',
        gradient: 'from-amber-500 to-orange-600', border: 'border-amber-500/25 hover:border-amber-400/50', glow: 'group-hover:shadow-amber-500/20',
      },
      {
        id: 'pdfSigner', icon: FileSignature,
        titleAr: 'توقيع PDF', titleEn: 'Sign PDF',
        descAr: 'أضف توقيعك أو ختمك على أي ملف PDF بسهولة',
        descEn: 'Add your signature or stamp to any PDF file',
        gradient: 'from-lime-500 to-green-600', border: 'border-lime-500/25 hover:border-lime-400/50', glow: 'group-hover:shadow-lime-500/20',
      },
      {
        id: 'documentScanner', icon: ScanLine,
        titleAr: 'سكانر المستندات', titleEn: 'Document Scanner',
        descAr: 'صوّر مستنداتك وحسّنها واستخرج نصها ثم صدّرها PDF',
        descEn: 'Capture, enhance and OCR documents then export as PDF',
        gradient: 'from-teal-500 to-emerald-600', border: 'border-teal-500/25 hover:border-teal-400/50', glow: 'group-hover:shadow-teal-500/20',
      },
      {
        id: 'pdfTools', icon: Files,
        titleAr: 'كل أدوات PDF', titleEn: 'All PDF Tools',
        descAr: 'صفحة تجمع أدوات PDF كلها في مكان واحد',
        descEn: 'A hub that gathers every PDF tool in one place',
        gradient: 'from-red-500 to-orange-500', border: 'border-red-500/25 hover:border-red-400/50', glow: 'group-hover:shadow-red-500/20',
      },
    ],
  },
  {
    id: 'images',
    titleAr: 'أدوات الصور',
    titleEn: 'Image Tools',
    taglineAr: 'قص، ضغط وتحويل الصور بدقة عالية',
    taglineEn: 'Crop, compress and convert images with precision',
    icon: LayoutGrid,
    accent: 'from-pink-500 to-rose-600',
    soft: 'bg-pink-500/10 text-pink-300 border-pink-500/20',
    tools: [
      {
        id: 'imageCropper', icon: Scissors,
        titleAr: 'قص وتحرير الصور', titleEn: 'Crop & Edit Images',
        descAr: 'قص وتدوير وتغيير مقاسات الصور مع معاينة مباشرة',
        descEn: 'Crop, rotate and resize images with live preview',
        gradient: 'from-violet-500 to-indigo-600', border: 'border-violet-500/25 hover:border-violet-400/50', glow: 'group-hover:shadow-violet-500/20',
        badgeAr: 'محرر كامل', badgeEn: 'Full editor',
      },
      {
        id: 'imageCompressor', icon: Percent,
        titleAr: 'ضغط الصور', titleEn: 'Compress Images',
        descAr: 'قلّل حجم الصور بذكاء مع الحفاظ على الجودة',
        descEn: 'Smartly compress images while preserving quality',
        gradient: 'from-amber-500 to-orange-500', border: 'border-amber-500/25 hover:border-amber-400/50', glow: 'group-hover:shadow-amber-500/20',
      },
      {
        id: 'imageTools', icon: LayoutGrid,
        titleAr: 'كل أدوات الصور', titleEn: 'All Image Tools',
        descAr: 'تصفح أدوات الصور كلها في صفحة واحدة',
        descEn: 'Browse every image tool in a single page',
        gradient: 'from-pink-500 to-rose-600', border: 'border-pink-500/25 hover:border-pink-400/50', glow: 'group-hover:shadow-pink-500/20',
      },
    ],
  },
  {
    id: 'video',
    titleAr: 'أدوات الفيديو',
    titleEn: 'Video Tools',
    taglineAr: 'تحرير ودمج وضغط الفيديو داخل المتصفح',
    taglineEn: 'Edit, merge and compress video right in your browser',
    icon: Film,
    accent: 'from-sky-500 to-blue-600',
    soft: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
    tools: [
      {
        id: 'videoMerger', icon: Combine,
        titleAr: 'دمج الفيديوهات', titleEn: 'Merge Videos',
        descAr: 'اجمع أكثر من فيديو في ملف واحد بترتيب مرن',
        descEn: 'Combine multiple videos into one with flexible ordering',
        gradient: 'from-sky-500 to-blue-600', border: 'border-sky-500/25 hover:border-sky-400/50', glow: 'group-hover:shadow-sky-500/20',
      },
      {
        id: 'videoCompressor', icon: Video,
        titleAr: 'ضغط الفيديو', titleEn: 'Compress Video',
        descAr: 'قلّل حجم الفيديو مع الحفاظ على جودة مقبولة',
        descEn: 'Reduce video size while keeping acceptable quality',
        gradient: 'from-indigo-500 to-blue-600', border: 'border-indigo-500/25 hover:border-indigo-400/50', glow: 'group-hover:shadow-indigo-500/20',
      },
      {
        id: 'videoToGif', icon: Film,
        titleAr: 'فيديو → GIF', titleEn: 'Video → GIF',
        descAr: 'اصنع GIF متحرك من أي جزء من الفيديو',
        descEn: 'Create an animated GIF from any part of your video',
        gradient: 'from-amber-500 to-orange-600', border: 'border-amber-500/25 hover:border-amber-400/50', glow: 'group-hover:shadow-amber-500/20',
      },
      {
        id: 'videoSubtitles', icon: Subtitles,
        titleAr: 'ترجمة الفيديو', titleEn: 'Video Subtitles',
        descAr: 'أضف ترجمة أو استخرجها من الفيديو بسهولة',
        descEn: 'Add or extract subtitles from a video easily',
        gradient: 'from-cyan-500 to-teal-600', border: 'border-cyan-500/25 hover:border-cyan-400/50', glow: 'group-hover:shadow-cyan-500/20',
      },
      {
        id: 'videoLogo', icon: Plus,
        titleAr: 'إضافة لوجو للفيديو', titleEn: 'Video Logo',
        descAr: 'ضع شعارك على الفيديو في المكان والحجم اللي تحبه',
        descEn: 'Place your logo on the video at any position and size',
        gradient: 'from-emerald-500 to-teal-600', border: 'border-emerald-500/25 hover:border-emerald-400/50', glow: 'group-hover:shadow-emerald-500/20',
      },
      {
        id: 'videoFrames', icon: Images,
        titleAr: 'استخراج إطارات الفيديو', titleEn: 'Video Frames',
        descAr: 'استخرج لقطات ثابتة من أي فيديو بجودة عالية',
        descEn: 'Extract high-quality still frames from any video',
        gradient: 'from-sky-500 to-indigo-600', border: 'border-sky-500/25 hover:border-sky-400/50', glow: 'group-hover:shadow-sky-500/20',
      },
    ],
  },
  {
    id: 'audio',
    titleAr: 'أدوات الصوت',
    titleEn: 'Audio Tools',
    taglineAr: 'استخراج، تفريغ وتقسيم الصوت بدقة',
    taglineEn: 'Extract, transcribe and split audio precisely',
    icon: AudioLines,
    accent: 'from-teal-500 to-emerald-600',
    soft: 'bg-teal-500/10 text-teal-300 border-teal-500/20',
    tools: [
      {
        id: 'compress', icon: AudioLines,
        titleAr: 'ضغط الصوت', titleEn: 'Audio Compression',
        descAr: 'قلّل حجم الملفات الصوتية مع إعدادات الصيغة والجودة',
        descEn: 'Reduce audio file size with format and quality controls',
        gradient: 'from-blue-500 to-indigo-600', border: 'border-blue-500/25 hover:border-blue-400/50', glow: 'group-hover:shadow-blue-500/20',
      },
      {
        id: 'audioExtractor', icon: AudioLines,
        titleAr: 'استخراج الصوت', titleEn: 'Extract Audio',
        descAr: 'اسحب الصوت من أي فيديو بصيغ متعددة',
        descEn: 'Pull audio out of any video in multiple formats',
        gradient: 'from-emerald-500 to-teal-600', border: 'border-emerald-500/25 hover:border-emerald-400/50', glow: 'group-hover:shadow-emerald-500/20',
      },
      {
        id: 'audioTranscriber', icon: FileAudio,
        titleAr: 'تفريغ الصوت', titleEn: 'Transcribe Audio',
        descAr: 'حوّل التسجيلات الصوتية إلى نص مكتوب',
        descEn: 'Turn audio recordings into written text',
        gradient: 'from-teal-500 to-cyan-600', border: 'border-teal-500/25 hover:border-teal-400/50', glow: 'group-hover:shadow-teal-500/20',
      },
      {
        id: 'speechToText', icon: MessageSquareText,
        titleAr: 'كلام إلى نص', titleEn: 'Speech to Text',
        descAr: 'اكتب مباشرة بالكلام من الميكروفون',
        descEn: 'Dictate directly using your microphone',
        gradient: 'from-purple-500 to-fuchsia-600', border: 'border-purple-500/25 hover:border-purple-400/50', glow: 'group-hover:shadow-purple-500/20',
      },
      {
        id: 'splitter', icon: Scissors,
        titleAr: 'قص وتقسيم الصوت', titleEn: 'Split Audio',
        descAr: 'قطّع المقاطع الصوتية بسهولة وبدقة',
        descEn: 'Trim and split audio clips quickly and precisely',
        gradient: 'from-sky-500 to-blue-600', border: 'border-sky-500/25 hover:border-sky-400/50', glow: 'group-hover:shadow-sky-500/20',
      },
    ],
  },
  {
    id: 'more',
    titleAr: 'أدوات إضافية',
    titleEn: 'More Tools',
    taglineAr: 'ضغط الملفات المكتبية وأكواد QR وأكثر',
    taglineEn: 'Office file compression, QR codes and more',
    icon: Sparkles,
    accent: 'from-indigo-500 to-violet-600',
    soft: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
    tools: [
      {
        id: 'compressionTools', icon: Zap,
        titleAr: 'أدوات الضغط', titleEn: 'Compression Tools',
        descAr: 'اضغط فيديو، صوت، صور وملفات PDF من مكان واحد',
        descEn: 'Compress video, audio, images and PDF in one place',
        gradient: 'from-indigo-500 to-blue-600', border: 'border-indigo-500/25 hover:border-indigo-400/50', glow: 'group-hover:shadow-indigo-500/20',
      },
      {
        id: 'officeCompressor', icon: Briefcase,
        titleAr: 'ضغط ملفات الأوفيس', titleEn: 'Office Compressor',
        descAr: 'قلّل حجم مستندات Word و PowerPoint',
        descEn: 'Reduce the size of Word and PowerPoint documents',
        gradient: 'from-blue-500 to-indigo-600', border: 'border-blue-500/25 hover:border-blue-400/50', glow: 'group-hover:shadow-blue-500/20',
      },
      {
        id: 'qrCode', icon: QrCode,
        titleAr: 'مولد QR', titleEn: 'QR Generator',
        descAr: 'أنشئ أكواد QR بألوان وشعار مخصص',
        descEn: 'Create QR codes with custom colors and logo',
        gradient: 'from-cyan-500 to-blue-600', border: 'border-cyan-500/25 hover:border-cyan-400/50', glow: 'group-hover:shadow-cyan-500/20',
      },
      {
        id: 'qrScanner', icon: ScanQrCode,
        titleAr: 'قارئ QR', titleEn: 'QR Scanner',
        descAr: 'امسح أي كود QR بكاميرا جهازك أو من صورة',
        descEn: 'Scan any QR code with your camera or from an image',
        gradient: 'from-blue-500 to-cyan-600', border: 'border-blue-500/25 hover:border-blue-400/50', glow: 'group-hover:shadow-blue-500/20',
      },
      {
        id: 'formatConverter', icon: ArrowLeftRight,
        titleAr: 'محول الصيغ', titleEn: 'Format Converter',
        descAr: 'حوّل بين صيغ الصور والملفات المختلفة بسرعة',
        descEn: 'Quickly convert between different image and file formats',
        gradient: 'from-fuchsia-500 to-purple-600', border: 'border-fuchsia-500/25 hover:border-fuchsia-400/50', glow: 'group-hover:shadow-fuchsia-500/20',
      },
    ],
  },
];

export const totalToolCount = toolCategories.reduce((sum, c) => sum + c.tools.length, 0);
