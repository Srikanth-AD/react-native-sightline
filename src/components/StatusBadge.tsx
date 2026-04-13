import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { BadgeStatus } from '../utils/thresholds';

interface StatusBadgeProps {
  status: BadgeStatus;
  label?: string;
}

const BADGE_COLORS = {
  good: { bg: 'rgba(52,199,89,0.15)', text: '#34c759' },
  warn: { bg: 'rgba(255,204,0,0.15)', text: '#ffcc00' },
  bad: { bg: 'rgba(255,59,48,0.15)', text: '#ff3b30' },
} as const;

const DEFAULT_LABELS: Record<BadgeStatus, string> = {
  good: 'good',
  warn: 'warn',
  bad: 'bad',
};

export const StatusBadge = memo(function StatusBadge({ status, label }: StatusBadgeProps) {
  const colors = BADGE_COLORS[status];
  const displayLabel = label ?? DEFAULT_LABELS[status];

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.text }]}>{displayLabel}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
    marginLeft: 6,
  },
  text: {
    fontSize: 9,
    fontWeight: '500',
  },
});
