import { validTrack, trackFrame, type MotionTrack } from "./motion-tracks";
import type { Project } from "./types";
export const motionPresets = [
  {
    id: "reveal",
    ar: "ظهور هادئ",
    en: "Soft reveal",
    hintAr: "ظهور تدريجي للشعار ثم ثبات واضح.",
    hintEn: "Fade in, hold, then fade out.",
  },
  {
    id: "rise",
    ar: "صعود أنيق",
    en: "Elegant rise",
    hintAr: "الشعار يصعد من أسفل ويستقر بسلاسة.",
    hintEn: "Lift the whole mark into place.",
  },
  {
    id: "pop",
    ar: "نبضة البداية",
    en: "Spring pop",
    hintAr: "تكبير مرن يجذب الانتباه بدون تشويه.",
    hintEn: "A spring-like scale entrance.",
  },
  {
    id: "spin",
    ar: "دوران خفيف",
    en: "Gentle turn",
    hintAr: "دوران وتكبير حول مركز اللوحة.",
    hintEn: "Turn and scale around the artboard center.",
  },
  {
    id: "assemble",
    ar: "تكوين متتابع",
    en: "Build in sequence",
    hintAr: "الرمز ثم الاسم ثم التفاصيل، عنصرًا وراء الآخر.",
    hintEn: "Reveal the icon, name and details in sequence.",
  },
  {
    id: "pulse",
    ar: "تنفّس مستمر",
    en: "Breathing loop",
    hintAr: "نبضة ناعمة بحلقة متصلة للشعارات الهادئة.",
    hintEn: "A seamless, subtle breathing loop.",
  },
] as const;
export type MotionPreset = (typeof motionPresets)[number]["id"];
export type LogoMotion = {
  preset: MotionPreset;
  duration: number;
  tracks?: Record<string, MotionTrack>;
};
export const defaultMotion: LogoMotion = { preset: "reveal", duration: 3 };
export function validMotion(value: unknown): value is LogoMotion {
  const m = value as LogoMotion;
  return (
    !!m &&
    motionPresets.some((p) => p.id === m.preset) &&
    Number.isFinite(m.duration) &&
    m.duration >= 2 &&
    m.duration <= 6 &&
    (m.tracks === undefined ||
      (typeof m.tracks === "object" &&
        m.tracks !== null &&
        !Array.isArray(m.tracks) &&
        Object.keys(m.tracks).length <= 500 &&
        Object.entries(m.tracks).every(
          ([id, t]) =>
            id.length > 0 &&
            id.length <= 160 &&
            !["__proto__", "constructor", "prototype"].includes(id) &&
            validTrack(t, m.duration),
        )))
  );
}
export function motionSettings(project: Project): LogoMotion {
  return validMotion(project.motion) ? project.motion : defaultMotion;
}
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (v: number) => {
  const x = clamp(v);
  return x * x * (3 - 2 * x);
};
/** Pure evaluation in project units: never mutates the editable source. The
 * same evaluator feeds the live SVG, GIF frames and recorded video. */
export function motionFrame(project: Project, progress: number): Project {
  const settings = motionSettings(project),
    { preset } = settings,
    t = clamp(progress);
  const exit = 1 - smooth((t - 0.82) / 0.18);
  const visible = project.nodes.filter((n) => !n.hidden);
  return {
    ...project,
    nodes: project.nodes.map((n) => {
      if (n.hidden) return { ...n };
      const track = settings.tracks?.[n.id];
      if (track) return trackFrame(n, track, t * settings.duration, project);
      const i = visible.indexOf(n),
        delay =
          preset === "assemble"
            ? (i / Math.max(1, visible.length - 1)) * 0.28
            : 0;
      const enter = smooth((t - delay) / 0.42),
        alpha = preset === "pulse" ? 1 : enter * exit;
      let scale = 1,
        angle = 0,
        dy = 0;
      if (preset === "rise" || preset === "assemble")
        dy = (1 - enter) * project.height * 0.12;
      if (preset === "pop")
        scale = 0.55 + 0.45 * enter + Math.sin(enter * Math.PI) * 0.16;
      if (preset === "spin") {
        scale = 0.7 + 0.3 * enter;
        angle = (1 - enter) * -35;
      }
      if (preset === "pulse")
        scale = 1 - (0.04 * (1 - Math.cos(t * Math.PI * 2))) / 2;
      const rad = (angle * Math.PI) / 180,
        dx = (n.x - project.width / 2) * scale,
        y = (n.y - project.height / 2) * scale;
      return {
        ...n,
        x: project.width / 2 + dx * Math.cos(rad) - y * Math.sin(rad),
        y: project.height / 2 + dx * Math.sin(rad) + y * Math.cos(rad) + dy,
        w: n.w * scale,
        h: n.h * scale,
        fontSize: n.fontSize * scale,
        strokeWidth: n.strokeWidth * scale,
        radius: n.radius * scale,
        spacing: n.spacing * scale,
        shadow: n.shadow * scale,
        blur: n.blur * scale,
        rotation: n.rotation + angle,
        opacity: n.opacity * alpha,
      };
    }),
  };
}
