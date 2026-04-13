export interface ThresholdConfig {
  fps: { warn: number; danger: number };
  memory: { warn: number; danger: number };
  rerenders: { warn: number; danger: number };
  network: { warn: number; danger: number };
}

export const DEFAULT_THRESHOLDS: ThresholdConfig = {
  fps: { warn: 55, danger: 40 },
  memory: { warn: 100, danger: 200 },
  rerenders: { warn: 5, danger: 15 },
  network: { warn: 3, danger: 6 },
};

export type BadgeStatus = 'good' | 'warn' | 'bad';

export function getStatus(
  value: number,
  thresholds: { warn: number; danger: number },
  invert: boolean = true,
): BadgeStatus {
  if (invert) {
    if (value >= thresholds.danger) return 'bad';
    if (value >= thresholds.warn) return 'warn';
    return 'good';
  } else {
    if (value <= thresholds.danger) return 'bad';
    if (value <= thresholds.warn) return 'warn';
    return 'good';
  }
}

export interface TraceData {
  capturedAt: string;
  durationMs: number;
  packageVersion: string;
  deviceInfo: {
    platform: 'ios' | 'android';
    systemVersion: string;
    isHermes: boolean;
    newArchEnabled: boolean;
  };
  samples: Array<{
    timestamp: number;
    jsFps: number;
    uiFps: number;
    memoryMb: number;
    rerendersPerSec: number;
    networkInFlight: number;
  }>;
  summary: {
    avgJsFps: number;
    minJsFps: number;
    avgMemoryMb: number;
    maxMemoryMb: number;
    peakMemoryMb: number;
    totalRerenders: number;
    avgNetworkInFlight: number;
  };
}
