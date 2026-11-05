import type { ReactNode } from "react";
export const contextScenes = [
  ["canvas", "اللوحة", "Artboard"],
  ["video", "مقدمة فيديو", "Video intro"],
  ["phone", "شاشة موبايل", "Mobile screen"],
  ["website", "موقع إلكتروني", "Website"],
] as const;
export function MotionContext({
  scene,
  dark,
  time,
  children,
  lang = "en",
  name = "YOUR BRAND",
}: {
  scene: string;
  dark: boolean;
  time: number;
  children: ReactNode;
  lang?: "ar" | "en";
  name?: string;
}) {
  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      className={`ld-motion-context ld-motion-context-${scene} ${dark ? "is-dark" : ""}`}
    >
      {scene === "canvas" ? (
        children
      ) : scene === "video" ? (
        <div className="ld-motion-video-frame">
          <div className="ld-motion-context-art">{children}</div>
          <div className="ld-motion-video-controls">
            <span>▶</span>
            <i>
              <b style={{ width: `${time * 100}%` }} />
            </i>
            <span>HD</span>
          </div>
        </div>
      ) : scene === "phone" ? (
        <div className="ld-motion-phone-frame">
          <div className="ld-motion-phone-notch" />
          <div className="ld-motion-phone-header">
            <i /> <b>{name}</b> <span>•••</span>
          </div>
          <div className="ld-motion-context-art">{children}</div>
          <div className="ld-motion-phone-footer">
            <span>♡　○　↗</span>
            <i />
            <i />
            <i />
          </div>
        </div>
      ) : (
        <div className="ld-motion-browser-frame">
          <div className="ld-motion-browser-bar">
            <i />
            <i />
            <i />
            <span>yourbrand.example</span>
          </div>
          <div className="ld-motion-site-nav">
            <div className="ld-motion-context-art">{children}</div>
            <div>
              <i />
              <i />
              <i />
            </div>
          </div>
          <div className="ld-motion-site-hero">
            <small>
              {lang === "ar" ? "فصل جديد لعلامتك" : "YOUR NEXT CHAPTER"}
            </small>
            <strong>
              {lang === "ar" ? "مصممة لتشبهك." : "Made to be yours."}
            </strong>
            <p>
              {lang === "ar"
                ? "أفكار مبتكرة. انطباع يدوم."
                : "Creative ideas. Lasting impressions."}
            </p>
            <span>{lang === "ar" ? "اكتشف ←" : "EXPLORE →"}</span>
          </div>
        </div>
      )}
    </div>
  );
}
