import type { StudioTemplate } from "../types";
import { interfaceFlow } from "./index";
import "./styles.css";
export function InterfaceFeatured({
  busy,
  onUse,
}: {
  busy: boolean;
  onUse: (template: StudioTemplate) => void;
}) {
  return (
    <article
      className="interface-featured"
      aria-label="قالب واجهات الأدوات الخمسة"
    >
      <div className="interface-mini-art" aria-hidden="true">
        <span>01 ━ ● ● ● ●</span>
        <b>Claude Code</b>
        <small>&lt;section class="hero"&gt;</small>
        <div>
          ▦ Dashboard <i>98 ↗</i>
        </div>
        <em>DESIGN → CODE</em>
      </div>
      <div>
        <span className="interface-eyebrow">INTERFACE FLOW / 70 SECONDS</span>
        <h3>واجهات بتتحرك. فكرة بتوصل.</h3>
        <p>
          قالب ريل مستوحى من وصفك: ٥ أدوات، قبل وبعد، كتابة كود، مؤشر وكيبورد
          عربي. العناوين واسم حسابك قابلين للتعديل، مع موسيقى اختيارية وأصوات
          انتقال.
        </p>
        <small>٧ مشاهد • 9:16 • رسم واجهات توضيحي، مش اتصال MCP حقيقي</small>
        <button
          className="primary"
          disabled={busy}
          onClick={() => onUse(interfaceFlow)}
        >
          استخدم قالب الأدوات الخمسة ↗
        </button>
      </div>
    </article>
  );
}
