import { useEffect, useRef, useState } from "react";
import type { StudioTemplate } from "../types";
import { nova } from "./index";
import { novaArt } from "./art";
import { novaSoundtrack } from "./soundtrack";
const artwork = nova.scenes.map(
  (_, i) =>
    `data:image/svg+xml;charset=utf-8,${encodeURIComponent(novaArt(i))}`,
);
export function NovaShowcase({
  busy,
  onUse,
}: {
  busy: boolean;
  onUse: (t: StudioTemplate) => void;
}) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const url = useRef<string | null>(null);
  const [playing, setPlaying] = useState(false),
    [time, setTime] = useState(0),
    [error, setError] = useState("");
  const scene = Math.min(5, Math.floor(time / 4));
  useEffect(
    () => () => {
      audio.current?.pause();
      if (url.current) URL.revokeObjectURL(url.current);
    },
    [],
  );
  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => {
      if (audio.current) setTime(audio.current.currentTime);
    }, 150);
    return () => clearInterval(interval);
  }, [playing]);
  async function toggle() {
    if (playing) {
      audio.current?.pause();
      setPlaying(false);
      return;
    }
    setError("");
    try {
      if (!audio.current) {
        url.current = URL.createObjectURL(
          new Blob([novaSoundtrack()], { type: "audio/wav" }),
        );
        const el = new Audio(url.current);
        audio.current = el;
        el.volume = 0.7;
        el.onended = () => {
          setPlaying(false);
          setTime(0);
        };
      }
      await audio.current.play();
      setPlaying(true);
    } catch {
      setError(
        "تعذّر تشغيل عينة الصوت. تقدر تستخدم القالب وتجرّب الصوت من المحرر.",
      );
    }
  }
  return (
    <article className="nova-showcase" aria-label="قالب NOVA السينمائي">
      <div className="nova-showcase-copy">
        <span className="nova-eyebrow">NEW / ORIGINAL SOUNDTRACK</span>
        <h3>
          مش مجرد فيديو.
          <br />
          <em>انطلاقة تتشاف وتِتسمع.</em>
        </h3>
        <p>
          ٦ مشاهد سينمائية بنصوص عربية متحركة، تصميم فضائي، وموسيقى أصلية مع
          أصوات انتقال متزامنة. غيّر الكلمات واللقطات وخليه باسمك.
        </p>
        <div className="nova-specs">
          <span>24 ثانية</span>
          <span>16:9</span>
          <span>موسيقى + Whoosh + Impact</span>
        </div>
        <button
          className="primary"
          disabled={busy}
          onClick={() => {
            audio.current?.pause();
            setPlaying(false);
            onUse(nova);
          }}
        >
          استخدم قالب NOVA ↗
        </button>
        <small>
          بدون تحميل خارجي • بدون تعليق صوتي بشري • النصوص والصوت قابلان للتعديل
        </small>
      </div>
      <div className="nova-demo">
        <div className="nova-demo-frame">
          <img src={artwork[scene]} alt={`تصميم المشهد ${scene + 1}`} />
          <div className="nova-demo-title">
            <b>{nova.scenes[scene].text}</b>
            <span>{nova.scenes[scene].caption}</span>
          </div>
        </div>
        <div className="nova-demo-controls">
          <button onClick={() => void toggle()} aria-pressed={playing}>
            {playing ? "إيقاف العينة مؤقتًا" : "اسمع موسيقى القالب"}{" "}
            {playing ? "Ⅱ" : "▶"}
          </button>
          <span>استعراض المشاهد والصوت</span>
          <time dir="ltr">
            00:{String(Math.floor(time)).padStart(2, "0")} / 00:24
          </time>
        </div>
        <progress value={time} max={24} aria-label="تقدم عينة القالب" />
        {error && <p role="status">{error}</p>}
      </div>
    </article>
  );
}
