export class RingBuffer {
  private buffer: number[];
  private readonly size: number;
  private head: number = 0;
  private count: number = 0;

  constructor(size: number) {
    this.size = size;
    this.buffer = new Array(size).fill(0);
  }

  push(value: number): void {
    this.buffer[this.head] = value;
    this.head = (this.head + 1) % this.size;
    if (this.count < this.size) this.count++;
  }

  toArray(): number[] {
    if (this.count < this.size) {
      return this.buffer.slice(0, this.count);
    }
    return [...this.buffer.slice(this.head), ...this.buffer.slice(0, this.head)];
  }

  latest(): number {
    if (this.count === 0) return 0;
    const idx = (this.head - 1 + this.size) % this.size;
    return this.buffer[idx];
  }

  max(): number {
    const arr = this.toArray();
    if (arr.length === 0) return 0;
    return Math.max(...arr);
  }

  getCount(): number {
    return this.count;
  }
}
