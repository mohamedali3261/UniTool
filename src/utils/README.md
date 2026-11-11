# حفظ/تحميل الملفات — توافق سفاري (Safari downloads)

كل أزرار التحميل في UniTool (الأدوات + الاستوديوهات) تمر الآن عبر وحدة واحدة:
`src/utils/download.ts`. السبب: أنماط التحميل القديمة كانت تعمل في Chrome/Firefox
لكن **سفاري (macOS و iOS) يلغي التحميل بصمت**، فيبدو الزر كأنه لا يعمل.

## الأسباب التي كانت تُفشل التحميل في سفاري

| السبب | التأثير في سفاري | الحل |
| --- | --- | --- |
| `URL.revokeObjectURL(url)` بعد `a.click()` مباشرة (أو بعد 1–4 ثوانٍ) | WebKit يحذف الـ blob قبل بدء النقل → تنزيل ملغى | `revokeDownloadUrl` + `installDownloadGuard()` تؤجل الإلغاء للتسجيلات المستخدمة في تحميل |
| رابط `<a>` غير مضاف إلى `document` | WebKit يتجاهل النقر تمامًا | العنصر يُضاف للصفحة ويُبقى 4 ثوانٍ (`ANCHOR_LINGER_MS`) |
| `data:` URL كبير (صور/PDF من canvas) | سفاري يحدّ طول/حجم data URL | `downloadDataUrl` يحوّل البيانات إلى `Blob` أولًا |
| `download` غير مدعوم (webview قديم / iOS قديم) | لا يحدث شيء | سقوط تلقائي إلى فتح الملف في تبويب (`Share → Save to Files`) |
| أسماء ملفات تحتوي `/ : ? * " < >` أو محارف تحكم أو نقطة نهائية | مربع الحفظ يفشل أو يقص الاسم | `sanitizeFilename` |

## الاستخدام

```ts
import { downloadBlob, downloadText, downloadDataUrl, downloadUrl } from '@/utils/download';

downloadBlob(blob, 'merged.pdf');                       // Blob
downloadText(srt, 'transcript.srt');                    // نص UTF-8
downloadDataUrl(canvas.toDataURL('image/png'), 'a.png'); // data URL
downloadUrl(objectUrl, 'clip.webm');                    // رابط blob/عادي
downloadUrl(url, 'x.bin', { forceTab: true });           // إجبار الفتح في تبويب
downloadBlob(blob, 'x.png', { silent: true });           // بدون فتح نافذة مركز التحميل
```

الوحدة تُثبّت نفسها عند الاستيراد، وتُثبَّت أيضًا في `src/main.tsx` قبل الإقلاع.
`installDownloadGuard()` تحمي كذلك أي كود قديم يستدعي `revokeObjectURL` بعد النقر،
لكن **لا تلمس** روابط المعاينة (preview URLs) التي لم تُستخدم في تحميل.

## مركز التحميل (Download Center)

`DownloadPopupModal` يعرض الملف الأول/الدفعة، ويوفّر:
- إعادة التحميل مع تعديل الاسم،
- زر **«فتح في تبويب»** كمسار مضمون في سفاري،
- رسالة خطأ واضحة إذا رفض المتصفح الحفظ بدل الصمت.

## الفحوصات

```sh
npm run lint                  # tsc --noEmit
npm run test:downloads        # قواعد سفاري (DOM مزيّف يحاكي WebKit)
npm run test:tools:downloads  # Playwright: Chromium + WebKit يتحققان من حدث download
npm run build
```

`test:tools:downloads` يحتاج تنزيل متصفح WebKit:

```sh
npx playwright install webkit
# في بيئة فيها Chromium فقط:
DOWNLOADS_CHROMIUM_ONLY=1 npm run test:tools:downloads
```

## نطاق التغطية

الأدوات: PDF (دمج/تقسيم/حماية/فتح/ضغط/توقيع/محرر)، PDF↔صورة، PDF↔Word،
Word→PDF، ضغط الصور/Office/الفيديو، تحويل الصيغ، قص الصور، صورة→PDF،
ماسح المستندات، QR (توليد/مسح)، استخراج/تقسيم/تفريغ الصوت، Speech-to-Text،
الفيديو (ضغط/دمج/GIF/إطارات/لوجو/ترجمة)، ومكتبة العناصر.

الاستوديوهات: designcraft (تصدير سريع/PDF/تغليف/لقطة 3D/دفعات)، cv-studio،
pdf-studio، excel-studio، text-studio، teacher-board (PNG/PDF/JSON/تسجيل)،
the-audio-reader، video-studio، logo-designer، site-storage، ومحرر SVG (bloub).
