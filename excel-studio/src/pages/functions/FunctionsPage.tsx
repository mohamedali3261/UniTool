import { useMemo, useState } from "react";
import {
  Search,
  BookOpen,
  Star,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useStudio } from "../../app/context";
import { catalog, categoryAr, type FormulaEntry } from "./catalog";
import { FunctionCard } from "./FunctionCard";
import { FunctionDetail } from "./FunctionDetail";
import "./functions.css";
export default function FunctionsPage() {
  const { t, lang, notice } = useStudio(),
    [query, setQuery] = useState(""),
    [category, setCategory] = useState("all"),
    [mode, setMode] = useState("common"),
    [page, setPage] = useState(0),
    [detail, setDetail] = useState<FormulaEntry | null>(null),
    [favorites, setFavorites] = useState<string[]>(() => {
      try {
        const v = JSON.parse(
          localStorage.getItem("excel-studio.favorites") || "[]",
        );
        return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
      } catch {
        return [];
      }
    });
  const categories = [...new Set(catalog.map((f) => f.category))].sort(),
    filtered = useMemo(
      () =>
        catalog.filter(
          (f) =>
            (mode !== "common" || f.common) &&
            (mode !== "favorites" || favorites.includes(f.name)) &&
            (category === "all" || f.category === category) &&
            [f.name, f.title, f.ar, f.description]
              .join(" ")
              .toLowerCase()
              .includes(query.toLowerCase()),
        ),
      [mode, category, query, favorites],
    );
  return (
    <div className="xs-functions-page">
      <section className="xs-page-heading">
        <div>
          <div className="xs-breadcrumb">
            {t("اتعلّم. جرّب. طبّق.", "LEARN. TRY. APPLY.")}
          </div>
          <h1>
            {t("كل معادلة، ليها حكاية.", "There’s a formula for that.")}{" "}
            <span>ƒx</span>
          </h1>
          <p>
            {t(
              "شرح بسيط للشائعة، وتوثيق إنجليزي للمتقدمة، ومثال وتجربة مباشرة.",
              "Simple guides for everyday formulas, source documentation for advanced functions, and a live playground.",
            )}
          </p>
        </div>
        <span className="xs-library-count">
          <BookOpen size={19} />
          <b>{catalog.length}</b>
          {t("دالة ومرجع", "functions & references")}
        </span>
      </section>
      <div className="xs-library-banner">
        <div>
          <span>ƒx</span>
          <h2>
            {t(
              "افهم المعادلة قبل ما تستخدمها.",
              "Understand it before you use it.",
            )}
          </h2>
          <p>
            {t(
              `${catalog.filter((f) => f.status === "tested").length} دالة لها مثال يعمل هنا. «مرجع Excel» يعني إننا مش بنضمن تشغيلها داخل المحرر. المكتبة ليست كل دوال كل إصدارات Excel.`,
              `${catalog.filter((f) => f.status === "tested").length} functions have a runnable example here. “Excel reference” is not certified for in-app calculation. This is not every function in every Excel version.`,
            )}
          </p>
        </div>
        <div className="xs-banner-equation" dir="ltr">
          <small>SMALL FORMULA. BIG DIFFERENCE.</small>
          <code>=IF(you_try, "you_can", "try_again")</code>
        </div>
      </div>
      <div className="xs-library-filters">
        <label className="xs-search">
          <Search size={18} />
          <input
            aria-label={t("بحث المعادلات", "Search formulas")}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
              if (e.target.value) setMode("all");
            }}
            placeholder={t(
              "دور باسم المعادلة أو اللي عايز تعمله…",
              "Search a formula or what you want to do…",
            )}
          />
        </label>
        <select
          aria-label={t("تصنيف الدوال", "Function category")}
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(0);
            setMode("all");
          }}
        >
          <option value="all">{t("كل التصنيفات", "All categories")}</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {lang === "ar" ? categoryAr[c] || c : c}
            </option>
          ))}
        </select>
      </div>
      <div className="xs-library-tabs">
        {[
          ["common", "ابدأ بالأساسيات", "Start with the essentials"],
          ["all", "كل الدوال", "All functions"],
          ["favorites", "المفضلة", "Favorites"],
        ].map(([v, ar, en]) => (
          <button
            key={v}
            onClick={() => {
              setMode(v);
              setPage(0);
            }}
            className={mode === v ? "active" : ""}
          >
            {v === "favorites" && <Star size={14} />} {t(ar, en)}
          </button>
        ))}
        <small>
          {filtered.length} {t("نتيجة", "results")}
        </small>
      </div>
      <div className="xs-function-grid">
        {filtered.slice(page * 24, page * 24 + 24).map((entry) => (
          <FunctionCard
            key={entry.name}
            entry={entry}
            favorite={favorites.includes(entry.name)}
            toggle={() =>
              setFavorites((old) => {
                const next = old.includes(entry.name)
                  ? old.filter((n) => n !== entry.name)
                  : [...old, entry.name];
                try {
                  localStorage.setItem(
                    "excel-studio.favorites",
                    JSON.stringify(next),
                  );
                } catch {
                  notice(
                    t(
                      "تعذر حفظ المفضلة محليًا.",
                      "Could not save favorites locally.",
                    ),
                  );
                }
                return next;
              })
            }
            onOpen={() => setDetail(entry)}
          />
        ))}
      </div>
      {!filtered.length && (
        <div className="xs-empty">
          <Search size={28} />
          <h2>{t("مفيش نتائج لسه", "No matches yet")}</h2>
          <p>
            {t(
              "جرّب اسم دالة بالإنجليزي، أو اختار تصنيف تاني.",
              "Try an English function name or a different category.",
            )}
          </p>
          <button
            className="xs-button"
            onClick={() => {
              setQuery("");
              setCategory("all");
              setMode("all");
            }}
          >
            {t("إعادة ضبط البحث", "Reset search")}
          </button>
        </div>
      )}
      <div className="xs-pagination">
        <button
          className="xs-button"
          disabled={page === 0}
          onClick={() => setPage((p) => p - 1)}
        >
          <ChevronRight size={15} />
          {t("السابق", "Previous")}
        </button>
        <span dir="ltr">
          {page + 1} / {Math.max(1, Math.ceil(filtered.length / 24))}
        </span>
        <button
          className="xs-button"
          disabled={(page + 1) * 24 >= filtered.length}
          onClick={() => setPage((p) => p + 1)}
        >
          {t("التالي", "Next")}
          <ChevronLeft size={15} />
        </button>
      </div>
      {detail && (
        <FunctionDetail
          key={detail.name}
          entry={detail}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
}
