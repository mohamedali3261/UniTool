import { useState } from "react";
import type { Design } from "./model";
export function useDesignHistory(initial: Design) {
  const [state, set] = useState({
    past: [] as Design[],
    present: initial,
    future: [] as Design[],
  });
  const change = (patch: Partial<Design>) =>
    set((s) => {
      const next = { ...s.present, ...patch };
      if (JSON.stringify(next) === JSON.stringify(s.present)) return s;
      return {
        past: [...s.past, s.present].slice(-80),
        present: next,
        future: [],
      };
    });
  const undo = () =>
    set((s) =>
      s.past.length
        ? {
            past: s.past.slice(0, -1),
            present: s.past.at(-1)!,
            future: [s.present, ...s.future],
          }
        : s,
    );
  const redo = () =>
    set((s) =>
      s.future.length
        ? {
            past: [...s.past, s.present],
            present: s.future[0],
            future: s.future.slice(1),
          }
        : s,
    );
  return {
    design: state.present,
    change,
    undo,
    redo,
    canUndo: !!state.past.length,
    canRedo: !!state.future.length,
  };
}
