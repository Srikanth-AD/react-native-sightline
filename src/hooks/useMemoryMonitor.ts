import { useEffect, useRef } from 'react';
import { useSightlineStore } from '../store/useSightlineStore';

declare const global: {
  performance?: {
    memory?: {
      usedJSHeapSize?: number;
    };
  };
  HermesInternal?: {
    getRuntimeProperties?: () => Record<string, unknown>;
  };
};

function getMemoryMb(): number | null {
  // Hermes exposes memory via performance.memory
  const heapSize = global.performance?.memory?.usedJSHeapSize;
  if (typeof heapSize === 'number') {
    return heapSize / (1024 * 1024);
  }

  // Fallback: try HermesInternal
  const props = global.HermesInternal?.getRuntimeProperties?.();
  if (props) {
    const heapUsed = props['Heap Allocated'] ?? props['Used'];
    if (typeof heapUsed === 'number') {
      return heapUsed / (1024 * 1024);
    }
  }

  return null;
}

export function useMemoryMonitor(): void {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const updateMetric = useSightlineStore.getState().updateMetric;

    intervalRef.current = setInterval(() => {
      const mb = getMemoryMb();
      if (mb !== null) {
        updateMetric('memoryMb', Math.round(mb * 10) / 10);
      }
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);
}
