export function TextArt({ lang }: { lang: "ar" | "en" }) {
  return (
    <svg viewBox="0 0 500 300" width="100%" height="100%" aria-hidden="true">
      <rect
        x="80"
        y="32"
        width="340"
        height="240"
        rx="12"
        fill="#172d29"
        stroke="#cce7a344"
      />
      <g fill="none" stroke="#cce7a3" opacity=".2">
        <circle cx="390" cy="45" r="100" />
        <circle cx="390" cy="45" r="80" />
      </g>
      <text
        x="250"
        y="150"
        textAnchor="middle"
        fill="#f5e8cf"
        fontFamily="serif"
        fontWeight="700"
        fontSize="56"
      >
        {lang === "ar" ? "أثرٌ جميل" : "Make a mark."}
      </text>
      <path d="M 210 184 h 80" stroke="#cce7a3" />
      <text
        x="250"
        y="230"
        textAnchor="middle"
        fill="#cce7a3"
        fontSize="10"
        letterSpacing="4"
      >
        WORDS, WITH CHARACTER
      </text>
    </svg>
  );
}
