import { useEffect, useState } from "react";
const cache = new Map<string, Promise<number[]>>();
async function peaks(url: string) {
  if (cache.has(url)) return cache.get(url)!;
  const promise = (async () => {
    const ctx = new AudioContext();
    try {
      const data = await (await fetch(url)).arrayBuffer();
      const audio = await ctx.decodeAudioData(data);
      const count = 180;
      const step = Math.max(1, Math.floor(audio.length / count));
      const channels = Array.from({ length: audio.numberOfChannels }, (_, i) =>
        audio.getChannelData(i),
      );
      const out: number[] = [];
      for (let i = 0; i < count; i++) {
        let peak = 0;
        for (
          let j = i * step;
          j < Math.min(audio.length, (i + 1) * step);
          j += Math.max(1, Math.floor(step / 200))
        ) {
          for (const c of channels) peak = Math.max(peak, Math.abs(c[j]));
        }
        out.push(peak);
      }
      const max = Math.max(...out, 0.01);
      return out.map((p) => p / max);
    } finally {
      await ctx.close();
    }
  })();
  cache.set(url, promise);
  if (cache.size > 16) cache.delete(cache.keys().next().value!);
  promise.catch(() => cache.delete(url));
  return promise;
}
export function Waveform({
  url,
  offset = 0,
  duration,
  span,
  loop = true,
}: {
  url: string;
  offset?: number;
  duration: number;
  span?: number;
  loop?: boolean;
}) {
  const [data, setData] = useState<number[]>([]);
  const [error, setError] = useState(false);
  useEffect(() => {
    let alive = true;
    setData([]);
    setError(false);
    void peaks(url)
      .then((p) => {
        if (alive) setData(p);
      })
      .catch(() => {
        if (alive) setError(true);
      });
    return () => {
      alive = false;
    };
  }, [url]);
  if (!data.length)
    return (
      <span className="waveform-status">
        {error ? "تعذّر تحليل الصوت" : "تحليل الموجة الصوتية…"}
      </span>
    );
  const available = Math.max(0.01, duration - offset);
  const shown = span ?? available;
  const cropped = Array.from({ length: 180 }, (_, i) => {
    const t = (i / 180) * shown;
    const local =
      offset + (loop ? t % available : Math.min(t, available - 0.001));
    return (
      data[
        Math.min(
          data.length - 1,
          Math.floor((local / Math.max(0.01, duration)) * data.length),
        )
      ] || 0
    );
  });
  return (
    <svg
      className="real-waveform"
      viewBox={`0 0 ${Math.max(1, cropped.length) * 3} 30`}
      preserveAspectRatio="none"
      role="img"
      aria-label="الموجة الصوتية الفعلية"
    >
      {cropped.map((p, i) => (
        <rect
          key={i}
          x={i * 3}
          y={15 - Math.max(1, p * 13)}
          width={1.6}
          height={Math.max(2, p * 26)}
          rx=".6"
        />
      ))}
    </svg>
  );
}
