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
      let project = typeof fn === "function" ? fn(s.project) : fn;
      if (project === s.project) return s;
      // Layer deletion can come from any inspector, preview or timeline. Drop stale row metadata centrally.
      if (project.tracks) {
        const valid = new Set([
          "video",
          "text",
          "audio",
          ...(project.overlays || []).map((l) => l.id),
        ]);
        if (Object.keys(project.tracks).some((key) => !valid.has(key)))
          project = {
            ...project,
            tracks: Object.fromEntries(
              Object.entries(project.tracks).filter(([key]) => valid.has(key)),
            ),
          };
      }
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
