import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { useSightlineStore } from '../store/useSightlineStore';
import { MetricRow } from './MetricRow';
import { getStatus } from '../utils/thresholds';
import { formatFps, formatMemory, formatRerenders, formatNetwork } from '../utils/formatters';
import { buildTraceData, printTrace } from '../utils/traceHelpers';
import type { TraceData } from '../utils/thresholds';

interface PanelProps {
  onExport?: (trace: TraceData) => void;
}

const TREND_ARROWS = { stable: '\u2192', rising: '\u2191', falling: '\u2193' } as const;
const MONOSPACE = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

export const Panel = memo(function Panel({ onExport }: PanelProps) {
  const metrics = useSightlineStore((s) => s.metrics);
  const thresholds = useSightlineStore((s) => s.thresholds);
  const isRecording = useSightlineStore((s) => s.isRecording);
  const recordingSecondsLeft = useSightlineStore((s) => s.recordingSecondsLeft);
  const toggleExpanded = useSightlineStore((s) => s.toggleExpanded);
  const startRecording = useSightlineStore((s) => s.startRecording);

  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleRecord = useCallback(() => {
    if (isRecording) return;
    startRecording();
  }, [isRecording, startRecording]);

  useEffect(() => {
    if (!isRecording) return;

    const store = useSightlineStore.getState;
    const { addRecordingSample, tickRecording, stopRecording } = store();

    recordingIntervalRef.current = setInterval(() => {
      const state = store();
      addRecordingSample();

      if (state.recordingSecondsLeft <= 1) {
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
        }
        const samples = stopRecording();
        handleExportComplete(samples);
      } else {
        tickRecording();
      }
    }, 500);

    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording]);

  const handleExportComplete = useCallback(
    (samples: TraceData['samples']) => {
      const trace = buildTraceData(samples);

      if (onExport) {
        onExport(trace);
      } else {
        printTrace(trace);
      }

      setExportStatus('\u2713 exported');
      setTimeout(() => setExportStatus(null), 2000);
    },
    [onExport],
  );

  const handleExport = useCallback(() => {
    const state = useSightlineStore.getState();
    const m = state.metrics;
    const sample: TraceData['samples'][0] = {
      timestamp: Date.now(),
      jsFps: m.jsFps.current,
      uiFps: m.uiFps.current,
      memoryMb: m.memoryMb.current,
      rerendersPerSec: m.rerendersPerSec.current,
      networkInFlight: typeof m.networkInFlight === 'number' ? m.networkInFlight : 0,
    };
    handleExportComplete([sample]);
  }, [handleExportComplete]);

  const fpsBarStatus = useCallback(
    (v: number) => getStatus(v, thresholds.fps, false),
    [thresholds.fps],
  );
  const memBarStatus = useCallback(
    (v: number) => getStatus(v, thresholds.memory, true),
    [thresholds.memory],
  );
  const rerenderBarStatus = useCallback(
    (v: number) => getStatus(v, thresholds.rerenders, true),
    [thresholds.rerenders],
  );

  const memTrend = metrics.memoryMb.trend;
  const memBadgeLabel = memTrend === 'rising' ? 'rising' : undefined;

  const networkValue = typeof metrics.networkInFlight === 'number' ? metrics.networkInFlight : 0;
  const networkStatus = getStatus(networkValue, thresholds.network, true);

  const recButtonText = isRecording
    ? `\u25CF ${recordingSecondsLeft}s`
    : (exportStatus ?? '\u25CF rec');

  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <Text style={styles.title}>SIGHTLINE</Text>
        <TouchableOpacity onPress={toggleExpanded} hitSlop={12}>
          <Text style={styles.close}>{'\u00D7'}</Text>
        </TouchableOpacity>
      </View>

      <MetricRow
        label="JS FPS"
        value={formatFps(metrics.jsFps.current)}
        status={metrics.jsFps.status}
        history={metrics.jsFps.history}
        getBarStatus={fpsBarStatus}
      />
      <MetricRow
        label="UI FPS"
        value={formatFps(metrics.uiFps.current)}
        status={metrics.uiFps.status}
        history={metrics.uiFps.history}
        getBarStatus={fpsBarStatus}
      />
      <MetricRow
        label="Memory"
        value={`${formatMemory(metrics.memoryMb.current)} ${TREND_ARROWS[memTrend]}`}
        status={metrics.memoryMb.status}
        history={metrics.memoryMb.history}
        badgeLabel={memBadgeLabel}
        getBarStatus={memBarStatus}
      />
      <MetricRow
        label="Rerenders"
        value={formatRerenders(metrics.rerendersPerSec.current)}
        status={metrics.rerendersPerSec.status}
        history={metrics.rerendersPerSec.history}
        getBarStatus={rerenderBarStatus}
      />
      <MetricRow
        label="Network"
        value={formatNetwork(networkValue)}
        status={networkStatus}
        history={[]}
        showSparkline={false}
        isLast
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.footerButton, isRecording && styles.footerButtonActive]}
          onPress={handleRecord}
          disabled={isRecording}
        >
          <Text style={[styles.footerButtonText, isRecording && styles.recActive]}>
            {recButtonText}
          </Text>
        </TouchableOpacity>
        <View style={styles.footerDivider} />
        <TouchableOpacity style={styles.footerButton} onPress={handleExport}>
          <Text style={styles.footerButtonText}>export</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

const W = Dimensions.get('window').width;
const styles = StyleSheet.create({
  panel: {
    backgroundColor: 'rgba(16,16,16,0.92)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 16,
    padding: 12,
    width: W - 32,
    maxHeight: 320,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: { fontSize: 11, letterSpacing: 0.5, color: 'rgba(255,255,255,0.4)', fontWeight: '600' },
  close: { fontSize: 18, color: 'rgba(255,255,255,0.5)', lineHeight: 20 },
  footer: {
    flexDirection: 'row',
    marginTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.07)',
    paddingTop: 8,
  },
  footerButton: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  footerButtonActive: { opacity: 0.7 },
  footerButtonText: { fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: MONOSPACE },
  recActive: { color: '#ff3b30' },
  footerDivider: { width: 0.5, backgroundColor: 'rgba(255,255,255,0.07)' },
});
