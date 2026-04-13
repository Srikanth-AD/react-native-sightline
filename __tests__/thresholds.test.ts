import { getStatus, DEFAULT_THRESHOLDS } from '../src/utils/thresholds';

describe('getStatus', () => {
  describe('inverted (higher is worse) — memory, rerenders, network', () => {
    it('should return good when below warn threshold', () => {
      expect(getStatus(50, DEFAULT_THRESHOLDS.memory, true)).toBe('good');
    });

    it('should return warn when at warn threshold', () => {
      expect(getStatus(100, DEFAULT_THRESHOLDS.memory, true)).toBe('warn');
    });

    it('should return warn when between warn and danger', () => {
      expect(getStatus(150, DEFAULT_THRESHOLDS.memory, true)).toBe('warn');
    });

    it('should return bad when at danger threshold', () => {
      expect(getStatus(200, DEFAULT_THRESHOLDS.memory, true)).toBe('bad');
    });

    it('should return bad when above danger threshold', () => {
      expect(getStatus(300, DEFAULT_THRESHOLDS.memory, true)).toBe('bad');
    });
  });

  describe('non-inverted (lower is worse) — FPS', () => {
    it('should return good when above warn threshold', () => {
      expect(getStatus(60, DEFAULT_THRESHOLDS.fps, false)).toBe('good');
    });

    it('should return warn when at warn threshold', () => {
      expect(getStatus(55, DEFAULT_THRESHOLDS.fps, false)).toBe('warn');
    });

    it('should return warn when between warn and danger', () => {
      expect(getStatus(45, DEFAULT_THRESHOLDS.fps, false)).toBe('warn');
    });

    it('should return bad when at danger threshold', () => {
      expect(getStatus(40, DEFAULT_THRESHOLDS.fps, false)).toBe('bad');
    });

    it('should return bad when below danger threshold', () => {
      expect(getStatus(20, DEFAULT_THRESHOLDS.fps, false)).toBe('bad');
    });
  });

  describe('rerender thresholds', () => {
    it('should return good for low rerender rate', () => {
      expect(getStatus(3, DEFAULT_THRESHOLDS.rerenders, true)).toBe('good');
    });

    it('should return warn for moderate rerender rate', () => {
      expect(getStatus(10, DEFAULT_THRESHOLDS.rerenders, true)).toBe('warn');
    });

    it('should return bad for high rerender rate', () => {
      expect(getStatus(20, DEFAULT_THRESHOLDS.rerenders, true)).toBe('bad');
    });
  });

  describe('network thresholds', () => {
    it('should return good for 0-2 in-flight requests', () => {
      expect(getStatus(2, DEFAULT_THRESHOLDS.network, true)).toBe('good');
    });

    it('should return warn for 3-5 in-flight requests', () => {
      expect(getStatus(4, DEFAULT_THRESHOLDS.network, true)).toBe('warn');
    });

    it('should return bad for 6+ in-flight requests', () => {
      expect(getStatus(8, DEFAULT_THRESHOLDS.network, true)).toBe('bad');
    });
  });
});

describe('DEFAULT_THRESHOLDS', () => {
  it('should have all required metrics', () => {
    expect(DEFAULT_THRESHOLDS).toHaveProperty('fps');
    expect(DEFAULT_THRESHOLDS).toHaveProperty('memory');
    expect(DEFAULT_THRESHOLDS).toHaveProperty('rerenders');
    expect(DEFAULT_THRESHOLDS).toHaveProperty('network');
  });

  it('should have warn and danger for each metric', () => {
    for (const metric of Object.values(DEFAULT_THRESHOLDS)) {
      expect(metric).toHaveProperty('warn');
      expect(metric).toHaveProperty('danger');
      expect(typeof metric.warn).toBe('number');
      expect(typeof metric.danger).toBe('number');
    }
  });
});
