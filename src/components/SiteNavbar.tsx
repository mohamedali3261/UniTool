import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Menu, X, Globe, ArrowUpLeft, ChevronDown } from "lucide-react";
import { navbarSections, isCurrentSitePage } from "./navbarSections";
import { BrandLogo } from "./BrandLogo";
import { DownloadPopupModal } from "./DownloadPopupModal";
import {
  recordPageVisit,
  syncStackOnPopState,
} from "../utils/navigationHistory";
import "./site-navbar.css";
export function SiteNavbar({
  lang: controlled,
  onToggleLang,
  home = false,
  fixed = false,
  actions,
  onBack,
}: {
  lang?: "ar" | "en";
  onToggleLang?: () => void;
  home?: boolean;
  fixed?: boolean;
  actions?: ReactNode;
  /** Kept for API compatibility; the navbar no longer renders a back button. */
  onBack?: () => void;
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
  const groupId = useId();
  const id = home ? "home-mobile-nav" : "site-mobile-nav";
  useEffect(() => {
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        root.current
          ?.querySelectorAll("details[open]")
          .forEach((d) => d.removeAttribute("open"));
        if (root.current?.contains(document.activeElement)) {
          if (window.innerWidth < 960) trigger.current?.focus();
          else root.current?.querySelector<HTMLElement>('summary')?.focus();
        }
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
    const focusOutside = (e: FocusEvent) => {
      if (!root.current?.contains(e.target as Node)) {
        setOpen(false);
        root.current?.querySelectorAll('details[open]').forEach(detail => detail.removeAttribute('open'));
      }
    };
    const resize = () => {
      if (window.innerWidth >= 960) setOpen(false);
    };
    document.addEventListener("keydown", escape);
    document.addEventListener("pointerdown", outside);
    document.addEventListener("focusin", focusOutside);
    window.addEventListener("resize", resize);
    return () => {
      document.removeEventListener("keydown", escape);
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("focusin", focusOutside);
      window.removeEventListener("resize", resize);
    };
  }, []);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [open]);
  const closeMenus = () => {
    setOpen(false);
    root.current?.querySelectorAll('details[open]').forEach(detail => detail.removeAttribute('open'));
  };
  const sections = (mobile: boolean) => navbarSections.map(group => (
    <section className="ut-nav-group" key={group.id} aria-labelledby={`${groupId}-${mobile ? 'mobile' : 'desktop'}-${group.id}`}>
      <h2 id={`${groupId}-${mobile ? 'mobile' : 'desktop'}-${group.id}`}>{group[lang]}</h2>
      <div className="ut-nav-group-links">
        {group.pages.map(page => (
          <a key={page.href} href={page.href}
            aria-current={isCurrentSitePage(page.href, location.pathname) ? 'page' : undefined}
            onClick={closeMenus}>
            <span className="ut-nav-link-icon"><page.icon size={16} aria-hidden="true" /></span>
            <span>{page[lang]}</span>
          </a>
        ))}
      </div>
    </section>
  ));
  useEffect(() => {
    recordPageVisit();
    const onPop = () => syncStackOnPopState();
    const onHash = () => recordPageVisit();
    window.addEventListener("popstate", onPop);
    window.addEventListener("hashchange", onHash);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("hashchange", onHash);
    };
  }, []);
  return (
    <header
      ref={root}
      data-site-navbar
      className={`ut-site-nav ${home ? "home-header" : ""} ${fixed ? "ut-nav-fixed" : ""}`}
      dir={ar ? "rtl" : "ltr"}
    >
      <div className="ut-nav-inner">
        <div className="ut-nav-brand-wrap">
          {/* No back button here: every tool already ships its own back bar
              (ToolNavigationBar), so the navbar stays brand + links only. */}
          <a
            className="home-brand ut-nav-brand"
            href="/index.html"
            aria-label="UniTool"
          >
            <BrandLogo width={128} height={40} />
          </a>
        </div>
        <nav
          className="ut-nav-desktop desktop-home-nav"
          aria-label={ar ? "التنقل الرئيسي" : "Main navigation"}
        >
          <a href="/index.html" aria-current={isCurrentSitePage('/index.html', location.pathname) ? 'page' : undefined}>{ar ? 'الرئيسية' : 'Home'}</a>
          <a href="/app.html" aria-current={isCurrentSitePage('/app.html', location.pathname) ? 'page' : undefined}>{ar ? 'الأدوات' : 'Tools'}</a>
          <details className="ut-nav-sections">
            <summary>{ar ? 'كل الأقسام' : 'Workspaces'}<ChevronDown size={14} aria-hidden="true" /></summary>
            <div className="ut-nav-mega">{sections(false)}</div>
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
          <a className="ut-nav-start header-start" href="/app.html">
            {ar ? "ابدأ العمل" : "Get started"}
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
      {open && <button type="button" className="ut-nav-backdrop" tabIndex={-1}
        aria-label={ar ? 'إغلاق القائمة' : 'Close menu'} onClick={() => { closeMenus(); trigger.current?.focus(); }} />}
      {open && (
        <nav
          id={id}
          className="ut-nav-mobile home-mobile-nav"
          aria-label={ar ? "القائمة الرئيسية" : "Main menu"}
        >
          <div className="ut-nav-mobile-heading">
            <span>{ar ? 'مساحاتك في UniTool' : 'Your UniTool workspace'}</span>
            <small>{ar ? 'اختار القسم وكمّل شغلك' : 'Pick a space. Keep creating.'}</small>
          </div>
          {sections(true)}
        </nav>
      )}
      <DownloadPopupModal lang={lang} />
    </header>
  );
}
