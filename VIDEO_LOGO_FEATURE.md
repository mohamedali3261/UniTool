# ميزة إضافة لوجو للفيديو / Video Logo Feature

## المميزات / Features

### العربية
- ✅ رفع فيديو من الجهاز (MP4, MOV, AVI, WebM)
- ✅ رفع صورة لوجو (PNG, JPG, SVG - يفضل خلفية شفافة)
- ✅ **سحب وإفلات اللوجو يدوياً** على الفيديو
- ✅ **تكبير وتصغير اللوجو**:
  - باستخدام عجلة الماوس (Scroll Wheel)
  - باستخدام أزرار + و -
  - باستخدام Slider
- ✅ معاينة مباشرة للوجو على الفيديو
- ✅ مواضع سريعة (9 مواضع جاهزة)
- ✅ **جودة عالية**: CRF 18 (بدون فقدان ملحوظ في الجودة)
- ✅ معالجة الفيديو في المتصفح بدون رفع للخادم

### English
- ✅ Upload video from device (MP4, MOV, AVI, WebM)
- ✅ Upload logo image (PNG, JPG, SVG - transparent background preferred)
- ✅ **Drag and drop logo** directly on video preview
- ✅ **Scale logo** in/out:
  - Using mouse scroll wheel
  - Using + and - buttons
  - Using slider control
- ✅ Real-time preview of logo on video
- ✅ Quick presets (9 predefined positions)
- ✅ **High Quality**: CRF 18 (visually lossless)
- ✅ Client-side processing (no server upload)

## كيفية الاستخدام / How to Use

### العربية
1. اضغط على "لوجو فيديو" في القائمة العلوية
2. اختر ملف الفيديو من جهازك
3. اختر صورة اللوجو
4. **حرك اللوجو بالسحب** على الفيديو مباشرة
5. **استخدم عجلة الماوس** لتكبير أو تصغير اللوجو
6. أو استخدم الأزرار والـ Sliders في لوحة التحكم
7. اضبط الموضع والحجم حسب رغبتك
8. اضغط "إضافة اللوجو" لبدء المعالجة
9. انتظر حتى تكتمل المعالجة
10. حمل الفيديو النهائي

### English
1. Click "Video Logo" in the top menu
2. Select video file from your device
3. Select logo image
4. **Drag the logo** directly on the video preview
5. **Use mouse wheel** to zoom in/out
6. Or use buttons and sliders in control panel
7. Adjust position and scale as desired
8. Click "Add Logo" to start processing
9. Wait for processing to complete
10. Download the final video

## التحكم بالتفصيل / Controls Details

### السحب والإفلات / Drag & Drop
- **اسحب اللوجو** مباشرة على معاينة الفيديو
- **Drag the logo** directly on the video preview
- ستظهر أيقونة يد عند التمرير فوق موضع اللوجو
- A hand icon appears when hovering over logo position

### التكبير والتصغير / Zoom In/Out
1. **عجلة الماوس** (Mouse Wheel):
   - مرر للأعلى = تكبير / Scroll up = Zoom in
   - مرر للأسفل = تصغير / Scroll down = Zoom out

2. **الأزرار** (Buttons):
   - زر + (أخضر) = تكبير / + button (green) = Zoom in
   - زر - (أحمر) = تصغير / - button (red) = Zoom out

3. **Slider**:
   - حرك السلايدر من 5% إلى 200%
   - Move slider from 5% to 200%

### المواضع السريعة / Quick Presets
- 9 مواضع جاهزة
- 9 predefined positions
- أعلى يسار/وسط/يمين - Top Left/Center/Right
- وسط يسار/مركز/يمين - Middle Left/Center/Right
- أسفل يسار/وسط/يمين - Bottom Left/Center/Right

## الجودة / Quality

### إعدادات FFmpeg
```
-c:v libx264      # H.264 codec
-crf 18          # High quality (18 = visually lossless)
-preset slow     # Better quality
-c:a copy        # Audio without re-encoding
```

- **CRF 18**: جودة عالية جداً بدون فقدان ملحوظ
- **CRF 18**: Very high quality, visually lossless
- **preset slow**: جودة أفضل (يستغرق وقت أطول)
- **preset slow**: Better quality (takes longer)
- **Audio copy**: نسخ الصوت بدون إعادة ترميز
- **Audio copy**: No audio re-encoding

## المتطلبات التقنية / Technical Requirements

- متصفح حديث يدعم WebAssembly
- Modern browser with WebAssembly support
- FFmpeg.wasm (يتم التحميل تلقائياً)
- FFmpeg.wasm (loads automatically)
- ذاكرة كافية للمعالجة (حسب حجم الفيديو)
- Sufficient memory for processing (depends on video size)

## ملاحظات / Notes

- يتم معالجة كل شيء في المتصفح (خصوصية كاملة)
- Everything is processed in browser (full privacy)
- لا يتم رفع أي ملفات للخادم
- No files are uploaded to server
- يفضل استخدام صور لوجو بخلفية شفافة (PNG)
- Prefer logo images with transparent background (PNG)
- وقت المعالجة يعتمد على:
- Processing time depends on:
  - حجم الفيديو / Video size
  - جودة الفيديو / Video quality
  - مواصفات جهازك / Your device specs
