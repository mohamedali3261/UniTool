/** At most one decoder/render request in flight. New clock ticks replace pending
 * work rather than cancelling every slower-than-one-frame decode indefinitely. */
export class LatestFrameQueue<T> {
  private pending: T | undefined;
  private running = false;
  private closed = false;
  constructor(
    private render: (frame: T) => Promise<void>,
    private onError: (e: unknown) => void = () => {},
  ) {}
  request(frame: T) {
    if (this.closed) return;
    this.pending = frame;
    if (!this.running) void this.drain();
  }
  private async drain() {
    this.running = true;
    try {
      while (!this.closed && this.pending !== undefined) {
        const frame = this.pending;
        this.pending = undefined;
        try {
          await this.render(frame);
        } catch (e) {
          if (!this.closed) this.onError(e);
        }
      }
    } finally {
      this.running = false;
    }
  }
  dispose() {
    this.closed = true;
    this.pending = undefined;
  }
}
