import { RingBuffer } from '../src/utils/sparklineData';

describe('RingBuffer', () => {
  it('should start empty', () => {
    const buf = new RingBuffer(5);
    expect(buf.toArray()).toEqual([]);
    expect(buf.getCount()).toBe(0);
  });

  it('should push and retrieve values in order', () => {
    const buf = new RingBuffer(5);
    buf.push(1);
    buf.push(2);
    buf.push(3);
    expect(buf.toArray()).toEqual([1, 2, 3]);
  });

  it('should wrap around when full', () => {
    const buf = new RingBuffer(3);
    buf.push(1);
    buf.push(2);
    buf.push(3);
    buf.push(4);
    expect(buf.toArray()).toEqual([2, 3, 4]);
  });

  it('should return latest value', () => {
    const buf = new RingBuffer(5);
    buf.push(10);
    buf.push(20);
    buf.push(30);
    expect(buf.latest()).toBe(30);
  });

  it('should return 0 for latest when empty', () => {
    const buf = new RingBuffer(5);
    expect(buf.latest()).toBe(0);
  });

  it('should return max value', () => {
    const buf = new RingBuffer(5);
    buf.push(10);
    buf.push(50);
    buf.push(30);
    expect(buf.max()).toBe(50);
  });

  it('should return 0 for max when empty', () => {
    const buf = new RingBuffer(5);
    expect(buf.max()).toBe(0);
  });

  it('should maintain chronological order after multiple wraps', () => {
    const buf = new RingBuffer(3);
    for (let i = 1; i <= 10; i++) {
      buf.push(i);
    }
    expect(buf.toArray()).toEqual([8, 9, 10]);
    expect(buf.latest()).toBe(10);
  });

  it('should track count correctly', () => {
    const buf = new RingBuffer(3);
    expect(buf.getCount()).toBe(0);
    buf.push(1);
    expect(buf.getCount()).toBe(1);
    buf.push(2);
    expect(buf.getCount()).toBe(2);
    buf.push(3);
    expect(buf.getCount()).toBe(3);
    buf.push(4);
    expect(buf.getCount()).toBe(3); // capped at size
  });

  it('should work with size 1 buffer', () => {
    const buf = new RingBuffer(1);
    buf.push(10);
    expect(buf.toArray()).toEqual([10]);
    buf.push(20);
    expect(buf.toArray()).toEqual([20]);
    expect(buf.latest()).toBe(20);
    expect(buf.max()).toBe(20);
  });

  it('should handle negative values for max', () => {
    const buf = new RingBuffer(5);
    buf.push(-10);
    buf.push(-50);
    buf.push(-30);
    expect(buf.max()).toBe(-10);
  });

  it('should handle a mix of zero and positive values', () => {
    const buf = new RingBuffer(5);
    buf.push(0);
    buf.push(0);
    buf.push(5);
    expect(buf.toArray()).toEqual([0, 0, 5]);
    expect(buf.max()).toBe(5);
    expect(buf.latest()).toBe(5);
  });

  it('should not include uninitialized slots when partially filled', () => {
    const buf = new RingBuffer(60);
    buf.push(7);
    buf.push(8);
    expect(buf.toArray()).toEqual([7, 8]);
    expect(buf.toArray()).toHaveLength(2);
  });

  it('should remain stable under heavy push load', () => {
    const buf = new RingBuffer(10);
    for (let i = 0; i < 10_000; i++) buf.push(i);
    expect(buf.getCount()).toBe(10);
    expect(buf.latest()).toBe(9999);
    expect(buf.toArray()).toHaveLength(10);
    expect(buf.toArray()[9]).toBe(9999);
    expect(buf.toArray()[0]).toBe(9990);
  });
});
