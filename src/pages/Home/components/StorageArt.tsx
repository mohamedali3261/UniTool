export function StorageArt({ lang }: { lang: "ar" | "en" }) {
  return (
    <svg
      className="storage-art-svg"
      viewBox="0 0 500 300"
      width="100%"
      height="100%"
      aria-hidden="true"
    >
      <rect
        x="60"
        y="45"
        width="380"
        height="220"
        rx="24"
        fill="var(--art-surface, #eef5f0)"
        stroke="var(--art-border, #cfe0d4)"
        strokeWidth="2"
      />
      <path
        d="M110 100v115h280V100H270l-25-25H110v25Z"
        fill="var(--art-accent-soft, #d7ede3)"
        stroke="var(--art-accent, #24795e)"
        strokeWidth="3"
      />
      <g fill="var(--art-accent, #24795e)">
        {[0, 1, 2].map((i) => (
          <rect key={i} x={145 + i * 76} y="128" width="52" height="57" rx="8" />
        ))}
      </g>
      <path
        d="M250 24v55m-15-16 15 16 15-16"
        stroke="var(--art-accent, #24795e)"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      <text
        x="250"
        y="242"
        textAnchor="middle"
        fill="var(--site-ink, #243d31)"
        fontSize="15"
      >
        {lang === "ar" ? "نسخة واحدة · كل شغلك المحفوظ" : "ONE ZIP · YOUR SAVED WORK"}
      </text>
    </svg>
  );
}
