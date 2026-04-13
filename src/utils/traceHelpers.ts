import { Platform } from 'react-native';
import type { TraceData } from './thresholds';

function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10;
}

export function buildTraceData(samples: TraceData['samples']): TraceData {
  const jsFpsValues = samples.map((s) => s.jsFps);
  const memValues = samples.map((s) => s.memoryMb);
  const networkValues = samples.map((s) => s.networkInFlight);

  return {
    capturedAt: new Date().toISOString(),
    durationMs: samples.length * 500,
    packageVersion: '0.1.0',
    deviceInfo: {
      platform: Platform.OS as 'ios' | 'android',
      systemVersion: Platform.Version?.toString() ?? 'unknown',
      isHermes: typeof (global as Record<string, unknown>).HermesInternal !== 'undefined',
      newArchEnabled: false,
    },
    samples,
    summary: {
      avgJsFps: avg(jsFpsValues),
      minJsFps: jsFpsValues.length > 0 ? Math.min(...jsFpsValues) : 0,
      avgMemoryMb: avg(memValues),
      maxMemoryMb: memValues.length > 0 ? Math.max(...memValues) : 0,
      peakMemoryMb: memValues.length > 0 ? Math.max(...memValues) : 0,
      totalRerenders: samples.reduce((sum, s) => sum + s.rerendersPerSec, 0),
      avgNetworkInFlight: avg(networkValues),
    },
  };
}

export function printTrace(trace: TraceData): void {
  // eslint-disable-next-line no-console
  console.log(
    `[react-native-sightline] ${trace.durationMs / 1000}s trace complete\n` +
      `JS FPS:    avg ${trace.summary.avgJsFps}  min ${trace.summary.minJsFps}\n` +
      `Memory:    avg ${trace.summary.avgMemoryMb}mb  peak ${trace.summary.peakMemoryMb}mb\n` +
      `Rerenders: ${trace.summary.totalRerenders} total\n` +
      `Network:   avg ${trace.summary.avgNetworkInFlight} in-flight`,
  );
  // eslint-disable-next-line no-console
  console.log('[react-native-sightline] full trace:', JSON.stringify(trace, null, 2));
}
