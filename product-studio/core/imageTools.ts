export async function editImage(
  src: string,
  removeBackground = false,
  tolerance = 40,
) {
  const image = new Image();
  image.src = src;
  await image.decode();
  const c = document.createElement("canvas");
  c.width = image.width;
  c.height = image.height;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(image, 0, 0);
  if (removeBackground) {
    // Flood fill from the edges only, preserving similar-colored enclosed artwork.
    const frame = ctx.getImageData(0, 0, c.width, c.height),
      d = frame.data;
    const seen = new Uint8Array(c.width * c.height),
      queue = new Uint32Array(c.width * c.height);
    let tail = 0;
    const push = (i: number) => {
      if (!seen[i]) {
        seen[i] = 1;
        queue[tail++] = i;
      }
    };
    const seeds = [
      0,
      c.width - 1,
      (c.height - 1) * c.width,
      c.width * c.height - 1,
    ];
    const colors = seeds.map((i) => [d[i * 4], d[i * 4 + 1], d[i * 4 + 2]]);
    for (let x = 0; x < c.width; x++) {
      push(x);
      push((c.height - 1) * c.width + x);
    }
    for (let y = 0; y < c.height; y++) {
      push(y * c.width);
      push(y * c.width + c.width - 1);
    }
    for (let head = 0; head < tail; head++) {
      const i = queue[head];
      const p = i * 4;
      if (
        !colors.some(
          (color) =>
            Math.hypot(
              d[p] - color[0],
              d[p + 1] - color[1],
              d[p + 2] - color[2],
            ) <= tolerance,
        )
      )
        continue;
      d[p + 3] = 0;
      const x = i % c.width,
        y = Math.floor(i / c.width);
      if (x > 0) push(i - 1);
      if (x < c.width - 1) push(i + 1);
      if (y > 0) push(i - c.width);
      if (y < c.height - 1) push(i + c.width);
    }
    ctx.putImageData(frame, 0, 0);
  }
  return c.toDataURL("image/png");
}
