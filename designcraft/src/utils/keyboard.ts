/** Physical letter keys keep editor shortcuts usable with Arabic layouts. */
export function shortcutKey(event: Pick<KeyboardEvent, 'code' | 'key'>) {
  if (/^Key[A-Z]$/.test(event.code)) return event.code.slice(3).toLowerCase();
  if (event.code === 'BracketLeft') return '[';
  if (event.code === 'BracketRight') return ']';
  return event.key.toLowerCase();
}
