import {
  ArrowUpRight,
  Check,
  FileText,
  Image,
  MousePointer2,
  Music2,
  Play,
  Plus,
  Braces,
  Sparkles,
  Heart,
  Bell,
  LoaderCircle,
  Zap,
  Send,
  ShieldCheck,
  Shapes,
} from "lucide-react";
import type { Language } from "../data";

export function DesignArt({
  compact = false,
  lang = "ar",
}: {
  compact?: boolean;
  lang?: Language;
}) {
  return (
    <div
      className={`design-art ${compact ? "compact" : ""}`}
      aria-hidden="true"
    >
      <div className="art-app-bar">
        <i />
        <i />
        <i />
        <span>DESIGNCRAFT / Untitled</span>
        <b>↗</b>
      </div>
      <div className="design-art-body">
        <div className="art-tools">
          <MousePointer2 />
          <Shapes />
          <Image />
          <span>T</span>
          <Plus />
        </div>
        <div className="art-canvas">
          <span className="art-canvas-label">A LITTLE IDEA, A BIG WORLD.</span>
          <div className="art-flower">
            <svg viewBox="0 0 180 180">
              <g fill="currentColor">
                {Array.from({ length: 8 }, (_, i) => (
                  <ellipse
                    key={i}
                    cx="90"
                    cy="51"
                    rx="22"
                    ry="48"
                    transform={`rotate(${i * 45} 90 90)`}
                  />
                ))}
              </g>
              <circle cx="90" cy="90" r="22" fill="#202c24" />
            </svg>
          </div>
          <div className="art-design-title">
            {lang === "ar" ? (
              <>
                خارج
                <br />
                المألوف.
              </>
            ) : (
              <>
                THINK
                <br />
                DIFFERENT.
              </>
            )}
          </div>
          <div className="selection-corners">
            <i />
            <i />
            <i />
            <i />
          </div>
          <span className="art-canvas-bottom">
            MAKE SOMETHING THAT FEELS LIKE YOU.
          </span>
          <span className="art-orbit-circle" />
        </div>
        <div className="art-properties">
          <span>LAYERS</span>
          <i />
          <i />
          <i />
          <div className="art-color-row">
            <b />
            <b />
            <b />
          </div>
        </div>
      </div>
    </div>
  );
}
export function HeroArt({ lang }: { lang: Language }) {
  return (
    <div
      className="hero-art home-art"
      aria-label={
        lang === "ar"
          ? "رسم توضيحي لمساحة عمل تجمع التصميم والملفات والصوت"
          : "Illustration of a creative workspace"
      }
      role="img"
    >
      <div className="hero-orbit orbit-one" />
      <div className="hero-orbit orbit-two" />
      <div className="hero-cross cross-a">+</div>
      <div className="hero-cross cross-b">+</div>
      <div className="hero-main-window">
        <DesignArt lang={lang} />
      </div>
      <div className="floating-file art-float">
        <div>
          <FileText size={22} />
          <span>PDF</span>
          <Check size={13} />
        </div>
        <b>{lang === "ar" ? "ملفاتك، مترتبة." : "Files, sorted."}</b>
        <small>2 files → 1 file</small>
      </div>
      <div className="floating-audio art-float">
        <span className="audio-play">
          <Play size={14} fill="currentColor" />
        </span>
        <div className="mini-wave">
          {Array.from({ length: 18 }, (_, i) => (
            <i
              key={i}
              style={{
                height: `${10 + ((i * 17) % 29)}px`,
                animationDelay: `${i * -0.12}s`,
              }}
            />
          ))}
        </div>
        <small>00:18</small>
      </div>
      <div className="floating-svg art-float">
        <Braces size={22} />
        <span>made to move.</span>
        <span className="svg-live-dot" />
      </div>
      <div className="hero-cursor">
        <MousePointer2 size={30} fill="#daeaa9" />
        <span>You, creating.</span>
      </div>
      <span className="art-caption">ONE SPACE. ENDLESS POSSIBILITIES.</span>
    </div>
  );
}
export function VideoArt() {
  return (
    <div className="video-art" aria-hidden="true">
      <div className="art-app-bar">
        <i />
        <i />
        <i />
        <span>YOUR NEXT STORY.mp4</span>
        <b>1080p</b>
      </div>
      <div className="video-screen">
        <div className="video-poster">
          <span>
            MAKE
            <br />
            IT <em>MOVE.</em>
          </span>
          <div className="video-arch" />
          <Sparkles className="video-spark" />
        </div>
        <span className="video-play">
          <Play fill="currentColor" size={16} />
        </span>
        <small>00:12 / 00:30</small>
      </div>
      <div className="art-timeline">
        <div className="art-ruler">
          00:00<span>00:10</span>
          <span>00:20</span>
          <span>00:30</span>
        </div>
        <div className="art-track">
          <i />
          <i />
          <i />
        </div>
        <div className="art-track track-text">
          <i />
          <i />
        </div>
        <div className="art-track track-audio">
          <Music2 size={11} />
          <div className="static-wave" />
        </div>
        <span className="art-playhead" />
      </div>
    </div>
  );
}
export function SvgArt() {
  const icons = [Heart, Bell, LoaderCircle, Zap, Send, ShieldCheck];
  return (
    <div className="svg-art" aria-hidden="true">
      <div className="svg-icon-grid">
        {icons.map((Icon, i) => (
          <div key={i} className={`svg-demo svg-demo-${i}`}>
            <Icon size={34} strokeWidth={1.5} />
          </div>
        ))}
      </div>
      <div className="svg-code">
        <span>
          <i /> live.svg
        </span>
        <code>
          <em>&lt;svg</em> viewBox="0 0 24 24"<em>&gt;</em>
          <br />
          &nbsp; &lt;path class="magic" /&gt;
          <br />
          <em>&lt;/svg&gt;</em>
        </code>
        <Check size={14} />
      </div>
      <span className="svg-swatch">&lt;/&gt; CODE MEETS CREATIVITY</span>
    </div>
  );
}
export function ReaderArt({ lang }: { lang: Language }) {
  return (
    <div className="reader-art" aria-hidden="true">
      <div className="art-book">
        <div className="book-page">
          <span>{lang === "ar" ? "كل فكرة عظيمة" : "Every great idea"}</span>
          <span className="word-highlight">
            {lang === "ar" ? "تبدأ بخطوة." : "starts somewhere."}
          </span>
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
        <div className="book-page book-back">
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
        <span className="book-spine" />
      </div>
      <div className="reader-wave">
        {Array.from({ length: 27 }, (_, i) => (
          <i
            key={i}
            style={{
              height: `${8 + ((i * 23) % 42)}px`,
              animationDelay: `${i * -0.09}s`,
            }}
          />
        ))}
      </div>
      <div className="reader-playback">
        <Play fill="currentColor" size={12} />
        <span>00:24</span>
        <div />
        <b>1.5×</b>
      </div>
    </div>
  );
}
export function ToolsArt() {
  return (
    <div className="tools-art home-art" aria-hidden="true">
      <div className="tools-file file-back">
        <Image size={24} />
        <span>image.png</span>
      </div>
      <div className="tools-file file-front">
        <FileText size={28} />
        <span>your-next-file.pdf</span>
        <i />
        <i />
        <i />
        <span className="file-done">
          <Check size={13} /> READY
        </span>
      </div>
      <div className="tools-bubble">
        <ArrowUpRight size={20} />
      </div>
      <span className="tools-art-code">LESS CLICKING. MORE DOING.</span>
    </div>
  );
}
