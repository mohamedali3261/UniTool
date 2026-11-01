import { useEffect, useState } from "react";
import {
  inspectNativeText,
  isolateNativeText,
  replaceNativeTextInPlace,
  type NativeTextItem,
} from "../../core/nativeText";
import { extractPage, openPdf } from "../../core/pdf";
import type { Translate } from "../../core/types";
interface Target {
  item: NativeTextItem;
  x: number;
  y: number;
  w: number;
  h: number;
}
export function InlineTextEditor({
  bytes,
  source,
  width,
  height,
  commit,
  t,
}: {
  bytes: Uint8Array;
  source: number;
  width: number;
  height: number;
  commit: (bytes: Uint8Array) => Promise<void>;
  t: Translate;
}) {
  const [targets, setTargets] = useState<Target[]>([]),
    [selected, setSelected] = useState<Target | null>(null),
    [text, setText] = useState(""),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [message, setMessage] = useState("");
  useEffect(() => {
    let dead = false;
    setTargets([]);
    setSelected(null);
    setLoading(true);
    setMessage("");
    (async () => {
      const items = await inspectNativeText(bytes, source),
        next: Target[] = [];
      for (const item of items.slice(0, 100)) {
        if (dead) return;
        const isolated = await isolateNativeText(bytes, source, item);
        const { doc } = await openPdf(
          new File([isolated.slice().buffer], "block.pdf"),
        );
        try {
          if (dead) return;
          const runs = (await extractPage(doc, 0)).runs.filter(
            (r) => r.w > 0 && r.h > 0,
          );
          if (!runs.length) continue;
          const x = Math.min(...runs.map((r) => r.x)),
            y = Math.min(...runs.map((r) => r.y));
          next.push({
            item,
            x,
            y,
            w: Math.max(...runs.map((r) => r.x + r.w)) - x,
            h: Math.max(...runs.map((r) => r.y + r.h)) - y,
          });
          if (!dead) setTargets([...next]);
        } finally {
          await doc.destroy();
        }
      }
      if (!dead && !next.length)
        setMessage(
          t(
            "لا توجد نصوص مدعومة للتعديل المباشر في هذه الصفحة. لن يتم تغيير الخط أو تخمين الحروف.",
            "No supported text blocks on this page. Fonts and missing letters will not be guessed.",
          ),
        );
    })()
      .catch((e) => {
        if (!dead) setMessage((e as Error).message);
      })
      .finally(() => {
        if (!dead) setLoading(false);
      });
    return () => {
      dead = true;
    };
  }, [bytes, source, t]);
  const pick = (target: Target) => {
    if (busy) return;
    if (!target.item.replaceable) {
      setSelected(null);
      setMessage(
        t(
          "يمكن تحريك هذه الكتلة من أداة التحريك، لكن تعديل حروفها بنفس الخط والترميز غير مدعوم. لم يتغير الملف.",
          "This block can be moved with the native tool, but character replacement with its original encoding is unsupported. File unchanged.",
        ),
      );
      return;
    }
    setSelected(target);
    setText(target.item.text);
    setMessage("");
  };
  return (
    <div className="ps-inline-native-layer">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="ps-inline-native-targets"
        aria-label={t("تحديد النص للتعديل", "Select text to edit")}
        onClick={(e) => {
          if (e.target === e.currentTarget && !busy) {
            setSelected(null);
            setMessage(
              t(
                "هذا النص غير مدعوم للتعديل المحافظ. لم يتم تغيير الصفحة.",
                "This area is not supported for conservative text editing. Page unchanged.",
              ),
            );
          }
        }}
      >
        {targets.map((target, i) => (
          <rect
            key={i}
            x={target.x}
            y={target.y}
            width={Math.max(4, target.w)}
            height={Math.max(4, target.h)}
            role="button"
            tabIndex={busy ? -1 : 0}
            aria-label={
              t("تعديل النص ", "Edit text ") + (target.item.text || i + 1)
            }
            aria-pressed={selected === target}
            fill={selected === target ? "#1677dd22" : "transparent"}
            stroke={target.item.replaceable ? "#1677dd" : "#ad7c36"}
            vectorEffect="non-scaling-stroke"
            onClick={(e) => {
              e.stopPropagation();
              pick(target);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                pick(target);
              }
            }}
          />
        ))}
      </svg>
      {(loading || message) && (
        <p className="ps-inline-native-message" role="status">
          {loading ? t("جاري فحص النصوص…", "Inspecting text…") : message}
        </p>
      )}
      {selected && (
        <form
          className="ps-inline-native-form"
          style={{
            left: `clamp(0px, ${(selected.x / width) * 100}%, max(0px, calc(100% - 280px)))`,
            top: `${Math.min(85, Math.max(0, (selected.y / height) * 100))}%`,
          }}
          onSubmit={async (e) => {
            e.preventDefault();
            if (busy) return;
            setBusy(true);
            setMessage("");
            try {
              const result = await replaceNativeTextInPlace(
                bytes,
                source,
                selected.item,
                text,
              );
              await commit(result);
              setSelected(null);
            } catch (err) {
              setMessage((err as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <input
            autoFocus
            aria-label={t("النص داخل الصفحة", "Text inside page")}
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={1000}
            disabled={busy}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Escape" && !busy) {
                e.preventDefault();
                setSelected(null);
              }
            }}
          />
          <span>
            {t(
              "نفس الخط والحجم والموضع؛ النص الأطول يُرفض.",
              "Same font, size and origin; wider text is refused.",
            )}
          </span>
          <button type="submit" disabled={busy}>
            {t("حفظ النص", "Save text change")}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setSelected(null)}
          >
            {t("إلغاء", "Cancel")}
          </button>
        </form>
      )}
    </div>
  );
}
