/** Bounded header inspection: never read the complete video to classify it. */
const formats: Record<string, ["video" | "audio" | "image", string]> = {
  mp4: ["video", "video/mp4"],
  m4v: ["video", "video/mp4"],
  mov: ["video", "video/quicktime"],
  webm: ["video", "video/webm"],
  mkv: ["video", "video/x-matroska"],
  avi: ["video", "video/x-msvideo"],
  mpeg: ["video", "video/mpeg"],
  mpg: ["video", "video/mpeg"],
  ogv: ["video", "video/ogg"],
  "3gp": ["video", "video/3gpp"],
  ts: ["video", "video/mp2t"],
  mts: ["video", "video/mp2t"],
  m2ts: ["video", "video/mp2t"],
  flv: ["video", "video/x-flv"],
  wmv: ["video", "video/x-ms-wmv"],
  mp3: ["audio", "audio/mpeg"],
  wav: ["audio", "audio/wav"],
  m4a: ["audio", "audio/mp4"],
  aac: ["audio", "audio/aac"],
  ogg: ["audio", "audio/ogg"],
  opus: ["audio", "audio/ogg"],
  flac: ["audio", "audio/flac"],
  jpg: ["image", "image/jpeg"],
  jpeg: ["image", "image/jpeg"],
  png: ["image", "image/png"],
  gif: ["image", "image/gif"],
  webp: ["image", "image/webp"],
  avif: ["image", "image/avif"],
  svg: ["image", "image/svg+xml"],
  bmp: ["image", "image/bmp"],
};
export const mediaAccept =
  "video/*,image/*,audio/*," +
  Object.keys(formats)
    .map((ext) => "." + ext)
    .join(",");
export async function classifyMedia(file: File) {
  if (!file.size) throw new Error(`${file.name}: الملف فارغ`);
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const mime = file.type.toLowerCase().split(";")[0];
  const kind = mime.split("/")[0];
  if (["video", "audio", "image"].includes(kind))
    return { type: kind as "video" | "audio" | "image", mime };
  if (formats[ext]) return { type: formats[ext][0], mime: formats[ext][1] };
  const bytes = new Uint8Array(await file.slice(0, 64).arrayBuffer());
  const text = new TextDecoder("latin1").decode(bytes);
  if (text.slice(4, 8) === "ftyp")
    return { type: "video" as const, mime: "video/mp4" };
  if (
    bytes[0] === 0x1a &&
    bytes[1] === 0x45 &&
    bytes[2] === 0xdf &&
    bytes[3] === 0xa3
  )
    return { type: "video" as const, mime: "video/webm" };
  if (text.startsWith("RIFF") && text.slice(8, 12) === "AVI ")
    return { type: "video" as const, mime: "video/x-msvideo" };
  if (text.startsWith("RIFF") && text.slice(8, 12) === "WAVE")
    return { type: "audio" as const, mime: "audio/wav" };
  if (text.startsWith("OggS"))
    return { type: "audio" as const, mime: "audio/ogg" };
  throw new Error(
    `${file.name}: لا يمكن التعرف على نوع الوسائط؛ جرّب ملف MP4 بترميز H.264 أو WebM بترميز VP9`,
  );
}
const blobs = new Map<string, Blob>();
export function localMediaURL(file: Blob) {
  const url = URL.createObjectURL(file);
  blobs.set(url, file);
  return url;
}
export function releaseMediaURL(url: string) {
  blobs.delete(url);
  if (url.startsWith("blob:")) URL.revokeObjectURL(url);
}
export async function mediaBlob(url: string) {
  return blobs.get(url) || (await fetch(url)).blob();
}
export function localMediaSize(url: string) {
  return blobs.get(url)?.size;
}
