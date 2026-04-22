import { useSightlineStore } from '../src/store/useSightlineStore';

// Reset store between tests
beforeEach(() => {
  useSightlineStore.setState({
    isExpanded: false,
    isRecording: false,
    recordingSecondsLeft: 0,
    recordingSamples: [],
    metrics: {
      jsFps: { current: 0, history: [], status: 'good' },
      uiFps: { current: 0, history: [], status: 'good' },
      memoryMb: { current: 0, history: [], status: 'good', trend: 'stable' },
      rerendersPerSec: { current: 0, history: [], status: 'good' },
      networkInFlight: 0,
      nativeCallsPerSec: { current: 0, history: [], status: 'good' },
    },
  });
});

describe('toggleExpanded', () => {
  it('toggles isExpanded from false to true', () => {
    expect(useSightlineStore.getState().isExpanded).toBe(false);
    useSightlineStore.getState().toggleExpanded();
    expect(useSightlineStore.getState().isExpanded).toBe(true);
  });

  it('toggles back to false', () => {
    useSightlineStore.getState().toggleExpanded();
    useSightlineStore.getState().toggleExpanded();
    expect(useSightlineStore.getState().isExpanded).toBe(false);
  });
});

describe('updateMetric', () => {
  it('updates jsFps current value and history', () => {
    useSightlineStore.getState().updateMetric('jsFps', 58);
    const { jsFps } = useSightlineStore.getState().metrics;
    expect(jsFps.current).toBe(58);
    expect(jsFps.history).toEqual([58]);
    expect(jsFps.status).toBe('good');
  });

  it('sets warn status for low FPS', () => {
    useSightlineStore.getState().updateMetric('jsFps', 50);
    expect(useSightlineStore.getState().metrics.jsFps.status).toBe('warn');
  });

  it('sets bad status for very low FPS', () => {
    useSightlineStore.getState().updateMetric('jsFps', 30);
    expect(useSightlineStore.getState().metrics.jsFps.status).toBe('bad');
  });

  it('accumulates history up to 60 entries', () => {
    for (let i = 0; i < 65; i++) {
      useSightlineStore.getState().updateMetric('jsFps', i);
    }
    const { history } = useSightlineStore.getState().metrics.jsFps;
    expect(history).toHaveLength(60);
    expect(history[0]).toBe(5); // oldest after overflow
    expect(history[59]).toBe(64); // most recent
  });

  it('updates networkInFlight as a plain number', () => {
    useSightlineStore.getState().updateMetric('networkInFlight', 4);
    expect(useSightlineStore.getState().metrics.networkInFlight).toBe(4);
  });

  it('sets memory status based on inverted thresholds', () => {
    useSightlineStore.getState().updateMetric('memoryMb', 50);
    expect(useSightlineStore.getState().metrics.memoryMb.status).toBe('good');

    useSightlineStore.getState().updateMetric('memoryMb', 150);
    expect(useSightlineStore.getState().metrics.memoryMb.status).toBe('warn');

    useSightlineStore.getState().updateMetric('memoryMb', 250);
    expect(useSightlineStore.getState().metrics.memoryMb.status).toBe('bad');
  });

  it('computes memory trend as rising when values increase', () => {
    // Push 10+ values with a rising pattern
    for (let i = 0; i < 12; i++) {
      useSightlineStore.getState().updateMetric('memoryMb', 80 + i * 2);
    }
    expect(useSightlineStore.getState().metrics.memoryMb.trend).toBe('rising');
  });

  it('computes memory trend as stable for flat values', () => {
    for (let i = 0; i < 12; i++) {
      useSightlineStore.getState().updateMetric('memoryMb', 100);
    }
    expect(useSightlineStore.getState().metrics.memoryMb.trend).toBe('stable');
  });
});

describe('recording', () => {
  it('starts recording with 10 seconds', () => {
    useSightlineStore.getState().startRecording();
    const state = useSightlineStore.getState();
    expect(state.isRecording).toBe(true);
    expect(state.recordingSecondsLeft).toBe(10);
    expect(state.recordingSamples).toEqual([]);
  });

  it('ticks countdown down', () => {
    useSightlineStore.getState().startRecording();
    useSightlineStore.getState().tickRecording();
    expect(useSightlineStore.getState().recordingSecondsLeft).toBe(9);
    useSightlineStore.getState().tickRecording();
    expect(useSightlineStore.getState().recordingSecondsLeft).toBe(8);
  });

  it('adds recording samples from current metrics', () => {
    useSightlineStore.getState().updateMetric('jsFps', 55);
    useSightlineStore.getState().updateMetric('memoryMb', 120);
    useSightlineStore.getState().startRecording();
    useSightlineStore.getState().addRecordingSample();

    const samples = useSightlineStore.getState().recordingSamples;
    expect(samples).toHaveLength(1);
    expect(samples[0].jsFps).toBe(55);
    expect(samples[0].memoryMb).toBe(120);
    expect(samples[0].timestamp).toBeGreaterThan(0);
  });

  it('stops recording and returns samples', () => {
    useSightlineStore.getState().startRecording();
    useSightlineStore.getState().addRecordingSample();
    useSightlineStore.getState().addRecordingSample();

    const samples = useSightlineStore.getState().stopRecording();
    expect(samples).toHaveLength(2);

    const state = useSightlineStore.getState();
    expect(state.isRecording).toBe(false);
    expect(state.recordingSecondsLeft).toBe(0);
    expect(state.recordingSamples).toEqual([]);
  });
});

describe('setThresholds', () => {
  it('partially updates thresholds', () => {
    useSightlineStore.getState().setThresholds({
      fps: { warn: 50, danger: 30 },
    });
    const { thresholds } = useSightlineStore.getState();
    expect(thresholds.fps).toEqual({ warn: 50, danger: 30 });
    // Others unchanged
    expect(thresholds.memory).toEqual({ warn: 100, danger: 200 });
  });

  it('updated thresholds affect metric status', () => {
    useSightlineStore.getState().setThresholds({
      fps: { warn: 58, danger: 50 },
    });
    useSightlineStore.getState().updateMetric('jsFps', 55);
    expect(useSightlineStore.getState().metrics.jsFps.status).toBe('warn');
  });
});
