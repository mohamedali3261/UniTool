import type { RecoveryPoint } from "../core/recovery";
import { deleteRecovery } from "../core/recovery";
import { parseProjectFile } from "../../utils/projectFile";
import type { ProjectItem } from "../../types";
import { Note, t, type Props } from "./shared";
export function RecoverySection({
  ar,
  project,
  run,
  points,
  status,
  onRestore,
  checkpoint,
  refresh,
}: Props & {
  points: RecoveryPoint[];
  status: string;
  onRestore: (p: ProjectItem) => Promise<void>;
  checkpoint: () => Promise<void>;
  refresh: () => Promise<void>;
}) {
  return (
    <>
      <p role="status">
        {t(ar, "حالة الاسترداد: ", "Recovery status: ")}
        {status}
      </p>
      <div className="adv-grid">
        <button onClick={() => run(checkpoint, false)}>
          {t(ar, "حفظ نقطة استرداد الآن", "Save recovery point now")}
        </button>
        <button onClick={() => run(refresh, false)}>
          {t(ar, "تحديث نقاط الاسترداد", "Refresh recovery points")}
        </button>
        <button
          onClick={() =>
            run(async () => {
              if (
                confirm(
                  t(
                    ar,
                    "حذف نقاط هذا المشروع؟",
                    "Delete this project’s recovery points?",
                  ),
                )
              ) {
                await deleteRecovery(project.id);
                await refresh();
              }
            }, false)
          }
        >
          {t(ar, "حذف نقاط هذا المشروع", "Delete project recovery points")}
        </button>
      </div>
      <ul>
        {points.map((point) => (
          <li key={point.id}>
            <time>
              {new Date(point.created).toLocaleString(ar ? "ar" : "en")}
            </time>
            <button
              onClick={() =>
                run(async () => {
                  if (
                    !confirm(
                      t(
                        ar,
                        "استعادة هذه النسخة؟ سنحفظ نسخة من الوضع الحالي أولًا.",
                        "Restore this version? A current recovery point is saved first.",
                      ),
                    )
                  )
                    return;
                  await checkpoint();
                  const next = parseProjectFile(JSON.parse(point.data));
                  await onRestore({ ...next, id: project.id });
                }, false)
              }
            >
              {t(ar, "استعادة النسخة", "Restore version")}
            </button>
          </li>
        ))}
      </ul>
      <Note>
        {t(
          ar,
          "حفظ تلقائي بعد التعديل بثانيتين في IndexedDB: آخر 5 نسخ للمشروع و20 إجمالًا، حتى 8 MB للنسخة. ليست نسخًا سحابية أو مشفّرة، وقد يمسحها المتصفح. فشل التخزين يظهر بوضوح؛ ملف المشروع أفضل نسخة احتياطية.",
          "Automatic IndexedDB recovery 2 seconds after edits: latest 5 per project, 20 total, up to 8 MB each. Not encrypted/cloud storage; browsers may clear it. Failures are shown; project files remain the best backup.",
        )}
      </Note>
    </>
  );
}
