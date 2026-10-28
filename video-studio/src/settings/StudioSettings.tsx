import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { LazyMotion, domAnimation, MotionConfig } from "motion/react";
export type Quality = "auto" | "light" | "high";
type Preferences = { quality: Quality; livePreviews: boolean };
const defaults: Preferences = { quality: "auto", livePreviews: true };
function read(): Preferences {
  try {
    const v = JSON.parse(
      localStorage.getItem("unitool.studio.preferences") || "null",
    );
    return v &&
      ["auto", "light", "high"].includes(v.quality) &&
      typeof v.livePreviews === "boolean"
      ? v
      : defaults;
  } catch {
    return defaults;
  }
}
const Context = createContext<{
  preferences: Preferences;
  setPreferences: (p: Partial<Preferences>) => void;
  reducedMotion: boolean;
  animateCards: boolean;
  previewWidth: number;
}>({
  preferences: defaults,
  setPreferences: () => {},
  reducedMotion: false,
  animateCards: true,
  previewWidth: 960,
});
export function StudioSettings({ children }: { children: ReactNode }) {
  const [preferences, set] = useState(read);
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion:reduce)").matches,
  );
  useEffect(() => {
    const q = window.matchMedia("(prefers-reduced-motion:reduce)");
    const sync = () => setReducedMotion(q.matches);
    q.addEventListener("change", sync);
    return () => q.removeEventListener("change", sync);
  }, []);
  const [mobile, setMobile] = useState(
    () =>
      window.matchMedia(
        "(max-width:650px), (max-width:900px) and (pointer:coarse), (max-height:500px) and (pointer:coarse)",
      ).matches,
  );
  useEffect(() => {
    const q = window.matchMedia(
      "(max-width:650px), (max-width:900px) and (pointer:coarse), (max-height:500px) and (pointer:coarse)",
    );
    const sync = () => setMobile(q.matches);
    q.addEventListener("change", sync);
    return () => q.removeEventListener("change", sync);
  }, []);
  const setPreferences = (patch: Partial<Preferences>) =>
    set((p) => ({ ...p, ...patch }));
  useEffect(() => {
    try {
      localStorage.setItem(
        "unitool.studio.preferences",
        JSON.stringify(preferences),
      );
    } catch {}
  }, [preferences]);
  const lowMemory =
    ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8) <=
    2;
  const value = useMemo(
    () => ({
      preferences,
      setPreferences,
      reducedMotion,
      animateCards:
        preferences.livePreviews &&
        !reducedMotion &&
        preferences.quality !== "light" &&
        !(preferences.quality === "auto" && lowMemory),
      previewWidth:
        preferences.quality === "light"
          ? 480
          : preferences.quality === "high"
            ? 1280
            : mobile
              ? 640
              : 960,
    }),
    [preferences, reducedMotion, mobile, lowMemory],
  );
  return (
    <Context.Provider value={value}>
      <LazyMotion features={domAnimation} strict>
        <MotionConfig
          reducedMotion={
            reducedMotion || preferences.quality === "light"
              ? "always"
              : "never"
          }
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </MotionConfig>
      </LazyMotion>
    </Context.Provider>
  );
}
export const useStudioSettings = () => useContext(Context);
