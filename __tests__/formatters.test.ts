import {
  formatFps,
  formatMemory,
  formatRerenders,
  formatNetwork,
  formatNative,
} from '../src/utils/formatters';

describe('formatFps', () => {
  it('rounds to nearest integer', () => {
    expect(formatFps(59.7)).toBe('60 fps');
    expect(formatFps(42.3)).toBe('42 fps');
  });

  it('handles zero', () => {
    expect(formatFps(0)).toBe('0 fps');
  });

  it('handles exact integers', () => {
    expect(formatFps(60)).toBe('60 fps');
  });
});

describe('formatMemory', () => {
  it('shows one decimal place', () => {
    expect(formatMemory(142.37)).toBe('142.4 mb');
    expect(formatMemory(89.0)).toBe('89.0 mb');
  });

  it('handles small values', () => {
    expect(formatMemory(0.5)).toBe('0.5 mb');
  });

  it('handles zero', () => {
    expect(formatMemory(0)).toBe('0.0 mb');
  });
});

describe('formatRerenders', () => {
  it('rounds to nearest integer with /s suffix', () => {
    expect(formatRerenders(14.8)).toBe('15/s');
    expect(formatRerenders(3.2)).toBe('3/s');
  });

  it('handles zero', () => {
    expect(formatRerenders(0)).toBe('0/s');
  });
});

describe('formatNetwork', () => {
  it('rounds to nearest integer with req suffix', () => {
    expect(formatNetwork(3)).toBe('3 req');
    expect(formatNetwork(0)).toBe('0 req');
  });
});

describe('formatNative', () => {
  it('rounds to nearest integer with /s suffix', () => {
    expect(formatNative(8.6)).toBe('9/s');
    expect(formatNative(0)).toBe('0/s');
  });
});

describe('formatter edge cases', () => {
  it('formatFps handles values above 60', () => {
    expect(formatFps(120)).toBe('120 fps');
    expect(formatFps(144.4)).toBe('144 fps');
  });

  it('formatFps handles negative values without crashing', () => {
    expect(formatFps(-1)).toBe('-1 fps');
  });

  it('formatMemory handles values over 1 GB', () => {
    expect(formatMemory(1024)).toBe('1024.0 mb');
    expect(formatMemory(2048.55)).toMatch(/^2048\.[56] mb$/);
  });

  it('formatMemory rounds half-up at the tenths place', () => {
    expect(formatMemory(99.95)).toBe('100.0 mb');
  });

  it('formatRerenders handles fractional rates', () => {
    expect(formatRerenders(0.4)).toBe('0/s');
    expect(formatRerenders(0.5)).toBe('1/s');
  });

  it('formatNetwork never returns negative request counts visibly broken', () => {
    expect(formatNetwork(0.49)).toBe('0 req');
    expect(formatNetwork(0.5)).toBe('1 req');
  });
});
