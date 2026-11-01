import { ToolPreview } from "./ToolPreview";
import { useEffect, useRef, useState } from "react";
import { ArrowUpLeft, Layers3, MousePointer2 } from "lucide-react";
import type { Language } from "../../data";
import { heroScenes } from "./scenes";
import "./motion.css";
export function HeroMotion({
  lang,
  paused,
}: {
  lang: Language;
  paused: boolean;
}) {
  const [interacting, setInteracting] = useState(false),
    [index, setIndex] = useState(0),
    [tool, setTool] = useState(0),
    [phase, setPhase] = useState<"move" | "click" | "open">("move"),
    [cursor, setCursor] = useState({ x: 60, y: 72 }),
    [visible, setVisible] = useState(true),
    [reduced, setReduced] = useState(false),
    [hidden, setHidden] = useState(document.hidden);
  const stage = useRef<HTMLDivElement>(null),
    ar = lang === "ar";
  const scene = heroScenes[index];
  useEffect(() => {
    const q = matchMedia("(prefers-reduced-motion: reduce)"),
      change = () => setReduced(q.matches),
      visibility = () => setHidden(document.hidden);
    change();
    q.addEventListener("change", change);
    document.addEventListener("visibilitychange", visibility);
    const observer = new IntersectionObserver((entries) =>
      setVisible(entries.some((e) => e.isIntersecting)),
    );
    if (stage.current) observer.observe(stage.current);
    return () => {
      q.removeEventListener("change", change);
      document.removeEventListener("visibilitychange", visibility);
      observer.disconnect();
    };
  }, []);
  const running = !interacting && !paused && !reduced && !hidden && visible;
  useEffect(() => {
    if (!running) return;
    const id = setTimeout(
      () => {
        if (phase === "move") setPhase("click");
        else if (phase === "click") setPhase("open");
        else {
          setPhase("move");
          if (tool + 1 < scene.items.length) setTool(tool + 1);
          else {
            setTool(0);
            setIndex((n) => (n + 1) % heroScenes.length);
          }
        }
      },
      phase === "move" ? 850 : phase === "click" ? 400 : 2300,
    );
    return () => clearTimeout(id);
  }, [running, index, tool, phase, scene.items.length]);
  useEffect(() => {
    const place = () => {
      const node = stage.current?.querySelector(".film-scene"),
        target = stage.current?.querySelectorAll(".film-tool")[tool];
      if (!node || !target) return;
      const a = node.getBoundingClientRect(),
        b = target.getBoundingClientRect();
      setCursor({
        x: ((b.x + b.width * 0.58 - a.x) / a.width) * 100,
        y: ((b.y + b.height * 0.55 - a.y) / a.height) * 100,
      });
    };
    place();
    const observer = new ResizeObserver(place);
    if (stage.current) observer.observe(stage.current);
    return () => observer.disconnect();
  }, [index, tool]);
  const active = scene.items[tool] || scene.items[0];
  return (
    <div
      ref={stage}
      onMouseEnter={() => setInteracting(true)}
      onMouseLeave={() => setInteracting(false)}
      onFocusCapture={() => setInteracting(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node))
          setInteracting(false);
      }}
      className={`hero-motion ${running ? "is-running" : "is-still"} phase-${phase}`}
      aria-label={
        ar ? "عرض موشن جرافيك لأدوات UniTool" : "UniTool tools motion showcase"
      }
    >
      <div className="motion-film-top">
        <span>
          <i />
          <i />
          <i />
        </span>
        <small>UNITOOL / CREATIVE OPERATING SYSTEM</small>
        <b>
          SCENE {String(index + 1).padStart(2, "0")} /{" "}
          {String(heroScenes.length).padStart(2, "0")}
        </b>
      </div>
      <div className="motion-film-stage">
        <div className="film-aura" />
        <svg
          className="film-orbits"
          viewBox="0 0 1000 480"
          fill="none"
          aria-hidden="true"
        >
          <ellipse cx="500" cy="240" rx="410" ry="175" />
          <ellipse cx="500" cy="240" rx="330" ry="220" />
          <path d="M130 100Q500 400 870 100M130 380Q500 80 870 380" />
        </svg>
        <span className="film-coordinate coord-a">
          CREATE / TRANSFORM / EXPORT
        </span>
        <span className="film-coordinate coord-b">∞ POSSIBILITIES</span>
        <div key={scene.id} className="film-scene" data-scene={scene.id}>
          <div
            className={"film-hub " + (phase === "open" ? "preview-behind" : "")}
          >
            <span className="film-hub-icon">
              <scene.icon size={42} />
            </span>
            <small>ONE WORKSPACE. NO LIMITS.</small>
            <h2>{ar ? scene.ar : scene.en}</h2>
            <span className="film-hub-caption">
              {ar
                ? "من أول فكرة… لآخر تفصيلة."
                : "From first spark to final frame."}
            </span>
            <div className="film-hub-pills">
              <span>{ar ? "ارفع" : "IMPORT"}</span>
              <b>↗</b>
              <span>{ar ? "عدّل" : "CREATE"}</span>
              <b>↗</b>
              <span>{ar ? "صدّر" : "EXPORT"}</span>
            </div>
          </div>
          {scene.items.map((item, i) => (
            <a
              key={item.id}
              className={`film-tool film-slot-${i} ${i === tool ? "tool-current" : ""}`}
              href={item.href}
              style={
                {
                  "--delay": `${i * 90}ms`,
                  "--float-delay": `${i * -0.6}s`,
                } as React.CSSProperties
              }
            >
              <span className="film-tool-icon">
                <item.icon size={25} />
              </span>
              <div>
                <small>
                  {String(i + 1).padStart(2, "0")} /{" "}
                  {scene.id === "studios" ? "STUDIO" : "TOOL"}
                </small>
                <strong>{ar ? item.ar : item.en}</strong>
              </div>
              <ArrowUpLeft size={13} />
            </a>
          ))}
          {phase === "open" && (
            <ToolPreview key={active.id} item={active} ar={ar} />
          )}
          <span
            className="film-cursor"
            style={{ left: cursor.x + "%", top: cursor.y + "%" }}
            aria-hidden="true"
          >
            <MousePointer2 size={24} />
            <span>{phase === "open" ? "OPENED ✓" : "LET’S CREATE"}</span>
            <i className="film-click-ring" />
          </span>
          <span className="film-spark spark-a" aria-hidden="true">
            ✳
          </span>
          <span className="film-spark spark-b" aria-hidden="true">
            ＋
          </span>
        </div>
      </div>
      <div className="motion-film-bottom">
        <span>
          <Layers3 size={13} />
          {ar ? "كل أدواتك… بتناغم واحد." : "Every tool. One creative flow."}
        </span>
        <div
          className="film-chapters"
          aria-label={ar ? "مشاهد العرض" : "Showcase chapters"}
        >
          {heroScenes.map((s, i) => (
            <button
              key={s.id}
              aria-label={`${ar ? "عرض" : "Show"} ${ar ? s.ar : s.en} ${i + 1}`}
              aria-pressed={i === index}
              onClick={() => {
                setIndex(i);
                setTool(0);
                setPhase("move");
              }}
            >
              <i
                key={`${index}-${running}`}
                style={{ animationDuration: `${scene.items.length * 3550}ms` }}
              />
            </button>
          ))}
        </div>
        <a href="#tools">{ar ? "اكتشف الأدوات" : "Explore tools"} ↗</a>
      </div>
    </div>
  );
}
