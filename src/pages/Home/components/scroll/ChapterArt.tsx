import type { scrollChapters } from "./chapters";
type Kind = (typeof scrollChapters)[number]["id"];
/** Lightweight vector motion compositions. No image/video downloads or WebGL contexts. */
export function ChapterArt({ kind }: { kind: Kind }) {
  return (
    <svg
      className={`journey-art art-${kind}`}
      viewBox="0 0 800 580"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <pattern
          id={`journey-grid-${kind}`}
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
        >
          <path d="M40 0H0V40" stroke="currentColor" strokeOpacity=".08" />
        </pattern>
      </defs>
      <rect width="800" height="580" fill={`url(#journey-grid-${kind})`} />
      <circle
        className="journey-orbit"
        cx="400"
        cy="290"
        r="225"
        stroke="currentColor"
        strokeOpacity=".2"
        strokeDasharray="3 12"
      />
      {kind === "tools" && (
        <>
          {[
            ["PDF", 160, 130],
            ["PNG", 600, 130],
            ["MP4", 100, 330],
            ["SVG", 640, 340],
            ["ZIP", 270, 460],
            ["MP3", 500, 470],
          ].map(([text, x, y], i) => (
            <g key={text} className={`fly-piece piece-${i}`}>
              <path
                d={`M${x} ${y}L400 290`}
                stroke="currentColor"
                strokeOpacity=".25"
                strokeDasharray="5 8"
              />
              <rect
                x={Number(x) - 48}
                y={Number(y) - 34}
                width="96"
                height="68"
                rx="18"
                fill="#192620"
                stroke="currentColor"
              />
              <text
                x={x}
                y={Number(y) + 7}
                textAnchor="middle"
                fill="currentColor"
                fontSize="22"
              >
                {text}
              </text>
            </g>
          ))}
          <g className="scene-core">
            <rect
              x="310"
              y="200"
              width="180"
              height="180"
              rx="50"
              fill="currentColor"
            />
            <path
              d="M360 255V305Q400 350 440 305V255"
              stroke="#142019"
              strokeWidth="22"
              strokeLinecap="round"
            />
          </g>
        </>
      )}
      {kind === "pdf" && (
        <>
          {[0, 1, 2].map((i) => (
            <g
              key={i}
              className={`pdf-sheet fly-piece piece-${i}`}
              style={{ transformOrigin: "400px 290px" }}
            >
              <rect
                x={245 + i * 32}
                y={95 + i * 24}
                width="260"
                height="350"
                rx="15"
                fill={i === 2 ? "#f3e7d6" : "#322b27"}
                stroke="currentColor"
                strokeWidth="2"
              />
              {i === 2 && (
                <>
                  <text
                    x="440"
                    y="205"
                    textAnchor="middle"
                    fontSize="50"
                    fill="#382e27"
                  >
                    Aa
                  </text>
                  {[0, 1, 2, 3, 4].map((j) => (
                    <path
                      key={j}
                      d={`M345 ${250 + j * 28}H${j === 4 ? 455 : 480}`}
                      stroke="#998773"
                      strokeWidth="9"
                      strokeLinecap="round"
                    />
                  ))}
                  <rect
                    className="scan-highlight"
                    x="330"
                    y="277"
                    width="165"
                    height="24"
                    fill="currentColor"
                    fillOpacity=".45"
                  />
                </>
              )}
            </g>
          ))}
          <g className="scene-badge">
            <rect
              x="530"
              y="350"
              width="150"
              height="65"
              rx="18"
              fill="currentColor"
            />
            <text
              x="605"
              y="393"
              fill="#30251e"
              textAnchor="middle"
              fontSize="28"
            >
              PDF
            </text>
          </g>
        </>
      )}
      {kind === "sheets" && (
        <>
          <g className="scene-board">
            <rect
              x="120"
              y="130"
              width="560"
              height="340"
              rx="20"
              fill="#172b23"
              stroke="currentColor"
              strokeOpacity=".4"
            />
            {Array.from({ length: 7 }, (_, i) => (
              <path
                key={i}
                d={`M140 ${180 + i * 42}H660`}
                stroke="currentColor"
                strokeOpacity=".17"
              />
            ))}
            {Array.from({ length: 9 }, (_, i) => (
              <path
                key={i}
                d={`M${150 + i * 60} 155V450`}
                stroke="currentColor"
                strokeOpacity=".17"
              />
            ))}
            {[80, 135, 180, 245, 210].map((h, i) => (
              <rect
                className="chart-column"
                key={i}
                x={205 + i * 78}
                y={440 - h}
                width="44"
                height={h}
                rx="7"
                fill="currentColor"
                opacity={0.45 + i * 0.12}
                style={{ transformOrigin: `${227 + i * 78}px 440px` }}
              />
            ))}
          </g>
          <g className="scene-badge">
            <rect
              x="185"
              y="75"
              width="260"
              height="66"
              rx="15"
              fill="currentColor"
            />
            <text
              x="315"
              y="117"
              fill="#142c20"
              textAnchor="middle"
              fontSize="26"
            >
              fx = SUM(A1:A8)
            </text>
          </g>
        </>
      )}
      {kind === "design" && (
        <>
          <g className="scene-board">
            <rect
              x="175"
              y="85"
              width="450"
              height="420"
              rx="22"
              fill="#272238"
              stroke="currentColor"
              strokeOpacity=".5"
            />
            <rect
              x="205"
              y="115"
              width="390"
              height="360"
              rx="5"
              fill="#d6cced"
            />
            <circle cx="470" cy="240" r="100" fill="#9580cd" />
            <path
              className="design-petal"
              d="M300 170Q440 290 300 420Q160 290 300 170Z"
              fill="#4e367c"
            />
            <text
              x="395"
              y="320"
              textAnchor="middle"
              fontSize="70"
              fontWeight="800"
              fill="#1e1733"
            >
              CREATE
            </text>
          </g>
          <g className="scene-badge">
            <rect
              x="490"
              y="370"
              width="170"
              height="72"
              rx="14"
              fill="currentColor"
            />
            <circle cx="524" cy="405" r="13" fill="#6b4a98" />
            <circle cx="566" cy="405" r="13" fill="#f1d18b" />
            <circle cx="608" cy="405" r="13" fill="#9adbc8" />
          </g>
          <rect
            className="draw-path"
            pathLength="1"
            x="235"
            y="235"
            width="315"
            height="120"
            stroke="#fff"
            strokeWidth="2"
            strokeDasharray="1"
          />
        </>
      )}
      {kind === "video" && (
        <>
          <g className="video-frame fly-piece piece-0">
            <rect
              x="100"
              y="110"
              width="310"
              height="200"
              rx="18"
              fill="#204844"
              stroke="currentColor"
            />
            <circle
              cx="255"
              cy="210"
              r="50"
              fill="currentColor"
              fillOpacity=".3"
            />
          </g>
          <g className="video-frame fly-piece piece-1">
            <rect
              x="365"
              y="170"
              width="320"
              height="210"
              rx="18"
              fill="#122d2c"
              stroke="currentColor"
            />
            <path d="M495 230L555 270L495 310Z" fill="currentColor" />
          </g>
          <g className="scene-board">
            <rect
              x="120"
              y="400"
              width="560"
              height="90"
              rx="15"
              fill="#1c3030"
            />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <rect
                key={i}
                x={140 + i * 86}
                y="420"
                width="75"
                height="23"
                rx="5"
                fill="currentColor"
                fillOpacity={i % 2 ? 0.75 : 0.35}
              />
            ))}
            <path
              d="M140 465H650"
              stroke="currentColor"
              strokeWidth="6"
              strokeDasharray="3 8"
            />
            <path
              className="scene-playhead"
              d="M200 390V500"
              stroke="#fff"
              strokeWidth="3"
            />
          </g>
        </>
      )}
      {kind === "svg" && (
        <>
          <path
            d="M155 400C175 30 650 550 640 150"
            stroke="currentColor"
            strokeWidth="75"
            strokeOpacity=".08"
          />
          <path
            className="draw-path"
            pathLength="1"
            d="M155 400C175 30 650 550 640 150"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray="1"
          />
          <path
            d="M155 400L175 100M640 150L650 460"
            stroke="currentColor"
            strokeOpacity=".4"
          />
          {[
            [155, 400],
            [175, 100],
            [640, 150],
            [650, 460],
          ].map(([x, y], i) => (
            <g key={i} className={`fly-piece piece-${i}`}>
              <rect
                x={x - 12}
                y={y - 12}
                width="24"
                height="24"
                fill={i % 2 ? "#233027" : "currentColor"}
                stroke="currentColor"
                strokeWidth="3"
              />
            </g>
          ))}
          <g className="scene-badge">
            <rect
              x="295"
              y="245"
              width="210"
              height="80"
              rx="18"
              fill="#2f2b1e"
              stroke="currentColor"
            />
            <text
              x="400"
              y="296"
              textAnchor="middle"
              fill="currentColor"
              fontSize="36"
            >
              &lt;path /&gt;
            </text>
          </g>
        </>
      )}
      {kind === "logo" && (
        <>
          <g className="logo-mark scene-core">
            <path
              className="logo-half first"
              d="M400 120A145 145 0 1 0 400 410Z"
              fill="currentColor"
            />
            <path
              className="logo-half second"
              d="M410 120A145 145 0 0 1 410 410Z"
              fill="currentColor"
              fillOpacity=".5"
            />
            <circle cx="405" cy="265" r="58" fill="#201b24" />
          </g>
          <path
            className="draw-path"
            pathLength="1"
            d="M220 100H590V440H220Z"
            stroke="currentColor"
            strokeOpacity=".3"
            strokeDasharray="1"
          />
          <text
            x="405"
            y="505"
            textAnchor="middle"
            fill="currentColor"
            fontSize="32"
            letterSpacing="12"
          >
            YOUR MARK
          </text>
        </>
      )}
      {kind === "reader" && (
        <>
          <g className="scene-board">
            <rect
              x="135"
              y="105"
              width="300"
              height="365"
              rx="20"
              fill="#202b40"
              stroke="currentColor"
              strokeOpacity=".4"
            />
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <path
                key={i}
                d={`M175 ${165 + i * 38}H${i % 3 === 0 ? 340 : 390}`}
                stroke="currentColor"
                strokeOpacity={0.2 + i * 0.08}
                strokeWidth="8"
                strokeLinecap="round"
              />
            ))}
          </g>
          <g className="voice-wave">
            {Array.from({ length: 23 }, (_, i) => (
              <rect
                className="voice-bar"
                key={i}
                x={395 + i * 12}
                y={290 - (25 + Math.sin(i * 0.8) ** 2 * 130) / 2}
                width="6"
                height={25 + Math.sin(i * 0.8) ** 2 * 130}
                rx="3"
                fill="currentColor"
                style={{
                  transformOrigin: `${398 + i * 12}px 290px`,
                  animationDelay: `${-i * 0.09}s`,
                }}
              />
            ))}
          </g>
          <g className="scene-badge">
            <circle cx="600" cy="440" r="40" fill="currentColor" />
            <path d="M590 420L620 440L590 460Z" fill="#1d2941" />
          </g>
        </>
      )}
    </svg>
  );
}
