import { useEffect, useRef, useState, type ReactNode } from "react";
import { Menu, X, Globe, ArrowUpLeft, ChevronDown } from "lucide-react";
import { sitePages } from "../config/sitePages";
import "./site-navbar.css";
export function SiteNavbar({
  lang: controlled,
  onToggleLang,
  home = false,
  fixed = false,
  actions,
}: {
  lang?: "ar" | "en";
  onToggleLang?: () => void;
  home?: boolean;
  fixed?: boolean;
  actions?: ReactNode;
}) {
  const [local, setLocal] = useState<"ar" | "en">(() => {
    try {
      return localStorage.getItem("unitool-lang") === "en" ? "en" : "ar";
    } catch {
      return "ar";
    }
  });
  const lang = controlled || local,
    ar = lang === "ar";
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLElement>(null),
    trigger = useRef<HTMLButtonElement>(null);
  const id = home ? "home-mobile-nav" : "site-mobile-nav";
  useEffect(() => {
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        root.current
          ?.querySelectorAll("details[open]")
          .forEach((d) => d.removeAttribute("open"));
        if (root.current?.contains(document.activeElement))
          trigger.current?.focus();
      }
    };
    const outside = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) {
        setOpen(false);
        root.current
          ?.querySelectorAll("details[open]")
          .forEach((d) => d.removeAttribute("open"));
      }
    };
    const resize = () => {
      if (window.innerWidth >= 960) setOpen(false);
    };
    document.addEventListener("keydown", escape);
    document.addEventListener("pointerdown", outside);
    window.addEventListener("resize", resize);
    return () => {
      document.removeEventListener("keydown", escape);
      document.removeEventListener("pointerdown", outside);
      window.removeEventListener("resize", resize);
    };
  }, []);
  const section = (hash: string) => (home ? hash : "/index.html" + hash);
  return (
    <header
      ref={root}
      data-site-navbar
      className={`ut-site-nav ${home ? "home-header" : ""} ${fixed ? "ut-nav-fixed" : ""}`}
      dir={ar ? "rtl" : "ltr"}
    >
      <div className="ut-nav-inner">
        <a
          className="home-brand ut-nav-brand"
          href="/index.html"
          aria-label="UniTool"
        >
          <img src="/UniTool_logo.png" alt="UniTool" width="128" height="40" />
        </a>
        <nav
          className="ut-nav-desktop desktop-home-nav"
          aria-label={ar ? "التنقل الرئيسي" : "Main navigation"}
        >
          <a href={section("#tools")}>{ar ? "الأدوات" : "Tools"}</a>
          <a href={section("#studios")}>{ar ? "الاستوديوهات" : "Studios"}</a>
          <a href="/video-studio.html#elements">
            {ar ? "العناصر" : "Elements"}
          </a>
          <a href={section("#how")}>{ar ? "كيف يعمل" : "How it works"}</a>
          <details className="ut-nav-sections">
            <summary>
              {ar ? "كل الأقسام" : "All sections"}
              <ChevronDown size={13} />
            </summary>
            <div>
              {sitePages.map((p) => (
                <a
                  key={p.href}
                  href={p.href}
                  aria-current={
                    location.pathname === p.href ? "page" : undefined
                  }
                >
                  {p[lang]}
                </a>
              ))}
            </div>
          </details>
        </nav>
        <div className="ut-nav-actions">
          {actions}
          <button
            className="language-toggle"
            aria-label={ar ? "Switch to English" : "التحويل إلى العربية"}
            onClick={() => {
              if (onToggleLang) onToggleLang();
              else {
                const next = ar ? "en" : "ar";
                setLocal(next);
                try {
                  localStorage.setItem("unitool-lang", next);
                } catch {}
              }
            }}
          >
            <Globe size={14} />
            {ar ? "EN" : "عربي"}
          </button>
          <a className="ut-nav-start header-start" href={section("#studios")}>
            {ar ? "ابدأ الآن" : "Get started"}
            <ArrowUpLeft size={15} />
          </a>
          <button
            ref={trigger}
            className="ut-menu-toggle mobile-home-toggle"
            aria-label={ar ? "القائمة الرئيسية" : "Main menu"}
            aria-expanded={open}
            aria-controls={id}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {open && (
        <nav
          id={id}
          className="ut-nav-mobile home-mobile-nav"
          aria-label={ar ? "القائمة الرئيسية" : "Main menu"}
        >
          {sitePages.map((p) => (
            <a
              key={p.href}
              href={p.href}
              aria-current={location.pathname === p.href ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {p[lang]}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
