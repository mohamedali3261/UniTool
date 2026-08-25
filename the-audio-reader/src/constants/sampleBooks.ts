import { BookDocument, BookPage } from '../types';
import { processTextIntoChunks, detectTextLanguage } from '../utils/textProcessor';

const sampleArabicTextPages: { title: string; text: string }[] = [
  {
    title: 'مقدمة في فضل العلم والقراءة',
    text: `بسم الله الرحمن الرحيم. القراءة هي نافذة العقل على عوالم المعرفة الفسيحة، وبها ترتقي الأمم وتسمو الأفكار. إن الكتاب جليس لا يمل، وصديق لا يغدر، ومعلم ينير دروب الحياة بالحكمة والتجربة.

قال أحد الحكماء: "الكتاب هو الوعاء الوحيد الذي يجمع لك حكمة القرون الماضية في راحة يديك، ويهديك أسرار الفكر دون أن يطلب منك مقابلاً سوى التأمل والتدبر".

عندما تصغي إلى الكلمات بصوت هادئ، تتجسد المعاني في مخيلتك وتتحول السطور الصامتة إلى أصوات حية تنبض بالحياة، مما يعزز الفهم ويمنحك تجربة معرفية فريدة توازن بين متعة الاستماع وعمق الفكرة.`
  },
  {
    title: 'قوة العادات والتركيز الذهني',
    text: `إن بناء عادة القراءة اليومية، ولو لعشر دقائق فقط، كفيل بإحداث تحول جذري في مستوى وعيك وقدراتك الذهنية. العقل كالعضلة، يحتاج إلى تدريب مستمر وتغذية فكرية متجددة.

الاستماع إلى الكتب أثناء التنقل أو ممارسة الرياضة أو في أوقات الراحة يتيح لك استثمار كل دقيقة من يومك. عندما تجتمع التكنولوجيا الحديثة مع حب المعرفة، تزول كل العوائق التي تحول بينك وبين إكمال كتابك المفضل.

ابدأ اليوم برحلتك الصوتية، ودع الكلمات تأخذك في رحلة لا تنتهي نحو الاستكشاف والتطور الذاتي.`
  },
  {
    title: 'فلسفة الوقت والإنجاز',
    text: `الوقت هو رأس مال الإنسان الأغلى في هذه الحياة. من أتقن إدارة وقته، فقد ملك مفاتيح مستقبله. إن الاستفادة من التقنيات الصوتية الحديثة تمكنك من تحويل الأوقات الضائعة إلى مساحات خصبة للتعلم والإنتاجية.

تذكر دائماً أن النجاح ليس وليد صدفة عابرة، بل هو تراكم لقرارات يومية صغيرة، واختيارات واعية تقودك نحو التميز خطوة تلو الأخرى.`
  }
];

const sampleEnglishTextPages: { title: string; text: string }[] = [
  {
    title: 'The Joy and Power of Reading',
    text: `Reading is not merely an intellectual pastime; it is an expedition into the deepest corridors of human thought and emotion. A great book possesses the singular power to transport us across centuries, cultures, and dimensions of experience.

When text is spoken aloud, it awakens the ancient tradition of storytelling. The rhythm of sentences, the deliberate cadence of each pause, and the emotional resonance of words combine to form an immersive auditory sanctuary.

Listening empowers you to absorb intricate concepts while giving your eyes a well-deserved rest in this screen-saturated world.`
  },
  {
    title: 'Building Focus in a Distracted Age',
    text: `In an era defined by perpetual notifications and fleeting attention spans, deep reading has become a superpower. Deliberate attention is the currency of true mastery.

By listening attentively to long-form ideas, you train your brain to sustain focus, synthesize complex perspectives, and cultivate nuanced understanding.

Let the narration guide your imagination as you explore new horizons of philosophy, science, and human creativity.`
  }
];

function buildSampleBook(
  id: string,
  title: string,
  author: string,
  pagesData: { title: string; text: string }[],
  lang: 'ar' | 'en'
): BookDocument {
  const pages: BookPage[] = pagesData.map((p, idx) => {
    const pageNumber = idx + 1;
    const chunks = processTextIntoChunks(p.text, pageNumber, lang);
    const wordCount = p.text.trim().split(/\s+/).filter(Boolean).length;
    return {
      pageNumber,
      title: p.title,
      rawText: p.text,
      chunks,
      wordCount,
      isScannedImage: false,
    };
  });

  const totalWords = pages.reduce((acc, p) => acc + p.wordCount, 0);

  return {
    id,
    title,
    author,
    fileType: 'sample',
    fileSize: 1024 * 12,
    totalPages: pages.length,
    totalWords,
    detectedLanguage: lang,
    pages,
    dateAdded: Date.now(),
    lastReadPage: 1,
    lastReadChunkIndex: 0,
    progressPercentage: 0,
    hasOcrProcessed: false,
  };
}

export function getSampleBooks(): BookDocument[] {
  return [
    buildSampleBook(
      'sample-ar-1',
      'رحلة في عوالم الفكر والمعرفة (نموذج عربي)',
      'مقتطفات مختارة',
      sampleArabicTextPages,
      'ar'
    ),
    buildSampleBook(
      'sample-en-1',
      'The Art of Focus & Deep Listening (English Sample)',
      'Selected Essays',
      sampleEnglishTextPages,
      'en'
    ),
  ];
}
