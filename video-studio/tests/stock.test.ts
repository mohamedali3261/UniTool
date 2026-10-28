import test from "node:test";
import assert from "node:assert/strict";
import { localPexelsQuery } from "../../designcraft/src/services/pexelsQuery";
import { searchStock, StockApiError } from "../src/stock/api";
import {
  stockSource,
  isPexelsMediaUrl,
  isPexelsPageUrl,
} from "../src/stock/mediaSource";
import { downloadStock, MAX_STOCK_BYTES } from "../src/stock/download";
import { blankProject } from "../src/types";
import { loadProject } from "../src/lib/projectIO";
import type { StockItem } from "../src/stock/types";
const item: StockItem = {
  id: 1001,
  kind: "image",
  title: "Sea",
  thumbnail: "https://images.pexels.com/photos/1001/small.jpg",
  imageUrl: "https://images.pexels.com/photos/1001/full.jpg?dpr=2&h=600",
  width: 4000,
  height: 3000,
  duration: 5,
  pageUrl: "https://www.pexels.com/photo/1001/",
  author: "Artist",
  authorUrl: "https://www.pexels.com/@artist/",
  files: [],
};
const photo = (id: number) => ({
  id,
  width: 4000,
  height: 3000,
  url: `https://www.pexels.com/photo/${id}/`,
  photographer: "Artist",
  photographer_url: item.authorUrl,
  alt: "Sea",
  src: { medium: item.thumbnail, original: item.imageUrl },
});
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
const signal = () => new AbortController().signal;
test("local Arabic query translation is deterministic and needs no third-party request", () => {
  assert.ok(!/[\u0600-\u06ff]/.test(localPexelsQuery("طبيعة")));
  assert.equal(localPexelsQuery("  CITY lights "), "city lights");
  assert.equal(localPexelsQuery("كلمةغيرمعروفة"), "كلمةغيرمعروفة");
});
test("stock sources respect landscape and portrait quality bounds", () => {
  const image = stockSource(item, "hd");
  assert.equal(image.width, 1280);
  assert.equal(image.height, 960);
  const url = new URL(image.url);
  assert.equal(url.searchParams.get("dpr"), null);
  assert.equal(url.searchParams.get("h"), null);
  const portrait = stockSource(
    { ...item, width: 3000, height: 4000 },
    "fullhd",
  );
  assert.equal(portrait.width, 1440);
  assert.equal(portrait.height, 1920);
  const video = {
    ...item,
    kind: "video" as const,
    files: [
      { url: "https://videos.pexels.com/a.mp4", width: 1920, height: 1080 },
      { url: "https://videos.pexels.com/b.mp4", width: 640, height: 360 },
      { url: "https://videos.pexels.com/c.mp4", width: 1280, height: 720 },
    ],
  };
  assert.equal(stockSource(video, "hd").width, 1280);
  assert.equal(stockSource(video, "fullhd").width, 1920);
  assert.throws(() => stockSource({ ...video, files: [] }, "hd"));
});
test("only HTTPS Pexels CDN/media and attribution links are accepted", () => {
  for (const url of [
    "http://images.pexels.com/a.jpg",
    "https://images.pexels.com.evil.test/a.jpg",
    "javascript:alert(1)",
    "https://user:secret@images.pexels.com/a.jpg",
    "https://evil.test/a.mp4",
  ])
    assert.equal(isPexelsMediaUrl(url), false);
  assert.ok(isPexelsPageUrl(item.pageUrl));
  assert.equal(isPexelsPageUrl("https://evil.test"), false);
});
test("photo search normalizes, caches metadata, translates locally and encodes orientation", async (t) => {
  let requests = 0;
  t.mock.method(globalThis, "fetch", async (input: URL, init: RequestInit) => {
    requests++;
    const url = new URL(input);
    assert.equal(url.hostname, "api.pexels.com");
    assert.ok(init.headers);
    assert.equal(url.searchParams.get("orientation"), "portrait");
    assert.equal(url.searchParams.get("page"), "2");
    return json({
      photos: [photo(1101), { ...photo(1102), url: "javascript:alert(1)" }],
      total_results: 100,
      next_page: "https://api.pexels.com/v1/search?page=3",
    });
  });
  const params = {
    kind: "image" as const,
    query: "طبيعة",
    orientation: "portrait" as const,
  };
  const result = await searchStock(params, 2, signal());
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].author, "Artist");
  assert.ok(result.hasMore);
  await searchStock(params, 2, signal());
  assert.equal(requests, 1);
});
test("video search chooses MP4 only, rejects invalid items and bounds pagination", async (t) => {
  t.mock.method(globalThis, "fetch", async () =>
    json({
      videos: [
        {
          id: 1103,
          width: 1920,
          height: 1080,
          url: item.pageUrl,
          user: { name: "Director", url: item.authorUrl },
          image: item.thumbnail,
          duration: 6,
          video_files: [
            {
              file_type: "video/mp4",
              width: 1280,
              height: 720,
              link: "https://videos.pexels.com/clip.mp4",
            },
            {
              file_type: "video/webm",
              width: 1280,
              height: 720,
              link: "https://videos.pexels.com/clip.webm",
            },
          ],
        },
      ],
      next_page: "https://api.pexels.com/videos/search?page=7",
    }),
  );
  const result = await searchStock(
    { kind: "video", query: "ocean mock", orientation: "all" },
    6,
    signal(),
  );
  assert.equal(result.items[0].files.length, 1);
  assert.equal(result.hasMore, false);
});
test("API failures remain actionable, not an empty result or secret-bearing error", async (t) => {
  for (const status of [401, 403, 429, 500]) {
    t.mock.method(globalThis, "fetch", async () => json({}, status));
    await assert.rejects(
      searchStock(
        { kind: "image", query: `failure-${status}`, orientation: "all" },
        1,
        signal(),
      ),
      (error) => error instanceof StockApiError && error.status === status,
    );
    t.mock.restoreAll();
  }
});
test("already cancelled search and download perform no network request", async (t) => {
  let called = false;
  t.mock.method(globalThis, "fetch", async () => {
    called = true;
    return json({});
  });
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    searchStock(
      { kind: "image", query: "cancelled", orientation: "all" },
      1,
      controller.signal,
    ),
  );
  await assert.rejects(downloadStock(item, "hd", controller.signal, () => {}));
  assert.equal(called, false);
});
test("downloads do not send API credentials and reject oversized declared files", async (t) => {
  t.mock.method(
    globalThis,
    "fetch",
    async (input: string, init: RequestInit) => {
      assert.ok(isPexelsMediaUrl(input));
      assert.equal(init.headers, undefined);
      return new Response("", {
        headers: {
          "Content-Length": String(MAX_STOCK_BYTES + 1),
          "Content-Type": "image/jpeg",
        },
      });
    },
  );
  await assert.rejects(
    downloadStock(item, "hd", signal(), () => {}),
    /100 MB/,
  );
});
test("streamed downloads enforce the limit even without Content-Length", async (t) => {
  let cancelled = false;
  t.mock.method(
    globalThis,
    "fetch",
    async () =>
      new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(new Uint8Array(MAX_STOCK_BYTES));
            controller.enqueue(new Uint8Array(1));
          },
          cancel() {
            cancelled = true;
          },
        }),
        { headers: { "Content-Type": "image/jpeg" } },
      ),
  );
  await assert.rejects(
    downloadStock(item, "hd", signal(), () => {}),
    /100 MB/,
  );
  assert.equal(cancelled, true);
});
test("downloads reject unexpected response MIME types before decoding", async (t) => {
  t.mock.method(
    globalThis,
    "fetch",
    async () =>
      new Response("<html>error</html>", {
        headers: { "Content-Type": "text/html" },
      }),
  );
  await assert.rejects(
    downloadStock(item, "hd", signal(), () => {}),
    /صيغة/,
  );
});
test("portable projects preserve validated Pexels attribution but still reject remote assets", async () => {
  const source = {
    provider: "pexels",
    id: 1001,
    pageUrl: item.pageUrl,
    author: item.author,
    authorUrl: item.authorUrl,
    quality: "hd",
  };
  const asset = {
    id: "stock-asset",
    name: "pexels.jpg",
    type: "image",
    url: "data:image/jpeg;base64,AA==",
    duration: 5,
    source,
  };
  const file = (assets: unknown[]) =>
    new File(
      [JSON.stringify({ version: 1, project: blankProject(), assets })],
      "stock.json",
    );
  const loaded = await loadProject(file([asset]));
  assert.deepEqual(loaded.assets[0].source, source);
  await assert.rejects(loadProject(file([{ ...asset, url: item.imageUrl }])));
  await assert.rejects(
    loadProject(
      file([
        { ...asset, source: { ...source, pageUrl: "javascript:alert(1)" } },
      ]),
    ),
  );
});
