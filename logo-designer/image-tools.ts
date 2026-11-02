/** إزالة خلفية متصلة بالحواف، مش قصّ ذكي للأشخاص. التحويل مخصص للرسومات البسيطة. */
export function removeBackground(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  tolerance: number,
) {
  const out = new Uint8ClampedArray(data),
    seen = new Uint8Array(width * height),
    queue = new Int32Array(width * height);
  let head = 0,
    tail = 0;
  const seeds = [0, width - 1, (height - 1) * width, width * height - 1].map(
    (i) => [data[i * 4], data[i * 4 + 1], data[i * 4 + 2]],
  );
  function add(i: number) {
    if (i < 0 || i >= width * height || seen[i]) return;
    seen[i] = 1;
    const j = i * 4;
    if (
      data[j + 3] < 10 ||
      seeds.some(
        (c) =>
          Math.hypot(data[j] - c[0], data[j + 1] - c[1], data[j + 2] - c[2]) <=
          tolerance,
      )
    )
      queue[tail++] = i;
  }
  for (let x = 0; x < width; x++) {
    add(x);
    add((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    add(y * width);
    add(y * width + width - 1);
  }
  while (head < tail) {
    const i = queue[head++];
    out[i * 4 + 3] = 0;
    const x = i % width;
    if (x) add(i - 1);
    if (x < width - 1) add(i + 1);
    add(i - width);
    add(i + width);
  }
  return out;
}
export function traceRuns(
  data: Uint8ClampedArray,
  width: number,
  height: number,
) {
  const paths = new Map<string, string>();
  const color = (i: number) =>
    data[i * 4 + 3] < 100
      ? ""
      : "#" +
        [0, 1, 2]
          .map((k) =>
            Math.min(255, Math.round(data[i * 4 + k] / 64) * 64)
              .toString(16)
              .padStart(2, "0"),
          )
          .join("");
  for (let y = 0; y < height; y++) {
    let x = 0;
    while (x < width) {
      const fill = color(y * width + x),
        start = x;
      while (x < width && color(y * width + x) === fill) x++;
      if (fill) {
        const sx = (start * 128) / width,
          sy = (y * 128) / height,
          w = ((x - start) * 128) / width,
          h = 128 / height;
        paths.set(
          fill,
          (paths.get(fill) || "") + `M${sx} ${sy}h${w}v${h}h${-w}Z`,
        );
      }
    }
  }
  return [...paths].map(([fill, d]) => ({ fill, d }));
}
export async function imageCanvas(url: string, max = 1024) {
  const image = new Image();
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Invalid image"));
    image.src = url;
  });
  const c = document.createElement("canvas"),
    ratio = Math.min(
      1,
      max / Math.max(image.naturalWidth, image.naturalHeight),
    );
  c.width = Math.max(1, Math.round(image.naturalWidth * ratio));
  c.height = Math.max(1, Math.round(image.naturalHeight * ratio));
  c.getContext("2d", { willReadFrequently: true })!.drawImage(
    image,
    0,
    0,
    c.width,
    c.height,
  );
  return c;
}
