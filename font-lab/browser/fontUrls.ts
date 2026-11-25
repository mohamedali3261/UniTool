/**
 * Vite-only glue: turns the bundled .ttf files into URLs the studio can fetch.
 * Kept out of `core/` so the engine stays testable in plain Node.
 */
import { registerFontUrls } from '../core/library';

const urls = import.meta.glob('../assets/fonts/*.ttf', {
  query: '?url',
  import: 'default',
  eager: true,
}) as Record<string, string>;

export function installBundledFontUrls() {
  registerFontUrls((file) => urls[`../assets/fonts/${file}`]);
}
