import React, { memo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Sparkline } from './Sparkline';
import { StatusBadge } from './StatusBadge';
import type { BadgeStatus } from '../utils/thresholds';

interface MetricRowProps {
  label: string;
  value: string;
  status: BadgeStatus;
  history: number[];
  badgeLabel?: string;
  isLast?: boolean;
  showSparkline?: boolean;
  getBarStatus?: (value: number) => BadgeStatus;
}

const VALUE_COLORS: Record<BadgeStatus, string> = {
  good: '#34c759',
  warn: '#ffcc00',
  bad: '#ff3b30',
};

const MONOSPACE = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

export const MetricRow = memo(function MetricRow({
  label,
  value,
  status,
  history,
  badgeLabel,
  isLast = false,
  showSparkline = true,
  getBarStatus,
}: MetricRowProps) {
  return (
    <View style={[styles.row, !isLast && styles.separator]}>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      {showSparkline && history.length > 0 ? (
        <Sparkline data={history} getBarStatus={getBarStatus} />
      ) : (
        <View style={styles.spacer} />
      )}
      <Text style={[styles.value, { color: VALUE_COLORS[status] }]}>{value}</Text>
      <StatusBadge status={status} label={badgeLabel} />
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
  },
  separator: {
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  label: {
    width: 80,
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  spacer: {
    flex: 1,
    marginHorizontal: 8,
  },
  value: {
    fontSize: 13,
    fontFamily: MONOSPACE,
  },
});
