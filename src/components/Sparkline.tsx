import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import type { BadgeStatus } from '../utils/thresholds';

interface SparklineProps {
  data: number[];
  maxBars?: number;
  height?: number;
  getBarStatus?: (value: number) => BadgeStatus;
}

const BAR_WIDTH = 3;
const BAR_GAP = 1;

const STATUS_COLORS: Record<BadgeStatus, string> = {
  good: '#34c759',
  warn: '#ffcc00',
  bad: '#ff3b30',
};

export const Sparkline = memo(function Sparkline({
  data,
  maxBars = 30,
  height = 20,
  getBarStatus,
}: SparklineProps) {
  const displayData = data.slice(-maxBars);
  const maxValue = Math.max(...displayData, 1);

  return (
    <View style={[styles.container, { height }]}>
      {displayData.map((value, index) => {
        const barHeight = Math.max(1, (value / maxValue) * height);
        const status = getBarStatus ? getBarStatus(value) : 'good';
        const color = STATUS_COLORS[status];

        return (
          <View
            key={index}
            style={[
              styles.bar,
              {
                height: barHeight,
                backgroundColor: color,
                marginLeft: index > 0 ? BAR_GAP : 0,
              },
            ]}
          />
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flex: 1,
    marginHorizontal: 8,
  },
  bar: {
    width: BAR_WIDTH,
    borderRadius: 1,
  },
});
