import {
  blankProject,
  newClip,
  uid,
  type Asset,
  type Project,
} from "../../types";
import { Scene, C, k } from "./primitives";
import { cloudflareChecklist } from "./index";
import { hook } from "./scenes/hook";
import { database } from "./scenes/database";
import { secrets } from "./scenes/secrets";
import { caching } from "./scenes/caching";
import { preview } from "./scenes/preview";
import { monitoring } from "./scenes/monitoring";
import { cta } from "./scenes/cta";
const image = (
  name: string,
  svg: string,
  width: number,
  height: number,
): Asset => ({
  id: uid(),
  name,
  type: "image",
  url: `data:image/svg+xml;base64,${btoa(svg)}`,
  width,
  height,
  duration: 66,
  size: svg.length,
});
export function cloudflareProject(): { project: Project; assets: Asset[] } {
  const base = image(
    "cloudflare-neutral.svg",
    '<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1280"><rect width="720" height="1280" fill="#10131a"/></svg>',
    720,
    1280,
  );
  const avatar = image(
    "profile-placeholder.svg",
    '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><circle cx="80" cy="80" r="77" fill="#292f38" stroke="#f6821f" stroke-width="5"/><circle cx="80" cy="61" r="26" fill="#a7b0bd"/><path d="M31 132 Q35 88 80 91 Q125 88 129 132" fill="#a7b0bd"/></svg>',
    160,
    160,
  );
  const global = new Scene(0, 66, "global");
  global.box(
    "الخلفية البرتقالية المتدرجة",
    50,
    50,
    960,
    1707,
    "#0c1119",
    0,
    0,
    {
      animationIn: "none",
      animationOut: "none",
      box: { width: 960, height: 1707, radius: 0, gradient: "#302014" },
    },
  );
  [0, 1, 2, 3, 4].forEach((i) => {
    global.box(`نقطة تقدم ${i + 1}`, 38 + i * 6, 7, 22, 10, C.line, 5, 0, {
      animationIn: "none",
      animationOut: "none",
    });
    const active = global.box(
      `الخطوة النشطة ${i + 1}`,
      38 + i * 6,
      7,
      52,
      10,
      C.orange,
      5,
      0,
      {
        frames: [k(0, { scaleX: 0.4 }), k(0.35, { easing: "spring" })],
        animationIn: "none",
        animationOut: "none",
      },
    );
    active.start = [4, 16, 28, 40, 52][i];
    active.end = [16, 28, 40, 52, 66][i];
  });
  const body = [
    hook(),
    database(),
    secrets(),
    caching(),
    preview(),
    monitoring(),
    cta(),
  ].flat();
  const footer = new Scene(0, 66, "identity");
  footer.box("خط التذييل", 50, 89, 800, 2, C.line, 0, 0, {
    animationIn: "none",
    animationOut: "none",
  });
  footer.text("اسم حسابك الثابت", "@yourname", 58, 92, 30, C.white, 0, {
    font: "mono",
    animationIn: "none",
    animationOut: "none",
  });
  footer.text(
    "وصف الحساب",
    "WEB BUILDER / DEPLOY SMARTER",
    58,
    95,
    17,
    C.muted,
    0,
    { font: "mono", animationIn: "none", animationOut: "none" },
  );
  const project: Project = {
    ...blankProject(),
    name: cloudflareChecklist.name,
    ratio: "9:16",
    clips: cloudflareChecklist.scenes.map((scene) => ({
      ...newClip(base),
      end: scene.seconds,
      volume: 0,
    })),
    texts: [...global.layers, ...body, ...footer.layers],
    markers: [],
    overlays: [
      {
        id: uid(),
        assetId: avatar.id,
        at: 0,
        start: 0,
        end: 66,
        x: 19,
        y: 93,
        width: 10,
        rotation: 0,
        opacity: 1,
        volume: 0,
        foreground: true,
      },
      {
        id: uid(),
        assetId: avatar.id,
        at: 64.4,
        start: 0,
        end: 1.6,
        x: 50,
        y: 67,
        width: 22,
        rotation: 0,
        opacity: 1,
        volume: 0,
        foreground: true,
      },
    ],
    tracks: { text: { collapsed: true } },
  };
  let at = 0;
  for (const scene of cloudflareChecklist.scenes) {
    project.markers!.push({
      id: uid(),
      time: at,
      label: scene.text,
      color: C.orange,
    });
    at += scene.seconds;
  }
  return { project, assets: [base, avatar] };
}
