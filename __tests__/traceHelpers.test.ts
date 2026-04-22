jest.mock('react-native', () => ({
  Platform: { OS: 'ios', Version: '17.0' },
}));

import { buildTraceData, printTrace } from '../src/utils/traceHelpers';
import type { TraceData } from '../src/utils/thresholds';

const makeSample = (overrides: Partial<TraceData['samples'][0]> = {}): TraceData['samples'][0] => ({
  timestamp: Date.now(),
  jsFps: 60,
  uiFps: 60,
  memoryMb: 100,
  rerendersPerSec: 5,
  networkInFlight: 1,
  ...overrides,
});

describe('buildTraceData', () => {
  it('computes correct duration from sample count', () => {
    const samples = [makeSample(), makeSample(), makeSample()];
    const trace = buildTraceData(samples);
    expect(trace.durationMs).toBe(1500); // 3 samples * 500ms
  });

  it('computes summary averages', () => {
    const samples = [
      makeSample({ jsFps: 60, memoryMb: 80, networkInFlight: 1 }),
      makeSample({ jsFps: 40, memoryMb: 120, networkInFlight: 3 }),
    ];
    const trace = buildTraceData(samples);
    expect(trace.summary.avgJsFps).toBe(50);
    expect(trace.summary.avgMemoryMb).toBe(100);
    expect(trace.summary.avgNetworkInFlight).toBe(2);
  });

  it('computes min JS FPS', () => {
    const samples = [
      makeSample({ jsFps: 58 }),
      makeSample({ jsFps: 32 }),
      makeSample({ jsFps: 55 }),
    ];
    const trace = buildTraceData(samples);
    expect(trace.summary.minJsFps).toBe(32);
  });

  it('computes peak memory', () => {
    const samples = [
      makeSample({ memoryMb: 80 }),
      makeSample({ memoryMb: 150 }),
      makeSample({ memoryMb: 90 }),
    ];
    const trace = buildTraceData(samples);
    expect(trace.summary.peakMemoryMb).toBe(150);
    expect(trace.summary.maxMemoryMb).toBe(150);
  });

  it('sums total rerenders', () => {
    const samples = [
      makeSample({ rerendersPerSec: 10 }),
      makeSample({ rerendersPerSec: 20 }),
      makeSample({ rerendersPerSec: 5 }),
    ];
    const trace = buildTraceData(samples);
    expect(trace.summary.totalRerenders).toBe(35);
  });

  it('handles empty samples array', () => {
    const trace = buildTraceData([]);
    expect(trace.durationMs).toBe(0);
    expect(trace.summary.avgJsFps).toBe(0);
    expect(trace.summary.minJsFps).toBe(0);
    expect(trace.summary.peakMemoryMb).toBe(0);
    expect(trace.summary.totalRerenders).toBe(0);
  });

  it('includes device info', () => {
    const trace = buildTraceData([makeSample()]);
    expect(trace.deviceInfo.platform).toBe('ios');
    expect(trace.packageVersion).toBe('0.1.0');
  });

  it('preserves all original samples', () => {
    const samples = [makeSample(), makeSample(), makeSample()];
    const trace = buildTraceData(samples);
    expect(trace.samples).toHaveLength(3);
    expect(trace.samples).toBe(samples);
  });
});

describe('printTrace', () => {
  it('logs summary and full trace to console', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation();
    const trace = buildTraceData([
      makeSample({ jsFps: 58, memoryMb: 89 }),
      makeSample({ jsFps: 55, memoryMb: 94 }),
    ]);

    printTrace(trace);

    expect(spy).toHaveBeenCalledTimes(2);
    const summaryCall = spy.mock.calls[0][0] as string;
    expect(summaryCall).toContain('trace complete');
    expect(summaryCall).toContain('JS FPS');
    expect(summaryCall).toContain('Memory');

    spy.mockRestore();
  });
});
