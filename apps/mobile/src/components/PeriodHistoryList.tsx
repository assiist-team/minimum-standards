import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, useColorScheme } from 'react-native';
import type { PeriodHistoryEntry } from '../utils/standardHistory';

const STATUS_COLORS_LIGHT: Record<string, { background: string; text: string; bar: string }> = {
  Met: { background: '#E6F4EA', text: '#1E8E3E', bar: '#1E8E3E' },
  'In Progress': { background: '#FFF8E1', text: '#B06E00', bar: '#F4B400' },
  Missed: { background: '#FCE8E6', text: '#C5221F', bar: '#C5221F' },
};

const STATUS_COLORS_DARK: Record<string, { background: string; text: string; bar: string }> = {
  Met: { background: '#1E3A2E', text: '#4CAF50', bar: '#4CAF50' },
  'In Progress': { background: '#3E2E1A', text: '#FFC107', bar: '#FFC107' },
  Missed: { background: '#3E1E1E', text: '#EF5350', bar: '#EF5350' },
};

function getStatusColors(isDark: boolean) {
  return isDark ? STATUS_COLORS_DARK : STATUS_COLORS_LIGHT;
}

export interface PeriodHistoryListProps {
  history: PeriodHistoryEntry[];
  onPeriodPress: (entry: PeriodHistoryEntry) => void;
}

function PeriodRow({
  item,
  isDark,
  onPress,
}: {
  item: PeriodHistoryEntry;
  isDark: boolean;
  onPress: (entry: PeriodHistoryEntry) => void;
}) {
  const colors = getStatusColors(isDark)[item.status] ?? getStatusColors(isDark)['In Progress'];
  const totalFormatted = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 1,
  }).format(item.total);

  return (
    <TouchableOpacity
      style={[styles.periodRow, isDark && styles.periodRowDark]}
      onPress={() => onPress(item)}
      accessibilityRole="button"
      accessibilityLabel={`View logs for ${item.periodLabel}`}
    >
      <View style={styles.periodRowHeader}>
        <Text style={[styles.periodLabel, isDark && styles.periodLabelDark]}>
          {item.periodLabel}
        </Text>
        <View
          style={[styles.statusPill, { backgroundColor: colors.background }]}
          accessibilityRole="text"
        >
          <Text style={[styles.statusText, { color: colors.text }]}>{item.status}</Text>
        </View>
      </View>
      <Text style={[styles.summaryText, isDark && styles.summaryTextDark]}>
        {totalFormatted} / {item.targetSummary}
      </Text>
      <View style={[styles.progressBar, isDark && styles.progressBarDark]}>
        <View
          style={[
            styles.progressFill,
            { width: `${item.progressPercent}%`, backgroundColor: colors.bar },
          ]}
          accessibilityRole="progressbar"
          accessibilityValue={{ now: item.progressPercent, min: 0, max: 100 }}
        />
      </View>
    </TouchableOpacity>
  );
}

const Separator = () => <View style={styles.separator} />;

export function PeriodHistoryList({ history, onPeriodPress }: PeriodHistoryListProps) {
  const isDark = useColorScheme() === 'dark';

  const renderItem = ({ item }: { item: PeriodHistoryEntry }) => (
    <PeriodRow item={item} isDark={isDark} onPress={onPeriodPress} />
  );

  return (
    <FlatList
      data={history}
      renderItem={renderItem}
      keyExtractor={(item) => `${item.periodStartMs}-${item.periodEndMs}`}
      scrollEnabled={false}
      ItemSeparatorComponent={Separator}
    />
  );
}

const styles = StyleSheet.create({
  periodRow: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  periodRowDark: {
    backgroundColor: '#1E1E1E',
  },
  periodRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  periodLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#5f6368',
  },
  periodLabelDark: {
    color: '#B0B0B0',
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontWeight: '600',
    fontSize: 12,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0E1116',
  },
  summaryTextDark: {
    color: '#E0E0E0',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#edeff2',
    borderRadius: 2,
  },
  progressBarDark: {
    backgroundColor: '#333',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  separator: {
    height: 12,
  },
});
