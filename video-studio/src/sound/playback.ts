/** Call synchronously from a trusted Play/Space gesture, before any await.
 * Unlock each media element (important on mobile Safari), without audible
 * pre-roll. Playback effects can then start future cues on those same elements.
 */
export function primeMediaPlayback(
  elements: HTMLMediaElement[],
): Promise<void> {
  const unique = [...new Set(elements)].filter(
    (el) => !!el.currentSrc || !!el.getAttribute("src"),
  );
  return Promise.allSettled(
    unique.map((el) => {
      const volume = el.volume,
        time = el.currentTime,
        muted = el.muted;
      el.volume = 0;
      if (el.volume !== 0) el.muted = true; // iOS can ignore programmatic volume.
      let attempt: Promise<void>;
      try {
        attempt = el.play();
      } catch (e) {
        el.volume = volume;
        el.muted = muted;
        return Promise.reject(e);
      }
      return new Promise<void>((resolve, reject) => {
        let done = false;
        const finish = (error?: unknown) => {
          if (done) return;
          done = true;
          clearTimeout(timer);
          el.pause();
          try {
            el.currentTime = time;
          } catch {
            /* Metadata may still be loading. */
          }
          el.volume = volume;
          el.muted = muted;
          if (error) reject(error);
          else resolve();
        };
        const timer = setTimeout(
          () => finish(new Error("تأخر تجهيز الصوت. جرّب التشغيل مرة أخرى.")),
          4000,
        );
        attempt.then(
          () => finish(),
          (error) => finish(error),
        );
      });
    }),
  ).then((results) => {
    const failure = results.find(
      (r): r is PromiseRejectedResult => r.status === "rejected",
    );
    if (failure) throw failure.reason;
  });
}
export function playbackMessage(error: unknown): string {
  return error instanceof DOMException && error.name === "NotAllowedError"
    ? "المتصفح منع الصوت. اضغط تشغيل لتفعيله، وتأكد أن التبويب والجهاز مش على كتم."
    : "تعذّر تشغيل أحد ملفات الصوت. جرّب تشغيله مرة أخرى أو استبدل الملف، وتأكد من مستوى الصوت والكتم.";
}
