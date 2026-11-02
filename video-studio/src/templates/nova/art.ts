/** Static local vector art; motion and effects are applied by the editor. */
export function novaArt(scene: number): string {
  const hue = [
    "#6ee7f9",
    "#b89bff",
    "#f7ba81",
    "#6ee7f9",
    "#dc9cff",
    "#6ee7f9",
  ][scene % 6];
  const stars = Array.from(
    { length: 65 },
    (_, i) =>
      `<circle cx="${(i * 317 + 91) % 1920}" cy="${(i * 173 + 37) % 1080}" r="${i % 3 === 0 ? 2 : 1}" fill="white" opacity="${0.12 + (i % 5) * 0.09}"/>`,
  ).join("");
  const rings = Array.from(
    { length: 7 },
    (_, i) =>
      `<ellipse cx="${1320 - scene * 70}" cy="500" rx="${160 + i * 42}" ry="${270 + i * 22}" fill="none" stroke="${hue}" stroke-width="${i === 0 ? 3 : 1}" opacity="${0.5 - i * 0.055}" transform="rotate(-28 1150 520)"/>`,
  ).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs><radialGradient id="bg"><stop stop-color="#23234e"/><stop offset="1" stop-color="#050911"/></radialGradient><radialGradient id="orb"><stop stop-color="${hue}" stop-opacity=".55"/><stop offset=".45" stop-color="${hue}" stop-opacity=".08"/><stop offset="1" stop-color="${hue}" stop-opacity="0"/></radialGradient><linearGradient id="line"><stop stop-color="${hue}" stop-opacity="0"/><stop offset=".5" stop-color="${hue}"/><stop offset="1" stop-color="${hue}" stop-opacity="0"/></linearGradient><pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse"><path d="M80 0H0V80" fill="none" stroke="${hue}" stroke-opacity=".055"/></pattern></defs>
  <rect width="1920" height="1080" fill="url(#bg)"/><rect width="1920" height="1080" fill="url(#grid)"/>${stars}
  <circle cx="${1250 - scene * 85}" cy="490" r="660" fill="url(#orb)"/>${rings}
  <circle cx="${1320 - scene * 70}" cy="500" r="145" fill="#070d21" stroke="${hue}" stroke-width="2"/>
  <path d="M0 820 Q600 ${430 + scene * 50} 1920 660" fill="none" stroke="url(#line)" stroke-width="2"/>
  <path d="M0 842 Q600 ${452 + scene * 50} 1920 682" fill="none" stroke="url(#line)" stroke-opacity=".25"/>
  <g fill="${hue}" font-family="Arial,sans-serif" font-size="16" letter-spacing="6"><text x="100" y="100">N O V A  /  STUDIO FILM</text><text x="100" y="995">VISION · MOTION · IMPACT</text><text x="1710" y="995">0${scene + 1} / 06</text></g>
  <path d="M100 140H180M100 925H180M1740 140H1820" stroke="${hue}" opacity=".6"/>
  </svg>`;
}
