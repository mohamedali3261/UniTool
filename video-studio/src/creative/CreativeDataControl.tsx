import { useState, useEffect } from "react";
import type { CreativeSettings } from "./catalog";
export function CreativeDataControl({
  value,
  change,
}: {
  value: CreativeSettings;
  change: (c: CreativeSettings) => void;
}) {
  const [draft, setDraft] = useState(value.data?.join(", ") || ""),
    [error, setError] = useState("");
  useEffect(() => {
    setDraft(value.data?.join(", ") || "");
  }, [value.data]);
  return (
    <div>
      <label>
        قيم الرسم (بين 2 و64 قيمة)
        <textarea
          aria-label="قيم الرسم البياني"
          rows={2}
          maxLength={600}
          value={draft}
          placeholder="12, 35, 20, 60"
          onChange={(e) => setDraft(e.target.value)}
        />
      </label>
      <button
        type="button"
        onClick={() => {
          const data = draft
            .split(/[,،\s]+/)
            .filter(Boolean)
            .map(Number);
          if (
            data.length < 2 ||
            data.length > 64 ||
            !data.every((n) => Number.isFinite(n) && Math.abs(n) <= 10000)
          ) {
            setError("أدخل من 2 إلى 64 رقمًا صالحًا بين -10000 و10000");
            return;
          }
          setError("");
          change({ ...value, data });
        }}
      >
        تطبيق قيم الرسم
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
