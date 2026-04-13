import { create } from 'zustand';
import {
  type ThresholdConfig,
  type BadgeStatus,
  DEFAULT_THRESHOLDS,
  getStatus,
} from '../utils/thresholds';

export interface MetricHistory {
  current: number;
  history: number[];
  status: BadgeStatus;
}

export interface MemoryMetricHistory extends MetricHistory {
  trend: 'stable' | 'rising' | 'falling';
}

interface RecordingSample {
  timestamp: number;
  jsFps: number;
  uiFps: number;
  memoryMb: number;
  rerendersPerSec: number;
  networkInFlight: number;
}

export interface SightlineState {
  isExpanded: boolean;
  isRecording: boolean;
  recordingSecondsLeft: number;
  recordingSamples: RecordingSample[];
  thresholds: ThresholdConfig;
  metrics: {
    jsFps: MetricHistory;
    uiFps: MetricHistory;
    memoryMb: MemoryMetricHistory;
    rerendersPerSec: MetricHistory;
    networkInFlight: number;
    nativeCallsPerSec: MetricHistory;
  };
  toggleExpanded: () => void;
  startRecording: () => void;
  tickRecording: () => void;
  stopRecording: () => RecordingSample[];
  updateMetric: (key: keyof SightlineState['metrics'], value: number) => void;
  setThresholds: (t: Partial<ThresholdConfig>) => void;
  addRecordingSample: () => void;
}

const emptyMetric: MetricHistory = {
  current: 0,
  history: [],
  status: 'good',
};

const MAX_HISTORY = 60;

function pushHistory(history: number[], value: number): number[] {
  const next = [...history, value];
  if (next.length > MAX_HISTORY) next.shift();
  return next;
}

function computeMemoryTrend(history: number[]): 'stable' | 'rising' | 'falling' {
  if (history.length < 10) return 'stable';
  const recent = history.slice(-10);
  const diff = recent[recent.length - 1] - recent[0];
  if (diff > 5) return 'rising';
  if (diff < -5) return 'falling';
  return 'stable';
}

export const useSightlineStore = create<SightlineState>((set, get) => ({
  isExpanded: false,
  isRecording: false,
  recordingSecondsLeft: 0,
  recordingSamples: [],
  thresholds: DEFAULT_THRESHOLDS,
  metrics: {
    jsFps: { ...emptyMetric },
    uiFps: { ...emptyMetric },
    memoryMb: { ...emptyMetric, trend: 'stable' },
    rerendersPerSec: { ...emptyMetric },
    networkInFlight: 0,
    nativeCallsPerSec: { ...emptyMetric },
  },

  toggleExpanded: () => set((s) => ({ isExpanded: !s.isExpanded })),

  startRecording: () => set({ isRecording: true, recordingSecondsLeft: 10, recordingSamples: [] }),

  tickRecording: () => set((s) => ({ recordingSecondsLeft: s.recordingSecondsLeft - 1 })),

  stopRecording: () => {
    const samples = get().recordingSamples;
    set({ isRecording: false, recordingSecondsLeft: 0, recordingSamples: [] });
    return samples;
  },

  addRecordingSample: () =>
    set((s) => {
      const m = s.metrics;
      return {
        recordingSamples: [
          ...s.recordingSamples,
          {
            timestamp: Date.now(),
            jsFps: m.jsFps.current,
            uiFps: m.uiFps.current,
            memoryMb: m.memoryMb.current,
            rerendersPerSec: m.rerendersPerSec.current,
            networkInFlight: typeof m.networkInFlight === 'number' ? m.networkInFlight : 0,
          },
        ],
      };
    }),

  updateMetric: (key, value) =>
    set((s) => {
      if (key === 'networkInFlight') {
        return {
          metrics: { ...s.metrics, networkInFlight: value },
        };
      }

      const prev = s.metrics[key] as MetricHistory;
      const history = pushHistory(prev.history, value);

      let status: BadgeStatus;
      if (key === 'jsFps' || key === 'uiFps') {
        status = getStatus(value, s.thresholds.fps, false);
      } else if (key === 'memoryMb') {
        status = getStatus(value, s.thresholds.memory, true);
      } else if (key === 'rerendersPerSec') {
        status = getStatus(value, s.thresholds.rerenders, true);
      } else {
        status = 'good';
      }

      const metric: MetricHistory = { current: value, history, status };

      if (key === 'memoryMb') {
        (metric as MemoryMetricHistory).trend = computeMemoryTrend(history);
      }

      return {
        metrics: { ...s.metrics, [key]: metric },
      };
    }),

  setThresholds: (t) =>
    set((s) => ({
      thresholds: { ...s.thresholds, ...t },
    })),
}));
