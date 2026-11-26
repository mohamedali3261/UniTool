export async function processRaster(
  src: string,
  mode: "invert" | "tint" | "halftone" | "trim" | "upscale",
  color: string,
) {
  const image = new Image();
  image.src = src;
  await image.decode();
  const c = document.createElement("canvas");
  const ratio =
    mode === "upscale"
      ? Math.min(2, 4096 / Math.max(image.width, image.height))
      : Math.min(1, 4096 / Math.max(image.width, image.height));
  c.width = Math.max(1, Math.round(image.width * ratio));
  c.height = Math.max(1, Math.round(image.height * ratio));
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, 0, 0, c.width, c.height);
  if (mode === "tint") {
    ctx.globalCompositeOperation = "source-in";
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, c.width, c.height);
  }
  if (mode === "invert" || mode === "halftone" || mode === "trim") {
    const frame = ctx.getImageData(0, 0, c.width, c.height),
      d = frame.data;
    if (mode === "invert") {
      for (let i = 0; i < d.length; i += 4) {
        d[i] = 255 - d[i];
        d[i + 1] = 255 - d[i + 1];
        d[i + 2] = 255 - d[i + 2];
      }
      ctx.putImageData(frame, 0, 0);
    }
    if (mode === "halftone") {
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.fillStyle = color;
      const step = Math.max(4, Math.round(Math.max(c.width, c.height) / 180));
      for (let y = 0; y < c.height; y += step)
        for (let x = 0; x < c.width; x += step) {
          const i =
            (Math.min(c.height - 1, y + Math.floor(step / 2)) * c.width +
              Math.min(c.width - 1, x + Math.floor(step / 2))) *
            4;
          if (!d[i + 3]) continue;
          const lum =
            (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255;
          ctx.globalAlpha = d[i + 3] / 255;
          ctx.beginPath();
          ctx.arc(
            x + step / 2,
            y + step / 2,
            Math.sqrt(1 - lum) * step * 0.55,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }
    }
    if (mode === "trim") {
      let left = c.width,
        top = c.height,
        right = -1,
        bottom = -1;
      for (let y = 0; y < c.height; y++)
        for (let x = 0; x < c.width; x++)
          if (d[(y * c.width + x) * 4 + 3] > 0) {
            left = Math.min(left, x);
            top = Math.min(top, y);
            right = Math.max(right, x);
            bottom = Math.max(bottom, y);
          }
      if (right < left) throw Error("Image is fully transparent");
      const out = document.createElement("canvas");
      out.width = right - left + 1;
      out.height = bottom - top + 1;
      out
        .getContext("2d")!
        .drawImage(
          c,
          left,
          top,
          out.width,
          out.height,
          0,
          0,
          out.width,
          out.height,
        );
      return out.toDataURL("image/png");
    }
  }
  return c.toDataURL("image/png");
}
