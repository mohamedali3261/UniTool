import {Download,Upload,HardDrive,ShieldCheck} from 'lucide-react';
import { SiteNavbar } from '../../src/components/SiteNavbar';
import { storageUsage, type UsageReport } from './usage';
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { exportSite, prepareArchive, restoreSite, LIMIT, type Prepared } from './archive';
import { DATABASES } from './registry';
import './style.css';
function App() {
  const [ar, setAr] = useState(() => { try { return localStorage.getItem('unitool-lang') !== 'en'; } catch { return true; } });
  const [usage, setUsage] = useState<UsageReport | null>(null), [usageError, setUsageError] = useState(''), [usageLoading, setUsageLoading] = useState(false);
  const refreshUsage = async () => {
    setUsageLoading(true); setUsageError('');
    try { setUsage(await storageUsage()); } catch (err) { setUsageError(String(err)); }
    finally { setUsageLoading(false); }
  };
  useEffect(() => { void refreshUsage(); }, []);
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
    <SiteNavbar lang={ar ? 'ar' : 'en'} onToggleLang={() => setAr(!ar)}/>

    <main>
      <p className="eyebrow">YOUR WORK. WITH YOU.</p>
      <h1>{text('التخزين والنسخ الاحتياطي', 'Storage & backup')}</h1>
      <p className="lead">{text('كل شغلك المحفوظ. نسخة واحدة. معاك في أي مكان.', 'All your saved work. One backup. Anywhere you go.')}</p>
      <aside className="notice"><ShieldCheck size={18}/><span>{text('احفظ عملك وأغلق التبويبات الأخرى أولًا. النسخة غير مشفّرة؛ احتفظ بها بأمان.', 'Save your work and close other tabs first. Backups are not encrypted; keep them safe.')}</span></aside>
      <div className="cards">
        <section className="card"><span className="step">01 / EXPORT</span><h2><Download size={22}/>{text('خذ نسخة من شغلك', 'Take your work with you')}</h2><p>{text('ملف ZIP واحد، بمجلد مستقل لكل قسم.', 'One ZIP, with a folder for every section.')}</p>
          <ul>{[['تصميمات','Designs'],['شعارات','Logos'],['فيديو','Video'],['جداول','Sheets'],['صوت','Audio'],['SVG','SVG']].map(([a,e])=><li key={e}>{text(a,e)}</li>)}</ul>
          <p className="muted">{text('حتى 128 MB قبل الضغط. احتفظ بالوسائط الكبيرة منفصلة.', 'Up to 128 MB before compression. Keep large media files separately.')}</p>
          <button className="primary" disabled={busy} onClick={() => run(download)}>{text('تنزيل نسخة ZIP كاملة', 'Download full ZIP backup')}</button>
        </section>
        <section className="card"><span className="step">02 / RESTORE</span><h2><Upload size={22}/>{text('رجّع شغلك على الجهاز', 'Restore on this device')}</h2><p>{text('اختر نسخة موثوقة. راجع محتواها قبل الاستعادة.', 'Choose a trusted backup. Review its contents before restoring.')}</p>
          <label className="file-button">{text('اختيار ملف النسخة الاحتياطية', 'Choose backup ZIP')}<input data-testid="backup-input" type="file" accept=".zip,application/zip" disabled={busy} onChange={e => {
            const file = e.target.files?.[0]; e.target.value = ''; setPreview(null); setConfirmed(false);
            if (!file) return;
            run(async () => { if (file.size > LIMIT) throw Error(text('الملف أكبر من حد الأمان 128 MB', 'File exceeds the 128 MB safety limit')); setStatus(text('فحص الملف والأصول…', 'Validating archive and assets…')); setPreview(await prepareArchive(new Uint8Array(await file.arrayBuffer()))); setStatus(''); });
          }} /></label>
          {preview && <div data-testid="backup-preview" className="preview"><h3>{text('معاينة النسخة', 'Backup preview')}</h3><p>{new Date(preview.manifest.created).toLocaleString(ar ? 'ar-EG' : 'en-US')}</p><p>{text('سجلات المشروعات والوسائط: ', 'Project/media records: ')}<b>{preview.records}</b> · {text('إعدادات: ', 'Settings: ')}<b>{preview.local.length}</b></p><p>{(preview.bytes / 1024 / 1024).toFixed(2)} MB</p><ul>{preview.databases.map(db => <li key={db.name} dir="ltr">{DATABASES[db.name].section} / {db.name} · {db.stores.reduce((n,s) => n + s.records.length, 0)}</li>)}</ul>
            <p>{text('الاستعادة تضيف الناقص فقط؛ أي سجل أو إعداد موجود بنفس المفتاح يُترك كما هو. لا نحذف بياناتك الحالية. لو حصل فشل بين الأقسام قد تكون بعض البيانات اتضافت؛ تقدر تعيد المحاولة بأمان بعد حل السبب.', 'Restore adds missing records only; existing keys/settings are kept. Nothing is deleted. A failure between sections can leave some records restored; you can safely retry after fixing the cause.')}</p>
            <label className="confirm"><input type="checkbox" checked={confirmed} disabled={busy} onChange={e => setConfirmed(e.target.checked)} />{text('حفظت شغلي وأغلقت التبويبات الأخرى وأوافق على الإضافة بدون استبدال.', 'I saved my work, closed other tabs, and approve adding without replacing existing data.')}</label>
            <button className="primary" disabled={busy || !confirmed} onClick={() => run(async () => { const result = await restoreSite(preview, setStatus); setStatus(text(`اكتملت الاستعادة: أُضيف ${result.added} وتُرك ${result.skipped} موجودًا. أعد فتح أدواتك لتحميل البيانات.`, `Restore complete: ${result.added} added, ${result.skipped} existing records kept. Reopen tools to load restored data.`)); setPreview(null); setConfirmed(false); setDone(true); void refreshUsage(); })}>{text('تأكيد الاستعادة الآمنة', 'Confirm safe restore')}</button>
          </div>}
        </section>
      </div>
      <section className="card storage-overview" aria-label={text('استهلاك المساحة وما يتم حفظه', 'Storage usage and saving coverage')}>
        <h2><HardDrive size={19}/>{text('مساحة جهازك', 'Your device storage')}</h2>
        <div className="usage-numbers" data-testid="storage-usage">
          <span>{text('استهلاك الموقع التقريبي: ', 'Estimated site usage: ')}<b>{usage?.usage === undefined ? '—' : (usage.usage / 1024 / 1024).toFixed(2) + ' MB'}</b></span>
          <span>{text('حصة المتصفح التقريبية: ', 'Estimated browser quota: ')}<b>{usage?.quota === undefined ? '—' : (usage.quota / 1024 / 1024).toFixed(0) + ' MB'}</b></span>
          <span>{text('بيانات الأدوات المسجّلة: ', 'Registered tool records: ')}<b>{usage ? usage.databases.reduce((n,d) => n+d.records,0) : '—'}</b></span>
        </div>
        {usageError && <p className="error" role="alert">{usageError}</p>}
        <button className="primary" disabled={usageLoading || busy} onClick={() => void refreshUsage()}>{usageLoading ? text('جارٍ الحساب…', 'Calculating…') : text('تحديث استهلاك المساحة', 'Refresh storage usage')}</button>
      </section>
      <details className="storage-details"><summary>{text('ما الذي تشملُه النسخة؟', 'What is included in a backup?')}</summary><div className="storage-help">      <aside className="notice">{text('احفظ شغلك في كل أداة واقفل تبويبات الموقع الأخرى أولًا. النسخة تشمل البيانات المحفوظة فقط، مش الملفات المفتوحة في الذاكرة أو كل عملياتك السابقة. لا تشمل كلمات المرور أو مفاتيح API المعروفة، ولا ملفات الكاش أو الكوكيز. ملف ZIP غير مشفّر وقد يحتوي صورًا ونصوصًا خاصة.', 'Save your work in each tool and close other site tabs first. Only persisted data is included, not unsaved files or a history of everything you did. Known passwords/API keys, caches and cookies are excluded. The ZIP is not encrypted and may contain private images or text.')}</aside>
        <p>{text('المشروعات المحفوظة لا تُحذف لتوفير المساحة. نقلّل التكرار فقط، ونحدّ نسخ استرداد التصميم المؤقتة إلى 24 MB، مع الاحتفاظ بأحدث نسخة.', 'Saved projects are never deleted to save space. We reduce duplicates and bound temporary design recovery history to 24 MB, always retaining the latest snapshot.')}</p>
        <p>{text('تقدير المتصفح قد يشمل الكاش، وليس حجم ملفات ZIP أو الملفات الأصلية بالضبط. قيم localStorage أدناه تقديرات نصية فقط. لا يمكن ضغط فيديو أو صورة بلا حدود من غير فقدان جودة.', 'Browser estimates may include caches; they are not exact ZIP or original-file sizes. localStorage sizes below are text estimates only. Images/videos cannot be shrunk indefinitely without quality loss.')}</p>
        {usage && <ul data-testid="storage-sections">{usage.local.map(g => <li key={g.section}><b>{g.section}</b> · {g.count} {text('إعداد/مسودة', 'settings/drafts')} · {(g.bytes / 1024).toFixed(1)} KB</li>)}{usage.databases.map(d => <li key={d.name} dir="ltr">{d.name} · {d.records} {text('سجل', 'records')}</li>)}</ul>}
        <div className="coverage-grid">
          <p><b>{text('التصميم والشعارات', 'Design & logos')}</b><br/>{text('مشروعات محفوظة واسترداد تلقائي؛ راقب حالة الحفظ قبل الإغلاق.', 'Saved projects and automatic recovery; check save status before closing.')}</p>
          <p><b>{text('الفيديو', 'Video')}</b><br/>{text('المشروع والوسائط المستخدمة المحفوظة؛ الملفات الأصلية الكبيرة تحتاج مساحة حقيقية.', 'Saved project and referenced media; large original files require real space.')}</p>
          <p><b>{text('الجداول', 'Spreadsheets')}</b><br/>{text('حفظ تلقائي للمصنف الحالي. صدّر ملفًا قبل استبداله بمصنف آخر.', 'Autosaves the current workbook. Export before replacing it with another workbook.')}</p>
          <p><b>{text('القارئ الصوتي', 'Audio reader')}</b><br/>{text('إعدادات وعلامات وتقدم القراءة وآخر 5 كتب؛ ليست مكتبة غير محدودة.', 'Settings, bookmarks, progress and the last 5 books, not an unlimited library.')}</p>
          <p><b>{text('SVG والتفضيلات', 'SVG & preferences')}</b><br/>{text('البيانات التي يحفظها المحرر بالفعل. ملف لم تحفظه لا يدخل النسخة.', 'Data the editor actually persists. Unsaved files are not included.')}</p>
          <p><b>{text('التحويل والضغط والمسح', 'Conversion, compression & scanning')}</b><br/>{text('غالبًا إعدادات فقط. ملفات الإدخال والنتائج المؤقتة لازم تنزّلها بنفسك قبل الإغلاق.', 'Usually settings only. Download input/output working files yourself before closing.')}</p>
        </div>
<p>{text('الأقسام الجديدة تحتاج تسجيل دعم التخزين. استوديو النصوص وPDF متوقفان؛ أدوات PDF المستقلة متاحة.', 'New sections need a storage adapter. Text Studio and PDF Studio are retired; independent PDF tools remain available.')}</p></div></details>
      <div role="status" aria-live="polite" className="status">{busy && <span className="busy-dot" />}{status}</div>
      {error && <p role="alert" className="error">{error}</p>}
      {done && <a className="primary" href="/index.html">{text('افتح الموقع بعد الاستعادة', 'Open the site after restore')}</a>}
      <footer>{text('معالجة محلية · بلا رفع للملفات · بيانات هذا الموقع والمتصفح فقط', 'Processed locally · No uploads · This site and browser only')}</footer>
    </main>
  </div>;
}
createRoot(document.getElementById('root')!).render(<App />);
