import test from "node:test";
import assert from "node:assert/strict";
import { primeMediaPlayback, playbackMessage } from "../src/sound/playback";
function media(play: () => Promise<void> = () => Promise.resolve()) {
  const a = {
    currentSrc: "blob:sound",
    currentTime: 1.25,
    volume: 0.6,
    muted: false,
    pauses: 0,
    getAttribute: () => "blob:sound",
    play,
    pause() {
      this.pauses++;
    },
  };
  return a;
}
test("playback preparation invokes every element synchronously before yielding, deduplicates and restores state", async () => {
  const called: string[] = [];
  const a = media(() => {
    called.push("music");
    assert.equal(a.volume, 0);
    return Promise.resolve();
  });
  const b = media(() => {
    called.push("cue");
    return Promise.resolve();
  });
  const pending = primeMediaPlayback([
    a,
    b,
    a,
  ] as unknown as HTMLMediaElement[]);
  assert.deepEqual(called, ["music", "cue"]);
  await pending;
  for (const el of [a, b]) {
    assert.equal(el.volume, 0.6);
    assert.equal(el.currentTime, 1.25);
    assert.equal(el.pauses, 1);
    assert.equal(el.muted, false);
  }
});
test("a rejected sound does not leave the other media playing or muted", async () => {
  const a = media(() =>
    Promise.reject(new DOMException("blocked", "NotAllowedError")),
  );
  const b = media();
  await assert.rejects(
    primeMediaPlayback([a, b] as unknown as HTMLMediaElement[]),
    { name: "NotAllowedError" },
  );
  assert.equal(a.volume, 0.6);
  assert.equal(b.volume, 0.6);
  assert.equal(a.pauses, 1);
  assert.equal(b.pauses, 1);
  assert.match(
    playbackMessage(new DOMException("blocked", "NotAllowedError")),
    /المتصفح منع الصوت/,
  );
});
test("missing media does not block video-only preview playback", async () => {
  const a = media(() => {
    throw Error("should not play");
  });
  a.currentSrc = "";
  a.getAttribute = () => "";
  await primeMediaPlayback([a] as unknown as HTMLMediaElement[]);
  assert.equal(a.pauses, 0);
});
