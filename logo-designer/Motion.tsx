import { syncMotionVersions } from "./motion-versions";
import MotionTimeline from "./MotionTimeline";
import MotionOptions from "./MotionOptions";
import { MotionContext, contextScenes } from "./MotionContext";
import { changeMotionDuration } from "./motion-tracks";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Film,
  Download,
  ArrowRight,
} from "lucide-react";
import { useDesigner } from "./state";
import { motionFrame, motionPresets, motionSettings } from "./motion";
import { ProjectGraphic } from "./render";
import {
  motionTemplates,
  motionTemplateProject,
  motionIndustries,
} from "./motion-templates";
import type { Project } from "./types";
import "./motion.css";

/** Stop clocks offscreen; default to still artwork for reduced-motion users. */
function useClock(duration: number, playing: boolean, initial = 0.6) {
  const [time, setTime] = useState(initial),
    timeRef = useRef(initial);
  const seek = (v: number) => {
    timeRef.current = v;
    setTime(v);
  };
  useEffect(() => {
    if (!playing) return;
    let raf = 0,
      last = 0,
      paint = 0;
    const tick = (now: number) => {
      if (!document.hidden) {
        if (last)
          timeRef.current =
            (timeRef.current + Math.min(100, now - last) / (duration * 1000)) %
            1;
        if (now - paint >= 40) {
          setTime(timeRef.current);
          paint = now;
        }
      }
      last = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, duration]);
  return { time, seek };
}
function AnimatedGraphic({
  project,
  time,
  prefix,
}: {
  project: Project;
  time: number;
  prefix: string;
}) {
  return (
    <svg
      role="img"
      aria-label={project.name}
      viewBox={`0 0 ${project.width} ${project.height}`}
    >
      <ProjectGraphic project={motionFrame(project, time)} prefix={prefix} />
    </svg>
  );
}
export function MotionStage() {
  const s = useDesigner(),
    settings = motionSettings(s.doc);
  const [playing, setPlaying] = useState(
    () => !matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const { time, seek } = useClock(settings.duration, playing);
  const [scene, setScene] = useState("canvas"),
    [dark, setDark] = useState(false);
  return (
    <section
      className="ld-motion-stage"
      aria-label={s.t("معاينة الشعار المتحرك", "Animated logo preview")}
    >
      <div className="ld-motion-stage-head">
        <span>
          <Film size={16} /> {s.t("معاينة الحركة", "MOTION PREVIEW")}
        </span>
        <span>
          {settings.duration}s ·{" "}
          {motionPresets.find((p) => p.id === settings.preset)?.[s.lang]}
        </span>
      </div>
      <div className="ld-motion-scene-controls">
        <label>
          {s.t("سياق الاستخدام", "Usage preview")}
          <select
            aria-label={s.t("سياق الاستخدام", "Usage preview")}
            value={scene}
            onChange={(e) => setScene(e.target.value)}
          >
            {contextScenes.map(([id, ar, en]) => (
              <option key={id} value={id}>
                {s.t(ar, en)}
              </option>
            ))}
          </select>
        </label>
        <button aria-pressed={dark} onClick={() => setDark(!dark)}>
          {dark
            ? s.t("خلفية غامقة", "Dark backdrop")
            : s.t("خلفية فاتحة", "Light backdrop")}
        </button>
        <small>
          {s.t(
            "معاينة فقط؛ لا تؤثر على التصدير",
            "Preview only; exports are unchanged",
          )}
        </small>
      </div>
      <div className="ld-motion-screen">
        {s.doc.nodes.some((n) => !n.hidden) ? (
          <MotionContext
            scene={scene}
            dark={dark}
            time={time}
            lang={s.lang}
            name={s.doc.name}
          >
            <AnimatedGraphic
              project={s.doc}
              time={time}
              prefix="motion-stage"
            />
          </MotionContext>
        ) : (
          <div className="ld-motion-empty">
            <Film size={40} />
            <h2>{s.t("ابدأ بقالب متحرك", "Start with a motion template")}</h2>
            <p>
              {s.t(
                "أو أضف عناصر لشعارك أولًا، ثم اختار الحركة.",
                "Or add artwork first, then choose an animation.",
              )}
            </p>
            <button className="ld-primary" onClick={() => s.setLeftOpen(true)}>
              {s.t("اختيار قالب", "Choose a template")}
            </button>
          </div>
        )}
      </div>
      <div className="ld-motion-transport">
        <button
          aria-label={
            playing
              ? s.t("إيقاف المعاينة", "Pause preview")
              : s.t("تشغيل المعاينة", "Play preview")
          }
          onClick={() => setPlaying(!playing)}
        >
          {playing ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <button
          aria-label={s.t("إعادة الحركة", "Restart animation")}
          onClick={() => seek(0)}
        >
          <RotateCcw size={17} />
        </button>
        <input
          aria-label={s.t("موضع الحركة", "Animation position")}
          type="range"
          min="0"
          max="1000"
          value={Math.round(time * 1000)}
          onChange={(e) => {
            setPlaying(false);
            seek(Number(e.target.value) / 1000);
          }}
        />
        <output>
          {(time * settings.duration).toFixed(1)} / {settings.duration}s
        </output>
      </div>
      <MotionTimeline
        key={scene}
        expanded={
          scene === "canvas" &&
          (typeof window === "undefined" || window.innerWidth > 850)
        }
        time={time}
        onSeek={(v) => {
          setPlaying(false);
          seek(v);
        }}
      />
      <p className="ld-motion-note">
        {s.t(
          "المعاينة لا تغيّر عناصر التصميم. ارجع لأي قسم لتعديل النصوص والألوان.",
          "Preview never changes your design. Return to any section to edit text and colors.",
        )}
      </p>
    </section>
  );
}
export function MotionTemplates({ brand = "" }: { brand?: string }) {
  const s = useDesigner(),
    [industry, setIndustry] = useState("all");
  return (
    <section
      className="ld-motion-templates"
      aria-label={s.t("قوالب شعارات متحركة", "Animated logo templates")}
    >
      <div className="ld-motion-label">
        <Film size={17} />
        <strong>
          {s.t("قوالب متحركة جاهزة", "Ready-to-animate templates")}
        </strong>
        <span>{motionTemplates.length}</span>
      </div>
      <p>
        {s.t(
          "قالب + حركة جاهزة. النصوص والرموز والألوان قابلة للتعديل.",
          "Design + motion, ready together. Every text, symbol and color stays editable.",
        )}
      </p>
      <label className="ld-field">
        {s.t("مجال القوالب المتحركة", "Motion template industry")}
        <select
          aria-label={s.t("مجال القوالب المتحركة", "Motion template industry")}
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
        >
          {motionIndustries.map(([id, ar, en]) => (
            <option key={id} value={id}>
              {s.t(ar, en)}
            </option>
          ))}
        </select>
      </label>
      <div className="ld-motion-template-grid">
        {motionTemplates
          .filter((t) => industry === "all" || t.sector === industry)
          .map((template) => (
            <MotionCard
              key={`${template.id}-${s.lang}-${brand}`}
              template={template}
              brand={brand}
            />
          ))}
      </div>
    </section>
  );
}
function MotionCard({
  template,
  brand,
}: {
  template: (typeof motionTemplates)[number];
  brand: string;
}) {
  const s = useDesigner(),
    [hover, setHover] = useState(false),
    { time } = useClock(
      3,
      hover && !matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  const project = useMemo(
    () => motionTemplateProject(template.id, s.lang, brand),
    [template.id, s.lang, brand],
  );
  return (
    <button
      className="ld-motion-template"
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      onClick={() => {
        if (
          s.doc.nodes.length &&
          !window.confirm(
            s.t(
              "تطبيق القالب يستبدل التصميم الحالي. تقدر تتراجع بعد التطبيق. نكمّل؟",
              "Replace the current design with this template? You can undo this.",
            ),
          )
        )
          return;
        s.commit((old) => ({
          ...project,
          id: old.id,
          ...(old.motionVersions
            ? {
                motionVersions: syncMotionVersions(old),
                activeMotionVersion: old.activeMotionVersion,
              }
            : {}),
        }));
        s.setSelected([]);
        s.setTab("motion");
        if (innerWidth <= 850) s.setLeftOpen(false);
      }}
      aria-label={
        s.t("تطبيق قالب متحرك: ", "Apply animated template: ") +
        template[s.lang]
      }
    >
      <span className="ld-motion-thumb">
        <AnimatedGraphic
          project={project}
          time={hover ? time : 0.6}
          prefix={`motion-${template.id}`}
        />
        <span className="ld-motion-play">
          <Play size={12} />
        </span>
      </span>
      <strong>{template[s.lang]}</strong>
      <small>3s · {s.t("قابل للتعديل", "Editable")}</small>
    </button>
  );
}
export default function MotionPanel() {
  const s = useDesigner(),
    settings = motionSettings(s.doc),
    [guideOpen, setGuideOpen] = useState(false);
  return (
    <section className="ld-section ld-motion-panel">
      <p className="ld-eyebrow">MAKE YOUR MARK MOVE</p>
      <h2>{s.t("هوية تنبض بالحياة.", "A mark that moves.")}</h2>
      <p>
        {s.t(
          "حرّك شعارك الحالي أو ابدأ بقالب. التعديلات محفوظة مع المشروع.",
          "Animate your current logo or start with a template. Motion settings are saved with your project.",
        )}
      </p>
      <p className="ld-motion-preset-note">
        {s.t(
          "اختيار نمط عام يستبدل حركات العناصر المخصصة. يمكنك التراجع.",
          "Choosing a global preset resets custom element tracks. You can undo.",
        )}
      </p>
      <div className="ld-motion-presets">
        {motionPresets.map((p) => (
          <button
            key={p.id}
            aria-pressed={settings.preset === p.id}
            onClick={() =>
              s.commit((old) => ({
                ...old,
                motion: {
                  preset: p.id,
                  duration: motionSettings(old).duration,
                },
              }))
            }
          >
            <Film size={18} />
            <span>
              <strong>{p[s.lang]}</strong>
              <small>{s.lang === "ar" ? p.hintAr : p.hintEn}</small>
            </span>
          </button>
        ))}
      </div>
      <label className="ld-field">
        {s.t("مدة الحركة", "Animation duration")}
        <select
          aria-label={s.t("مدة الحركة", "Animation duration")}
          value={settings.duration}
          onChange={(e) =>
            s.commit((old) => changeMotionDuration(old, Number(e.target.value)))
          }
        >
          {[2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={n}>
              {n} {s.t("ثواني", "seconds")}
            </option>
          ))}
        </select>
      </label>
      <button
        className="ld-primary ld-full"
        onClick={() => s.setModal("motion-export")}
        disabled={!s.doc.nodes.some((n) => !n.hidden)}
      >
        <Download size={17} />
        {s.t("تصدير GIF أو فيديو", "Export GIF or video")}
      </button>
      <button
        className="ld-secondary ld-full"
        onClick={() => s.setLeftOpen(false)}
      >
        {s.t("عرض المعاينة كاملة", "Show full preview")}
        <ArrowRight size={16} />
      </button>
      <details
        className="ld-motion-lesson"
        onToggle={(e) => setGuideOpen(e.currentTarget.open)}
      >
        <summary>
          {s.t(
            "شرح متحرك: من الفكرة إلى التصدير",
            "Motion guide: from idea to export",
          )}
        </summary>
        {guideOpen && <MotionLesson />}
      </details>
      <MotionOptions />
      <MotionTemplates />
    </section>
  );
}
function MotionLesson() {
  const s = useDesigner(),
    [playing, setPlaying] = useState(false),
    { time, seek } = useClock(16, playing, 0),
    step = Math.min(3, Math.floor(time * 4)),
    local = time * 4 - step;
  const steps = [
    [
      s.t("اختار قالبك", "Choose a template"),
      s.t(
        "اضغط على قالب متحرك. كل عناصره تفتح في المحرر.",
        "Choose a motion template. All its elements open in the editor.",
      ),
    ],
    [
      s.t("عدّل هويتك", "Make it yours"),
      s.t(
        "من النصوص والألوان غيّر الاسم والرمز. الحركة تفضل مرتبطة بالتصميم.",
        "Use Text and Colors to edit your name and symbol. Motion stays with the design.",
      ),
    ],
    [
      s.t("اختار الحركة والمدة", "Set the motion"),
      s.t(
        "جرّب الأنماط وحدد المدة. استخدم شريط المعاينة لفحص أي لحظة.",
        "Try a preset and duration. Scrub the preview to inspect any moment.",
      ),
    ],
    [
      s.t("صدّر وشارك", "Export and share"),
      s.t(
        "GIF حلقة متكررة؛ الفيديو دورة واحدة بخلفية ممتلئة. JSON يحفظ العناصر والحركة للتعديل لاحقًا.",
        "GIF loops; video plays one cycle on a solid background. JSON preserves editable artwork and motion.",
      ),
    ],
  ];
  const typed = s
    .t("علامتك", "YOUR BRAND")
    .slice(0, Math.max(1, Math.ceil(local * 14)));
  return (
    <div>
      <div className="ld-motion-lesson-visual">
        <svg viewBox="0 0 320 174" role="img" aria-label={steps[step][0]}>
          <rect
            x="14"
            y="12"
            width="292"
            height="150"
            rx="14"
            fill="var(--ld-surface, #171717)"
            stroke="currentColor"
            opacity=".15"
          />
          {step === 0 ? (
            <>
              {[0, 1, 2].map((i) => (
                <g
                  key={i}
                  transform={`translate(${34 + i * 88} 36)`}
                  opacity={i === Math.floor(local * 3) ? 1 : 0.4}
                >
                  <rect
                    width="76"
                    height="96"
                    rx="8"
                    fill="none"
                    stroke="currentColor"
                  />
                  <path d="M38 18 52 46 24 46Z" fill="currentColor" />
                  <path d="M18 64H58M24 76H52" stroke="currentColor" />
                </g>
              ))}
              <path
                d="m0 0 2 20 5-7 9-2Z"
                fill="currentColor"
                transform={`translate(${57 + Math.floor(local * 3) * 88} 112)`}
              />
            </>
          ) : (
            <>
              <g
                transform={`translate(160 65) scale(${step === 2 ? 0.75 + 0.25 * Math.sin(local * Math.PI) : 1})`}
                opacity={step === 2 ? Math.min(1, local * 4) : 1}
              >
                <path d="M0 -26 26 20 -26 20Z" fill="currentColor" />
                <circle cx="0" cy="2" r="7" fill="var(--ld-bg,#fff)" />
              </g>
              <text
                x="160"
                y="115"
                textAnchor="middle"
                fontFamily="cairo, sans-serif"
                fontSize="17"
                fill="currentColor"
              >
                {step === 1 ? typed : s.t("علامتك", "YOUR BRAND")}
              </text>
              {step === 1 && (
                <path
                  d="M234 99V119"
                  stroke="currentColor"
                  opacity={local % 0.2 < 0.1 ? 1 : 0}
                />
              )}
              {step === 2 && (
                <>
                  <path d="M48 143H272" stroke="currentColor" opacity=".3" />
                  <circle
                    cx={48 + local * 224}
                    cy="143"
                    r="5"
                    fill="currentColor"
                  />
                </>
              )}
              {step === 3 && (
                <g
                  transform={`translate(0 ${10 - Math.min(1, local * 3) * 10})`}
                >
                  <rect
                    x="83"
                    y="128"
                    width="68"
                    height="25"
                    rx="6"
                    fill="currentColor"
                  />
                  <rect
                    x="167"
                    y="128"
                    width="68"
                    height="25"
                    rx="6"
                    fill="currentColor"
                  />
                  <text
                    x="117"
                    y="145"
                    textAnchor="middle"
                    fontSize="12"
                    fill="var(--ld-bg,#fff)"
                  >
                    GIF
                  </text>
                  <text
                    x="201"
                    y="145"
                    textAnchor="middle"
                    fontSize="12"
                    fill="var(--ld-bg,#fff)"
                  >
                    VIDEO
                  </text>
                </g>
              )}
            </>
          )}
        </svg>
      </div>
      <div className="ld-motion-lesson-steps">
        {steps.map(([title], i) => (
          <button
            key={i}
            aria-label={title}
            aria-pressed={step === i}
            onClick={() => {
              setPlaying(false);
              seek(i / 4 + 0.02);
            }}
          >
            {i + 1}
          </button>
        ))}
        <button
          aria-label={
            playing
              ? s.t("إيقاف الشرح", "Pause guide")
              : s.t("تشغيل الشرح", "Play guide")
          }
          onClick={() => {
            setPlaying(!playing);
          }}
        >
          {playing ? <Pause size={15} /> : <Play size={15} />}
        </button>
      </div>
      <h3>{steps[step][0]}</h3>
      <p>{steps[step][1]}</p>
    </div>
  );
}
