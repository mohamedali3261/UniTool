import { defaults, parseProject, serializeProject, type Design } from "./model";
export const DRAFT_KEY = "unitool-text-studio-v1";
export function restoreDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return {
      design: raw ? parseProject(JSON.parse(raw)) : { ...defaults },
      warning: false,
    };
  } catch {
    return { design: { ...defaults }, warning: true };
  }
}
export function saveDraft(d: Design) {
  localStorage.setItem(DRAFT_KEY, serializeProject(d));
}
