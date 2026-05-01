// Tests the fetch / XMLHttpRequest patching behavior in useNetworkMonitor.
// We don't render React here — instead we capture the effect callback that
// the hook registers and invoke it manually, which lets us drive mount/unmount.

jest.mock('../src/store/useSightlineStore', () => {
  const updateMetric = jest.fn();
  return {
    useSightlineStore: {
      getState: () => ({ updateMetric }),
    },
    __updateMetric: updateMetric,
  };
});

let capturedEffect: (() => void | (() => void)) | null = null;
let capturedCleanup: (() => void) | null = null;

jest.mock('react', () => ({
  useEffect: (fn: () => void | (() => void)) => {
    capturedEffect = fn;
  },
  useRef: <T>(initial: T) => ({ current: initial }),
}));

interface FakeXHRInstance {
  listeners: Record<string, Array<() => void>>;
  addEventListener(name: string, cb: () => void): void;
  send(): void;
  fireLoadend(): void;
}

const FakeXHR = function FakeXHR(this: FakeXHRInstance) {
  this.listeners = {};
  this.addEventListener = function addEventListener(
    this: FakeXHRInstance,
    name: string,
    cb: () => void,
  ): void {
    if (!this.listeners[name]) this.listeners[name] = [];
    this.listeners[name].push(cb);
  };
  this.fireLoadend = function fireLoadend(this: FakeXHRInstance): void {
    (this.listeners.loadend ?? []).forEach((cb) => cb());
  };
} as unknown as { new (): FakeXHRInstance; prototype: FakeXHRInstance };

FakeXHR.prototype.send = function send() {
  /* original — replaced by patch */
};

describe('useNetworkMonitor patching', () => {
  let originalFetch: typeof globalThis.fetch | undefined;
  let originalXHR: typeof globalThis.XMLHttpRequest | undefined;

  beforeEach(() => {
    jest.resetModules();
    capturedEffect = null;
    capturedCleanup = null;

    originalFetch = (globalThis as { fetch?: typeof fetch }).fetch;
    originalXHR = (globalThis as { XMLHttpRequest?: typeof XMLHttpRequest }).XMLHttpRequest;

    (globalThis as unknown as { fetch: () => Promise<{ ok: boolean }> }).fetch = jest.fn(
      async () => ({ ok: true }),
    );
    (globalThis as unknown as { XMLHttpRequest: typeof FakeXHR }).XMLHttpRequest =
      FakeXHR as unknown as typeof FakeXHR;
  });

  afterEach(() => {
    if (capturedCleanup) capturedCleanup();
    if (originalFetch) {
      (globalThis as { fetch?: typeof fetch }).fetch = originalFetch;
    } else {
      delete (globalThis as { fetch?: typeof fetch }).fetch;
    }
    if (originalXHR) {
      (globalThis as { XMLHttpRequest?: typeof XMLHttpRequest }).XMLHttpRequest = originalXHR;
    } else {
      delete (globalThis as { XMLHttpRequest?: typeof XMLHttpRequest }).XMLHttpRequest;
    }
    jest.useRealTimers();
  });

  function mountMonitor(): void {
    jest.useFakeTimers();
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
    const monitor = require('../src/hooks/useNetworkMonitor') as {
      useNetworkMonitor: () => void;
    };
    monitor.useNetworkMonitor();
    expect(capturedEffect).not.toBeNull();
    const cleanup = capturedEffect!();
    if (typeof cleanup === 'function') capturedCleanup = cleanup;
  }

  it('replaces global.fetch with a wrapper after mount', () => {
    const before = globalThis.fetch;
    mountMonitor();
    expect(globalThis.fetch).not.toBe(before);
  });

  it('replaces XMLHttpRequest.prototype.send after mount', () => {
    const before = FakeXHR.prototype.send;
    mountMonitor();
    expect(FakeXHR.prototype.send).not.toBe(before);
  });

  it('restores original fetch after cleanup', () => {
    const before = globalThis.fetch;
    mountMonitor();
    capturedCleanup!();
    capturedCleanup = null;
    expect(globalThis.fetch).toBe(before);
  });

  it('counts an in-flight fetch and decrements after it resolves', async () => {
    mountMonitor();
    const promise = (globalThis.fetch as () => Promise<unknown>)();
    // Drive the timer that pushes the metric
    jest.advanceTimersByTime(500);
    await promise;
    jest.advanceTimersByTime(500);
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
    const storeMock = require('../src/store/useSightlineStore') as { __updateMetric: jest.Mock };
    const calls = storeMock.__updateMetric.mock.calls.map((c) => c[1] as number);
    // Some sample after the fetch resolved should be back at 0
    expect(calls[calls.length - 1]).toBe(0);
  });

  it('counts XHR send and decrements on loadend', () => {
    mountMonitor();
    const xhr = new FakeXHR();
    (FakeXHR.prototype.send as () => void).call(xhr);
    jest.advanceTimersByTime(500);
    xhr.fireLoadend();
    jest.advanceTimersByTime(500);
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
    const storeMock = require('../src/store/useSightlineStore') as { __updateMetric: jest.Mock };
    const calls = storeMock.__updateMetric.mock.calls.map((c) => c[1] as number);
    expect(calls).toContain(1);
    expect(calls[calls.length - 1]).toBe(0);
  });
});
