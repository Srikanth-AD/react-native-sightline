import React, { memo, useRef } from 'react';
import { View, Text, StyleSheet, PanResponder, Animated, Platform } from 'react-native';
import { useSightlineStore } from '../store/useSightlineStore';
import type { BadgeStatus } from '../utils/thresholds';

interface PillProps {}

const DOT_COLORS: Record<BadgeStatus, string> = {
  good: '#34c759',
  warn: '#ffcc00',
  bad: '#ff3b30',
};

const MONOSPACE = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

function worstStatus(statuses: BadgeStatus[]): BadgeStatus {
  if (statuses.includes('bad')) return 'bad';
  if (statuses.includes('warn')) return 'warn';
  return 'good';
}

export const Pill = memo(function Pill(_props: PillProps) {
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const isDragging = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        isDragging.current = false;
        pan.setOffset({
          x: (pan.x as unknown as { _value: number })._value,
          y: (pan.y as unknown as { _value: number })._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, gesture) => {
        if (Math.abs(gesture.dx) > 3 || Math.abs(gesture.dy) > 3) {
          isDragging.current = true;
        }
        Animated.event([null, { dx: pan.x, dy: pan.y }], {
          useNativeDriver: false,
        })(_, gesture);
      },
      onPanResponderRelease: () => {
        pan.flattenOffset();
        if (!isDragging.current) {
          useSightlineStore.getState().toggleExpanded();
        }
      },
    }),
  ).current;

  const metrics = useSightlineStore((s) => s.metrics);
  const jsFpsStatus = metrics.jsFps.status;
  const memoryStatus = metrics.memoryMb.status;
  const overallStatus = worstStatus([
    jsFpsStatus,
    metrics.uiFps.status,
    memoryStatus,
    metrics.rerendersPerSec.status,
  ]);

  return (
    <Animated.View
      style={[styles.pill, { transform: pan.getTranslateTransform() }]}
      {...panResponder.panHandlers}
    >
      <View style={[styles.dot, { backgroundColor: DOT_COLORS[overallStatus] }]} />
      <View style={[styles.dot, { backgroundColor: DOT_COLORS[jsFpsStatus] }]} />
      <Text style={styles.text}>{Math.round(metrics.jsFps.current)}fps</Text>
      <Text style={styles.text}>{metrics.memoryMb.current.toFixed(0)}mb</Text>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16,16,16,0.88)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    paddingHorizontal: 6,
    paddingVertical: 5,
    gap: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  text: {
    fontSize: 11,
    fontFamily: MONOSPACE,
    color: 'white',
  },
});
