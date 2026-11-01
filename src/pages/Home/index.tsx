import { HeroMotion } from "./components/motion/HeroMotion";
import "./hero.css";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpLeft,
  ArrowUp,
  Menu,
  X,
  Globe,
  Pause,
  Play,
  Plus,
  ArrowDown,
  MousePointer2,
  Layers3,
  Sparkles,
  Command,
} from "lucide-react";
import { sitePages } from "../../config/sitePages";
import { totalToolCount } from "../ToolsHome/data";
import { copy, studios, type Language } from "./data";
import {
  DesignArt,
  VideoArt,
  SvgArt,
  ReaderArt,
  ToolsArt,
} from "./components/Artwork";
import { ToolDirectory } from "./components/ToolDirectory";
function stored(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
export default function HomePage() {
  const [lang, setLang] = useState<Language>(() =>
    stored("unitool-lang") === "en" ? "en" : "ar",
  );
  const [mobileOpen, setMobileOpen] = useState(false),
    [paused, setPaused] = useState(
      () => stored("unitool-home-motion") === "paused",
    );
  const menuRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const t = copy[lang];
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.title =
      lang === "ar"
        ? "UniTool — مساحة واحدة لكل أفكارك"
        : "UniTool — One workspace. Every possibility.";
    try {
      localStorage.setItem("unitool-lang", lang);
    } catch {}
  }, [lang]);
  useEffect(() => {
    try {
      localStorage.setItem("unitool-home-motion", paused ? "paused" : "on");
    } catch {}
  }, [paused]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) =>
          e.target.classList.toggle("is-in-view", e.isIntersecting),
        ),
      { rootMargin: "80px" },
    );
    document
      .querySelectorAll(".home-art")
      .forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
        if (document.getElementById("home-mobile-nav"))
          menuRef.current?.focus();
      }
      if (
        ((e.key === "/" && !e.ctrlKey && !e.metaKey) ||
          ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k")) &&
        !e.altKey &&
        !(e.target as HTMLElement).closest(
          "input,textarea,[contenteditable=true]",
        )
      ) {
        e.preventDefault();
        document.getElementById("tools")?.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? "auto"
            : "smooth",
        });
        searchRef.current?.focus({ preventScroll: true });
      }
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, []);
  const goSearch = () => {
    document.getElementById("tools")?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
    searchRef.current?.focus({ preventScroll: true });
  };
  return (
    <div className={`home-page ${paused ? "motion-paused" : ""}`}>
      <a href="#main" className="skip-link">
        {t.skip}
      </a>
      <header className="home-header">
        <div className="home-container header-inner">
          <a className="home-brand" href="/index.html" aria-label="UniTool">
            <img
              src="/UniTool_logo.png"
              alt="UniTool"
              width="128"
              height="32"
              className="restored-brand-logo"
            />
          </a>
          <nav className="desktop-home-nav" aria-label={t.menu}>
            <a href="#tools">{t.navTools}</a>
            <a href="#studios">{t.navStudios}</a>
            <a href="/elements.html">
              {lang === "ar" ? "العناصر" : "Elements"}
            </a>
            <a href="#how">{t.navHow}</a>
          </nav>
          <div className="header-actions">
            <button
              className="icon-action motion-toggle"
              aria-label={paused ? t.resume : t.pause}
              title={paused ? t.resume : t.pause}
              aria-pressed={paused}
              onClick={() => setPaused((v) => !v)}
            >
              {paused ? <Play size={16} /> : <Pause size={16} />}
            </button>
            <button
              className="language-toggle"
              aria-label={
                lang === "ar" ? "Switch to English" : "التحويل إلى العربية"
              }
              onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            >
              <Globe size={14} />
              {lang === "ar" ? "EN" : "عربي"}
            </button>
            <a className="header-start" href="#studios">
              {t.start}
              <ArrowUpLeft size={15} />
            </a>
            <button
              ref={menuRef}
              className="mobile-home-toggle icon-action"
              aria-label={t.menu}
              aria-expanded={mobileOpen}
              aria-controls="home-mobile-nav"
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <nav
            id="home-mobile-nav"
            className="home-mobile-nav"
            aria-label={t.menu}
          >
            {sitePages.map((p) => (
              <a
                href={p.href}
                key={p.href}
                onClick={() => setMobileOpen(false)}
              >
                {p[lang]}
              </a>
            ))}
          </nav>
        )}
      </header>
      <main id="main">
        <section
          className="home-hero home-container hero-workspace-layout"
          id="top"
        >
          <div className="hero-copy">
            <span className="hero-eyebrow">
              <i />
              {t.eyebrow}
              <Sparkles size={14} />
            </span>
            <h1>
              {t.heroA}
              <br />
              <span>
                {t.heroB}
                <svg
                  viewBox="0 0 370 20"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path d="M4 15Q175-8 366 10" />
                </svg>
              </span>
            </h1>
            <p>{t.intro}</p>
            <div className="hero-buttons">
              <a className="home-btn primary" href="#studios">
                {t.explore}
                <ArrowUpLeft size={19} />
              </a>
              <button className="home-btn secondary" onClick={goSearch}>
                {t.find}
                <Command size={17} />
              </button>
              <a className="hero-elements-link" href="/elements.html">
                {lang === "ar" ? "اكتشف مكتبة العناصر" : "Discover elements"}
                <Layers3 size={15} />
              </a>
            </div>
            <span className="browser-note">
              <span /> {t.browser}
            </span>
            <div className="hero-metrics">
              <div>
                <strong>
                  {totalToolCount}
                  <span>+</span>
                </strong>
                <small>{t.tools}</small>
              </div>
              <div>
                <strong>{String(studios.length + 1).padStart(2, "0")}</strong>
                <small>{t.studios}</small>
              </div>
              <div>
                <strong>01</strong>
                <small>{t.one}</small>
              </div>
            </div>
          </div>
          <HeroMotion lang={lang} paused={paused} />
          <a href="#tools" className="hero-scroll">
            <ArrowDown size={15} />
            {t.scroll}
            <span>SCROLL TO DISCOVER</span>
          </a>
        </section>
        <div className="workspace-strip">
          <div className="home-container">
            <span>
              {t.strip}
              <Sparkles size={15} />
            </span>
            {[
              { ar: "أدوات يومية", en: "Everyday tools" },
              ...studios.map((s) => s.name),
            ].map((label, i) => (
              <a key={i} href={i === 0 ? "#tools" : `#${studios[i - 1].id}`}>
                <span>0{i + 1}</span>
                {label[lang]}
                <Plus size={13} />
              </a>
            ))}
          </div>
        </div>
        <section className="home-section home-container" id="tools">
          <div className="section-heading">
            <div>
              <span className="section-eyebrow">{t.toolsEyebrow}</span>
              <h2>{t.toolsTitle}</h2>
              <p>{t.toolsDesc}</p>
            </div>
            <a className="subtle-link" href="/app.html">
              {t.allTools}
              <ArrowUpLeft size={17} />
            </a>
          </div>
          <div className="tools-intro-card">
            <div>
              <span className="small-pill">
                <Layers3 size={14} />
                {totalToolCount}{" "}
                {lang === "ar" ? "أداة، مكان واحد" : "tools, one home"}
              </span>
              <h3>
                {lang === "ar" ? (
                  <>
                    الملفات كتير.
                    <br />
                    الخطوات مش لازم تكون.
                  </>
                ) : (
                  <>
                    More files.
                    <br />
                    Not more steps.
                  </>
                )}
              </h3>
              <p>{t.catalogNote}</p>
              <a href="/app.html" className="text-action">
                {t.allTools}
                <ArrowUpLeft size={18} />
              </a>
            </div>
            <ToolsArt />
            <div className="file-formats" aria-hidden="true">
              {["PDF", "PNG", "MP4", "MP3", "DOCX", "SVG"].map((f) => (
                <span key={f}>{f}</span>
              ))}
            </div>
          </div>
          <ToolDirectory lang={lang} searchRef={searchRef} />
        </section>
        <section
          className="home-section home-container studio-section"
          id="studios"
        >
          <div className="section-heading">
            <div>
              <span className="section-eyebrow">{t.studioEyebrow}</span>
              <h2>{t.studioTitle}</h2>
              <p>{t.studioDesc}</p>
            </div>
            <span className="studio-count">
              <i /> {String(studios.length + 1).padStart(2, "0")} CREATIVE SPACES
            </span>
          </div>
          <div className="studio-grid">
            {studios.map((s, i) => (
              <article
                key={s.id}
                id={s.id}
                className={`studio-card studio-${s.id} home-art`}
                style={{ "--studio-color": s.color } as React.CSSProperties}
              >
                <div className="studio-card-top">
                  <span className="studio-icon">
                    <s.icon size={20} />
                  </span>
                  <span>{s.eyebrow}</span>
                  <small>0{i + 1}</small>
                </div>
                <div
                  className="studio-art"
                  role="img"
                  aria-label={`${t.illustration}: ${s.name[lang]}`}
                >
                  {s.id === "design" ? (
                    <DesignArt lang={lang} />
                  ) : s.id === "video" ? (
                    <VideoArt />
                  ) : s.id === "svg" ? (
                    <SvgArt />
                  ) : (
                    <ReaderArt lang={lang} />
                  )}
                </div>
                <div className="studio-card-copy">
                  <h3>{s.name[lang]}</h3>
                  <h4>{s.description[lang]}</h4>
                  <p>{s.detail[lang]}</p>
                  <div className="studio-tags">
                    {s.tags[lang].map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                  <a href={s.href} className="studio-open">
                    {s.action[lang]}
                    <span>
                      <ArrowUpLeft size={19} />
                    </span>
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="home-section how-section" id="how">
          <div className="home-container">
            <span className="section-eyebrow">{t.howEyebrow}</span>
            <h2>{t.howTitle}</h2>
            <div className="how-grid">
              {t.steps.map(([title, description], i) => (
                <div key={title}>
                  <span className="step-number">
                    0{i + 1}
                    <span>
                      {i === 0 ? (
                        <MousePointer2 size={20} />
                      ) : i === 1 ? (
                        <Sparkles size={20} />
                      ) : (
                        <ArrowUpLeft size={20} />
                      )}
                    </span>
                  </span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              ))}
            </div>
            <p className="home-privacy-note">{t.note}</p>
          </div>
        </section>
        <section className="home-container final-cta">
          <span className="cta-asterisk" aria-hidden="true">
            ✳
          </span>
          <span className="section-eyebrow">YOUR NEXT IDEA STARTS HERE.</span>
          <h2>{t.cta}</h2>
          <p>{t.ctaSub}</p>
          <button className="home-btn primary" onClick={goSearch}>
            {t.ctaButton}
            <ArrowUpLeft size={18} />
          </button>
          <div className="cta-ring" />
          <div className="cta-ring second" />
        </section>
      </main>
      <footer className="home-footer home-container">
        <div className="footer-top">
          <a className="home-brand" href="#top" aria-label="UniTool">
            <img
              src="/UniTool_logo.png"
              alt="UniTool"
              width="128"
              height="32"
              className="restored-brand-logo"
            />
          </a>
          <nav
            aria-label={lang === "ar" ? "كل صفحات الموقع" : "All site pages"}
          >
            {sitePages
              .filter((p) => p.href !== "/index.html")
              .map((p) => (
                <a key={p.href} href={p.href}>
                  {p[lang]}
                </a>
              ))}
          </nav>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} UniTool. Built for your next idea.
          </span>
          <a href="#top">
            {t.top}
            <ArrowUp size={14} />
          </a>
        </div>
      </footer>
    </div>
  );
}
