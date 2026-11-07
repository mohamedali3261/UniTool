export const DATABASES: Record<string, { section: string; stores: Record<string, string | null> }> = {
  'designcraft-projects': { section: 'design', stores: { projects: 'id', meta: null } },
  'designcraft-recovery': { section: 'design', stores: { points: 'id' } },
  'unitool-logo-designer': { section: 'logos', stores: { projects: 'id' } },
  'unitool-logo-personal-assets': { section: 'logos', stores: { assets: 'id' } },
  'unitool-video-studio': { section: 'video', stores: { projects: 'id', media: 'key' } },
  'unitool-cv-studio': { section: 'cv', stores: { resumes: 'id' } },
};
export const secretKey = (key: string) => /api.?key|token|secret|password|credential|authorization|cookie/i.test(key);
export const secretField = (key: string) => /^(api.?key|access.?token|refresh.?token|secret|password|authorization|credentials|cookie)$/i.test(key);
export function allowedLocal(key: string) {
  return !secretKey(key) && /^(unitool[-_.:]|designcraft[-_.]|logo[-_.]|excel-studio[.]|cv-studio[.-]|sawti_|audioflow_stt_|bloub:|pdf_editor_elements$|text-studio[.-]|pdf-studio[.-])/.test(key);
}
export function sectionFor(key: string) {
  if (/teacher-board/.test(key)) return 'board';
  if (/designcraft/.test(key)) return 'design';
  if (/logo/.test(key)) return 'logos';
  if (/excel/.test(key)) return 'sheets';
  if (/^(cv-studio|unitool\.cv\.|unitool-cv-studio)/.test(key)) return 'cv';
  if (/sawti|audioflow/.test(key)) return 'audio';
  if (/^(unitool-text-studio|text-studio|pdf-studio)/.test(key)) return 'settings';
  if (/studio|video/.test(key)) return 'video';
  if (/svg|bloub:/.test(key)) return 'svg';
  return 'settings';
}
export function redact(value: any, depth = 0): any {
  if (depth > 80) throw Error('Settings nesting too deep');
  if (Array.isArray(value)) return value.map(v => redact(v, depth + 1));
  if (value && Object.getPrototypeOf(value) === Object.prototype) return Object.fromEntries(Object.entries(value).filter(([key]) => !secretField(key)).map(([k, v]) => [k, redact(v, depth + 1)]));
  return value;
}
export function safeLocalValue(raw: string) {
  let value: any;
  try { value = JSON.parse(raw); } catch { return raw; }
  // Fail closed if sanitizing valid JSON fails: never fall back to unredacted credentials.
  return value && typeof value === 'object' ? JSON.stringify(redact(value)) : raw;
}
