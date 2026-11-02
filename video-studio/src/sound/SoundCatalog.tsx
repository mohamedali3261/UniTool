import { useEffect, useRef, useState } from "react";
import { soundCategories, soundPresets, type SoundPreset } from "./presets";
import { synthSound } from "./synth";
import { durationOf, type Asset, type Project } from "../types";
import "./styles.css";
export function SoundCatalog({
  project,
  assets,
  suspended,
  onAdd,
  onProject,
}: {
  project: Project;
  assets: Asset[];
  suspended: boolean;
  onAdd: (p: SoundPreset) => Promise<void>;
  onProject: (patch: Partial<Project>) => void;
}) {
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState("all"),
    [active, setActive] = useState<string | null>(null),
    [adding, setAdding] = useState(false),
    [error, setError] = useState("");
  const player = useRef<HTMLAudioElement | null>(null),
    url = useRef<string | null>(null);
  function stop() {
    player.current?.pause();
    if (url.current) URL.revokeObjectURL(url.current);
    player.current = null;
    url.current = null;
    setActive(null);
  }
  useEffect(
    () => () => {
      player.current?.pause();
      if (url.current) URL.revokeObjectURL(url.current);
    },
    [],
  );
  useEffect(() => {
    if (suspended) stop();
  }, [suspended]);
  async function listen(p: SoundPreset) {
    if (active === p.id) {
      stop();
      return;
    }
    stop();
    setError("");
    try {
      url.current = URL.createObjectURL(
        new Blob([synthSound(p)], { type: "audio/wav" }),
      );
      const a = new Audio(url.current);
      player.current = a;
      a.volume = 0.65;
      a.onended = () => {
        if (player.current === a) stop();
      };
      await a.play();
      if (player.current === a) setActive(p.id);
      else a.pause();
    } catch {
      setError("تعذّر تشغيل عينة الصوت");
    }
  }
  async function add(p: SoundPreset) {
    setAdding(true);
    setError("");
    stop();
    try {
      await onAdd(p);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAdding(false);
    }
  }
  const cues = project.sounds || [];
  const visibleSounds = soundPresets.filter(
    (s) =>
      (category === "all" || s.category === category) &&
      `${s.name} ${soundCategories.find((c) => c.id === s.category)?.name} ${s.id}`
        .toLowerCase()
        .includes(query.toLowerCase().trim()),
  );
  return (
    <section className="sound-catalog" aria-label="مكتبة المؤثرات الصوتية">
      <h4>
        مؤثرات صوتية <span>56 صوت أصلي</span>
      </h4>
      <p>
        اسمع ثم أضف عند المؤشر. المؤثرات تعمل فوق الموسيقى، ولا تستبدلها. حتى 32
        مؤثرًا في المشروع.
      </p>
      <input
        aria-label="ابحث عن صوت"
        placeholder="ابحث عن انتقال، نقرة، مطر…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="sound-categories" role="group" aria-label="تصنيف الأصوات">
        {[{ id: "all", name: "الكل" }, ...soundCategories].map((c) => (
          <button
            key={c.id}
            aria-pressed={category === c.id}
            onClick={() => setCategory(c.id)}
          >
            {c.name}
          </button>
        ))}
      </div>
      {error && <p role="alert">{error}</p>}
      <div className="sound-grid">
        {visibleSounds.map((s) => (
          <article
            key={s.id}
            className={`sound-card ${active === s.id ? "is-playing" : ""}`}
            data-sound-id={s.id}
          >
            <div className="sound-bars" aria-hidden="true">
              ▂ ▅ ▃ ▇ ▄ ▂ ▆ ▃
            </div>
            <b>{s.name}</b>
            <small>{s.seconds.toFixed(2)} ثانية</small>
            <div>
              <button
                disabled={suspended}
                aria-label={`اسمع ${s.name}`}
                aria-pressed={active === s.id}
                onClick={() => void listen(s)}
              >
                {active === s.id ? "إيقاف" : "▶ اسمع"}
              </button>
              <button
                disabled={
                  adding || cues.length >= 32 || !!project.tracks?.sfx?.locked
                }
                aria-label={`أضف ${s.name}`}
                onClick={() => void add(s)}
              >
                ＋ إضافة
              </button>
            </div>
          </article>
        ))}
      </div>
      {!visibleSounds.length && (
        <p role="status">مفيش أصوات مطابقة. جرّب كلمة تانية أو اختار «الكل».</p>
      )}
      <h4>
        أصوات المشروع <span>{cues.length} / 32</span>
      </h4>
      <div className="sound-cue-list">
        {cues.map((c, i) => {
          const name = assets.find((a) => a.id === c.assetId)?.name || "صوت";
          const patch = (p: Partial<typeof c>) =>
            onProject({
              sounds: cues.map((s) => (s.id === c.id ? { ...s, ...p } : s)),
            });
          return (
            <div className="sound-cue-item" key={c.id}>
              <b>
                {i + 1}. {name.replace(/\.wav$/, "")}
              </b>
              <label>
                عند الثانية
                <input
                  aria-label={`توقيت المؤثر ${i + 1}`}
                  disabled={!!project.tracks?.sfx?.locked}
                  type="number"
                  min={0}
                  max={Math.max(0, durationOf(project) - 0.01)}
                  step="0.1"
                  value={c.at}
                  onChange={(e) =>
                    patch({
                      at: Math.max(
                        0,
                        Math.min(
                          Number(e.target.value) || 0,
                          Math.max(0, durationOf(project) - 0.01),
                        ),
                      ),
                    })
                  }
                />
              </label>
              <label>
                الصوت {Math.round(c.volume * 100)}%
                <input
                  aria-label={`مستوى المؤثر ${i + 1}`}
                  disabled={!!project.tracks?.sfx?.locked}
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={c.volume}
                  onChange={(e) => patch({ volume: Number(e.target.value) })}
                />
              </label>
              <button
                disabled={!!project.tracks?.sfx?.locked}
                className="danger-link"
                aria-label={`حذف المؤثر ${i + 1}`}
                onClick={() =>
                  onProject({ sounds: cues.filter((s) => s.id !== c.id) })
                }
              >
                حذف
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
