import { ArrowUpLeft, ShieldCheck } from "lucide-react";
import type { Lang, Translate } from "../core/types";
export function SiteHeader({
  lang,
  setLang,
  t,
}: {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translate;
}) {
  return (
    <header className="ps-sitebar">
      <a href="/index.html" aria-label="UniTool">
        <img src="/UniTool_logo.png" alt="UniTool" />
      </a>
      <a href="/index.html">
        {t("كل الأدوات", "All tools")}
        <ArrowUpLeft size={12} />
      </a>
      <span>
        <ShieldCheck size={13} />
        {t("ملفك يفضل على جهازك", "Your file stays on your device")}
      </span>
      <button onClick={() => setLang(lang === "ar" ? "en" : "ar")}>
        {lang === "ar" ? "EN" : "عربي"}
      </button>
    </header>
  );
}
