import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { AlertTriangle, X } from "lucide-react";
import type { Lang } from "../core/types";
import { useSession } from "./useSession";
import { SiteHeader } from "../components/SiteHeader";
import "./styles.css";
const Welcome = lazy(() => import("../pages/welcome/WelcomePage")),
  Editor = lazy(() => import("../pages/editor/EditorPage"));
export default function App() {
  const state = useSession(),
    [lang, setLang] = useState<Lang>(() => {
      try {
        return localStorage.getItem("pdf-studio.lang") === "en" ? "en" : "ar";
      } catch {
        return "ar";
      }
    }),
    [toast, setToast] = useState(""),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const t = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const notice = useCallback((message: string) => {
    setToast(message);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), 6500);
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    try {
      localStorage.setItem("pdf-studio.lang", lang);
    } catch {}
  }, [lang]);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  return (
    <div className="pdf-studio">
      <a className="ps-skip" href="#ps-content">
        {t("انتقل للمحتوى", "Skip to content")}
      </a>
      <SiteHeader lang={lang} setLang={setLang} t={t} />
      {state.error && (
        <div className="ps-error" role="alert">
          <AlertTriangle size={17} />
          <p>{state.error}</p>
          <button
            aria-label={t("إغلاق التنبيه", "Dismiss error")}
            onClick={() => state.setError("")}
          >
            <X size={15} />
          </button>
        </div>
      )}
      <div id="ps-content">
        <Suspense
          fallback={
            <div className="ps-loading">
              {t("جاري تجهيز المساحة…", "Preparing your workspace…")}
            </div>
          }
        >
          {state.session ? (
            <Editor
              key={state.session.id}
              state={state}
              t={t}
              notice={notice}
            />
          ) : (
            <Welcome load={state.load} loading={state.loading} t={t} />
          )}
        </Suspense>
      </div>
      {toast && (
        <div className="ps-toast" role="status">
          {toast}
          <button
            onClick={() => setToast("")}
            aria-label={t("إغلاق الرسالة", "Dismiss message")}
          >
            <X size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
