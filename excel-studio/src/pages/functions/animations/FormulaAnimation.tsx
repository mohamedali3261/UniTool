import { useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  MousePointer2,
} from "lucide-react";
import { useStudio } from "../../../app/context";
import { exampleRows, type FormulaLesson } from "./types";
import { demoFrame } from "./demoModel";
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
    [progress, setProgress] = useState(0),
    [playing, setPlaying] = useState(false),
    [delay, setDelay] = useState(2800),
    [reduced, setReduced] = useState(false);
  const cellInput = useRef<HTMLInputElement>(null),
    action = lesson.demo[index],
    last = index === lesson.demo.length - 1;
  const frame = demoFrame(lesson, index, progress);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (!playing) return;
    if (progress >= 1) {
      const timer = window.setTimeout(() => {
        if (last) setPlaying(false);
        else {
          setIndex((i) => i + 1);
          setProgress(0);
        }
      }, delay * 0.3);
      return () => window.clearTimeout(timer);
    }
    const duration =
      (action.kind === "type"
        ? Math.max(1000, (action.text?.length || 1) * 90)
        : 1600) *
      (delay / 2800);
    const timer = window.setInterval(
      () => setProgress((p) => Math.min(1, p + 40 / duration)),
      40,
    );
    return () => window.clearInterval(timer);
  }, [playing, index, progress >= 1, delay, last, action]);
  useEffect(() => {
    const pause = () => {
      if (document.hidden) setPlaying(false);
    };
    document.addEventListener("visibilitychange", pause);
    return () => document.removeEventListener("visibilitychange", pause);
  }, []);
  useEffect(() => {
    if (cellInput.current)
      cellInput.current.scrollLeft = cellInput.current.scrollWidth;
  }, [frame.formula]);
  const move = (i: number) => {
    setPlaying(false);
    setIndex(Math.max(0, Math.min(i, lesson.demo.length - 1)));
    setProgress(1);
  };
  const visible = demoFrame(lesson, index, reduced ? 1 : progress);
  return (
    <section
      className="xs-formula-animation xs-cursor-lesson"
      aria-label={t("شرح بالمؤشر داخل الجدول", "In-cell cursor demonstration")}
    >
      <div className="xs-animation-heading">
        <span className="xs-animation-badge">
          {t("شوفها كأنك بتعملها بنفسك", "WATCH IT HAPPEN")}
        </span>
        <h4>{lesson.goal[locale]}</h4>
      </div>
      <p className="xs-animation-scope">
        {t(
          "المؤشر هيضغط ويكتب ويسحب قدامك. ده جدول تعليمي منفصل، مش ملفك الحقيقي.",
          "Watch the pointer click, type and drag. This is a separate teaching sheet, not your real workbook.",
        )}
      </p>
      <div className="xs-demo-formula-bar" dir="ltr">
        <span>D1</span>
        <b>ƒx</b>
        <code data-testid="demo-formula-bar">{visible.formula || " "}</code>
      </div>
      <div className="xs-demo-sheet" dir="ltr">
        <table
          className="xs-demo-grid"
          aria-label={t("جدول الشرح بالمؤشر", "Cursor demonstration sheet")}
        >
          <thead>
            <tr>
              <th>#</th>
              {["A", "B", "C", "D"].map((c) => (
                <th scope="col" key={c}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {exampleRows.map((row, i) => (
              <tr key={i}>
                <th scope="row">{i + 1}</th>
                {[...row, ""].map((value, j) => {
                  const ref = String.fromCharCode(65 + j) + (i + 1),
                    output = ref === "D1";
                  return (
                    <td
                      key={ref}
                      data-cell={ref}
                      className={output ? "xs-demo-output" : ""}
                    >
                      {output ? (
                        visible.done ? (
                          <strong
                            className="xs-demo-result"
                            data-testid="demo-cell-result"
                          >
                            {String(lesson.result)}
                          </strong>
                        ) : (
                          <input
                            ref={cellInput}
                            value={visible.formula}
                            readOnly
                            tabIndex={-1}
                            aria-label={t(
                              "كتابة المعادلة داخل D1",
                              "Formula being typed in D1",
                            )}
                            className={
                              action.kind === "type" ? "is-typing" : ""
                            }
                          />
                        )
                      ) : (
                        value
                      )}
                      {output && action.kind === "type" && (
                        <i
                          aria-hidden="true"
                          className="xs-demo-caret"
                          style={{
                            left: `min(calc(5px + ${visible.formula.length}ch), calc(100% - 6px))`,
                            animationPlayState: playing ? "running" : "paused",
                          }}
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="xs-demo-overlay" aria-hidden="true">
          {visible.range && (
            <div
              className="xs-demo-selection"
              data-testid="demo-selection"
              style={{
                left: visible.range.left + "%",
                top: visible.range.top + "%",
                width: visible.range.width + "%",
                height: visible.range.height + "%",
              }}
            >
              <i />
            </div>
          )}
          {action.kind !== "enter" && (
            <div
              className={
                "xs-demo-pointer " +
                (action.kind === "select" ? "is-dragging" : "") +
                (action.kind === "click" && progress > 0.7
                  ? " is-clicking"
                  : "")
              }
              style={{
                left: visible.point.x + "%",
                top: visible.point.y + "%",
              }}
            >
              <MousePointer2 size={25} fill="currentColor" />
              <span>
                {action.kind === "select"
                  ? t("سحب", "DRAG")
                  : action.kind === "click"
                    ? t("اضغط", "CLICK")
                    : t("اكتب", "TYPE")}
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="xs-demo-keyboard" aria-hidden="true">
        <kbd
          className={action.kind === "enter" && visible.done ? "pressed" : ""}
        >
          Enter ↵
        </kbd>
        <span>
          {action.kind === "type"
            ? t("الكتابة داخل الخلية", "Typing inside the cell")
            : action.kind === "select"
              ? t(
                  "زر الماوس مضغوط أثناء تحديد النطاق",
                  "Mouse held down while selecting the range",
                )
              : action.kind === "enter"
                ? t(
                    "تأكيد المعادلة وإظهار الناتج",
                    "Confirm formula and show result",
                  )
                : t("اختيار خلية النتيجة D1", "Select result cell D1")}
        </span>
      </div>
      <div
        className="xs-demo-caption"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <span className="xs-animation-step-number">
          {t("خطوة", "Step")} {index + 1} / {lesson.demo.length}
        </span>
        <p>{action.caption[locale]}</p>
        {visible.done && (
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
        {lesson.demo.map((s, i) => (
          <button
            type="button"
            key={i}
            aria-label={`${t("الخطوة", "Step")} ${i + 1}: ${s.caption[locale]}`}
            aria-current={i === index ? "step" : undefined}
            onClick={() => move(i)}
            className={i <= index ? "done" : ""}
          >
            {i + 1}
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
              if (last && progress >= 1) {
                setIndex(0);
                setProgress(0);
              }
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
          onClick={() => {
            setPlaying(false);
            setIndex(0);
            setProgress(0);
          }}
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
      <details className="xs-demo-details">
        <summary>
          {t(
            "ليه الناتج ده؟ شرح الحساب بالتفصيل",
            "Why this result? Calculation details",
          )}
        </summary>
        {lesson.steps.map((s, i) => (
          <div key={i}>
            <strong>{s.title[locale]}</strong>
            <p>{s.explanation[locale]}</p>
            <code dir="auto">{s.calculation}</code>
          </div>
        ))}
      </details>
      <p className="xs-animation-tip">{lesson.tip[locale]}</p>
      <button
        type="button"
        className="xs-button"
        onClick={() => onUseExample(lesson.formula)}
      >
        {t("ضع مثال الشرح في التجربة", "Use this example in the playground")}
      </button>
      <small>
        {t(
          "محاكاة تعليمية لصيغة ثابتة. تعديل التجربة لا يغيّر الشرح أو ملفك.",
          "A teaching simulation of a fixed formula. Playground edits do not change the demonstration or your file.",
        )}
      </small>
    </section>
  );
}
