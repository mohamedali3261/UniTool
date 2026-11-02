import { useEffect, useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useStudio } from "../../../app/context";
import { exampleRows, type FormulaLesson } from "./types";
import "./animations.css";
export function FormulaAnimation({
  lesson,
  onUseExample,
}: {
  lesson: FormulaLesson;
  onUseExample: (formula: string) => void;
}) {
  const { lang, t } = useStudio(),
    locale = lang === "ar" ? 0 : 1;
  const [index, setIndex] = useState(0),
    [playing, setPlaying] = useState(false),
    [delay, setDelay] = useState(2800);
  const step = lesson.steps[index],
    last = index === lesson.steps.length - 1;
  useEffect(() => {
    if (!playing) return;
    if (last) {
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(
      () => setIndex((i) => Math.min(i + 1, lesson.steps.length - 1)),
      delay,
    );
    return () => window.clearTimeout(timer);
  }, [playing, index, delay, last, lesson.steps.length]);
  useEffect(() => {
    const pause = () => {
      if (document.hidden) setPlaying(false);
    };
    document.addEventListener("visibilitychange", pause);
    return () => document.removeEventListener("visibilitychange", pause);
  }, []);
  const move = (i: number) => {
    setPlaying(false);
    setIndex(Math.max(0, Math.min(i, lesson.steps.length - 1)));
  };
  return (
    <section
      className="xs-formula-animation"
      aria-label={t(
        "شرح متحرك خطوة بخطوة",
        "Animated step-by-step explanation",
      )}
    >
      <div className="xs-animation-heading">
        <span className="xs-animation-badge">
          {t("شاهد وافهم", "WATCH & LEARN")}
        </span>
        <h4>{lesson.goal[locale]}</h4>
      </div>
      <p className="xs-animation-scope">
        {t(
          "شرح ثابت للصيغة التالية، مستقل عن تعديلات تجربة المعادلة:",
          "A guided demonstration of this fixed formula, independent of playground edits:",
        )}
      </p>
      <code className="xs-animation-formula" dir="ltr">
        {lesson.formula}
      </code>
      <div className="xs-animation-legend">
        <span>● {t("نقرأ الآن", "Reading now")}</span>
        <span>✓ {t("مستخدم / مطابق", "Used / matched")}</span>
        <span>− {t("تم تجاهله", "Skipped")}</span>
      </div>
      <table
        className="xs-example-table xs-animation-table"
        dir="ltr"
        aria-label={t("خلايا مثال الشرح المتحرك", "Animated example cells")}
      >
        <thead>
          <tr>
            <th scope="col">#</th>
            {["A", "B", "C"].map((c) => (
              <th key={c} scope="col">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {exampleRows.map((row, i) => (
            <tr key={i}>
              <th scope="row">{i + 1}</th>
              {row.map((value, j) => {
                const ref = String.fromCharCode(65 + j) + (i + 1),
                  state = step.active?.includes(ref)
                    ? "active"
                    : step.matched?.includes(ref)
                      ? "matched"
                      : step.skipped?.includes(ref)
                        ? "skipped"
                        : "idle";
                const stateLabel =
                  state === "active"
                    ? t("اقرأ", "Read")
                    : state === "matched"
                      ? t("مستخدم", "Used")
                      : state === "skipped"
                        ? t("تجاهل", "Skip")
                        : "";
                return (
                  <td
                    key={ref}
                    data-cell={ref}
                    data-state={state}
                    aria-label={`${ref}: ${value}${stateLabel ? ", " + stateLabel : ""}`}
                  >
                    <span className="xs-cell-value">{value}</span>
                    <span className="xs-cell-state" aria-hidden="true">
                      {state === "active"
                        ? "↓ "
                        : state === "matched"
                          ? "✓ "
                          : state === "skipped"
                            ? "− "
                            : ""}
                      {stateLabel || "\u00a0"}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div
        className="xs-animation-narration"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <span className="xs-animation-step-number">
          {t("خطوة", "Step")} {index + 1} / {lesson.steps.length}
        </span>
        <h4>{step.title[locale]}</h4>
        <p>{step.explanation[locale]}</p>
        <div
          className="xs-animation-math"
          key={index}
          dir="auto"
          data-testid="animation-calculation"
        >
          {step.calculation}
        </div>
        {last && (
          <strong className="xs-animation-final">
            {t("الناتج النهائي", "Final result")}: {String(lesson.result)}
          </strong>
        )}
      </div>
      <div
        className="xs-animation-progress"
        role="group"
        aria-label={t("اختيار خطوة الشرح", "Choose explanation step")}
      >
        {lesson.steps.map((s, i) => (
          <button
            type="button"
            key={i}
            aria-label={`${t("الخطوة", "Step")} ${i + 1}: ${s.title[locale]}`}
            aria-current={i === index ? "step" : undefined}
            onClick={() => move(i)}
            className={i <= index ? "done" : ""}
          >
            <span>{i + 1}</span>
          </button>
        ))}
      </div>
      <div className="xs-animation-controls">
        <button
          type="button"
          className="xs-button"
          onClick={() => move(index - 1)}
          disabled={index === 0}
          aria-label={t("الخطوة السابقة", "Previous step")}
        >
          <ChevronRight size={15} />
        </button>
        <button
          type="button"
          className="xs-button primary"
          onClick={() => {
            if (playing) setPlaying(false);
            else {
              if (last) setIndex(0);
              setPlaying(true);
            }
          }}
        >
          {playing ? <Pause size={14} /> : <Play size={14} />}{" "}
          {playing
            ? t("إيقاف مؤقت", "Pause")
            : t("تشغيل الشرح", "Play explanation")}
        </button>
        <button
          type="button"
          className="xs-button"
          onClick={() => move(index + 1)}
          disabled={last}
          aria-label={t("الخطوة التالية", "Next step")}
        >
          <ChevronLeft size={15} />
        </button>
        <button
          type="button"
          className="xs-button"
          onClick={() => move(0)}
          aria-label={t("إعادة الشرح من البداية", "Restart explanation")}
        >
          <RotateCcw size={14} />
        </button>
        <label>
          {t("السرعة", "Speed")}
          <select
            value={delay}
            onChange={(e) => setDelay(Number(e.target.value))}
            aria-label={t("سرعة الشرح", "Explanation speed")}
          >
            <option value={4400}>{t("بطيء", "Slow")}</option>
            <option value={2800}>{t("عادي", "Normal")}</option>
            <option value={1400}>{t("سريع", "Fast")}</option>
          </select>
        </label>
      </div>
      <p className="xs-animation-tip">
        <strong>{t("خد بالك: ", "Remember: ")}</strong>
        {lesson.tip[locale]}
      </p>
      <button
        type="button"
        className="xs-button"
        onClick={() => onUseExample(lesson.formula)}
      >
        {t("ضع مثال الشرح في التجربة", "Use this example in the playground")}
      </button>
      <small>
        {t(
          "هذه خطوات تعليمية مبسطة، وليست تتبعًا داخليًا لمحرك Excel. لا تغيّر ملفك.",
          "These are simplified teaching steps, not an internal Excel execution trace. Your workbook is unchanged.",
        )}
      </small>
    </section>
  );
}
