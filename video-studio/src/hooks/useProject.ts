import { useState } from "react";
import { Project, blankProject } from "../types";
type History = { project: Project; past: Project[]; future: Project[] };
export function useProject() {
  const [state, setState] = useState<History>(() => ({
    project: blankProject(),
    past: [],
    future: [],
  }));
  function update(fn: Project | ((p: Project) => Project)) {
    setState((s) => {
      const project = typeof fn === "function" ? fn(s.project) : fn;
      if (project === s.project) return s;
      return { project, past: [...s.past.slice(-49), s.project], future: [] };
    });
  }
  function undo() {
    setState((s) =>
      s.past.length
        ? {
            project: s.past.at(-1)!,
            past: s.past.slice(0, -1),
            future: [s.project, ...s.future],
          }
        : s,
    );
  }
  function redo() {
    setState((s) =>
      s.future.length
        ? {
            project: s.future[0],
            past: [...s.past, s.project],
            future: s.future.slice(1),
          }
        : s,
    );
  }
  return {
    project: state.project,
    update,
    replace: (project: Project) => setState({ project, past: [], future: [] }),
    undo,
    redo,
    canUndo: !!state.past.length,
    canRedo: !!state.future.length,
  };
}
