export function CvStudioArt({ lang }: { lang: 'ar' | 'en' }) {
  return (
    <svg
      className="cv-studio-art-svg"
      viewBox="0 0 500 300"
      width="100%"
      height="100%"
      aria-hidden="true"
    >
      <style>{`
        @keyframes ut-cv-scan {
          0%, 100% { transform: translateY(0px); opacity: 0.25; }
          50% { transform: translateY(122px); opacity: 0.72; }
        }
        @keyframes ut-cv-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.045); }
        }
        .cv-art-scanline {
          animation: ut-cv-scan 4.8s ease-in-out infinite;
        }
        .cv-art-ats-pill {
          transform-origin: 368px 98px;
          animation: ut-cv-pulse 3.4s ease-in-out infinite;
        }
        .motion-paused .cv-art-scanline,
        .motion-paused .cv-art-ats-pill {
          animation-play-state: paused !important;
        }
        @media (prefers-reduced-motion: reduce) {
          .cv-art-scanline,
          .cv-art-ats-pill {
            animation: none !important;
          }
        }
      `}</style>

      {/* Outer calm studio frame */}
      <rect
        x="48"
        y="34"
        width="404"
        height="232"
        rx="22"
        fill="var(--art-surface, #eef5f0)"
        stroke="var(--art-border, #cfe0d4)"
        strokeWidth="2"
      />

      {/* Crisp Print-White A4 Paper Sheet */}
      <g>
        <rect
          x="92"
          y="50"
          width="196"
          height="202"
          rx="8"
          fill="#ffffff"
          stroke="#d5e2d8"
          strokeWidth="1.5"
        />
        {/* Accent top rule */}
        <rect x="92" y="50" width="196" height="6" rx="3" fill="#24795e" />

        {/* Header identity */}
        <circle cx="120" cy="80" r="13" fill="#e6f2ec" stroke="#24795e" strokeWidth="1.6" />
        <rect x="142" y="70" width="96" height="8" rx="4" fill="#1f2937" />
        <rect x="142" y="83" width="68" height="5" rx="2.5" fill="#24795e" opacity="0.85" />

        {/* Section 1 */}
        <rect x="108" y="106" width="58" height="5" rx="2.5" fill="#24795e" />
        <rect x="108" y="116" width="162" height="4.5" rx="2.2" fill="#cbd5e1" />
        <rect x="108" y="125" width="146" height="4.5" rx="2.2" fill="#cbd5e1" />

        {/* Section 2 */}
        <rect x="108" y="142" width="66" height="5" rx="2.5" fill="#24795e" />
        <rect x="108" y="152" width="156" height="4.5" rx="2.2" fill="#cbd5e1" />
        <rect x="108" y="161" width="138" height="4.5" rx="2.2" fill="#cbd5e1" />
        <rect x="108" y="170" width="150" height="4.5" rx="2.2" fill="#cbd5e1" />

        {/* Skill pills */}
        <rect x="108" y="188" width="42" height="12" rx="6" fill="#e6f2ec" />
        <rect x="155" y="188" width="48" height="12" rx="6" fill="#e6f2ec" />
        <rect x="208" y="188" width="38" height="12" rx="6" fill="#e6f2ec" />

        {/* Animated ATS scan highlight */}
        <rect
          className="cv-art-scanline"
          x="100"
          y="74"
          width="180"
          height="14"
          rx="4"
          fill="#24795e"
          opacity="0.18"
        />
      </g>

      {/* Right floating ATS & Mode cards */}
      <g className="cv-art-ats-pill">
        <rect
          x="306"
          y="64"
          width="124"
          height="68"
          rx="14"
          fill="var(--art-window, #ffffff)"
          stroke="#24795e"
          strokeWidth="1.8"
        />
        <circle cx="334" cy="98" r="17" fill="none" stroke="#d5e6dd" strokeWidth="4" />
        <circle
          cx="334"
          cy="98"
          r="17"
          fill="none"
          stroke="#24795e"
          strokeWidth="4"
          strokeDasharray="96 110"
          strokeLinecap="round"
        />
        <text x="334" y="102" textAnchor="middle" fill="var(--site-ink, #1f3329)" fontSize="10" fontWeight="800">
          96%
        </text>
        <text x="360" y="94" fill="var(--art-accent, #24795e)" fontSize="10" fontWeight="800">
          ATS READY
        </text>
        <text x="360" y="110" fill="var(--site-muted, #586f60)" fontSize="9">
          {lang === 'ar' ? 'توافق قياسي' : 'A4 · RTL/LTR'}
        </text>
      </g>

      {/* Cover Letter companion mini card */}
      <rect
        x="306"
        y="146"
        width="124"
        height="64"
        rx="13"
        fill="var(--art-accent-soft, #d7ede3)"
        stroke="var(--art-border, #cfe0d4)"
        strokeWidth="1.4"
      />
      <rect x="320" y="161" width="64" height="6" rx="3" fill="var(--art-accent, #24795e)" />
      <rect x="320" y="174" width="94" height="4.5" rx="2.2" fill="var(--site-muted, #586f60)" opacity="0.55" />
      <rect x="320" y="184" width="78" height="4.5" rx="2.2" fill="var(--site-muted, #586f60)" opacity="0.55" />

      <text
        x="368"
        y="236"
        textAnchor="middle"
        fill="var(--site-ink, #243d31)"
        fontSize="11.5"
        fontWeight="700"
      >
        {lang === 'ar' ? 'سيرة وخطاب · جاهزة للطباعة' : 'CV + LETTER · CRISP PDF'}
      </text>
    </svg>
  );
}
