import type { InterfaceScene } from "./scenes";
import { interfaceScenes } from "./scenes";
import { panel, text } from "./canvas";
import {
  intro,
  design,
  components,
  magic,
  figma,
  devtools,
  outro,
} from "./demos";
const renderers = { intro, design, components, magic, figma, devtools, outro };
/** Pure deterministic canvas scene, shared by preview, PNG and video export.
 * UI is illustrative, not a connection to Figma/MCP/DevTools services. */
export function drawInterfaceScene(
  c: CanvasRenderingContext2D,
  scene: InterfaceScene,
  seconds: number,
  accent = "#4bdfc5",
) {
  c.save();
  const t = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  const active = interfaceScenes.findIndex((s) => s.id === scene) - 1;
  let x = (720 - (active >= 0 && active < 5 ? 176 : 139)) / 2;
  for (let i = 0; i < 5; i++) {
    const on = i === active;
    panel(
      c,
      x,
      98,
      on ? 52 : 15,
      7,
      on || scene === "outro" ? accent : "#28423a",
      undefined,
      4,
    );
    x += on ? 68 : 31;
  }
  renderers[scene](c, t, accent);
  text(
    c,
    "عرض توضيحي • واجهات وبيانات تجريبية",
    360,
    1135,
    16,
    "#718d83",
    "center",
  );
  c.restore();
}
