import { SiteNavbar } from "./SiteNavbar";
export { sitePages } from "../config/sitePages";
export function Header({
  lang,
  onToggleLang,
}: {
  lang: "ar" | "en";
  onToggleLang: () => void;
  onOpenMobileMenu: () => void;
}) {
  return <SiteNavbar fixed lang={lang} onToggleLang={onToggleLang} />;
}
