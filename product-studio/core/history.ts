import type { Project } from "./model";
export interface History {
  present: Project;
  past: Project[];
  future: Project[];
  origin: Project | null;
}
export type Action =
  | { type: "set"; project: Project }
  | { type: "begin" | "end" | "undo" | "redo" };
export function historyReducer(s: History, a: Action): History {
  if (a.type === "begin") return s.origin ? s : { ...s, origin: s.present };
  if (a.type === "end") {
    if (!s.origin) return s;
    return {
      ...s,
      origin: null,
      past: s.origin === s.present ? s.past : [...s.past, s.origin].slice(-40),
    };
  }
  if (a.type === "set") {
    if (a.project === s.present) return s;
    return {
      ...s,
      present: a.project,
      past: s.origin ? s.past : [...s.past, s.present].slice(-40),
      future: [],
    };
  }
  if (a.type === "undo") {
    const p = s.past.at(-1);
    return p
      ? {
          present: p,
          past: s.past.slice(0, -1),
          future: [s.present, ...s.future],
          origin: null,
        }
      : s;
  }
  if (a.type === "redo") {
    const p = s.future[0];
    return p
      ? {
          present: p,
          past: [...s.past, s.present],
          future: s.future.slice(1),
          origin: null,
        }
      : s;
  }
  return s;
}
