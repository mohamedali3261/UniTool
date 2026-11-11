/**
 * The UniTool logo on a transparent plate.
 *
 * `public/UniTool_logo.png` keeps its own alpha (the artwork has no background),
 * so the brand is drawn straight on the page. The dark theme swaps in
 * `UniTool_logo_dark.png`, where only the neutral dark "Tool" lettering is
 * lifted to a light ink — the blue mark and the coloured emblem stay untouched.
 * Both files are transparent PNGs, so no plate or box is ever painted behind it.
 */
export function BrandLogo({
  width = 128,
  height = 40,
  className,
}: {
  width?: number;
  height?: number;
  className?: string;
}) {
  return (
    <img
      src="/UniTool_logo.png"
      srcSet="/UniTool_logo.png 1x, /UniTool_logo_dark.png 1x"
      data-dark-src="/UniTool_logo_dark.png"
      alt="UniTool"
      width={width}
      height={height}
      className={className ?? "unitool-brand-logo"}
      draggable={false}
      decoding="async"
    />
  );
}
