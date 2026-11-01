import { useEffect, useState } from "react";
import { Modal } from "../../components/Modal";
import {
  editNativeText,
  inspectNativeText,
  type NativeTextItem,
} from "../../core/nativeText";
import { saveBlob } from "../../core/pdf";
import type { Translate } from "../../core/types";
export function NativeTextEditor({
  bytes,
  pageIndex,
  name,
  close,
  open,
  t,
}: {
  bytes: Uint8Array;
  pageIndex: number;
  name: string;
  close: () => void;
  open: (file: File) => Promise<void>;
  t: Translate;
}) {
  const [items, setItems] = useState<NativeTextItem[]>([]),
    [index, setIndex] = useState(0),
    [text, setText] = useState(""),
    [dx, setDx] = useState("0"),
    [dy, setDy] = useState("0"),
    [remove, setRemove] = useState(false),
    [busy, setBusy] = useState(true),
    [error, setError] = useState(""),
    [result, setResult] = useState<Uint8Array | null>(null);
  useEffect(() => {
    let dead = false;
    inspectNativeText(bytes, pageIndex)
      .then((value) => {
        if (!dead) {
          setItems(value);
          setText(value[0]?.text || "");
        }
      })
      .catch((e) => {
        if (!dead) setError((e as Error).message);
      })
      .finally(() => {
        if (!dead) setBusy(false);
      });
    return () => {
      dead = true;
    };
  }, [bytes, pageIndex]);
  const item = items[index],
    filename = name.replace(/\.pdf$/i, "") + "-native-edited.pdf";
  return (
    <Modal
      title={t(
        "تعديل النص الأصلي — دعم محدود وآمن",
        "Original text editing — limited, conservative support",
      )}
      onClose={close}
    >
      <p>
        {t(
          "هذا المسار يغيّر محتوى PDF نفسه، دون غطاء أبيض أو تحويل الصفحة لصورة. يدعم حاليًا كتل نصية مستقلة بسيطة فقط؛ ليس محررًا شاملًا للنصوص والصور.",
          "This edits PDF content itself, without white covers or rasterizing the page. Currently supports simple isolated text blocks only, not arbitrary text and images.",
        )}
      </p>
      <p>
        {t(
          "التعديل الحرفي متاح فقط للنص الإنجليزي البسيط بخط قياسي وترميز معروف. العربي والخطوط الخاصة لا يُعاد تخمينها؛ يمكن تحريك أو حذف الكتل المستقلة المدعومة فقط. الحركة الموجبة: يمين/أعلى بوحدات PDF قبل تدوير الصفحة. احفظ نسخة وراجعها؛ التصدير قد يُبطل التوقيعات أو خصائص تفاعلية.",
          "Replacement is limited to plain ASCII with a known standard font. Arabic/custom encodings are never guessed; only supported isolated blocks can be moved/deleted. Positive movement is right/up in unrotated PDF units. Save and review a copy; export may invalidate signatures or interactive features.",
        )}
      </p>
      {error && <p role="alert">{error}</p>}
      {busy ? (
        <p role="status">{t("جاري الفحص…", "Inspecting…")}</p>
      ) : !items.length ? (
        <p role="status">
          {t(
            "لم نعثر على كتل قابلة للتعديل بأمان بهذه الطريقة. لم يتغير الملف. أرفق ملفك لتقييم دعم بنيته بدل إعادة بنائه بشكل غير دقيق.",
            "No safely supported blocks found. File unchanged. Supply your PDF to assess its structure rather than rebuilding it inaccurately.",
          )}
        </p>
      ) : (
        <fieldset disabled={busy || !!result}>
          <label>
            {t("كتلة النص الأصلية", "Original text block")}
            <select
              aria-label={t("كتلة النص الأصلية", "Original text block")}
              value={index}
              onChange={(e) => {
                const i = Number(e.target.value);
                setIndex(i);
                setText(items[i].text);
                setRemove(false);
              }}
            >
              {items.map((a, i) => (
                <option key={i} value={i}>
                  {i + 1} ·{" "}
                  {a.text.slice(0, 70) ||
                    t(
                      "ترميز خاص — تحريك/حذف فقط",
                      "Custom encoding — move/delete only",
                    )}
                </option>
              ))}
            </select>
          </label>
          {item?.replaceable && (
            <label>
              {t("النص البديل", "Replacement text")}
              <input
                aria-label={t("النص البديل", "Replacement text")}
                value={text}
                maxLength={1000}
                onChange={(e) => setText(e.target.value)}
                disabled={remove}
              />
            </label>
          )}
          <label>
            {t("تحريك أفقي (نقطة)", "Horizontal movement (pt)")}
            <input
              aria-label="Native move X"
              type="number"
              min="-5000"
              max="5000"
              value={dx}
              onChange={(e) => setDx(e.target.value)}
            />
          </label>
          <label>
            {t("تحريك رأسي (نقطة)", "Vertical movement (pt)")}
            <input
              aria-label="Native move Y"
              type="number"
              min="-5000"
              max="5000"
              value={dy}
              onChange={(e) => setDy(e.target.value)}
            />
          </label>
          <label>
            <input
              type="checkbox"
              checked={remove}
              onChange={(e) => setRemove(e.target.checked)}
            />
            {t(
              "حذف هذه الكتلة من المحتوى (ليس حجبًا آمنًا للمستند)",
              "Delete this content block (not document-wide secure redaction)",
            )}
          </label>
          <button
            className="ps-button"
            onClick={async () => {
              if (!item || dx.trim() === "" || dy.trim() === "") {
                setError(t("أدخل قيم الحركة", "Enter movement values"));
                return;
              }
              setBusy(true);
              setError("");
              try {
                setResult(
                  await editNativeText(bytes, pageIndex, item, {
                    text: item.replaceable && !remove ? text : undefined,
                    dx: Number(dx),
                    dy: Number(dy),
                    remove,
                  }),
                );
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            {t("إنشاء نسخة بالتعديل", "Create edited copy")}
          </button>
        </fieldset>
      )}
      {result && (
        <>
          <p role="status">
            {t(
              "النسخة جاهزة. افتحها للمراجعة قبل الاعتماد عليها. فتح النسخة يبدأ جلسة جديدة دون سجل التراجع السابق؛ الأصل لا يتغير.",
              "Copy ready. Open it to review. Opening starts a new session without previous undo history; the original stays unchanged.",
            )}
          </p>
          <button
            className="ps-button"
            onClick={() =>
              saveBlob(
                new Blob([result.slice().buffer], { type: "application/pdf" }),
                filename,
              )
            }
          >
            {t("تنزيل النسخة المعدلة", "Download native edited copy")}
          </button>
          <button
            className="ps-button"
            onClick={async () => {
              await open(
                new File([result.slice().buffer], filename, {
                  type: "application/pdf",
                }),
              );
            }}
          >
            {t("فتح النسخة للمراجعة", "Open edited copy for review")}
          </button>
        </>
      )}
    </Modal>
  );
}
