import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { exportSite, prepareArchive, restoreSite, LIMIT, type Prepared } from './archive';
import { DATABASES } from './registry';
import './style.css';
function App() {
  const [ar, setAr] = useState(() => { try { return localStorage.getItem('unitool-lang') !== 'en'; } catch { return true; } });
  const [busy, setBusy] = useState(false), [status, setStatus] = useState('');
  const [error, setError] = useState(''), [preview, setPreview] = useState<Prepared | null>(null);
  const [confirmed, setConfirmed] = useState(false), [done, setDone] = useState(false);
  useEffect(() => {
    document.documentElement.lang = ar ? 'ar' : 'en';
    document.documentElement.dir = ar ? 'rtl' : 'ltr';
    document.title = ar ? 'التخزين والنسخ الاحتياطي | UniTool' : 'Storage & backup | UniTool';
  }, [ar]);
  useEffect(() => {
    if (!busy) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [busy]);
  const text = (a: string, e: string) => ar ? a : e;
  const run = async (task: () => Promise<void>) => {
    setBusy(true); setError(''); setDone(false);
    try { await task(); } catch (err) { setError(String(err instanceof Error ? err.message : err)); setStatus(''); }
    finally { setBusy(false); }
  };
  const download = async () => {
    const data = await exportSite(name => setStatus(text('تجهيز النسخة: ', 'Preparing backup: ') + name));
    const blob = new Blob([data.slice().buffer], { type: 'application/zip' });
    const url = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = url; link.download = `UniTool-backup-${new Date().toISOString().slice(0, 10)}.zip`;
    document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000);
    setStatus(text('تم تجهيز ملف ZIP وبدء التنزيل. احتفظ به في مكان آمن.', 'ZIP prepared and download started. Keep it somewhere safe.'));
  };
  return <div className="storage-app" dir={ar ? 'rtl' : 'ltr'}>
    <header><a href="/index.html" className="brand"><img src="/favicon.svg" alt="" />UniTool</a><nav><a href="/index.html">{text('الرئيسية', 'Home')}</a><a href="/app.html">{text('الأدوات', 'Tools')}</a><button onClick={() => setAr(!ar)}>{ar ? 'English' : 'العربية'}</button></nav></header>
    <main>
      <p className="eyebrow">YOUR WORK. WITH YOU.</p>
      <h1>{text('التخزين والنسخ الاحتياطي للموقع', 'Site storage & backup')}</h1>
      <p className="lead">{text('مشروعاتك المحفوظة وإعداداتك في ملف ZIP واحد، منظّم لمجلدات حسب الأقسام. انقله لجهاز آخر واستعد شغلك من نفس موقع UniTool.', 'Saved projects and settings in one ZIP, organized by section. Move it to another device and restore it on the same UniTool site.')}</p>
      <aside className="notice">{text('احفظ شغلك في كل أداة واقفل تبويبات الموقع الأخرى أولًا. النسخة تشمل البيانات المحفوظة فقط، مش الملفات المفتوحة في الذاكرة أو كل عملياتك السابقة. لا تشمل كلمات المرور أو مفاتيح API المعروفة، ولا ملفات الكاش أو الكوكيز. ملف ZIP غير مشفّر وقد يحتوي صورًا ونصوصًا خاصة.', 'Save your work in each tool and close other site tabs first. Only persisted data is included, not unsaved files or a history of everything you did. Known passwords/API keys, caches and cookies are excluded. The ZIP is not encrypted and may contain private images or text.')}</aside>
      <div className="cards">
        <section className="card"><span className="step">01 / EXPORT</span><h2>{text('خذ نسخة من شغلك', 'Take your work with you')}</h2><p>{text('التصميم، الشعارات، الفيديو ووسائطه المحفوظة، الجداول، القراءة الصوتية، SVG وتفضيلات الأدوات.', 'Designs, logos, saved video projects/media, spreadsheets, audio-reader data, SVG and tool preferences.')}</p>
          <ul>{['design / designcraft', 'logos / projects & assets', 'video / projects & media', 'sheets · audio · svg · settings'].map(s => <li key={s} dir="ltr">{s}</li>)}</ul>
          <p className="muted">{text('حد أمان: 128 MB قبل الضغط؛ النسخ الأكبر تتوقف برسالة واضحة ولا تُنزّل نسخة ناقصة. احتفظ بملفات الوسائط الكبيرة الأصلية منفصلة.', 'Safety limit: 128 MB before compression. Larger backups stop with an error, not an incomplete download. Keep large original media files separately.')}</p>
          <button className="primary" disabled={busy} onClick={() => run(download)}>{text('تنزيل نسخة ZIP كاملة', 'Download full ZIP backup')}</button>
        </section>
        <section className="card"><span className="step">02 / RESTORE</span><h2>{text('رجّع شغلك على الجهاز', 'Restore on this device')}</h2><p>{text('اختر نسخة أنشأتها بنفسك أو تثق بمصدرها فقط. هنراجع سلامتها ونُظهر محتواها قبل كتابة أي بيانات.', 'Only use a backup you made or trust. We validate it and preview its contents before writing any data.')}</p>
          <label className="file-button">{text('اختيار ملف النسخة الاحتياطية', 'Choose backup ZIP')}<input data-testid="backup-input" type="file" accept=".zip,application/zip" disabled={busy} onChange={e => {
            const file = e.target.files?.[0]; e.target.value = ''; setPreview(null); setConfirmed(false);
            if (!file) return;
            run(async () => { if (file.size > LIMIT) throw Error(text('الملف أكبر من حد الأمان 128 MB', 'File exceeds the 128 MB safety limit')); setStatus(text('فحص الملف والأصول…', 'Validating archive and assets…')); setPreview(await prepareArchive(new Uint8Array(await file.arrayBuffer()))); setStatus(''); });
          }} /></label>
          {preview && <div data-testid="backup-preview" className="preview"><h3>{text('معاينة النسخة', 'Backup preview')}</h3><p>{new Date(preview.manifest.created).toLocaleString(ar ? 'ar-EG' : 'en-US')}</p><p>{text('سجلات المشروعات والوسائط: ', 'Project/media records: ')}<b>{preview.records}</b> · {text('إعدادات: ', 'Settings: ')}<b>{preview.local.length}</b></p><p>{(preview.bytes / 1024 / 1024).toFixed(2)} MB</p><ul>{preview.databases.map(db => <li key={db.name} dir="ltr">{DATABASES[db.name].section} / {db.name} · {db.stores.reduce((n,s) => n + s.records.length, 0)}</li>)}</ul>
            <p>{text('الاستعادة تضيف الناقص فقط؛ أي سجل أو إعداد موجود بنفس المفتاح يُترك كما هو. لا نحذف بياناتك الحالية. لو حصل فشل بين الأقسام قد تكون بعض البيانات اتضافت؛ تقدر تعيد المحاولة بأمان بعد حل السبب.', 'Restore adds missing records only; existing keys/settings are kept. Nothing is deleted. A failure between sections can leave some records restored; you can safely retry after fixing the cause.')}</p>
            <label className="confirm"><input type="checkbox" checked={confirmed} disabled={busy} onChange={e => setConfirmed(e.target.checked)} />{text('حفظت شغلي وأغلقت التبويبات الأخرى وأوافق على الإضافة بدون استبدال.', 'I saved my work, closed other tabs, and approve adding without replacing existing data.')}</label>
            <button className="primary" disabled={busy || !confirmed} onClick={() => run(async () => { const result = await restoreSite(preview, setStatus); setStatus(text(`اكتملت الاستعادة: أُضيف ${result.added} وتُرك ${result.skipped} موجودًا. أعد فتح أدواتك لتحميل البيانات.`, `Restore complete: ${result.added} added, ${result.skipped} existing records kept. Reopen tools to load restored data.`)); setPreview(null); setConfirmed(false); setDone(true); })}>{text('تأكيد الاستعادة الآمنة', 'Confirm safe restore')}</button>
          </div>}
        </section>
      </div>
      <div role="status" aria-live="polite" className="status">{busy && <span className="busy-dot" />}{status}</div>
      {error && <p role="alert" className="error">{error}</p>}
      {done && <a className="primary" href="/index.html">{text('افتح الموقع بعد الاستعادة', 'Open the site after restore')}</a>}
      <footer>{text('معالجة محلية بالكامل — لا يتم رفع النسخة إلى سيرفر. تخص البيانات المحفوظة على هذا العنوان والمتصفح فقط. الأقسام الجديدة تحتاج تسجيل دعم التخزين لها. تم إيقاف صفحتي استوديو النصوص وPDF؛ أدوات PDF المنفصلة ما زالت متاحة.', 'Entirely local — archives are not uploaded. Covers data saved on this site origin/browser only. New sections need a storage adapter. Text Studio and PDF Studio pages are retired; individual PDF tools remain available.')}</footer>
    </main>
  </div>;
}
createRoot(document.getElementById('root')!).render(<App />);
