import { useMemo, useState } from "react";
import type { Item } from "./editing";
export type TimelineEntry = {
  kind: Item["kind"] | "sound" | "audio";
  id: string;
  label: string;
  time: number;
  top: number;
};
export function TimelineSearch({
  entries,
  onReveal,
}: {
  entries: TimelineEntry[];
  onReveal: (entry: TimelineEntry) => void;
}) {
  const [query, setQuery] = useState("");
  const matches = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    return q
      ? entries
          .filter((e) => e.label.toLocaleLowerCase().includes(q))
          .slice(0, 12)
      : [];
  }, [entries, query]);
  return (
    <div className="timeline-search">
      <input
        type="search"
        aria-label="بحث في عناصر التايم لاين"
        placeholder="دور على مقطع، نص، طبقة أو مؤثر…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && matches[0]) {
            e.preventDefault();
            onReveal(matches[0]);
          }
        }}
      />
      {query.trim() && (
        <div
          className="timeline-search-results"
          aria-label="نتائج بحث التايم لاين"
        >
          {matches.map((e) => (
            <button key={`${e.kind}:${e.id}`} onClick={() => onReveal(e)}>
              <span>{e.label}</span>
              <small dir="ltr">{e.time.toFixed(2)}s</small>
            </button>
          ))}
          {!matches.length && <p role="status">مفيش نتائج مطابقة</p>}
        </div>
      )}
    </div>
  );
}
