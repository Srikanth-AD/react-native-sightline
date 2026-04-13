import { useEffect, useRef } from 'react';
import { useSightlineStore } from '../store/useSightlineStore';

declare const global: {
  fetch: typeof fetch;
  XMLHttpRequest: typeof XMLHttpRequest;
};

let inFlightCount = 0;
let patchApplied = false;
let originalFetch: typeof fetch | null = null;
let originalXHRSend: ((body?: Document | XMLHttpRequestBodyInit | null) => void) | null = null;
let patchRefCount = 0;

function applyPatch(): void {
  patchRefCount++;
  if (patchApplied) return;
  patchApplied = true;
  inFlightCount = 0;

  // Patch fetch — chain through whatever fetch currently is
  originalFetch = global.fetch;
  global.fetch = async function patchedFetch(...args: Parameters<typeof fetch>): Promise<Response> {
    inFlightCount++;
    try {
      const result = await originalFetch!(...args);
      return result;
    } finally {
      inFlightCount--;
    }
  } as typeof fetch;

  // Patch XMLHttpRequest.prototype.send
  if (typeof global.XMLHttpRequest !== 'undefined') {
    originalXHRSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function patchedSend(
      ...args: Parameters<XMLHttpRequest['send']>
    ): void {
      inFlightCount++;
      this.addEventListener('loadend', () => {
        inFlightCount--;
      });
      return originalXHRSend!.apply(this, args);
    };
  }
}

function removePatch(): void {
  patchRefCount--;
  if (patchRefCount > 0) return;
  if (!patchApplied) return;
  patchApplied = false;

  if (originalFetch) {
    global.fetch = originalFetch;
    originalFetch = null;
  }

  if (originalXHRSend && typeof global.XMLHttpRequest !== 'undefined') {
    XMLHttpRequest.prototype.send = originalXHRSend as typeof XMLHttpRequest.prototype.send;
    originalXHRSend = null;
  }

  inFlightCount = 0;
}

export function useNetworkMonitor(): void {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    applyPatch();

    const updateMetric = useSightlineStore.getState().updateMetric;

    intervalRef.current = setInterval(() => {
      updateMetric('networkInFlight', Math.max(0, inFlightCount));
    }, 500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      removePatch();
    };
  }, []);
}
