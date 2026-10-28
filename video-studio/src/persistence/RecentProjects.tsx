import { useEffect, useState } from "react";
import {
  listProjects,
  deleteDraft,
  storageInfo,
  requestPersistence,
  type SavedProject,
} from "./database";
export function RecentProjects({
  revision,
  onRestore,
}: {
  revision: number;
  onRestore: (id: string) => void;
}) {
  const [records, setRecords] = useState<SavedProject[]>([]);
  const [error, setError] = useState("");
  const [info, setInfo] = useState({ usage: 0, quota: 0, persistent: false });
  const [busy, setBusy] = useState(false);
  const refresh = async () => {
    try {
      setRecords(await listProjects());
      setInfo(await storageInfo());
      setError("");
    } catch {
      setError("تخزين المتصفح غير متاح. تقدر تستخدم ملفات المشاريع JSON.");
    }
  };
  useEffect(() => {
    void refresh();
  }, [revision]);
  return (
    <section className="recent-projects" id="studio-recent">
      <div className="section-heading">
        <h2>مشاريعك على الجهاز</h2>
        <button className="text-button" onClick={() => void refresh()}>
          تحديث
        </button>
      </div>
      <p className="muted">
        حفظ تلقائي بعد آخر تعديل بـ١٫٥ ثانية. خاص بهذا المتصفح؛ احفظ نسخة JSON
        مهمة قبل مسح بيانات الموقع.
      </p>
      {info.quota > 0 && (
        <div className="storage-meter">
          <span>
            {(info.usage / 1024 / 1024).toFixed(1)} MB مستخدم من{" "}
            {(info.quota / 1024 / 1024 / 1024).toFixed(1)} GB متاح للموقع
          </span>
          <meter min={0} max={info.quota} value={info.usage} />
          {info.usage / info.quota > 0.8 && (
            <strong>
              المساحة قربت تتملي — نزّل نسخ احتياطية واحذف المشاريع غير المهمة.
            </strong>
          )}
        </div>
      )}
      <button
        className="secondary"
        disabled={info.persistent || busy}
        onClick={async () => {
          setBusy(true);
          try {
            const granted = await requestPersistence();
            if (!granted)
              setError("المتصفح لم يمنح التخزين الدائم. احتفظ بنسخة JSON.");
            setInfo(await storageInfo());
          } catch {
            setError("تعذّر طلب حماية التخزين");
          } finally {
            setBusy(false);
          }
        }}
      >
        {info.persistent
          ? "✓ حماية التخزين مفعّلة"
          : "طلب حماية التخزين من الحذف التلقائي"}
      </button>
      {error && (
        <p role="status" className="composition-error">
          {error}
        </p>
      )}
      {!records.length && (
        <p className="muted">
          لسه مفيش مشاريع محفوظة تلقائيًا. ابدأ بمقطع أو قالب.
        </p>
      )}
      <div className="recent-grid">
        {records.map((record) => (
          <article key={record.id}>
            <div>
              <b>{record.name}</b>
              <p>
                {record.project.ratio} · {record.project.clips.length} مقاطع
              </p>
              <time>{new Date(record.updatedAt).toLocaleString("ar-EG")}</time>
            </div>
            <button className="primary" onClick={() => onRestore(record.id)}>
              استرجاع المشروع
            </button>
            <button
              className="danger-link"
              disabled={busy}
              onClick={async () => {
                if (
                  !window.confirm(
                    "حذف المشروع من هذا المتصفح؟ احتفظ بنسخة JSON أولًا.",
                  )
                )
                  return;
                setBusy(true);
                try {
                  await deleteDraft(record.id);
                  await refresh();
                } catch {
                  setError("تعذّر حذف المشروع");
                } finally {
                  setBusy(false);
                }
              }}
            >
              حذف
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
