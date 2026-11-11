import type { ReactNode } from "react";

const C = {
  card: "var(--tp-card)",
  soft: "var(--tp-surface)",
  line: "var(--tp-line)",
  ink: "var(--tp-ink)",
  muted: "var(--tp-muted)",
  accent: "var(--tp-accent)",
  tint: "var(--tp-accent-soft)",
  onAccent: "var(--tp-on-accent)",
  rose: "#e11d48",
  blue: "#2563eb",
  amber: "#d97706",
  violet: "#24795e",
  teal: "#0d9488",
};

function Badge({
  x,
  y,
  w,
  text,
  fill = C.accent,
  color = C.onAccent,
}: {
  x: number;
  y: number;
  w: number;
  text: string;
  fill?: string;
  color?: string;
}) {
  return (
    <g>
      <rect x={x} y={y} width={w} height="22" rx="6" fill={fill} />
      <text
        x={x + w / 2}
        y={y + 14.5}
        textAnchor="middle"
        fontSize="9.5"
        fontWeight="700"
        fill={color}
      >
        {text}
      </text>
    </g>
  );
}

function PageBox({
  x,
  y,
  w = 64,
  h = 84,
  tag,
  tagColor = C.rose,
}: {
  x: number;
  y: number;
  w?: number;
  h?: number;
  tag?: string;
  tagColor?: string;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx="7"
        fill={C.card}
        stroke={C.line}
        strokeWidth="1.4"
      />
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          x={x + 10}
          y={y + h - 34 + i * 9}
          width={i === 2 ? w * 0.46 : w - 20}
          height="4"
          rx="2"
          fill={C.line}
        />
      ))}
      {tag && (
        <>
          <rect x={x + 9} y={y + 9} width="32" height="15" rx="4" fill={tagColor} />
          <text
            x={x + 25}
            y={y + 19.5}
            textAnchor="middle"
            fontSize="8"
            fontWeight="700"
            fill="#fff"
          >
            {tag}
          </text>
        </>
      )}
    </g>
  );
}

function Arrow({ x1, y, x2 }: { x1: number; y: number; x2: number }) {
  return (
    <g stroke={C.accent} strokeWidth="2.2" strokeLinecap="round" fill="none">
      <path d={`M${x1} ${y}H${x2}`} />
      <path d={`M${x2 - 6} ${y - 5}L${x2} ${y}L${x2 - 6} ${y + 5}`} />
    </g>
  );
}

export function ToolArtwork({ id }: { id: string }): ReactNode {
  let scene: ReactNode;
  switch (id) {
    case "excelStudio":
    case "sheets":
      scene = (
        <>
          <rect
            x="16"
            y="14"
            width="176"
            height="104"
            rx="8"
            fill={C.card}
            stroke={C.line}
          />
          <rect x="16" y="14" width="176" height="22" rx="8" fill={C.tint} />
          <text x="26" y="28" fontSize="9" fontWeight="700" fill={C.accent}>
            fx =SUM(C2:C5)
          </text>
          {[0, 1, 2].map((r) =>
            [0, 1, 2].map((c) => (
              <rect
                key={`${r}-${c}`}
                x={24 + c * 54}
                y={43 + r * 23}
                width="48"
                height="18"
                rx="3"
                fill={r === 2 && c === 2 ? C.tint : C.soft}
                stroke={r === 2 && c === 2 ? C.accent : C.line}
              />
            )),
          )}
          <text x="156" y="102" textAnchor="middle" fontSize="8.5" fontWeight="700" fill={C.accent}>
            24,850
          </text>
          <rect x="204" y="14" width="90" height="104" rx="8" fill={C.card} stroke={C.line} />
          {[32, 54, 42, 74].map((bh, i) => (
            <rect
              key={i}
              x={216 + i * 18}
              y={106 - bh}
              width="12"
              height={bh}
              rx="3"
              fill={i === 3 ? C.accent : C.line}
            />
          ))}
          <Badge x={16} y={124} w={116} text="XLSX · FORMULAS" />
        </>
      );
      break;

    case "imageToPdf":
      scene = (
        <>
          {[0, 1, 2].map((i) => (
            <g key={i} transform={`translate(${18 + i * 24} ${18 + i * 12}) rotate(${-6 + i * 5})`}>
              <rect width="58" height="68" rx="6" fill={C.card} stroke={C.line} strokeWidth="1.4" />
              <rect x="6" y="6" width="46" height="42" rx="4" fill={C.tint} />
              <circle cx="20" cy="18" r="5" fill={C.amber} />
              <path d="M8 46L24 28L36 39L44 31L50 46Z" fill={C.accent} />
              <text x="29" y="61" textAnchor="middle" fontSize="7.5" fill={C.muted}>
                IMG 0{i + 1}
              </text>
            </g>
          ))}
          <Arrow x1={146} y={72} x2={192} />
          <PageBox x={206} y={24} w={82} h={104} tag="PDF" tagColor={C.rose} />
          <Badge x={215} y={96} w={64} text="3 → 1 PDF" />
        </>
      );
      break;

    case "pdfToImage":
      scene = (
        <>
          <PageBox x={20} y={24} w={78} h={104} tag="PDF" tagColor={C.rose} />
          <Arrow x1={110} y={74} x2={154} />
          {[
            ["PNG", 168, 18, C.teal],
            ["JPG", 224, 52, C.amber],
          ].map(([fmt, x, y, col]) => (
            <g key={String(fmt)}>
              <rect
                x={Number(x)}
                y={Number(y)}
                width="68"
                height="78"
                rx="7"
                fill={C.card}
                stroke={C.line}
                strokeWidth="1.4"
              />
              <rect x={Number(x) + 7} y={Number(y) + 8} width="54" height="42" rx="4" fill={C.tint} />
              <circle cx={Number(x) + 22} cy={Number(y) + 21} r="5" fill={String(col)} />
              <path
                d={`M${Number(x) + 9} ${Number(y) + 48}L${Number(x) + 28} ${Number(y) + 29}L${Number(x) + 59} ${Number(y) + 48}Z`}
                fill={C.accent}
              />
              <Badge x={Number(x) + 12} y={Number(y) + 53} w={44} text={String(fmt)} fill={String(col)} />
            </g>
          ))}
        </>
      );
      break;

    case "pdfToWord":
      scene = (
        <>
          <PageBox x={24} y={24} w={82} h={106} tag="PDF" tagColor={C.rose} />
          <Arrow x1={120} y={77} x2={176} />
          <PageBox x={190} y={24} w={94} h={106} tag="DOCX" tagColor={C.blue} />
          <rect x="202" y="50" width="54" height="12" rx="3" fill={C.tint} />
          <text x="207" y="59" fontSize="8" fontWeight="700" fill={C.ink}>
            Editable text|
          </text>
          <path d="M262 50V63" stroke={C.blue} strokeWidth="2" />
        </>
      );
      break;

    case "wordToPdf":
      scene = (
        <>
          <PageBox x={22} y={24} w={92} h={106} tag="DOCX" tagColor={C.blue} />
          <text x="34" y="62" fontSize="13" fontWeight="700" fill={C.blue}>
            W · Draft
          </text>
          <Arrow x1={128} y={77} x2={182} />
          <PageBox x={196} y={24} w={88} h={106} tag="PDF" tagColor={C.rose} />
          <circle cx="262" cy="52" r="11" fill={C.tint} stroke={C.accent} />
          <path d="M257 52L261 56L268 48" stroke={C.accent} strokeWidth="2" fill="none" />
        </>
      );
      break;

    case "pdfCompressor":
      scene = (
        <>
          <PageBox x={20} y={18} w={88} h={118} tag="PDF" tagColor={C.rose} />
          <text x="64" y="76" textAnchor="middle" fontSize="11" fontWeight="700" fill={C.ink}>
            18.4 MB
          </text>
          <Arrow x1={122} y={62} x2={176} />
          <Badge x={123} y={76} w={52} text="-88%" />
          <PageBox x={194} y={38} w={66} h={84} tag="PDF" tagColor={C.accent} />
          <text x="227" y="83" textAnchor="middle" fontSize="10" fontWeight="700" fill={C.accent}>
            2.1 MB
          </text>
        </>
      );
      break;

    case "pdfMerger":
      scene = (
        <>
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <rect
                x={18 + i * 38}
                y={26 + (i % 2) * 14}
                width="50"
                height="68"
                rx="6"
                fill={C.card}
                stroke={C.line}
                strokeWidth="1.4"
              />
              <text
                x={43 + i * 38}
                y={64 + (i % 2) * 14}
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                fill={C.violet}
              >
                0{i + 1}
              </text>
            </g>
          ))}
          <Arrow x1={156} y={74} x2={196} />
          <PageBox x={208} y={22} w={84} h={110} tag="MERGED" tagColor={C.violet} />
          <Badge x={218} y={56} w={64} text="01+02+03" fill={C.tint} color={C.ink} />
        </>
      );
      break;

    case "pdfSplitter":
      scene = (
        <>
          <PageBox x={20} y={24} w={78} h={108} tag="PDF" tagColor={C.rose} />
          <path d="M128 18V138" stroke={C.amber} strokeWidth="2" strokeDasharray="5 5" />
          <circle cx="128" cy="48" r="12" fill={C.card} stroke={C.amber} strokeWidth="1.6" />
          <text x="128" y="52" textAnchor="middle" fontSize="12" fill={C.amber}>
            ✂
          </text>
          <PageBox x={156} y={18} w={62} h={76} tag="P.01" tagColor={C.accent} />
          <PageBox x={228} y={56} w={62} h={76} tag="P.04" tagColor={C.teal} />
        </>
      );
      break;

    case "pdfProtect":
      scene = (
        <>
          <PageBox x={34} y={22} w={84} h={112} tag="PDF" tagColor={C.rose} />
          <path
            d="M196 24L244 42V82C244 110 222 128 196 138C170 128 148 110 148 82V42Z"
            fill={C.tint}
            stroke={C.accent}
            strokeWidth="2"
          />
          <rect x="180" y="72" width="32" height="26" rx="5" fill={C.accent} />
          <path
            d="M186 72V62A10 10 0 0 1 206 62V72"
            stroke={C.accent}
            strokeWidth="3"
            fill="none"
          />
          <Badge x={156} y={114} w={80} text="••••••••" fill={C.card} color={C.ink} />
        </>
      );
      break;

    case "pdfUnlock":
      scene = (
        <>
          <PageBox x={30} y={22} w={84} h={112} tag="PDF" tagColor={C.amber} />
          <circle cx="198" cy="74" r="46" fill={C.tint} stroke={C.accent} strokeDasharray="5 4" />
          <rect x="178" y="76" width="38" height="28" rx="6" fill={C.amber} />
          <path
            d="M186 76V58A12 12 0 0 1 210 54"
            stroke={C.amber}
            strokeWidth="3.2"
            strokeLinecap="round"
            fill="none"
          />
          <Badge x={152} y={116} w={92} text="UNLOCKED ✓" />
        </>
      );
      break;

    case "pdfSigner":
      scene = (
        <>
          <rect x="26" y="18" width="184" height="120" rx="9" fill={C.card} stroke={C.line} />
          <rect x="42" y="34" width="110" height="6" rx="3" fill={C.line} />
          <rect x="42" y="48" width="144" height="5" rx="2.5" fill={C.line} />
          <path
            d="M46 104C66 76 82 114 98 88C112 66 124 106 156 90"
            stroke={C.accent}
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          <path d="M42 114H174" stroke={C.line} strokeDasharray="3 3" />
          <circle cx="252" cy="78" r="32" fill={C.tint} stroke={C.accent} strokeWidth="2" />
          <text x="252" y="82" textAnchor="middle" fontSize="9.5" fontWeight="700" fill={C.accent}>
            SIGNED
          </text>
        </>
      );
      break;

    case "documentScanner":
      scene = (
        <>
          <path
            d="M52 36V20H68M242 20H258V36M52 120V136H68M242 136H258V120"
            stroke={C.accent}
            strokeWidth="2.6"
            fill="none"
          />
          <rect x="78" y="24" width="154" height="108" rx="7" fill={C.card} stroke={C.line} />
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x="96" y={42 + i * 18} width={i === 3 ? 84 : 118} height="6" rx="3" fill={C.line} />
          ))}
          <rect x="60" y="72" width="190" height="18" fill={C.tint} />
          <path d="M56 72H254" stroke={C.accent} strokeWidth="2.5" />
          <Badge x={212} y={104} w={68} text="OCR · HD" />
        </>
      );
      break;

    case "pdfTools":
      scene = (
        <>
          {[
            ["MERGE", C.violet],
            ["SPLIT", C.teal],
            ["COMPRESS", C.accent],
            ["SIGN", C.amber],
            ["PROTECT", C.rose],
            ["OCR", C.blue],
          ].map(([label, col], i) => {
            const x = 18 + (i % 3) * 94,
              y = 18 + Math.floor(i / 3) * 62;
            return (
              <g key={String(label)}>
                <rect x={x} y={y} width="84" height="52" rx="8" fill={C.card} stroke={C.line} />
                <circle cx={x + 18} cy={y + 26} r="7" fill={String(col)} />
                <text x={x + 32} y={y + 29} fontSize="8.5" fontWeight="700" fill={C.ink}>
                  {label}
                </text>
              </g>
            );
          })}
        </>
      );
      break;

    case "imageCropper":
      scene = (
        <>
          <rect x="24" y="16" width="194" height="124" rx="8" fill={C.soft} stroke={C.line} />
          <circle cx="72" cy="48" r="13" fill={C.amber} />
          <path d="M32 132L92 68L142 112L174 84L210 132Z" fill={C.accent} opacity=".75" />
          <rect
            x="48"
            y="30"
            width="146"
            height="94"
            fill="none"
            stroke={C.ink}
            strokeWidth="1.8"
            strokeDasharray="5 4"
          />
          <path d="M96 30V124M145 30V124M48 61H194M48 92H194" stroke={C.ink} strokeOpacity=".28" />
          <Badge x={230} y={36} w={64} text="16 : 9" />
          <Badge x={230} y={68} w={64} text="ROTATE" fill={C.card} color={C.ink} />
        </>
      );
      break;

    case "imageCompressor":
      scene = (
        <>
          <rect x="20" y="18" width="270" height="102" rx="9" fill={C.card} stroke={C.line} />
          <rect x="28" y="26" width="122" height="86" rx="5" fill={C.soft} />
          <rect x="160" y="26" width="122" height="86" rx="5" fill={C.tint} />
          <path d="M155 14V126" stroke={C.accent} strokeWidth="2.5" />
          <circle cx="155" cy="70" r="11" fill={C.accent} />
          <text x="89" y="72" textAnchor="middle" fontSize="11" fontWeight="700" fill={C.muted}>
            RAW 6.8 MB
          </text>
          <text x="221" y="72" textAnchor="middle" fontSize="11" fontWeight="700" fill={C.accent}>
            620 KB ✓
          </text>
          <Badge x={106} y={126} w={98} text="SMART QUALITY" />
        </>
      );
      break;

    case "imageTools":
      scene = (
        <>
          {[
            ["CROP", 20, C.violet],
            ["OPTIMIZE", 114, C.amber],
            ["CONVERT", 208, C.teal],
          ].map(([t, x, col]) => (
            <g key={String(t)}>
              <rect x={Number(x)} y="20" width="82" height="94" rx="9" fill={C.card} stroke={C.line} />
              <rect x={Number(x) + 10} y="30" width="62" height="46" rx="5" fill={C.tint} />
              <circle cx={Number(x) + 41} cy="53" r="12" fill={String(col)} />
              <text x={Number(x) + 41} y="98" textAnchor="middle" fontSize="8.5" fontWeight="700" fill={C.ink}>
                {t}
              </text>
            </g>
          ))}
          <Badge x={78} y={124} w={154} text="PNG · JPG · WEBP STUDIO" fill={C.soft} color={C.ink} />
        </>
      );
      break;

    case "videoMerger":
      scene = (
        <>
          {[
            ["CLIP 01", 18, C.blue],
            ["CLIP 02", 114, C.teal],
            ["CLIP 03", 210, C.violet],
          ].map(([label, x, col]) => (
            <g key={String(label)}>
              <rect x={Number(x)} y="24" width="82" height="64" rx="7" fill={C.card} stroke={String(col)} strokeWidth="1.6" />
              <path d={`M${Number(x) + 35} 46L${Number(x) + 51} 56L${Number(x) + 35} 66Z`} fill={String(col)} />
              <text x={Number(x) + 41} y="80" textAnchor="middle" fontSize="7.5" fontWeight="700" fill={C.muted}>
                {label}
              </text>
            </g>
          ))}
          <rect x="18" y="104" width="274" height="24" rx="6" fill={C.tint} stroke={C.accent} />
          <text x="155" y="120" textAnchor="middle" fontSize="9.5" fontWeight="700" fill={C.accent}>
            TIMELINE MERGED → MP4
          </text>
        </>
      );
      break;

    case "videoCompressor":
      scene = (
        <>
          <rect x="20" y="20" width="128" height="90" rx="8" fill={C.card} stroke={C.line} />
          <path d="M74 52L98 65L74 78Z" fill={C.accent} />
          <text x="84" y="101" textAnchor="middle" fontSize="8.5" fontWeight="700" fill={C.muted}>
            84 MB · 1080p
          </text>
          <Arrow x1={158} y={65} x2={194} />
          <rect x="204" y="20" width="86" height="90" rx="8" fill={C.tint} stroke={C.accent} />
          <text x="247" y="62" textAnchor="middle" fontSize="14" fontWeight="700" fill={C.accent}>
            14 MB
          </text>
          <text x="247" y="80" textAnchor="middle" fontSize="8.5" fill={C.ink}>
            H.264 FAST
          </text>
          <Badge x={96} y={122} w={118} text="SMALLER SIZE · HD" />
        </>
      );
      break;

    case "videoToGif":
      scene = (
        <>
          <rect x="20" y="26" width="108" height="84" rx="8" fill={C.card} stroke={C.line} />
          <path d="M66 56L88 68L66 80Z" fill={C.amber} />
          <text x="74" y="100" textAnchor="middle" fontSize="8" fontWeight="700" fill={C.muted}>
            MP4 CLIP
          </text>
          <Arrow x1={138} y={68} x2={176} />
          <rect x="186" y="22" width="104" height="92" rx="9" fill={C.tint} stroke={C.amber} strokeWidth="1.8" />
          <text x="238" y="66" textAnchor="middle" fontSize="22" fontWeight="800" fill={C.amber}>
            GIF
          </text>
          <Badge x={202} y={80} w={72} text="LOOP ∞" fill={C.amber} />
        </>
      );
      break;

    case "videoSubtitles":
      scene = (
        <>
          <rect x="22" y="14" width="266" height="94" rx="9" fill={C.card} stroke={C.line} />
          <circle cx="155" cy="48" r="16" fill={C.tint} />
          <path d="M150 40L164 48L150 56Z" fill={C.accent} />
          <rect x="54" y="76" width="202" height="22" rx="5" fill={C.ink} />
          <text x="155" y="90" textAnchor="middle" fontSize="9.5" fontWeight="700" fill={C.card}>
            CC · مرحبًا بك — Welcome 00:08
          </text>
          {[0, 1, 2].map((i) => (
            <rect key={i} x={22 + i * 92} y="118" width="82" height="20" rx="5" fill={C.tint} stroke={C.accent} />
          ))}
        </>
      );
      break;

    case "videoLogo":
      scene = (
        <>
          <rect x="24" y="16" width="194" height="122" rx="9" fill={C.card} stroke={C.line} />
          <path d="M110 64L136 78L110 92Z" fill={C.muted} />
          <rect x="152" y="26" width="54" height="26" rx="6" fill={C.accent} />
          <text x="179" y="42" textAnchor="middle" fontSize="8.5" fontWeight="700" fill={C.onAccent}>
            ★ LOGO
          </text>
          <rect x="230" y="24" width="60" height="60" rx="7" fill={C.card} stroke={C.line} />
          {[0, 1, 2, 3].map((i) => (
            <rect
              key={i}
              x={238 + (i % 2) * 24}
              y={32 + Math.floor(i / 2) * 24}
              width="18"
              height="18"
              rx="3"
              fill={i === 1 ? C.accent : C.soft}
            />
          ))}
          <Badge x={228} y={98} w={64} text="WATERMARK" fill={C.tint} color={C.ink} />
        </>
      );
      break;

    case "videoFrames":
      scene = (
        <>
          <rect x="16" y="20" width="278" height="22" rx="5" fill={C.soft} stroke={C.line} />
          <text x="155" y="34" textAnchor="middle" fontSize="8.5" fontWeight="700" fill={C.muted}>
            FILMSTRIP → HD STILL FRAMES
          </text>
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <rect
                x={18 + i * 70}
                y="54"
                width="62"
                height="82"
                rx="6"
                fill={C.card}
                stroke={i === 2 ? C.accent : C.line}
                strokeWidth="1.5"
              />
              <rect x={25 + i * 70} y="62" width="48" height="44" rx="4" fill={C.tint} />
              <text x={49 + i * 70} y="124" textAnchor="middle" fontSize="8.5" fontWeight="700" fill={C.ink}>
                #0{i * 3 + 1}
              </text>
            </g>
          ))}
        </>
      );
      break;

    case "compress":
      scene = (
        <>
          <rect x="20" y="24" width="114" height="92" rx="9" fill={C.card} stroke={C.line} />
          {[28, 52, 40, 64, 34, 48].map((h, i) => (
            <rect key={i} x={34 + i * 15} y={92 - h} width="9" height={h} rx="3" fill={C.blue} />
          ))}
          <text x="77" y="106" textAnchor="middle" fontSize="8.5" fontWeight="700" fill={C.muted}>
            WAV · 42 MB
          </text>
          <Arrow x1={144} y={70} x2={182} />
          <rect x="192" y="24" width="98" height="92" rx="9" fill={C.tint} stroke={C.accent} />
          <text x="241" y="66" textAnchor="middle" fontSize="15" fontWeight="700" fill={C.accent}>
            4.8 MB
          </text>
          <Badge x={205} y={78} w={72} text="MP3 · 192k" />
        </>
      );
      break;

    case "audioExtractor":
      scene = (
        <>
          <rect x="34" y="14" width="242" height="52" rx="8" fill={C.card} stroke={C.line} />
          <path d="M56 32L72 40L56 48Z" fill={C.blue} />
          <text x="86" y="44" fontSize="10" fontWeight="700" fill={C.ink}>
            VIDEO SOURCE.mp4
          </text>
          <path d="M155 68V90M149 84L155 91L161 84" stroke={C.accent} strokeWidth="2.2" fill="none" />
          <rect x="34" y="94" width="242" height="48" rx="8" fill={C.tint} stroke={C.accent} />
          {Array.from({ length: 22 }, (_, i) => {
            const h = 10 + ((i * 13) % 26);
            return (
              <rect key={i} x={48 + i * 9.5} y={118 - h / 2} width="4.5" height={h} rx="2" fill={C.accent} />
            );
          })}
        </>
      );
      break;

    case "audioTranscriber":
      scene = (
        <>
          <rect x="18" y="24" width="110" height="108" rx="8" fill={C.card} stroke={C.line} />
          {Array.from({ length: 10 }, (_, i) => {
            const h = 18 + ((i * 19) % 52);
            return <rect key={i} x={30 + i * 9} y={78 - h / 2} width="5" height={h} rx="2.5" fill={C.teal} />;
          })}
          <Arrow x1={136} y={78} x2={166} />
          <rect x="174" y="24" width="118" height="108" rx="8" fill={C.card} stroke={C.line} />
          <Badge x={186} y={36} w={54} text="[00:12]" fill={C.tint} color={C.accent} />
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x="186" y={70 + i * 13} width={i === 3 ? 62 : 94} height="5" rx="2.5" fill={C.ink} opacity=".65" />
          ))}
        </>
      );
      break;

    case "speechToText":
      scene = (
        <>
          <circle cx="76" cy="78" r="44" fill={C.tint} />
          <circle cx="76" cy="78" r="30" fill="none" stroke={C.violet} strokeDasharray="4 4" />
          <rect x="66" y="54" width="20" height="34" rx="10" fill={C.violet} />
          <path d="M58 76A18 18 0 0 0 94 76M76 94V106" stroke={C.violet} strokeWidth="2.5" fill="none" />
          <rect x="138" y="34" width="152" height="88" rx="12" fill={C.card} stroke={C.line} />
          <text x="154" y="64" fontSize="10" fontWeight="700" fill={C.violet}>
            LIVE DICTATION ●
          </text>
          <rect x="154" y="78" width="116" height="6" rx="3" fill={C.ink} opacity=".7" />
          <rect x="154" y="94" width="82" height="6" rx="3" fill={C.accent} />
        </>
      );
      break;

    case "splitter":
      scene = (
        <>
          <rect x="18" y="30" width="274" height="76" rx="9" fill={C.card} stroke={C.line} />
          {Array.from({ length: 28 }, (_, i) => {
            const h = 14 + ((i * 17) % 44),
              inCut = i >= 8 && i <= 19;
            return (
              <rect
                key={i}
                x={30 + i * 9}
                y={68 - h / 2}
                width="5"
                height={h}
                rx="2.5"
                fill={inCut ? C.accent : C.line}
              />
            );
          })}
          <path d="M100 20V116M202 20V116" stroke={C.amber} strokeWidth="2.4" />
          <Badge x={74} y={118} w={54} text="00:14" fill={C.amber} />
          <Badge x={176} y={118} w={54} text="00:38" fill={C.amber} />
        </>
      );
      break;

    case "compressionTools":
      scene = (
        <>
          {[
            ["PDF", 20, 22, C.rose],
            ["MP4", 20, 90, C.blue],
            ["PNG", 230, 22, C.amber],
            ["MP3", 230, 90, C.teal],
          ].map(([t, x, y, col]) => (
            <Badge key={String(t)} x={Number(x)} y={Number(y)} w={60} text={String(t)} fill={String(col)} />
          ))}
          <circle cx="155" cy="78" r="46" fill={C.card} stroke={C.accent} strokeWidth="3" />
          <text x="155" y="76" textAnchor="middle" fontSize="18" fontWeight="800" fill={C.accent}>
            -76%
          </text>
          <text x="155" y="94" textAnchor="middle" fontSize="8" fontWeight="700" fill={C.muted}>
            ALL-IN-ONE
          </text>
        </>
      );
      break;

    case "officeCompressor":
      scene = (
        <>
          {[
            ["W", "DOCX", 22, C.blue],
            ["P", "PPTX", 92, C.amber],
            ["X", "XLSX", 162, C.accent],
          ].map(([letter, ext, x, col]) => (
            <g key={String(ext)}>
              <rect x={Number(x)} y="24" width="60" height="84" rx="8" fill={C.card} stroke={C.line} />
              <circle cx={Number(x) + 30} cy="56" r="15" fill={String(col)} />
              <text x={Number(x) + 30} y="61" textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff">
                {letter}
              </text>
              <text x={Number(x) + 30} y="94" textAnchor="middle" fontSize="8.5" fontWeight="700" fill={C.ink}>
                {ext}
              </text>
            </g>
          ))}
          <Badge x={234} y={54} w={60} text="SLIM ✓" />
          <Badge x={78} y={120} w={154} text="OFFICE SIZE REDUCER" fill={C.tint} color={C.ink} />
        </>
      );
      break;

    case "qrCode":
      scene = (
        <>
          <rect x="34" y="16" width="124" height="124" rx="10" fill={C.card} stroke={C.line} />
          {[
            [46, 28],
            [114, 28],
            [46, 96],
          ].map(([qx, qy], i) => (
            <g key={i}>
              <rect x={qx} y={qy} width="30" height="30" rx="5" fill="none" stroke={C.ink} strokeWidth="4" />
              <rect x={qx + 9} y={qy + 9} width="12" height="12" rx="2" fill={C.accent} />
            </g>
          ))}
          <circle cx="96" cy="78" r="14" fill={C.accent} />
          <text x="96" y="82" textAnchor="middle" fontSize="12" fontWeight="700" fill={C.onAccent}>
            ★
          </text>
          {[C.accent, C.blue, C.rose, C.amber].map((c, i) => (
            <circle key={c} cx={188 + i * 26} cy="48" r="9" fill={c} />
          ))}
          <Badge x={178} y={76} w={106} text="CUSTOM LOGO QR" />
          <Badge x={178} y={106} w={106} text="PNG · SVG" fill={C.soft} color={C.ink} />
        </>
      );
      break;

    case "qrScanner":
      scene = (
        <>
          <path
            d="M36 40V22H54M146 22H164V40M36 116V134H54M146 134H164V116"
            stroke={C.accent}
            strokeWidth="3"
            fill="none"
          />
          <rect x="56" y="38" width="88" height="80" rx="6" fill={C.card} stroke={C.line} />
          <rect x="68" y="50" width="22" height="22" stroke={C.ink} strokeWidth="3" fill="none" />
          <rect x="110" y="50" width="22" height="22" stroke={C.ink} strokeWidth="3" fill="none" />
          <rect x="68" y="84" width="22" height="22" stroke={C.ink} strokeWidth="3" fill="none" />
          <path d="M30 78H170" stroke={C.rose} strokeWidth="2.5" />
          <rect x="182" y="50" width="112" height="56" rx="8" fill={C.tint} stroke={C.accent} />
          <text x="238" y="74" textAnchor="middle" fontSize="8.5" fontWeight="700" fill={C.accent}>
            DECODED LINK ✓
          </text>
          <text x="238" y="92" textAnchor="middle" fontSize="8.5" fill={C.ink}>
            https://unitool
          </text>
        </>
      );
      break;

    case "formatConverter":
      scene = (
        <>
          {[
            ["PNG", "WEBP", 22, C.violet],
            ["MOV", "MP4", 66, C.blue],
            ["WAV", "MP3", 110, C.teal],
          ].map(([from, to, y, col]) => (
            <g key={String(from)}>
              <Badge x={30} y={Number(y)} w={78} text={String(from)} fill={C.card} color={C.ink} />
              <Arrow x1={122} y={Number(y) + 11} x2={186} />
              <Badge x={200} y={Number(y)} w={80} text={String(to)} fill={String(col)} />
            </g>
          ))}
        </>
      );
      break;

    case "siteStorage":
    case "storage":
      scene = (
        <>
          <path
            d="M34 42H112L126 56H276V128H34Z"
            fill={C.card}
            stroke={C.accent}
            strokeWidth="2"
          />
          {["SHEETS", "LOGOS", "READER"].map((name, i) => (
            <g key={name}>
              <rect x={50 + i * 72} y="70" width="60" height="42" rx="6" fill={C.tint} stroke={C.line} />
              <text x={80 + i * 72} y="95" textAnchor="middle" fontSize="8" fontWeight="700" fill={C.ink}>
                {name}
              </text>
            </g>
          ))}
          <Badge x={96} y={16} w={118} text="BACKUP.ZIP ⇄ RESTORE" />
        </>
      );
      break;

    case "design":
      scene = (
        <>
          <rect x="20" y="16" width="200" height="124" rx="9" fill={C.card} stroke={C.line} />
          <circle cx="154" cy="74" r="36" fill={C.amber} opacity=".85" />
          <rect x="44" y="42" width="88" height="64" rx="6" fill={C.violet} opacity=".85" />
          <text x="88" y="82" textAnchor="middle" fontSize="22" fontWeight="800" fill="#fff">
            Aa
          </text>
          <rect x="232" y="16" width="60" height="124" rx="8" fill={C.soft} stroke={C.line} />
          {[C.accent, C.violet, C.amber, C.rose].map((c, i) => (
            <rect key={c} x="242" y={28 + i * 26} width="40" height="16" rx="4" fill={c} />
          ))}
        </>
      );
      break;

    case "video":
      scene = (
        <>
          <rect x="20" y="14" width="270" height="72" rx="8" fill={C.card} stroke={C.line} />
          <circle cx="155" cy="50" r="17" fill={C.accent} />
          <path d="M150 42L164 50L150 58Z" fill={C.onAccent} />
          <rect x="20" y="94" width="270" height="48" rx="8" fill={C.soft} stroke={C.line} />
          <rect x="30" y="102" width="110" height="10" rx="3" fill={C.accent} />
          <rect x="146" y="102" width="96" height="10" rx="3" fill={C.teal} />
          <rect x="52" y="116" width="150" height="8" rx="3" fill={C.violet} />
          <rect x="30" y="128" width="230" height="7" rx="3" fill={C.amber} />
          <path d="M132 90V146" stroke={C.rose} strokeWidth="2" />
        </>
      );
      break;

    case "svg":
      scene = (
        <>
          <rect x="20" y="16" width="270" height="124" rx="9" fill={C.card} stroke={C.line} />
          <path
            d="M48 112C76 28 228 132 258 44"
            stroke={C.accent}
            strokeWidth="4"
            fill="none"
          />
          <path d="M48 112L76 28M258 44L228 132" stroke={C.muted} strokeDasharray="3 3" />
          {[
            [48, 112],
            [76, 28],
            [228, 132],
            [258, 44],
          ].map(([x, y], i) => (
            <rect key={i} x={x - 5} y={y - 5} width="10" height="10" rx="2" fill={C.card} stroke={C.accent} strokeWidth="2" />
          ))}
          <Badge x={102} y={66} w={106} text="<svg path />" />
        </>
      );
      break;

    case "reader":
      scene = (
        <>
          <rect x="24" y="20" width="124" height="114" rx="8" fill={C.card} stroke={C.line} />
          <rect x="38" y="38" width="96" height="14" rx="4" fill={C.tint} />
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x="38" y={64 + i * 14} width={i === 3 ? 60 : 94} height="5" rx="2.5" fill={C.line} />
          ))}
          <g>
            {Array.from({ length: 11 }, (_, i) => {
              const h = 16 + ((i * 21) % 56);
              return <rect key={i} x={168 + i * 11} y={66 - h / 2} width="6" height={h} rx="3" fill={C.amber} />;
            })}
          </g>
          <Badge x={176} y={108} w={98} text="VOICE · 1.25×" fill={C.amber} />
        </>
      );
      break;

    case "logoDesigner":
      scene = (
        <>
          <rect x="22" y="16" width="144" height="122" rx="10" fill={C.card} stroke={C.line} />
          <circle cx="94" cy="68" r="36" fill="none" stroke={C.line} strokeDasharray="4 4" />
          <polygon points="94,36 124,88 64,88" fill={C.accent} />
          <circle cx="94" cy="72" r="11" fill={C.card} />
          <text x="94" y="122" textAnchor="middle" fontSize="10" fontWeight="800" fill={C.ink}>
            BRAND MARK
          </text>
          <Badge x={180} y={28} w={108} text="MOTION TRACKS" />
          <Badge x={180} y={62} w={108} text="GIF · WEBP · MP4" fill={C.tint} color={C.accent} />
          <Badge x={180} y={96} w={108} text="SVG VECTORS" fill={C.soft} color={C.ink} />
        </>
      );
      break;

    case "elements":
      scene = (
        <>
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const x = 20 + (i % 3) * 92,
              y = 18 + Math.floor(i / 3) * 62,
              cols = [C.accent, C.amber, C.violet, C.rose, C.blue, C.teal];
            return (
              <g key={i}>
                <rect x={x} y={y} width="82" height="52" rx="8" fill={C.card} stroke={C.line} />
                {i === 0 && <circle cx={x + 41} cy={y + 26} r="14" fill={cols[i]} />}
                {i === 1 && <polygon points={`${x + 41},${y + 11} ${x + 56},${y + 40} ${x + 26},${y + 40}`} fill={cols[i]} />}
                {i === 2 && <rect x={x + 25} y={y + 14} width="32" height="24" rx="6" fill={cols[i]} />}
                {i === 3 && <path d={`M${x + 24} ${y + 26}H${x + 58}M${x + 48} ${y + 17}L${x + 58} ${y + 26}L${x + 48} ${y + 35}`} stroke={cols[i]} strokeWidth="3.5" fill="none" />}
                {i === 4 && <circle cx={x + 41} cy={y + 26} r="13" stroke={cols[i]} strokeWidth="4" fill="none" />}
                {i === 5 && <Badge x={x + 12} y={y + 15} w={58} text="+ LAYER" fill={cols[i]} />}
              </g>
            );
          })}
        </>
      );
      break;

    case "teacherBoard":
      scene = (
        <>
          <rect x="18" y="14" width="274" height="126" rx="10" fill={C.card} stroke={C.line} />
          <line x1="36" y1="78" x2="186" y2="78" stroke={C.line} strokeWidth="1.5" />
          <line x1="110" y1="26" x2="110" y2="126" stroke={C.line} strokeWidth="1.5" />
          <path
            d="M 46 112 Q 96 34 176 58"
            fill="none"
            stroke={C.accent}
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <rect x="196" y="26" width="84" height="44" rx="7" fill={C.tint} stroke={C.accent} />
          <text x="238" y="46" textAnchor="middle" fontSize="9.5" fontWeight="700" fill={C.accent}>
            a² + b² = c²
          </text>
          <text x="238" y="60" textAnchor="middle" fontSize="8" fill={C.muted}>
            180° · Ruler
          </text>
          <Badge x={200} y={84} w={76} text="SMARTBOARD" />
        </>
      );
      break;

    default:
      scene = (
        <>
          <rect x="24" y="22" width="262" height="112" rx="10" fill={C.card} stroke={C.line} />
          <Badge x={96} y={66} w={118} text={id.toUpperCase()} />
        </>
      );
  }

  return (
    <svg
      className="preview-unique-svg"
      viewBox="0 0 310 156"
      role="img"
      aria-hidden="true"
    >
      {scene}
    </svg>
  );
}
