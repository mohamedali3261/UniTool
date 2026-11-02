import { cloudflareChecklist } from "./index";
import type { StudioTemplate } from "../types";
import "./styles.css";
export function CloudflareFeatured({
  busy,
  onUse,
}: {
  busy: boolean;
  onUse: (t: StudioTemplate) => void;
}) {
  return (
    <article className="cloudflare-featured" aria-label="قالب Cloudflare">
      <div>
        <span className="cloudflare-eyebrow">NEW / CODE EXPLAINER REEL</span>
        <h3>
          قبل ما ترفع موقعك…
          <br />
          <em>راجع الخمسة دول.</em>
        </h3>
        <p>
          D1، الأسرار، الكاش، المعاينة والمراقبة. ريل بواجهات متحركة ونصوص
          وأشكال مستقلة قابلة للتعديل، مش تسجيل شاشة مسطّح.
        </p>
        <div className="cloudflare-tags">
          <span>66 ثانية</span>
          <span>720×1280</span>
          <span>7 مشاهد</span>
          <span>HTML مستقل + JSON</span>
        </div>
        <button disabled={busy} onClick={() => onUse(cloudflareChecklist)}>
          استخدم قالب Cloudflare ↗
        </button>
        <nav>
          <a
            href="/video-studio-templates/cloudflare-checklist.html"
            target="_blank"
            rel="noreferrer"
          >
            افتح صفحة الريل والتصدير
          </a>
          <a href="/video-studio-templates/cloudflare-checklist.json" download>
            تنزيل ملف التعديل
          </a>
        </nav>
        <small>
          صورة رمزية و@yourname قابلان للاستبدال • بيانات توضيحية • بدون تعليق
          صوتي
        </small>
      </div>
      <div className="cloudflare-code" dir="ltr">
        <div className="cloudflare-dots">● ● ●</div>
        <span>TERMINAL / DEPLOY SMARTER</span>
        <pre>$ npx wrangler d1 create my-db</pre>
        <b>✓ Database created</b>
        <hr />
        <p>
          01 DATABASE
          <br />
          02 ENVIRONMENT
          <br />
          03 CACHING
          <br />
          04 PREVIEW
          <br />
          05 MONITORING
        </p>
        <strong>READY TO DEPLOY ↗</strong>
      </div>
    </article>
  );
}
