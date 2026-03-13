export class MutationQueue {
  private entries: Array<() => Promise<void>> = [];
  private draining = false;

  enqueue(fn: () => Promise<void>): void {
    this.entries.push(fn);
  }

  async drain(): Promise<void> {
    if (this.draining) return;
    this.draining = true;
    while (this.entries.length > 0) {
      const fn = this.entries.shift()!;
      try {
        await fn();
      } catch {
        // Silently drop — e.g. item deleted by another device while we were offline
      }
    }
    this.draining = false;
  }

  get size(): number {
    return this.entries.length;
  }
}
