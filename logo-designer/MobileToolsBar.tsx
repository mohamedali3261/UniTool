import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Maximize,
  Minimize2,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";
import { useDesigner } from "./state";

export interface MobileToolTab {
  id: string;
  ar: string;
  en: string;
  icon: LucideIcon;
}

export default function MobileToolsBar({
  tabs,
  panelExpanded,
  setPanelExpanded,
}: {
  tabs: MobileToolTab[];
  panelExpanded: boolean;
  setPanelExpanded: (v: boolean) => void;
}) {
  const s = useDesigner();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const barRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const activeTab = tabs.find((t) => t.id === s.tab) || tabs[0];
  const isProps = s.rightOpen;
  const panelOpen = s.leftOpen || s.rightOpen;
  const ActiveIcon = isProps ? SlidersHorizontal : activeTab.icon;
  const activeLabel = isProps
    ? s.t("خصائص التصميم", "Design properties")
    : s.t(activeTab.ar, activeTab.en);

  useEffect(() => {
    if (!menuOpen) return;
    const updatePosition = () => {
      const el = barRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const nav = document.querySelector("[data-site-navbar]");
      const minTop = Math.round(
        (nav ? nav.getBoundingClientRect().bottom : 64) + 6,
      );
      const vh = window.innerHeight;
      const spaceBelow = vh - r.bottom - 8;
      const spaceAbove = r.top - minTop - 6;
      if (spaceBelow >= 285) {
        setMenuStyle({
          top: `${Math.round(r.bottom + 4)}px`,
          bottom: "auto",
          maxHeight: `${Math.floor(spaceBelow)}px`,
        });
      } else if (spaceAbove >= 285) {
        setMenuStyle({
          bottom: `${Math.round(vh - r.top + 4)}px`,
          top: "auto",
          maxHeight: `${Math.floor(spaceAbove)}px`,
        });
      } else {
        setMenuStyle({
          top: `${minTop}px`,
          bottom: "auto",
          maxHeight: `${Math.max(180, Math.floor(vh - minTop - 8))}px`,
        });
      }
    };
    updatePosition();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setMenuOpen(false);
      }
    };
    window.addEventListener("resize", updatePosition);
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("keydown", onKey, true);
    };
  }, [menuOpen, panelOpen, panelExpanded]);

  const chooseTab = (id: string) => {
    s.setTab(id);
    s.setRightOpen(false);
    s.setLeftOpen(true);
    setMenuOpen(false);
  };

  const chooseProperties = () => {
    s.setLeftOpen(false);
    s.setRightOpen(true);
    setMenuOpen(false);
  };

  const chooseHelp = () => {
    setMenuOpen(false);
    s.setModal("help");
  };

  return (
    <div
      ref={barRef}
      className={`ld-mobile-tools-bar ${panelOpen ? "is-open" : "is-collapsed"}`}
    >
      <button
        type="button"
        className="ld-tools-dropdown-trigger"
        aria-label={s.t("قائمة الأدوات", "Tools menu")}
        aria-haspopup="true"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((v) => !v)}
      >
        <span className="ld-tools-trigger-main">
          <span className="ld-tools-trigger-icon">
            <ActiveIcon size={16} />
          </span>
          <span className="ld-tools-trigger-copy">
            <small>{s.t("كل الأدوات", "All tools")}</small>
            <strong>{activeLabel}</strong>
          </span>
        </span>
        <ChevronDown
          size={16}
          className={`ld-tools-chevron ${menuOpen ? "is-open" : ""}`}
        />
      </button>

      <div className="ld-mobile-bar-actions">
        <button
          type="button"
          className="ld-mobile-props-btn"
          aria-label={s.t("طي الخصائص", "Toggle properties")}
          aria-pressed={s.rightOpen}
          onClick={() => {
            setMenuOpen(false);
            if (s.rightOpen) {
              s.setRightOpen(false);
              setPanelExpanded(false);
            } else {
              s.setLeftOpen(false);
              s.setRightOpen(true);
            }
          }}
        >
          <SlidersHorizontal size={16} />
          {s.selected.length > 0 && (
            <b className="ld-props-badge">{s.selected.length}</b>
          )}
        </button>

        {panelOpen && (
          <button
            type="button"
            aria-label={
              s.rightOpen
                ? s.t("توسيع لوحة الخصائص", "Expand properties panel")
                : s.t("توسيع لوحة الأدوات", "Expand tool panel")
            }
            aria-pressed={panelExpanded}
            onClick={() => {
              setMenuOpen(false);
              setPanelExpanded(!panelExpanded);
            }}
          >
            {panelExpanded ? <Minimize2 size={15} /> : <Maximize size={15} />}
          </button>
        )}

        <button
          type="button"
          aria-label={
            s.rightOpen
              ? s.t("إغلاق الخصائص", "Close properties")
              : s.leftOpen
                ? s.t("إغلاق المكتبة", "Close library")
                : s.t("إظهار لوحة الأدوات", "Open tool panel")
          }
          onClick={() => {
            setMenuOpen(false);
            if (s.rightOpen) {
              s.setRightOpen(false);
              setPanelExpanded(false);
            } else if (s.leftOpen) {
              s.setLeftOpen(false);
              setPanelExpanded(false);
            } else {
              s.setLeftOpen(true);
            }
          }}
        >
          {panelOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
      </div>

      {menuOpen && (
        <>
          <div
            className="ld-tools-dropdown-backdrop"
            aria-hidden="true"
            onClick={() => setMenuOpen(false)}
          />
          <div
            ref={menuRef}
            className="ld-tools-dropdown-menu"
            role="group"
            aria-label={s.t("كل الأدوات", "All tools")}
            style={menuStyle}
          >
            <div className="ld-tools-dropdown-grid">
              {tabs.map((t) => {
                const active = !s.rightOpen && s.leftOpen && s.tab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    aria-label={s.t(t.ar, t.en)}
                    aria-pressed={active}
                    onClick={() => chooseTab(t.id)}
                  >
                    <t.icon size={17} />
                    <span>{s.t(t.ar, t.en)}</span>
                  </button>
                );
              })}
              <button
                type="button"
                aria-label={s.t("خصائص التصميم", "Design properties")}
                aria-pressed={s.rightOpen}
                onClick={chooseProperties}
              >
                <SlidersHorizontal size={17} />
                <span>{s.t("خصائص التصميم", "Design properties")}</span>
              </button>
              <button
                type="button"
                aria-label={s.t("مساعدة", "Help")}
                onClick={chooseHelp}
              >
                <HelpCircle size={17} />
                <span>{s.t("مساعدة", "Help")}</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
