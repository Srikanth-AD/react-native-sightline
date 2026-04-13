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
});
