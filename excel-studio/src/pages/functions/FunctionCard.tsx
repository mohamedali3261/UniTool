import { Star, ArrowUpLeft } from "lucide-react";
import { useStudio } from "../../app/context";
import { formulaLessons } from "./animations";
import { categoryAr, type FormulaEntry } from "./catalog";
export function FunctionCard({
  entry,
  favorite,
  toggle,
  onOpen,
}: {
  entry: FormulaEntry;
  favorite: boolean;
  toggle: () => void;
  onOpen: () => void;
}) {
  const { t, lang } = useStudio();
  return (
    <article className="xs-function-card">
      <header>
        <span className="xs-function-category">
          {lang === "ar"
            ? categoryAr[entry.category] || entry.category
            : entry.category}
        </span>
        <button
          className={"xs-icon " + (favorite ? "xs-favorite" : "")}
          aria-label={t("تفضيل", "Favorite") + " " + entry.name}
          aria-pressed={favorite}
          onClick={toggle}
        >
          <Star size={16} fill={favorite ? "currentColor" : "none"} />
        </button>
      </header>
      <button className="xs-function-open" onClick={onOpen}>
        <h2 dir="ltr">
          {entry.name}
          <ArrowUpLeft size={16} />
        </h2>
        <h3>{lang === "ar" ? entry.title : entry.description}</h3>
        <p dir={lang === "ar" && entry.ar ? "rtl" : "ltr"}>
          {lang === "ar" && entry.ar ? entry.ar : entry.description}
        </p>
        <code dir="ltr">{entry.example}</code>
        <footer>
          <span
            className={
              entry.status === "tested" ? "xs-supported" : "xs-reference"
            }
          >
            {entry.status === "tested"
              ? t("● مثال قابل للتجربة", "● Try live")
              : t("◌ مرجع Excel", "◌ Excel reference")}
          </span>
          <span>
            {formulaLessons[entry.name]
              ? t("▶ شرح بالحركة", "▶ Animated lesson")
              : t("الشرح والمثال", "Learn & try")}{" "}
            ←
          </span>
        </footer>
      </button>
    </article>
  );
}
