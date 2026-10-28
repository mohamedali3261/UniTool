import { StudioSelect } from "../components/StudioSelect";
import { useEffect, useRef } from "react";
import { Gauge, ChevronDown, ShieldCheck } from "lucide-react";
import { useStudioSettings, type Quality } from "./StudioSettings";
export function PerformanceMenu() {
  const { preferences, setPreferences, reducedMotion } = useStudioSettings();
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const close = (e: PointerEvent) => {
      if (
        !ref.current?.contains(e.target as Node) &&
        !(e.target as HTMLElement).closest("[data-studio-select-content]")
      )
        ref.current?.removeAttribute("open");
    };
    const escape = (e: KeyboardEvent) => {
      if (
        e.key === "Escape" &&
        !e.defaultPrevented &&
        !document.querySelector("[data-studio-select-content]")
      )
        ref.current?.removeAttribute("open");
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);
  return (
    <details className="performance-menu" ref={ref}>
      <summary aria-label="إعدادات الأداء">
        <Gauge size={17} />
        <span>الأداء</span>
        <ChevronDown size={12} />
      </summary>
      <div className="performance-popover">
        <div className="field-heading">
          <b>سلاسة على مقاس جهازك</b>
          <ShieldCheck size={16} />
        </div>
        <label className="field-label">
          جودة المعاينة
          <StudioSelect
            label="جودة المعاينة"
            value={preferences.quality}
            onValueChange={(quality) =>
              setPreferences({ quality: quality as Quality })
            }
            options={[
              {
                value: "auto",
                label: "تلقائي",
                description: "أفضل توازن يناسب جهازك",
              },
              {
                value: "light",
                label: "خفيف — 480 بكسل",
                description: "أقل استهلاكًا للذاكرة والبطارية",
              },
              {
                value: "high",
                label: "عالي — 1280 بكسل",
                description: "تفاصيل أكثر أثناء المعاينة",
              },
            ]}
          />
        </label>
        <label className="preference-check">
          <input
            type="checkbox"
            checked={preferences.livePreviews}
            onChange={(e) => setPreferences({ livePreviews: e.target.checked })}
          />
          معاينات حيّة للكروت
        </label>
        <p>
          معاينة متحركة واحدة في المرة، وتتوقف خارج الشاشة. وضع خفيف يوقف حركة
          الكروت. جودة التصدير مستقلة.
        </p>
        {reducedMotion && (
          <p className="reduced-note">
            تقليل الحركة مفعّل من إعدادات جهازك؛ الكروت ثابتة احترامًا لاختيارك.
          </p>
        )}
      </div>
    </details>
  );
}
