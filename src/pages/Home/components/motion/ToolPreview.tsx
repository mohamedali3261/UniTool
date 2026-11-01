import { Check, Play, ArrowRight, FileText, Download } from "lucide-react";
import type { heroScenes } from "./scenes";
type Item = (typeof heroScenes)[number]["items"][number];
/** A lightweight illustrative preview, never a simulated file operation. Real tools remain links. */
export function ToolPreview({ item, ar }: { item: Item; ar: boolean }) {
  const id = item.id.toLowerCase(),
    kind = /excel/.test(id)
      ? "sheet"
      : /qr/.test(id)
        ? "qr"
        : /video|reel/.test(id)
          ? "video"
          : /audio|speech|reader/.test(id)
            ? "audio"
            : /logo|bloub|design|elements/.test(id)
              ? "design"
              : /image|photo|background|compress|resize/.test(id) &&
                  !/pdf/.test(id)
                ? "image"
                : /pdf|word/.test(id)
                  ? "pdf"
                  : "text";
  return (
    <div className={"film-preview preview-" + kind} data-tool={item.id}>
      <header>
        <span>
          <item.icon size={14} />
          {ar ? item.ar : item.en}
        </span>
        <small>{ar ? "معاينة توضيحية" : "ILLUSTRATIVE PREVIEW"}</small>
      </header>
      <div className="film-preview-content" aria-hidden="true">
        {kind === "sheet" ? (
          <>
            <div className="preview-metrics">
              <span>
                REVENUE<b>24,850</b>
                <em>↗ 18.6%</em>
              </span>
              <div>
                {[30, 46, 35, 66, 52, 89, 75].map((h, i) => (
                  <i key={i} style={{ height: h + "%" }} />
                ))}
              </div>
            </div>
            <div className="preview-table">
              {[
                "PRODUCT",
                "QTY",
                "TOTAL",
                "Notebook",
                "24",
                "2,040",
                "Planner",
                "18",
                "2,880",
              ].map((v, i) => (
                <span key={i}>{v}</span>
              ))}
            </div>
            <p className="preview-formula">
              ƒx =SUM(C2:C8) <Check size={10} />
            </p>
          </>
        ) : kind === "video" ? (
          <>
            <div className="preview-video">
              <div className="preview-landscape" />
              <span>
                MAKE IT
                <br />
                <em>MEMORABLE.</em>
              </span>
              <Play size={22} />
            </div>
            <div className="preview-timeline">
              <i />
              <i />
              <i />
              <i />
              <b />
            </div>
            <p>
              00:04 / 00:18 <span>1080p · 30 FPS</span>
            </p>
          </>
        ) : kind === "audio" ? (
          <>
            <div className="preview-audio">
              <Play size={18} />
              <div>
                {Array.from({ length: 27 }, (_, i) => (
                  <i
                    key={i}
                    style={{
                      height: 12 + ((i * 17) % 55) + "px",
                      animationDelay: i * -0.12 + "s",
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="preview-text-lines">
              <i />
              <i />
              <i />
            </div>
            <p>
              00:12 / 00:48 <span>WAV · MP3</span>
            </p>
          </>
        ) : kind === "qr" ? (
          <>
            <svg className="preview-qr" viewBox="0 0 21 21">
              {Array.from({ length: 441 }, (_, i) => {
                const x = i % 21,
                  y = Math.floor(i / 21),
                  finder = (ox: number, oy: number) =>
                    x >= ox &&
                    x < ox + 7 &&
                    y >= oy &&
                    y < oy + 7 &&
                    (x === ox ||
                      x === ox + 6 ||
                      y === oy ||
                      y === oy + 6 ||
                      (x >= ox + 2 &&
                        x <= ox + 4 &&
                        y >= oy + 2 &&
                        y <= oy + 4));
                return finder(0, 0) ||
                  finder(14, 0) ||
                  finder(0, 14) ||
                  (x * 13 + y * 7 + x * y) % 5 < 2 ? (
                  <rect key={i} x={x} y={y} width="1" height="1" />
                ) : null;
              })}
            </svg>
            <p>
              unitool.app <Check size={12} />
            </p>
          </>
        ) : kind === "design" ? (
          <>
            <div className="preview-design">
              <i />
              <b>
                u<span>✦</span>
              </b>
              <small>YOUR NEXT BIG IDEA.</small>
            </div>
            <div className="preview-swatches">
              {["#bddb9b", "#679984", "#f5deb0", "#d3b6ce", "#88b4cc"].map(
                (c) => (
                  <i key={c} style={{ background: c }} />
                ),
              )}
            </div>
          </>
        ) : kind === "image" ? (
          <>
            <div className="preview-image">
              <div className="preview-landscape" />
              <span className="preview-crop" />
              <small>2400 × 1600</small>
            </div>
            <div className="preview-sliders">
              <i />
              <i />
            </div>
            <p>
              ORIGINAL <ArrowRight size={12} /> OPTIMIZED <Check size={12} />
            </p>
          </>
        ) : kind === "pdf" ? (
          <>
            <div className="preview-pages">
              {[0, 1, 2].map((i) => (
                <div key={i}>
                  <FileText size={16} />
                  <i />
                  <i />
                  <i />
                  <b>{String(i + 1).padStart(2, "0")}</b>
                </div>
              ))}
            </div>
            <div className="preview-process">
              <span>DOCUMENT</span>
              <ArrowRight size={14} />
              <span>
                {/word/.test(id) ? "DOCX" : /image/.test(id) ? "PNG" : "PDF"}
              </span>
              <Check size={13} />
            </div>
          </>
        ) : (
          <>
            <div className="preview-document">
              <span>YOUR IDEAS, REIMAGINED.</span>
              <h3>{ar ? "من فكرة… لنتيجة." : "From an idea… to done."}</h3>
              <div className="preview-text-lines">
                <i />
                <i />
                <i />
                <i />
              </div>
            </div>
            <p>
              LOCAL WORKSPACE <Check size={12} />
            </p>
          </>
        )}
      </div>
      <footer>
        <span>
          <i />
          {ar
            ? "كل أداة… تجربة مختلفة."
            : "A different tool. A new possibility."}
        </span>
        <Download size={12} />
      </footer>
    </div>
  );
}
