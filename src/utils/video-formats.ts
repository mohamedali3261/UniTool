const VIDEO_EXTENSIONS = [
  'mp4', 'mov', 'mkv', 'webm', 'avi', 'wmv', 'flv', 'm4v', '3gp', '3g2',
  'ts', 'mts', 'm2ts', 'vob', 'ogv', 'mpeg', 'mpg', 'm2v', 'f4v', 'asf',
  'rm', 'rmvb', 'divx', 'xvid', 'mxf', 'nuv', 'nsv', 'roq', 'wtv',
] as const;

export const VIDEO_ACCEPT =
  'video/*,' + VIDEO_EXTENSIONS.map((e) => `.${e}`).join(',');

export function getFileExtension(file: File, fallback = 'mp4'): string {
  const fromName = file.name.split('.').pop()?.toLowerCase();
  if (fromName && fromName.length <= 5) return fromName;
  if (file.type.startsWith('video/')) {
    const mimeExt = file.type.split('/')[1]?.split(';')[0]?.toLowerCase();
    if (mimeExt && mimeExt !== 'plain') return mimeExt === 'quicktime' ? 'mov' : mimeExt;
  }
  return fallback;
}

export function isVideoFile(file: File): boolean {
  if (file.type.startsWith('video/')) return true;
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  return (VIDEO_EXTENSIONS as readonly string[]).includes(ext);
}
